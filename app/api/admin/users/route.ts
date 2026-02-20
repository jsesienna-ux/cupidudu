import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { assertAdminToken, getAdminTokenFromRequest } from "@/lib/admin-api";
import { calculateReviewAlgorithm } from "@/lib/review-algorithm";

/** 관계자 대시보드용: 사용자 목록, 카드, 통계 (RLS 우회) */
export async function GET(req: Request) {
  const authError = assertAdminToken(getAdminTokenFromRequest(req));
  if (authError) return authError;

  try {
    const admin = createAdminClient();

    const [
      { data: usersData, error: usersError },
      cardsQueryResult,
      { count: totalUsers },
      { count: totalCards },
      { count: maleUsers },
      { count: femaleUsers },
    ] = await Promise.all([
      admin
        .from("user_profiles")
        .select("user_id, full_name, gender, age, contact, email, username, created_at, approval_status, membership_grade, approved_at, profile_status, membership_level, job, school_name, residence, mbti, image_url")
        .order("created_at", { ascending: false })
        .limit(100),
      admin
        .from("delivered_cards")
        .select("id, user_id, card_id, status, created_at, viewed_at, is_read, meeting_at, meeting_completed_at")
        .order("created_at", { ascending: false })
        .limit(100),
      admin.from("user_profiles").select("*", { count: "exact", head: true }),
      admin.from("delivered_cards").select("*", { count: "exact", head: true }),
      admin.from("user_profiles").select("*", { count: "exact", head: true }).eq("gender", "male"),
      admin.from("user_profiles").select("*", { count: "exact", head: true }).eq("gender", "female"),
    ]);

    if (usersError) {
      return NextResponse.json({ message: usersError.message }, { status: 500 });
    }
    let cardsData = cardsQueryResult.data;
    let cardsError = cardsQueryResult.error;
    if (cardsError) {
      const msg = cardsError.message?.toLowerCase() ?? "";
      const missingMeetingColumns =
        msg.includes("meeting_at") || msg.includes("meeting_completed_at");
      if (missingMeetingColumns) {
        const fallback = await admin
          .from("delivered_cards")
          .select("id, user_id, card_id, status, created_at, viewed_at, is_read")
          .order("created_at", { ascending: false })
          .limit(100);
        cardsData = (fallback.data ?? []).map((row) => ({
          ...row,
          meeting_at: null,
          meeting_completed_at: null,
        }));
        cardsError = fallback.error;
      }
    }
    if (cardsError) {
      return NextResponse.json({ message: cardsError.message }, { status: 500 });
    }

    const users = (usersData ?? []) as Array<{
      user_id: string;
      job?: string | null;
      school_name?: string | null;
      residence?: string | null;
      mbti?: string | null;
      image_url?: string | null;
      [key: string]: unknown;
    }>;

    const userIds = users.map((u) => u.user_id).filter(Boolean);
    const [internalScoresResult, valuesAnswersResult] = await Promise.all([
      userIds.length
        ? admin
            .from("internal_scores")
            .select("user_id, manners_score, photo_real_score, manager_notes")
            .in("user_id", userIds)
        : Promise.resolve({ data: [], error: null }),
      userIds.length
        ? admin
            .from("values_answers")
            .select("user_id, answer")
            .in("user_id", userIds)
        : Promise.resolve({ data: [], error: null }),
    ]);

    if (internalScoresResult.error) {
      return NextResponse.json({ message: internalScoresResult.error.message }, { status: 500 });
    }
    if (valuesAnswersResult.error) {
      return NextResponse.json({ message: valuesAnswersResult.error.message }, { status: 500 });
    }

    const internalByUser = new Map<string, {
      manners_score?: number | null;
      photo_real_score?: number | null;
      manager_notes?: string | null;
    }>();
    for (const row of internalScoresResult.data ?? []) {
      internalByUser.set(
        (row as { user_id: string }).user_id,
        row as { manners_score?: number | null; photo_real_score?: number | null; manager_notes?: string | null }
      );
    }

    const answersByUser = new Map<string, Array<{ answer?: unknown }>>();
    for (const row of valuesAnswersResult.data ?? []) {
      const userId = (row as { user_id: string }).user_id;
      answersByUser.set(userId, [...(answersByUser.get(userId) ?? []), row as { answer?: unknown }]);
    }

    const usersWithAlgorithm = users.map((u) => ({
      ...u,
      algorithm: calculateReviewAlgorithm({
        job: (u.job as string | null) ?? null,
        school_name: (u.school_name as string | null) ?? null,
        residence: (u.residence as string | null) ?? null,
        mbti: (u.mbti as string | null) ?? null,
        image_url: (u.image_url as string | null) ?? null,
        internal_scores: internalByUser.get(u.user_id) ?? null,
        values_answers: answersByUser.get(u.user_id) ?? [],
      }),
    }));

    return NextResponse.json({
      users: usersWithAlgorithm,
      cards: cardsData ?? [],
      stats: {
        totalUsers: totalUsers ?? 0,
        totalCards: totalCards ?? 0,
        maleUsers: maleUsers ?? 0,
        femaleUsers: femaleUsers ?? 0,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "데이터 조회 실패" },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { assertAdminToken, getAdminTokenFromRequest } from "@/lib/admin-api";
import { calculateReviewAlgorithm } from "@/lib/review-algorithm";

type PendingProfile = {
  user_id: string;
  full_name: string | null;
};

export async function GET(req: Request) {
  const authError = assertAdminToken(getAdminTokenFromRequest(req));
  if (authError) return authError;

  try {
    const admin = createAdminClient();
    const { data: pendingRows, error: pendingError } = await admin
      .from("user_profiles")
      .select(
        "user_id, full_name, username, gender, age, residence, job, school_name, mbti, image_url, submitted_at, profile_status, approval_status, rejected_reason, membership_level, membership_grade"
      )
      .or("profile_status.eq.PENDING,approval_status.eq.PENDING")
      .order("submitted_at", { ascending: true });

    if (pendingError) {
      return NextResponse.json({ message: pendingError.message }, { status: 500 });
    }

    const pending = (pendingRows ?? []) as PendingProfile[];
    const userIds = pending.map((p) => p.user_id);
    if (userIds.length === 0) {
      return NextResponse.json({ items: [] });
    }

    const [{ data: answersRows }, { data: badgesRows }, { data: internalRows }] = await Promise.all([
      admin
        .from("values_answers")
        .select("user_id, question_id, answer, created_at")
        .in("user_id", userIds),
      admin
        .from("user_badges")
        .select("user_id, badge_code, granted_at, badges(label, is_public)")
        .in("user_id", userIds),
      admin
        .from("internal_scores")
        .select("user_id, manners_score, photo_real_score, manager_notes, last_reviewed_at")
        .in("user_id", userIds),
    ]);

    const answersByUser = new Map<string, unknown[]>();
    for (const row of answersRows ?? []) {
      const key = (row as { user_id: string }).user_id;
      answersByUser.set(key, [...(answersByUser.get(key) ?? []), row]);
    }

    const badgesByUser = new Map<string, unknown[]>();
    for (const row of badgesRows ?? []) {
      const key = (row as { user_id: string }).user_id;
      badgesByUser.set(key, [...(badgesByUser.get(key) ?? []), row]);
    }

    const internalByUser = new Map<string, unknown>();
    for (const row of internalRows ?? []) {
      internalByUser.set((row as { user_id: string }).user_id, row);
    }

    const items = pending.map((profile) => ({
      ...profile,
      values_answers_summary: {
        count: (answersByUser.get(profile.user_id) ?? []).length,
        latest: (answersByUser.get(profile.user_id) ?? []).slice(-3),
      },
      badges: badgesByUser.get(profile.user_id) ?? [],
      internal_scores: internalByUser.get(profile.user_id) ?? null,
      algorithm: calculateReviewAlgorithm({
        job: (profile as { job?: string | null }).job ?? null,
        school_name: (profile as { school_name?: string | null }).school_name ?? null,
        residence: (profile as { residence?: string | null }).residence ?? null,
        mbti: (profile as { mbti?: string | null }).mbti ?? null,
        image_url: (profile as { image_url?: string | null }).image_url ?? null,
        values_answers: ((answersByUser.get(profile.user_id) ?? []) as Array<{ answer?: unknown }>),
        internal_scores: (internalByUser.get(profile.user_id) as {
          manners_score?: number | null;
          photo_real_score?: number | null;
          manager_notes?: string | null;
        } | null) ?? null,
      }),
    }));

    return NextResponse.json({ items });
  } catch (error: unknown) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "리뷰 큐 조회 실패" },
      { status: 500 }
    );
  }
}


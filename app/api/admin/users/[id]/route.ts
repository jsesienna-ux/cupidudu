import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { assertAdminToken, getAdminTokenFromRequest } from "@/lib/admin-api";
import { calculateReviewAlgorithm } from "@/lib/review-algorithm";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const authError = assertAdminToken(getAdminTokenFromRequest(req));
  if (authError) return authError;

  try {
    const userId = params.id;
    const admin = createAdminClient();

    const { data: profile, error: profileError } = await admin
      .from("user_profiles")
      .select(
        "user_id, full_name, username, gender, age, contact, email, created_at, residence, job, school_name, mbti, image_url, introduction, greeting, approval_status, membership_grade, approved_at, profile_status, membership_level, submitted_at, rejected_reason"
      )
      .eq("user_id", userId)
      .maybeSingle();

    if (profileError) {
      return NextResponse.json({ message: profileError.message }, { status: 500 });
    }
    if (!profile) {
      return NextResponse.json({ message: "회원을 찾을 수 없습니다." }, { status: 404 });
    }

    const [
      { data: internal },
      { data: answers },
      { data: badges },
      { data: history },
      deliveredCardsResult,
    ] = await Promise.all([
      admin
        .from("internal_scores")
        .select("user_id, manners_score, photo_real_score, manager_notes, last_reviewed_at")
        .eq("user_id", userId)
        .maybeSingle(),
      admin
        .from("values_answers")
        .select("question_id, answer, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false }),
      admin
        .from("user_badges")
        .select("badge_code, granted_at, badges(label, category, is_public)")
        .eq("user_id", userId),
      admin
        .from("audit_log")
        .select("id, action, metadata, created_at, actor_user_id")
        .eq("target_user_id", userId)
        .order("created_at", { ascending: false })
        .limit(100),
      admin
        .from("delivered_cards")
        .select("id, card_id, status, created_at, viewed_at, is_read, manager_comment, meeting_at, meeting_completed_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false }),
    ]);
    let deliveredCards = deliveredCardsResult.data;
    let deliveredCardsError = deliveredCardsResult.error;
    if (deliveredCardsError) {
      const msg = deliveredCardsError.message?.toLowerCase() ?? "";
      const missingMeetingColumns =
        msg.includes("meeting_at") || msg.includes("meeting_completed_at");
      if (missingMeetingColumns) {
        const fallback = await admin
          .from("delivered_cards")
          .select("id, card_id, status, created_at, viewed_at, is_read, manager_comment")
          .eq("user_id", userId)
          .order("created_at", { ascending: false });
        deliveredCards = (fallback.data ?? []).map((row) => ({
          ...row,
          meeting_at: null,
          meeting_completed_at: null,
        }));
        deliveredCardsError = fallback.error;
      }
    }
    if (deliveredCardsError) {
      return NextResponse.json({ message: deliveredCardsError.message }, { status: 500 });
    }

    const algorithm = calculateReviewAlgorithm({
      job: (profile as { job?: string | null }).job ?? null,
      school_name: (profile as { school_name?: string | null }).school_name ?? null,
      residence: (profile as { residence?: string | null }).residence ?? null,
      mbti: (profile as { mbti?: string | null }).mbti ?? null,
      image_url: (profile as { image_url?: string | null }).image_url ?? null,
      internal_scores: (internal as {
        manners_score?: number | null;
        photo_real_score?: number | null;
        manager_notes?: string | null;
      } | null) ?? null,
      values_answers: (answers ?? []) as Array<{ answer?: unknown }>,
    });

    return NextResponse.json({
      profile,
      internal_scores: internal ?? null,
      values_answers: answers ?? [],
      badges: badges ?? [],
      history: history ?? [],
      delivered_cards: deliveredCards ?? [],
      algorithm,
    });
  } catch (error: unknown) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "사용자 상세 조회 실패" },
      { status: 500 }
    );
  }
}


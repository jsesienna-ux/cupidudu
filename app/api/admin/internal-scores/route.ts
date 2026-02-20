import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { assertAdminToken, getAdminTokenFromRequest } from "@/lib/admin-api";

function validScore(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 100;
}

export async function POST(req: Request) {
  const authError = assertAdminToken(getAdminTokenFromRequest(req));
  if (authError) return authError;

  try {
    const body = (await req.json()) as {
      user_id?: string;
      manners_score?: number;
      photo_real_score?: number;
      manager_notes?: string | null;
      actor_user_id?: string;
    };
    const userId = body.user_id ?? "";
    if (!userId) {
      return NextResponse.json({ message: "user_id가 필요합니다." }, { status: 400 });
    }
    if (!validScore(body.manners_score) || !validScore(body.photo_real_score)) {
      return NextResponse.json({ message: "점수는 0~100 범위여야 합니다." }, { status: 400 });
    }

    const admin = createAdminClient();
    const payload = {
      user_id: userId,
      manners_score: body.manners_score,
      photo_real_score: body.photo_real_score,
      manager_notes: body.manager_notes ?? null,
      last_reviewed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const { error } = await admin.from("internal_scores").upsert(payload, { onConflict: "user_id" });
    if (error) return NextResponse.json({ message: error.message }, { status: 500 });

    await admin.from("audit_log").insert({
      actor_user_id: body.actor_user_id ?? userId,
      action: "UPDATE_INTERNAL_SCORE",
      target_user_id: userId,
      metadata: {
        manners_score: body.manners_score,
        photo_real_score: body.photo_real_score,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "내부 점수 저장 실패" },
      { status: 500 }
    );
  }
}


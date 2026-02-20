import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { assertAdminToken, getAdminTokenFromRequest } from "@/lib/admin-api";

export async function POST(req: Request) {
  const authError = assertAdminToken(getAdminTokenFromRequest(req));
  if (authError) return authError;

  try {
    const body = (await req.json()) as {
      user_id?: string;
      badge_code?: string;
      expires_at?: string | null;
      note?: string | null;
      actor_user_id?: string;
    };
    const userId = body.user_id ?? "";
    const badgeCode = body.badge_code ?? "";
    if (!userId || !badgeCode) {
      return NextResponse.json({ message: "user_id, badge_code가 필요합니다." }, { status: 400 });
    }

    const admin = createAdminClient();
    const { error } = await admin.from("user_badges").upsert(
      {
        user_id: userId,
        badge_code: badgeCode,
        expires_at: body.expires_at ?? null,
        note: body.note ?? null,
        granted_by: body.actor_user_id ?? null,
        granted_at: new Date().toISOString(),
      },
      { onConflict: "user_id,badge_code" }
    );
    if (error) return NextResponse.json({ message: error.message }, { status: 500 });

    await admin.from("audit_log").insert({
      actor_user_id: body.actor_user_id ?? userId,
      action: "GRANT_BADGE",
      target_user_id: userId,
      metadata: { badge_code: badgeCode, expires_at: body.expires_at ?? null },
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "배지 부여 실패" },
      { status: 500 }
    );
  }
}


import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { assertAdminToken, getAdminTokenFromRequest } from "@/lib/admin-api";
import { updateByUserOrId } from "@/lib/supabase/update-by-user";

const ALLOWED_LEVELS = new Set(["REGULAR", "VERIFIED", "VIP"]);

function levelToGrade(level: string): string {
  if (level === "VIP") return "VIP회원";
  if (level === "VERIFIED") return "우수회원";
  return "정회원";
}

export async function POST(req: Request) {
  const authError = assertAdminToken(getAdminTokenFromRequest(req));
  if (authError) return authError;

  try {
    const body = (await req.json()) as { user_id?: string; membership_level?: string; actor_user_id?: string };
    const userId = body.user_id ?? "";
    const membershipLevel = (body.membership_level ?? "REGULAR").toUpperCase();

    if (!userId) {
      return NextResponse.json({ message: "target user_id가 필요합니다." }, { status: 400 });
    }
    if (!ALLOWED_LEVELS.has(membershipLevel)) {
      return NextResponse.json({ message: "membership_level 값이 유효하지 않습니다." }, { status: 400 });
    }

    const admin = createAdminClient();
    const payload = {
      profile_status: "APPROVED",
      approval_status: "approved",
      membership_level: membershipLevel,
      membership_grade: levelToGrade(membershipLevel),
      approved_at: new Date().toISOString(),
      last_reviewed_at: new Date().toISOString(),
      rejected_reason: null,
    };

    const { error } = await updateByUserOrId(admin, "user_profiles", userId, payload);
    if (error) return NextResponse.json({ message: error.message }, { status: 500 });

    await admin.from("audit_log").insert({
      actor_user_id: body.actor_user_id ?? userId,
      action: "APPROVE_PROFILE",
      target_user_id: userId,
      metadata: { membership_level: membershipLevel },
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "승인 처리 실패" },
      { status: 500 }
    );
  }
}


import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { assertAdminToken, getAdminTokenFromRequest } from "@/lib/admin-api";
import { updateByUserOrId } from "@/lib/supabase/update-by-user";

export async function POST(req: Request) {
  const authError = assertAdminToken(getAdminTokenFromRequest(req));
  if (authError) return authError;

  try {
    const body = (await req.json()) as { user_id?: string; rejected_reason?: string; actor_user_id?: string };
    const userId = body.user_id ?? "";
    const reason = (body.rejected_reason ?? "").trim();
    if (!userId) {
      return NextResponse.json({ message: "target user_id가 필요합니다." }, { status: 400 });
    }
    if (!reason) {
      return NextResponse.json({ message: "rejected_reason이 필요합니다." }, { status: 400 });
    }

    const admin = createAdminClient();
    const payload = {
      profile_status: "REJECTED",
      approval_status: "REJECTED",
      rejected_reason: reason,
      last_reviewed_at: new Date().toISOString(),
    };

    const { error } = await updateByUserOrId(admin, "user_profiles", userId, payload);
    if (error) return NextResponse.json({ message: error.message }, { status: 500 });

    await admin.from("audit_log").insert({
      actor_user_id: body.actor_user_id ?? userId,
      action: "REJECT_PROFILE",
      target_user_id: userId,
      metadata: { rejected_reason: reason },
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "반려 처리 실패" },
      { status: 500 }
    );
  }
}


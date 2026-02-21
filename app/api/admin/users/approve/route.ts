import { NextResponse } from "next/server";
import { assertAdminToken, getAdminTokenFromRequest } from "@/lib/admin-api";
import { createAdminClient } from "@/lib/supabase/admin";
import { updateByUserOrId } from "@/lib/supabase/update-by-user";

const ALLOWED_GRADES = new Set(["정회원", "우수회원", "VIP회원"]);

function toMembershipLevel(grade: string): "REGULAR" | "VERIFIED" | "VIP" {
  if (grade === "VIP회원") return "VIP";
  if (grade === "우수회원") return "VERIFIED";
  return "REGULAR";
}

export async function POST(req: Request) {
  const authError = assertAdminToken(getAdminTokenFromRequest(req));
  if (authError) return authError;

  try {
    const body = (await req.json()) as { userId?: string; membershipGrade?: string };
    const userId = typeof body.userId === "string" ? body.userId : "";
    const membershipGrade = typeof body.membershipGrade === "string" ? body.membershipGrade : "";

    if (!userId) {
      return NextResponse.json({ message: "사용자 정보가 올바르지 않습니다." }, { status: 400 });
    }

    if (!ALLOWED_GRADES.has(membershipGrade)) {
      return NextResponse.json({ message: "유효하지 않은 회원등급입니다." }, { status: 400 });
    }

    const admin = createAdminClient();
    const payload = {
      approval_status: "approved",
      membership_grade: membershipGrade,
      profile_status: "APPROVED",
      membership_level: toMembershipLevel(membershipGrade),
      approved_at: new Date().toISOString(),
      last_reviewed_at: new Date().toISOString(),
    };

    const { error } = await updateByUserOrId(admin, "user_profiles", userId, payload);
    if (error) {
      return NextResponse.json(
        { message: `승인 처리 실패: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, message: "승인 완료" });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "승인 처리 중 오류가 발생했습니다.";
    return NextResponse.json({ message: msg }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { isValidAdminToken } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/admin";

const ALLOWED_GRADES = new Set(["정회원", "우수회원", "VIP회원"]);

function toMembershipLevel(grade: string): "REGULAR" | "VERIFIED" | "VIP" {
  if (grade === "VIP회원") return "VIP";
  if (grade === "우수회원") return "VERIFIED";
  return "REGULAR";
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const token = typeof body.token === "string" ? body.token : null;
    const userId = typeof body.userId === "string" ? body.userId : "";
    const membershipGrade = typeof body.membershipGrade === "string" ? body.membershipGrade : "";

    if (!isValidAdminToken(token)) {
      return NextResponse.json({ message: "관리자 인증이 필요합니다." }, { status: 401 });
    }

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

    const { error } = await admin
      .from("user_profiles")
      .update(payload)
      .eq("user_id", userId);

    if (error) {
      const isMissingUserIdColumn = error.message
        ?.toLowerCase()
        .includes("could not find the 'user_id' column");

      if (isMissingUserIdColumn) {
        const { error: retryError } = await admin
          .from("user_profiles")
          .update(payload)
          .eq("id", userId);

        if (retryError) {
          return NextResponse.json(
            { message: `승인 처리 실패: ${retryError.message}` },
            { status: 500 }
          );
        }
      } else {
        return NextResponse.json(
          { message: `승인 처리 실패: ${error.message}` },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ success: true, message: "승인 완료" });
  } catch (error: any) {
    return NextResponse.json(
      { message: error?.message || "승인 처리 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

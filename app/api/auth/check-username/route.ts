import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { toAuthEmail } from "@/lib/auth-username";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const raw = typeof body.username === "string" ? body.username.trim().toLowerCase() : "";

    // 아이디 형식 검증
    if (!raw || raw.length < 3 || raw.length > 20 || !/^[a-z0-9_]+$/.test(raw)) {
      return NextResponse.json({
        available: false,
        message: "아이디 형식이 올바르지 않아요."
      });
    }

    // user_profiles 테이블에서 중복 확인
    const admin = createAdminClient();
    const { data: profile } = await admin
      .from("user_profiles")
      .select("user_id")
      .eq("username", raw)
      .maybeSingle();

    if (profile) {
      return NextResponse.json({
        available: false,
        message: "이미 사용 중인 아이디예요."
      });
    }

    // 사용 가능한 아이디
    return NextResponse.json({
      available: true,
      message: "사용 가능한 아이디예요!"
    });
  } catch (e) {
    console.error("Username check error:", e);
    return NextResponse.json({
      available: false,
      message: "확인 중 오류가 발생했어요."
    }, { status: 500 });
  }
}

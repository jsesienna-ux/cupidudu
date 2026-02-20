import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const raw = typeof body.username === "string" ? body.username.trim().toLowerCase() : "";
    if (!raw || raw.length < 3 || raw.length > 20 || !/^[a-z0-9_]+$/.test(raw)) {
      return NextResponse.json({ available: false, message: "아이디 형식이 올바르지 않아요." });
    }

    const admin = createAdminClient();
    const { data: profile } = await admin
      .from("user_profiles")
      .select("username")
      .ilike("username", raw)
      .maybeSingle();

    if (profile) {
      return NextResponse.json({ available: false, message: "이미 사용 중인 아이디예요." });
    }

    return NextResponse.json({ available: true, message: "사용 가능한 아이디예요." });
  } catch {
    return NextResponse.json({ available: false, message: "확인 중 오류가 발생했어요." }, { status: 500 });
  }
}

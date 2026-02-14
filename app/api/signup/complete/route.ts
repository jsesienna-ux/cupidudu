import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const gender = body.gender as string;
    const fullName = typeof body.fullName === "string" ? body.fullName.trim() : null;
    const age = typeof body.age === "number" && body.age >= 1 && body.age <= 120 ? body.age : null;
    const contact = typeof body.contact === "string" ? body.contact.trim() : null;
    const username = typeof body.username === "string" ? body.username.trim().toLowerCase() : null;
    const email = typeof body.email === "string" ? body.email.trim() : null;

    if (gender !== "male" && gender !== "female") {
      return NextResponse.json(
        { message: "성별은 male 또는 female이어야 합니다." },
        { status: 400 }
      );
    }

    if (!username || username.length < 3 || username.length > 20 || !/^[a-z0-9_]+$/.test(username)) {
      return NextResponse.json(
        { message: "아이디는 영문 소문자, 숫자, 밑줄 3~20자여야 합니다." },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { message: "로그인된 사용자가 없습니다." },
        { status: 401 }
      );
    }

    const { error: genderError } = await supabase.rpc("set_user_gender", {
      p_user_id: user.id,
      p_gender: gender,
    });

    if (genderError) {
      return NextResponse.json(
        { message: genderError.message ?? "성별 저장 실패" },
        { status: 500 }
      );
    }

    const { error: profileError } = await supabase.from("user_profiles").upsert(
      {
        user_id: user.id,
        full_name: fullName,
        age,
        contact,
        email,
        username,
        gender,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );

    if (profileError) {
      return NextResponse.json(
        { message: profileError.message ?? "프로필 저장 실패" },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { message: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

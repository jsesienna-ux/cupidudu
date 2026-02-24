import { ok, fail, unauthorized, serverError } from "@/lib/api/response";
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
      return fail("성별은 male 또는 female이어야 합니다.", 400);
    }

    if (!username || username.length < 3 || username.length > 20 || !/^[a-z0-9_]+$/.test(username)) {
      return fail("아이디는 영문 소문자, 숫자, 밑줄 3~20자여야 합니다.", 400);
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return unauthorized("로그인된 사용자가 없습니다.");
    }

    const { error: genderError } = await supabase.rpc("set_user_gender", {
      p_user_id: user.id,
      p_gender: gender,
    });

    if (genderError) {
      return serverError(genderError.message ?? "성별 저장 실패");
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
      return serverError(profileError.message ?? "프로필 저장 실패");
    }

    return ok();
  } catch {
    return serverError("서버 오류가 발생했습니다.");
  }
}

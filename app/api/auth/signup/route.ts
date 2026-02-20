import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { toAuthEmail } from "@/lib/auth-username";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { username, password, fullName, gender, age, contact, email } = body;

    if (!username || !password || !gender) {
      return NextResponse.json({ message: "필수 항목을 입력해주세요." }, { status: 400 });
    }

    const lowerUsername = username.toLowerCase();

    // user_profiles 중복 체크 — 여기 없으면 가입 가능으로 판단
    const { data: existingUser } = await supabaseAdmin
      .from("user_profiles")
      .select("username")
      .ilike("username", lowerUsername)
      .maybeSingle();

    if (existingUser) {
      return NextResponse.json({ message: "이미 사용 중인 아이디입니다." }, { status: 400 });
    }

    if (email) {
      const { data: existingEmail } = await supabaseAdmin
        .from("user_profiles")
        .select("email")
        .eq("email", email)
        .maybeSingle();
      if (existingEmail) {
        return NextResponse.json({ message: "이미 등록된 이메일 주소입니다." }, { status: 400 });
      }
    }

    const authEmail = toAuthEmail(lowerUsername);

    // ── 1차: Auth 사용자 생성 시도 ──
    let createResult = await supabaseAdmin.auth.admin.createUser({
      email: authEmail,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    });

    // ── 2차: "already exists" → 고아 Auth 계정 정리 후 재시도 ──
    if (createResult.error) {
      const msg = (createResult.error.message ?? "").toLowerCase();
      const isDuplicate = msg.includes("already") || msg.includes("exists") || msg.includes("duplicate");

      if (isDuplicate) {
        // user_profiles에 없으니 이건 고아 계정 → DB 함수로 직접 삭제
        const { error: rpcError } = await supabaseAdmin.rpc("delete_orphan_auth_user", {
          target_email: authEmail,
        });

        if (rpcError) {
          console.error("RPC delete_orphan_auth_user failed:", rpcError.message);
          return NextResponse.json(
            { message: "계정 정리 중 오류가 발생했습니다. 관리자에게 문의해주세요." },
            { status: 500 }
          );
        }

        // 삭제 후 재시도
        createResult = await supabaseAdmin.auth.admin.createUser({
          email: authEmail,
          password,
          email_confirm: true,
          user_metadata: { full_name: fullName },
        });
      }
    }

    const user = createResult.data?.user;
    if (createResult.error || !user) {
      console.error("Auth createUser final error:", createResult.error?.message);
      return NextResponse.json(
        { message: "계정 생성에 실패했습니다. 다른 아이디를 시도해주세요." },
        { status: 400 }
      );
    }

    // ── user_wallets 생성 ──
    const { error: walletError } = await supabaseAdmin
      .from("user_wallets")
      .insert({ user_id: user.id, coins: 0, gender });
    if (walletError) console.error("Wallet error:", walletError);

    // ── user_profiles 생성 (스키마 호환 처리) ──
    const coreProfile = {
      username: lowerUsername,
      full_name: fullName,
      gender,
      age,
      contact,
      email,
    };
    const moderationFields = {
      profile_status: "PENDING",
      approval_status: "PENDING",
      submitted_at: new Date().toISOString(),
    };
    const identityKeys: Array<"user_id" | "id"> = ["user_id", "id"];
    const payloadVariants = [
      { ...coreProfile, ...moderationFields },
      { ...coreProfile },
    ];

    let profileCreated = false;
    let lastProfileError: { message?: string } | null = null;

    for (const payload of payloadVariants) {
      for (const key of identityKeys) {
        const { error } = await supabaseAdmin
          .from("user_profiles")
          .insert({ ...payload, [key]: user.id });
        if (!error) {
          profileCreated = true;
          break;
        }
        lastProfileError = error;
      }
      if (profileCreated) break;
    }

    if (!profileCreated) {
      console.error("Profile error:", lastProfileError);
      return NextResponse.json(
        { message: "프로필 생성 실패: " + (lastProfileError?.message ?? "알 수 없는 오류") },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "회원가입 성공",
      user: { id: user.id, email: authEmail, username },
    });
  } catch (error: unknown) {
    console.error("Signup error:", error);
    const msg = error instanceof Error ? error.message : "서버 오류";
    return NextResponse.json({ message: msg }, { status: 500 });
  }
}

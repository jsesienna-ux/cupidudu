import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { normalizeMembershipLevel, normalizeProfileStatus } from "@/lib/profile-status";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ message: "로그인이 필요합니다." }, { status: 401 });
    }

    const profileColumns =
      "user_id, id, full_name, username, gender, age, contact, residence, job, school_name, image_url, mbti, greeting, introduction, membership_level, membership_grade, profile_status, approval_status, submitted_at, approved_at, rejected_reason";

    const { data: profileByUserId, error: profileByUserIdError } = await supabase
      .from("user_profiles")
      .select(profileColumns)
      .eq("user_id", user.id)
      .maybeSingle();

    let profile = profileByUserId as Record<string, unknown> | null;
    if (profileByUserIdError?.message?.toLowerCase().includes("could not find the 'user_id' column")) {
      const { data: profileById, error: profileByIdError } = await supabase
        .from("user_profiles")
        .select(profileColumns)
        .eq("id", user.id)
        .maybeSingle();
      if (profileByIdError) {
        return NextResponse.json({ message: profileByIdError.message }, { status: 500 });
      }
      profile = profileById as Record<string, unknown> | null;
    } else if (profileByUserIdError) {
      return NextResponse.json({ message: profileByUserIdError.message }, { status: 500 });
    }

    const { data: badgesRows, error: badgesError } = await supabase
      .from("user_badges")
      .select("badge_code, granted_at, expires_at, note, badges(category, label, is_public, icon)")
      .eq("user_id", user.id)
      .order("granted_at", { ascending: false });

    if (badgesError) {
      return NextResponse.json({ message: badgesError.message }, { status: 500 });
    }

    const normalizedProfile = profile
      ? {
          ...profile,
          membership_level: normalizeMembershipLevel(
            profile.membership_level as string | null | undefined,
            profile.membership_grade as string | null | undefined
          ),
          profile_status: normalizeProfileStatus(
            profile.profile_status as string | null | undefined,
            profile.approval_status as string | null | undefined
          ),
        }
      : null;

    return NextResponse.json({
      profile: normalizedProfile,
      badges: badgesRows ?? [],
    });
  } catch (error: unknown) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "내 정보 조회 실패" },
      { status: 500 }
    );
  }
}


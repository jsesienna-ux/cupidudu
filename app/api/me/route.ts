import { ok, unauthorized, serverError } from "@/lib/api/response";
import { createClient } from "@/lib/supabase/server";
import { normalizeMembershipLevel, normalizeProfileStatus } from "@/lib/profile-status";
import { selectByUserOrId } from "@/lib/supabase/update-by-user";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return unauthorized("로그인이 필요합니다.");
    }

    const profileColumns =
      "user_id, id, full_name, username, gender, age, contact, residence, job, school_name, image_url, mbti, greeting, introduction, membership_level, membership_grade, profile_status, approval_status, submitted_at, approved_at, rejected_reason";

    const { data: profile, error: profileError } = await selectByUserOrId(
      supabase,
      "user_profiles",
      user.id,
      { columns: profileColumns }
    );
    if (profileError) {
      return serverError(profileError.message ?? "프로필 조회 실패");
    }

    const { data: badgesRows, error: badgesError } = await supabase
      .from("user_badges")
      .select("badge_code, granted_at, expires_at, note, badges(category, label, is_public, icon)")
      .eq("user_id", user.id)
      .order("granted_at", { ascending: false });

    if (badgesError) {
      return serverError(badgesError.message ?? "배지 조회 실패");
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

    return ok({ profile: normalizedProfile, badges: badgesRows ?? [] });
  } catch (error: unknown) {
    return serverError(error instanceof Error ? error.message : "내 정보 조회 실패");
  }
}


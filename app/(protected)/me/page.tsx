import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProfileSubmitButton } from "@/components/profile/ProfileSubmitButton";
import { getLevelLabel, normalizeMembershipLevel, normalizeProfileStatus } from "@/lib/profile-status";

type UserBadge = {
  badge_code: string;
  granted_at: string;
  badges?: {
    label?: string;
    is_public?: boolean;
  } | null;
};

export default async function MePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const columns =
    "user_id, id, full_name, username, membership_level, membership_grade, profile_status, approval_status, submitted_at, approved_at, rejected_reason";
  const { data: profileByUserId, error: profileByUserIdError } = await supabase
    .from("user_profiles")
    .select(columns)
    .eq("user_id", user.id)
    .maybeSingle();

  let profile = profileByUserId as Record<string, unknown> | null;
  if (profileByUserIdError?.message?.toLowerCase().includes("could not find the 'user_id' column")) {
    const { data: profileById } = await supabase
      .from("user_profiles")
      .select(columns)
      .eq("id", user.id)
      .maybeSingle();
    profile = profileById as Record<string, unknown> | null;
  }

  const { data: badgeRows } = await supabase
    .from("user_badges")
    .select("badge_code, granted_at, badges(label, is_public)")
    .eq("user_id", user.id)
    .order("granted_at", { ascending: false });

  const level = normalizeMembershipLevel(
    profile?.membership_level as string | null | undefined,
    profile?.membership_grade as string | null | undefined
  );
  const status = normalizeProfileStatus(
    profile?.profile_status as string | null | undefined,
    profile?.approval_status as string | null | undefined
  );
  const isPendingOrApproved = status === "PENDING" || status === "APPROVED";

  return (
    <main className="nav-safe min-h-dvh px-4 pb-24 pt-6">
      <div className="mx-auto max-w-lg space-y-4">
        <section className="rounded-2xl border border-cupid-pinkSoft bg-white p-6 shadow-sm">
          <h1 className="text-xl font-bold text-gray-800">내 프로필 상태</h1>
          <p className="mt-2 text-sm text-cupid-gray">
            레벨: <strong>{getLevelLabel(level)}</strong> / 상태: <strong>{status}</strong>
          </p>
          <div className="mt-4">
            <ProfileSubmitButton disabled={isPendingOrApproved} />
          </div>
        </section>

        <section className="rounded-2xl border border-cupid-pinkSoft bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-gray-800">내 배지 (전체)</h2>
          <div className="mt-3 space-y-2">
            {(badgeRows as UserBadge[] | null)?.length ? (
              (badgeRows as UserBadge[]).map((row) => (
                <div key={row.badge_code} className="rounded-lg bg-cupid-cream/40 p-3 text-sm">
                  <p className="font-medium text-gray-800">
                    {row.badges?.label || row.badge_code}
                    {row.badges?.is_public ? " (공개)" : " (비공개)"}
                  </p>
                  <p className="mt-1 text-xs text-cupid-gray">
                    {new Date(row.granted_at).toLocaleString("ko-KR")}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm text-cupid-gray">배지가 없습니다.</p>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}


import { requireUser } from "@/lib/auth/require-auth";
import { createClient } from "@/lib/supabase/server";
import { MypageDashboard } from "@/components/MypageDashboard";

export default async function MypagePage() {
  const user = await requireUser();
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("full_name, age, contact, gender, job, introduction, greeting, image_url, mbti, company_name, residence, school_name, height_cm, weight_kg, hobbies, assets, personality, username, email, approval_status, membership_grade, approved_at, profile_status, membership_level")
    .eq("user_id", user.id)
    .maybeSingle();

  // 매칭된 카드 조회 (도착한 카드)
  const { data: deliveredCards } = await supabase
    .from("delivered_cards")
    .select("id, card_id, created_at, viewed_at, is_read")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <main className="nav-safe min-h-dvh bg-gradient-to-b from-cupid-cream/30 to-white px-4 pb-24 pt-6">
      <div className="mx-auto max-w-lg">
        <MypageDashboard
          userId={user.id}
          userEmail={user.email ?? ""}
          profile={profile}
          deliveredCards={deliveredCards ?? []}
        />
      </div>
    </main>
  );
}

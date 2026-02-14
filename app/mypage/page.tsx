import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LogoutButton } from "@/components/LogoutButton";
import { ProfileEditForm } from "@/components/ProfileEditForm";

export default async function MypagePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("full_name, age, contact, gender, job, introduction, greeting, image_url, mbti, company_name, residence, school_name, height_cm, weight_kg, hobbies, assets, personality")
    .eq("user_id", user.id)
    .maybeSingle();

  return (
    <main className="nav-safe min-h-dvh px-4 pb-24 pt-6">
      <div className="mx-auto max-w-lg">
        <h1 className="text-xl font-bold text-gray-800">마이페이지</h1>
        <p className="mt-2 text-sm text-cupid-gray">
          기본 정보와 상세 프로필을 작성·수정할 수 있어요.
        </p>
        <div className="mt-6">
          <ProfileEditForm
            userId={user.id}
            initialProfile={profile}
            userEmail={user.email ?? ""}
          />
        </div>
        <div className="mt-8">
          <LogoutButton />
        </div>
      </div>
    </main>
  );
}

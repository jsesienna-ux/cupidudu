import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function ChatPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("introduction, job, greeting")
    .eq("user_id", user.id)
    .maybeSingle();

  const hasDetailedProfile = Boolean(profile && (profile.introduction || profile.job || profile.greeting));
  if (!hasDetailedProfile) redirect("/mypage");

  return (
    <main className="nav-safe min-h-dvh px-4 pb-24 pt-6">
      <div className="mx-auto max-w-lg">
        <h1 className="text-xl font-bold text-gray-800">채팅</h1>
        <p className="mt-2 text-sm text-cupid-gray">대화 목록이 여기에 표시됩니다.</p>
      </div>
    </main>
  );
}

import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { OnboardingDetailsForm } from "@/components/OnboardingDetailsForm";

export default async function OnboardingDetailsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  return (
    <main className="min-h-dvh bg-gradient-to-b from-cupid-cream/30 to-white px-4 pb-12 pt-6">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-cupid-pinkDark">정회원 기본정보입력</h1>
          <p className="mt-2 text-sm text-cupid-gray">
            정회원 심사를 위해 매칭에 필요한 최소 정보만 입력해주세요.
          </p>
        </div>

        <div className="rounded-2xl border border-cupid-pinkSoft bg-white p-4 shadow-sm sm:p-6">
          <OnboardingDetailsForm initialProfile={(profile as Record<string, unknown> | null) ?? null} />
        </div>

        <div className="mt-4 text-center">
          <Link href="/" className="text-sm text-cupid-gray hover:text-cupid-pinkDark">
            ← 나중에 입력하기
          </Link>
        </div>
      </div>
    </main>
  );
}


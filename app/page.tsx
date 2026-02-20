import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ServiceIntro } from "@/components/ServiceIntro";
import { createAdminClient } from "@/lib/supabase/admin";
import { NoOppositeGenderMessage } from "@/components/NoOppositeGenderMessage";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // 프로필 완성 여부 체크 + 가입일시(24h 타이머용)
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("introduction, job, greeting, created_at, full_name, username")
    .eq("user_id", user.id)
    .maybeSingle();

  // 상세정보가 하나라도 입력되지 않았으면 서비스 소개 팝업 표시
  const hasDetailedProfile = profile && (profile.introduction || profile.job || profile.greeting);
  const signedUpAt = profile?.created_at ?? user.created_at ?? new Date().toISOString();

  const { data: wallet } = await supabase
    .from("user_wallets")
    .select("gender")
    .eq("user_id", user.id)
    .maybeSingle();

  const userGender = wallet?.gender as string | null;
  const oppositeGender = userGender === "female" ? "male" : "female";

  const { data: cards } = await supabase
    .from("delivered_cards")
    .select("id, card_id, is_read")
    .eq("user_id", user.id)
    .eq("is_read", false);

  const list = Array.isArray(cards) ? cards : [];
  const cardIds = list.map((r) => (r as { card_id?: string }).card_id).filter(Boolean) as string[];

  let oppositeGenderCardIds: string[] = [];
  if (cardIds.length > 0) {
    try {
      const admin = createAdminClient();
      const { data: profiles } = await admin
        .from("profile_cards")
        .select("id")
        .in("id", cardIds)
        .eq("gender", oppositeGender);
      oppositeGenderCardIds = Array.isArray(profiles) ? profiles.map((p) => p.id) : [];
    } catch {
      oppositeGenderCardIds = [];
    }
  }

  const newCardCount = list.filter((r) =>
    oppositeGenderCardIds.includes((r as { card_id?: string }).card_id ?? "")
  ).length;

  return (
    <>
      {/* 상세정보 미작성자만 팝업 표시 */}
      {!hasDetailedProfile && <ServiceIntro signedUpAt={signedUpAt} />}
      
      {/* 메인 콘텐츠 */}
      <main className="nav-safe min-h-dvh px-4 pb-24 pt-6">
        <div className="mx-auto max-w-lg">
          {newCardCount > 0 ? (
            <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 py-12 text-center">
              <div
                className="mb-8 flex h-48 w-48 items-center justify-center rounded-full bg-gradient-to-br from-cupid-pinkSoft to-cupid-pinkLight/50"
                aria-hidden
              >
                <span className="text-7xl">💌</span>
              </div>
              <h2 className="mb-3 text-xl font-bold text-gray-800">
                새로운 카드가 도착했어요!
              </h2>
              <p className="max-w-xs text-cupid-gray">
                카드함에서 확인해보세요.
              </p>
              <Link
                href="/cards"
                className="mt-8 flex w-full max-w-xs items-center justify-center gap-2 rounded-2xl border-2 border-cupid-pink bg-cupid-pink py-4 font-semibold text-white shadow-lg transition hover:bg-cupid-pinkDark"
              >
                <span aria-hidden>💌</span>
                카드함에서 {newCardCount}건 확인하기
              </Link>
            </div>
          ) : (
            <NoOppositeGenderMessage />
          )}
        </div>
      </main>
    </>
  );
}

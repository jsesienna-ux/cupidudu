import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { LandingWithLogin } from "@/components/LandingWithLogin";
import { createAdminClient } from "@/lib/supabase/admin";
import { NoOppositeGenderMessage } from "@/components/NoOppositeGenderMessage";

type DeliveredCard = {
  id: string;
  card_id: string;
  is_read: boolean;
};

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return <LandingWithLogin />;
  }

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

  const deliveredCards = (cards ?? []) as DeliveredCard[];
  const cardIds = deliveredCards.map((card) => card.card_id);

  let oppositeGenderCardIds: string[] = [];
  if (cardIds.length > 0) {
    try {
      const admin = createAdminClient();
      const { data: profiles } = await admin
        .from("profile_cards")
        .select("id")
        .in("id", cardIds)
        .eq("gender", oppositeGender);
      oppositeGenderCardIds = profiles?.map((p) => p.id) ?? [];
    } catch (error) {
      console.error("Failed to fetch opposite gender cards:", error);
      oppositeGenderCardIds = [];
    }
  }

  const newCardCount = deliveredCards.filter((card) =>
    oppositeGenderCardIds.includes(card.card_id)
  ).length;

  return (
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
  );
}

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { CardBoxList } from "@/components/CardBoxList";
import { NoOppositeGenderMessage } from "@/components/NoOppositeGenderMessage";

type DeliveredCard = {
  id: string;
  status: string | null;
  created_at: string;
  viewed_at: string | null;
  is_read: boolean;
  manager_comment: string | null;
  card_id: string;
};

type ProfileCard = {
  id: string;
  full_name: string | null;
  job: string | null;
  image_url: string | null;
  age: number | null;
  mbti: string | null;
  gender: string;
};

function formatDate(iso?: string | null): string {
  if (!iso) return "-";
  const date = new Date(iso);
  return date.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default async function CardBoxPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: wallet } = await supabase
    .from("user_wallets")
    .select("gender")
    .eq("user_id", user.id)
    .maybeSingle();

  const userGender = wallet?.gender as string | null;
  const oppositeGender = userGender === "female" ? "male" : "female";

  const { data: cards } = await supabase
    .from("delivered_cards")
    .select("id, status, created_at, viewed_at, is_read, manager_comment, card_id")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const deliveredCards = (cards ?? []) as DeliveredCard[];
  const cardIds = deliveredCards.map((card) => card.card_id);

  let oppositeGenderCardIds: string[] = [];
  let profilesMap: Record<string, ProfileCard> = {};

  if (cardIds.length > 0) {
    try {
      const admin = createAdminClient();
      const { data: profiles } = await admin
        .from("profile_cards")
        .select("id, full_name, job, image_url, age, mbti, gender")
        .in("id", cardIds)
        .eq("gender", oppositeGender);

      const profileCards = (profiles ?? []) as ProfileCard[];
      oppositeGenderCardIds = profileCards.map((p) => p.id);
      profilesMap = Object.fromEntries(profileCards.map((p) => [p.id, p]));
    } catch (error) {
      console.error("Failed to fetch profile cards:", error);
    }
  }

  const filteredCards = deliveredCards.filter((card) =>
    oppositeGenderCardIds.includes(card.card_id)
  );

  const items = filteredCards.map((card) => {
    const profile = profilesMap[card.card_id];
    return {
      id: card.id,
      status: card.status ?? "pending",
      created_at: card.created_at,
      viewed_at: card.viewed_at,
      is_read: card.is_read,
      manager_comment: card.manager_comment,
      arrivedDateFormatted: formatDate(card.created_at),
      viewedDateFormatted: formatDate(card.viewed_at),
      profile: profile ? {
        id: profile.id,
        full_name: profile.full_name ?? "",
        job: profile.job,
        image_url: profile.image_url,
        age: profile.age,
        mbti: profile.mbti,
      } : null,
    };
  });

  return (
    <main className="nav-safe min-h-dvh px-4 pb-24 pt-6">
      <div className="mx-auto max-w-lg">
        <h1 className="text-xl font-bold text-gray-800">카드함</h1>
        <p className="mt-2 text-sm text-cupid-gray">
          도착한 카드를 확인하세요.
        </p>

        {items.length === 0 ? (
          <div className="mt-12">
            <NoOppositeGenderMessage />
          </div>
        ) : (
          <CardBoxList items={items} />
        )}
      </div>
    </main>
  );
}

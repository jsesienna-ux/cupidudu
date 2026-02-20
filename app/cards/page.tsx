import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { CardBoxList } from "@/components/cards/CardBoxList";
import { NoOppositeGenderMessage } from "@/components/NoOppositeGenderMessage";

function formatDate(iso?: string | null) {
  if (!iso) return "-";
  const d = new Date(iso);
  return d.toLocaleDateString("ko-KR", {
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

  // 정회원 인증 체크 (상세정보 입력 여부)
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("introduction, job, greeting")
    .eq("user_id", user.id)
    .maybeSingle();

  const hasDetailedProfile = profile && (profile.introduction || profile.job || profile.greeting);

  // 상세정보가 없으면 마이페이지로 리다이렉트
  if (!hasDetailedProfile) {
    redirect("/mypage");
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
    .select("id, status, created_at, viewed_at, is_read, manager_comment, card_id")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const list = Array.isArray(cards) ? cards : [];
  const cardIds = list.map((r) => (r as { card_id?: string }).card_id).filter(Boolean) as string[];

  let oppositeGenderCardIds: string[] = [];
  let profilesMap: Record<string, { id: string; full_name: string | null; job: string | null; image_url: string | null; age: number | null; mbti: string | null }> = {};
  if (cardIds.length > 0) {
    try {
      const admin = createAdminClient();
      const { data: profiles } = await admin
        .from("profile_cards")
        .select("id, full_name, job, image_url, age, mbti, gender")
        .in("id", cardIds)
        .eq("gender", oppositeGender);
      if (Array.isArray(profiles)) {
        oppositeGenderCardIds = profiles.map((p) => p.id);
        profilesMap = Object.fromEntries(profiles.map((p) => [p.id, p]));
      }
    } catch {
      // SERVICE_ROLE_KEY 없으면 프로필 없이 표시
    }
  }

  const filteredList = list.filter((r) =>
    oppositeGenderCardIds.includes((r as { card_id?: string }).card_id ?? "")
  );

  const items = filteredList.map((row) => {
    const cardId = (row as { card_id?: string }).card_id;
    const profile = cardId ? profilesMap[cardId] : null;
    return {
      id: row.id,
      status: row.status ?? "pending",
      created_at: row.created_at,
      viewed_at: row.viewed_at,
      is_read: row.is_read ?? false,
      manager_comment: row.manager_comment ?? null,
      arrivedDateFormatted: formatDate(row.created_at),
      viewedDateFormatted: formatDate(row.viewed_at),
      profile: profile
        ? {
            id: profile.id,
            full_name: profile.full_name ?? "",
            job: profile.job ?? null,
            image_url: profile.image_url ?? null,
            age: profile.age ?? null,
            mbti: profile.mbti ?? null,
          }
        : null,
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

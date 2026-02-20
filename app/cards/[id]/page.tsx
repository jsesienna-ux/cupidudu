import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { CardDetail } from "@/components/cards/CardDetail";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ id: string }> | { id: string } };

export default async function CardDetailPage({ params }: PageProps) {
  const resolved = typeof (params as Promise<{ id: string }>).then === "function" ? await (params as Promise<{ id: string }>) : (params as { id: string });
  const id = resolved?.id;
  if (!id || typeof id !== "string") {
    notFound();
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // 정회원 인증 체크 (상세정보 입력 여부)
  const { data: userProfile } = await supabase
    .from("user_profiles")
    .select("introduction, job, greeting")
    .eq("user_id", user.id)
    .maybeSingle();

  const hasDetailedProfile = userProfile && (userProfile.introduction || userProfile.job || userProfile.greeting);

  // 상세정보가 없으면 마이페이지로 리다이렉트
  if (!hasDetailedProfile) {
    redirect("/mypage");
  }

  const { data: row, error } = await supabase
    .from("delivered_cards")
    .select("id, user_id, status, manager_comment, created_at, card_id")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (error || !row) notFound();

  let profile: Record<string, unknown> | null = null;

  const { data: rpcProfile, error: rpcError } = await supabase.rpc("get_delivered_card_profile", {
    p_delivered_id: id,
    p_user_id: user.id,
  });

  if (!rpcError && rpcProfile && typeof rpcProfile === "object") {
    profile = rpcProfile as Record<string, unknown>;
  }

  if (!profile) {
    const cardId = (row as { card_id?: string }).card_id;
    if (cardId) {
      let directProfile: Record<string, unknown> | null = null;
      try {
        const admin = createAdminClient();
        const res = await admin
          .from("profile_cards")
          .select("id, full_name, job, image_url, greeting, age, mbti, introduction, company_name, residence, school_name, height_cm, weight_kg, hobbies, assets, personality")
          .eq("id", cardId)
          .single();
        if (!res.error && res.data) directProfile = res.data as Record<string, unknown>;
      } catch {
        const res = await supabase
          .from("profile_cards")
          .select("id, full_name, job, image_url, greeting, age, mbti, introduction, company_name, residence, school_name, height_cm, weight_kg, hobbies, assets, personality")
          .eq("id", cardId)
          .single();
        if (!res.error && res.data) directProfile = res.data as Record<string, unknown>;
      }
      profile = directProfile;
    }
  }

  if (!profile) notFound();

  const { data: wallet } = await supabase
    .from("user_wallets")
    .select("coins")
    .eq("user_id", user.id)
    .maybeSingle();

  const initialCoinBalance = wallet?.coins ?? 0;

  const card = {
    id: row.id,
    user_id: row.user_id,
    status: row.status ?? "pending",
    manager_comment: row.manager_comment ?? null,
    created_at: row.created_at,
    profile: {
      id: String(profile.id ?? ""),
      full_name: String(profile.full_name ?? ""),
      job: (profile.job as string | null) ?? null,
      image_url: (profile.image_url as string | null) ?? null,
      greeting: (profile.greeting as string | null) ?? null,
      age: (profile.age as number | null) ?? null,
      mbti: (profile.mbti as string | null) ?? null,
      introduction: (profile.introduction as string | null) ?? null,
      company_name: (profile.company_name as string | null) ?? null,
      residence: (profile.residence as string | null) ?? null,
      school_name: (profile.school_name as string | null) ?? null,
      height_cm: (profile.height_cm as number | null) ?? null,
      weight_kg: (profile.weight_kg as number | null) ?? null,
      hobbies: (profile.hobbies as string | null) ?? null,
      assets: (profile.assets as string | null) ?? null,
      personality: (profile.personality as string | null) ?? null,
    },
  };

  return (
    <main className="nav-safe min-h-dvh pb-40">
      <CardDetail card={card} initialCoinBalance={initialCoinBalance} />
    </main>
  );
}

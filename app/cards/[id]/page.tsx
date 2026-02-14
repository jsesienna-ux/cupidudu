import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { CardDetail } from "@/components/CardDetail";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ id: string }> | { id: string } };

type ProfileCard = {
  id: string;
  full_name: string;
  job: string | null;
  image_url: string | null;
  greeting: string | null;
  age: number | null;
  mbti: string | null;
  introduction: string | null;
  company_name: string | null;
  residence: string | null;
  school_name: string | null;
  height_cm: number | null;
  weight_kg: number | null;
  hobbies: string | null;
  assets: string | null;
  personality: string | null;
};

async function resolveParams(params: PageProps["params"]): Promise<{ id: string }> {
  return "then" in params ? await params : params;
}

export default async function CardDetailPage({ params }: PageProps) {
  const { id } = await resolveParams(params);
  if (!id) {
    notFound();
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: row, error } = await supabase
    .from("delivered_cards")
    .select("id, user_id, status, manager_comment, created_at, card_id")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (error || !row) notFound();

  let profile: ProfileCard | null = null;

  const { data: rpcProfile, error: rpcError } = await supabase.rpc("get_delivered_card_profile", {
    p_delivered_id: id,
    p_user_id: user.id,
  });

  if (!rpcError && rpcProfile) {
    profile = rpcProfile as ProfileCard;
  }

  if (!profile && row.card_id) {
    try {
      const admin = createAdminClient();
      const { data, error: adminError } = await admin
        .from("profile_cards")
        .select("id, full_name, job, image_url, greeting, age, mbti, introduction, company_name, residence, school_name, height_cm, weight_kg, hobbies, assets, personality")
        .eq("id", row.card_id)
        .single();

      if (!adminError && data) {
        profile = data as ProfileCard;
      }
    } catch (error) {
      console.error("Failed to fetch profile with admin client:", error);

      const { data, error: profileError } = await supabase
        .from("profile_cards")
        .select("id, full_name, job, image_url, greeting, age, mbti, introduction, company_name, residence, school_name, height_cm, weight_kg, hobbies, assets, personality")
        .eq("id", row.card_id)
        .single();

      if (!profileError && data) {
        profile = data as ProfileCard;
      }
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
    manager_comment: row.manager_comment,
    created_at: row.created_at,
    profile,
  };

  return (
    <main className="nav-safe min-h-dvh pb-40">
      <CardDetail card={card} initialCoinBalance={initialCoinBalance} />
    </main>
  );
}

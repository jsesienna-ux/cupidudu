import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { StoreCharge } from "@/components/StoreCharge";

export default async function StorePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: wallet } = await supabase
    .from("user_wallets")
    .select("coins")
    .eq("user_id", user.id)
    .maybeSingle();

  const coins = wallet?.coins ?? 0;

  return (
    <main className="nav-safe min-h-dvh px-4 pb-24 pt-6">
      <div className="mx-auto max-w-lg">
        <h1 className="text-xl font-bold text-gray-800">코인 상점</h1>
        <p className="mt-2 text-sm text-cupid-gray">
          현재 보유 코인: <span className="font-semibold text-cupid-pinkDark">{coins}</span>개
        </p>

        <div className="mt-8">
          <StoreCharge initialCoins={coins} />
        </div>

        <Link
          href="/"
          className="mt-8 block text-center text-sm font-medium text-cupid-pink hover:text-cupid-pinkDark"
        >
          홈으로 돌아가기
        </Link>
      </div>
    </main>
  );
}

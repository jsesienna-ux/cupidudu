"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export function Header() {
  const [coins, setCoins] = useState<number | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  const fetchBalance = async () => {
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
    if (!user) {
      setUserId(null);
      setCoins(null);
      return;
    }
    setUserId(user.id);
    const { data } = await supabase
      .from("user_wallets")
      .select("coins")
      .eq("user_id", user.id)
      .maybeSingle();
    setCoins(data?.coins ?? 0);
    } catch {
      setUserId(null);
      setCoins(null);
    }
  };

  useEffect(() => {
    fetchBalance();
  }, []);

  useEffect(() => {
    const handleFocus = () => fetchBalance();
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, []);

  if (userId === null) return null;

  return (
    <header
      className="sticky top-0 z-30 flex w-full items-center justify-end gap-2 border-b border-cupid-pinkSoft/50 bg-cupid-cream/95 px-4 py-2 backdrop-blur-sm"
      style={{ paddingTop: "max(0.5rem, env(safe-area-inset-top))" }}
    >
      <span className="rounded-full bg-cupid-pinkSoft/70 px-3 py-1.5 text-sm font-semibold text-cupid-pinkDark">
        🪙 {coins ?? "—"} 코인
      </span>
      <Link
        href="/store"
        className="rounded-full bg-cupid-pink px-4 py-1.5 text-sm font-semibold text-white shadow-md transition hover:bg-cupid-pinkDark hover:opacity-95"
      >
        코인 충전 🪙
      </Link>
    </header>
  );
}

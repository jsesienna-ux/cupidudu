"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function useCoins(): {
  coins: number | null;
  isLoading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
} {
  const [coins, setCoins] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchCoins = useCallback(async () => {
    setError(null);
    setIsLoading(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setCoins(null);
        setIsLoading(false);
        return;
      }

      const { data, error: fetchErr } = await supabase
        .from("user_wallets")
        .select("coins")
        .eq("user_id", user.id)
        .maybeSingle();

      if (fetchErr) {
        const errMsg =
          fetchErr instanceof Error
            ? fetchErr.message
            : typeof (fetchErr as { message?: string }).message === "string"
              ? (fetchErr as { message: string }).message
              : String(fetchErr);
        setError(new Error(errMsg));
        setCoins(null);
        setIsLoading(false);
        return;
      }

      const value =
        data != null && typeof (data as { coins?: unknown }).coins === "number"
          ? (data as { coins: number }).coins
          : 0;
      setCoins(value);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      setCoins(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCoins();
  }, [fetchCoins]);

  return { coins, isLoading, error, refresh: fetchCoins };
}

/*
  === 사용 예시 ===

  // 예시 1: Header에서 코인 표시
  import { useCoins } from "@/hooks/useCoins";
  export function Header() {
    const { coins, isLoading } = useCoins();
    if (isLoading || coins === null) return null; // 또는 스켈레톤
    return (
      <header>
        <span>🪙 {coins} 코인</span>
        <Link href="/store">코인 충전</Link>
      </header>
    );
  }

  // 예시 2: StoreCharge 결제 후 refresh 호출
  import { useCoins } from "@/hooks/useCoins";
  export function StorePageContent() {
    const { coins, refresh } = useCoins();
    const onPaymentSuccess = async () => {
      await refresh(); // 결제 완료 후 잔액 재조회
    };
    return <StoreCharge initialCoins={coins ?? 0} onSuccess={onPaymentSuccess} />;
  }
*/

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { useCoins } from "@/hooks/useCoins";

const STORE_ID = process.env.NEXT_PUBLIC_PORTONE_STORE_ID ?? "";
const CHANNEL_KEY = process.env.NEXT_PUBLIC_PORTONE_CHANNEL_KEY ?? "";

export type CoinPackage = {
  id: string;
  name: string;
  coins: number;
  price: number;
  badge?: string;
  emoji: string;
};

const PACKAGES: CoinPackage[] = [
  { id: "light", name: "라이트", coins: 10, price: 1000, emoji: "🥉" },
  { id: "basic", name: "베이직", coins: 100, price: 9000, badge: "10% 할인", emoji: "🥈" },
  { id: "premium", name: "프리미엄", coins: 1000, price: 80000, badge: "20% 할인", emoji: "🥇" },
];

export function StoreCharge({ initialCoins }: { initialCoins: number }) {
  const router = useRouter();
  const { coins: hookCoins, refresh: refreshCoins } = useCoins();
  const coins = hookCoins !== null ? hookCoins : initialCoins;
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCharge = async (pkg: CoinPackage) => {
    // 환경 변수 체크 (디버깅용 로그)
    if (typeof window !== "undefined") {
      const storeId = process.env.NEXT_PUBLIC_PORTONE_STORE_ID;
      const channelKey = process.env.NEXT_PUBLIC_PORTONE_CHANNEL_KEY;
      console.log("[StoreCharge] env check:", {
        hasStoreId: !!storeId,
        hasChannelKey: !!channelKey,
        storeIdLength: storeId?.length ?? 0,
      });
      if (!storeId || !channelKey) {
        console.warn("[StoreCharge] 결제 설정 누락: STORE_ID 또는 CHANNEL_KEY가 undefined입니다.");
      }
    }

    if (!STORE_ID || !CHANNEL_KEY) {
      setError("결제 설정이 되어 있지 않습니다. (NEXT_PUBLIC_PORTONE_STORE_ID, CHANNEL_KEY 확인)");
      return;
    }

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setError("로그인이 필요합니다.");
      return;
    }

    setError(null);
    setLoading(pkg.id);

    try {
      const mod = await import("@portone/browser-sdk/v2");
      const PortOne = (mod as { default?: { requestPayment: (opts: unknown) => Promise<unknown> } }).default ?? mod;
      const requestPayment = typeof PortOne?.requestPayment === "function" ? PortOne.requestPayment : null;

      if (!requestPayment) {
        console.error("[StoreCharge] PortOne.requestPayment를 찾을 수 없습니다.", { modKeys: Object.keys(mod ?? {}) });
        setError("결제 모듈을 불러올 수 없습니다.");
        setLoading(null);
        return;
      }
      console.log("[StoreCharge] PortOne SDK 로드 완료, 결제창 호출");

      const ts = Date.now();
      const paymentId = `order-${Date.now()}`;
      const orderId = `coin-${user.id}-${ts}`;
      const orderName = `${pkg.emoji} ${pkg.name} 코인 ${pkg.coins}개`;
      const totalAmount = 1000;
      const currency = "CURRENCY_KRW" as const;
      // 테스트 후 실제 금액 사용: const totalAmount = Number(pkg.price);

      console.log("결제 요청 데이터:", { paymentId, totalAmount, orderName });

      const response = (await requestPayment({
        storeId: STORE_ID,
        channelKey: CHANNEL_KEY,
        paymentId,
        orderName,
        totalAmount,
        currency,
        payMethod: "EASY_PAY",
      })) as { code?: string; message?: string; paymentId?: string } | undefined;

      if (response?.code != null) {
        console.warn("[StoreCharge] 결제 실패:", response);
        setError(response.message ?? "결제에 실패했습니다.");
        setLoading(null);
        return;
      }

      const paidPaymentId = response?.paymentId ?? paymentId;
      console.log("[StoreCharge] 결제창 닫힘, 즉시 confirm API 호출:", { paymentId: paidPaymentId, coinsToAdd: pkg.coins });

      try {
        const confirmRes = await fetch("/api/payment/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            paymentId: paidPaymentId,
            coinsToAdd: pkg.coins,
            totalAmount,
            orderId,
            orderName,
            currency,
          }),
        });

        const data = await confirmRes.json().catch(() => ({}));

        if (!confirmRes.ok) {
          const errMsg = [
            data.error,
            data.detail ? (typeof data.detail === "string" ? data.detail : JSON.stringify(data.detail)) : null,
            `(HTTP ${confirmRes.status})`,
          ]
            .filter(Boolean)
            .join(" ");
          console.error("[StoreCharge] confirm API 실패:", { status: confirmRes.status, data });
          setError(errMsg.trim() || "결제 확인에 실패했습니다.");
          alert(errMsg.trim() || "결제 확인에 실패했습니다.");
          setLoading(null);
          return;
        }

        const newCoins = data.new_coins ?? data.new_balance;
        console.log("[StoreCharge] 결제 검증 완료, 코인 적립됨:", newCoins);

        await refreshCoins();
        toast.success("충전이 완료되었습니다!");
        router.refresh();
        router.push("/");
      } catch (apiErr) {
        const msg =
          apiErr instanceof Error
            ? apiErr.message
            : typeof apiErr === "object" && apiErr != null && "message" in apiErr
              ? String((apiErr as { message: unknown }).message)
              : String(apiErr);
        console.error("[StoreCharge] confirm API 호출 오류:", apiErr);
        setError(msg);
        alert(`결제 검증 중 오류가 발생했습니다.\n\n${msg}`);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error("[StoreCharge] 결제/검증 오류:", e);
      setError(msg);
      alert(`오류가 발생했습니다.\n\n${msg}`);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-sm font-semibold text-cupid-pinkDark">
        보유 코인: {coins}개
      </p>
      {error && (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </p>
      )}
      <div className="grid gap-4 sm:grid-cols-1">
        {PACKAGES.map((pkg) => (
          <div
            key={pkg.id}
            className="overflow-hidden rounded-2xl border-2 border-cupid-pinkSoft bg-white shadow-lg transition hover:border-cupid-pink hover:shadow-xl"
          >
            <div className="bg-gradient-to-br from-cupid-pinkSoft/50 to-white px-5 pt-5 pb-4">
              <div className="flex items-center justify-between">
                <span className="text-4xl" aria-hidden>{pkg.emoji}</span>
                {pkg.badge && (
                  <span className="rounded-full bg-cupid-pink px-2.5 py-0.5 text-xs font-bold text-white">
                    {pkg.badge}
                  </span>
                )}
              </div>
              <h3 className="mt-2 text-lg font-bold text-gray-800">{pkg.name}</h3>
              <p className="mt-1 text-2xl font-bold text-cupid-pinkDark">
                {pkg.coins.toLocaleString()}개
              </p>
              <p className="mt-0.5 text-sm text-cupid-gray">
                {pkg.price.toLocaleString()}원
              </p>
            </div>
            <div className="border-t border-cupid-pinkSoft/50 p-4">
              <button
                type="button"
                onClick={() => handleCharge(pkg)}
                disabled={!!loading}
                className="w-full rounded-xl bg-cupid-pink py-3 font-semibold text-white shadow-md transition hover:bg-cupid-pinkDark disabled:opacity-60"
              >
                {loading === pkg.id ? "결제 중..." : "구입하기"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

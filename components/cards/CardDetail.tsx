"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { isInsufficientCoinError, REQUIRED_COINS_TO_UNLOCK } from "@/lib/utils/coin-errors";
import { MatchingApplyModal } from "@/components/store/MatchingApplyModal";
import { InsufficientCoinModal } from "@/components/store/InsufficientCoinModal";

type Profile = {
  id: string;
  full_name: string;
  job: string | null;
  image_url: string | null;
  greeting: string | null;
  age: number | null;
  mbti: string | null;
  introduction: string | null;
  company_name?: string | null;
  residence?: string | null;
  school_name?: string | null;
  height_cm?: number | null;
  weight_kg?: number | null;
  hobbies?: string | null;
  assets?: string | null;
  personality?: string | null;
};

type Card = {
  id: string;
  user_id: string;
  status: string;
  manager_comment: string | null;
  created_at?: string;
  profile: Profile;
};

export function CardDetail({
  card,
  initialCoinBalance = 0,
}: {
  card: Card;
  initialCoinBalance?: number;
}) {
  const router = useRouter();
  const [status, setStatus] = useState(card.status);
  const [coinBalance, setCoinBalance] = useState(initialCoinBalance);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [insufficientCoinOpen, setInsufficientCoinOpen] = useState(false);
  const [moreInfoMode, setMoreInfoMode] = useState<"top3" | "all">("top3");
  const [finalMatchRequested, setFinalMatchRequested] = useState(false);

  useEffect(() => {
    setStatus(card.status);
  }, [card.status]);

  useEffect(() => {
    fetch(`/api/cards/${encodeURIComponent(card.id)}/view`, { method: "POST", credentials: "include" }).catch(() => {});
  }, [card.id]);

  const isBlurred = status !== "paid";
  const isPaid = status === "paid";
  const p = card.profile;

  const EXTRA_FIELDS = [
    { key: "company_name", label: "회사", value: p.company_name },
    { key: "residence", label: "거주지", value: p.residence },
    { key: "school_name", label: "학교", value: p.school_name },
    { key: "height_cm", label: "키", value: p.height_cm != null ? `${p.height_cm}cm` : null },
    { key: "weight_kg", label: "몸무게", value: p.weight_kg != null ? `${p.weight_kg}kg` : null },
    { key: "hobbies", label: "취미", value: p.hobbies },
    { key: "assets", label: "자산", value: p.assets },
    { key: "personality", label: "성격", value: p.personality },
  ] as const;
  const fieldsWithValue = EXTRA_FIELDS.filter((f) => f.value);
  const top3Fields = fieldsWithValue.slice(0, 3);
  const hasExtraInfo = fieldsWithValue.length > 0;

  const refetchCoins = async (): Promise<number> => {
    const supabase = createClient();
    const { data } = await supabase
      .from("user_wallets")
      .select("coins")
      .eq("user_id", card.user_id)
      .maybeSingle();
    const coins = data != null && typeof data.coins === "number" ? data.coins : 0;
    setCoinBalance(coins);
    return coins;
  };

  const handleUnlock = async () => {
    const supabase = createClient();
    setLoading(true);
    setSuccessMessage(null);

    try {
      const { data, error } = await supabase.rpc("unlock_profile_card", {
        target_card_id: card.id,
        target_user_id: card.user_id,
      });

      setModalOpen(false);
      setLoading(false);

      if (error) {
        if (isInsufficientCoinError(error)) {
          setInsufficientCoinOpen(true);
          return;
        }
        setSuccessMessage("처리 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.");
        return;
      }

      setStatus("paid");
      const newCoins = (data as { new_balance?: number; new_coins?: number })?.new_coins ?? (data as { new_balance?: number })?.new_balance;
      if (typeof newCoins === "number") {
        setCoinBalance(newCoins);
      } else {
        await refetchCoins();
      }
      toast.success("잠금이 해제되었습니다!");
      setSuccessMessage("신청이 완료되었습니다! 곧 매니저가 채팅방을 열어드릴게요. 💌");
      router.refresh();
    } catch (err) {
      setLoading(false);
      setModalOpen(false);
      console.error("결제 처리 중 예상치 못한 에러:", err);
      setSuccessMessage("처리 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.");
    }
  };

  return (
    <>
      <div className="mx-auto max-w-lg">
        {/* 코인 잔액 표시 */}
        <div className="flex justify-end px-2 py-2">
          <span className="rounded-full bg-cupid-pinkSoft/70 px-3 py-1 text-sm font-semibold text-cupid-pinkDark">
            🪙 {coinBalance} 코인
          </span>
        </div>

        {/* 추천 사유 칸: manager_comment */}
        {card.manager_comment != null && card.manager_comment !== "" && (
          <div className="border-b border-cupid-pinkSoft/50 bg-gradient-to-r from-cupid-pinkSoft/40 to-white px-4 py-4">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-serif text-cupid-pinkDark" aria-hidden>
                &ldquo;
              </span>
              <h2 className="text-sm font-bold uppercase tracking-wide text-cupid-pinkDark">
                매니저의 추천 이유
              </h2>
            </div>
            <p className="mt-2 pl-6 text-sm leading-relaxed text-gray-700">
              {card.manager_comment}
            </p>
          </div>
        )}

        {/* 프로필 헤더: 사진(블러 → framer-motion 선명화) + 이름 */}
        <div className="relative border-b border-cupid-pinkSoft/30 bg-gradient-to-b from-cupid-pinkSoft/30 to-white px-6 pt-8 pb-6">
          <div className="flex flex-col items-center">
            <div className="relative h-40 w-40 overflow-hidden rounded-full ring-4 ring-white shadow-xl">
              {p.image_url ? (
                <>
                  <motion.div
                    className="absolute inset-0"
                    initial={false}
                    animate={{
                      filter: isBlurred ? "blur(8px)" : "blur(0px)",
                    }}
                    transition={{
                      duration: 1.2,
                      ease: [0.25, 0.46, 0.45, 0.94],
                    }}
                  >
                    <Image
                      src={p.image_url}
                      alt={isBlurred ? "잠긴 프로필 (관심있어요 후 확인)" : `${p.full_name} 프로필`}
                      fill
                      unoptimized
                      priority
                      className="object-cover"
                    />
                  </motion.div>
                  {isBlurred && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/20">
                      <span className="text-2xl text-white/90 drop-shadow" aria-hidden>🔒</span>
                      <span className="mt-1 text-xs font-medium text-white/90">관심있어요 후 사진 확인</span>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-cupid-pinkLight text-6xl text-white">
                  👤
                </div>
              )}
            </div>
            <motion.h1
              className="mt-4 text-2xl font-bold text-gray-800"
              key={`name-${status}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            >
              {p.full_name}
              <span className="ml-1 text-xl font-semibold text-cupid-pink">님</span>
            </motion.h1>

            {/* 최종 매칭 신청하기 - 사진 바로 밑, isPaid일 때만 */}
            {isPaid && (
              <button
                type="button"
                onClick={() => {
                  setFinalMatchRequested(true);
                  toast.success("매칭 신청이 완료되었습니다! 💌");
                }}
                disabled={finalMatchRequested}
                className="mt-4 flex w-full max-w-xs items-center justify-center gap-2 rounded-xl bg-cupid-pink py-3.5 font-semibold text-white shadow-lg transition hover:bg-cupid-pinkDark disabled:opacity-70"
              >
                <span className="text-xl" aria-hidden>♥</span>
                {finalMatchRequested ? "매칭중" : "최종 매칭 신청하기"}
              </button>
            )}
          </div>
        </div>

        {/* {full_name}님의 프로필 - 회사, 거주지, 학교 등 (isPaid일 때만) */}
        {isPaid && hasExtraInfo && (
          <div className="border-b border-cupid-pinkSoft/30 px-4 py-4">
            <h2 className="text-lg font-bold text-gray-800">
              {p.full_name}님의 프로필
            </h2>
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={() => setMoreInfoMode("top3")}
                className={`flex-1 rounded-lg py-2 text-sm font-medium transition ${
                  moreInfoMode === "top3"
                    ? "bg-cupid-pink text-white"
                    : "bg-cupid-pinkSoft/50 text-cupid-pinkDark"
                }`}
              >
                제일 궁금한 항목 3개 보기
              </button>
              <button
                type="button"
                onClick={() => setMoreInfoMode("all")}
                className={`flex-1 rounded-lg py-2 text-sm font-medium transition ${
                  moreInfoMode === "all"
                    ? "bg-cupid-pink text-white"
                    : "bg-cupid-pinkSoft/50 text-cupid-pinkDark"
                }`}
              >
                전체 보기
              </button>
            </div>
            <div className="mt-3 grid gap-2 rounded-xl bg-cupid-pinkSoft/20 p-4">
              {(moreInfoMode === "top3" ? top3Fields : fieldsWithValue).map(({ label, value }) => (
                <div key={label} className="flex justify-between gap-4 text-sm">
                  <span className="font-medium text-gray-600">{label}</span>
                  <span className="text-right text-gray-800">{value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 공개 정보: ID·나이·직업 - 항상 선명하게 표시 */}
        <div className="flex flex-wrap gap-2 px-4 py-4">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-cupid-pinkSoft/70 px-3.5 py-1.5 text-sm font-medium text-cupid-pinkDark">
            <span aria-hidden>🆔</span>
            {String(p.id).slice(0, 8)}
          </span>
          {p.age != null && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-cupid-pinkSoft/70 px-3.5 py-1.5 text-sm font-medium text-cupid-pinkDark">
              <span aria-hidden>🎂</span>
              {p.age}세
            </span>
          )}
          {p.job && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-cupid-pinkSoft/70 px-3.5 py-1.5 text-sm font-medium text-cupid-pinkDark">
              <span aria-hidden>💼</span>
              {p.job}
            </span>
          )}
          {p.mbti && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-cupid-pinkSoft/70 px-3.5 py-1.5 text-sm font-medium text-cupid-pinkDark">
              <span aria-hidden>🧩</span>
              {p.mbti}
            </span>
          )}
        </div>

        {/* 상세 정보 */}
        <div className="space-y-6 px-4 py-6">
          {p.greeting && (
            <motion.section
              key={`greeting-${status}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <h2 className="text-xs font-semibold uppercase tracking-wider text-cupid-pink/80">
                한마디
              </h2>
              <p className="mt-2 rounded-xl bg-cupid-pinkSoft/30 px-4 py-3 text-[15px] leading-relaxed text-gray-700">
                &ldquo;{p.greeting}&rdquo;
              </p>
            </motion.section>
          )}

          {p.introduction && (
            <motion.section
              key={`intro-${status}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <h2 className="text-xs font-semibold uppercase tracking-wider text-cupid-pink/80">
                소개
              </h2>
              <p className="mt-2 whitespace-pre-line rounded-xl border border-cupid-pinkSoft/50 bg-white px-4 py-4 text-[15px] leading-relaxed text-gray-700">
                {p.introduction}
              </p>
            </motion.section>
          )}
        </div>

        {successMessage && (
          <div className="mx-4 mb-4 rounded-xl bg-cupid-pinkSoft/50 px-4 py-3 text-center text-sm font-medium text-cupid-pinkDark">
            {successMessage}
          </div>
        )}
      </div>

      {/* 하단 고정 버튼 - 미결제 시에만 표시 */}
      {!isPaid && (
      <div
        className="fixed bottom-0 left-0 z-[60] w-full bg-gradient-to-t from-white via-white/95 to-transparent px-4 pt-6 pb-4"
        style={{
          paddingBottom: "max(1rem, env(safe-area-inset-bottom))",
        }}
      >
        <div className="mx-auto max-w-lg">
            <button
              type="button"
              onClick={async () => {
                try {
                  const coins = await refetchCoins();
                  const b = typeof coins === "number" && Number.isFinite(coins) ? coins : 0;
                  if (b < REQUIRED_COINS_TO_UNLOCK) {
                    setInsufficientCoinOpen(true);
                  } else {
                    setModalOpen(true);
                  }
                } catch {
                  setInsufficientCoinOpen(true);
                }
              }}
              disabled={loading}
              className="w-full rounded-xl py-3.5 font-semibold text-white shadow-lg transition hover:opacity-95 disabled:opacity-70"
              style={{ backgroundColor: "#FF69B4" }}
            >
              관심있어요
            </button>
        </div>
      </div>
      )}

      <MatchingApplyModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onConfirm={handleUnlock}
        loading={loading}
        currentCoins={coinBalance}
      />

      <InsufficientCoinModal
        open={insufficientCoinOpen}
        onClose={() => setInsufficientCoinOpen(false)}
        currentCoins={coinBalance}
      />
    </>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { isInsufficientCoinError, REQUIRED_COINS_TO_UNLOCK } from "@/lib/utils/coin-errors";
import { MatchingApplyModal } from "./MatchingApplyModal";
import { InsufficientCoinModal } from "./InsufficientCoinModal";

type CardArrivedProps = {
  deliveredCardId: string;
  userId: string;
  initialCoinBalance: number;
  fullName: string;
  job: string;
  greeting: string;
  imageUrl: string | null;
  managerComment: string | null;
  status: string;
  age?: number | null;
  mbti?: string | null;
  introduction?: string | null;
};

function ProfileImageFallback() {
  return (
    <div className="flex aspect-[3/4] w-full items-center justify-center bg-gradient-to-br from-cupid-pinkLight to-cupid-pink text-6xl text-white">
      👤
    </div>
  );
}

export function CardArrived({
  deliveredCardId,
  userId,
  initialCoinBalance = 0,
  fullName,
  job,
  greeting,
  imageUrl,
  managerComment,
  status,
  age,
  mbti,
  introduction,
}: CardArrivedProps) {
  const router = useRouter();
  const [imageError, setImageError] = useState(false);
  const [coinBalance, setCoinBalance] = useState(initialCoinBalance);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [insufficientModalOpen, setInsufficientModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [localStatus, setLocalStatus] = useState<string | null>(null);

  const displayStatus = localStatus ?? status;
  const isPending = displayStatus === "pending";
  const applyBlur = isPending;
  const showImage =
    imageUrl != null && String(imageUrl).trim() !== "" && !imageError;

  const refetchCoins = async (): Promise<number> => {
    if (!userId) return 0;
    const supabase = createClient();
    const { data } = await supabase
      .from("user_wallets")
      .select("coins")
      .eq("user_id", userId)
      .maybeSingle();
    const coins = data != null && typeof data.coins === "number" ? data.coins : 0;
    setCoinBalance(coins);
    return coins;
  };

  const handleMatchRequest = async () => {
    const supabase = createClient();
    setLoading(true);

    const { data, error } = await supabase.rpc("unlock_profile_card", {
      target_card_id: deliveredCardId,
      target_user_id: userId,
    });

    setConfirmModalOpen(false);
    setLoading(false);

    if (error) {
      if (isInsufficientCoinError(error)) {
        setInsufficientModalOpen(true);
        return;
      }
      return;
    }

    setLocalStatus("paid");
    const newCoins = (data as { new_balance?: number; new_coins?: number })?.new_coins ?? (data as { new_balance?: number })?.new_balance;
    if (typeof newCoins === "number") {
      setCoinBalance(newCoins);
    } else {
      await refetchCoins();
    }
    router.refresh();
  };

  const handleMatchButtonClick = async () => {
    try {
      const coins = await refetchCoins();
      const b = typeof coins === "number" && Number.isFinite(coins) ? coins : 0;
      if (b < REQUIRED_COINS_TO_UNLOCK) {
        setInsufficientModalOpen(true);
      } else {
        setConfirmModalOpen(true);
      }
    } catch {
      setInsufficientModalOpen(true);
    }
  };

  return (
    <section className="opacity-0 animate-[fadeIn_0.3s_ease-out_forwards]">
      <p className="mb-4 text-center text-sm font-medium text-cupid-pinkDark/90">
        오늘의 인연이 도착했습니다
      </p>

      <div className="overflow-hidden rounded-2xl border border-cupid-pinkSoft/50 bg-white shadow-[0_8px_32px_rgba(255,107,157,0.12)]">
        <div className="relative aspect-[3/4] w-full overflow-hidden">
          {showImage ? (
            <>
              <motion.div
                className="absolute inset-0"
                initial={false}
                animate={{ filter: applyBlur ? "blur(8px)" : "blur(0px)" }}
                transition={{ duration: 1.2, ease: [0.25, 0.46, 0.45, 0.94] }}
              >
                <Image
                  src={imageUrl}
                  alt={applyBlur ? "잠긴 프로필" : `${fullName} 프로필`}
                  fill
                  unoptimized
                  priority
                  onError={() => setImageError(true)}
                  className="object-cover"
                />
              </motion.div>
              {applyBlur && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/20">
                  <span className="text-2xl text-white/90 drop-shadow" aria-hidden>🔒</span>
                  <span className="mt-1 text-xs font-medium text-white/90">코인 {REQUIRED_COINS_TO_UNLOCK}개로 사진 잠금 해제</span>
                </div>
              )}
            </>
          ) : (
            <ProfileImageFallback />
          )}
        </div>

        {managerComment != null && managerComment !== "" && (
          <div className="relative px-4 pt-4">
            <div className="relative rounded-2xl rounded-tl-sm bg-cupid-pinkSoft/60 px-4 py-3 shadow-sm">
              <span className="absolute -top-2 left-4 h-3 w-3 rotate-45 bg-cupid-pinkSoft/60" />
              <p className="relative text-xs font-medium text-cupid-pinkDark/90">
                매니저의 추천 이유
              </p>
              <p className="relative mt-1 text-sm leading-relaxed text-gray-800">
                {managerComment}
              </p>
            </div>
          </div>
        )}

        <div className="bg-white px-5 py-5">
          <Link href={`/cards/${encodeURIComponent(deliveredCardId)}`} className="block">
            <motion.h2
              className="text-xl font-semibold tracking-tight text-gray-900"
              key={`name-${displayStatus}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6 }}
            >
              {fullName}
              <span className="ml-1 text-lg font-medium text-cupid-pink">님</span>
            </motion.h2>
            {job && (
              <motion.p
                className="mt-1.5 text-sm font-medium text-gray-600"
                key={`job-${displayStatus}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
                {job}
              </motion.p>
            )}
            {age != null && (
              <motion.p
                className="mt-1 text-sm font-medium text-gray-600"
                key={`age-${displayStatus}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
                {age}세
              </motion.p>
            )}
            {mbti && (
              <motion.p
                className="mt-1 text-sm font-medium text-gray-600"
                key={`mbti-${displayStatus}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
                {mbti}
              </motion.p>
            )}
            {greeting && (
              <motion.p
                className="mt-3 text-sm leading-relaxed text-gray-500 line-clamp-2"
                key={`greeting-${displayStatus}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
                &ldquo;{greeting}&rdquo;
              </motion.p>
            )}
            {introduction && (
              <motion.p
                className="mt-2 text-sm leading-relaxed text-gray-500 line-clamp-3"
                key={`intro-${displayStatus}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
                {introduction}
              </motion.p>
            )}
          </Link>

          {isPending && deliveredCardId && deliveredCardId !== "undefined" && (
            <button
              type="button"
              onClick={handleMatchButtonClick}
              disabled={loading}
              className="mt-4 flex w-full items-center justify-center rounded-xl bg-pink-500 py-3.5 text-base font-semibold text-white shadow-md transition hover:bg-pink-600 disabled:opacity-70"
            >
              관심있어요
            </button>
          )}
          {displayStatus === "paid" && (
            <div className="mt-4 flex w-full items-center justify-center rounded-xl bg-cupid-pinkSoft/70 py-3.5 text-base font-semibold text-cupid-pinkDark">
              매칭중
            </div>
          )}
        </div>
      </div>

      <p className="mt-4 text-center text-xs text-cupid-gray">
        카드를 눌러 자세히 보기
      </p>

      <MatchingApplyModal
        open={confirmModalOpen}
        onClose={() => setConfirmModalOpen(false)}
        onConfirm={handleMatchRequest}
        loading={loading}
        currentCoins={coinBalance}
      />

      <InsufficientCoinModal
        open={insufficientModalOpen}
        onClose={() => setInsufficientModalOpen(false)}
        currentCoins={coinBalance}
      />
    </section>
  );
}

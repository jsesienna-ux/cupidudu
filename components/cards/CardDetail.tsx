"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { useCoins } from "@/hooks/useCoins";
import { isInsufficientCoinError, REQUIRED_COINS_TO_UNLOCK } from "@/lib/utils/coin-errors";
import { MatchingApplyModal } from "@/components/store/MatchingApplyModal";
import { InsufficientCoinModal } from "@/components/store/InsufficientCoinModal";
import {
  CoinBalance,
  ManagerComment,
  ProfileHeader,
  ProfileExtraInfo,
  PublicBadges,
  DetailSections,
  SuccessMessage,
  BottomActionBar,
} from "@/components/cards/detail";
import type { Card } from "@/components/cards/detail";

export function CardDetail({
  card,
  initialCoinBalance = 0,
}: {
  card: Card;
  initialCoinBalance?: number;
}) {
  const router = useRouter();
  const { coins: coinBalance, refresh: refreshCoins } = useCoins();
  const [status, setStatus] = useState(card.status);
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

  const handleUnlock = async () => {
    const supabase = createClient();
    setLoading(true);
    setSuccessMessage(null);

    try {
      const { error } = await supabase.rpc("unlock_profile_card", {
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
      await refreshCoins();
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

  const handleInterestClick = () => {
    const b = typeof coinBalance === "number" && Number.isFinite(coinBalance) ? coinBalance : (coinBalance === null ? initialCoinBalance : 0);
    if (b < REQUIRED_COINS_TO_UNLOCK) {
      setInsufficientCoinOpen(true);
    } else {
      setModalOpen(true);
    }
  };

  const currentCoins = coinBalance ?? initialCoinBalance;

  return (
    <>
      <div className="mx-auto max-w-lg">
        <CoinBalance coins={currentCoins} />

        {card.manager_comment != null && card.manager_comment !== "" && (
          <ManagerComment text={card.manager_comment} />
        )}

        <ProfileHeader
          profile={p}
          isBlurred={isBlurred}
          isPaid={isPaid}
          status={status}
          onFinalMatchClick={() => {
            setFinalMatchRequested(true);
            toast.success("매칭 신청이 완료되었습니다! 💌");
          }}
          finalMatchRequested={finalMatchRequested}
        />

        {isPaid && hasExtraInfo && (
          <ProfileExtraInfo
            fullName={p.full_name}
            moreInfoMode={moreInfoMode}
            onModeChange={setMoreInfoMode}
            top3Fields={top3Fields}
            fieldsWithValue={fieldsWithValue}
          />
        )}

        <PublicBadges profile={p} />

        <DetailSections profile={p} status={status} />

        {successMessage && <SuccessMessage message={successMessage} />}
      </div>

      {!isPaid && <BottomActionBar onInterestClick={handleInterestClick} loading={loading} />}

      <MatchingApplyModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onConfirm={handleUnlock}
        loading={loading}
        currentCoins={currentCoins}
      />

      <InsufficientCoinModal
        open={insufficientCoinOpen}
        onClose={() => setInsufficientCoinOpen(false)}
        currentCoins={currentCoins}
      />
    </>
  );
}

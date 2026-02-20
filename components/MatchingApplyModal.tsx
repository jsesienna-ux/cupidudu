"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";

type MatchingApplyModalProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  loading?: boolean;
  currentCoins?: number;
};

export function MatchingApplyModal({
  open,
  onClose,
  onConfirm,
  loading = false,
}: MatchingApplyModalProps) {
  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  const modalContent = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4"
      style={{ isolation: "isolate" }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        className="relative z-10 w-full max-w-sm rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <h2
            id="modal-title"
            className="text-lg font-bold text-gray-800"
          >
            관심 표현하기
          </h2>
          <p className="mt-3 text-[15px] leading-relaxed text-gray-600">
            코인 5개를 사용해 프로필 사진과 자세한 정보를 확인하시겠습니까?
          </p>
        </div>
        <div className="flex gap-3 border-t border-gray-100 p-4">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex-1 rounded-xl border border-cupid-pinkSoft py-3 font-medium text-cupid-pinkDark transition hover:bg-cupid-pinkSoft/50 disabled:opacity-60"
          >
            취소
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 rounded-xl bg-cupid-pink py-3 font-semibold text-white transition hover:bg-cupid-pinkDark disabled:opacity-70"
          >
            {loading ? "처리 중..." : "코인 5개 사용하기"}
          </button>
        </div>
      </div>
      <button
        type="button"
        onClick={onClose}
        className="absolute inset-0 z-0"
        aria-label="닫기"
      />
    </div>
  );

  if (typeof document !== "undefined") {
    return createPortal(modalContent, document.body);
  }
  return modalContent;
}

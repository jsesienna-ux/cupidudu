"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";

type InsufficientCoinModalProps = {
  open: boolean;
  onClose: () => void;
  currentCoins?: number;
};

export function InsufficientCoinModal({ open, onClose, currentCoins }: InsufficientCoinModalProps) {
  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  const coins = typeof currentCoins === "number" ? currentCoins : 0;

  const modalContent = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4"
      style={{ isolation: "isolate" }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="insufficient-coin-title"
    >
      <div
        className="relative z-10 w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="insufficient-coin-title" className="text-lg font-bold text-gray-800">
          코인 부족
        </h2>
        <p className="mt-3 text-[15px] leading-relaxed text-gray-600">
          코인이 부족합니다. 현재 잔액: {coins}개
        </p>
        <div className="mt-6">
          <Link
            href="/store"
            className="block w-full rounded-xl bg-cupid-pink py-3 text-center font-semibold text-white transition hover:bg-cupid-pinkDark"
            onClick={onClose}
          >
            충전하기
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="mt-3 w-full rounded-xl border border-cupid-pinkSoft py-3 font-medium text-cupid-pinkDark transition hover:bg-cupid-pinkSoft/50"
          >
            취소
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

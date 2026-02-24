"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import type { Profile } from "./types";

type Props = {
  profile: Profile;
  isBlurred: boolean;
  isPaid: boolean;
  status: string;
  onFinalMatchClick: () => void;
  finalMatchRequested: boolean;
};

export function ProfileHeader({ profile, isBlurred, isPaid, status, onFinalMatchClick, finalMatchRequested }: Props) {
  const p = profile;
  return (
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

        {isPaid && (
          <button
            type="button"
            onClick={onFinalMatchClick}
            disabled={finalMatchRequested}
            className="mt-4 flex w-full max-w-xs items-center justify-center gap-2 rounded-xl bg-cupid-pink py-3.5 font-semibold text-white shadow-lg transition hover:bg-cupid-pinkDark disabled:opacity-70"
          >
            <span className="text-xl" aria-hidden>♥</span>
            {finalMatchRequested ? "매칭중" : "최종 매칭 신청하기"}
          </button>
        )}
      </div>
    </div>
  );
}

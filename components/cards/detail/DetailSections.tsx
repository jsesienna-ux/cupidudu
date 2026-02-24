"use client";

import { motion } from "framer-motion";
import type { Profile } from "./types";

type Props = {
  profile: Profile;
  status: string;
};

export function DetailSections({ profile, status }: Props) {
  const p = profile;
  return (
    <div className="space-y-6 px-4 py-6">
      {p.greeting && (
        <motion.section
          key={`greeting-${status}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <h2 className="text-xs font-semibold uppercase tracking-wider text-cupid-pink/80">한마디</h2>
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
          <h2 className="text-xs font-semibold uppercase tracking-wider text-cupid-pink/80">소개</h2>
          <p className="mt-2 whitespace-pre-line rounded-xl border border-cupid-pinkSoft/50 bg-white px-4 py-4 text-[15px] leading-relaxed text-gray-700">
            {p.introduction}
          </p>
        </motion.section>
      )}
    </div>
  );
}

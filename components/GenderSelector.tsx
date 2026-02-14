"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

type Gender = "male" | "female";

export function GenderSelector({
  initialGender,
  userId,
}: {
  initialGender: Gender | null;
  userId: string;
}) {
  const [gender, setGender] = useState<Gender | null>(initialGender);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setGender(initialGender);
  }, [initialGender]);

  const handleChange = async (value: Gender) => {
    setGender(value);
    setSaving(true);
    setSaved(false);
    try {
      const supabase = createClient();
      const { error } = await supabase.rpc("set_user_gender", {
        p_user_id: userId,
        p_gender: value,
      });
      if (!error) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mt-6">
      <h2 className="mb-3 text-sm font-semibold text-gray-800">성별</h2>
      <p className="mb-3 text-xs text-cupid-gray">
        반대 성별 프로필만 카드함에 노출돼요 (여자회원 → 남자프로필, 남자회원 → 여자프로필)
      </p>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => handleChange("female")}
          disabled={saving}
          className={`flex-1 rounded-xl border-2 py-3 font-medium transition ${
            gender === "female"
              ? "border-cupid-pink bg-cupid-pinkSoft/50 text-cupid-pinkDark"
              : "border-cupid-pinkSoft/50 bg-white text-gray-600 hover:border-cupid-pinkSoft"
          }`}
        >
          여성
        </button>
        <button
          type="button"
          onClick={() => handleChange("male")}
          disabled={saving}
          className={`flex-1 rounded-xl border-2 py-3 font-medium transition ${
            gender === "male"
              ? "border-cupid-pink bg-cupid-pinkSoft/50 text-cupid-pinkDark"
              : "border-cupid-pinkSoft/50 bg-white text-gray-600 hover:border-cupid-pinkSoft"
          }`}
        >
          남성
        </button>
      </div>
      {saved && (
        <p className="mt-2 text-sm text-green-600">저장되었어요</p>
      )}
    </div>
  );
}

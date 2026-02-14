"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

type Profile = {
  full_name: string | null;
  age: number | null;
  contact: string | null;
  gender: string | null;
  job: string | null;
  introduction: string | null;
  greeting: string | null;
  image_url: string | null;
  mbti: string | null;
  company_name: string | null;
  residence: string | null;
  school_name: string | null;
  height_cm: number | null;
  weight_kg: number | null;
  hobbies: string | null;
  assets: string | null;
  personality: string | null;
};

export function ProfileEditForm({
  userId,
  initialProfile,
  userEmail,
}: {
  userId: string;
  initialProfile: Profile | null;
  userEmail: string;
}) {
  const [profile, setProfile] = useState<Profile>(
    initialProfile ?? {
      full_name: null,
      age: null,
      contact: null,
      gender: null,
      job: null,
      introduction: null,
      greeting: null,
      image_url: null,
      mbti: null,
      company_name: null,
      residence: null,
      school_name: null,
      height_cm: null,
      weight_kg: null,
      hobbies: null,
      assets: null,
      personality: null,
    }
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (initialProfile) setProfile(initialProfile);
  }, [initialProfile]);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      const supabase = createClient();

      const { error: profileError } = await supabase.from("user_profiles").upsert(
        {
          user_id: userId,
          ...profile,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );

      if (profileError) {
        console.error("Profile save error:", profileError);
        return;
      }

      if (profile.gender === "male" || profile.gender === "female") {
        await supabase.rpc("set_user_gender", {
          p_user_id: userId,
          p_gender: profile.gender,
        });
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  const update = (key: keyof Profile, value: string | number | null) => {
    setProfile((p) => ({ ...p, [key]: value }));
  };

  return (
    <div className="space-y-6">
      <section>
        <h2 className="mb-3 text-sm font-semibold text-gray-800">기본 정보</h2>
        <div className="space-y-3 rounded-xl bg-cupid-pinkSoft/20 p-4">
          <p className="text-sm text-cupid-gray">이메일: {userEmail}</p>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">이름</label>
            <input
              type="text"
              value={profile.full_name ?? ""}
              onChange={(e) => update("full_name", e.target.value || null)}
              placeholder="이름"
              className="w-full rounded-lg border border-cupid-pinkSoft bg-white px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">나이</label>
            <input
              type="number"
              min={1}
              max={120}
              value={profile.age ?? ""}
              onChange={(e) => update("age", e.target.value ? parseInt(e.target.value, 10) : null)}
              placeholder="25"
              className="w-full rounded-lg border border-cupid-pinkSoft bg-white px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">연락처</label>
            <input
              type="tel"
              value={profile.contact ?? ""}
              onChange={(e) => update("contact", e.target.value || null)}
              placeholder="010-1234-5678"
              className="w-full rounded-lg border border-cupid-pinkSoft bg-white px-3 py-2 text-sm"
            />
          </div>
          <GenderSelector
            initialGender={(profile.gender as "male" | "female") ?? null}
            onChange={(g) => update("gender", g)}
          />
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-gray-800">상세 정보</h2>
        <p className="mb-3 text-xs text-cupid-gray">
          매칭 시 상대방에게 보여질 프로필입니다. 자유롭게 작성해주세요.
        </p>
        <div className="space-y-3 rounded-xl bg-cupid-pinkSoft/20 p-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">한마디</label>
            <input
              type="text"
              value={profile.greeting ?? ""}
              onChange={(e) => update("greeting", e.target.value || null)}
              placeholder="안녕하세요!"
              className="w-full rounded-lg border border-cupid-pinkSoft bg-white px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">직업</label>
            <input
              type="text"
              value={profile.job ?? ""}
              onChange={(e) => update("job", e.target.value || null)}
              placeholder="직업"
              className="w-full rounded-lg border border-cupid-pinkSoft bg-white px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">MBTI</label>
            <input
              type="text"
              value={profile.mbti ?? ""}
              onChange={(e) => update("mbti", e.target.value || null)}
              placeholder="ENFP"
              className="w-full rounded-lg border border-cupid-pinkSoft bg-white px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">소개</label>
            <textarea
              value={profile.introduction ?? ""}
              onChange={(e) => update("introduction", e.target.value || null)}
              placeholder="자유롭게 소개해주세요"
              rows={4}
              className="w-full rounded-lg border border-cupid-pinkSoft bg-white px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">회사</label>
            <input
              type="text"
              value={profile.company_name ?? ""}
              onChange={(e) => update("company_name", e.target.value || null)}
              placeholder="회사명"
              className="w-full rounded-lg border border-cupid-pinkSoft bg-white px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">거주지</label>
            <input
              type="text"
              value={profile.residence ?? ""}
              onChange={(e) => update("residence", e.target.value || null)}
              placeholder="서울 강남"
              className="w-full rounded-lg border border-cupid-pinkSoft bg-white px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">학교</label>
            <input
              type="text"
              value={profile.school_name ?? ""}
              onChange={(e) => update("school_name", e.target.value || null)}
              placeholder="학교명"
              className="w-full rounded-lg border border-cupid-pinkSoft bg-white px-3 py-2 text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">키 (cm)</label>
              <input
                type="number"
                min={100}
                max={250}
                value={profile.height_cm ?? ""}
                onChange={(e) => update("height_cm", e.target.value ? parseInt(e.target.value, 10) : null)}
                placeholder="170"
                className="w-full rounded-lg border border-cupid-pinkSoft bg-white px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">몸무게 (kg)</label>
              <input
                type="number"
                min={30}
                max={200}
                value={profile.weight_kg ?? ""}
                onChange={(e) => update("weight_kg", e.target.value ? parseInt(e.target.value, 10) : null)}
                placeholder="65"
                className="w-full rounded-lg border border-cupid-pinkSoft bg-white px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">취미</label>
            <input
              type="text"
              value={profile.hobbies ?? ""}
              onChange={(e) => update("hobbies", e.target.value || null)}
              placeholder="독서, 영화감상"
              className="w-full rounded-lg border border-cupid-pinkSoft bg-white px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">성격</label>
            <input
              type="text"
              value={profile.personality ?? ""}
              onChange={(e) => update("personality", e.target.value || null)}
              placeholder="유머러스하고 활발해요"
              className="w-full rounded-lg border border-cupid-pinkSoft bg-white px-3 py-2 text-sm"
            />
          </div>
        </div>
      </section>

      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        className="w-full rounded-xl bg-cupid-pink py-3 font-semibold text-white shadow-md transition hover:bg-cupid-pinkDark disabled:opacity-60"
      >
        {saving ? "저장 중..." : "저장하기"}
      </button>
      {saved && <p className="text-center text-sm text-green-600">저장되었어요</p>}
    </div>
  );
}

function GenderSelector({
  initialGender,
  onChange,
}: {
  initialGender: "male" | "female" | null;
  onChange: (g: "male" | "female") => void;
}) {
  const [gender, setGender] = useState<"male" | "female" | null>(initialGender);
  useEffect(() => {
    setGender(initialGender);
  }, [initialGender]);
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-gray-600">성별</label>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => {
            setGender("female");
            onChange("female");
          }}
          className={`flex-1 rounded-lg border-2 py-2 text-sm font-medium ${
            gender === "female"
              ? "border-cupid-pink bg-cupid-pinkSoft/50 text-cupid-pinkDark"
              : "border-cupid-pinkSoft/50 bg-white text-gray-600"
          }`}
        >
          여성
        </button>
        <button
          type="button"
          onClick={() => {
            setGender("male");
            onChange("male");
          }}
          className={`flex-1 rounded-lg border-2 py-2 text-sm font-medium ${
            gender === "male"
              ? "border-cupid-pink bg-cupid-pinkSoft/50 text-cupid-pinkDark"
              : "border-cupid-pinkSoft/50 bg-white text-gray-600"
          }`}
        >
          남성
        </button>
      </div>
    </div>
  );
}

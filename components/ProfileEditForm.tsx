"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const HIGHLIGHT_OPTIONS = [
  "금수저(집안자산 100억이상)",
  "연봉 1억이상",
  "연봉 7천이상",
  "연봉 2억이상",
  "자가보유",
  "인플루언서(10만이상)",
  "연예인/모델",
  "사업가(매출 20억이상)",
  "유학파",
] as const;
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_EXTENSIONS = ["jpg", "jpeg", "png", "webp"];

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
  approval_status?: string | null;
  membership_grade?: string | null;
  profile_status?: string | null;
  membership_level?: string | null;
};

export function ProfileEditForm({
  userId,
  initialProfile,
  userEmail,
  redirectAfterSave = false,
  onSaveSuccess,
}: {
  userId: string;
  initialProfile: Profile | null;
  userEmail: string;
  redirectAfterSave?: boolean;
  onSaveSuccess?: () => void;
}) {
  const router = useRouter();
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
  const [showReviewMessage, setShowReviewMessage] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [selectedHighlights, setSelectedHighlights] = useState<string[]>([]);
  const isApprovedProfile =
    profile.approval_status?.toUpperCase() === "APPROVED" ||
    profile.profile_status?.toUpperCase() === "APPROVED";
  const [requestSent, setRequestSent] = useState(false);

  useEffect(() => {
    if (initialProfile) {
      setProfile(initialProfile);
      setSelectedHighlights(
        (initialProfile.assets ?? "")
          .split(",")
          .map((v) => v.trim())
          .filter(Boolean)
      );
    }
  }, [initialProfile]);

  const handleSave = async () => {
    setFormError(null);
    if (!profile.height_cm || profile.height_cm < 100 || profile.height_cm > 250) {
      setFormError("키는 100~250cm 범위로 입력해주세요.");
      return;
    }

    if (!isApprovedProfile) {
      if (!profile.residence?.trim()) {
        setFormError("거주지는 필수 입력입니다.");
        return;
      }
      if (!profile.job?.trim()) {
        setFormError("직업은 필수 입력입니다.");
        return;
      }
      if (!profile.school_name?.trim()) {
        setFormError("학력은 필수 선택입니다.");
        return;
      }
      if (selectedHighlights.length === 0) {
        setFormError("해당되는 조건은 1개 이상 선택해주세요.");
        return;
      }
      if (!profile.image_url) {
        setFormError("사진 1장을 업로드해주세요.");
        return;
      }
    }

    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch("/api/profile/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profile: {
            full_name: profile.full_name,
            age: profile.age,
            contact: profile.contact,
            gender: profile.gender,
            job: profile.job,
            introduction: profile.introduction,
            greeting: profile.greeting,
            image_url: profile.image_url,
            mbti: profile.mbti,
            company_name: profile.company_name,
            residence: profile.residence,
            school_name: profile.school_name,
            height_cm: profile.height_cm,
            weight_kg: profile.weight_kg,
            hobbies: profile.hobbies,
            assets: selectedHighlights.join(", "),
            personality: profile.personality,
          },
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setFormError(data.message ?? "프로필 저장에 실패했습니다.");
        return;
      }
      
      setSaved(true);
      setFormError(null);
      onSaveSuccess?.();
      
      // 상세정보가 입력되었는지 확인 (정회원 인증 조건)
      const hasDetailedInfo = profile.introduction || profile.job;
      if (hasDetailedInfo) {
        setShowReviewMessage(true);
        
        // 상세정보 작성 페이지에서 온 경우 메인으로 리다이렉트
        if (redirectAfterSave) {
          setTimeout(() => {
            router.push("/");
            router.refresh();
          }, 2000);
          return;
        }
      }
      
      setTimeout(() => {
        setSaved(false);
        setShowReviewMessage(false);
      }, 5000);
    } finally {
      setSaving(false);
    }
  };

  const update = (key: keyof Profile, value: string | number | null) => {
    setProfile((p) => ({ ...p, [key]: value }));
  };

  const handleImageSelect = async (file: File | null) => {
    if (!file) return;
    const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
    if (!ALLOWED_IMAGE_EXTENSIONS.includes(extension)) {
      setUploadError("jpg, jpeg, png, webp 파일만 업로드할 수 있어요.");
      return;
    }
    if (!file.type.startsWith("image/")) {
      setUploadError("사진 파일만 업로드할 수 있어요.");
      return;
    }
    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      setUploadError("사진은 5MB 이하로 업로드해주세요.");
      return;
    }

    setUploadError(null);
    setUploadingImage(true);
    try {
      const base64DataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result ?? ""));
        reader.onerror = () => reject(new Error("이미지 읽기에 실패했습니다."));
        reader.readAsDataURL(file);
      });

      update("image_url", base64DataUrl);
    } catch {
      setUploadError("사진 업로드 중 오류가 발생했어요.");
    } finally {
      setUploadingImage(false);
    }
  };

  return (
    <div className="space-y-6">
      {isApprovedProfile && (
        <div className="flex items-center justify-between gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          <span>회원승인 완료 상태입니다. 수정을 원하시면 요청하기 버튼을 눌러주세요.</span>
          <button
            type="button"
            onClick={() => setRequestSent(true)}
            className="shrink-0 rounded-md border border-amber-300 bg-white px-2 py-1 text-xs font-medium text-amber-700 transition hover:bg-amber-100"
          >
            요청하기
          </button>
        </div>
      )}
      {requestSent && (
        <p className="text-xs text-cupid-gray">수정 요청이 접수되었습니다. 매니저 확인 후 안내드릴게요.</p>
      )}
      <div className="space-y-6">
      <section>
        <h2 className="mb-3 text-sm font-semibold text-gray-800">기본 정보</h2>
        <div className="space-y-3 rounded-xl bg-cupid-pinkSoft/20 p-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">이름</label>
            <input
              type="text"
              value={profile.full_name ?? ""}
              onChange={(e) => update("full_name", e.target.value || null)}
              placeholder="이름"
              disabled={isApprovedProfile}
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
              disabled={isApprovedProfile}
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
              disabled={isApprovedProfile}
              className="w-full rounded-lg border border-cupid-pinkSoft bg-white px-3 py-2 text-sm"
            />
          </div>
          <GenderSelector
            initialGender={(profile.gender as "male" | "female") ?? null}
            onChange={(g) => update("gender", g)}
            disabled={isApprovedProfile}
          />
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-gray-800">상세 정보</h2>
        <div className="space-y-3 rounded-xl bg-cupid-pinkSoft/20 p-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">
              거주지 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={profile.residence ?? ""}
              onChange={(e) => update("residence", e.target.value || null)}
              placeholder="서울 강남"
              disabled={isApprovedProfile}
              className="w-full rounded-lg border border-cupid-pinkSoft bg-white px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">
              직업 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={profile.job ?? ""}
              onChange={(e) => update("job", e.target.value || null)}
              placeholder="직업"
              disabled={isApprovedProfile}
              className="w-full rounded-lg border border-cupid-pinkSoft bg-white px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">회사명</label>
            <input
              type="text"
              value={profile.company_name ?? ""}
              onChange={(e) => update("company_name", e.target.value || null)}
              placeholder="회사명"
              disabled={isApprovedProfile}
              className="w-full rounded-lg border border-cupid-pinkSoft bg-white px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">
              학력 <span className="text-red-500">*</span>
            </label>
            <select
              value={profile.school_name ?? ""}
              onChange={(e) => update("school_name", e.target.value || null)}
              disabled={isApprovedProfile}
              className="w-full rounded-lg border border-cupid-pinkSoft bg-white px-3 py-2 text-sm"
            >
              <option value="">선택해주세요</option>
              <option value="고졸">고졸</option>
              <option value="전문대졸">전문대졸</option>
              <option value="학사졸">학사졸</option>
              <option value="석사졸">석사졸</option>
              <option value="박사졸">박사졸</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">
              키 (cm) <span className="text-red-500">*</span>
            </label>
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
            <label className="mb-1 block text-xs font-medium text-gray-600">MBTI (선택)</label>
            <input
              type="text"
              value={profile.mbti ?? ""}
              onChange={(e) => update("mbti", e.target.value || null)}
              placeholder="예: ENFP"
              className="w-full rounded-lg border border-cupid-pinkSoft bg-white px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-2 block text-xs font-medium text-gray-600">
              해당되는 것을 모두 선택해주세요 <span className="text-red-500">*</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {HIGHLIGHT_OPTIONS.map((option) => {
                const selected = selectedHighlights.includes(option);
                return (
                  <label
                    key={option}
                    className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1.5 text-xs ${
                      selected
                        ? "border-cupid-pink bg-cupid-pinkSoft/40 text-cupid-pinkDark"
                        : "border-cupid-pinkSoft bg-white text-gray-700"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selected}
                      disabled={isApprovedProfile}
                      onChange={(e) => {
                        setSelectedHighlights((prev) =>
                          e.target.checked ? [...prev, option] : prev.filter((v) => v !== option)
                        );
                      }}
                      className="h-3.5 w-3.5 accent-cupid-pink"
                    />
                    <span>{option}</span>
                  </label>
                );
              })}
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">
              사진 업로드 (1장) <span className="text-red-500">*</span>
            </label>
            <p className="mb-1 text-xs text-cupid-gray">
              과도한 보정, 얼굴가려진사진은 반려됨, 본인과 비슷한사진으로 넣어주세요.
            </p>
            <div className="space-y-2">
              {profile.image_url ? (
                <div className="overflow-hidden rounded-lg border border-cupid-pinkSoft bg-white p-2">
                  <img
                    src={profile.image_url}
                    alt="프로필 사진 미리보기"
                    className="h-44 w-full rounded-md object-cover"
                  />
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-cupid-pinkSoft bg-white px-3 py-8 text-center text-xs text-cupid-gray">
                  아직 업로드된 사진이 없어요
                </div>
              )}
              <input
                type="file"
                accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                disabled={isApprovedProfile}
                onChange={(e) => void handleImageSelect(e.target.files?.[0] ?? null)}
                className="w-full rounded-lg border border-cupid-pinkSoft bg-white px-3 py-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-cupid-pinkSoft/50 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-cupid-pinkDark"
              />
              {profile.image_url && (
                <button
                  type="button"
                  disabled={isApprovedProfile}
                  onClick={() => update("image_url", null)}
                  className="text-xs text-gray-500 underline-offset-2 hover:underline"
                >
                  사진 삭제
                </button>
              )}
              {uploadingImage && <p className="text-xs text-cupid-gray">사진 업로드 중...</p>}
              {uploadError && <p className="text-xs text-red-600">{uploadError}</p>}
            </div>
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
      </div>
      
      {/* 저장 완료 메시지 */}
      {formError && <p className="text-center text-sm text-red-600">{formError}</p>}
      {saved && !showReviewMessage && (
        <p className="text-center text-sm text-green-600">✓ 저장되었어요</p>
      )}
      
      {/* 정회원 인증 대기 메시지 */}
      {showReviewMessage && (
        <div className="rounded-xl border-2 border-cupid-pink bg-gradient-to-r from-cupid-pinkSoft/50 to-cupid-cream/50 p-4">
          <p className="mb-2 text-center font-semibold text-cupid-pinkDark">
            ✨ 프로필 등록이 완료되었습니다!
          </p>
          <p className="text-center text-sm text-gray-700">
            매니저가 검토 후 <strong>24시간 안</strong>으로 연락드리겠습니다
          </p>
          <p className="mt-2 text-center text-xs text-cupid-gray">
            🎉 오픈 할인: 첫 1회 만남 무료 진행 중!
          </p>
        </div>
      )}
    </div>
  );
}

function GenderSelector({
  initialGender,
  onChange,
  disabled = false,
}: {
  initialGender: "male" | "female" | null;
  onChange: (g: "male" | "female") => void;
  disabled?: boolean;
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
          disabled={disabled}
          onClick={() => {
            setGender("female");
            onChange("female");
          }}
          className={`flex-1 rounded-lg border-2 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-60 ${
            gender === "female"
              ? "border-cupid-pink bg-cupid-pinkSoft/50 text-cupid-pinkDark"
              : "border-cupid-pinkSoft/50 bg-white text-gray-600"
          }`}
        >
          여성
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() => {
            setGender("male");
            onChange("male");
          }}
          className={`flex-1 rounded-lg border-2 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-60 ${
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

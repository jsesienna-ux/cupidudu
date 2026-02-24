"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  MAX_IMAGE_SIZE_BYTES,
  ALLOWED_IMAGE_EXTENSIONS,
} from "@/lib/constants/images";

type Props = {
  initialProfile?: Record<string, unknown> | null;
};

export function OnboardingDetailsForm({ initialProfile }: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [residence, setResidence] = useState(String(initialProfile?.residence ?? ""));
  const [occupationGroup, setOccupationGroup] = useState(String(initialProfile?.occupation_group ?? initialProfile?.job ?? ""));
  const [educationLevel, setEducationLevel] = useState(String(initialProfile?.education_level ?? initialProfile?.school_name ?? ""));
  const [relationshipStatus, setRelationshipStatus] = useState(String(initialProfile?.relationship_status ?? ""));
  const [heightCm, setHeightCm] = useState(String(initialProfile?.height_cm ?? ""));
  const [bodyType, setBodyType] = useState(String(initialProfile?.body_type ?? ""));
  const [marriageTimeline, setMarriageTimeline] = useState(String(initialProfile?.marriage_timeline ?? ""));
  const INTEREST_OPTIONS = ["로테이션미팅", "단체모임 또는 네트워킹파티", "1:1 소개팅"] as const;
  const [interests, setInterests] = useState<string[]>(
    Array.isArray(initialProfile?.interests) ? (initialProfile?.interests as string[]) : []
  );
  const [interestOther, setInterestOther] = useState(String(initialProfile?.interest_other ?? ""));
  const [introduction, setIntroduction] = useState(String(initialProfile?.introduction ?? ""));
  const [spouseSummary, setSpouseSummary] = useState(String(initialProfile?.spouse_summary ?? initialProfile?.greeting ?? ""));
  const [facePhoto1, setFacePhoto1] = useState<string | null>(
    Array.isArray(initialProfile?.profile_images) && (initialProfile?.profile_images as string[])[0]
      ? String((initialProfile?.profile_images as string[])[0])
      : null
  );
  const [facePhoto2, setFacePhoto2] = useState<string | null>(
    Array.isArray(initialProfile?.profile_images) && (initialProfile?.profile_images as string[])[1]
      ? String((initialProfile?.profile_images as string[])[1])
      : null
  );
  const [fullBodyPhoto, setFullBodyPhoto] = useState<string | null>(
    Array.isArray(initialProfile?.profile_images) && (initialProfile?.profile_images as string[])[2]
      ? String((initialProfile?.profile_images as string[])[2])
      : null
  );

  const handleSingleFile = async (
    file: File | null,
    setter: (value: string | null) => void
  ) => {
    if (!file) return;
      const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
      if (!ALLOWED_IMAGE_EXTENSIONS.includes(extension)) {
        setError("jpg, jpeg, png, webp 파일만 업로드할 수 있어요.");
        return;
      }
      if (!file.type.startsWith("image/")) {
        setError("사진 파일만 업로드할 수 있어요.");
        return;
      }
      if (file.size > MAX_IMAGE_SIZE_BYTES) {
        setError("사진은 5MB 이하로 업로드해주세요.");
        return;
      }
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result ?? ""));
        reader.onerror = () => reject(new Error("이미지 읽기에 실패했습니다."));
        reader.readAsDataURL(file);
      });
      setter(dataUrl);
    setError(null);
  };

  const submit = async () => {
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const profileImages = [facePhoto1, facePhoto2, fullBodyPhoto].filter(Boolean) as string[];
      if (profileImages.length !== 3) {
        setError("얼굴 사진 2장과 전신 사진 1장을 모두 업로드해주세요.");
        return;
      }
      const res = await fetch("/api/onboarding/details/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          residence,
          occupation_group: occupationGroup,
          education_level: educationLevel,
          relationship_status: relationshipStatus,
          height_cm: Number(heightCm),
          body_type: bodyType,
          marriage_timeline: marriageTimeline,
          interests: [...interests, ...(interestOther.trim() ? [`기타: ${interestOther.trim()}`] : [])],
          introduction,
          spouse_summary: spouseSummary,
          profile_images: profileImages,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "제출 실패");
        return;
      }
      setMessage(data.message || "정회원 심사 중입니다. 승인 후 매칭이 가능합니다.");
      setTimeout(() => {
        router.push("/me");
        router.refresh();
      }, 1500);
    } catch (e) {
      setError(e instanceof Error ? e.message : "제출 실패");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-3xl space-y-5">
      <section className="rounded-xl bg-cupid-pinkSoft/20 p-4 sm:p-5">
        <h2 className="mb-3 text-base font-semibold text-gray-800">[1] 기본 정보</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="거주지역(시/구) *">
            <input value={residence} onChange={(e) => setResidence(e.target.value)} className="input" />
          </Field>
          <Field label="직업군 *">
            <select value={occupationGroup} onChange={(e) => setOccupationGroup(e.target.value)} className="input">
              <option value="">선택</option>
              <option value="회사원">회사원</option>
              <option value="전문직">전문직</option>
              <option value="자영업">자영업</option>
              <option value="공무원">공무원</option>
              <option value="프리랜서">프리랜서</option>
              <option value="기타">기타</option>
            </select>
          </Field>
          <Field label="학력수준 *">
            <select value={educationLevel} onChange={(e) => setEducationLevel(e.target.value)} className="input">
              <option value="">선택</option>
              <option value="고졸">고졸</option>
              <option value="전문대">전문대</option>
              <option value="대졸">대졸</option>
              <option value="대학원">대학원</option>
              <option value="기타">기타</option>
            </select>
          </Field>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs font-medium text-gray-600">나는 * </label>
            <div className="flex items-center gap-2">
              <select value={relationshipStatus} onChange={(e) => setRelationshipStatus(e.target.value)} className="input flex-1">
                <option value="">선택</option>
                <option value="싱글">싱글</option>
                <option value="돌싱(무자녀)">돌싱(무자녀)</option>
                <option value="돌싱(유자녀)">돌싱(유자녀)</option>
              </select>
              <span className="shrink-0 text-sm font-medium text-gray-700">입니다.</span>
            </div>
          </div>
          <Field label="키 *">
            <select value={heightCm} onChange={(e) => setHeightCm(e.target.value)} className="input">
              <option value="">선택</option>
              {Array.from({ length: 41 }, (_, idx) => 155 + idx).map((height) => (
                <option key={height} value={height}>
                  {height}
                </option>
              ))}
            </select>
          </Field>
          <Field label="체형 *">
            <select value={bodyType} onChange={(e) => setBodyType(e.target.value)} className="input">
              <option value="">선택</option>
              <option value="슬림">슬림</option>
              <option value="보통">보통</option>
              <option value="탄탄">탄탄</option>
              <option value="근육형">근육형</option>
              <option value="통통">통통</option>
            </select>
          </Field>
        </div>
      </section>

      <section className="rounded-xl bg-cupid-pinkSoft/20 p-4 sm:p-5">
        <h2 className="mb-3 text-base font-semibold text-gray-800">[2] 라이프스타일</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-xs font-medium text-gray-600">내가 관심있는 것은? *</label>
            <div className="space-y-2">
              {INTEREST_OPTIONS.map((option) => (
                <label key={option} className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={interests.includes(option)}
                    onChange={(e) => {
                      if (e.target.checked) setInterests((prev) => [...prev, option]);
                      else setInterests((prev) => prev.filter((v) => v !== option));
                    }}
                    className="h-4 w-4 rounded border-cupid-pinkSoft text-cupid-pink accent-cupid-pink"
                  />
                  {option}
                </label>
              ))}
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={interestOther.trim().length > 0}
                    readOnly
                    className="h-4 w-4 rounded border-cupid-pinkSoft text-cupid-pink accent-cupid-pink"
                  />
                  기타
                </label>
                <input
                  value={interestOther}
                  onChange={(e) => setInterestOther(e.target.value)}
                  placeholder="직접 입력"
                  className="input flex-1 text-sm"
                />
              </div>
            </div>
          </div>
          <Field label="결혼 희망 시기 *">
            <select value={marriageTimeline} onChange={(e) => setMarriageTimeline(e.target.value)} className="input">
              <option value="">선택</option>
              <option value="1년 내">1년 내</option>
              <option value="2년 내">2년 내</option>
              <option value="좋은 사람 있으면">좋은 사람 있으면</option>
              <option value="미정">미정</option>
            </select>
          </Field>
        </div>
      </section>

      <section className="rounded-xl bg-cupid-pinkSoft/20 p-4 sm:p-5">
        <h2 className="mb-3 text-base font-semibold text-gray-800">[3] 자기소개</h2>
        <Field label="300자 이상 자기소개 *">
          <textarea
            value={introduction}
            onChange={(e) => setIntroduction(e.target.value)}
            rows={4}
            className="input min-h-[88px] w-full"
            placeholder="최소 300자 이상 입력해주세요."
          />
        </Field>
        <p className="mt-1 text-xs text-gray-500">{introduction.length}자</p>
        <Field label="내가 원하는 배우자 한 줄 요약 *">
          <input value={spouseSummary} onChange={(e) => setSpouseSummary(e.target.value)} className="input" />
        </Field>
      </section>

      <section className="rounded-xl bg-cupid-pinkSoft/20 p-4 sm:p-5">
        <h2 className="mb-3 text-base font-semibold text-gray-800">[4] 사진 업로드</h2>
        <p className="mb-2 text-xs text-cupid-gray">
          사진은 상호 관심 및 매칭 결제 시에만 공개됩니다.
        </p>
        <p className="mb-2 text-xs text-gray-600">얼굴 잘 보이는 사진 2장 + 전신 사진 1장 필수 (각 5MB 이하)</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Field label="얼굴 사진 1 *">
            <input
              type="file"
              accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
              onChange={(e) => void handleSingleFile(e.target.files?.[0] ?? null, setFacePhoto1)}
              className="input file:mr-3 file:rounded-xl file:border file:border-cupid-pink/40 file:bg-cupid-pink/20 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-cupid-pinkDark file:shadow-md hover:file:bg-cupid-pink/30"
            />
          </Field>
          <Field label="얼굴 사진 2 *">
            <input
              type="file"
              accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
              onChange={(e) => void handleSingleFile(e.target.files?.[0] ?? null, setFacePhoto2)}
              className="input file:mr-3 file:rounded-xl file:border file:border-cupid-pink/40 file:bg-cupid-pink/20 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-cupid-pinkDark file:shadow-md hover:file:bg-cupid-pink/30"
            />
          </Field>
          <Field label="전신 사진 1 *">
            <input
              type="file"
              accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
              onChange={(e) => void handleSingleFile(e.target.files?.[0] ?? null, setFullBodyPhoto)}
              className="input file:mr-3 file:rounded-xl file:border file:border-cupid-pink/40 file:bg-cupid-pink/20 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-cupid-pinkDark file:shadow-md hover:file:bg-cupid-pink/30"
            />
          </Field>
        </div>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {facePhoto1 && (
            <Image src={facePhoto1} alt="얼굴 사진 1" width={150} height={96} className="h-24 w-full rounded-md object-cover" unoptimized />
          )}
          {facePhoto2 && (
            <Image src={facePhoto2} alt="얼굴 사진 2" width={150} height={96} className="h-24 w-full rounded-md object-cover" unoptimized />
          )}
          {fullBodyPhoto && (
            <Image src={fullBodyPhoto} alt="전신 사진" width={150} height={96} className="h-24 w-full rounded-md object-cover" unoptimized />
          )}
        </div>
      </section>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {message && <p className="text-sm text-green-700">{message}</p>}

      <button
        type="button"
        onClick={() => void submit()}
        disabled={saving}
        className="w-full rounded-xl bg-cupid-pink py-3 font-semibold text-white shadow-md transition hover:bg-cupid-pinkDark disabled:opacity-60"
      >
        {saving ? "제출 중..." : "제출하기"}
      </button>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-gray-600">{label}</label>
      {children}
    </div>
  );
}


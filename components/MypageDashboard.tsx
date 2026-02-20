"use client";

import { useState } from "react";
import { ProfileEditForm } from "@/components/profile/ProfileEditForm";
import { LogoutButton } from "@/components/auth/LogoutButton";

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
  username: string | null;
  email: string | null;
  approval_status?: string | null;
  membership_grade?: string | null;
  approved_at?: string | null;
  profile_status?: string | null;
  membership_level?: string | null;
};

type DeliveredCard = {
  id: string;
  card_id: string | null;
  created_at?: string | null;
  viewed_at?: string | null;
  is_read?: boolean | null;
};

export function MypageDashboard({
  userId,
  userEmail,
  profile,
  deliveredCards,
}: {
  userId: string;
  userEmail: string;
  profile: Profile | null;
  deliveredCards: DeliveredCard[];
}) {
  const [showProfileEdit, setShowProfileEdit] = useState(false);

  const mapLevelToGrade = (level?: string | null): string | null => {
    if (!level) return null;
    if (level === "VIP") return "VIP회원";
    if (level === "VERIFIED") return "우수회원";
    if (level === "REGULAR") return "정회원";
    return null;
  };

  const genderEmoji = profile?.gender === "female" ? "👩" : profile?.gender === "male" ? "👨" : "🧑";
  const displayName = profile?.full_name || "회원";
  const initialHasDetailedProfile = Boolean(profile && (profile.introduction || profile.job || profile.greeting));
  const [hasDetailedProfile, setHasDetailedProfile] = useState(initialHasDetailedProfile);
  const approvalStatus = profile?.approval_status ?? profile?.profile_status ?? null;
  const membershipGrade = profile?.membership_grade ?? mapLevelToGrade(profile?.membership_level) ?? null;
  const isApproved = approvalStatus?.toUpperCase() === "APPROVED";

  return (
    <div className="space-y-6">
      {/* 헤더: 사용자 정보 */}
      <section className="rounded-2xl border border-cupid-pinkSoft bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              {displayName}님 {genderEmoji}
              {isApproved && (
                <span className="ml-2 inline-block rounded-full bg-green-100 px-2.5 py-1 align-middle text-xs font-semibold text-green-700">
                  {membershipGrade || "정회원"}
                </span>
              )}
            </h1>
            {profile?.username && (
              <p className="mt-1 text-sm text-cupid-gray">@{profile.username}</p>
            )}
          </div>
          <button
            onClick={() => setShowProfileEdit(!showProfileEdit)}
            className="rounded-lg border-2 border-cupid-pink bg-cupid-pinkSoft/30 px-4 py-2 text-sm font-semibold text-cupid-pinkDark transition hover:bg-cupid-pinkSoft"
          >
            {showProfileEdit ? "프로필 닫기" : "내정보"}
          </button>
        </div>
      </section>

      {/* 프로필 편집 섹션 (토글) */}
      {showProfileEdit && (
        <section className="rounded-2xl border border-cupid-pinkSoft bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-bold text-gray-800">프로필 편집</h2>
          <ProfileEditForm
            userId={userId}
            initialProfile={profile}
            userEmail={userEmail}
            onSaveSuccess={() => setHasDetailedProfile(true)}
          />
        </section>
      )}

      {/* 매칭 현황 대시보드 */}
      <section className="rounded-2xl border border-cupid-pinkSoft bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-bold text-gray-800">📬 매칭 현황</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-lg bg-cupid-cream/50 p-4 text-center">
            <p className="text-sm text-cupid-gray">도착한 카드</p>
            <p className="mt-1 text-2xl font-bold text-cupid-pinkDark">{deliveredCards.length}</p>
          </div>
          <div className="rounded-lg bg-cupid-cream/50 p-4 text-center">
            <p className="text-sm text-cupid-gray">새로운 카드</p>
            <p className="mt-1 text-2xl font-bold text-cupid-pinkDark">
              {deliveredCards.filter((c) => !c.is_read).length}
            </p>
          </div>
        </div>
      </section>

      {/* 매칭된 카드 목록 */}
      <section className="rounded-2xl border border-cupid-pinkSoft bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-bold text-gray-800">💌 매칭된 카드</h2>
        {deliveredCards.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-sm text-cupid-gray">아직 도착한 카드가 없어요</p>
            <p className="mt-2 text-xs text-cupid-gray">매칭이 되면 여기에 카드가 표시됩니다</p>
          </div>
        ) : (
          <div className="space-y-3">
            {deliveredCards.map((card) => (
              <div
                key={card.id}
                className="flex items-center justify-between rounded-lg border border-cupid-pinkSoft/50 bg-cupid-cream/30 p-4"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-cupid-pinkSoft/50 text-xl">
                    💝
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">
                      {card.is_read ? "확인한 카드" : "새로운 카드"}
                    </p>
                    <p className="text-xs text-cupid-gray">
                      {card.created_at
                        ? new Date(card.created_at).toLocaleDateString("ko-KR")
                        : "-"}
                    </p>
                  </div>
                </div>
                <a
                  href={`/cards/${card.id}`}
                  className="rounded-lg bg-cupid-pink px-3 py-1.5 text-xs font-medium text-white transition hover:bg-cupid-pinkDark"
                >
                  보기
                </a>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 스케줄/약속 섹션 */}
      <section className="rounded-2xl border border-cupid-pinkSoft bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-bold text-gray-800">📅 약속 및 일정</h2>
        <div className="space-y-3">
          {/* 임시 데이터 - 추후 실제 스케줄 테이블 연동 */}
          <div className="rounded-lg border border-cupid-pinkSoft/50 bg-cupid-cream/30 p-4">
            <p className="text-sm text-cupid-gray">예정된 약속이 없습니다</p>
            <p className="mt-1 text-xs text-cupid-gray">
              매칭 후 약속을 잡으면 여기에 표시됩니다
            </p>
          </div>
        </div>
      </section>

      {/* 진행상태 업데이트 */}
      {!isApproved && (
        <section className="rounded-2xl border border-cupid-pinkSoft bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-bold text-gray-800">🔄 진행 상태</h2>
          <div className="space-y-3">
            {hasDetailedProfile && (
              <div className="flex items-center justify-between rounded-lg bg-cupid-cream/50 p-3">
                <span className="text-sm text-gray-700">회원 승인 상태</span>
                <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700">
                  매니저 검토중
                </span>
              </div>
            )}
            <div className="flex items-center justify-between rounded-lg bg-cupid-cream/50 p-3">
              <span className="text-sm text-gray-700">프로필 작성 완료</span>
              <span
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  hasDetailedProfile
                    ? "bg-green-100 text-green-700"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                {hasDetailedProfile ? "✓ 완료" : "미완료"}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-cupid-cream/50 p-3">
              <span className="text-sm text-gray-700">기본 정보 입력</span>
              <span
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  profile?.full_name && profile?.gender
                    ? "bg-green-100 text-green-700"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                {profile?.full_name && profile?.gender ? "✓ 완료" : "미완료"}
              </span>
            </div>
          </div>
        </section>
      )}

      {/* 로그아웃 버튼 */}
      <div className="pt-4">
        <LogoutButton />
      </div>
    </div>
  );
}

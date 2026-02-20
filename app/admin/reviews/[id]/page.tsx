"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { isValidAdminToken } from "@/lib/admin";

type ReviewItem = {
  user_id: string;
  full_name: string | null;
  username: string | null;
  gender: string | null;
  age: number | null;
  residence: string | null;
  job: string | null;
  school_name: string | null;
  mbti: string | null;
  values_answers_summary: {
    count: number;
    latest: unknown[];
  };
  badges: unknown[];
  internal_scores: {
    manners_score?: number;
    photo_real_score?: number;
    manager_notes?: string;
  } | null;
  algorithm?: {
    total_score: number;
    profile_completeness_score: number;
    values_answer_score: number;
    values_keyword_score: number;
    internal_score: number;
    recommended_level: "REGULAR" | "VERIFIED" | "VIP";
    suggested_badges: string[];
  } | null;
};

const BADGE_OPTIONS: Array<{ code: string; label: string; category: string }> = [
  { code: "MARRIAGE_INTENT_1Y", label: "1년 내 결혼 의지", category: "결혼의지" },
  { code: "MARRIAGE_INTENT_2Y", label: "2년 내 결혼 의지", category: "결혼의지" },
  { code: "REMARRIAGE_READY", label: "재혼 준비 완료", category: "결혼의지" },
  { code: "VALUE_ACCEPT_CHILD", label: "자녀 수용 가능", category: "가치관" },
  { code: "VALUE_FINANCE_TRANSPARENT", label: "경제관 투명", category: "가치관" },
  { code: "VALUE_PARENT_INDEPENDENT", label: "부모 독립성 명확", category: "가치관" },
  { code: "VALUE_LONG_DISTANCE_OK", label: "장거리 가능", category: "가치관" },
  { code: "MANAGER_MEETING_DONE", label: "직접 미팅 완료", category: "매니저 추천" },
  { code: "MANAGER_MANNERS_TOP", label: "매너 점수 상위", category: "매니저 추천" },
  { code: "MANAGER_PHOTO_TOP", label: "실물 점수 상위", category: "매니저 추천" },
  { code: "PROFESSIONAL", label: "전문직", category: "전문직" },
  { code: "OVERSEAS_WORK", label: "해외근무", category: "전문직" },
  { code: "ENTREPRENEUR", label: "사업가", category: "전문직" },
  { code: "MASTER_PLUS", label: "석사 이상", category: "전문직" },
  { code: "POPULAR_REVIEW_GOOD", label: "후기 좋음", category: "인기" },
  { code: "POPULAR_MANNER_GOOD", label: "매너 좋음", category: "인기" },
  { code: "POPULAR_GENTLE_MAN", label: "다정한 에게남", category: "인기" },
  { code: "POPULAR_RELIABLE_MAN", label: "든든한 테토남", category: "인기" },
];

export default function AdminReviewDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [item, setItem] = useState<ReviewItem | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [membershipLevel, setMembershipLevel] = useState("REGULAR");
  const [rejectReason, setRejectReason] = useState("");
  const [badgeCode, setBadgeCode] = useState("");
  const [mannersScore, setMannersScore] = useState("80");
  const [photoScore, setPhotoScore] = useState("80");
  const [managerNotes, setManagerNotes] = useState("");

  const adminToken = useMemo(() => (typeof window !== "undefined" ? localStorage.getItem("admin_token") : null), []);

  useEffect(() => {
    if (!isValidAdminToken(adminToken)) {
      router.push("/admin/login");
      return;
    }
    fetch("/api/admin/review-queue", { headers: { "x-admin-token": adminToken || "" } })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "조회 실패");
        const found = (data.items || []).find((v: ReviewItem) => v.user_id === params.id) ?? null;
        setItem(found);
        if (found?.internal_scores) {
          setMannersScore(String(found.internal_scores.manners_score ?? 80));
          setPhotoScore(String(found.internal_scores.photo_real_score ?? 80));
          setManagerNotes(found.internal_scores.manager_notes ?? "");
        }
      })
      .catch((e: Error) => setMessage(e.message));
  }, [adminToken, params.id, router]);

  const post = async (url: string, body: Record<string, unknown>) => {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-admin-token": adminToken || "" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "처리 실패");
  };

  const badgeLabel = (code: string) =>
    BADGE_OPTIONS.find((v) => v.code === code)?.label ?? code;

  const grantSuggestedBadges = async () => {
    if (!item) {
      setMessage("데이터를 불러오지 못했습니다.");
      return;
    }
    const suggested = item.algorithm?.suggested_badges ?? [];
    if (suggested.length === 0) {
      setMessage("추천 배지가 없습니다.");
      return;
    }
    try {
      for (const code of suggested) {
        await post("/api/admin/badges/grant", { user_id: item.user_id, badge_code: code });
      }
      setMessage(`추천 배지 ${suggested.length}개 부여 완료`);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "추천 배지 부여 실패");
    }
  };

  if (!item) {
    return (
      <main className="min-h-dvh bg-gray-50 px-4 pb-12 pt-6">
        <div className="mx-auto max-w-3xl rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-gray-600">{message || "데이터를 불러오는 중..."}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-dvh bg-gray-50 px-4 pb-12 pt-6">
      <div className="mx-auto max-w-3xl space-y-4">
        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-bold text-gray-900">{item.full_name || "이름 미입력"}</h1>
          <p className="mt-2 text-sm text-gray-600">
            @{item.username || "-"} · {item.gender || "-"} · {item.age || "-"}세
          </p>
          <p className="text-sm text-gray-600">{item.residence || "-"}</p>
          <p className="mt-1 text-sm text-gray-600">
            직업: {item.job || "-"} / 학력: {item.school_name || "-"} / MBTI: {item.mbti || "-"}
          </p>
          <p className="mt-1 text-xs text-gray-500">설문 응답 수: {item.values_answers_summary?.count ?? 0}</p>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900">알고리즘 평가</h2>
          <p className="mt-1 text-xs text-gray-500">내부 점수 + 프로필 완성도 + 설문 응답 기반 자동 계산</p>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-5">
            <div className="rounded-lg bg-gray-50 p-3">
              <p className="text-xs text-gray-500">총점</p>
              <p className="text-lg font-bold text-gray-900">{item.algorithm?.total_score ?? 0}</p>
            </div>
            <div className="rounded-lg bg-gray-50 p-3">
              <p className="text-xs text-gray-500">내부점수</p>
              <p className="text-lg font-bold text-gray-900">{item.algorithm?.internal_score ?? 0}</p>
            </div>
            <div className="rounded-lg bg-gray-50 p-3">
              <p className="text-xs text-gray-500">프로필완성도</p>
              <p className="text-lg font-bold text-gray-900">{item.algorithm?.profile_completeness_score ?? 0}</p>
            </div>
            <div className="rounded-lg bg-gray-50 p-3">
              <p className="text-xs text-gray-500">설문응답</p>
              <p className="text-lg font-bold text-gray-900">{item.algorithm?.values_answer_score ?? 0}</p>
            </div>
            <div className="rounded-lg bg-gray-50 p-3">
              <p className="text-xs text-gray-500">가치관키워드</p>
              <p className="text-lg font-bold text-gray-900">{item.algorithm?.values_keyword_score ?? 0}</p>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-cupid-pinkSoft/50 px-3 py-1 text-xs font-semibold text-cupid-pinkDark">
              추천 등급: {item.algorithm?.recommended_level ?? "REGULAR"}
            </span>
            <button
              type="button"
              onClick={() => setMembershipLevel(item.algorithm?.recommended_level ?? "REGULAR")}
              className="rounded-lg border border-cupid-pinkSoft px-3 py-1.5 text-xs font-semibold text-cupid-pinkDark hover:bg-cupid-pinkSoft/30"
            >
              추천 등급으로 설정
            </button>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {(item.algorithm?.suggested_badges ?? []).map((code) => (
              <button
                key={code}
                type="button"
                onClick={() => setBadgeCode(code)}
                className="rounded-full border border-gray-300 bg-white px-3 py-1 text-xs text-gray-700 hover:border-cupid-pink hover:text-cupid-pinkDark"
              >
                {badgeLabel(code)}
              </button>
            ))}
            {(item.algorithm?.suggested_badges?.length ?? 0) === 0 && (
              <p className="text-xs text-gray-500">추천 배지가 없습니다.</p>
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900">승인/반려</h2>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <select
              value={membershipLevel}
              onChange={(e) => setMembershipLevel(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="REGULAR">정회원(REGULAR)</option>
              <option value="VERIFIED">인증회원(VERIFIED)</option>
              <option value="VIP">VIP</option>
            </select>
            <button
              type="button"
              onClick={async () => {
                try {
                  await post("/api/admin/approve", { user_id: item.user_id, membership_level: membershipLevel });
                  setMessage("승인 완료");
                } catch (e) {
                  setMessage(e instanceof Error ? e.message : "승인 실패");
                }
              }}
              className="rounded-lg bg-green-600 px-3 py-2 text-sm font-semibold text-white"
            >
              승인
            </button>
          </div>
          <div className="mt-3 flex gap-2">
            <input
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="반려 사유"
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
            <button
              type="button"
              onClick={async () => {
                try {
                  await post("/api/admin/reject", { user_id: item.user_id, rejected_reason: rejectReason });
                  setMessage("반려 처리 완료");
                } catch (e) {
                  setMessage(e instanceof Error ? e.message : "반려 실패");
                }
              }}
              className="rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white"
            >
              반려
            </button>
          </div>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900">배지 부여</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            <select
              value={badgeCode}
              onChange={(e) => setBadgeCode(e.target.value)}
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="">배지 선택</option>
              {BADGE_OPTIONS.map((badge) => (
                <option key={badge.code} value={badge.code}>
                  [{badge.category}] {badge.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={async () => {
                try {
                  if (!badgeCode) {
                    setMessage("배지를 선택해주세요.");
                    return;
                  }
                  await post("/api/admin/badges/grant", { user_id: item.user_id, badge_code: badgeCode });
                  setMessage("배지 부여 완료");
                } catch (e) {
                  setMessage(e instanceof Error ? e.message : "배지 부여 실패");
                }
              }}
              className="rounded-lg bg-cupid-pink px-3 py-2 text-sm font-semibold text-white"
            >
              부여
            </button>
            <button
              type="button"
              onClick={grantSuggestedBadges}
              className="rounded-lg border border-cupid-pinkSoft px-3 py-2 text-sm font-semibold text-cupid-pinkDark hover:bg-cupid-pinkSoft/30"
            >
              추천 배지 일괄 부여
            </button>
          </div>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900">내부 점수 (관리자 전용)</h2>
          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
            <input
              value={mannersScore}
              onChange={(e) => setMannersScore(e.target.value)}
              placeholder="매너 점수(0-100)"
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
            <input
              value={photoScore}
              onChange={(e) => setPhotoScore(e.target.value)}
              placeholder="실물 점수(0-100)"
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <textarea
            value={managerNotes}
            onChange={(e) => setManagerNotes(e.target.value)}
            placeholder="매니저 메모"
            className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            rows={4}
          />
          <button
            type="button"
            onClick={async () => {
              try {
                await post("/api/admin/internal-scores", {
                  user_id: item.user_id,
                  manners_score: Number(mannersScore),
                  photo_real_score: Number(photoScore),
                  manager_notes: managerNotes,
                });
                setMessage("내부 점수 저장 완료");
              } catch (e) {
                setMessage(e instanceof Error ? e.message : "내부 점수 저장 실패");
              }
            }}
            className="mt-2 rounded-lg bg-gray-900 px-3 py-2 text-sm font-semibold text-white"
          >
            저장
          </button>
        </section>

        {message && (
          <section className="rounded-xl bg-cupid-cream/50 px-4 py-3 text-sm text-cupid-pinkDark">{message}</section>
        )}
      </div>
    </main>
  );
}


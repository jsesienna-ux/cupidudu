"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { isValidAdminToken } from "@/lib/admin";

type DetailData = {
  profile: {
    user_id: string;
    full_name: string | null;
    username: string | null;
    gender: string | null;
    age: number | null;
    contact: string | null;
    email: string | null;
    image_url?: string | null;
    created_at: string | null;
    residence: string | null;
    job: string | null;
    school_name: string | null;
    mbti: string | null;
    introduction?: string | null;
    greeting?: string | null;
    approval_status: string | null;
    membership_grade: string | null;
    approved_at: string | null;
    profile_status: string | null;
    membership_level: string | null;
    submitted_at: string | null;
    rejected_reason: string | null;
  };
  internal_scores: {
    manners_score?: number | null;
    photo_real_score?: number | null;
    manager_notes?: string | null;
    last_reviewed_at?: string | null;
  } | null;
  values_answers: Array<{ question_id: string; answer: unknown; created_at: string }>;
  badges: Array<{
    badge_code: string;
    granted_at: string;
    badges?: { label?: string; category?: string; is_public?: boolean } | null;
  }>;
  history: Array<{
    id: string;
    action: string;
    created_at: string;
    metadata?: {
      event_type?: string;
      scheduled_at?: string | null;
      note?: string;
      [key: string]: unknown;
    } | null;
  }>;
  delivered_cards: Array<{
    id: string;
    card_id: string | null;
    status: string | null;
    created_at: string | null;
    viewed_at: string | null;
    is_read: boolean | null;
    manager_comment: string | null;
    meeting_at?: string | null;
    meeting_completed_at?: string | null;
  }>;
  algorithm: {
    total_score: number;
    profile_completeness_score: number;
    values_answer_score: number;
    values_keyword_score: number;
    internal_score: number;
    recommended_level: "REGULAR" | "VERIFIED" | "VIP";
    suggested_badges: string[];
  };
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

function toText(value: unknown): string {
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  if (Array.isArray(value)) return value.map((v) => toText(v)).join(" ");
  if (value && typeof value === "object") return JSON.stringify(value);
  return "";
}

function actionLabel(action: string): string {
  if (action === "GRANT_BADGE") return "배지 부여";
  if (action === "APPROVE_PROFILE") return "회원 승인";
  if (action === "REJECT_PROFILE") return "회원 반려";
  if (action === "UPDATE_INTERNAL_SCORE") return "내부 점수 업데이트";
  if (action === "MANAGER_HISTORY") return "매니저 히스토리";
  return action;
}

export default function AdminUserDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [data, setData] = useState<DetailData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [mannersScore, setMannersScore] = useState("80");
  const [photoScore, setPhotoScore] = useState("80");
  const [managerNotes, setManagerNotes] = useState("");
  const [historyType, setHistoryType] = useState("미팅");
  const [historyAt, setHistoryAt] = useState("");
  const [historyNote, setHistoryNote] = useState("");
  const [editingHistoryId, setEditingHistoryId] = useState<string | null>(null);
  const [editingType, setEditingType] = useState("미팅");
  const [editingAt, setEditingAt] = useState("");
  const [editingNote, setEditingNote] = useState("");
  const [meetingAtByCard, setMeetingAtByCard] = useState<Record<string, string>>({});

  const adminToken = useMemo(
    () => (typeof window !== "undefined" ? localStorage.getItem("admin_token") : null),
    []
  );

  useEffect(() => {
    if (!isValidAdminToken(adminToken)) {
      router.push("/admin/login");
      return;
    }

    fetch(`/api/admin/users/${params.id}`, {
      headers: { "x-admin-token": adminToken || "" },
    })
      .then(async (res) => {
        const body = await res.json();
        if (!res.ok) throw new Error(body.message || "상세 조회 실패");
        const detail = body as DetailData;
        setData(detail);
        if (detail.internal_scores) {
          setMannersScore(String(detail.internal_scores.manners_score ?? 80));
          setPhotoScore(String(detail.internal_scores.photo_real_score ?? 80));
          setManagerNotes(detail.internal_scores.manager_notes ?? "");
        }
        const initialMeetingAt: Record<string, string> = {};
        for (const card of detail.delivered_cards ?? []) {
          if (card.meeting_at) {
            initialMeetingAt[card.id] = new Date(card.meeting_at).toISOString().slice(0, 16);
          }
        }
        setMeetingAtByCard(initialMeetingAt);
      })
      .catch((e: Error) => setError(e.message));
  }, [adminToken, params.id, router]);

  const post = async (url: string, body: Record<string, unknown>) => {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-admin-token": adminToken || "" },
      body: JSON.stringify(body),
    });
    const payload = await res.json();
    if (!res.ok) throw new Error(payload.message || "처리 실패");
  };

  const statusLabel = (value: string | null | undefined): string => {
    const raw = (value || "").trim();
    const v = raw.toUpperCase();
    if (v === "DRAFT") return "초안";
    if (v === "PENDING") return "검토중";
    if (v === "APPROVED") return "승인완료";
    if (v === "REJECTED") return "반려";
    if (v === "SUSPENDED") return "중지";
    if (raw.toLowerCase() === "approved") return "승인완료";
    return value || "-";
  };

  const levelLabel = (value: string | null | undefined): string => {
    const v = (value || "").toUpperCase();
    if (v === "REGULAR") return "정회원";
    if (v === "VERIFIED") return "인증회원";
    if (v === "VIP") return "VIP";
    return value || "-";
  };

  const cardStatusLabel = (value: string | null | undefined): string => {
    const raw = (value || "").trim();
    const v = raw.toLowerCase();
    if (!raw) return "-";
    if (v === "pending") return "검토중";
    if (v === "paid") return "유료열람";
    if (v === "meeting_scheduled" || v === "appointment" || raw === "만남약속") return "만남약속";
    if (v === "meeting_done" || v === "completed" || raw === "만남완료") return "만남완료";
    return raw;
  };

  const grantBadge = async (code: string) => {
    try {
      await post("/api/admin/badges/grant", { user_id: p.user_id, badge_code: code });
      const selected = BADGE_OPTIONS.find((b) => b.code === code);
      setData((prev) => {
        if (!prev) return prev;
        const exists = prev.badges.some((b) => b.badge_code === code);
        if (exists) return prev;
        return {
          ...prev,
          badges: [
            {
              badge_code: code,
              granted_at: new Date().toISOString(),
              badges: {
                label: selected?.label ?? code,
                category: selected?.category ?? null,
                is_public: true,
              },
            },
            ...prev.badges,
          ],
        };
      });
      setMessage("배지 부여 완료");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "배지 부여 실패");
    }
  };

  const updateCardStatus = async (
    cardId: string,
    status: "pending" | "paid" | "meeting_scheduled" | "meeting_done"
  ) => {
    try {
      const meetingAtRaw = meetingAtByCard[cardId] || "";
      const meetingAtIso = meetingAtRaw ? new Date(meetingAtRaw).toISOString() : null;
      const res = await fetch(`/api/admin/cards/${cardId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-admin-token": adminToken || "",
        },
        body: JSON.stringify({
          status,
          meeting_at: status === "meeting_scheduled" ? meetingAtIso : null,
        }),
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.message || "카드 상태 변경 실패");

      setData((prev) =>
        prev
          ? {
              ...prev,
              delivered_cards: prev.delivered_cards.map((c) =>
                c.id === cardId
                  ? {
                      ...c,
                      status,
                      meeting_at: status === "meeting_scheduled" ? meetingAtIso : c.meeting_at,
                      meeting_completed_at:
                        status === "meeting_done" ? new Date().toISOString() : c.meeting_completed_at,
                    }
                  : c
              ),
            }
          : prev
      );
      setMessage("카드 상태 업데이트 완료");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "카드 상태 업데이트 실패");
    }
  };

  if (!data) {
    return (
      <main className="min-h-dvh bg-gray-50 px-4 pb-12 pt-6">
        <div className="mx-auto max-w-4xl rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-gray-600">{error || "회원 정보를 불러오는 중..."}</p>
        </div>
      </main>
    );
  }

  const p = data.profile;
  const answersText = data.values_answers.map((v) => toText(v.answer)).join(" ").toLowerCase();
  const mergedText =
    `${p.job || ""} ${p.school_name || ""} ${p.residence || ""} ${p.mbti || ""} ${answersText} ${managerNotes}`
      .toLowerCase()
      .trim();

  const has = (keywords: string[]) => keywords.some((k) => mergedText.includes(k));
  const manners = Number(mannersScore) || 0;
  const photo = Number(photoScore) || 0;
  const hasImage = Boolean(p.image_url);
  const hasResidence = Boolean(p.residence);
  const hasJob = Boolean(p.job);
  const hasSchool = Boolean(p.school_name);
  const hasMbti = Boolean(p.mbti);

  const badgeScores: Record<string, number> = {
    MARRIAGE_INTENT_1Y: has(["1년", "12개월", "빠른 결혼"]) ? 95 : has(["2년", "24개월"]) ? 60 : 30,
    MARRIAGE_INTENT_2Y: has(["2년", "24개월"]) ? 92 : has(["1년", "12개월"]) ? 70 : 35,
    REMARRIAGE_READY: has(["재혼"]) ? 95 : 20,
    VALUE_ACCEPT_CHILD: has(["자녀 가능", "자녀 수용", "아이 가능"]) ? 90 : 30,
    VALUE_FINANCE_TRANSPARENT: has(["경제관 투명", "재정 공유", "재무 공개"]) ? 90 : 35,
    VALUE_PARENT_INDEPENDENT: has(["부모 독립", "독립적", "분가"]) ? 88 : 35,
    VALUE_LONG_DISTANCE_OK: has(["장거리 가능", "원거리 가능", "롱디 가능"]) ? 88 : 35,
    MANAGER_MEETING_DONE: has(["직접 미팅", "미팅 완료", "대면 완료"]) ? 95 : 40,
    MANAGER_MANNERS_TOP: manners,
    MANAGER_PHOTO_TOP: photo,
    PROFESSIONAL: has(["전문직", "의사", "변호사", "회계사", "약사"]) || hasJob ? 80 : 30,
    OVERSEAS_WORK: has(["해외근무", "글로벌", "외국계"]) ? 90 : 20,
    ENTREPRENEUR: has(["사업", "대표", "창업"]) ? 92 : 20,
    MASTER_PLUS: /석사|박사|mba|master|phd/i.test(mergedText) || hasSchool ? 75 : 25,
    POPULAR_REVIEW_GOOD: has(["후기 좋", "리뷰 좋", "평가 좋"]) ? 88 : 30,
    POPULAR_MANNER_GOOD: manners >= 85 ? 92 : Math.max(30, manners),
    POPULAR_GENTLE_MAN: has(["다정", "스윗", "친절"]) ? 88 : 30,
    POPULAR_RELIABLE_MAN: has(["든든", "책임감", "테토남"]) ? 88 : 30,
  };

  const profileCompletenessBoost =
    (hasResidence ? 5 : 0) + (hasJob ? 5 : 0) + (hasSchool ? 5 : 0) + (hasMbti ? 5 : 0) + (hasImage ? 5 : 0);

  for (const code of Object.keys(badgeScores)) {
    badgeScores[code] = Math.min(100, badgeScores[code] + profileCompletenessBoost);
  }

  const badgesByCategory = BADGE_OPTIONS.reduce<Record<string, Array<{ code: string; label: string; score: number }>>>(
    (acc, b) => {
      if (!acc[b.category]) acc[b.category] = [];
      acc[b.category].push({ code: b.code, label: b.label, score: badgeScores[b.code] ?? 0 });
      return acc;
    },
    {}
  );

  const detailedInfoCompleted =
    Boolean(p.residence?.trim()) &&
    Boolean(p.job?.trim()) &&
    Boolean(p.school_name?.trim()) &&
    Boolean(p.image_url?.trim()) &&
    (Boolean(p.introduction?.trim()) || Boolean(p.greeting?.trim()));

  const within24hFreeEligible = (() => {
    if (!detailedInfoCompleted || !p.created_at || !p.submitted_at) return false;
    const created = new Date(p.created_at).getTime();
    const submitted = new Date(p.submitted_at).getTime();
    if (!Number.isFinite(created) || !Number.isFinite(submitted)) return false;
    return submitted - created <= 24 * 60 * 60 * 1000;
  })();

  const totalDeliveredCards = data.delivered_cards.length;
  const latestDeliveredAt = data.delivered_cards[0]?.created_at
    ? new Date(data.delivered_cards[0].created_at as string).getTime()
    : null;
  const noCardDays =
    latestDeliveredAt && Number.isFinite(latestDeliveredAt)
      ? Math.floor((Date.now() - latestDeliveredAt) / (1000 * 60 * 60 * 24))
      : null;

  const inactivityAlert =
    noCardDays === null
      ? "카드 전달 이력이 없습니다."
      : noCardDays >= 21
        ? "위험: 카드가 3주 이상 전달되지 않았습니다."
        : noCardDays >= 7
          ? "관심 알람: 카드가 1주 이상 전달되지 않았습니다."
          : null;

  const hasMeetingScheduled = data.delivered_cards.some((c) => {
    const raw = (c.status || "").toLowerCase();
    return raw === "meeting_scheduled" || raw === "appointment" || c.status === "만남약속";
  });

  const hasMeetingDone = data.delivered_cards.some((c) => {
    const raw = (c.status || "").toLowerCase();
    return raw === "meeting_done" || raw === "completed" || c.status === "만남완료";
  });

  return (
    <main className="min-h-dvh bg-gray-50 px-4 pb-12 pt-6">
      <div className="mx-auto max-w-4xl space-y-4">
        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold text-gray-900">{p.full_name || "이름 미입력"}</h1>
                {data.badges.slice(0, 6).map((b) => (
                  <span
                    key={`${b.badge_code}-${b.granted_at}`}
                    className="rounded-full border border-cupid-pinkSoft px-2.5 py-0.5 text-[11px] font-medium text-cupid-pinkDark"
                  >
                    {b.badges?.label || b.badge_code}
                  </span>
                ))}
              </div>
              <p className="mt-1 text-sm text-gray-600">
                @{p.username || "-"} · {p.gender || "-"} · {p.age || "-"}세
              </p>
            </div>
            <Link
              href="/admin"
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              사용자 목록으로
            </Link>
          </div>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900">회원 알림/상태</h2>
          <div className="mt-3 grid grid-cols-1 gap-2">
            {within24hFreeEligible ? (
              <AlertChip tone="green" text="혜택: 회원가입 후 24시간 이내 상세정보 등록 완료 (첫 1회 만남 무료 대상)" />
            ) : (
              <AlertChip
                tone={detailedInfoCompleted ? "gray" : "amber"}
                text={
                  detailedInfoCompleted
                    ? "상세정보 등록 완료 (24시간 무료 혜택 대상 아님)"
                    : "상세정보 등록요망"
                }
              />
            )}

            {inactivityAlert && (
              <AlertChip
                tone={inactivityAlert.startsWith("위험") ? "red" : inactivityAlert.startsWith("관심") ? "amber" : "gray"}
                text={inactivityAlert}
              />
            )}

            {hasMeetingScheduled && <AlertChip tone="blue" text="매칭 상태: 만남약속" />}
            {hasMeetingDone && <AlertChip tone="purple" text="매칭 상태: 만남완료 후기 제출 요망" />}
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Metric label="전달된 카드 수" value={totalDeliveredCards} />
            <Metric
              label="마지막 카드 전달일"
              value={data.delivered_cards[0]?.created_at ? new Date(data.delivered_cards[0].created_at).toLocaleDateString("ko-KR") : "-"}
            />
            <Metric label="매칭 히스토리 건수" value={data.delivered_cards.length} />
          </div>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900">회원 기본정보 (항목별)</h2>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <InfoCard label="이름" value={p.full_name} />
            <InfoCard label="아이디" value={p.username ? `@${p.username}` : null} />
            <InfoCard label="성별" value={p.gender} />
            <InfoCard label="나이" value={p.age ? `${p.age}세` : null} />
            <InfoCard label="연락처" value={p.contact} />
            <InfoCard label="이메일" value={p.email} />
            <InfoCard label="거주지" value={p.residence} />
            <InfoCard label="직업" value={p.job} />
            <InfoCard label="학력" value={p.school_name} />
            <InfoCard label="MBTI" value={p.mbti} />
            <InfoCard label="가입일" value={p.created_at ? new Date(p.created_at).toLocaleString("ko-KR") : null} />
            <InfoCard label="제출일" value={p.submitted_at ? new Date(p.submitted_at).toLocaleString("ko-KR") : null} />
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900">히스토리</h2>
            <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-lg bg-gray-50 px-3 py-2">
                상태: <strong>{statusLabel(p.profile_status ?? p.approval_status)}</strong>
              </div>
              <div className="rounded-lg bg-gray-50 px-3 py-2">
                회원등급: <strong>{levelLabel(p.membership_level || p.membership_grade)}</strong>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
              <select
                value={historyType}
                onChange={(e) => setHistoryType(e.target.value)}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="미팅">미팅</option>
                <option value="전화통화">전화통화</option>
                <option value="카톡">카톡</option>
                <option value="문자">문자</option>
                <option value="기타">기타</option>
              </select>
              <input
                type="datetime-local"
                value={historyAt}
                onChange={(e) => setHistoryAt(e.target.value)}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
              <button
                type="button"
                onClick={async () => {
                  try {
                    await post(`/api/admin/users/${p.user_id}/history`, {
                      event_type: historyType,
                      scheduled_at: historyAt ? new Date(historyAt).toISOString() : null,
                      note: historyNote,
                    });
                    const item = {
                      id: `local-${Date.now()}`,
                      action: "MANAGER_HISTORY",
                      created_at: new Date().toISOString(),
                      metadata: {
                        event_type: historyType,
                        scheduled_at: historyAt ? new Date(historyAt).toISOString() : null,
                        note: historyNote,
                      },
                    };
                    setData((prev) => (prev ? { ...prev, history: [item, ...prev.history] } : prev));
                    setHistoryNote("");
                    setMessage("히스토리 저장 완료");
                  } catch (e) {
                    setMessage(e instanceof Error ? e.message : "히스토리 저장 실패");
                  }
                }}
                className="rounded-lg bg-cupid-pink px-3 py-2 text-sm font-semibold text-white"
              >
                히스토리 저장
              </button>
            </div>
            <textarea
              value={historyNote}
              onChange={(e) => setHistoryNote(e.target.value)}
              placeholder="매니저가 남길 메모 (미팅/전화통화 내용 등)"
              rows={3}
              className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />

            <div className="mt-3 max-h-56 space-y-2 overflow-auto pr-1">
              {data.history.length === 0 && <p className="text-xs text-gray-500">히스토리 없음</p>}
              {data.history.map((h) => (
                <div key={h.id} className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-xs font-semibold text-gray-800">
                      {(h.metadata?.event_type as string) || actionLabel(h.action)}
                    </p>
                    <p className="text-[11px] text-gray-500">
                      {h.metadata?.scheduled_at
                        ? `일정: ${new Date(String(h.metadata.scheduled_at)).toLocaleString("ko-KR")}`
                        : new Date(h.created_at).toLocaleString("ko-KR")}
                    </p>
                  </div>
                  <p className="mt-1 text-xs text-gray-700">{(h.metadata?.note as string) || "-"}</p>
                  {h.action === "MANAGER_HISTORY" && (
                    <div className="mt-2 flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingHistoryId(h.id);
                          setEditingType((h.metadata?.event_type as string) || "기타");
                          setEditingAt(
                            h.metadata?.scheduled_at
                              ? new Date(String(h.metadata.scheduled_at)).toISOString().slice(0, 16)
                              : ""
                          );
                          setEditingNote((h.metadata?.note as string) || "");
                        }}
                        className="rounded-md border border-gray-300 px-2 py-1 text-[11px] text-gray-700 hover:bg-white"
                      >
                        수정
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            await fetch(`/api/admin/users/${p.user_id}/history/${h.id}`, {
                              method: "DELETE",
                              headers: { "x-admin-token": adminToken || "" },
                            }).then(async (res) => {
                              const payload = await res.json();
                              if (!res.ok) throw new Error(payload.message || "히스토리 삭제 실패");
                            });
                            setData((prev) =>
                              prev ? { ...prev, history: prev.history.filter((item) => item.id !== h.id) } : prev
                            );
                            setMessage("히스토리 삭제 완료");
                          } catch (e) {
                            setMessage(e instanceof Error ? e.message : "히스토리 삭제 실패");
                          }
                        }}
                        className="rounded-md border border-red-300 px-2 py-1 text-[11px] text-red-600 hover:bg-red-50"
                      >
                        삭제
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {editingHistoryId && (
              <div className="mt-3 rounded-lg border border-cupid-pinkSoft bg-cupid-cream/40 p-3">
                <p className="text-xs font-semibold text-cupid-pinkDark">히스토리 수정</p>
                <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-3">
                  <select
                    value={editingType}
                    onChange={(e) => setEditingType(e.target.value)}
                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  >
                    <option value="미팅">미팅</option>
                    <option value="전화통화">전화통화</option>
                    <option value="카톡">카톡</option>
                    <option value="문자">문자</option>
                    <option value="기타">기타</option>
                  </select>
                  <input
                    type="datetime-local"
                    value={editingAt}
                    onChange={(e) => setEditingAt(e.target.value)}
                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          await fetch(`/api/admin/users/${p.user_id}/history/${editingHistoryId}`, {
                            method: "PATCH",
                            headers: {
                              "Content-Type": "application/json",
                              "x-admin-token": adminToken || "",
                            },
                            body: JSON.stringify({
                              event_type: editingType,
                              scheduled_at: editingAt ? new Date(editingAt).toISOString() : null,
                              note: editingNote,
                            }),
                          }).then(async (res) => {
                            const payload = await res.json();
                            if (!res.ok) throw new Error(payload.message || "히스토리 수정 실패");
                          });
                          setData((prev) =>
                            prev
                              ? {
                                  ...prev,
                                  history: prev.history.map((item) =>
                                    item.id === editingHistoryId
                                      ? {
                                          ...item,
                                          metadata: {
                                            ...(item.metadata || {}),
                                            event_type: editingType,
                                            scheduled_at: editingAt
                                              ? new Date(editingAt).toISOString()
                                              : null,
                                            note: editingNote,
                                          },
                                        }
                                      : item
                                  ),
                                }
                              : prev
                          );
                          setEditingHistoryId(null);
                          setMessage("히스토리 수정 완료");
                        } catch (e) {
                          setMessage(e instanceof Error ? e.message : "히스토리 수정 실패");
                        }
                      }}
                      className="rounded-lg bg-cupid-pink px-3 py-2 text-sm font-semibold text-white"
                    >
                      저장
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingHistoryId(null)}
                      className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      취소
                    </button>
                  </div>
                </div>
                <textarea
                  value={editingNote}
                  onChange={(e) => setEditingNote(e.target.value)}
                  rows={3}
                  placeholder="수정할 히스토리 메모"
                  className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900">매니저 평가 메모</h2>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <input
                value={mannersScore}
                onChange={(e) => setMannersScore(e.target.value)}
                placeholder="매너 점수(0~100)"
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
              <input
                value={photoScore}
                onChange={(e) => setPhotoScore(e.target.value)}
                placeholder="실물 점수(0~100)"
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
            <textarea
              value={managerNotes}
              onChange={(e) => setManagerNotes(e.target.value)}
              placeholder="매니저 평가 메모를 입력하세요."
              rows={4}
              className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
            <button
              type="button"
              onClick={async () => {
                try {
                  await post("/api/admin/internal-scores", {
                    user_id: p.user_id,
                    manners_score: Number(mannersScore),
                    photo_real_score: Number(photoScore),
                    manager_notes: managerNotes,
                  });
                  setMessage("매니저 평가 메모 저장 완료");
                } catch (e) {
                  setMessage(e instanceof Error ? e.message : "메모 저장 실패");
                }
              }}
              className="mt-2 rounded-lg bg-gray-900 px-3 py-2 text-sm font-semibold text-white"
            >
              메모 저장
            </button>
          </div>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900">전달된 카드 기반 매칭 히스토리</h2>
          <div className="mt-3 space-y-2">
            {data.delivered_cards.length === 0 && (
              <p className="text-sm text-gray-500">전달된 카드/매칭 이력이 없습니다.</p>
            )}
            {data.delivered_cards.map((card) => (
              <div key={card.id} className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-gray-800">
                    카드 #{card.id.slice(0, 8)}
                  </p>
                  <span className="rounded-full bg-white px-2 py-0.5 text-xs text-gray-700">
                    {cardStatusLabel(card.status)}
                  </span>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  전달일: {card.created_at ? new Date(card.created_at).toLocaleString("ko-KR") : "-"} / 열람:{" "}
                  {card.is_read ? "완료" : "미열람"}
                </p>
                {card.manager_comment && (
                  <p className="mt-1 text-xs text-gray-700">매니저 코멘트: {card.manager_comment}</p>
                )}
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <input
                    type="datetime-local"
                    value={meetingAtByCard[card.id] || ""}
                    onChange={(e) =>
                      setMeetingAtByCard((prev) => ({ ...prev, [card.id]: e.target.value }))
                    }
                    className="rounded-md border border-gray-300 px-2 py-1 text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => void updateCardStatus(card.id, "meeting_scheduled")}
                    className="rounded-md border border-blue-300 px-2 py-1 text-xs text-blue-700 hover:bg-blue-50"
                  >
                    만남약속
                  </button>
                  <button
                    type="button"
                    onClick={() => void updateCardStatus(card.id, "meeting_done")}
                    className="rounded-md border border-purple-300 px-2 py-1 text-xs text-purple-700 hover:bg-purple-50"
                  >
                    만남완료
                  </button>
                  <button
                    type="button"
                    onClick={() => void updateCardStatus(card.id, "pending")}
                    className="rounded-md border border-amber-300 px-2 py-1 text-xs text-amber-700 hover:bg-amber-50"
                  >
                    검토중
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900">알고리즘 평가</h2>
          <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-6">
            <Metric label="총점" value={data.algorithm.total_score} />
            <Metric label="내부점수" value={data.algorithm.internal_score} />
            <Metric label="완성도" value={data.algorithm.profile_completeness_score} />
            <Metric label="설문점수" value={data.algorithm.values_answer_score} />
            <Metric label="키워드점수" value={data.algorithm.values_keyword_score} />
            <Metric label="추천등급" value={data.algorithm.recommended_level} />
          </div>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900">배지별 알고리즘 점수 그래프</h2>
          <p className="mt-1 text-xs text-gray-500">
            상세정보 입력값 + 설문/메모 키워드 + 내부 점수를 바탕으로 항목별 점수를 계산합니다.
          </p>
          <div className="mt-4 space-y-5">
            {Object.entries(badgesByCategory).map(([category, list]) => (
              <div key={category}>
                <h3 className="mb-2 text-sm font-semibold text-gray-800">{category}</h3>
                <div className="space-y-2">
                  {list.map((badge) => (
                    <div key={badge.code} className="rounded-lg border border-gray-100 p-3">
                      <div className="mb-1 flex items-center justify-between">
                        <span className="text-sm text-gray-700">{badge.label}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-cupid-pinkDark">{badge.score}점</span>
                          <button
                            type="button"
                            onClick={() => void grantBadge(badge.code)}
                            className="rounded-md border border-cupid-pinkSoft px-2 py-1 text-[11px] font-semibold text-cupid-pinkDark hover:bg-cupid-pinkSoft/30"
                          >
                            배지 부여
                          </button>
                        </div>
                      </div>
                      <div className="h-2.5 w-full rounded-full bg-gray-100">
                        <div
                          className="h-2.5 rounded-full bg-gradient-to-r from-cupid-pinkLight to-cupid-pinkDark"
                          style={{ width: `${badge.score}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900">보유 배지</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {data.badges.length === 0 && <p className="text-sm text-gray-500">배지 없음</p>}
            {data.badges.map((b) => (
              <span
                key={`${b.badge_code}-${b.granted_at}`}
                className="rounded-full border border-cupid-pinkSoft px-3 py-1 text-xs text-cupid-pinkDark"
              >
                {b.badges?.label || b.badge_code}
              </span>
            ))}
          </div>
        </section>

        {message && (
          <section className="rounded-xl bg-cupid-cream/50 px-4 py-3 text-sm text-cupid-pinkDark">
            {message}
          </section>
        )}
      </div>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg bg-gray-50 p-3">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-lg font-bold text-gray-900">{value}</p>
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string | number | null | undefined }) {
  return (
    <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="mt-1 text-sm font-semibold text-gray-900">{value || "-"}</p>
    </div>
  );
}

function AlertChip({
  tone,
  text,
}: {
  tone: "green" | "amber" | "red" | "blue" | "purple" | "gray";
  text: string;
}) {
  const toneClass =
    tone === "green"
      ? "bg-green-50 text-green-700 border-green-200"
      : tone === "amber"
        ? "bg-amber-50 text-amber-700 border-amber-200"
        : tone === "red"
          ? "bg-red-50 text-red-700 border-red-200"
          : tone === "blue"
            ? "bg-blue-50 text-blue-700 border-blue-200"
            : tone === "purple"
              ? "bg-purple-50 text-purple-700 border-purple-200"
              : "bg-gray-50 text-gray-700 border-gray-200";

  return (
    <div className={`rounded-lg border px-3 py-2 text-sm font-medium ${toneClass}`}>
      {text}
    </div>
  );
}


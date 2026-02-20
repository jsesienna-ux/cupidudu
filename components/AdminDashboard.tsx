"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type UserProfile = {
  user_id: string;
  full_name: string | null;
  gender: string | null;
  age: number | null;
  contact: string | null;
  email: string | null;
  username: string | null;
  created_at: string | null;
  residence?: string | null;
  job?: string | null;
  school_name?: string | null;
  mbti?: string | null;
  approval_status: string | null;
  membership_grade: string | null;
  approved_at: string | null;
  profile_status: string | null;
  membership_level: string | null;
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

type DeliveredCard = {
  id: string;
  user_id: string;
  card_id: string | null;
  status?: string | null;
  created_at?: string | null;
  viewed_at?: string | null;
  is_read?: boolean | null;
  meeting_at?: string | null;
  meeting_completed_at?: string | null;
};

type Stats = {
  totalUsers: number;
  totalCards: number;
  maleUsers: number;
  femaleUsers: number;
};

export function AdminDashboard({
  users,
  cards,
  stats,
}: {
  users: UserProfile[];
  cards: DeliveredCard[];
  stats: Stats;
}) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"overview" | "users" | "cards">("overview");
  const [searchTerm, setSearchTerm] = useState("");
  const [approvalFilter, setApprovalFilter] = useState<"all" | "pending" | "new" | "special">("pending");
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [userState, setUserState] = useState<UserProfile[]>(users);

  useEffect(() => {
    setUserState(users);
  }, [users]);

  const isPending = (u: UserProfile) =>
    (u.profile_status?.toUpperCase() !== "APPROVED" && u.approval_status?.toLowerCase() !== "approved");

  const isNewUser = (u: UserProfile) => {
    if (!u.created_at) return false;
    const createdAt = new Date(u.created_at).getTime();
    if (!Number.isFinite(createdAt)) return false;
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
    return Date.now() - createdAt <= sevenDaysMs;
  };

  const isSpecialUser = (u: UserProfile) =>
    u.membership_level === "VIP" ||
    u.membership_grade === "VIP회원" ||
    (u.algorithm?.suggested_badges?.length ?? 0) >= 2;

  const filteredUsers = userState
    .filter((user) =>
      approvalFilter === "pending"
        ? isPending(user)
        : approvalFilter === "new"
          ? isNewUser(user)
          : approvalFilter === "special"
            ? isSpecialUser(user)
            : true
    )
    .filter(
    (user) =>
      user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const mapLevelToGrade = (level?: string | null): string | null => {
    if (!level) return null;
    if (level === "VIP") return "VIP회원";
    if (level === "VERIFIED") return "우수회원";
    if (level === "REGULAR") return "정회원";
    return null;
  };

  const handleLogout = () => {
    localStorage.removeItem("admin_token");
    router.push("/admin/login");
  };

  const meetingCards = cards
    .filter((c) => c.status === "meeting_scheduled" && c.meeting_at)
    .sort((a, b) => new Date(a.meeting_at || 0).getTime() - new Date(b.meeting_at || 0).getTime());

  const monthLabel = `${calendarMonth.getFullYear()}년 ${calendarMonth.getMonth() + 1}월`;
  const firstWeekday = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1).getDay();
  const daysInMonth = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 0).getDate();
  const days: Array<number | null> = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (days.length % 7 !== 0) days.push(null);

  const meetingByDate = new Map<number, Array<{ card: DeliveredCard; userName: string }>>();
  for (const card of meetingCards) {
    if (!card.meeting_at) continue;
    const date = new Date(card.meeting_at);
    if (
      date.getFullYear() !== calendarMonth.getFullYear() ||
      date.getMonth() !== calendarMonth.getMonth()
    ) {
      continue;
    }
    const day = date.getDate();
    const user = userState.find((u) => u.user_id === card.user_id);
    const item = { card, userName: user?.full_name || "알 수 없음" };
    meetingByDate.set(day, [...(meetingByDate.get(day) ?? []), item]);
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">🛡️ 관계자 대시보드</h1>
            <p className="mt-2 text-sm text-gray-600">Cupidudu 관리자 페이지</p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/"
              className="rounded-lg border-2 border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
            >
              메인으로
            </Link>
            <button
              onClick={handleLogout}
              className="rounded-lg border-2 border-red-300 bg-white px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50"
            >
              로그아웃
            </button>
          </div>
        </div>
      </div>

      {/* 탭 메뉴 */}
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab("overview")}
            className={`flex-1 px-6 py-4 text-sm font-semibold transition ${
              activeTab === "overview"
                ? "border-b-2 border-cupid-pink text-cupid-pink"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            📊 통계 현황
          </button>
          <button
            onClick={() => setActiveTab("users")}
            className={`flex-1 px-6 py-4 text-sm font-semibold transition ${
              activeTab === "users"
                ? "border-b-2 border-cupid-pink text-cupid-pink"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            👥 사용자 관리
          </button>
          <button
            onClick={() => setActiveTab("cards")}
            className={`flex-1 px-6 py-4 text-sm font-semibold transition ${
              activeTab === "cards"
                ? "border-b-2 border-cupid-pink text-cupid-pink"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            💌 매칭 관리
          </button>
        </div>

        <div className="p-6">
          {/* 통계 현황 탭 */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* 통계 카드 */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-6">
                <div className="rounded-xl bg-gradient-to-br from-amber-50 to-amber-100 p-6">
                  <p className="text-sm font-medium text-amber-700">승인 대기</p>
                  <p className="mt-2 text-3xl font-bold text-amber-900">
                    {userState.filter(isPending).length}
                  </p>
                  <p className="mt-1 text-xs text-amber-600">매니저 검토 필요</p>
                </div>
                <div className="rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 p-6">
                  <p className="text-sm font-medium text-blue-700">새로운 회원</p>
                  <p className="mt-2 text-3xl font-bold text-blue-900">
                    {userState.filter(isNewUser).length}
                  </p>
                  <p className="mt-1 text-xs text-blue-600">최근 7일 가입</p>
                </div>
                <div className="rounded-xl bg-gradient-to-br from-purple-50 to-purple-100 p-6">
                  <p className="text-sm font-medium text-purple-700">특별코드 회원</p>
                  <p className="mt-2 text-3xl font-bold text-green-900">
                    {userState.filter(isSpecialUser).length}
                  </p>
                  <p className="mt-1 text-xs text-purple-600">VIP/추천배지 2개 이상</p>
                </div>
                <div className="rounded-xl bg-gradient-to-br from-green-50 to-green-100 p-6">
                  <p className="text-sm font-medium text-green-700">전체 회원</p>
                  <p className="mt-2 text-3xl font-bold text-green-900">{stats.totalUsers}</p>
                  <p className="mt-1 text-xs text-green-600">
                    남 {stats.maleUsers} / 여 {stats.femaleUsers}
                  </p>
                </div>
                <div className="rounded-xl bg-gradient-to-br from-pink-50 to-pink-100 p-6">
                  <p className="text-sm font-medium text-pink-700">전체 매칭</p>
                  <p className="mt-2 text-3xl font-bold text-pink-900">{stats.totalCards}</p>
                  <p className="mt-1 text-xs text-pink-600">
                    미확인 {cards.filter((c) => !c.is_read).length}
                  </p>
                </div>
                <div className="rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 p-6">
                  <p className="text-sm font-medium text-slate-700">승인 완료</p>
                  <p className="mt-2 text-3xl font-bold text-slate-900">
                    {userState.filter((u) => !isPending(u)).length}
                  </p>
                  <p className="mt-1 text-xs text-slate-600">검토 완료 회원</p>
                </div>
              </div>

              {/* 최근 활동 */}
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-6">
                <h3 className="mb-4 text-lg font-bold text-gray-900">📈 최근 활동</h3>
                <div className="space-y-3">
                  {cards.slice(0, 5).map((card) => {
                    const user = userState.find((u) => u.user_id === card.user_id);
                    return (
                      <div
                        key={card.id}
                        className="flex items-center justify-between rounded-lg bg-white p-3 shadow-sm"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cupid-pinkSoft text-lg">
                            💝
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {user?.full_name || "알 수 없음"}
                            </p>
                            <p className="text-xs text-gray-500">
                              {card.created_at
                                ? new Date(card.created_at).toLocaleString("ko-KR")
                                : "-"}
                            </p>
                          </div>
                        </div>
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-medium ${
                            card.is_read
                              ? "bg-gray-100 text-gray-600"
                              : "bg-green-100 text-green-700"
                          }`}
                        >
                          {card.is_read ? "확인됨" : "신규"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 미팅 일정 캘린더 */}
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-lg font-bold text-gray-900">🗓️ 미팅 일정 캘린더</h3>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setCalendarMonth(
                          new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1)
                        )
                      }
                      className="rounded-md border border-gray-300 px-2 py-1 text-xs text-gray-700 hover:bg-white"
                    >
                      이전달
                    </button>
                    <span className="min-w-[96px] text-center text-sm font-semibold text-gray-800">
                      {monthLabel}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setCalendarMonth(
                          new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1)
                        )
                      }
                      className="rounded-md border border-gray-300 px-2 py-1 text-xs text-gray-700 hover:bg-white"
                    >
                      다음달
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-gray-500">
                  {["일", "월", "화", "수", "목", "금", "토"].map((d) => (
                    <div key={d} className="py-1">
                      {d}
                    </div>
                  ))}
                </div>
                <div className="mt-1 grid grid-cols-7 gap-1">
                  {days.map((day, idx) => {
                    if (!day) {
                      return (
                        <div
                          key={`empty-${idx}`}
                          className="min-h-[84px] rounded-md border border-transparent bg-transparent"
                        />
                      );
                    }
                    const entries = meetingByDate.get(day) ?? [];
                    return (
                      <div
                        key={`day-${day}`}
                        className={`min-h-[84px] rounded-md border p-1.5 ${
                          entries.length > 0
                            ? "border-cupid-pinkSoft bg-white"
                            : "border-gray-200 bg-white/70"
                        }`}
                      >
                        <p className="text-xs font-semibold text-gray-700">{day}</p>
                        <div className="mt-1 space-y-1">
                          {entries.slice(0, 2).map(({ card, userName }) => (
                            <Link
                              key={card.id}
                              href={`/admin/users/${card.user_id}`}
                              className="block rounded bg-cupid-pinkSoft/40 px-1.5 py-0.5 text-[10px] text-cupid-pinkDark hover:bg-cupid-pinkSoft/60"
                              title={card.meeting_at ? new Date(card.meeting_at).toLocaleString("ko-KR") : ""}
                            >
                              {userName}
                            </Link>
                          ))}
                          {entries.length > 2 && (
                            <p className="text-[10px] text-gray-500">+{entries.length - 2}건</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {meetingCards.length === 0 && (
                  <p className="mt-3 text-sm text-gray-500">예약된 미팅 일정이 없습니다.</p>
                )}
              </div>
            </div>
          )}

          {/* 사용자 관리 탭 */}
          {activeTab === "users" && (
            <div className="space-y-4">
              {/* 검토 대상 / 새로운 / 특별코드 / 전체 필터 */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setApprovalFilter("pending")}
                  className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                    approvalFilter === "pending"
                      ? "bg-amber-500 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  승인 대기 ({userState.filter(isPending).length})
                </button>
                <button
                  type="button"
                  onClick={() => setApprovalFilter("new")}
                  className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                    approvalFilter === "new"
                      ? "bg-blue-500 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  새로운 회원 ({userState.filter(isNewUser).length})
                </button>
                <button
                  type="button"
                  onClick={() => setApprovalFilter("special")}
                  className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                    approvalFilter === "special"
                      ? "bg-purple-500 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  특별코드 회원 ({userState.filter(isSpecialUser).length})
                </button>
                <button
                  type="button"
                  onClick={() => setApprovalFilter("all")}
                  className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                    approvalFilter === "all"
                      ? "bg-cupid-pink text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  전체
                </button>
              </div>
              {/* 검색 */}
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="이름, 아이디, 이메일로 검색..."
                  className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-cupid-pink focus:outline-none focus:ring-2 focus:ring-cupid-pink/20"
                />
              </div>

              {/* 사용자 테이블 */}
              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">
                        이름
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">
                        성별
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">
                        가입일
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">
                        회원등급
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">
                        추천 배지
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">
                        총 알고리즘점수
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {filteredUsers.map((user) => (
                      <tr key={user.user_id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-900">
                          <Link
                            href={`/admin/users/${user.user_id}`}
                            className="font-semibold text-cupid-pinkDark underline-offset-2 hover:underline"
                          >
                            {user.full_name || "-"}
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {user.gender === "male" ? "👨 남성" : user.gender === "female" ? "👩 여성" : "-"}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-500">
                          {user.created_at
                            ? new Date(user.created_at).toLocaleDateString("ko-KR")
                            : "-"}
                        </td>
                        <td className="px-4 py-3 text-xs font-medium text-gray-700">
                          {user.membership_grade || mapLevelToGrade(user.membership_level) || "-"}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-600">
                          {user.algorithm?.suggested_badges?.length ?? 0}개
                        </td>
                        <td className="px-4 py-3 text-xs font-semibold text-gray-800">
                          {user.algorithm?.total_score ?? 0}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-center text-sm text-gray-500">
                총 {filteredUsers.length}명의 회원
              </p>
            </div>
          )}

          {/* 매칭 관리 탭 */}
          {activeTab === "cards" && (
            <div className="space-y-4">
              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">
                        받은 사람
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">
                        카드 ID
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">
                        도착 시간
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">
                        상태
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">
                        액션
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {cards.map((card) => {
                      const user = userState.find((u) => u.user_id === card.user_id);
                      return (
                        <tr key={card.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">
                            {user?.full_name || "알 수 없음"}
                          </td>
                          <td className="px-4 py-3 text-xs font-mono text-gray-500">
                            {card.card_id?.slice(0, 8) || "-"}
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-600">
                            {card.created_at
                              ? new Date(card.created_at).toLocaleString("ko-KR")
                              : "-"}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`rounded-full px-2 py-1 text-xs font-medium ${
                                card.is_read
                                  ? "bg-gray-100 text-gray-600"
                                  : "bg-green-100 text-green-700"
                              }`}
                            >
                              {card.is_read ? "확인됨" : "신규"}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <Link
                              href={`/cards/${card.id}`}
                              className="text-xs font-medium text-cupid-pink hover:underline"
                            >
                              상세보기
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <p className="text-center text-sm text-gray-500">
                총 {cards.length}개의 매칭 카드
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isValidAdminToken } from "@/lib/admin";
import { AdminDashboard } from "@/components/AdminDashboard";

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

export default function AdminPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [cards, setCards] = useState<DeliveredCard[]>([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalCards: 0,
    maleUsers: 0,
    femaleUsers: 0,
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function checkAuthAndLoadData() {
      const token = localStorage.getItem("admin_token");
      if (!isValidAdminToken(token)) {
        router.push("/admin/login");
        return;
      }

      try {
        const res = await fetch("/api/admin/users", {
          headers: { "x-admin-token": token || "" },
        });
        const data = await res.json();

        if (!res.ok) {
          setError(data.message ?? "데이터를 불러올 수 없습니다.");
          setLoading(false);
          return;
        }

        setUsers(data.users ?? []);
        setCards(data.cards ?? []);
        setStats(data.stats ?? { totalUsers: 0, totalCards: 0, maleUsers: 0, femaleUsers: 0 });
      } catch {
        setError("서버 연결에 실패했습니다.");
      } finally {
        setLoading(false);
      }
    }

    checkAuthAndLoadData();
  }, [router]);

  if (loading) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mb-4 text-4xl">🔄</div>
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </main>
    );
  }

  if (error) {
    const isFetchFailed = error.toLowerCase().includes("fetch failed");
    return (
      <main className="flex min-h-dvh items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md text-center">
          <div className="mb-4 text-4xl">⚠️</div>
          <p className="mb-4 text-gray-700">{error}</p>
          {isFetchFailed ? (
            <>
              <p className="text-sm text-gray-500">
                Supabase 연결에 실패했습니다. NEXT_PUBLIC_SUPABASE_URL 도메인 접속 가능 여부와 인터넷 연결을 확인해주세요.
              </p>
              <p className="mt-2 text-xs text-gray-400">
                .env.local 수정 후에는 Next.js 서버를 재시작해야 반영됩니다.
              </p>
            </>
          ) : (
            <>
              <p className="text-sm text-gray-500">
                데이터베이스 컬럼 오류 시 supabase/migrations/20260219_delivered_cards_created_at.sql 및
                supabase/migrations/20260219_delivered_cards_meeting_fields.sql을 Supabase SQL Editor에서 실행해주세요.
              </p>
              <p className="mt-2 text-xs text-gray-400">
                .env.local에 SUPABASE_SERVICE_ROLE_KEY가 설정되어 있는지 확인해주세요.
              </p>
            </>
          )}
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-dvh bg-gray-50 px-4 pb-12 pt-6">
      <div className="mx-auto max-w-7xl">
        <AdminDashboard users={users} cards={cards} stats={stats} />
      </div>
    </main>
  );
}

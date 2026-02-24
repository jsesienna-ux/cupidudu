"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isValidAdminToken } from "@/lib/admin";

type QueueItem = {
  user_id: string;
  full_name: string | null;
  username: string | null;
  submitted_at: string | null;
};

export default function AdminReviewsPage() {
  const router = useRouter();
  const [items, setItems] = useState<QueueItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("admin_token");
    if (!isValidAdminToken(token)) {
      router.push("/admin/login");
      return;
    }
    fetch("/api/admin/review-queue", { headers: { "x-admin-token": token || "" } })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "조회 실패");
        setItems(data.items || []);
      })
      .catch((e: Error) => setError(e.message));
  }, [router]);

  return (
    <main className="min-h-dvh bg-gray-50 px-4 pb-12 pt-6">
      <div className="mx-auto max-w-4xl space-y-4">
        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-bold text-gray-900">리뷰 큐</h1>
          <p className="mt-2 text-sm text-gray-600">PENDING 상태 회원을 검토합니다.</p>
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        </section>

        {items.map((item) => (
          <Link
            key={item.user_id}
            href={`/admin/reviews/${item.user_id}`}
            className="block rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:border-cupid-pink"
          >
            <p className="font-semibold text-gray-900">{item.full_name || "이름 미입력"}</p>
            <p className="mt-1 text-sm text-gray-600">@{item.username || "-"}</p>
            <p className="mt-1 text-xs text-gray-500">
              제출일: {item.submitted_at ? new Date(item.submitted_at).toLocaleString("ko-KR") : "-"}
            </p>
          </Link>
        ))}
      </div>
    </main>
  );
}


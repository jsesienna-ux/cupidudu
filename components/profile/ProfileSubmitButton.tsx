"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ProfileSubmitButton({ disabled }: { disabled?: boolean }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/profile/submit", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.message ?? "제출 실패");
        return;
      }
      setMessage("제출 완료: 매니저 검토 대기중");
      router.refresh();
    } catch {
      setMessage("제출 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleSubmit}
        disabled={loading || disabled}
        className="rounded-xl bg-cupid-pink px-4 py-2 text-sm font-semibold text-white transition hover:bg-cupid-pinkDark disabled:opacity-60"
      >
        {loading ? "제출 중..." : "프로필 제출하기"}
      </button>
      {message && <p className="text-xs text-cupid-gray">{message}</p>}
    </div>
  );
}


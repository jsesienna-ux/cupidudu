"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { toAuthEmail } from "@/lib/auth-username";

export default function ForgotPasswordPage() {
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const raw = username.trim();
    if (!raw) {
      setError("아이디를 입력해주세요.");
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const authEmail = toAuthEmail(raw);
      const { error: err } = await supabase.auth.resetPasswordForEmail(authEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (err) {
        setError(err.message);
        return;
      }
      setSent(true);
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm text-center">
          <h1 className="mb-2 text-2xl font-bold text-cupid-pinkDark">Cupidudu</h1>
          <div className="rounded-2xl border border-cupid-pinkSoft bg-white p-6 shadow-[0_4px_20px_rgba(255,107,157,0.12)]">
            <p className="mb-6 text-gray-700">
              비밀번호 재설정 링크를 발송했습니다.
              <br />
              <span className="text-sm text-cupid-gray">
                이메일을 확인해주세요. 받지 못하셨다면 스팸함을 확인하거나 고객센터로 문의해주세요.
              </span>
            </p>
            <Link href="/login" className="block w-full rounded-xl bg-cupid-pink py-3 font-semibold text-white transition hover:bg-cupid-pinkDark">
              로그인으로 돌아가기
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-10 text-center">
          <h1 className="text-3xl font-bold text-cupid-pinkDark">Cupidudu</h1>
          <p className="mt-2 text-sm text-cupid-gray">비밀번호를 잊으셨나요?</p>
        </div>

        <div className="rounded-2xl border border-cupid-pinkSoft bg-white p-6 shadow-[0_4px_20px_rgba(255,107,157,0.12)]">
          <h2 className="mb-6 text-lg font-semibold text-gray-800">비밀번호 찾기</h2>
          <p className="mb-4 text-sm text-cupid-gray">
            가입 시 사용한 아이디를 입력하시면 비밀번호 재설정 링크를 보내드립니다.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="username" className="mb-1.5 block text-sm font-medium text-gray-700">
                아이디
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="아이디 입력"
                required
                autoComplete="username"
                className="w-full rounded-xl border border-cupid-pinkSoft bg-cupid-cream/50 px-4 py-3 text-gray-800 placeholder:text-cupid-gray focus:border-cupid-pink focus:outline-none focus:ring-2 focus:ring-cupid-pink/20"
              />
            </div>

            {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-cupid-pink py-3 font-semibold text-white transition hover:bg-cupid-pinkDark disabled:opacity-60"
            >
              {loading ? "발송 중..." : "재설정 링크 받기"}
            </button>
          </form>

          <p className="mt-4 text-center text-sm text-cupid-gray">
            <Link href="/login" className="font-medium text-cupid-pink hover:underline">
              로그인으로 돌아가기
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}

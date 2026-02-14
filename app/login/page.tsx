"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toAuthEmail } from "@/lib/auth-username";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: toAuthEmail(username),
        password,
      });

      if (signInError) {
        setError("아이디 또는 비밀번호가 일치하지 않습니다.");
        return;
      }

      router.push("/");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-10 text-center">
          <h1 className="text-3xl font-bold text-cupid-pinkDark">
            Cupidudu
          </h1>
          <p className="mt-2 text-sm text-cupid-gray">
            오늘의 인연을 만나보세요
          </p>
        </div>

        <div className="rounded-2xl border border-cupid-pinkSoft bg-white p-6 shadow-[0_4px_20px_rgba(255,107,157,0.12)]">
          <h2 className="mb-6 text-lg font-semibold text-gray-800">
            로그인
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="username"
                className="mb-1.5 block text-sm font-medium text-gray-700"
              >
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

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label htmlFor="password" className="text-sm font-medium text-gray-700">
                  비밀번호
                </label>
                <Link href="/forgot-password" className="text-xs text-cupid-pink hover:underline">
                  비밀번호 찾기
                </Link>
              </div>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
                className="w-full rounded-xl border border-cupid-pinkSoft bg-cupid-cream/50 px-4 py-3 text-gray-800 placeholder:text-cupid-gray focus:border-cupid-pink focus:outline-none focus:ring-2 focus:ring-cupid-pink/20"
              />
            </div>

            {error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-cupid-pink py-3 font-semibold text-white shadow-md transition hover:bg-cupid-pinkDark disabled:opacity-60"
            >
              {loading ? "로그인 중..." : "로그인"}
            </button>
          </form>

          <p className="mt-4 text-center text-sm text-cupid-gray">
            계정이 없으신가요?{" "}
            <Link
              href="/signup"
              className="font-medium text-cupid-pink hover:underline"
            >
              회원가입
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}

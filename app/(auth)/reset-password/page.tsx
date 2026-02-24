"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { validatePassword } from "@/lib/password-validation";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setReady(!!session);
    });
  }, [supabase.auth]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const pwCheck = validatePassword(password);
    if (!pwCheck.valid) {
      setError(pwCheck.message ?? "비밀번호 형식이 올바르지 않아요.");
      return;
    }
    if (password !== passwordConfirm) {
      setError("비밀번호가 일치하지 않아요.");
      return;
    }

    setLoading(true);
    try {
      const { error: err } = await supabase.auth.updateUser({ password });
      if (err) {
        setError(err.message);
        return;
      }
      router.push("/");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  if (!ready) {
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm text-center">
          <h1 className="mb-4 text-2xl font-bold text-cupid-pinkDark">Cupidudu</h1>
          <p className="text-cupid-gray">유효한 링크가 아니거나 만료되었습니다.</p>
          <Link href="/forgot-password" className="mt-4 inline-block font-medium text-cupid-pink hover:underline">
            비밀번호 찾기 다시 시도
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-10 text-center">
          <h1 className="text-3xl font-bold text-cupid-pinkDark">Cupidudu</h1>
          <p className="mt-2 text-sm text-cupid-gray">새 비밀번호를 입력해주세요</p>
        </div>

        <div className="rounded-2xl border border-cupid-pinkSoft bg-white p-6 shadow-[0_4px_20px_rgba(255,107,157,0.12)]">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-gray-700">
                새 비밀번호
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="6자 이상, 영문·숫자·특수문자 포함"
                required
                minLength={6}
                autoComplete="new-password"
                className="w-full rounded-xl border border-cupid-pinkSoft bg-cupid-cream/50 px-4 py-3 text-gray-800 placeholder:text-cupid-gray focus:border-cupid-pink focus:outline-none focus:ring-2 focus:ring-cupid-pink/20"
              />
            </div>

            <div>
              <label htmlFor="passwordConfirm" className="mb-1.5 block text-sm font-medium text-gray-700">
                비밀번호 확인
              </label>
              <input
                id="passwordConfirm"
                type="password"
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                placeholder="비밀번호를 다시 입력해주세요"
                required
                autoComplete="new-password"
                className="w-full rounded-xl border border-cupid-pinkSoft bg-cupid-cream/50 px-4 py-3 text-gray-800 placeholder:text-cupid-gray focus:border-cupid-pink focus:outline-none focus:ring-2 focus:ring-cupid-pink/20"
              />
            </div>

            {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-cupid-pink py-3 font-semibold text-white transition hover:bg-cupid-pinkDark disabled:opacity-60"
            >
              {loading ? "저장 중..." : "비밀번호 변경"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}

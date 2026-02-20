"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toAuthEmail } from "@/lib/auth-username";

// 영어 에러 메시지를 한국어로 변환
function translateError(message: string): string {
  const errorMap: { [key: string]: string } = {
    "Invalid login credentials": "아이디 또는 비밀번호가 올바르지 않습니다.",
    "Email not confirmed": "이메일 인증이 완료되지 않았습니다.",
    "Email logins are disabled": "이메일 로그인이 비활성화되어 있습니다. 관리자에게 문의하세요.",
    "Invalid email": "올바르지 않은 이메일 형식입니다.",
    "User not found": "존재하지 않는 사용자입니다.",
    "Invalid password": "비밀번호가 올바르지 않습니다.",
  };

  // 정확히 일치하는 메시지 찾기
  if (errorMap[message]) {
    return errorMap[message];
  }

  // 부분 일치 검색
  for (const [eng, kor] of Object.entries(errorMap)) {
    if (message.toLowerCase().includes(eng.toLowerCase())) {
      return kor;
    }
  }

  return message;
}

export function LandingWithLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: toAuthEmail(username),
        password,
      });
      if (signInError) {
        setError(translateError(signInError.message));
        return;
      }
      router.push("/");
      router.refresh();
    } catch (err: unknown) {
      console.error("Login error:", err);
      const msg = err instanceof Error ? err.message : "로그인 중 오류가 발생했습니다.";
      setError(translateError(msg));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm text-center">
        <div className="mb-10">
          <h1 className="flex items-center justify-center gap-2 text-4xl font-bold text-cupid-pinkDark">
            <span>Cupidudu</span>
            <Link
              href="/admin"
              aria-label="관리자 페이지로 이동"
              className="text-cupid-pink transition hover:text-cupid-pinkDark"
            >
              ❤
            </Link>
          </h1>
          <p className="mt-3 text-base text-cupid-gray">오늘의 인연을 만나보세요</p>
        </div>

        <div className="rounded-2xl border border-cupid-pinkSoft bg-white p-6 shadow-[0_4px_20px_rgba(255,107,157,0.12)]">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="landing-username" className="mb-1.5 block text-left text-sm font-medium text-gray-700">
                아이디
              </label>
              <input
                id="landing-username"
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
                <label htmlFor="landing-password" className="text-sm font-medium text-gray-700">
                  비밀번호
                </label>
                <Link href="/forgot-password" className="text-xs text-cupid-pink hover:underline">
                  비밀번호 찾기
                </Link>
              </div>
              <input
                id="landing-password"
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
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
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
            <Link href="/signup" className="font-medium text-cupid-pink hover:underline">
              회원가입
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}

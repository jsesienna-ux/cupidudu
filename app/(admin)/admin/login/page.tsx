"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { verifyAdminLogin, createAdminToken } from "@/lib/admin";

export default function AdminLoginPage() {
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
      // 관리자 아이디/비밀번호 검증
      if (verifyAdminLogin(username, password)) {
        // 관리자 토큰 생성 및 저장
        const token = createAdminToken();
        localStorage.setItem("admin_token", token);
        
        // 관리자 페이지로 이동
        router.push("/admin");
        router.refresh();
      } else {
        setError("관리자 아이디 또는 비밀번호가 올바르지 않습니다.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 px-6 py-12">
      <div className="w-full max-w-sm">
        {/* 로고 */}
        <div className="mb-10 text-center">
          <div className="mb-4 text-6xl">🛡️</div>
          <h1 className="text-3xl font-bold text-white">
            관리자 로그인
          </h1>
          <p className="mt-2 text-sm text-gray-400">
            Cupidudu 관계자 전용 페이지
          </p>
        </div>

        {/* 로그인 카드 */}
        <div className="rounded-2xl border border-gray-700 bg-gray-800/50 p-6 shadow-xl backdrop-blur-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="username"
                className="mb-1.5 block text-sm font-medium text-gray-300"
              >
                관리자 아이디
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="관리자 아이디 입력"
                required
                autoComplete="username"
                className="w-full rounded-xl border border-gray-600 bg-gray-700/50 px-4 py-3 text-white placeholder:text-gray-500 focus:border-cupid-pink focus:outline-none focus:ring-2 focus:ring-cupid-pink/20"
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-1.5 text-sm font-medium text-gray-300 flex items-center justify-between">
                비밀번호
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
                className="w-full rounded-xl border border-gray-600 bg-gray-700/50 px-4 py-3 text-white placeholder:text-gray-500 focus:border-cupid-pink focus:outline-none focus:ring-2 focus:ring-cupid-pink/20"
              />
            </div>

            {error && (
              <p className="rounded-lg bg-red-900/30 border border-red-700 px-3 py-2 text-sm text-red-300">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-gradient-to-r from-cupid-pink to-cupid-pinkDark py-3 font-semibold text-white shadow-lg transition hover:shadow-xl disabled:opacity-60"
            >
              {loading ? "로그인 중..." : "관리자 로그인"}
            </button>
          </form>

          <div className="mt-6 space-y-2 text-center">
            <Link
              href="/login"
              className="block text-sm text-gray-400 hover:text-white transition"
            >
              ← 일반 로그인으로 돌아가기
            </Link>
            <Link
              href="/"
              className="block text-xs text-gray-500 hover:text-gray-400 transition"
            >
              메인 페이지로
            </Link>
          </div>
        </div>

        {/* 보안 안내 */}
        <div className="mt-6 space-y-3">
          <div className="rounded-lg border border-yellow-700/50 bg-yellow-900/20 p-4">
            <p className="text-xs text-yellow-300">
              ⚠️ 이 페이지는 관계자 전용입니다. 권한이 없는 경우 접근이 제한됩니다.
            </p>
          </div>
          
          {/* 개발용 힌트 */}
          <div className="rounded-lg border border-blue-700/50 bg-blue-900/20 p-4">
            <p className="mb-2 text-xs font-semibold text-blue-300">🔑 관리자 계정 정보</p>
            <p className="text-xs text-blue-400">아이디: cupidudu_admin</p>
            <p className="text-xs text-blue-400">비밀번호: admin2024!@</p>
          </div>
        </div>
      </div>
    </main>
  );
}

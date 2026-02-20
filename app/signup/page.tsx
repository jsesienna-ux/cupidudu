"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Gender = "male" | "female";

import { toAuthEmail } from "@/lib/auth-username";
import { validatePassword } from "@/lib/password-validation";

// 영어 에러 메시지를 한국어로 변환
function translateError(message: string): string {
  const errorMap: { [key: string]: string } = {
    "Invalid login credentials": "아이디 또는 비밀번호가 올바르지 않습니다.",
    "Email not confirmed": "이메일 인증이 완료되지 않았습니다.",
    "Invalid email": "올바르지 않은 이메일 형식입니다.",
    "Password should be at least 6 characters": "비밀번호는 최소 6자 이상이어야 합니다.",
    "User already registered": "이미 가입된 사용자입니다.",
    "Unable to validate email address": "이메일 주소를 확인할 수 없습니다.",
    "Signup requires a valid password": "올바른 비밀번호를 입력해주세요.",
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

  return message; // 매핑되지 않은 경우 원본 반환
}

export default function SignupPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [fullName, setFullName] = useState("");
  const [gender, setGender] = useState<Gender | null>(null);
  const [birthYear, setBirthYear] = useState("");
  const [birthMonth, setBirthMonth] = useState("");
  const [birthDay, setBirthDay] = useState("");
  const [contact, setContact] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [usernameChecked, setUsernameChecked] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!gender) {
      setError("성별을 선택해주세요.");
      return;
    }

    if (!birthYear || !birthMonth || !birthDay) {
      setError("생년월일을 모두 입력해주세요.");
      return;
    }

    if (!contact.trim()) {
      setError("연락처를 입력해주세요.");
      return;
    }

    let ageNum: number | null = null;
    if (birthYear && birthMonth && birthDay) {
      const year = parseInt(birthYear, 10);
      const month = parseInt(birthMonth, 10);
      const day = parseInt(birthDay, 10);
      const birth = new Date(year, month - 1, day);
      if (birth.getFullYear() !== year || birth.getMonth() !== month - 1 || birth.getDate() !== day) {
        setError("올바른 생년월일을 선택해주세요.");
        return;
      }
      const today = new Date();
      ageNum = today.getFullYear() - birth.getFullYear();
      const m = today.getMonth() - birth.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) ageNum -= 1;
      if (ageNum < 0 || ageNum > 120) {
        setError("올바른 생년월일을 선택해주세요.");
        return;
      }
    }

    const trimmedUsername = username.trim().toLowerCase();
    if (!trimmedUsername || trimmedUsername.length < 3 || trimmedUsername.length > 20) {
      setError("아이디는 3~20자로 입력해주세요.");
      return;
    }
    if (!/^[a-z0-9_]+$/.test(trimmedUsername)) {
      setError("아이디는 영문 소문자, 숫자, 밑줄(_)만 사용할 수 있어요.");
      return;
    }

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
      // 서버 API로 회원가입 (이메일 제한 우회)
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: trimmedUsername,
          password,
          fullName: fullName.trim() || null,
          gender,
          age: ageNum || null,
          contact: contact.trim() || null,
          email: email.trim() || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        const errorMessage = translateError(data.message ?? "회원가입 실패");
        setError(errorMessage);
        return;
      }

      // 회원가입 성공! 자동 로그인
      const authEmail = toAuthEmail(trimmedUsername);
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: authEmail,
        password,
      });

      if (signInError) {
        const loginErrorMessage = translateError(signInError.message);
        setError(`회원가입은 완료되었으나 자동 로그인 실패: ${loginErrorMessage}`);
        setTimeout(() => router.push("/login"), 2000);
        return;
      }

      // 자동 로그인 성공 - 메인 페이지로 이동
      setError(null);
      router.push("/");
      router.refresh();
    } catch (err: any) {
      console.error("Signup error:", err);
      setError(translateError(err.message || "알 수 없는 오류가 발생했습니다."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-10 text-center">
          <h1 className="text-3xl font-bold text-cupid-pinkDark">Cupidudu</h1>
          <p className="mt-2 text-sm text-cupid-gray">오늘의 인연을 만나보세요</p>
        </div>

        <div className="rounded-2xl border border-cupid-pinkSoft bg-white p-6 shadow-[0_4px_20px_rgba(255,107,157,0.12)]">
          <h2 className="mb-6 text-lg font-semibold text-gray-800">회원가입</h2>
          <p className="mb-4 text-xs text-cupid-gray">
            기본 정보만 입력하시면 됩니다. 상세 정보는 마이페이지에서 작성할 수 있어요.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex flex-wrap items-end gap-3">
              <div className="flex-1 min-w-[120px]">
                <label htmlFor="fullName" className="mb-1.5 block text-sm font-medium text-gray-700">
                  이름 <span className="text-red-500">*</span>
                </label>
                <input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="홍길동"
                  required
                  autoComplete="name"
                  className="w-full rounded-xl border border-cupid-pinkSoft bg-cupid-cream/50 px-4 py-3 text-gray-800 placeholder:text-cupid-gray focus:border-cupid-pink focus:outline-none focus:ring-2 focus:ring-cupid-pink/20"
                />
              </div>
              <div className="shrink-0">
                <span className="mb-1.5 block text-xs font-medium text-gray-700">성별 <span className="text-red-500">*</span></span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setGender("female")}
                    className={`rounded-lg border-2 px-3 py-2 text-sm font-medium transition ${
                      gender === "female"
                        ? "border-cupid-pink bg-cupid-pinkSoft/50 text-cupid-pinkDark"
                        : "border-cupid-pinkSoft/50 bg-white text-gray-600 hover:border-cupid-pinkSoft"
                    }`}
                  >
                    여성
                  </button>
                  <button
                    type="button"
                    onClick={() => setGender("male")}
                    className={`rounded-lg border-2 px-3 py-2 text-sm font-medium transition ${
                      gender === "male"
                        ? "border-cupid-pink bg-cupid-pinkSoft/50 text-cupid-pinkDark"
                        : "border-cupid-pinkSoft/50 bg-white text-gray-600 hover:border-cupid-pinkSoft"
                    }`}
                  >
                    남성
                  </button>
                </div>
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                생년월일 <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                <select
                  value={birthYear}
                  onChange={(e) => setBirthYear(e.target.value)}
                  required
                  className="flex-1 rounded-xl border border-cupid-pinkSoft bg-cupid-cream/50 px-3 py-3 text-gray-800 focus:border-cupid-pink focus:outline-none focus:ring-2 focus:ring-cupid-pink/20"
                >
                  <option value="">연도</option>
                  {Array.from({ length: 2010 - 1970 + 1 }, (_, i) => 2010 - i).map((y) => (
                    <option key={y} value={y}>{y}년</option>
                  ))}
                </select>
                <select
                  value={birthMonth}
                  onChange={(e) => setBirthMonth(e.target.value)}
                  required
                  className="flex-1 rounded-xl border border-cupid-pinkSoft bg-cupid-cream/50 px-3 py-3 text-gray-800 focus:border-cupid-pink focus:outline-none focus:ring-2 focus:ring-cupid-pink/20"
                >
                  <option value="">월</option>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                    <option key={m} value={m}>{m}월</option>
                  ))}
                </select>
                <select
                  value={birthDay}
                  onChange={(e) => setBirthDay(e.target.value)}
                  required
                  className="flex-1 rounded-xl border border-cupid-pinkSoft bg-cupid-cream/50 px-3 py-3 text-gray-800 focus:border-cupid-pink focus:outline-none focus:ring-2 focus:ring-cupid-pink/20"
                >
                  <option value="">일</option>
                  {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                    <option key={d} value={d}>{d}일</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="contact" className="mb-1.5 block text-sm font-medium text-gray-700">
                연락처 <span className="text-red-500">*</span>
              </label>
              <input
                id="contact"
                type="tel"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                placeholder="010-1234-5678"
                required
                autoComplete="tel"
                className="w-full rounded-xl border border-cupid-pinkSoft bg-cupid-cream/50 px-4 py-3 text-gray-800 placeholder:text-cupid-gray focus:border-cupid-pink focus:outline-none focus:ring-2 focus:ring-cupid-pink/20"
              />
            </div>

            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-gray-700">
                이메일 <span className="text-red-500">*</span>
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="hello@example.com"
                required
                autoComplete="email"
                className="w-full rounded-xl border border-cupid-pinkSoft bg-cupid-cream/50 px-4 py-3 text-gray-800 placeholder:text-cupid-gray focus:border-cupid-pink focus:outline-none focus:ring-2 focus:ring-cupid-pink/20"
              />
            </div>

            <div className="rounded-xl border border-cupid-pinkSoft/80 bg-cupid-cream/30 p-4">
              <h3 className="mb-3 text-sm font-semibold text-gray-700">로그인 정보</h3>
              <div className="space-y-3">
                <div>
                  <label htmlFor="username" className="mb-1 block text-sm font-medium text-gray-700">
                    아이디 <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-1.5">
                    <input
                      id="username"
                      type="text"
                      value={username}
                      onChange={(e) => {
                        setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""));
                        setUsernameChecked(null);
                      }}
                      placeholder="영문, 숫자 3~20자"
                      required
                      autoComplete="username"
                      minLength={3}
                      maxLength={20}
                      className="flex-1 max-w-[85%] rounded-xl border border-cupid-pinkSoft bg-white px-4 py-3 text-gray-800 placeholder:text-cupid-gray focus:border-cupid-pink focus:outline-none focus:ring-2 focus:ring-cupid-pink/20"
                    />
                    <button
                      type="button"
                      disabled={checkingUsername || username.trim().length < 3}
                      onClick={async () => {
                        const raw = username.trim().toLowerCase();
                        if (!raw || raw.length < 3 || !/^[a-z0-9_]+$/.test(raw)) {
                          setError("아이디는 영문 소문자, 숫자, 밑줄 3~20자로 입력해주세요.");
                          return;
                        }
                        setError(null);
                        setUsernameChecked(null);
                        setCheckingUsername(true);
                        try {
                          const res = await fetch("/api/auth/check-username", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ username: raw }),
                          });
                          const data = await res.json();
                          setUsernameChecked(data.available);
                          if (!data.available) setError(data.message ?? "이미 사용 중인 아이디예요.");
                          else setError(null);
                        } catch {
                          setUsernameChecked(false);
                          setError("확인 중 오류가 발생했어요.");
                        } finally {
                          setCheckingUsername(false);
                        }
                      }}
                      className="shrink-0 rounded-lg border border-cupid-pink bg-cupid-pinkSoft/50 px-2.5 py-2 text-xs font-medium text-cupid-pinkDark transition hover:bg-cupid-pinkSoft disabled:opacity-50 flex flex-col items-center justify-center leading-tight"
                    >
                      {checkingUsername ? (
                        <span className="text-[10px]">확인 중</span>
                      ) : (
                        <>
                          <span>중복</span>
                          <span>확인</span>
                        </>
                      )}
                    </button>
                  </div>
                  {usernameChecked === true && (
                    <p className="mt-1.5 text-sm text-green-600">사용 가능한 아이디예요.</p>
                  )}
                </div>

                <div>
                  <label htmlFor="password" className="mb-1 block text-sm font-medium text-gray-700">
                    비밀번호 <span className="text-red-500">*</span>
                    <span className="ml-2 text-xs font-normal text-cupid-gray">(영어, 숫자, 특수문자 포함 6자이상)</span>
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
                    className="w-full rounded-xl border border-cupid-pinkSoft bg-white px-4 py-3 text-gray-800 placeholder:text-cupid-gray focus:border-cupid-pink focus:outline-none focus:ring-2 focus:ring-cupid-pink/20"
                  />
                </div>

                <div>
                  <label htmlFor="passwordConfirm" className="mb-1 block text-sm font-medium text-gray-700">
                    비밀번호 확인 <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="passwordConfirm"
                    type="password"
                    value={passwordConfirm}
                    onChange={(e) => setPasswordConfirm(e.target.value)}
                    placeholder="비밀번호를 다시 입력해주세요"
                    required
                    autoComplete="new-password"
                    className="w-full rounded-xl border border-cupid-pinkSoft bg-white px-4 py-3 text-gray-800 placeholder:text-cupid-gray focus:border-cupid-pink focus:outline-none focus:ring-2 focus:ring-cupid-pink/20"
                  />
                </div>
              </div>
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
              {loading ? "가입 중..." : "가입하기"}
            </button>
          </form>

          <p className="mt-4 text-center text-sm text-cupid-gray">
            이미 계정이 있으신가요?{" "}
            <Link href="/login" className="font-medium text-cupid-pink hover:underline">
              로그인
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}

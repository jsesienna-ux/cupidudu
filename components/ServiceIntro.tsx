"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

interface ServiceIntroProps {
  signedUpAt: string; // ISO string
}

export function ServiceIntro({ signedUpAt }: ServiceIntroProps) {
  const router = useRouter();
  const [remaining, setRemaining] = useState({ hours: 24, mins: 0, secs: 0, expired: false });
  const [typedHeadline, setTypedHeadline] = useState("");
  const headlineText = "소울메이트 ♥ 만나실 준비 되셨나요?";

  useEffect(() => {
    const endTime = new Date(signedUpAt).getTime() + 24 * 60 * 60 * 1000;

    const tick = () => {
      const now = Date.now();
      const diff = endTime - now;
      if (diff <= 0) {
        setRemaining({ hours: 0, mins: 0, secs: 0, expired: true });
        return;
      }
      const h = Math.floor(diff / (1000 * 60 * 60));
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((diff % (1000 * 60)) / 1000);
      setRemaining({ hours: h, mins: m, secs: s, expired: false });
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [signedUpAt]);

  useEffect(() => {
    let index = 0;
    setTypedHeadline("");
    const timer = setInterval(() => {
      index += 1;
      setTypedHeadline(headlineText.slice(0, index));
      if (index >= headlineText.length) {
        clearInterval(timer);
      }
    }, 70);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative mx-4 w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-8 shadow-2xl">
        <div className="text-center">
          {/* 메인 헤더 */}
          <div className="mb-8">
            <p
              className="text-lg font-bold text-cupid-pink md:text-xl"
              style={{ fontFamily: '"청춘고딕", "Pretendard", "Noto Sans KR", sans-serif' }}
            >
              {typedHeadline.split("♥")[0]}
              {typedHeadline.includes("♥") && <span className="heart-beat inline-block text-cupid-pink">♥</span>}
              {typedHeadline.includes("♥") ? typedHeadline.split("♥")[1] : ""}
              <span className="ml-0.5 inline-block animate-pulse text-cupid-pinkDark">|</span>
            </p>
          </div>

          {/* 서비스 특징 */}
          <div className="mb-10 grid gap-6 md:grid-cols-3">
            <div className="rounded-2xl border border-cupid-pinkSoft bg-white p-6 shadow-sm">
              <div className="mb-3 text-4xl">☕</div>
              <h3 className="mb-2 font-semibold text-gray-800">소개팅</h3>
              <p className="text-sm text-cupid-gray">편안한 1:1 만남</p>
            </div>
            <div className="rounded-2xl border border-cupid-pinkSoft bg-white p-6 shadow-sm">
              <div className="mb-3 text-4xl">🎭</div>
              <h3 className="mb-2 font-semibold text-gray-800">로테이션 미팅</h3>
              <p className="text-sm text-cupid-gray">다양한 인연과의 만남</p>
            </div>
            <div className="rounded-2xl border border-cupid-pinkSoft bg-white p-6 shadow-sm">
              <div className="mb-3 text-4xl">💍</div>
              <h3 className="mb-2 font-semibold text-gray-800">진지한 미팅</h3>
              <p className="text-sm text-cupid-gray">결혼을 고려한 만남</p>
            </div>
          </div>

          {/* CTA 섹션 */}
          <div className="mb-6 rounded-2xl border-2 border-cupid-pink bg-gradient-to-br from-cupid-pinkSoft/30 to-cupid-cream/50 p-8">
            <div className="mb-4">
              <p className="mb-2 text-lg font-semibold text-gray-800">
                이 모든 서비스를 경험하려면?
              </p>
              <p className="text-sm text-cupid-gray">
                상세 프로필을 입력하시면 매칭 전문가가 최적의 인연을 찾아드립니다
              </p>
            </div>
            
            {/* 특별 프로모션 + 24h 타이머 */}
            <div className="mb-6 rounded-xl bg-gradient-to-r from-[#fff5f8] to-[#ffecf2] p-4 text-cupid-pinkDark ring-1 ring-cupid-pinkSoft/60">
              <p className="mb-1 text-xs font-medium text-cupid-pinkDark/80">🎉 오픈 할인 이벤트</p>
              <p className="mb-2 text-lg font-bold text-cupid-pinkDark">첫 1회 만남 무료!</p>
              <p className="mb-3 text-sm text-gray-700">
                회원가입 후 24시간 이내에 상세정보를 등록하면 첫 1회 만남 무료!
              </p>
              {/* 24h 입체 카운트다운 */}
              <div className="flex justify-center gap-2">
                <div className="flex items-center gap-1.5" style={{ perspective: "400px" }}>
                  <div className="relative">
                    <div
                      className="rounded-lg border-2 border-white/40 px-3 py-2 text-center font-mono text-2xl font-bold tabular-nums text-white"
                      style={{
                        background: "linear-gradient(135deg, #FFB8D0 0%, #FF6B9D 50%, #E84D7A 100%)",
                        boxShadow: "0 3px 0 rgba(180,60,100,0.4), 0 4px 10px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.3)",
                        transform: "rotateX(-8deg)",
                      }}
                    >
                      {remaining.expired ? "00" : String(remaining.hours).padStart(2, "0")}
                    </div>
                    <span className="mt-1 block text-xs text-cupid-pinkDark">시간</span>
                  </div>
                  <span className="mt-4 text-xl font-bold text-cupid-pinkDark">:</span>
                  <div className="relative">
                    <div
                      className="rounded-lg border-2 border-white/40 px-3 py-2 text-center font-mono text-2xl font-bold tabular-nums text-white"
                      style={{
                        background: "linear-gradient(135deg, #FFB8D0 0%, #FF6B9D 50%, #E84D7A 100%)",
                        boxShadow: "0 3px 0 rgba(180,60,100,0.4), 0 4px 10px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.3)",
                        transform: "rotateX(-8deg)",
                      }}
                    >
                      {remaining.expired ? "00" : String(remaining.mins).padStart(2, "0")}
                    </div>
                    <span className="mt-1 block text-xs text-cupid-pinkDark">분</span>
                  </div>
                  <span className="mt-4 text-xl font-bold text-cupid-pinkDark">:</span>
                  <div className="relative">
                    <div
                      className="rounded-lg border-2 border-white/40 px-3 py-2 text-center font-mono text-2xl font-bold tabular-nums text-white"
                      style={{
                        background: "linear-gradient(135deg, #FFB8D0 0%, #FF6B9D 50%, #E84D7A 100%)",
                        boxShadow: "0 3px 0 rgba(180,60,100,0.4), 0 4px 10px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.3)",
                        transform: "rotateX(-8deg)",
                      }}
                    >
                      {remaining.expired ? "00" : String(remaining.secs).padStart(2, "0")}
                    </div>
                    <span className="mt-1 block text-xs text-cupid-pinkDark">초</span>
                  </div>
                </div>
              </div>
              {remaining.expired && (
                <p className="mt-2 text-xs text-gray-600">이벤트 기간이 지났습니다</p>
              )}
            </div>

            {/* 버튼 */}
            <button
              onClick={() => router.push("/onboarding/details")}
              className="animate-bounce rounded-xl bg-cupid-pink px-8 py-4 text-lg font-bold text-white shadow-lg transition hover:scale-105 hover:bg-cupid-pinkDark"
            >
              정회원 기본정보입력 →
            </button>
          </div>

          {/* 안내 메시지 */}
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
            <p className="text-sm text-blue-800">
              ℹ️ 상세정보 등록 후 매니저가 검토하여 <strong>24시간 안</strong>으로 연락드리겠습니다
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

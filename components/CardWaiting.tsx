export function CardWaiting() {
  return (
    <section className="flex min-h-[60vh] flex-col items-center justify-center px-4 py-12 text-center opacity-0 animate-[fadeIn_0.3s_ease-out_forwards]">
      {/* 일러스트 영역 */}
      <div
        className="mb-8 flex h-48 w-48 items-center justify-center rounded-full bg-gradient-to-br from-cupid-pinkSoft to-cupid-pinkLight/50"
        aria-hidden
      >
        <svg
          className="h-24 w-24 text-cupid-pink"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
          />
        </svg>
      </div>

      <h2 className="mb-3 text-xl font-bold text-gray-800">
        매니저가 최적의 인연을 큐레이션 중입니다.
      </h2>
      <p className="max-w-xs text-cupid-gray">
        잠시만 기다려주세요!
      </p>

      <p className="mt-8 text-sm text-cupid-gray">
        곧 특별한 카드가 도착할 거예요 💌
      </p>
    </section>
  );
}

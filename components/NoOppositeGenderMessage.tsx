export function NoOppositeGenderMessage() {
  return (
    <section className="flex min-h-[60vh] flex-col items-center justify-center px-4 py-12 text-center opacity-0 animate-[fadeIn_0.3s_ease-out_forwards]">
      <div
        className="mb-8 flex h-48 w-48 items-center justify-center rounded-full bg-gradient-to-br from-cupid-pinkSoft to-cupid-pinkLight/50"
        aria-hidden
      >
        <span className="text-7xl">💝</span>
      </div>
      <h2 className="mb-3 text-xl font-bold text-gray-800">
        현재 매칭 가능한 이성 회원이 없습니다.
      </h2>
      <p className="max-w-xs text-cupid-gray">
        조금만 기다려주세요!
      </p>
    </section>
  );
}

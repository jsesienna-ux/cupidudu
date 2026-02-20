export default function MembershipPage() {
  return (
    <main className="nav-safe min-h-dvh bg-gradient-to-b from-[#fff9fb] to-white px-4 pb-24 pt-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <section className="rounded-3xl border border-cupid-pinkSoft bg-white/95 p-8 shadow-sm">
          <h1 className="text-2xl font-bold leading-relaxed text-cupid-pinkDark md:text-3xl">
            우리는 모든 회원을 동일하게 보지 않습니다.
            <br />
            진지함과 신뢰를 기준으로 단계를 나눕니다.
          </h1>
          <p className="mt-4 text-sm text-cupid-gray md:text-base">
            Cupidudu의 회원 단계는 서열이 아니라, 더 정확하고 안전한 매칭을 위한 신뢰 단계입니다.
          </p>
        </section>

        <section className="rounded-3xl border border-cupid-pinkSoft bg-white p-6 shadow-sm md:p-7">
          <p className="text-xs font-semibold tracking-wide text-cupid-gray">[1] 정회원 (Regular Member)</p>
          <ul className="mt-3 space-y-2 text-sm text-gray-700 md:text-base">
            <li>- 상세 프로필 작성 완료</li>
            <li>- 기본 매칭 가능</li>
            <li>- 월 제한된 매칭 제공</li>
            <li>- 사진은 상호 선택 + 결제 시 공개</li>
          </ul>
          <p className="mt-4 text-sm font-semibold text-cupid-pinkDark md:text-base">매칭의 시작 단계입니다.</p>
        </section>

        <section className="rounded-3xl border border-cupid-pinkSoft bg-white p-6 shadow-sm md:p-7">
          <p className="text-xs font-semibold tracking-wide text-cupid-gray">[2] 인증회원 (Verified Member)</p>
          <ul className="mt-3 space-y-2 text-sm text-gray-700 md:text-base">
            <li>- 가치관 및 결혼 의지 추가 검증</li>
            <li>- 매니저 인터뷰 선택 가능</li>
            <li>- 우선 노출 및 자동 사진 공개</li>
            <li>- 매칭 정확도 향상</li>
          </ul>
          <p className="mt-4 text-sm font-semibold text-cupid-pinkDark md:text-base">
            진지한 만남을 원하는 분들을 위한 단계입니다.
          </p>
        </section>

        <section className="rounded-3xl border border-cupid-pinkSoft bg-white p-6 shadow-sm md:p-7">
          <p className="text-xs font-semibold tracking-wide text-cupid-gray">[3] 프리미엄 회원 (VIP Member)</p>
          <ul className="mt-3 space-y-2 text-sm text-gray-700 md:text-base">
            <li>- 매니저 직접 큐레이션</li>
            <li>- 소수 정예 매칭</li>
            <li>- 월 추천 제한</li>
            <li>- 심층 상담 포함</li>
          </ul>
          <p className="mt-4 text-sm font-semibold text-cupid-pinkDark md:text-base">
            신뢰와 적합성을 최우선으로 하는 소수 회원 프로그램입니다.
          </p>
        </section>

        <section className="rounded-3xl border border-cupid-pinkSoft bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-800 md:text-base">안내</h2>
          <ul className="mt-3 space-y-2 text-sm text-cupid-gray md:text-base">
            <li>- 내부 매너 점수 및 실물 확인 점수는 운영 품질을 위한 내부 기준이며 외부에 공개되지 않습니다.</li>
            <li>- 모든 회원은 매칭 안전을 위해 검토 과정을 거칩니다.</li>
          </ul>
        </section>
      </div>
    </main>
  );
}


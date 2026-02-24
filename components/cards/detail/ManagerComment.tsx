export function ManagerComment({ text }: { text: string }) {
  return (
    <div className="border-b border-cupid-pinkSoft/50 bg-gradient-to-r from-cupid-pinkSoft/40 to-white px-4 py-4">
      <div className="flex items-center gap-2">
        <span className="text-2xl font-serif text-cupid-pinkDark" aria-hidden>
          &ldquo;
        </span>
        <h2 className="text-sm font-bold uppercase tracking-wide text-cupid-pinkDark">
          매니저의 추천 이유
        </h2>
      </div>
      <p className="mt-2 pl-6 text-sm leading-relaxed text-gray-700">{text}</p>
    </div>
  );
}

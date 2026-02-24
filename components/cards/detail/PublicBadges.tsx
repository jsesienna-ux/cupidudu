import type { Profile } from "./types";

export function PublicBadges({ profile }: { profile: Profile }) {
  const p = profile;
  return (
    <div className="flex flex-wrap gap-2 px-4 py-4">
      <span className="inline-flex items-center gap-1.5 rounded-full bg-cupid-pinkSoft/70 px-3.5 py-1.5 text-sm font-medium text-cupid-pinkDark">
        <span aria-hidden>🆔</span>
        {String(p.id).slice(0, 8)}
      </span>
      {p.age != null && (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-cupid-pinkSoft/70 px-3.5 py-1.5 text-sm font-medium text-cupid-pinkDark">
          <span aria-hidden>🎂</span>
          {p.age}세
        </span>
      )}
      {p.job && (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-cupid-pinkSoft/70 px-3.5 py-1.5 text-sm font-medium text-cupid-pinkDark">
          <span aria-hidden>💼</span>
          {p.job}
        </span>
      )}
      {p.mbti && (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-cupid-pinkSoft/70 px-3.5 py-1.5 text-sm font-medium text-cupid-pinkDark">
          <span aria-hidden>🧩</span>
          {p.mbti}
        </span>
      )}
    </div>
  );
}

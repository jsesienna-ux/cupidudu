"use client";

type Props = {
  onInterestClick: () => void;
  loading: boolean;
};

export function BottomActionBar({ onInterestClick, loading }: Props) {
  return (
    <div
      className="fixed bottom-0 left-0 z-[60] w-full bg-gradient-to-t from-white via-white/95 to-transparent px-4 pt-6 pb-4"
      style={{
        paddingBottom: "max(1rem, env(safe-area-inset-bottom))",
      }}
    >
      <div className="mx-auto max-w-lg">
        <button
          type="button"
          onClick={onInterestClick}
          disabled={loading}
          className="w-full rounded-xl py-3.5 font-semibold text-white shadow-lg transition hover:opacity-95 disabled:opacity-70"
          style={{ backgroundColor: "#FF69B4" }}
        >
          관심있어요
        </button>
      </div>
    </div>
  );
}

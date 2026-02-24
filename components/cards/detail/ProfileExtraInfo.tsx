"use client";

type Field = { label: string; value: string | null | undefined };

type Props = {
  fullName: string;
  moreInfoMode: "top3" | "all";
  onModeChange: (mode: "top3" | "all") => void;
  top3Fields: Field[];
  fieldsWithValue: Field[];
};

export function ProfileExtraInfo({
  fullName,
  moreInfoMode,
  onModeChange,
  top3Fields,
  fieldsWithValue,
}: Props) {
  return (
    <div className="border-b border-cupid-pinkSoft/30 px-4 py-4">
      <h2 className="text-lg font-bold text-gray-800">{fullName}님의 프로필</h2>
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={() => onModeChange("top3")}
          className={`flex-1 rounded-lg py-2 text-sm font-medium transition ${
            moreInfoMode === "top3" ? "bg-cupid-pink text-white" : "bg-cupid-pinkSoft/50 text-cupid-pinkDark"
          }`}
        >
          제일 궁금한 항목 3개 보기
        </button>
        <button
          type="button"
          onClick={() => onModeChange("all")}
          className={`flex-1 rounded-lg py-2 text-sm font-medium transition ${
            moreInfoMode === "all" ? "bg-cupid-pink text-white" : "bg-cupid-pinkSoft/50 text-cupid-pinkDark"
          }`}
        >
          전체 보기
        </button>
      </div>
      <div className="mt-3 grid gap-2 rounded-xl bg-cupid-pinkSoft/20 p-4">
        {(moreInfoMode === "top3" ? top3Fields : fieldsWithValue).map(({ label, value }) => (
          <div key={label} className="flex justify-between gap-4 text-sm">
            <span className="font-medium text-gray-600">{label}</span>
            <span className="text-right text-gray-800">{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

"use client";

type PrefectureChipsProps = {
  prefectures: string[];
  vendorCounts: Record<string, number>;
  selectedPrefecture: string | null;
  onSelect: (pref: string | null) => void;
};

export default function PrefectureChips({
  prefectures,
  vendorCounts,
  selectedPrefecture,
  onSelect,
}: PrefectureChipsProps) {
  const totalCount = prefectures.reduce(
    (sum, pref) => sum + (vendorCounts[pref] || 0),
    0
  );

  return (
    <div className="flex flex-wrap gap-[8px]">
      <button
        type="button"
        onClick={() => onSelect(null)}
        className={`px-[12px] py-[6px] text-[13px] font-medium whitespace-nowrap transition-colors ${
          selectedPrefecture === null
            ? "bg-black text-white"
            : "border border-gray-200 bg-white text-black"
        }`}
      >
        すべて({totalCount})
      </button>
      {prefectures.map((pref) => {
        const count = vendorCounts[pref] || 0;
        const isDisabled = count === 0;
        return (
          <button
            key={pref}
            type="button"
            disabled={isDisabled}
            onClick={() => onSelect(pref)}
            className={`px-[12px] py-[6px] text-[13px] font-medium whitespace-nowrap transition-colors ${
              selectedPrefecture === pref
                ? "bg-black text-white"
                : "border border-gray-200 bg-white text-black"
            } ${isDisabled ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            {pref}({count})
          </button>
        );
      })}
    </div>
  );
}

"use client";

import { REGIONS } from "@/lib/constants";

type RegionSelectorProps = {
  selectedRegion: string | null;
  onSelect: (regionId: string | null) => void;
};

export default function RegionSelector({
  selectedRegion,
  onSelect,
}: RegionSelectorProps) {
  return (
    <div className="overflow-x-auto scrollbar-hide">
      <div className="flex gap-[8px] min-w-max">
        <button
          type="button"
          onClick={() => onSelect(null)}
          className={`shrink-0 px-[16px] py-[8px] text-[14px] font-medium whitespace-nowrap transition-colors ${
            selectedRegion === null
              ? "bg-black text-white"
              : "border border-gray-300 bg-white text-black"
          }`}
        >
          全国
        </button>
        {REGIONS.map((region) => (
          <button
            key={region.id}
            type="button"
            onClick={() => onSelect(region.id)}
            className={`shrink-0 px-[16px] py-[8px] text-[14px] font-medium whitespace-nowrap transition-colors ${
              selectedRegion === region.id
                ? "bg-black text-white"
                : "border border-gray-300 bg-white text-black"
            }`}
          >
            {region.label}
          </button>
        ))}
      </div>
    </div>
  );
}

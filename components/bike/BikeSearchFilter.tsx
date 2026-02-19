"use client";

import { useState, useCallback } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import type { BikeSearchFilter } from "@/types/booking";
import { MOTORCYCLE_CLASSES, BIKE_SORT_OPTIONS } from "@/lib/constants";

interface BikeSearchFilterProps {
  onFilterChange: (filter: BikeSearchFilter) => void;
  initialFilter?: Partial<BikeSearchFilter>;
}

const DEFAULT_FILTER: BikeSearchFilter = {
  keyword: "",
  vehicleClasses: [],
  priceMin: null,
  priceMax: null,
  manufacturers: [],
  sortBy: "newest",
};

export default function BikeSearchFilterPanel({
  onFilterChange,
  initialFilter,
}: BikeSearchFilterProps) {
  const [filter, setFilter] = useState<BikeSearchFilter>({
    ...DEFAULT_FILTER,
    ...initialFilter,
  });
  const [isOpen, setIsOpen] = useState(false);

  const update = useCallback(
    (partial: Partial<BikeSearchFilter>) => {
      setFilter((prev) => ({ ...prev, ...partial }));
    },
    []
  );

  const handleClassToggle = (value: string) => {
    const next = filter.vehicleClasses.includes(value)
      ? filter.vehicleClasses.filter((v) => v !== value)
      : [...filter.vehicleClasses, value];
    update({ vehicleClasses: next });
  };

  const handleSubmit = () => {
    onFilterChange(filter);
  };

  const handleReset = () => {
    const reset = { ...DEFAULT_FILTER };
    setFilter(reset);
    onFilterChange(reset);
  };

  return (
    <div className="border border-gray-100 bg-white">
      {/* Mobile toggle */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between px-[20px] py-[14px] md:hidden"
      >
        <span className="flex items-center gap-[8px] text-sm font-medium">
          <SlidersHorizontal size={16} />
          検索・絞り込み
        </span>
        <span className="text-xs text-gray-400">{isOpen ? "閉じる" : "開く"}</span>
      </button>

      {/* Filter body */}
      <div className={`${isOpen ? "block" : "hidden"} md:block`}>
        <div className="space-y-[20px] px-[20px] py-[20px]">
          {/* Keyword */}
          <div>
            <label className="mb-[6px] block text-xs font-medium text-gray-500">キーワード</label>
            <div className="relative">
              <Search size={16} className="absolute left-[10px] top-1/2 -translate-y-1/2 text-gray-300" />
              <input
                type="text"
                value={filter.keyword}
                onChange={(e) => update({ keyword: e.target.value })}
                placeholder="車名・メーカーで検索"
                className="w-full border border-gray-200 bg-white py-[10px] pl-[34px] pr-[12px] text-sm text-black placeholder:text-gray-300 focus:border-[#2D7D6F] focus:outline-none"
              />
            </div>
          </div>

          {/* Vehicle class checkboxes */}
          <div>
            <label className="mb-[6px] block text-xs font-medium text-gray-500">車両クラス</label>
            <div className="flex flex-wrap gap-[8px]">
              {MOTORCYCLE_CLASSES.map((mc) => (
                <label key={mc.value} className="flex cursor-pointer items-center gap-[6px]">
                  <input
                    type="checkbox"
                    checked={filter.vehicleClasses.includes(mc.value)}
                    onChange={() => handleClassToggle(mc.value)}
                    className="h-[16px] w-[16px] accent-[#2D7D6F]"
                  />
                  <span className="text-xs text-gray-600">{mc.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Price range */}
          <div>
            <label className="mb-[6px] block text-xs font-medium text-gray-500">料金範囲（円/日）</label>
            <div className="flex items-center gap-[8px]">
              <input
                type="number"
                value={filter.priceMin ?? ""}
                onChange={(e) => update({ priceMin: e.target.value ? Number(e.target.value) : null })}
                placeholder="下限"
                className="w-full border border-gray-200 bg-white px-[10px] py-[8px] text-sm text-black placeholder:text-gray-300 focus:border-[#2D7D6F] focus:outline-none"
              />
              <span className="text-gray-300">—</span>
              <input
                type="number"
                value={filter.priceMax ?? ""}
                onChange={(e) => update({ priceMax: e.target.value ? Number(e.target.value) : null })}
                placeholder="上限"
                className="w-full border border-gray-200 bg-white px-[10px] py-[8px] text-sm text-black placeholder:text-gray-300 focus:border-[#2D7D6F] focus:outline-none"
              />
            </div>
          </div>

          {/* Sort */}
          <div>
            <label className="mb-[6px] block text-xs font-medium text-gray-500">並び替え</label>
            <select
              value={filter.sortBy}
              onChange={(e) => update({ sortBy: e.target.value })}
              className="w-full border border-gray-200 bg-white px-[10px] py-[10px] text-sm text-black focus:border-[#2D7D6F] focus:outline-none"
            >
              {BIKE_SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-[16px] pt-[4px]">
            <button
              type="button"
              onClick={handleSubmit}
              className="bg-[#2D7D6F] px-[24px] py-[10px] text-sm font-medium text-white transition-colors hover:bg-[#246858]"
            >
              検索
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="text-sm text-gray-400 underline underline-offset-2 transition-colors hover:text-black"
            >
              リセット
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

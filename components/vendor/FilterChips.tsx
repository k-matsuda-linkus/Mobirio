"use client";

import { X, Plus } from "lucide-react";

interface FilterChip {
  key: string;
  label: string;
  value: string;
}

interface FilterChipsProps {
  chips: FilterChip[];
  onRemove: (key: string) => void;
  onAddFilter?: () => void;
}

export type { FilterChip };

export function FilterChips({ chips, onRemove, onAddFilter }: FilterChipsProps) {
  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-[8px] px-[16px] py-[8px]">
      {chips.map((chip) => (
        <span
          key={chip.key}
          className="inline-flex items-center gap-[4px] bg-accent/10 text-accent text-sm px-[10px] py-[4px]"
        >
          {chip.label}: {chip.value}
          <button
            type="button"
            onClick={() => onRemove(chip.key)}
            className="hover:opacity-70 transition-opacity"
          >
            <X className="w-[12px] h-[12px]" />
          </button>
        </span>
      ))}
      {onAddFilter && (
        <button
          type="button"
          onClick={onAddFilter}
          className="inline-flex items-center gap-[4px] text-sm text-gray-500 hover:text-accent transition-colors"
        >
          <Plus className="w-[12px] h-[12px]" />
          フィルター追加
        </button>
      )}
    </div>
  );
}

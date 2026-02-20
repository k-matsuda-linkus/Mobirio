"use client";

import { CheckCircle2, Circle, AlertCircle } from "lucide-react";

interface ChecklistItem {
  id: string;
  label: string;
  required?: boolean;
}

interface ChecklistPanelProps {
  title: string;
  type: "departure" | "return";
  items: ChecklistItem[];
  checkedItems: string[];
  onToggle: (id: string) => void;
}

export function ChecklistPanel({ title, type, items, checkedItems, onToggle }: ChecklistPanelProps) {
  const completedCount = items.filter((item) => checkedItems.includes(item.id)).length;
  const totalCount = items.length;
  const isAllComplete = completedCount === totalCount;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const requiredUnchecked = items.filter(
    (item) => item.required && !checkedItems.includes(item.id)
  );

  return (
    <div
      className={
        "bg-white border p-[20px] " +
        (isAllComplete ? "border-accent" : "border-gray-200")
      }
    >
      <div className="flex items-center justify-between mb-[12px]">
        <h3 className="text-sm font-medium text-gray-700">{title}</h3>
        <div className="flex items-center gap-[8px]">
          <span className="text-xs text-gray-500">
            {completedCount} / {totalCount}
          </span>
          {isAllComplete && (
            <span className="text-xs bg-accent/10 text-accent px-[8px] py-[2px]">
              完了
            </span>
          )}
        </div>
      </div>

      {/* プログレスバー */}
      <div className="w-full h-[4px] bg-gray-100 mb-[14px]">
        <div
          className="h-full bg-accent transition-all"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* チェックリスト */}
      <div className="space-y-[8px]">
        {items.map((item) => {
          const checked = checkedItems.includes(item.id);
          return (
            <button
              key={item.id}
              onClick={() => onToggle(item.id)}
              className={
                "flex items-center gap-[10px] w-full text-left px-[10px] py-[8px] transition-colors " +
                (checked ? "bg-gray-50" : "hover:bg-gray-50")
              }
            >
              {checked ? (
                <CheckCircle2 className="w-[18px] h-[18px] text-accent shrink-0" />
              ) : (
                <Circle className="w-[18px] h-[18px] text-gray-300 shrink-0" />
              )}
              <span
                className={
                  "text-sm " +
                  (checked ? "text-gray-400 line-through" : "text-gray-700")
                }
              >
                {item.label}
              </span>
              {item.required && !checked && (
                <span className="text-[10px] text-red-500 ml-auto">必須</span>
              )}
            </button>
          );
        })}
      </div>

      {/* 必須未チェック警告 */}
      {requiredUnchecked.length > 0 && (
        <div className="flex items-center gap-[6px] mt-[12px] text-red-500">
          <AlertCircle className="w-[14px] h-[14px] shrink-0" />
          <span className="text-xs">
            必須項目が{requiredUnchecked.length}件未完了です
          </span>
        </div>
      )}
    </div>
  );
}

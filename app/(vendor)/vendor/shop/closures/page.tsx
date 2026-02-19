"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, X, Trash2 } from "lucide-react";
import { VendorPageHeader } from "@/components/vendor/VendorPageHeader";

interface ClosureEntry {
  id: string;
  date: string;
  reason: string;
}

const existingClosures: ClosureEntry[] = [
  { id: "c-1", date: "2026-01-01", reason: "年始休業" },
  { id: "c-2", date: "2026-01-02", reason: "年始休業" },
  { id: "c-3", date: "2026-01-03", reason: "年始休業" },
  { id: "c-4", date: "2026-05-03", reason: "GW臨時休業" },
  { id: "c-5", date: "2026-05-04", reason: "GW臨時休業" },
  { id: "c-6", date: "2026-05-05", reason: "GW臨時休業" },
  { id: "c-7", date: "2026-08-13", reason: "お盆休み" },
  { id: "c-8", date: "2026-08-14", reason: "お盆休み" },
  { id: "c-9", date: "2026-08-15", reason: "お盆休み" },
];

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

function formatDate(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export default function ShopClosuresPage() {
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [selectedDates, setSelectedDates] = useState<Map<string, string>>(new Map());
  const [closures, setClosures] = useState<ClosureEntry[]>(existingClosures);

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDayOfWeek = getFirstDayOfWeek(currentYear, currentMonth);
  const dayLabels = ["日", "月", "火", "水", "木", "金", "土"];

  const goToPrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentYear((y) => y - 1);
      setCurrentMonth(11);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const goToNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentYear((y) => y + 1);
      setCurrentMonth(0);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const toggleDate = (dateStr: string) => {
    setSelectedDates((prev) => {
      const next = new Map(prev);
      if (next.has(dateStr)) {
        next.delete(dateStr);
      } else {
        next.set(dateStr, "");
      }
      return next;
    });
  };

  const updateReason = (dateStr: string, reason: string) => {
    setSelectedDates((prev) => {
      const next = new Map(prev);
      next.set(dateStr, reason);
      return next;
    });
  };

  const removeSelected = (dateStr: string) => {
    setSelectedDates((prev) => {
      const next = new Map(prev);
      next.delete(dateStr);
      return next;
    });
  };

  const handleBulkRegister = () => {
    const newClosures: ClosureEntry[] = [];
    selectedDates.forEach((reason, date) => {
      newClosures.push({ id: `c-new-${date}`, date, reason });
    });
    setClosures((prev) => [...prev, ...newClosures]);
    setSelectedDates(new Map());
    alert(`${newClosures.length}件の休業日を登録しました`);
  };

  const deleteClosure = (id: string) => {
    setClosures((prev) => prev.filter((c) => c.id !== id));
  };

  const isExistingClosure = (dateStr: string) => {
    return closures.some((c) => c.date === dateStr);
  };

  const sortedSelectedDates = Array.from(selectedDates.entries()).sort(
    ([a], [b]) => a.localeCompare(b)
  );

  const calendarCells: (number | null)[] = [];
  for (let i = 0; i < firstDayOfWeek; i++) {
    calendarCells.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    calendarCells.push(d);
  }

  return (
    <div>
      <VendorPageHeader
        title="臨時休業・休業日登録"
        breadcrumbs={[
          { label: "店舗設定", href: "/vendor/shop" },
          { label: "臨時休業・休業日登録" },
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-[24px]">
        {/* カレンダー */}
        <div className="bg-white border border-gray-200 p-[24px]">
          <div className="flex items-center justify-between mb-[16px]">
            <button onClick={goToPrevMonth} className="p-[8px] hover:bg-gray-100">
              <ChevronLeft className="w-[20px] h-[20px]" />
            </button>
            <h3 className="text-lg font-medium">
              {currentYear}年{currentMonth + 1}月
            </h3>
            <button onClick={goToNextMonth} className="p-[8px] hover:bg-gray-100">
              <ChevronRight className="w-[20px] h-[20px]" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-[1px]">
            {dayLabels.map((day, i) => (
              <div
                key={day}
                className={`text-center text-xs font-medium py-[8px] ${
                  i === 0 ? "text-red-500" : i === 6 ? "text-blue-500" : "text-gray-500"
                }`}
              >
                {day}
              </div>
            ))}

            {calendarCells.map((day, i) => {
              if (day === null) {
                return <div key={`empty-${i}`} className="py-[8px]" />;
              }
              const dateStr = formatDate(currentYear, currentMonth, day);
              const isSelected = selectedDates.has(dateStr);
              const isClosed = isExistingClosure(dateStr);
              const dayOfWeek = (firstDayOfWeek + day - 1) % 7;

              return (
                <button
                  key={day}
                  onClick={() => toggleDate(dateStr)}
                  className={`py-[8px] text-center text-sm transition-colors ${
                    isClosed
                      ? "bg-red-100 text-red-600 font-medium"
                      : isSelected
                      ? "bg-accent/20 text-accent font-medium"
                      : "hover:bg-gray-100"
                  } ${
                    dayOfWeek === 0 ? "text-red-500" : dayOfWeek === 6 ? "text-blue-500" : ""
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>

          <div className="mt-[16px] flex items-center gap-[16px] text-xs text-gray-500">
            <div className="flex items-center gap-[4px]">
              <div className="w-[12px] h-[12px] bg-red-100 border border-red-200" />
              <span>登録済み休業日</span>
            </div>
            <div className="flex items-center gap-[4px]">
              <div className="w-[12px] h-[12px] bg-accent/20 border border-accent/30" />
              <span>選択中</span>
            </div>
          </div>
        </div>

        {/* 選択中の日付リスト */}
        <div className="space-y-[16px]">
          <div className="bg-white border border-gray-200 p-[24px]">
            <h3 className="text-base font-medium text-gray-800 mb-[16px]">
              選択中の休業日（{sortedSelectedDates.length}件）
            </h3>

            {sortedSelectedDates.length === 0 ? (
              <p className="text-sm text-gray-400">
                カレンダーから日付をクリックして休業日を選択してください
              </p>
            ) : (
              <div className="space-y-[8px]">
                {sortedSelectedDates.map(([date, reason]) => (
                  <div key={date} className="flex items-center gap-[8px]">
                    <span className="text-sm font-medium text-gray-700 w-[100px] shrink-0">
                      {date}
                    </span>
                    <input
                      type="text"
                      value={reason}
                      onChange={(e) => updateReason(date, e.target.value)}
                      className="flex-1 border border-gray-200 px-[10px] py-[6px] text-sm focus:border-accent focus:outline-none"
                      placeholder="休業理由を入力"
                    />
                    <button
                      onClick={() => removeSelected(date)}
                      className="p-[4px] text-gray-400 hover:text-red-500"
                    >
                      <X className="w-[14px] h-[14px]" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {sortedSelectedDates.length > 0 && (
              <button
                onClick={handleBulkRegister}
                className="mt-[16px] bg-accent text-white px-[24px] py-[10px] text-sm hover:bg-accent/90"
              >
                一括登録
              </button>
            )}
          </div>

          {/* 登録済み休業日一覧 */}
          <div className="bg-white border border-gray-200 p-[24px]">
            <h3 className="text-base font-medium text-gray-800 mb-[16px]">
              登録済み休業日一覧（{closures.length}件）
            </h3>

            {closures.length === 0 ? (
              <p className="text-sm text-gray-400">登録済みの休業日はありません</p>
            ) : (
              <div className="space-y-[4px] max-h-[400px] overflow-y-auto">
                {closures
                  .sort((a, b) => a.date.localeCompare(b.date))
                  .map((closure) => (
                    <div
                      key={closure.id}
                      className="flex items-center justify-between py-[6px] px-[8px] hover:bg-gray-50"
                    >
                      <div className="flex items-center gap-[12px]">
                        <span className="text-sm font-medium text-gray-700">
                          {closure.date}
                        </span>
                        <span className="text-sm text-gray-500">
                          {closure.reason || "-"}
                        </span>
                      </div>
                      <button
                        onClick={() => deleteClosure(closure.id)}
                        className="p-[4px] text-gray-400 hover:text-red-500"
                      >
                        <Trash2 className="w-[14px] h-[14px]" />
                      </button>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

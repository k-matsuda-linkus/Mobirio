"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, X, Trash2 } from "lucide-react";
import { VendorPageHeader } from "@/components/vendor/VendorPageHeader";

interface ClosureEntry {
  id: string;
  date: string;
  reason: string;
}

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
  const [closures, setClosures] = useState<ClosureEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/vendor/closures")
      .then((res) => (res.ok ? res.json() : Promise.reject("API error")))
      .then((json) => {
        setClosures(
          (json.data || []).map((c: { id: string; closure_date: string; reason: string | null }) => ({
            id: c.id,
            date: c.closure_date,
            reason: c.reason ?? "",
          }))
        );
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

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

  const handleBulkRegister = async () => {
    const entries = Array.from(selectedDates.entries());
    const results: ClosureEntry[] = [];
    for (const [date, reason] of entries) {
      try {
        const res = await fetch("/api/vendor/closures", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ closure_date: date, reason: reason || null }),
        });
        if (res.ok) {
          const json = await res.json();
          results.push({ id: json.data.id, date: json.data.closure_date, reason: json.data.reason ?? "" });
        }
      } catch (err) {
        console.error(err);
      }
    }
    setClosures((prev) => [...prev, ...results]);
    setSelectedDates(new Map());
    alert(`${results.length}件の休業日を登録しました`);
  };

  const deleteClosure = (id: string) => {
    fetch(`/api/vendor/closures/${id}`, { method: "DELETE" })
      .then((res) => {
        if (res.ok) setClosures((prev) => prev.filter((c) => c.id !== id));
      })
      .catch((err) => console.error(err));
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

  if (loading) return <div className="p-[24px]">読み込み中...</div>;

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

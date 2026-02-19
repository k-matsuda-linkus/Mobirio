"use client";

import { useState, useMemo } from "react";
import {
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  format,
  addMonths,
  subMonths,
  isBefore,
  isToday,
  startOfDay,
  getDay,
} from "date-fns";
import { ja } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { DayAvailability } from "@/types/booking";

interface BikeAvailabilityProps {
  bikeId: string;
  vendorId: string;
}

/** Deterministic pseudo-random based on date string */
function seededStatus(dateStr: string): DayAvailability["status"] {
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    hash = (hash * 31 + dateStr.charCodeAt(i)) | 0;
  }
  const n = Math.abs(hash) % 10;
  if (n < 2) return "booked";
  return "available";
}

const DAY_LABELS = ["日", "月", "火", "水", "木", "金", "土"];

export default function BikeAvailability({ bikeId, vendorId }: BikeAvailabilityProps) {
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(new Date()));
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const days = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const today = startOfDay(new Date());
  const startOffset = getDay(days[0]);

  const getStatus = (day: Date): DayAvailability["status"] => {
    if (isBefore(day, today) && !isToday(day)) return "unavailable";
    return seededStatus(format(day, "yyyy-MM-dd") + bikeId);
  };

  const statusColor = (status: DayAvailability["status"], isSelected: boolean) => {
    if (isSelected) return "bg-[#2D7D6F] text-white";
    switch (status) {
      case "available":
        return "bg-emerald-50 text-black hover:bg-emerald-100 cursor-pointer";
      case "booked":
        return "bg-red-50 text-red-300";
      case "unavailable":
      default:
        return "bg-gray-50 text-gray-300";
    }
  };

  return (
    <div>
      <h2 className="font-serif text-lg text-black">空き状況</h2>

      {/* Month navigation */}
      <div className="mt-[16px] flex items-center justify-between">
        <button
          type="button"
          onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          className="p-[6px] text-gray-400 transition-colors hover:text-black"
        >
          <ChevronLeft size={18} />
        </button>
        <span className="text-sm font-medium text-black">
          {format(currentMonth, "yyyy年 M月", { locale: ja })}
        </span>
        <button
          type="button"
          onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          className="p-[6px] text-gray-400 transition-colors hover:text-black"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Day-of-week header */}
      <div className="mt-[12px] grid grid-cols-7 text-center">
        {DAY_LABELS.map((d, i) => (
          <div
            key={d}
            className={`py-[6px] text-xs font-medium ${
              i === 0 ? "text-red-400" : i === 6 ? "text-blue-400" : "text-gray-400"
            }`}
          >
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-[2px]">
        {/* Empty cells for offset */}
        {Array.from({ length: startOffset }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}

        {days.map((day) => {
          const dateStr = format(day, "yyyy-MM-dd");
          const status = getStatus(day);
          const isSelected = selectedDate === dateStr;
          const isClickable = status === "available";

          return (
            <button
              key={dateStr}
              type="button"
              disabled={!isClickable}
              onClick={() => isClickable && setSelectedDate(isSelected ? null : dateStr)}
              className={`flex h-[40px] items-center justify-center text-xs transition-colors ${statusColor(
                status,
                isSelected
              )}`}
            >
              {format(day, "d")}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-[16px] flex flex-wrap gap-[16px]">
        <div className="flex items-center gap-[6px]">
          <span className="inline-block h-[12px] w-[12px] bg-emerald-50 border border-emerald-200" />
          <span className="text-xs text-gray-500">空きあり</span>
        </div>
        <div className="flex items-center gap-[6px]">
          <span className="inline-block h-[12px] w-[12px] bg-red-50 border border-red-200" />
          <span className="text-xs text-gray-500">予約済み</span>
        </div>
        <div className="flex items-center gap-[6px]">
          <span className="inline-block h-[12px] w-[12px] bg-gray-50 border border-gray-200" />
          <span className="text-xs text-gray-500">利用不可</span>
        </div>
      </div>

      {/* CTA */}
      <button
        type="button"
        disabled={!selectedDate}
        className={`mt-[20px] w-full py-[14px] text-sm font-medium transition-colors ${
          selectedDate
            ? "bg-[#2D7D6F] text-white hover:bg-[#246858]"
            : "bg-gray-100 text-gray-300 cursor-not-allowed"
        }`}
      >
        この日程で予約
      </button>
    </div>
  );
}

'use client';

import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface CalendarProps {
  selectedDate?: string;
  onDateSelect?: (date: string) => void;
  disabledDates?: string[];
  minDate?: string;
  maxDate?: string;
}

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土'];

function formatDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function Calendar({ selectedDate, onDateSelect, disabledDates = [], minDate, maxDate }: CalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(() => {
    const d = selectedDate ? new Date(selectedDate) : new Date();
    return { year: d.getFullYear(), month: d.getMonth() };
  });

  const days = useMemo(() => {
    const first = new Date(currentMonth.year, currentMonth.month, 1);
    const startDay = first.getDay();
    const daysInMonth = new Date(currentMonth.year, currentMonth.month + 1, 0).getDate();
    const cells: (Date | null)[] = [];
    for (let i = 0; i < startDay; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push(new Date(currentMonth.year, currentMonth.month, d));
    }
    return cells;
  }, [currentMonth]);

  const prevMonth = () => {
    setCurrentMonth((prev) => {
      const m = prev.month === 0 ? 11 : prev.month - 1;
      const y = prev.month === 0 ? prev.year - 1 : prev.year;
      return { year: y, month: m };
    });
  };

  const nextMonth = () => {
    setCurrentMonth((prev) => {
      const m = prev.month === 11 ? 0 : prev.month + 1;
      const y = prev.month === 11 ? prev.year + 1 : prev.year;
      return { year: y, month: m };
    });
  };

  const isDisabled = (date: Date) => {
    const str = formatDateStr(date);
    if (disabledDates.includes(str)) return true;
    if (minDate && str < minDate) return true;
    if (maxDate && str > maxDate) return true;
    const today = formatDateStr(new Date());
    if (str < today) return true;
    return false;
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-[16px]">
        <button onClick={prevMonth} className="p-[8px] hover:bg-gray-100 transition-colors">
          <ChevronLeft size={16} />
        </button>
        <span className="text-sm font-medium">
          {currentMonth.year}年{currentMonth.month + 1}月
        </span>
        <button onClick={nextMonth} className="p-[8px] hover:bg-gray-100 transition-colors">
          <ChevronRight size={16} />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-[2px]">
        {WEEKDAYS.map((w) => (
          <div key={w} className="text-center text-xs text-gray-400 py-[8px]">{w}</div>
        ))}
        {days.map((date, i) => {
          if (!date) return <div key={`empty-${i}`} />;
          const str = formatDateStr(date);
          const disabled = isDisabled(date);
          const selected = selectedDate === str;
          return (
            <button
              key={str}
              disabled={disabled}
              onClick={() => onDateSelect?.(str)}
              className={`py-[10px] text-sm text-center transition-colors ${
                disabled ? 'text-gray-300 cursor-not-allowed' : 'hover:bg-gray-100 cursor-pointer'
              } ${selected ? 'bg-black text-white' : ''}`}
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}

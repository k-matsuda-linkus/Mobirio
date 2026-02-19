'use client';

import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface BookingCalendarProps {
  selectedStart?: string;
  selectedEnd?: string;
  onSelect: (start: string, end: string) => void;
  disabledDates?: string[];
}

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土'];

function fmt(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function BookingCalendar({ selectedStart, selectedEnd, onSelect, disabledDates = [] }: BookingCalendarProps) {
  const [month, setMonth] = useState(() => {
    const d = selectedStart ? new Date(selectedStart) : new Date();
    return { year: d.getFullYear(), month: d.getMonth() };
  });
  const [pickState, setPickState] = useState<'start' | 'end'>('start');

  const days = useMemo(() => {
    const first = new Date(month.year, month.month, 1);
    const startDay = first.getDay();
    const total = new Date(month.year, month.month + 1, 0).getDate();
    const cells: (Date | null)[] = [];
    for (let i = 0; i < startDay; i++) cells.push(null);
    for (let d = 1; d <= total; d++) cells.push(new Date(month.year, month.month, d));
    return cells;
  }, [month]);

  const handleClick = (dateStr: string) => {
    if (pickState === 'start') {
      onSelect(dateStr, '');
      setPickState('end');
    } else {
      if (selectedStart && dateStr > selectedStart) {
        onSelect(selectedStart, dateStr);
      } else {
        onSelect(dateStr, '');
      }
      setPickState('start');
    }
  };

  const isInRange = (str: string) => {
    if (!selectedStart || !selectedEnd) return false;
    return str > selectedStart && str < selectedEnd;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-[16px]">
        <button onClick={() => setMonth(p => ({ year: p.month === 0 ? p.year - 1 : p.year, month: p.month === 0 ? 11 : p.month - 1 }))} className="p-[8px] hover:bg-gray-100">
          <ChevronLeft size={16} />
        </button>
        <span className="text-sm font-medium">{month.year}年{month.month + 1}月</span>
        <button onClick={() => setMonth(p => ({ year: p.month === 11 ? p.year + 1 : p.year, month: p.month === 11 ? 0 : p.month + 1 }))} className="p-[8px] hover:bg-gray-100">
          <ChevronRight size={16} />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-[2px]">
        {WEEKDAYS.map(w => <div key={w} className="text-center text-xs text-gray-400 py-[8px]">{w}</div>)}
        {days.map((date, i) => {
          if (!date) return <div key={`e-${i}`} />;
          const str = fmt(date);
          const disabled = disabledDates.includes(str) || str < fmt(new Date());
          const isStart = str === selectedStart;
          const isEnd = str === selectedEnd;
          const inRange = isInRange(str);
          return (
            <button key={str} disabled={disabled} onClick={() => handleClick(str)}
              className={`py-[10px] text-sm text-center transition-colors ${disabled ? 'text-gray-300 cursor-not-allowed' : 'hover:bg-gray-100'} ${isStart || isEnd ? 'bg-accent text-white' : ''} ${inRange ? 'bg-accent/10' : ''}`}
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}

'use client';

import { ArrowRight } from 'lucide-react';

interface DateRangePickerProps {
  startDate?: string;
  endDate?: string;
  onStartChange: (val: string) => void;
  onEndChange: (val: string) => void;
  minDate?: string;
  label?: string;
}

export function DateRangePicker({ startDate, endDate, onStartChange, onEndChange, minDate, label }: DateRangePickerProps) {
  const error = startDate && endDate && endDate <= startDate ? '返却日は開始日より後にしてください' : '';

  return (
    <div>
      {label && <label className="block text-xs text-gray-500 mb-[6px]">{label}</label>}
      <div className="flex items-center gap-[12px]">
        <input type="date" value={startDate || ''} min={minDate} onChange={(e) => onStartChange(e.target.value)}
          className="flex-1 border border-gray-200 py-[12px] px-[16px] text-sm focus:border-black focus:outline-none" />
        <ArrowRight size={16} className="text-gray-400 shrink-0" />
        <input type="date" value={endDate || ''} min={startDate || minDate} onChange={(e) => onEndChange(e.target.value)}
          className="flex-1 border border-gray-200 py-[12px] px-[16px] text-sm focus:border-black focus:outline-none" />
      </div>
      {error && <p className="text-xs text-red-500 mt-[4px]">{error}</p>}
    </div>
  );
}

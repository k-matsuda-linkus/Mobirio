'use client';

interface DateTimePickerProps {
  label?: string;
  value?: string;
  onChange?: (value: string) => void;
  error?: string;
  minDate?: string;
  maxDate?: string;
}

const TIME_OPTIONS: string[] = [];
for (let h = 9; h < 18; h++) {
  for (let m = 0; m < 60; m += 15) {
    TIME_OPTIONS.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
  }
}

export function DateTimePicker({ label, value, onChange, error, minDate, maxDate }: DateTimePickerProps) {
  const dateValue = value ? value.split('T')[0] : '';
  const timeValue = value ? value.split('T')[1]?.slice(0, 5) || '09:00' : '09:00';

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange?.(`${e.target.value}T${timeValue}`);
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange?.(`${dateValue}T${e.target.value}`);
  };

  return (
    <div className="w-full">
      {label && <label className="block text-xs text-gray-500 mb-[6px]">{label}</label>}
      <div className="flex gap-[8px]">
        <input
          type="date"
          value={dateValue}
          min={minDate}
          max={maxDate}
          onChange={handleDateChange}
          className={`flex-1 border border-gray-200 py-[12px] px-[16px] text-sm focus:border-black focus:outline-none ${error ? 'border-red-500' : ''}`}
        />
        <select
          value={timeValue}
          onChange={handleTimeChange}
          className="w-[100px] border border-gray-200 py-[12px] px-[12px] text-sm focus:border-black focus:outline-none bg-white"
        >
          {TIME_OPTIONS.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>
      {error && <p className="text-xs text-red-500 mt-[4px]">{error}</p>}
    </div>
  );
}

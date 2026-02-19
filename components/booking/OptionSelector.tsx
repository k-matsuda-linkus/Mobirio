'use client';

import { OPTION_CATEGORIES } from '@/lib/constants';

interface OptionItem {
  id: string;
  name: string;
  description: string;
  category: string;
  price_per_day: number | null;
  price_per_use: number | null;
}

interface OptionSelectorProps {
  options: OptionItem[];
  selectedOptions: { optionId: string; quantity: number }[];
  onChange: (selected: { optionId: string; quantity: number }[]) => void;
}

export function OptionSelector({ options, selectedOptions, onChange }: OptionSelectorProps) {
  const isSelected = (id: string) => selectedOptions.some((s) => s.optionId === id);

  const toggle = (id: string) => {
    if (isSelected(id)) {
      onChange(selectedOptions.filter((s) => s.optionId !== id));
    } else {
      onChange([...selectedOptions, { optionId: id, quantity: 1 }]);
    }
  };

  return (
    <div className="space-y-[24px]">
      {OPTION_CATEGORIES.map((cat) => {
        const catOptions = options.filter((o) => o.category === cat.value);
        if (catOptions.length === 0) return null;
        return (
          <div key={cat.value}>
            <h4 className="text-xs text-gray-400 uppercase tracking-wider mb-[10px]">{cat.label}</h4>
            <div className="space-y-[8px]">
              {catOptions.map((opt) => (
                <label key={opt.id} className="flex items-center gap-[10px] py-[8px] border-b border-gray-50 cursor-pointer">
                  <input type="checkbox" checked={isSelected(opt.id)} onChange={() => toggle(opt.id)} />
                  <div className="flex-1">
                    <p className="text-sm">{opt.name}</p>
                    <p className="text-xs text-gray-400">{opt.description}</p>
                  </div>
                  <span className="text-sm font-medium">
                    {opt.price_per_day ? `¥${opt.price_per_day.toLocaleString()}/日` : opt.price_per_use ? `¥${opt.price_per_use.toLocaleString()}` : '無料'}
                  </span>
                </label>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

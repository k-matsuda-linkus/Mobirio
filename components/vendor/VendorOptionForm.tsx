"use client";
import { useState } from "react";
import { OPTION_CATEGORIES } from "@/lib/constants";

type OptionFormData = {
  name: string;
  description: string;
  category: string;
  price_per_day: number;
  price_per_use: number;
  is_active: boolean;
};

type Props = {
  initialData?: Partial<OptionFormData>;
  onSubmit: (data: OptionFormData) => void;
};

const inputCls = "w-full border border-gray-200 bg-white px-[12px] py-[10px] text-sm focus:border-accent focus:outline-none";
const labelCls = "block text-xs font-medium text-gray-500 mb-[4px]";

export default function VendorOptionForm({ initialData, onSubmit }: Props) {
  const [form, setForm] = useState<OptionFormData>({
    name: initialData?.name ?? "",
    description: initialData?.description ?? "",
    category: initialData?.category ?? OPTION_CATEGORIES[0].value,
    price_per_day: initialData?.price_per_day ?? 0,
    price_per_use: initialData?.price_per_use ?? 0,
    is_active: initialData?.is_active ?? true,
  });
  const update = (k: keyof OptionFormData, v: string | number | boolean) =>
    setForm((p) => ({ ...p, [k]: v }));
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
  };
  return (
    <form onSubmit={handleSubmit} className="space-y-[24px]">
      <div className="grid grid-cols-1 gap-[16px] md:grid-cols-2">
        <div>
          <label className={labelCls}>オプション名</label>
          <input className={inputCls} value={form.name} onChange={(e) => update("name", e.target.value)} required />
        </div>
        <div>
          <label className={labelCls}>カテゴリ</label>
          <select className={inputCls} value={form.category} onChange={(e) => update("category", e.target.value)}>
            {OPTION_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label className={labelCls}>説明</label>
        <textarea className={inputCls + " min-h-[80px]"} value={form.description} onChange={(e) => update("description", e.target.value)} />
      </div>
      <div className="grid grid-cols-1 gap-[16px] md:grid-cols-2">
        <div><label className={labelCls}>日額料金 (円)</label><input type="number" className={inputCls} value={form.price_per_day} onChange={(e) => update("price_per_day", Number(e.target.value))} /></div>
        <div><label className={labelCls}>利用毎料金 (円)</label><input type="number" className={inputCls} value={form.price_per_use} onChange={(e) => update("price_per_use", Number(e.target.value))} /></div>
      </div>
      <div className="flex items-center gap-[8px]">
        <button type="button" onClick={() => update("is_active", !form.is_active)} className={"relative inline-flex h-[24px] w-[44px] items-center transition-colors " + (form.is_active ? "bg-accent" : "bg-gray-200")}>
          <span className={"inline-block h-[20px] w-[20px] bg-white transition-transform " + (form.is_active ? "translate-x-[22px]" : "translate-x-[2px]")} />
        </button>
        <span className="text-sm text-gray-600">{form.is_active ? "有効" : "無効"}</span>
      </div>
      <button type="submit" className="bg-black px-[32px] py-[12px] text-sm font-medium text-white transition-colors hover:bg-gray-800">保存する</button>
    </form>
  );
}

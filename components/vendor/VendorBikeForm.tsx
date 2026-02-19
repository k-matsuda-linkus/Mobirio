'use client';

import { useState } from 'react';
import { ENGINE_TYPES, LICENSE_TYPES, MOTORCYCLE_CLASSES } from '@/lib/constants';
import { Upload } from 'lucide-react';

type BikeFormData = {
  name: string;
  model: string;
  manufacturer: string;
  year: number;
  displacement: number;
  engine_type: string;
  seat_height: number;
  weight: number;
  license_type: string;
  description: string;
  price_per_hour: number;
  price_per_day: number;
};

type Props = { initialData?: Partial<BikeFormData>; onSubmit: (d: BikeFormData) => void; };
const inputCls = "w-full border border-gray-200 bg-white px-[12px] py-[10px] text-sm focus:border-[#2D7D6F] focus:outline-none";
const labelCls = "block text-xs font-medium text-gray-500 mb-[4px]";
export default function VendorBikeForm({ initialData, onSubmit }: Props) {
  const [form, setForm] = useState<BikeFormData>({
    name: initialData?.name ?? "",
    model: initialData?.model ?? "",
    manufacturer: initialData?.manufacturer ?? "",
    year: initialData?.year ?? new Date().getFullYear(),
    displacement: initialData?.displacement ?? 0,
    engine_type: initialData?.engine_type ?? ENGINE_TYPES[0].value,
    seat_height: initialData?.seat_height ?? 0,
    weight: initialData?.weight ?? 0,
    license_type: initialData?.license_type ?? LICENSE_TYPES[0].value,
    description: initialData?.description ?? "",
    price_per_hour: initialData?.price_per_hour ?? 0,
    price_per_day: initialData?.price_per_day ?? 0,
  });
  const update = (k: keyof BikeFormData, v: string | number) => setForm((p) => ({ ...p, [k]: v }));
  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); onSubmit(form); };
  return (
    <form onSubmit={handleSubmit} className="space-y-[24px]">
      <div className="grid grid-cols-1 gap-[16px] md:grid-cols-2">
        <div><label className={labelCls}>車両名</label><input className={inputCls} value={form.name} onChange={(e) => update("name", e.target.value)} required /></div>
        <div><label className={labelCls}>モデル</label><input className={inputCls} value={form.model} onChange={(e) => update("model", e.target.value)} required /></div>
        <div><label className={labelCls}>メーカー</label><input className={inputCls} value={form.manufacturer} onChange={(e) => update("manufacturer", e.target.value)} required /></div>
        <div><label className={labelCls}>年式</label><input type="number" className={inputCls} value={form.year} onChange={(e) => update("year", Number(e.target.value))} /></div>
        <div><label className={labelCls}>排気量 (cc)</label><input type="number" className={inputCls} value={form.displacement} onChange={(e) => update("displacement", Number(e.target.value))} /></div>
        <div><label className={labelCls}>エンジンタイプ</label>
          <select className={inputCls} value={form.engine_type} onChange={(e) => update("engine_type", e.target.value)}>
            {ENGINE_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
        <div><label className={labelCls}>シート高 (mm)</label><input type="number" className={inputCls} value={form.seat_height} onChange={(e) => update("seat_height", Number(e.target.value))} /></div>
        <div><label className={labelCls}>車両重量 (kg)</label><input type="number" className={inputCls} value={form.weight} onChange={(e) => update("weight", Number(e.target.value))} /></div>
        <div><label className={labelCls}>必要免許</label>
          <select className={inputCls} value={form.license_type} onChange={(e) => update("license_type", e.target.value)}>
            {LICENSE_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label className={labelCls}>説明</label>
        <textarea className={inputCls + " min-h-[100px]"} value={form.description} onChange={(e) => update("description", e.target.value)} />
      </div>
      <div>
        <label className={labelCls}>画像</label>
        <div className="flex items-center justify-center border border-dashed border-gray-300 p-[32px] text-center">
          <div className="flex flex-col items-center gap-[8px] text-gray-400">
            <Upload className="h-[24px] w-[24px]" />
            <span className="text-sm">ここに画像をドラッグ、またはクリックしてアップロード</span>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-[16px] md:grid-cols-2">
        <div><label className={labelCls}>1時間あたり料金 (円)</label><input type="number" className={inputCls} value={form.price_per_hour} onChange={(e) => update("price_per_hour", Number(e.target.value))} /></div>
        <div><label className={labelCls}>1日あたり料金 (円)</label><input type="number" className={inputCls} value={form.price_per_day} onChange={(e) => update("price_per_day", Number(e.target.value))} /></div>
      </div>
      <button type="submit" className="bg-black px-[32px] py-[12px] text-sm font-medium text-white transition-colors hover:bg-gray-800">保存する</button>
    </form>
  );
}

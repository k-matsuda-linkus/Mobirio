"use client";
import { useState } from "react";
import { RENTAL_DURATIONS } from "@/lib/constants";

type PricingRule = { duration: string; price: number };
type Props = {
  bikeId?: string;
  vendorId?: string;
  onSubmit: (rules: PricingRule[], validFrom: string, validTo: string) => void;
};
const inputCls = "w-full border border-gray-200 bg-white px-[12px] py-[10px] text-sm focus:border-accent focus:outline-none";

export default function VendorPricingForm({ bikeId, vendorId, onSubmit }: Props) {
  const [prices, setPrices] = useState<Record<string, number>>({});
  const [validFrom, setValidFrom] = useState("");
  const [validTo, setValidTo] = useState("");
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const rules = Object.entries(prices).filter(([, v]) => v > 0).map(([d, p]) => ({ duration: d, price: Number(p) }));
    onSubmit(rules, validFrom, validTo);
  };
  return (
    <form onSubmit={handleSubmit} className="space-y-[24px]">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="py-[10px] text-left text-xs font-medium text-gray-400 uppercase">期間</th>
              <th className="py-[10px] text-right text-xs font-medium text-gray-400 uppercase">料金 (円)</th>
            </tr>
          </thead>
          <tbody>
            {RENTAL_DURATIONS.map((d) => (
              <tr key={d.value} className="border-b border-gray-50">
                <td className="py-[8px] text-gray-700">{d.label}</td>
                <td className="py-[8px]">
                  <input type="number" className={inputCls + " text-right max-w-[160px] ml-auto"} value={prices[d.value] || ""} onChange={(e) => setPrices((p) => ({ ...p, [d.value]: Number(e.target.value) }))} placeholder="0" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="grid grid-cols-1 gap-[16px] md:grid-cols-2">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-[4px]">有効開始日</label>
          <input type="date" className={inputCls} value={validFrom} onChange={(e) => setValidFrom(e.target.value)} />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-[4px]">有効終了日</label>
          <input type="date" className={inputCls} value={validTo} onChange={(e) => setValidTo(e.target.value)} />
        </div>
      </div>
      <button type="submit" className="bg-black px-[32px] py-[12px] text-sm font-medium text-white hover:bg-gray-800">保存する</button>
    </form>
  );
}

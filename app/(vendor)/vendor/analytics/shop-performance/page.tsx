"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { VendorPageHeader } from "@/components/vendor/VendorPageHeader";
import { StoreSelector } from "@/components/vendor/StoreSelector";
import { AnalyticsChart } from "@/components/vendor/AnalyticsChart";

const STORES = [
  { id: "store-1", name: "宮崎橘通り店" },
  { id: "store-2", name: "宮崎空港店" },
];

const MOCK_PERFORMANCE_DATA = [
  { label: "1月", prevYear: 245000, currentYear: 312000 },
  { label: "2月", prevYear: 198000, currentYear: 356000 },
  { label: "3月", prevYear: 425000, currentYear: 510000 },
  { label: "4月", prevYear: 520000, currentYear: 620000 },
  { label: "5月", prevYear: 610000, currentYear: 680000 },
  { label: "6月", prevYear: 380000, currentYear: 450000 },
  { label: "7月", prevYear: 720000, currentYear: 800000 },
  { label: "8月", prevYear: 780000, currentYear: 750000 },
  { label: "9月", prevYear: 490000, currentYear: 560000 },
  { label: "10月", prevYear: 420000, currentYear: 510000 },
  { label: "11月", prevYear: 310000, currentYear: 380000 },
  { label: "12月", prevYear: 260000, currentYear: 340000 },
];

export default function VendorShopPerformancePage() {
  const [selectedStore, setSelectedStore] = useState("store-1");
  const [dateCondition, setDateCondition] = useState<"reservation" | "departure" | "return">("reservation");
  const [analysisUnit, setAnalysisUnit] = useState<"year" | "month">("month");
  const [paymentType, setPaymentType] = useState<"all" | "paid" | "free">("all");
  const [displayType, setDisplayType] = useState<"amount" | "count">("amount");
  const [activeTab, setActiveTab] = useState<"chart" | "list">("chart");
  const [analysisYear, setAnalysisYear] = useState("2026");

  const totalPrevYear = MOCK_PERFORMANCE_DATA.reduce((s, d) => s + d.prevYear, 0);
  const totalCurrentYear = MOCK_PERFORMANCE_DATA.reduce((s, d) => s + d.currentYear, 0);
  const yoyRatio = totalPrevYear > 0 ? Math.round((totalCurrentYear / totalPrevYear) * 100) : 0;

  const inputClass =
    "border border-gray-300 px-[10px] py-[6px] text-sm focus:outline-none focus:border-accent";

  return (
    <div>
      <VendorPageHeader
        title="店舗予約実績分析"
        breadcrumbs={[{ label: "分析" }, { label: "店舗予約実績分析" }]}
      />

      {/* Store selector */}
      <div className="mb-[16px]">
        <StoreSelector stores={STORES} selectedId={selectedStore} onChange={setSelectedStore} />
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200 p-[16px] mb-[16px]">
        <div className="space-y-[12px]">
          <div className="flex flex-wrap items-center gap-[24px]">
            <div>
              <label className="block text-xs text-gray-500 mb-[4px]">日付条件</label>
              <div className="flex items-center gap-[12px]">
                {([
                  { value: "reservation", label: "予約登録日" },
                  { value: "departure", label: "出発日" },
                  { value: "return", label: "返却日" },
                ] as const).map((opt) => (
                  <label key={opt.value} className="flex items-center gap-[4px] text-sm text-gray-700 cursor-pointer">
                    <input
                      type="radio"
                      name="dateCondition"
                      value={opt.value}
                      checked={dateCondition === opt.value}
                      onChange={() => setDateCondition(opt.value)}
                      className="accent-accent"
                    />
                    {opt.label}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-[4px]">分析単位</label>
              <div className="flex items-center gap-[12px]">
                {([
                  { value: "year", label: "年単位" },
                  { value: "month", label: "月単位" },
                ] as const).map((opt) => (
                  <label key={opt.value} className="flex items-center gap-[4px] text-sm text-gray-700 cursor-pointer">
                    <input
                      type="radio"
                      name="analysisUnit"
                      value={opt.value}
                      checked={analysisUnit === opt.value}
                      onChange={() => setAnalysisUnit(opt.value)}
                      className="accent-accent"
                    />
                    {opt.label}
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-[24px]">
            <div>
              <label className="block text-xs text-gray-500 mb-[4px]">有償/無償</label>
              <div className="flex items-center gap-[12px]">
                {([
                  { value: "all", label: "すべて" },
                  { value: "paid", label: "有償" },
                  { value: "free", label: "無償" },
                ] as const).map((opt) => (
                  <label key={opt.value} className="flex items-center gap-[4px] text-sm text-gray-700 cursor-pointer">
                    <input
                      type="radio"
                      name="paymentType"
                      value={opt.value}
                      checked={paymentType === opt.value}
                      onChange={() => setPaymentType(opt.value)}
                      className="accent-accent"
                    />
                    {opt.label}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-[4px]">表示内容</label>
              <div className="flex items-center gap-[12px]">
                {([
                  { value: "amount", label: "金額" },
                  { value: "count", label: "件数" },
                ] as const).map((opt) => (
                  <label key={opt.value} className="flex items-center gap-[4px] text-sm text-gray-700 cursor-pointer">
                    <input
                      type="radio"
                      name="displayType"
                      value={opt.value}
                      checked={displayType === opt.value}
                      onChange={() => setDisplayType(opt.value)}
                      className="accent-accent"
                    />
                    {opt.label}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-[4px]">対象年</label>
              <select value={analysisYear} onChange={(e) => setAnalysisYear(e.target.value)} className={inputClass + " w-[100px]"}>
                <option value="2025">2025年</option>
                <option value="2026">2026年</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-[8px] pt-[4px]">
            <button className="bg-accent text-white px-[16px] py-[7px] text-sm hover:bg-accent/90">
              検索
            </button>
            <button className="flex items-center gap-[6px] border border-gray-300 bg-white px-[14px] py-[7px] text-sm text-gray-700 hover:bg-gray-50">
              <Download className="w-[14px] h-[14px]" />
              CSV出力
            </button>
          </div>
        </div>
      </div>

      {/* Annual totals */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-[12px] mb-[16px]">
        <div className="bg-white border border-gray-200 p-[16px]">
          <p className="text-xs text-gray-500 mb-[4px]">前年 年間合計</p>
          <p className="text-xl font-medium text-gray-900">
            &yen;{totalPrevYear.toLocaleString()}
          </p>
        </div>
        <div className="bg-white border border-gray-200 p-[16px]">
          <p className="text-xs text-gray-500 mb-[4px]">当年 年間合計</p>
          <p className="text-xl font-medium text-gray-900">
            &yen;{totalCurrentYear.toLocaleString()}
          </p>
        </div>
        <div className="bg-white border border-gray-200 p-[16px]">
          <p className="text-xs text-gray-500 mb-[4px]">前年比</p>
          <p className={"text-xl font-medium " + (yoyRatio >= 100 ? "text-accent" : "text-red-500")}>
            {yoyRatio}%
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center border-b border-gray-200 mb-[16px]">
        {([
          { key: "chart", label: "グラフ" },
          { key: "list", label: "リスト" },
        ] as const).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={
              "px-[20px] py-[10px] text-sm font-medium border-b-2 -mb-[1px] " +
              (activeTab === tab.key
                ? "border-accent text-accent"
                : "border-transparent text-gray-500 hover:text-gray-700")
            }
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === "chart" && (
        <AnalyticsChart
          data={MOCK_PERFORMANCE_DATA}
          title="店舗予約実績推移"
          valueLabel="円"
        />
      )}

      {activeTab === "list" && (
        <div className="bg-white border border-gray-200 overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-[12px] py-[10px] text-left text-xs font-medium text-gray-500">月</th>
                <th className="px-[12px] py-[10px] text-right text-xs font-medium text-gray-500">前年</th>
                <th className="px-[12px] py-[10px] text-right text-xs font-medium text-gray-500">当年</th>
                <th className="px-[12px] py-[10px] text-right text-xs font-medium text-gray-500">前年比</th>
                <th className="px-[12px] py-[10px] text-right text-xs font-medium text-gray-500">差額</th>
              </tr>
            </thead>
            <tbody>
              {MOCK_PERFORMANCE_DATA.map((d) => {
                const ratio = d.prevYear > 0 ? Math.round((d.currentYear / d.prevYear) * 100) : 0;
                const diff = d.currentYear - d.prevYear;
                return (
                  <tr key={d.label} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-[12px] py-[10px] text-sm text-gray-700">{d.label}</td>
                    <td className="px-[12px] py-[10px] text-sm text-gray-700 text-right">
                      &yen;{d.prevYear.toLocaleString()}
                    </td>
                    <td className="px-[12px] py-[10px] text-sm text-gray-700 text-right">
                      &yen;{d.currentYear.toLocaleString()}
                    </td>
                    <td className={"px-[12px] py-[10px] text-sm text-right " + (ratio >= 100 ? "text-accent" : "text-red-500")}>
                      {ratio}%
                    </td>
                    <td className={"px-[12px] py-[10px] text-sm text-right " + (diff >= 0 ? "text-accent" : "text-red-500")}>
                      {diff >= 0 ? "+" : ""}&yen;{diff.toLocaleString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-gray-50 border-t border-gray-200">
                <td className="px-[12px] py-[10px] text-sm font-medium text-gray-700">合計</td>
                <td className="px-[12px] py-[10px] text-sm font-medium text-gray-900 text-right">
                  &yen;{totalPrevYear.toLocaleString()}
                </td>
                <td className="px-[12px] py-[10px] text-sm font-medium text-gray-900 text-right">
                  &yen;{totalCurrentYear.toLocaleString()}
                </td>
                <td className={"px-[12px] py-[10px] text-sm font-medium text-right " + (yoyRatio >= 100 ? "text-accent" : "text-red-500")}>
                  {yoyRatio}%
                </td>
                <td className={"px-[12px] py-[10px] text-sm font-medium text-right " + (totalCurrentYear - totalPrevYear >= 0 ? "text-accent" : "text-red-500")}>
                  {totalCurrentYear - totalPrevYear >= 0 ? "+" : ""}&yen;{(totalCurrentYear - totalPrevYear).toLocaleString()}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}

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

interface VehiclePerformance {
  vehicleName: string;
  registrationNo: string;
  data: { label: string; prevYear: number; currentYear: number }[];
}

const MOCK_VEHICLE_PERFORMANCE: VehiclePerformance[] = [
  {
    vehicleName: "PCX160",
    registrationNo: "宮崎 あ 12-34",
    data: [
      { label: "1月", prevYear: 62000, currentYear: 78000 },
      { label: "2月", prevYear: 48000, currentYear: 92000 },
      { label: "3月", prevYear: 105000, currentYear: 128000 },
      { label: "4月", prevYear: 130000, currentYear: 155000 },
      { label: "5月", prevYear: 152000, currentYear: 170000 },
      { label: "6月", prevYear: 95000, currentYear: 112000 },
      { label: "7月", prevYear: 180000, currentYear: 200000 },
      { label: "8月", prevYear: 195000, currentYear: 188000 },
      { label: "9月", prevYear: 122000, currentYear: 140000 },
      { label: "10月", prevYear: 105000, currentYear: 128000 },
      { label: "11月", prevYear: 78000, currentYear: 95000 },
      { label: "12月", prevYear: 65000, currentYear: 85000 },
    ],
  },
  {
    vehicleName: "ADV150",
    registrationNo: "宮崎 い 56-78",
    data: [
      { label: "1月", prevYear: 55000, currentYear: 72000 },
      { label: "2月", prevYear: 42000, currentYear: 85000 },
      { label: "3月", prevYear: 98000, currentYear: 118000 },
      { label: "4月", prevYear: 120000, currentYear: 145000 },
      { label: "5月", prevYear: 140000, currentYear: 160000 },
      { label: "6月", prevYear: 88000, currentYear: 105000 },
      { label: "7月", prevYear: 168000, currentYear: 190000 },
      { label: "8月", prevYear: 182000, currentYear: 178000 },
      { label: "9月", prevYear: 115000, currentYear: 132000 },
      { label: "10月", prevYear: 98000, currentYear: 120000 },
      { label: "11月", prevYear: 72000, currentYear: 88000 },
      { label: "12月", prevYear: 58000, currentYear: 78000 },
    ],
  },
  {
    vehicleName: "CB250R",
    registrationNo: "宮崎 う 90-12",
    data: [
      { label: "1月", prevYear: 68000, currentYear: 82000 },
      { label: "2月", prevYear: 52000, currentYear: 98000 },
      { label: "3月", prevYear: 115000, currentYear: 138000 },
      { label: "4月", prevYear: 142000, currentYear: 168000 },
      { label: "5月", prevYear: 165000, currentYear: 182000 },
      { label: "6月", prevYear: 102000, currentYear: 120000 },
      { label: "7月", prevYear: 192000, currentYear: 215000 },
      { label: "8月", prevYear: 208000, currentYear: 202000 },
      { label: "9月", prevYear: 132000, currentYear: 150000 },
      { label: "10月", prevYear: 115000, currentYear: 138000 },
      { label: "11月", prevYear: 85000, currentYear: 102000 },
      { label: "12月", prevYear: 72000, currentYear: 92000 },
    ],
  },
  {
    vehicleName: "Rebel 250",
    registrationNo: "宮崎 え 34-56",
    data: [
      { label: "1月", prevYear: 60000, currentYear: 80000 },
      { label: "2月", prevYear: 56000, currentYear: 81000 },
      { label: "3月", prevYear: 107000, currentYear: 126000 },
      { label: "4月", prevYear: 128000, currentYear: 152000 },
      { label: "5月", prevYear: 153000, currentYear: 168000 },
      { label: "6月", prevYear: 95000, currentYear: 113000 },
      { label: "7月", prevYear: 180000, currentYear: 195000 },
      { label: "8月", prevYear: 195000, currentYear: 182000 },
      { label: "9月", prevYear: 121000, currentYear: 138000 },
      { label: "10月", prevYear: 102000, currentYear: 124000 },
      { label: "11月", prevYear: 75000, currentYear: 95000 },
      { label: "12月", prevYear: 65000, currentYear: 85000 },
    ],
  },
];

export default function VendorBikePerformancePage() {
  const [selectedStore, setSelectedStore] = useState("store-1");
  const [dateCondition, setDateCondition] = useState<"reservation" | "departure" | "return">("reservation");
  const [analysisUnit, setAnalysisUnit] = useState<"year" | "month">("month");
  const [paymentType, setPaymentType] = useState<"all" | "paid" | "free">("all");
  const [displayType, setDisplayType] = useState<"amount" | "count">("amount");
  const [activeTab, setActiveTab] = useState<"chart" | "list">("chart");
  const [analysisYear, setAnalysisYear] = useState("2026");

  const inputClass =
    "border border-gray-300 px-[10px] py-[6px] text-sm focus:outline-none focus:border-accent";

  return (
    <div>
      <VendorPageHeader
        title="車両予約実績"
        breadcrumbs={[{ label: "分析" }, { label: "車両予約実績" }]}
      />

      {/* 店舗選択 */}
      <div className="mb-[16px]">
        <StoreSelector stores={STORES} selectedId={selectedStore} onChange={setSelectedStore} />
      </div>

      {/* フィルターパネル */}
      <div className="bg-white border border-gray-200 p-[16px] mb-[16px]">
        <div className="space-y-[12px]">
          <div className="flex flex-wrap items-center gap-[24px]">
            {/* 日付条件セグメントトグル */}
            <div>
              <label className="block text-[11px] text-gray-400 mb-[4px]">日付条件</label>
              <div className="inline-flex border border-gray-200">
                {([
                  { value: "reservation", label: "予約登録日" },
                  { value: "departure", label: "出発日" },
                  { value: "return", label: "返却日" },
                ] as const).map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setDateCondition(opt.value)}
                    className={
                      "px-[14px] py-[6px] text-[13px] transition-colors " +
                      (dateCondition === opt.value
                        ? "bg-accent text-white"
                        : "bg-white text-gray-600 hover:bg-gray-50")
                    }
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            {/* 分析単位セグメントトグル */}
            <div>
              <label className="block text-[11px] text-gray-400 mb-[4px]">分析単位</label>
              <div className="inline-flex border border-gray-200">
                {([
                  { value: "year", label: "年単位" },
                  { value: "month", label: "月単位" },
                ] as const).map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setAnalysisUnit(opt.value)}
                    className={
                      "px-[14px] py-[6px] text-[13px] transition-colors " +
                      (analysisUnit === opt.value
                        ? "bg-accent text-white"
                        : "bg-white text-gray-600 hover:bg-gray-50")
                    }
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-[24px]">
            {/* 有償/無償セグメントトグル */}
            <div>
              <label className="block text-[11px] text-gray-400 mb-[4px]">有償/無償</label>
              <div className="inline-flex border border-gray-200">
                {([
                  { value: "all", label: "すべて" },
                  { value: "paid", label: "有償" },
                  { value: "free", label: "無償" },
                ] as const).map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setPaymentType(opt.value)}
                    className={
                      "px-[14px] py-[6px] text-[13px] transition-colors " +
                      (paymentType === opt.value
                        ? "bg-accent text-white"
                        : "bg-white text-gray-600 hover:bg-gray-50")
                    }
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            {/* 表示内容セグメントトグル */}
            <div>
              <label className="block text-[11px] text-gray-400 mb-[4px]">表示内容</label>
              <div className="inline-flex border border-gray-200">
                {([
                  { value: "amount", label: "金額" },
                  { value: "count", label: "件数" },
                ] as const).map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setDisplayType(opt.value)}
                    className={
                      "px-[14px] py-[6px] text-[13px] transition-colors " +
                      (displayType === opt.value
                        ? "bg-accent text-white"
                        : "bg-white text-gray-600 hover:bg-gray-50")
                    }
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            {/* 対象年 */}
            <div>
              <label className="block text-[11px] text-gray-400 mb-[4px]">対象年</label>
              <select value={analysisYear} onChange={(e) => setAnalysisYear(e.target.value)} className={inputClass + " w-[100px]"}>
                <option value="2025">2025年</option>
                <option value="2026">2026年</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-[8px] pt-[4px]">
            {/* 検索ボタン */}
            <button className="bg-gray-800 text-white px-[16px] py-[7px] text-sm hover:bg-gray-700 transition-colors">
              検索
            </button>
            {/* CSV出力ボタン */}
            <button className="flex items-center gap-[6px] border border-gray-300 bg-white px-[14px] py-[7px] text-sm text-gray-700 hover:bg-gray-50">
              <Download className="w-[14px] h-[14px]" />
              CSV出力
            </button>
          </div>
        </div>
      </div>

      {/* セグメント型タブ */}
      <div className="mb-[16px]">
        <div className="inline-flex bg-gray-100 p-[3px]">
          {([
            { key: "chart", label: "グラフ" },
            { key: "list", label: "リスト" },
          ] as const).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={
                "px-[16px] py-[6px] text-[13px] font-medium transition-colors " +
                (activeTab === tab.key
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700")
              }
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* コンテンツ: グラフ */}
      {activeTab === "chart" && (
        <div className="space-y-[16px]">
          {MOCK_VEHICLE_PERFORMANCE.map((vehicle) => (
            <AnalyticsChart
              key={vehicle.vehicleName}
              data={vehicle.data}
              title={`${vehicle.vehicleName}（${vehicle.registrationNo}）`}
              valueLabel="円"
            />
          ))}
        </div>
      )}

      {/* コンテンツ: リスト */}
      {activeTab === "list" && (
        <>
          {/* 車両別合計テーブル */}
          <div className="bg-white border border-gray-200 mb-[16px]">
            <div className="px-[16px] py-[12px] border-b border-gray-200">
              <h3 className="text-sm font-medium text-gray-700">車両別合計</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-[12px] py-[10px] text-left text-xs font-medium text-gray-500">車両名</th>
                    <th className="px-[12px] py-[10px] text-left text-xs font-medium text-gray-500">登録番号</th>
                    <th className="px-[12px] py-[10px] text-right text-xs font-medium text-gray-500">前年合計</th>
                    <th className="px-[12px] py-[10px] text-right text-xs font-medium text-gray-500">当年合計</th>
                    <th className="px-[12px] py-[10px] text-right text-xs font-medium text-gray-500">前年比</th>
                    <th className="px-[12px] py-[10px] text-right text-xs font-medium text-gray-500">差額</th>
                  </tr>
                </thead>
                <tbody>
                  {MOCK_VEHICLE_PERFORMANCE.map((vehicle) => {
                    const prevTotal = vehicle.data.reduce((s, d) => s + d.prevYear, 0);
                    const curTotal = vehicle.data.reduce((s, d) => s + d.currentYear, 0);
                    const ratio = prevTotal > 0 ? Math.round((curTotal / prevTotal) * 100) : 0;
                    const diff = curTotal - prevTotal;
                    return (
                      <tr key={vehicle.vehicleName} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="px-[12px] py-[10px] text-sm text-gray-700 font-medium">{vehicle.vehicleName}</td>
                        <td className="px-[12px] py-[10px] text-sm text-gray-500">{vehicle.registrationNo}</td>
                        <td className="px-[12px] py-[10px] text-sm text-gray-700 text-right">
                          &yen;{prevTotal.toLocaleString()}
                        </td>
                        <td className="px-[12px] py-[10px] text-sm text-gray-700 text-right">
                          &yen;{curTotal.toLocaleString()}
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
                    <td colSpan={2} className="px-[12px] py-[10px] text-sm font-medium text-gray-700">全車両合計</td>
                    <td className="px-[12px] py-[10px] text-sm font-medium text-gray-900 text-right">
                      &yen;{MOCK_VEHICLE_PERFORMANCE.reduce((s, v) => s + v.data.reduce((ss, d) => ss + d.prevYear, 0), 0).toLocaleString()}
                    </td>
                    <td className="px-[12px] py-[10px] text-sm font-medium text-gray-900 text-right">
                      &yen;{MOCK_VEHICLE_PERFORMANCE.reduce((s, v) => s + v.data.reduce((ss, d) => ss + d.currentYear, 0), 0).toLocaleString()}
                    </td>
                    <td className="px-[12px] py-[10px] text-sm font-medium text-accent text-right">
                      {(() => {
                        const pT = MOCK_VEHICLE_PERFORMANCE.reduce((s, v) => s + v.data.reduce((ss, d) => ss + d.prevYear, 0), 0);
                        const cT = MOCK_VEHICLE_PERFORMANCE.reduce((s, v) => s + v.data.reduce((ss, d) => ss + d.currentYear, 0), 0);
                        return pT > 0 ? Math.round((cT / pT) * 100) : 0;
                      })()}%
                    </td>
                    <td className="px-[12px] py-[10px] text-sm font-medium text-accent text-right">
                      +&yen;{(
                        MOCK_VEHICLE_PERFORMANCE.reduce((s, v) => s + v.data.reduce((ss, d) => ss + d.currentYear, 0), 0) -
                        MOCK_VEHICLE_PERFORMANCE.reduce((s, v) => s + v.data.reduce((ss, d) => ss + d.prevYear, 0), 0)
                      ).toLocaleString()}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* 車両別月次テーブル */}
          {MOCK_VEHICLE_PERFORMANCE.map((vehicle) => {
            const prevTotal = vehicle.data.reduce((s, d) => s + d.prevYear, 0);
            const curTotal = vehicle.data.reduce((s, d) => s + d.currentYear, 0);
            return (
              <div key={vehicle.vehicleName} className="bg-white border border-gray-200 mb-[16px]">
                <div className="px-[16px] py-[12px] border-b border-gray-200">
                  <h3 className="text-sm font-medium text-gray-700">
                    {vehicle.vehicleName}（{vehicle.registrationNo}）
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="px-[12px] py-[10px] text-left text-xs font-medium text-gray-500">月</th>
                        <th className="px-[12px] py-[10px] text-right text-xs font-medium text-gray-500">前年</th>
                        <th className="px-[12px] py-[10px] text-right text-xs font-medium text-gray-500">当年</th>
                        <th className="px-[12px] py-[10px] text-right text-xs font-medium text-gray-500">前年比</th>
                      </tr>
                    </thead>
                    <tbody>
                      {vehicle.data.map((d) => {
                        const ratio = d.prevYear > 0 ? Math.round((d.currentYear / d.prevYear) * 100) : 0;
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
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr className="bg-gray-50 border-t border-gray-200">
                        <td className="px-[12px] py-[10px] text-sm font-medium text-gray-700">合計</td>
                        <td className="px-[12px] py-[10px] text-sm font-medium text-gray-900 text-right">
                          &yen;{prevTotal.toLocaleString()}
                        </td>
                        <td className="px-[12px] py-[10px] text-sm font-medium text-gray-900 text-right">
                          &yen;{curTotal.toLocaleString()}
                        </td>
                        <td className={"px-[12px] py-[10px] text-sm font-medium text-right " + (curTotal >= prevTotal ? "text-accent" : "text-red-500")}>
                          {prevTotal > 0 ? Math.round((curTotal / prevTotal) * 100) : 0}%
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            );
          })}
        </>
      )}
    </div>
  );
}

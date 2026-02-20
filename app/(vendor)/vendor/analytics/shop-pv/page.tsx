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

const MOCK_PV_DATA = [
  { label: "1月", prevYear: 180, currentYear: 220, prevYearPc: 120, prevYearSp: 60, currentYearPc: 140, currentYearSp: 80 },
  { label: "2月", prevYear: 150, currentYear: 280, prevYearPc: 100, prevYearSp: 50, currentYearPc: 170, currentYearSp: 110 },
  { label: "3月", prevYear: 280, currentYear: 350, prevYearPc: 180, prevYearSp: 100, currentYearPc: 210, currentYearSp: 140 },
  { label: "4月", prevYear: 320, currentYear: 410, prevYearPc: 200, prevYearSp: 120, currentYearPc: 250, currentYearSp: 160 },
  { label: "5月", prevYear: 380, currentYear: 450, prevYearPc: 240, prevYearSp: 140, currentYearPc: 270, currentYearSp: 180 },
  { label: "6月", prevYear: 290, currentYear: 330, prevYearPc: 190, prevYearSp: 100, currentYearPc: 200, currentYearSp: 130 },
  { label: "7月", prevYear: 420, currentYear: 500, prevYearPc: 260, prevYearSp: 160, currentYearPc: 300, currentYearSp: 200 },
  { label: "8月", prevYear: 460, currentYear: 480, prevYearPc: 280, prevYearSp: 180, currentYearPc: 290, currentYearSp: 190 },
  { label: "9月", prevYear: 350, currentYear: 390, prevYearPc: 220, prevYearSp: 130, currentYearPc: 240, currentYearSp: 150 },
  { label: "10月", prevYear: 310, currentYear: 370, prevYearPc: 200, prevYearSp: 110, currentYearPc: 220, currentYearSp: 150 },
  { label: "11月", prevYear: 250, currentYear: 300, prevYearPc: 160, prevYearSp: 90, currentYearPc: 180, currentYearSp: 120 },
  { label: "12月", prevYear: 200, currentYear: 260, prevYearPc: 130, prevYearSp: 70, currentYearPc: 160, currentYearSp: 100 },
];

export default function VendorShopPVPage() {
  const [selectedStore, setSelectedStore] = useState("store-1");
  const [analysisUnit, setAnalysisUnit] = useState<"year" | "month" | "day">("month");
  const [activeTab, setActiveTab] = useState<"chart" | "table" | "list">("chart");
  const [analysisYear, setAnalysisYear] = useState("2026");
  const [analysisMonth, setAnalysisMonth] = useState("2");
  const [analysisDate, setAnalysisDate] = useState("2026-02-14");

  const inputClass =
    "border border-gray-300 px-[10px] py-[6px] text-sm focus:outline-none focus:border-accent";

  const totalPrevYear = MOCK_PV_DATA.reduce((s, d) => s + d.prevYear, 0);
  const totalCurrentYear = MOCK_PV_DATA.reduce((s, d) => s + d.currentYear, 0);

  return (
    <div>
      <VendorPageHeader
        title="店舗PV分析"
        breadcrumbs={[{ label: "分析" }, { label: "店舗PV分析" }]}
      />

      {/* 店舗選択 */}
      <div className="mb-[16px]">
        <StoreSelector stores={STORES} selectedId={selectedStore} onChange={setSelectedStore} />
      </div>

      {/* フィルターパネル */}
      <div className="bg-surface border-t border-gray-200 p-[16px] mb-[16px]">
        <div className="flex flex-wrap items-end gap-[16px]">
          {/* 分析単位セグメントトグル */}
          <div>
            <label className="block text-[12px] font-medium text-gray-500 uppercase tracking-wider mb-[6px]">分析単位</label>
            <div className="inline-flex border border-gray-200">
              {([
                { value: "year", label: "年単位" },
                { value: "month", label: "月単位" },
                { value: "day", label: "日単位" },
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

          {/* 年単位の場合: 対象年 */}
          {analysisUnit === "year" && (
            <div>
              <label className="block text-[12px] font-medium text-gray-500 uppercase tracking-wider mb-[6px]">対象年</label>
              <select value={analysisYear} onChange={(e) => setAnalysisYear(e.target.value)} className={inputClass + " w-[100px]"}>
                <option value="2025">2025年</option>
                <option value="2026">2026年</option>
              </select>
            </div>
          )}

          {/* 月単位の場合: 対象年月 */}
          {analysisUnit === "month" && (
            <div>
              <label className="block text-[12px] font-medium text-gray-500 uppercase tracking-wider mb-[6px]">対象年月</label>
              <div className="flex items-center gap-[4px]">
                <select value={analysisYear} onChange={(e) => setAnalysisYear(e.target.value)} className={inputClass + " w-[100px]"}>
                  <option value="2025">2025年</option>
                  <option value="2026">2026年</option>
                </select>
                <select value={analysisMonth} onChange={(e) => setAnalysisMonth(e.target.value)} className={inputClass + " w-[80px]"}>
                  {Array.from({ length: 12 }, (_, i) => (
                    <option key={i + 1} value={String(i + 1)}>{i + 1}月</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* 日単位の場合: 対象日 */}
          {analysisUnit === "day" && (
            <div>
              <label className="block text-[12px] font-medium text-gray-500 uppercase tracking-wider mb-[6px]">対象日</label>
              <input
                type="date"
                value={analysisDate}
                onChange={(e) => setAnalysisDate(e.target.value)}
                className={inputClass + " w-[170px]"}
              />
            </div>
          )}

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

      {/* セグメント型タブ */}
      <div className="mb-[16px]">
        <div className="inline-flex bg-gray-100 p-[3px]">
          {([
            { key: "chart", label: "グラフ" },
            { key: "table", label: "表" },
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
        <AnalyticsChart
          data={MOCK_PV_DATA}
          title="店舗PV推移"
          showDeviceBreakdown={true}
          valueLabel="PV"
        />
      )}

      {/* コンテンツ: 表 */}
      {activeTab === "table" && (
        <div className="bg-white border border-gray-200 overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-[12px] py-[10px] text-left text-xs font-medium text-gray-500">月</th>
                <th className="px-[12px] py-[10px] text-right text-xs font-medium text-gray-500">前年PV</th>
                <th className="px-[12px] py-[10px] text-right text-xs font-medium text-gray-500">当年PV</th>
                <th className="px-[12px] py-[10px] text-right text-xs font-medium text-gray-500">前年比</th>
                <th className="px-[12px] py-[10px] text-right text-xs font-medium text-gray-500">PC（前年）</th>
                <th className="px-[12px] py-[10px] text-right text-xs font-medium text-gray-500">SP（前年）</th>
                <th className="px-[12px] py-[10px] text-right text-xs font-medium text-gray-500">PC（当年）</th>
                <th className="px-[12px] py-[10px] text-right text-xs font-medium text-gray-500">SP（当年）</th>
              </tr>
            </thead>
            <tbody>
              {MOCK_PV_DATA.map((d) => {
                const ratio = d.prevYear > 0 ? Math.round((d.currentYear / d.prevYear) * 100) : 0;
                return (
                  <tr key={d.label} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-[12px] py-[10px] text-sm text-gray-700">{d.label}</td>
                    <td className="px-[12px] py-[10px] text-sm text-gray-700 text-right">{d.prevYear.toLocaleString()}</td>
                    <td className="px-[12px] py-[10px] text-sm text-gray-700 text-right">{d.currentYear.toLocaleString()}</td>
                    <td className={"px-[12px] py-[10px] text-sm text-right " + (ratio >= 100 ? "text-accent" : "text-red-500")}>
                      {ratio}%
                    </td>
                    <td className="px-[12px] py-[10px] text-sm text-gray-500 text-right">{(d.prevYearPc ?? 0).toLocaleString()}</td>
                    <td className="px-[12px] py-[10px] text-sm text-gray-500 text-right">{(d.prevYearSp ?? 0).toLocaleString()}</td>
                    <td className="px-[12px] py-[10px] text-sm text-gray-500 text-right">{(d.currentYearPc ?? 0).toLocaleString()}</td>
                    <td className="px-[12px] py-[10px] text-sm text-gray-500 text-right">{(d.currentYearSp ?? 0).toLocaleString()}</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-gray-50 border-t border-gray-200">
                <td className="px-[12px] py-[10px] text-sm font-medium text-gray-700">合計</td>
                <td className="px-[12px] py-[10px] text-sm font-medium text-gray-900 text-right">{totalPrevYear.toLocaleString()}</td>
                <td className="px-[12px] py-[10px] text-sm font-medium text-gray-900 text-right">{totalCurrentYear.toLocaleString()}</td>
                <td className={"px-[12px] py-[10px] text-sm font-medium text-right " + (totalCurrentYear >= totalPrevYear ? "text-accent" : "text-red-500")}>
                  {totalPrevYear > 0 ? Math.round((totalCurrentYear / totalPrevYear) * 100) : 0}%
                </td>
                <td colSpan={4} />
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {/* コンテンツ: リスト */}
      {activeTab === "list" && (
        <div className="bg-white border border-gray-200">
          {MOCK_PV_DATA.map((d, i) => (
            <div
              key={d.label}
              className={
                "flex items-center justify-between px-[16px] py-[12px]" +
                (i < MOCK_PV_DATA.length - 1 ? " border-b border-gray-100" : "")
              }
            >
              <div>
                <p className="text-sm text-gray-700 font-medium">{d.label}</p>
                <p className="text-xs text-gray-400 mt-[2px]">
                  PC: {(d.currentYearPc ?? 0).toLocaleString()} / SP: {(d.currentYearSp ?? 0).toLocaleString()}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{d.currentYear.toLocaleString()} PV</p>
                <p className="text-xs text-gray-400">前年: {d.prevYear.toLocaleString()} PV</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

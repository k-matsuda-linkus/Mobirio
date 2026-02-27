"use client";

import { useState, useEffect, useCallback } from "react";
import { Download, TrendingUp, TrendingDown } from "lucide-react";
import { VendorPageHeader } from "@/components/vendor/VendorPageHeader";
import { StoreSelector } from "@/components/vendor/StoreSelector";
import { AnalyticsChart } from "@/components/vendor/AnalyticsChart";

const STORES = [
  { id: "store-1", name: "宮崎橘通り店" },
  { id: "store-2", name: "宮崎空港店" },
];

const MONTH_LABELS = ["1月","2月","3月","4月","5月","6月","7月","8月","9月","10月","11月","12月"];

interface PVDataRow {
  label: string;
  prevYear: number;
  currentYear: number;
  prevYearPc?: number;
  prevYearSp?: number;
  currentYearPc?: number;
  currentYearSp?: number;
}

export default function VendorShopPVPage() {
  const [selectedStore, setSelectedStore] = useState("store-1");
  const [analysisUnit, setAnalysisUnit] = useState<"year" | "month" | "day">("month");
  const [activeTab, setActiveTab] = useState<"chart" | "table" | "list">("chart");
  const [analysisYear, setAnalysisYear] = useState("2026");
  const [analysisMonth, setAnalysisMonth] = useState("2");
  const [analysisDate, setAnalysisDate] = useState("2026-02-14");
  const [pvData, setPvData] = useState<PVDataRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(() => {
    setLoading(true);
    const currentYear = analysisYear;
    const prevYear = String(parseInt(currentYear) - 1);

    const params = new URLSearchParams({ year: currentYear, unit: analysisUnit });
    if (analysisUnit === "day") {
      params.set("month", analysisMonth);
    }

    const prevParams = new URLSearchParams({ year: prevYear, unit: analysisUnit });
    if (analysisUnit === "day") {
      prevParams.set("month", analysisMonth);
    }

    Promise.all([
      fetch(`/api/vendor/analytics/shop-pv?${params}`).then((r) => r.ok ? r.json() : null),
      fetch(`/api/vendor/analytics/shop-pv?${prevParams}`).then((r) => r.ok ? r.json() : null),
    ])
      .then(([curJson, prevJson]) => {
        const curData: Array<{ label: string; pc: number; sp: number; total: number }> = curJson?.data || [];
        const prevData: Array<{ label: string; pc: number; sp: number; total: number }> = prevJson?.data || [];

        const merged: PVDataRow[] = curData.map((cur, i) => {
          const prev = prevData[i];
          const labelDisplay = analysisUnit === "month"
            ? MONTH_LABELS[i] || cur.label
            : cur.label;
          return {
            label: labelDisplay,
            currentYear: cur.total,
            prevYear: prev?.total || 0,
            currentYearPc: cur.pc,
            currentYearSp: cur.sp,
            prevYearPc: prev?.pc || 0,
            prevYearSp: prev?.sp || 0,
          };
        });
        setPvData(merged);
      })
      .catch((err) => console.error("shop-pv fetch error:", err))
      .finally(() => setLoading(false));
  }, [analysisYear, analysisUnit, analysisMonth]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const inputClass =
    "border border-gray-300 px-[10px] py-[6px] text-sm focus:outline-none focus:border-accent";

  const totalPrevYear = pvData.reduce((s, d) => s + d.prevYear, 0);
  const totalCurrentYear = pvData.reduce((s, d) => s + d.currentYear, 0);
  const yoyRatio = totalPrevYear > 0 ? Math.round((totalCurrentYear / totalPrevYear) * 100) : 0;

  return (
    <div>
      <VendorPageHeader
        title="店舗アクセス分析"
        breadcrumbs={[{ label: "分析" }, { label: "店舗アクセス分析" }]}
      />

      {/* 店舗選択 */}
      <div className="mb-[16px]">
        <StoreSelector stores={STORES} selectedId={selectedStore} onChange={setSelectedStore} />
      </div>

      {/* フィルターパネル */}
      <div className="bg-white border border-gray-200 p-[16px] mb-[16px]">
        <div className="flex flex-wrap items-end gap-[16px]">
          {/* 分析単位セグメントトグル */}
          <div>
            <label className="block text-[11px] text-gray-400 mb-[4px]">分析単位</label>
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
              <label className="block text-[11px] text-gray-400 mb-[4px]">対象年</label>
              <select value={analysisYear} onChange={(e) => setAnalysisYear(e.target.value)} className={inputClass + " w-[100px]"}>
                <option value="2025">2025年</option>
                <option value="2026">2026年</option>
              </select>
            </div>
          )}

          {/* 月単位の場合: 対象年月 */}
          {analysisUnit === "month" && (
            <div>
              <label className="block text-[11px] text-gray-400 mb-[4px]">対象年月</label>
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
              <label className="block text-[11px] text-gray-400 mb-[4px]">対象日</label>
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

      {/* サマリーKPIカード */}
      <div className="grid grid-cols-3 gap-[16px] mb-[16px]">
        <div className="bg-white border border-gray-200 p-[20px]">
          <p className="text-[11px] text-gray-400 mb-[4px]">当年合計</p>
          <p className="text-[26px] font-semibold tracking-tight">{totalCurrentYear.toLocaleString()}</p>
        </div>
        <div className="bg-white border border-gray-200 p-[20px]">
          <p className="text-[11px] text-gray-400 mb-[4px]">前年合計</p>
          <p className="text-[26px] font-semibold tracking-tight">{totalPrevYear.toLocaleString()}</p>
        </div>
        <div className="bg-white border border-gray-200 p-[20px]">
          <p className="text-[11px] text-gray-400 mb-[4px]">前年比</p>
          <div className="flex items-center gap-[8px]">
            <p className={"text-[26px] font-semibold tracking-tight " + (yoyRatio >= 100 ? "text-accent" : "text-red-500")}>
              {yoyRatio}%
            </p>
            {yoyRatio >= 100 ? (
              <TrendingUp className="w-[20px] h-[20px] text-accent" />
            ) : (
              <TrendingDown className="w-[20px] h-[20px] text-red-500" />
            )}
          </div>
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
          data={pvData}
          title="店舗アクセス推移"
          showDeviceBreakdown={true}
          valueLabel="閲覧数"
        />
      )}

      {/* コンテンツ: 表 */}
      {activeTab === "table" && (
        <div className="bg-white border border-gray-200 overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-[12px] py-[10px] text-left text-xs font-medium text-gray-500">月</th>
                <th className="px-[12px] py-[10px] text-right text-xs font-medium text-gray-500">前年閲覧数</th>
                <th className="px-[12px] py-[10px] text-right text-xs font-medium text-gray-500">当年閲覧数</th>
                <th className="px-[12px] py-[10px] text-right text-xs font-medium text-gray-500">前年比</th>
                <th className="px-[12px] py-[10px] text-right text-xs font-medium text-gray-500">パソコン（前年）</th>
                <th className="px-[12px] py-[10px] text-right text-xs font-medium text-gray-500">スマホ（前年）</th>
                <th className="px-[12px] py-[10px] text-right text-xs font-medium text-gray-500">パソコン（当年）</th>
                <th className="px-[12px] py-[10px] text-right text-xs font-medium text-gray-500">スマホ（当年）</th>
              </tr>
            </thead>
            <tbody>
              {pvData.map((d) => {
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
          {pvData.map((d, i) => (
            <div
              key={d.label}
              className={
                "flex items-center justify-between px-[16px] py-[12px]" +
                (i < pvData.length - 1 ? " border-b border-gray-100" : "")
              }
            >
              <div>
                <p className="text-sm text-gray-700 font-medium">{d.label}</p>
                <p className="text-xs text-gray-400 mt-[2px]">
                  パソコン: {(d.currentYearPc ?? 0).toLocaleString()} / スマホ: {(d.currentYearSp ?? 0).toLocaleString()}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{d.currentYear.toLocaleString()} 閲覧</p>
                <p className="text-xs text-gray-400">前年: {d.prevYear.toLocaleString()} 閲覧</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

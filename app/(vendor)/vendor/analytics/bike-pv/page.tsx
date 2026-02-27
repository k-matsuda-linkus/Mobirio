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

interface VehiclePV {
  vehicleName: string;
  registrationNo: string;
  data: PVDataRow[];
}

export default function VendorBikePVPage() {
  const [selectedStore, setSelectedStore] = useState("store-1");
  const [analysisUnit, setAnalysisUnit] = useState<"year" | "month" | "day">("month");
  const [analysisYear, setAnalysisYear] = useState("2026");
  const [analysisMonth, setAnalysisMonth] = useState("2");
  const [analysisDate, setAnalysisDate] = useState("2026-02-14");
  const [vehiclePVData, setVehiclePVData] = useState<VehiclePV[]>([]);
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
      fetch(`/api/vendor/analytics/bike-pv?${params}`).then((r) => r.ok ? r.json() : null),
      fetch(`/api/vendor/analytics/bike-pv?${prevParams}`).then((r) => r.ok ? r.json() : null),
    ])
      .then(([curJson, prevJson]) => {
        const curBikes: Array<{ bike_id: string; bike_name: string; registration_number?: string; periods: Array<{ label: string; pc: number; sp: number; total: number }> }> = curJson?.data || [];
        const prevBikes: Array<{ bike_id: string; periods: Array<{ label: string; pc: number; sp: number; total: number }> }> = prevJson?.data || [];

        const merged: VehiclePV[] = curBikes.map((curBike) => {
          const prevBike = prevBikes.find((pb) => pb.bike_id === curBike.bike_id);
          const rows: PVDataRow[] = curBike.periods.map((cur, i) => {
            const prev = prevBike?.periods[i];
            const labelDisplay = analysisUnit === "month" ? (MONTH_LABELS[i] || cur.label) : cur.label;
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
          return {
            vehicleName: curBike.bike_name,
            registrationNo: curBike.registration_number || "",
            data: rows,
          };
        });
        setVehiclePVData(merged);
      })
      .catch((err) => console.error("bike-pv fetch error:", err))
      .finally(() => setLoading(false));
  }, [analysisYear, analysisUnit, analysisMonth]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const inputClass =
    "border border-gray-300 px-[10px] py-[6px] text-sm focus:outline-none focus:border-accent";

  return (
    <div>
      <VendorPageHeader
        title="車両アクセス分析"
        breadcrumbs={[{ label: "分析" }, { label: "車両アクセス分析" }]}
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

      {/* 車両別チャート */}
      {loading ? (
        <div className="text-sm text-gray-500 py-[24px] text-center">読み込み中...</div>
      ) : vehiclePVData.length === 0 ? (
        <div className="text-sm text-gray-400 py-[24px] text-center">データがありません</div>
      ) : (
        <div className="space-y-[16px]">
          {vehiclePVData.map((vehicle) => {
            const prevTotal = vehicle.data.reduce((s, d) => s + d.prevYear, 0);
            const curTotal = vehicle.data.reduce((s, d) => s + d.currentYear, 0);
            const ratio = prevTotal > 0 ? Math.round((curTotal / prevTotal) * 100) : 0;

            return (
              <div key={vehicle.vehicleName}>
                {/* 車両別サマリーKPI */}
                <div className="flex items-center gap-[16px] text-sm mb-[12px]">
                  <span className="text-gray-400">前年</span>
                  <span className="font-medium">{prevTotal.toLocaleString()}</span>
                  <span className="text-gray-400">当年</span>
                  <span className="font-medium">{curTotal.toLocaleString()}</span>
                  <span className="flex items-center gap-[4px]">
                    {ratio >= 100 ? (
                      <TrendingUp className="w-[14px] h-[14px] text-accent" />
                    ) : (
                      <TrendingDown className="w-[14px] h-[14px] text-red-500" />
                    )}
                    <span className={ratio >= 100 ? "text-accent" : "text-red-500"}>{ratio}%</span>
                  </span>
                </div>
                <AnalyticsChart
                  data={vehicle.data}
                  title={`${vehicle.vehicleName}${vehicle.registrationNo ? `（${vehicle.registrationNo}）` : ""}`}
                  showDeviceBreakdown={true}
                  valueLabel="閲覧数"
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

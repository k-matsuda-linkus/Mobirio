"use client";

import { useState, useEffect, useCallback } from "react";
import { Download } from "lucide-react";
import { VendorPageHeader } from "@/components/vendor/VendorPageHeader";
import { StoreSelector } from "@/components/vendor/StoreSelector";
import { AnalyticsChart } from "@/components/vendor/AnalyticsChart";

const STORES = [
  { id: "store-1", name: "宮崎橘通り店" },
  { id: "store-2", name: "宮崎空港店" },
];

const MONTH_LABELS = ["1月","2月","3月","4月","5月","6月","7月","8月","9月","10月","11月","12月"];

interface VehiclePerformance {
  vehicleName: string;
  registrationNo: string;
  data: { label: string; prevYear: number; currentYear: number }[];
}

export default function VendorBikePerformancePage() {
  const [selectedStore, setSelectedStore] = useState("store-1");
  const [dateCondition, setDateCondition] = useState<"start" | "end" | "completed">("start");
  const [analysisUnit, setAnalysisUnit] = useState<"year" | "month">("month");
  const [paymentType, setPaymentType] = useState<"all" | "paid" | "unpaid">("all");
  const [displayType, setDisplayType] = useState<"amount" | "count">("amount");
  const [activeTab, setActiveTab] = useState<"chart" | "list">("chart");
  const [analysisYear, setAnalysisYear] = useState("2026");
  const [vehicleData, setVehicleData] = useState<VehiclePerformance[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(() => {
    setLoading(true);
    const currentYear = analysisYear;
    const prevYear = String(parseInt(currentYear) - 1);

    const params = new URLSearchParams({
      year: currentYear,
      unit: analysisUnit,
      date_type: dateCondition,
      paid_type: paymentType,
      display: displayType,
    });
    const prevParams = new URLSearchParams({
      year: prevYear,
      unit: analysisUnit,
      date_type: dateCondition,
      paid_type: paymentType,
      display: displayType,
    });

    Promise.all([
      fetch(`/api/vendor/analytics/bike-performance?${params}`).then((r) => r.ok ? r.json() : null),
      fetch(`/api/vendor/analytics/bike-performance?${prevParams}`).then((r) => r.ok ? r.json() : null),
    ])
      .then(([curJson, prevJson]) => {
        const curBikes: Array<{ bike_id: string; bike_name: string; registration_number?: string; months: Array<{ label: string; total_amount?: number; rental_amount?: number; option_amount?: number; insurance_amount?: number; reservation_count?: number; completed_count?: number; cancelled_count?: number }> }> = curJson?.data || [];
        const prevBikes: Array<{ bike_id: string; months: Array<{ label: string; total_amount?: number; reservation_count?: number }> }> = prevJson?.data || [];

        const getValue = (item: Record<string, unknown>) => {
          if (displayType === "amount") return (item.total_amount as number) ?? 0;
          return (item.reservation_count as number) ?? 0;
        };

        const merged: VehiclePerformance[] = curBikes.map((curBike) => {
          const prevBike = prevBikes.find((pb) => pb.bike_id === curBike.bike_id);
          const rows = curBike.months.map((cur, i) => {
            const prev = prevBike?.months[i];
            const labelDisplay = analysisUnit === "month" ? (MONTH_LABELS[i] || cur.label) : cur.label;
            return {
              label: labelDisplay,
              currentYear: getValue(cur as unknown as Record<string, unknown>),
              prevYear: prev ? getValue(prev as unknown as Record<string, unknown>) : 0,
            };
          });
          return {
            vehicleName: curBike.bike_name,
            registrationNo: curBike.registration_number || "",
            data: rows,
          };
        });
        setVehicleData(merged);
      })
      .catch((err) => console.error("bike-performance fetch error:", err))
      .finally(() => setLoading(false));
  }, [analysisYear, analysisUnit, dateCondition, paymentType, displayType]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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
                  { value: "start", label: "予約登録日" },
                  { value: "end", label: "出発日" },
                  { value: "completed", label: "返却日" },
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
                  { value: "unpaid", label: "無償" },
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

      {loading ? (
        <div className="text-sm text-gray-500 py-[24px] text-center">読み込み中...</div>
      ) : vehicleData.length === 0 ? (
        <div className="text-sm text-gray-400 py-[24px] text-center">データがありません</div>
      ) : (
        <>
          {/* コンテンツ: グラフ */}
          {activeTab === "chart" && (
            <div className="space-y-[16px]">
              {vehicleData.map((vehicle) => (
                <AnalyticsChart
                  key={vehicle.vehicleName}
                  data={vehicle.data}
                  title={`${vehicle.vehicleName}${vehicle.registrationNo ? `（${vehicle.registrationNo}）` : ""}`}
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
                      {vehicleData.map((vehicle) => {
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
                          &yen;{vehicleData.reduce((s, v) => s + v.data.reduce((ss, d) => ss + d.prevYear, 0), 0).toLocaleString()}
                        </td>
                        <td className="px-[12px] py-[10px] text-sm font-medium text-gray-900 text-right">
                          &yen;{vehicleData.reduce((s, v) => s + v.data.reduce((ss, d) => ss + d.currentYear, 0), 0).toLocaleString()}
                        </td>
                        <td className="px-[12px] py-[10px] text-sm font-medium text-accent text-right">
                          {(() => {
                            const pT = vehicleData.reduce((s, v) => s + v.data.reduce((ss, d) => ss + d.prevYear, 0), 0);
                            const cT = vehicleData.reduce((s, v) => s + v.data.reduce((ss, d) => ss + d.currentYear, 0), 0);
                            return pT > 0 ? Math.round((cT / pT) * 100) : 0;
                          })()}%
                        </td>
                        <td className="px-[12px] py-[10px] text-sm font-medium text-accent text-right">
                          +&yen;{(
                            vehicleData.reduce((s, v) => s + v.data.reduce((ss, d) => ss + d.currentYear, 0), 0) -
                            vehicleData.reduce((s, v) => s + v.data.reduce((ss, d) => ss + d.prevYear, 0), 0)
                          ).toLocaleString()}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* 車両別月次テーブル */}
              {vehicleData.map((vehicle) => {
                const prevTotal = vehicle.data.reduce((s, d) => s + d.prevYear, 0);
                const curTotal = vehicle.data.reduce((s, d) => s + d.currentYear, 0);
                return (
                  <div key={vehicle.vehicleName} className="bg-white border border-gray-200 mb-[16px]">
                    <div className="px-[16px] py-[12px] border-b border-gray-200">
                      <h3 className="text-sm font-medium text-gray-700">
                        {vehicle.vehicleName}{vehicle.registrationNo ? `（${vehicle.registrationNo}）` : ""}
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
        </>
      )}
    </div>
  );
}

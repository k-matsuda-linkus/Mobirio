"use client";

import { useState, useEffect } from "react";
import { Download } from "lucide-react";
import { VendorPageHeader } from "@/components/vendor/VendorPageHeader";

interface InsuranceRecordAPI {
  reservation_id: string;
  bike_name: string;
  user_name: string;
  start_date: string;
  end_date: string;
  days: number;
  insurance_type: string;
  insurance_daily_rate: number;
  insurance_total: number;
}

interface InsuranceRow {
  id: string;
  bikeName: string;
  userName: string;
  startDate: string;
  endDate: string;
  days: number;
  insuranceType: string;
  dailyRate: number;
  totalAmount: number;
}

export default function VendorInsuranceExportPage() {
  const [year, setYear] = useState("2026");
  const [month, setMonth] = useState("2");
  const [store, setStore] = useState(""); // eslint-disable-line @typescript-eslint/no-unused-vars
  const [rows, setRows] = useState<InsuranceRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/vendor/exports/insurance?year=${year}&month=${month}`)
      .then((r) => r.ok ? r.json() : null)
      .then((json) => {
        if (json?.data?.records) {
          const mapped: InsuranceRow[] = (json.data.records as InsuranceRecordAPI[]).map((rec) => ({
            id: rec.reservation_id,
            bikeName: rec.bike_name,
            userName: rec.user_name,
            startDate: rec.start_date,
            endDate: rec.end_date,
            days: rec.days,
            insuranceType: rec.insurance_type === "premium" ? "プレミアム" : "スタンダード",
            dailyRate: rec.insurance_daily_rate,
            totalAmount: rec.insurance_total,
          }));
          setRows(mapped);
        } else {
          setRows([]);
        }
      })
      .catch((err) => console.error("insurance export error:", err))
      .finally(() => setLoading(false));
  }, [year, month]);

  const filteredRows = rows;
  const totalPremium = filteredRows.reduce((sum, row) => sum + row.totalAmount, 0);

  const inputClass =
    "border border-gray-300 px-[10px] py-[6px] text-sm focus:outline-none focus:border-accent";

  return (
    <div>
      <VendorPageHeader
        title="任意保険請求明細書"
        breadcrumbs={[{ label: "データ出力" }, { label: "任意保険請求明細書" }]}
      />

      {/* Filters */}
      <div className="bg-white border border-gray-200 p-[16px] mb-[16px]">
        <div className="flex flex-wrap items-end gap-[16px]">
          <div>
            <label className="block text-xs text-gray-500 mb-[4px]">対象年月</label>
            <div className="flex items-center gap-[4px]">
              <select value={year} onChange={(e) => setYear(e.target.value)} className={inputClass + " w-[100px]"}>
                <option value="2024">2024年</option>
                <option value="2025">2025年</option>
                <option value="2026">2026年</option>
              </select>
              <select value={month} onChange={(e) => setMonth(e.target.value)} className={inputClass + " w-[80px]"}>
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i + 1} value={String(i + 1)}>
                    {i + 1}月
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-[4px]">店舗</label>
            <select value={store} onChange={(e) => setStore(e.target.value)} className={inputClass + " w-[200px]"}>
              <option value="">すべて</option>
              <option value="宮崎橘通り店">宮崎橘通り店</option>
              <option value="宮崎空港店">宮崎空港店</option>
            </select>
          </div>
          <button className="flex items-center gap-[6px] bg-accent text-white px-[16px] py-[7px] text-sm hover:bg-accent/90">
            <Download className="w-[14px] h-[14px]" />
            Excel出力
          </button>
        </div>
      </div>

      {/* Total */}
      <div className="bg-white border border-gray-200 px-[16px] py-[12px] mb-[4px]">
        <p className="text-sm text-gray-700">
          ご請求金額：
          <span className="text-lg font-medium text-gray-900 ml-[8px]">
            &yen;{totalPremium.toLocaleString()}
          </span>
        </p>
      </div>

      {/* Preview table */}
      {loading ? (
        <div className="text-sm text-gray-500 py-[24px] text-center">読み込み中...</div>
      ) : (
        <div className="bg-white border border-gray-200 overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-[12px] py-[10px] text-left text-xs font-medium text-gray-500 whitespace-nowrap">予約ID</th>
                <th className="px-[12px] py-[10px] text-left text-xs font-medium text-gray-500 whitespace-nowrap">車両名</th>
                <th className="px-[12px] py-[10px] text-left text-xs font-medium text-gray-500 whitespace-nowrap">利用者</th>
                <th className="px-[12px] py-[10px] text-left text-xs font-medium text-gray-500 whitespace-nowrap">開始日</th>
                <th className="px-[12px] py-[10px] text-left text-xs font-medium text-gray-500 whitespace-nowrap">終了日</th>
                <th className="px-[12px] py-[10px] text-right text-xs font-medium text-gray-500 whitespace-nowrap">日数</th>
                <th className="px-[12px] py-[10px] text-left text-xs font-medium text-gray-500 whitespace-nowrap">保険種別</th>
                <th className="px-[12px] py-[10px] text-right text-xs font-medium text-gray-500 whitespace-nowrap">日額</th>
                <th className="px-[12px] py-[10px] text-right text-xs font-medium text-gray-500 whitespace-nowrap">保険料合計</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((row) => (
                <tr key={row.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-[12px] py-[10px] text-sm text-gray-700 font-mono text-xs whitespace-nowrap">{row.id}</td>
                  <td className="px-[12px] py-[10px] text-sm text-gray-700 whitespace-nowrap">{row.bikeName}</td>
                  <td className="px-[12px] py-[10px] text-sm text-gray-700 whitespace-nowrap">{row.userName}</td>
                  <td className="px-[12px] py-[10px] text-sm text-gray-700 whitespace-nowrap">{row.startDate}</td>
                  <td className="px-[12px] py-[10px] text-sm text-gray-700 whitespace-nowrap">{row.endDate}</td>
                  <td className="px-[12px] py-[10px] text-sm text-gray-700 text-right">{row.days}</td>
                  <td className="px-[12px] py-[10px] text-sm text-gray-700">{row.insuranceType}</td>
                  <td className="px-[12px] py-[10px] text-sm text-gray-700 text-right whitespace-nowrap">
                    &yen;{row.dailyRate.toLocaleString()}
                  </td>
                  <td className="px-[12px] py-[10px] text-sm text-gray-700 text-right whitespace-nowrap">
                    &yen;{row.totalAmount.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-gray-50 border-t border-gray-200">
                <td colSpan={8} className="px-[12px] py-[10px] text-sm font-medium text-gray-700 text-right">
                  合計
                </td>
                <td className="px-[12px] py-[10px] text-sm font-medium text-gray-900 text-right whitespace-nowrap">
                  &yen;{totalPremium.toLocaleString()}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { Download } from "lucide-react";
import { VendorPageHeader } from "@/components/vendor/VendorPageHeader";

interface RoyaltyRecordAPI {
  reservation_id: string;
  bike_name: string;
  user_name: string;
  rental_amount: number;
  option_amount: number;
  insurance_amount: number;
  total_amount: number;
  royalty_rate: number;
  royalty_amount: number;
  net_amount: number;
  completed_at: string;
}

interface RoyaltyRow {
  id: string;
  no: number;
  userName: string;
  reservationNo: string;
  vehicleName: string;
  rentalAmount: number;
  optionAmount: number;
  insuranceAmount: number;
  totalAmount: number;
  royaltyRate: number;
  royaltyAmount: number;
  netAmount: number;
  completedAt: string;
}

export default function VendorRoyaltyExportPage() {
  const [year, setYear] = useState("2026");
  const [month, setMonth] = useState("1");
  const [rows, setRows] = useState<RoyaltyRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/vendor/exports/royalty?year=${year}&month=${month}`)
      .then((r) => r.ok ? r.json() : null)
      .then((json) => {
        if (json?.data?.records) {
          const mapped: RoyaltyRow[] = (json.data.records as RoyaltyRecordAPI[]).map((rec, i) => ({
            id: rec.reservation_id,
            no: i + 1,
            userName: rec.user_name,
            reservationNo: rec.reservation_id,
            vehicleName: rec.bike_name,
            rentalAmount: rec.rental_amount,
            optionAmount: rec.option_amount,
            insuranceAmount: rec.insurance_amount,
            totalAmount: rec.total_amount,
            royaltyRate: rec.royalty_rate,
            royaltyAmount: rec.royalty_amount,
            netAmount: rec.net_amount,
            completedAt: rec.completed_at ? rec.completed_at.slice(0, 10) : "",
          }));
          setRows(mapped);
        } else {
          setRows([]);
        }
      })
      .catch((err) => console.error("royalty export error:", err))
      .finally(() => setLoading(false));
  }, [year, month]);

  const totalRoyaltyExTax = rows.reduce((s, r) => s + r.royaltyAmount, 0);
  const totalRoyaltyInTax = Math.round(totalRoyaltyExTax * 1.1);
  const totalRevenue = rows.reduce((s, r) => s + r.totalAmount, 0);
  const totalNet = rows.reduce((s, r) => s + r.netAmount, 0);

  const inputClass =
    "border border-gray-300 px-[10px] py-[6px] text-sm focus:outline-none focus:border-accent";

  return (
    <div>
      <VendorPageHeader
        title="ロイヤリティ明細書"
        breadcrumbs={[{ label: "データ出力" }, { label: "ロイヤリティ明細書" }]}
      />

      {/* Filters */}
      <div className="bg-white border border-gray-200 p-[16px] mb-[16px]">
        <div className="flex flex-wrap items-end gap-[16px]">
          <div>
            <label className="block text-xs text-gray-500 mb-[4px]">対象月</label>
            <div className="flex items-center gap-[4px]">
              <select value={year} onChange={(e) => setYear(e.target.value)} className={inputClass + " w-[100px]"}>
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
            <label className="block text-xs text-gray-500 mb-[4px]">計算書計上日</label>
            <p className="text-sm text-gray-700 py-[6px]">{year}/{ String(Number(month) + 1).padStart(2, "0")}/10</p>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-[4px]">発行日</label>
            <p className="text-sm text-gray-700 py-[6px]">{year}/{ String(Number(month) + 1).padStart(2, "0")}/15</p>
          </div>
          <button className="flex items-center gap-[6px] bg-accent text-white px-[16px] py-[7px] text-sm hover:bg-accent/90">
            <Download className="w-[14px] h-[14px]" />
            Excel出力
          </button>
        </div>
      </div>

      {/* Preview table */}
      {loading ? (
        <div className="text-sm text-gray-500 py-[24px] text-center">読み込み中...</div>
      ) : (
        <div className="bg-white border border-gray-200 overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-[10px] py-[10px] text-left text-xs font-medium text-gray-500 whitespace-nowrap">NO</th>
                <th className="px-[10px] py-[10px] text-left text-xs font-medium text-gray-500 whitespace-nowrap">利用者</th>
                <th className="px-[10px] py-[10px] text-left text-xs font-medium text-gray-500 whitespace-nowrap">予約番号</th>
                <th className="px-[10px] py-[10px] text-left text-xs font-medium text-gray-500 whitespace-nowrap">車名</th>
                <th className="px-[10px] py-[10px] text-right text-xs font-medium text-gray-500 whitespace-nowrap">レンタル料金</th>
                <th className="px-[10px] py-[10px] text-right text-xs font-medium text-gray-500 whitespace-nowrap">オプション</th>
                <th className="px-[10px] py-[10px] text-right text-xs font-medium text-gray-500 whitespace-nowrap">保険</th>
                <th className="px-[10px] py-[10px] text-right text-xs font-medium text-gray-500 whitespace-nowrap">合計金額</th>
                <th className="px-[10px] py-[10px] text-right text-xs font-medium text-gray-500 whitespace-nowrap">ロイヤリティ率</th>
                <th className="px-[10px] py-[10px] text-right text-xs font-medium text-gray-500 whitespace-nowrap">ロイヤリティ額</th>
                <th className="px-[10px] py-[10px] text-right text-xs font-medium text-gray-500 whitespace-nowrap">差引額</th>
                <th className="px-[10px] py-[10px] text-left text-xs font-medium text-gray-500 whitespace-nowrap">完了日</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-[10px] py-[10px] text-sm text-gray-700">{row.no}</td>
                  <td className="px-[10px] py-[10px] text-sm text-gray-700 whitespace-nowrap">{row.userName}</td>
                  <td className="px-[10px] py-[10px] text-sm text-gray-700 font-mono text-xs whitespace-nowrap">{row.reservationNo}</td>
                  <td className="px-[10px] py-[10px] text-sm text-gray-700 whitespace-nowrap">{row.vehicleName}</td>
                  <td className="px-[10px] py-[10px] text-sm text-gray-700 text-right whitespace-nowrap">
                    &yen;{row.rentalAmount.toLocaleString()}
                  </td>
                  <td className="px-[10px] py-[10px] text-sm text-gray-700 text-right whitespace-nowrap">
                    &yen;{row.optionAmount.toLocaleString()}
                  </td>
                  <td className="px-[10px] py-[10px] text-sm text-gray-700 text-right whitespace-nowrap">
                    &yen;{row.insuranceAmount.toLocaleString()}
                  </td>
                  <td className="px-[10px] py-[10px] text-sm text-gray-700 text-right whitespace-nowrap">
                    &yen;{row.totalAmount.toLocaleString()}
                  </td>
                  <td className="px-[10px] py-[10px] text-sm text-gray-700 text-right">{Math.round(row.royaltyRate * 100)}%</td>
                  <td className="px-[10px] py-[10px] text-sm text-gray-700 text-right whitespace-nowrap">
                    &yen;{row.royaltyAmount.toLocaleString()}
                  </td>
                  <td className="px-[10px] py-[10px] text-sm text-gray-700 text-right whitespace-nowrap">
                    &yen;{row.netAmount.toLocaleString()}
                  </td>
                  <td className="px-[10px] py-[10px] text-sm text-gray-700 whitespace-nowrap">{row.completedAt}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Summary */}
      <div className="bg-white border border-gray-200 mt-[16px] p-[16px]">
        <h3 className="text-sm font-medium text-gray-700 mb-[12px]">集計</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-[16px]">
          <div className="border border-gray-100 p-[12px]">
            <p className="text-xs text-gray-500 mb-[4px]">売上合計</p>
            <p className="text-lg font-medium text-gray-900">&yen;{totalRevenue.toLocaleString()}</p>
          </div>
          <div className="border border-gray-100 p-[12px]">
            <p className="text-xs text-gray-500 mb-[4px]">ロイヤリティ請求額（税別）</p>
            <p className="text-lg font-medium text-gray-900">&yen;{totalRoyaltyExTax.toLocaleString()}</p>
          </div>
          <div className="border border-gray-100 p-[12px]">
            <p className="text-xs text-gray-500 mb-[4px]">ロイヤリティ請求額（税込）</p>
            <p className="text-lg font-medium text-gray-900">&yen;{totalRoyaltyInTax.toLocaleString()}</p>
          </div>
          <div className="border border-gray-100 p-[12px]">
            <p className="text-xs text-gray-500 mb-[4px]">差引額（ベンダー受取額）</p>
            <p className="text-lg font-medium text-gray-900">&yen;{totalNet.toLocaleString()}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

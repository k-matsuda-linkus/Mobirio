"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { VendorPageHeader } from "@/components/vendor/VendorPageHeader";

interface RoyaltyRow {
  id: string;
  no: number;
  memberName: string;
  reservationNo: string;
  reservationFrom: string;
  reservationTo: string;
  userName: string;
  vehicleName: string;
  baseFee: number;
  royaltyRate: number;
  royaltyAmount: number;
  hasWebCredit: boolean;
  webCreditAmount: number;
}

const MOCK_ROYALTY: RoyaltyRow[] = [
  {
    id: "roy-001",
    no: 1,
    memberName: "田中 太郎",
    reservationNo: "R-20260101-001",
    reservationFrom: "2026/01/05",
    reservationTo: "2026/01/07",
    userName: "田中 太郎",
    vehicleName: "PCX160",
    baseFee: 15400,
    royaltyRate: 10,
    royaltyAmount: 1400,
    hasWebCredit: true,
    webCreditAmount: 15400,
  },
  {
    id: "roy-002",
    no: 2,
    memberName: "山田 花子",
    reservationNo: "R-20260108-003",
    reservationFrom: "2026/01/10",
    reservationTo: "2026/01/12",
    userName: "山田 花子",
    vehicleName: "ADV150",
    baseFee: 21600,
    royaltyRate: 10,
    royaltyAmount: 1964,
    hasWebCredit: true,
    webCreditAmount: 21600,
  },
  {
    id: "roy-003",
    no: 3,
    memberName: "佐藤 一郎",
    reservationNo: "R-20260115-007",
    reservationFrom: "2026/01/18",
    reservationTo: "2026/01/20",
    userName: "佐藤 一郎",
    vehicleName: "CB250R",
    baseFee: 26400,
    royaltyRate: 10,
    royaltyAmount: 2400,
    hasWebCredit: false,
    webCreditAmount: 0,
  },
  {
    id: "roy-004",
    no: 4,
    memberName: "鈴木 次郎",
    reservationNo: "R-20260120-002",
    reservationFrom: "2026/01/22",
    reservationTo: "2026/01/24",
    userName: "鈴木 次郎",
    vehicleName: "Rebel 250",
    baseFee: 24000,
    royaltyRate: 10,
    royaltyAmount: 2182,
    hasWebCredit: true,
    webCreditAmount: 24000,
  },
];

export default function VendorRoyaltyExportPage() {
  const [year, setYear] = useState("2026");
  const [month, setMonth] = useState("1");

  const totalRoyaltyExTax = MOCK_ROYALTY.reduce((s, r) => s + r.royaltyAmount, 0);
  const totalRoyaltyInTax = Math.round(totalRoyaltyExTax * 1.1);
  const totalWebCreditExTax = MOCK_ROYALTY.reduce((s, r) => s + (r.hasWebCredit ? Math.round(r.webCreditAmount / 1.1) : 0), 0);
  const totalWebCreditInTax = MOCK_ROYALTY.reduce((s, r) => s + r.webCreditAmount, 0);

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
      <div className="bg-white border border-gray-200 overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-[10px] py-[10px] text-left text-xs font-medium text-gray-500 whitespace-nowrap">NO</th>
              <th className="px-[10px] py-[10px] text-left text-xs font-medium text-gray-500 whitespace-nowrap">会員名</th>
              <th className="px-[10px] py-[10px] text-left text-xs font-medium text-gray-500 whitespace-nowrap">予約番号</th>
              <th className="px-[10px] py-[10px] text-left text-xs font-medium text-gray-500 whitespace-nowrap">予約日（から）</th>
              <th className="px-[10px] py-[10px] text-left text-xs font-medium text-gray-500 whitespace-nowrap">予約日（まで）</th>
              <th className="px-[10px] py-[10px] text-left text-xs font-medium text-gray-500 whitespace-nowrap">利用者</th>
              <th className="px-[10px] py-[10px] text-left text-xs font-medium text-gray-500 whitespace-nowrap">車名</th>
              <th className="px-[10px] py-[10px] text-right text-xs font-medium text-gray-500 whitespace-nowrap">基本料金（税込）</th>
              <th className="px-[10px] py-[10px] text-right text-xs font-medium text-gray-500 whitespace-nowrap">ロイヤリティ設定（%）</th>
              <th className="px-[10px] py-[10px] text-right text-xs font-medium text-gray-500 whitespace-nowrap">ロイヤリティ（税別）</th>
              <th className="px-[10px] py-[10px] text-center text-xs font-medium text-gray-500 whitespace-nowrap">WEBクレジット決済</th>
              <th className="px-[10px] py-[10px] text-right text-xs font-medium text-gray-500 whitespace-nowrap">WEBクレジット決済額（税込）</th>
            </tr>
          </thead>
          <tbody>
            {MOCK_ROYALTY.map((row) => (
              <tr key={row.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="px-[10px] py-[10px] text-sm text-gray-700">{row.no}</td>
                <td className="px-[10px] py-[10px] text-sm text-gray-700 whitespace-nowrap">{row.memberName}</td>
                <td className="px-[10px] py-[10px] text-sm text-gray-700 font-mono text-xs whitespace-nowrap">{row.reservationNo}</td>
                <td className="px-[10px] py-[10px] text-sm text-gray-700 whitespace-nowrap">{row.reservationFrom}</td>
                <td className="px-[10px] py-[10px] text-sm text-gray-700 whitespace-nowrap">{row.reservationTo}</td>
                <td className="px-[10px] py-[10px] text-sm text-gray-700 whitespace-nowrap">{row.userName}</td>
                <td className="px-[10px] py-[10px] text-sm text-gray-700 whitespace-nowrap">{row.vehicleName}</td>
                <td className="px-[10px] py-[10px] text-sm text-gray-700 text-right whitespace-nowrap">
                  &yen;{row.baseFee.toLocaleString()}
                </td>
                <td className="px-[10px] py-[10px] text-sm text-gray-700 text-right">{row.royaltyRate}%</td>
                <td className="px-[10px] py-[10px] text-sm text-gray-700 text-right whitespace-nowrap">
                  &yen;{row.royaltyAmount.toLocaleString()}
                </td>
                <td className="px-[10px] py-[10px] text-sm text-center">
                  <span className={row.hasWebCredit ? "text-accent" : "text-gray-400"}>
                    {row.hasWebCredit ? "有" : "無"}
                  </span>
                </td>
                <td className="px-[10px] py-[10px] text-sm text-gray-700 text-right whitespace-nowrap">
                  {row.hasWebCredit ? `¥${row.webCreditAmount.toLocaleString()}` : "---"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Summary */}
      <div className="bg-white border border-gray-200 mt-[16px] p-[16px]">
        <h3 className="text-sm font-medium text-gray-700 mb-[12px]">集計</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-[16px]">
          <div className="border border-gray-100 p-[12px]">
            <p className="text-xs text-gray-500 mb-[4px]">ロイヤリティ請求額（税別）</p>
            <p className="text-lg font-medium text-gray-900">&yen;{totalRoyaltyExTax.toLocaleString()}</p>
          </div>
          <div className="border border-gray-100 p-[12px]">
            <p className="text-xs text-gray-500 mb-[4px]">ロイヤリティ請求額（税込）</p>
            <p className="text-lg font-medium text-gray-900">&yen;{totalRoyaltyInTax.toLocaleString()}</p>
          </div>
          <div className="border border-gray-100 p-[12px]">
            <p className="text-xs text-gray-500 mb-[4px]">WEBクレジットお支払い額（税別）</p>
            <p className="text-lg font-medium text-gray-900">&yen;{totalWebCreditExTax.toLocaleString()}</p>
          </div>
          <div className="border border-gray-100 p-[12px]">
            <p className="text-xs text-gray-500 mb-[4px]">WEBクレジットお支払い額（税込）</p>
            <p className="text-lg font-medium text-gray-900">&yen;{totalWebCreditInTax.toLocaleString()}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

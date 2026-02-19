"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { VendorPageHeader } from "@/components/vendor/VendorPageHeader";

interface InsuranceRow {
  id: string;
  corporateCode: string;
  branchNo: string;
  storeName: string;
  registrationNo: string;
  maker: string;
  vehicleModel: string;
  chassisNo: string;
  enrollDate: string;
  cancelDate: string;
  category: string;
  monthlyPremium: number;
}

const MOCK_INSURANCE: InsuranceRow[] = [
  {
    id: "ins-001",
    corporateCode: "C-10001",
    branchNo: "001",
    storeName: "宮崎橘通り店",
    registrationNo: "宮崎 あ 12-34",
    maker: "ホンダ",
    vehicleModel: "PCX160",
    chassisNo: "JF81-1001234",
    enrollDate: "2025/04/01",
    cancelDate: "",
    category: "二輪",
    monthlyPremium: 3500,
  },
  {
    id: "ins-002",
    corporateCode: "C-10001",
    branchNo: "001",
    storeName: "宮崎橘通り店",
    registrationNo: "宮崎 い 56-78",
    maker: "ホンダ",
    vehicleModel: "ADV150",
    chassisNo: "KF38-2005678",
    enrollDate: "2025/04/01",
    cancelDate: "",
    category: "二輪",
    monthlyPremium: 3500,
  },
  {
    id: "ins-003",
    corporateCode: "C-10001",
    branchNo: "002",
    storeName: "宮崎空港店",
    registrationNo: "宮崎 う 90-12",
    maker: "ホンダ",
    vehicleModel: "CB250R",
    chassisNo: "MC52-3009012",
    enrollDate: "2025/05/15",
    cancelDate: "",
    category: "二輪",
    monthlyPremium: 4200,
  },
  {
    id: "ins-004",
    corporateCode: "C-10001",
    branchNo: "002",
    storeName: "宮崎空港店",
    registrationNo: "宮崎 え 34-56",
    maker: "ホンダ",
    vehicleModel: "Rebel 250",
    chassisNo: "MC49-4003456",
    enrollDate: "2025/06/01",
    cancelDate: "",
    category: "二輪",
    monthlyPremium: 4200,
  },
  {
    id: "ins-005",
    corporateCode: "C-10001",
    branchNo: "001",
    storeName: "宮崎橘通り店",
    registrationNo: "宮崎 お 78-90",
    maker: "ヤマハ",
    vehicleModel: "NMAX155",
    chassisNo: "SG50-5007890",
    enrollDate: "2025/04/01",
    cancelDate: "2025/11/30",
    category: "原付",
    monthlyPremium: 2800,
  },
];

export default function VendorInsuranceExportPage() {
  const [year, setYear] = useState("2026");
  const [month, setMonth] = useState("2");
  const [store, setStore] = useState("");

  const totalPremium = MOCK_INSURANCE.reduce((sum, row) => sum + row.monthlyPremium, 0);

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
      <div className="bg-white border border-gray-200 overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-[12px] py-[10px] text-left text-xs font-medium text-gray-500 whitespace-nowrap">法人コード</th>
              <th className="px-[12px] py-[10px] text-left text-xs font-medium text-gray-500 whitespace-nowrap">拠点番号</th>
              <th className="px-[12px] py-[10px] text-left text-xs font-medium text-gray-500 whitespace-nowrap">店舗名称</th>
              <th className="px-[12px] py-[10px] text-left text-xs font-medium text-gray-500 whitespace-nowrap">登録番号</th>
              <th className="px-[12px] py-[10px] text-left text-xs font-medium text-gray-500 whitespace-nowrap">メーカー</th>
              <th className="px-[12px] py-[10px] text-left text-xs font-medium text-gray-500 whitespace-nowrap">車種</th>
              <th className="px-[12px] py-[10px] text-left text-xs font-medium text-gray-500 whitespace-nowrap">車台番号</th>
              <th className="px-[12px] py-[10px] text-left text-xs font-medium text-gray-500 whitespace-nowrap">加入日</th>
              <th className="px-[12px] py-[10px] text-left text-xs font-medium text-gray-500 whitespace-nowrap">解約日</th>
              <th className="px-[12px] py-[10px] text-left text-xs font-medium text-gray-500 whitespace-nowrap">区分</th>
              <th className="px-[12px] py-[10px] text-right text-xs font-medium text-gray-500 whitespace-nowrap">月額保険料</th>
            </tr>
          </thead>
          <tbody>
            {MOCK_INSURANCE.map((row) => (
              <tr key={row.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="px-[12px] py-[10px] text-sm text-gray-700 whitespace-nowrap">{row.corporateCode}</td>
                <td className="px-[12px] py-[10px] text-sm text-gray-700">{row.branchNo}</td>
                <td className="px-[12px] py-[10px] text-sm text-gray-700 whitespace-nowrap">{row.storeName}</td>
                <td className="px-[12px] py-[10px] text-sm text-gray-700 whitespace-nowrap">{row.registrationNo}</td>
                <td className="px-[12px] py-[10px] text-sm text-gray-700">{row.maker}</td>
                <td className="px-[12px] py-[10px] text-sm text-gray-700">{row.vehicleModel}</td>
                <td className="px-[12px] py-[10px] text-sm text-gray-700 font-mono text-xs">{row.chassisNo}</td>
                <td className="px-[12px] py-[10px] text-sm text-gray-700 whitespace-nowrap">{row.enrollDate}</td>
                <td className="px-[12px] py-[10px] text-sm text-gray-700 whitespace-nowrap">{row.cancelDate || "---"}</td>
                <td className="px-[12px] py-[10px] text-sm text-gray-700">{row.category}</td>
                <td className="px-[12px] py-[10px] text-sm text-gray-700 text-right whitespace-nowrap">
                  &yen;{row.monthlyPremium.toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-gray-50 border-t border-gray-200">
              <td colSpan={10} className="px-[12px] py-[10px] text-sm font-medium text-gray-700 text-right">
                合計
              </td>
              <td className="px-[12px] py-[10px] text-sm font-medium text-gray-900 text-right whitespace-nowrap">
                &yen;{totalPremium.toLocaleString()}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

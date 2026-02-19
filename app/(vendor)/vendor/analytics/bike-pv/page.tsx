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

interface VehiclePV {
  vehicleName: string;
  registrationNo: string;
  data: {
    label: string;
    prevYear: number;
    currentYear: number;
    prevYearPc?: number;
    prevYearSp?: number;
    currentYearPc?: number;
    currentYearSp?: number;
  }[];
}

const MOCK_VEHICLE_PV: VehiclePV[] = [
  {
    vehicleName: "PCX160",
    registrationNo: "宮崎 あ 12-34",
    data: [
      { label: "1月", prevYear: 45, currentYear: 62, prevYearPc: 30, prevYearSp: 15, currentYearPc: 38, currentYearSp: 24 },
      { label: "2月", prevYear: 38, currentYear: 71, prevYearPc: 25, prevYearSp: 13, currentYearPc: 42, currentYearSp: 29 },
      { label: "3月", prevYear: 72, currentYear: 88, prevYearPc: 45, prevYearSp: 27, currentYearPc: 52, currentYearSp: 36 },
      { label: "4月", prevYear: 80, currentYear: 105, prevYearPc: 50, prevYearSp: 30, currentYearPc: 62, currentYearSp: 43 },
      { label: "5月", prevYear: 95, currentYear: 112, prevYearPc: 60, prevYearSp: 35, currentYearPc: 68, currentYearSp: 44 },
      { label: "6月", prevYear: 73, currentYear: 82, prevYearPc: 48, prevYearSp: 25, currentYearPc: 50, currentYearSp: 32 },
      { label: "7月", prevYear: 105, currentYear: 130, prevYearPc: 65, prevYearSp: 40, currentYearPc: 78, currentYearSp: 52 },
      { label: "8月", prevYear: 115, currentYear: 120, prevYearPc: 70, prevYearSp: 45, currentYearPc: 72, currentYearSp: 48 },
      { label: "9月", prevYear: 88, currentYear: 98, prevYearPc: 55, prevYearSp: 33, currentYearPc: 60, currentYearSp: 38 },
      { label: "10月", prevYear: 78, currentYear: 92, prevYearPc: 50, prevYearSp: 28, currentYearPc: 55, currentYearSp: 37 },
      { label: "11月", prevYear: 62, currentYear: 75, prevYearPc: 40, prevYearSp: 22, currentYearPc: 45, currentYearSp: 30 },
      { label: "12月", prevYear: 50, currentYear: 65, prevYearPc: 32, prevYearSp: 18, currentYearPc: 40, currentYearSp: 25 },
    ],
  },
  {
    vehicleName: "ADV150",
    registrationNo: "宮崎 い 56-78",
    data: [
      { label: "1月", prevYear: 35, currentYear: 48, prevYearPc: 22, prevYearSp: 13, currentYearPc: 30, currentYearSp: 18 },
      { label: "2月", prevYear: 30, currentYear: 55, prevYearPc: 20, prevYearSp: 10, currentYearPc: 35, currentYearSp: 20 },
      { label: "3月", prevYear: 58, currentYear: 70, prevYearPc: 38, prevYearSp: 20, currentYearPc: 42, currentYearSp: 28 },
      { label: "4月", prevYear: 65, currentYear: 85, prevYearPc: 42, prevYearSp: 23, currentYearPc: 52, currentYearSp: 33 },
      { label: "5月", prevYear: 78, currentYear: 92, prevYearPc: 50, prevYearSp: 28, currentYearPc: 55, currentYearSp: 37 },
      { label: "6月", prevYear: 60, currentYear: 68, prevYearPc: 40, prevYearSp: 20, currentYearPc: 42, currentYearSp: 26 },
      { label: "7月", prevYear: 88, currentYear: 105, prevYearPc: 55, prevYearSp: 33, currentYearPc: 62, currentYearSp: 43 },
      { label: "8月", prevYear: 95, currentYear: 98, prevYearPc: 58, prevYearSp: 37, currentYearPc: 60, currentYearSp: 38 },
      { label: "9月", prevYear: 72, currentYear: 80, prevYearPc: 45, prevYearSp: 27, currentYearPc: 48, currentYearSp: 32 },
      { label: "10月", prevYear: 62, currentYear: 75, prevYearPc: 40, prevYearSp: 22, currentYearPc: 45, currentYearSp: 30 },
      { label: "11月", prevYear: 50, currentYear: 60, prevYearPc: 32, prevYearSp: 18, currentYearPc: 36, currentYearSp: 24 },
      { label: "12月", prevYear: 40, currentYear: 52, prevYearPc: 26, prevYearSp: 14, currentYearPc: 32, currentYearSp: 20 },
    ],
  },
  {
    vehicleName: "CB250R",
    registrationNo: "宮崎 う 90-12",
    data: [
      { label: "1月", prevYear: 50, currentYear: 58, prevYearPc: 35, prevYearSp: 15, currentYearPc: 38, currentYearSp: 20 },
      { label: "2月", prevYear: 42, currentYear: 72, prevYearPc: 28, prevYearSp: 14, currentYearPc: 48, currentYearSp: 24 },
      { label: "3月", prevYear: 78, currentYear: 95, prevYearPc: 52, prevYearSp: 26, currentYearPc: 60, currentYearSp: 35 },
      { label: "4月", prevYear: 88, currentYear: 110, prevYearPc: 58, prevYearSp: 30, currentYearPc: 70, currentYearSp: 40 },
      { label: "5月", prevYear: 102, currentYear: 118, prevYearPc: 68, prevYearSp: 34, currentYearPc: 72, currentYearSp: 46 },
      { label: "6月", prevYear: 80, currentYear: 90, prevYearPc: 52, prevYearSp: 28, currentYearPc: 55, currentYearSp: 35 },
      { label: "7月", prevYear: 112, currentYear: 135, prevYearPc: 72, prevYearSp: 40, currentYearPc: 82, currentYearSp: 53 },
      { label: "8月", prevYear: 120, currentYear: 125, prevYearPc: 78, prevYearSp: 42, currentYearPc: 78, currentYearSp: 47 },
      { label: "9月", prevYear: 92, currentYear: 100, prevYearPc: 60, prevYearSp: 32, currentYearPc: 62, currentYearSp: 38 },
      { label: "10月", prevYear: 82, currentYear: 95, prevYearPc: 55, prevYearSp: 27, currentYearPc: 58, currentYearSp: 37 },
      { label: "11月", prevYear: 68, currentYear: 78, prevYearPc: 45, prevYearSp: 23, currentYearPc: 48, currentYearSp: 30 },
      { label: "12月", prevYear: 55, currentYear: 68, prevYearPc: 36, prevYearSp: 19, currentYearPc: 42, currentYearSp: 26 },
    ],
  },
  {
    vehicleName: "Rebel 250",
    registrationNo: "宮崎 え 34-56",
    data: [
      { label: "1月", prevYear: 48, currentYear: 55, prevYearPc: 32, prevYearSp: 16, currentYearPc: 35, currentYearSp: 20 },
      { label: "2月", prevYear: 40, currentYear: 65, prevYearPc: 26, prevYearSp: 14, currentYearPc: 40, currentYearSp: 25 },
      { label: "3月", prevYear: 70, currentYear: 88, prevYearPc: 45, prevYearSp: 25, currentYearPc: 55, currentYearSp: 33 },
      { label: "4月", prevYear: 82, currentYear: 100, prevYearPc: 55, prevYearSp: 27, currentYearPc: 62, currentYearSp: 38 },
      { label: "5月", prevYear: 95, currentYear: 110, prevYearPc: 62, prevYearSp: 33, currentYearPc: 68, currentYearSp: 42 },
      { label: "6月", prevYear: 75, currentYear: 85, prevYearPc: 48, prevYearSp: 27, currentYearPc: 52, currentYearSp: 33 },
      { label: "7月", prevYear: 108, currentYear: 128, prevYearPc: 68, prevYearSp: 40, currentYearPc: 78, currentYearSp: 50 },
      { label: "8月", prevYear: 118, currentYear: 122, prevYearPc: 75, prevYearSp: 43, currentYearPc: 75, currentYearSp: 47 },
      { label: "9月", prevYear: 88, currentYear: 95, prevYearPc: 58, prevYearSp: 30, currentYearPc: 58, currentYearSp: 37 },
      { label: "10月", prevYear: 78, currentYear: 90, prevYearPc: 50, prevYearSp: 28, currentYearPc: 55, currentYearSp: 35 },
      { label: "11月", prevYear: 65, currentYear: 72, prevYearPc: 42, prevYearSp: 23, currentYearPc: 44, currentYearSp: 28 },
      { label: "12月", prevYear: 52, currentYear: 62, prevYearPc: 34, prevYearSp: 18, currentYearPc: 38, currentYearSp: 24 },
    ],
  },
];

export default function VendorBikePVPage() {
  const [selectedStore, setSelectedStore] = useState("store-1");
  const [analysisUnit, setAnalysisUnit] = useState<"year" | "month" | "day">("month");
  const [analysisYear, setAnalysisYear] = useState("2026");
  const [analysisMonth, setAnalysisMonth] = useState("2");
  const [analysisDate, setAnalysisDate] = useState("2026-02-14");

  const inputClass =
    "border border-gray-300 px-[10px] py-[6px] text-sm focus:outline-none focus:border-accent";

  return (
    <div>
      <VendorPageHeader
        title="車両PV分析"
        breadcrumbs={[{ label: "分析" }, { label: "車両PV分析" }]}
      />

      {/* Store selector */}
      <div className="mb-[16px]">
        <StoreSelector stores={STORES} selectedId={selectedStore} onChange={setSelectedStore} />
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200 p-[16px] mb-[16px]">
        <div className="flex flex-wrap items-end gap-[16px]">
          <div>
            <label className="block text-xs text-gray-500 mb-[4px]">分析単位</label>
            <div className="flex items-center gap-[12px]">
              {([
                { value: "year", label: "年単位" },
                { value: "month", label: "月単位" },
                { value: "day", label: "日単位" },
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

          {analysisUnit === "year" && (
            <div>
              <label className="block text-xs text-gray-500 mb-[4px]">対象年</label>
              <select value={analysisYear} onChange={(e) => setAnalysisYear(e.target.value)} className={inputClass + " w-[100px]"}>
                <option value="2025">2025年</option>
                <option value="2026">2026年</option>
              </select>
            </div>
          )}

          {analysisUnit === "month" && (
            <div>
              <label className="block text-xs text-gray-500 mb-[4px]">対象年月</label>
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

          {analysisUnit === "day" && (
            <div>
              <label className="block text-xs text-gray-500 mb-[4px]">対象日</label>
              <input
                type="date"
                value={analysisDate}
                onChange={(e) => setAnalysisDate(e.target.value)}
                className={inputClass + " w-[170px]"}
              />
            </div>
          )}

          <button className="bg-accent text-white px-[16px] py-[7px] text-sm hover:bg-accent/90">
            検索
          </button>
          <button className="flex items-center gap-[6px] border border-gray-300 bg-white px-[14px] py-[7px] text-sm text-gray-700 hover:bg-gray-50">
            <Download className="w-[14px] h-[14px]" />
            CSV出力
          </button>
        </div>
      </div>

      {/* Vehicle charts */}
      <div className="space-y-[16px]">
        {MOCK_VEHICLE_PV.map((vehicle) => (
          <AnalyticsChart
            key={vehicle.vehicleName}
            data={vehicle.data}
            title={`${vehicle.vehicleName}（${vehicle.registrationNo}）`}
            showDeviceBreakdown={true}
            valueLabel="PV"
          />
        ))}
      </div>
    </div>
  );
}

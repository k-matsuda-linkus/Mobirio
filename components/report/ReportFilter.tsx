"use client";
import { useState } from "react";
import { REPORT_PERIODS } from "@/lib/constants";
import { Download } from "lucide-react";

type FilterState = {
  period: string;
  startDate: string;
  endDate: string;
  status: string;
};

type Props = {
  onFilterChange: (filter: FilterState) => void;
  initialFilter?: Partial<FilterState>;
};

const inputCls = "border border-gray-200 bg-white px-[12px] py-[8px] text-sm focus:border-[#2D7D6F] focus:outline-none";

export default function ReportFilter({ onFilterChange, initialFilter }: Props) {
  const [filter, setFilter] = useState<FilterState>({
    period: initialFilter?.period ?? "monthly",
    startDate: initialFilter?.startDate ?? "",
    endDate: initialFilter?.endDate ?? "",
    status: initialFilter?.status ?? "",
  });
  const update = (k: keyof FilterState, v: string) => {
    const next = { ...filter, [k]: v };
    setFilter(next);
    onFilterChange(next);
  };
  return (
    <div className="flex flex-wrap items-center gap-[12px]">
      <select className={inputCls} value={filter.period} onChange={(e) => update("period", e.target.value)}>
        {REPORT_PERIODS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
      </select>
      {filter.period === "custom" && (
        <>
          <input type="date" className={inputCls} value={filter.startDate} onChange={(e) => update("startDate", e.target.value)} />
          <span className="text-gray-400">~</span>
          <input type="date" className={inputCls} value={filter.endDate} onChange={(e) => update("endDate", e.target.value)} />
        </>
      )}
      <select className={inputCls} value={filter.status} onChange={(e) => update("status", e.target.value)}>
        <option value="">全ステータス</option>
        <option value="confirmed">確定</option>
        <option value="completed">完了</option>
        <option value="cancelled">キャンセル</option>
      </select>
    </div>
  );
}

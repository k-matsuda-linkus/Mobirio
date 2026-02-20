import { ArrowUp, ArrowDown } from "lucide-react";

type Props = {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: { value: number; positive: boolean };
};

export default function VendorStatsCard({ title, value, subtitle, trend }: Props) {
  return (
    <div className="border border-gray-100 bg-white p-[24px]">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-400">{title}</p>
      <p className="mt-[8px] text-3xl font-light text-black">{value}</p>
      {subtitle && <p className="mt-[4px] text-sm text-gray-500">{subtitle}</p>}
      {trend && (
        <div className={"mt-[8px] flex items-center gap-[4px] text-sm " + (trend.positive ? "text-accent" : "text-gray-500")}>
          {trend.positive ? <ArrowUp className="h-[14px] w-[14px]" /> : <ArrowDown className="h-[14px] w-[14px]" />}
          <span>{Math.abs(trend.value)}%</span>
        </div>
      )}
    </div>
  );
}

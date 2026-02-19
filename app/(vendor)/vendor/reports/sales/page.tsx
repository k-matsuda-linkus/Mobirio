import VendorStatsCard from "@/components/vendor/VendorStatsCard";
import { ReportChart } from "@/components/admin/ReportChart";

const monthlySales = [
  { label: "8月", value: 420000 },
  { label: "9月", value: 380000 },
  { label: "10月", value: 510000 },
  { label: "11月", value: 340000 },
  { label: "12月", value: 290000 },
  { label: "1月", value: 450000 },
];

const salesTable = [
  { month: "2025年1月", reservations: 28, revenue: 450000, avg: 16071 },
  { month: "2024年12月", reservations: 22, revenue: 290000, avg: 13182 },
  { month: "2024年11月", reservations: 25, revenue: 340000, avg: 13600 },
  { month: "2024年10月", reservations: 32, revenue: 510000, avg: 15938 },
  { month: "2024年9月", reservations: 26, revenue: 380000, avg: 14615 },
  { month: "2024年8月", reservations: 30, revenue: 420000, avg: 14000 },
];

export default function SalesReportPage() {
  return (
    <div>
      <div className="mb-[24px]">
        <p className="text-xs text-gray-400 mb-[4px]">レポート &gt; 売上レポート</p>
        <h1 className="font-serif text-2xl font-light">売上レポート</h1>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-[16px] mb-[24px]">
        <VendorStatsCard title="今月の売上" value="¥450,000" trend={{ value: 12.5, positive: true }} />
        <VendorStatsCard title="予約単価" value="¥16,071" trend={{ value: 3.2, positive: true }} />
        <VendorStatsCard title="前年同月比" value="+18.4%" trend={{ value: 18.4, positive: true }} />
      </div>
      <div className="mb-[24px]">
        <ReportChart title="月別売上推移" data={monthlySales.map((s) => ({ label: s.label, value: s.value / 10000 }))} height={250} type="bar" />
        <p className="text-[10px] text-gray-300 mt-[4px]">※ 単位: 万円</p>
      </div>
      <div className="bg-white border border-gray-100">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="px-[16px] py-[12px] text-left text-xs font-medium text-gray-500 uppercase">月</th>
              <th className="px-[16px] py-[12px] text-right text-xs font-medium text-gray-500 uppercase">予約数</th>
              <th className="px-[16px] py-[12px] text-right text-xs font-medium text-gray-500 uppercase">売上</th>
              <th className="px-[16px] py-[12px] text-right text-xs font-medium text-gray-500 uppercase">平均単価</th>
            </tr>
          </thead>
          <tbody>
            {salesTable.map((r) => (
              <tr key={r.month} className="border-b border-gray-50">
                <td className="px-[16px] py-[12px] text-gray-700">{r.month}</td>
                <td className="px-[16px] py-[12px] text-right font-mono text-gray-600">{r.reservations}</td>
                <td className="px-[16px] py-[12px] text-right font-mono text-gray-700">¥{r.revenue.toLocaleString()}</td>
                <td className="px-[16px] py-[12px] text-right font-mono text-gray-500">¥{r.avg.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

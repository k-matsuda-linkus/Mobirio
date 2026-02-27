"use client";

import { useState, useEffect } from "react";
import VendorStatsCard from "@/components/vendor/VendorStatsCard";
import { ReportChart } from "@/components/admin/ReportChart";

interface SalesData {
  revenueByMonth: Array<{ month: string; revenue: number; count: number }>;
  totalRevenue: number;
  totalOrders: number;
  avgOrderValue: number;
  monthlyRevenue: number;
}

export default function SalesReportPage() {
  const [data, setData] = useState<SalesData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/vendor/reports/sales")
      .then((r) => r.ok ? r.json() : null)
      .then((json) => {
        if (json?.data) setData(json.data);
      })
      .catch((err) => console.error("sales report error:", err))
      .finally(() => setLoading(false));
  }, []);

  const monthlySales = (data?.revenueByMonth || []).slice(-6).map((m) => {
    const monthNum = parseInt(m.month.split("-")[1]);
    return { label: `${monthNum}月`, value: m.revenue };
  });

  const salesTable = (data?.revenueByMonth || []).slice().reverse().map((m) => {
    const [y, mo] = m.month.split("-");
    return {
      month: `${y}年${parseInt(mo)}月`,
      reservations: m.count,
      revenue: m.revenue,
      avg: m.count > 0 ? Math.round(m.revenue / m.count) : 0,
    };
  });

  const currentMonthRevenue = data?.monthlyRevenue || 0;
  const avgOrder = data?.avgOrderValue || 0;

  const prevMonthRevenue = (data?.revenueByMonth || []).length >= 2
    ? data!.revenueByMonth[data!.revenueByMonth.length - 2].revenue
    : 0;
  const yoyPct = prevMonthRevenue > 0
    ? Math.round(((currentMonthRevenue - prevMonthRevenue) / prevMonthRevenue) * 100 * 10) / 10
    : 0;

  if (loading) return <div className="p-[24px] text-sm text-gray-500">読み込み中...</div>;

  return (
    <div>
      <div className="mb-[24px]">
        <p className="text-xs text-gray-400 mb-[4px]">レポート &gt; 売上レポート</p>
        <h1 className="font-serif text-2xl font-light">売上レポート</h1>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-[16px] mb-[24px]">
        <VendorStatsCard title="今月の売上" value={`¥${currentMonthRevenue.toLocaleString()}`} trend={yoyPct !== 0 ? { value: Math.abs(yoyPct), positive: yoyPct > 0 } : undefined} />
        <VendorStatsCard title="予約単価" value={`¥${avgOrder.toLocaleString()}`} />
        <VendorStatsCard title="前月比" value={`${yoyPct >= 0 ? "+" : ""}${yoyPct}%`} trend={yoyPct !== 0 ? { value: Math.abs(yoyPct), positive: yoyPct > 0 } : undefined} />
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

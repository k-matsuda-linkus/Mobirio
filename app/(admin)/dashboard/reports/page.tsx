"use client";
import { useState } from "react";
import Link from "next/link";
import { ReportChart } from "@/components/admin/ReportChart";
import { AdminStatsCard } from "@/components/admin/AdminStatsCard";
import { mockVendors } from "@/lib/mock/vendors";
import { mockReservations } from "@/lib/mock/reservations";
import { mockBikes } from "@/lib/mock/bikes";
import { BarChart3, CalendarDays, DollarSign, TrendingUp } from "lucide-react";

const totalRevenue = mockReservations
  .filter((r) => r.status !== "cancelled")
  .reduce((sum, r) => sum + r.total_amount, 0);
const totalReservations = mockReservations.length;
const avgOrderValue = totalReservations > 0 ? Math.round(totalRevenue / totalReservations) : 0;

const vendorReports = mockVendors
  .filter((v) => v.is_approved)
  .map((v) => {
    const vendorRes = mockReservations.filter(
      (r) => r.vendor_id === v.id && r.status !== "cancelled"
    );
    const revenue = vendorRes.reduce((sum, r) => sum + r.total_amount, 0);
    return {
      id: v.id,
      name: v.name,
      revenue: `¥${revenue.toLocaleString()}`,
      count: vendorRes.length,
    };
  });

const monthlyData = [
  { label: "9月", value: 120000 },
  { label: "10月", value: 145000 },
  { label: "11月", value: 132000 },
  { label: "12月", value: 168000 },
  { label: "1月", value: totalRevenue },
  { label: "2月", value: Math.round(totalRevenue * 0.9) },
];

const classUsage = mockBikes.map((b) => b.vehicle_class);
const classCount: Record<string, number> = {};
classUsage.forEach((c) => { classCount[c] = (classCount[c] || 0) + 1; });
const classData = Object.entries(classCount).map(([label, value]) => ({ label, value }));

export default function ReportsPage() {
  const [period, setPeriod] = useState("month");

  return (
    <div>
      <div className="flex items-center justify-between mb-[24px]">
        <h1 className="font-serif text-2xl font-light">全体レポート</h1>
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="border border-gray-300 px-[12px] py-[8px] text-sm font-sans"
        >
          <option value="week">週間</option>
          <option value="month">月間</option>
          <option value="quarter">四半期</option>
          <option value="year">年間</option>
        </select>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[16px] mb-[30px]">
        <AdminStatsCard
          title="総売上"
          value={`¥${totalRevenue.toLocaleString()}`}
          change="+12.5%"
          icon={<DollarSign className="w-[24px] h-[24px]" />}
        />
        <AdminStatsCard
          title="総予約数"
          value={String(totalReservations)}
          change="+8.3%"
          icon={<CalendarDays className="w-[24px] h-[24px]" />}
        />
        <AdminStatsCard
          title="平均注文額"
          value={`¥${avgOrderValue.toLocaleString()}`}
          change="+3.2%"
          icon={<TrendingUp className="w-[24px] h-[24px]" />}
        />
        <AdminStatsCard
          title="アクティブベンダー"
          value={String(vendorReports.length)}
          change="+2"
          icon={<BarChart3 className="w-[24px] h-[24px]" />}
        />
      </div>

      {/* チャート */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-[24px] mb-[40px]">
        <ReportChart title="売上推移" data={monthlyData} type="line" />
        <ReportChart title="車両クラス別台数" data={classData} type="bar" />
      </div>

      {/* ベンダー別レポート */}
      <div>
        <h2 className="font-serif text-lg font-light mb-[16px]">ベンダー別レポート</h2>
        <div className="bg-white border border-gray-200">
          {vendorReports.map((v) => (
            <Link
              key={v.id}
              href={"/dashboard/reports/" + v.id}
              className="flex items-center justify-between px-[20px] py-[14px] border-b border-gray-100 hover:bg-gray-50 transition-colors"
            >
              <div>
                <span className="font-sans text-sm font-medium">{v.name}</span>
                <span className="text-xs text-gray-400 ml-[12px]">{v.count}件</span>
              </div>
              <div className="flex items-center gap-[16px]">
                <span className="font-sans text-sm text-gray-500">{v.revenue}</span>
                <span className="text-accent text-sm">→</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

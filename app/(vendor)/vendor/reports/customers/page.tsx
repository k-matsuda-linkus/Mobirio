"use client";

import { useState, useEffect } from "react";
import VendorStatsCard from "@/components/vendor/VendorStatsCard";
import { ReportChart } from "@/components/admin/ReportChart";

interface CustomerReportAPI {
  totalCustomers: number;
  newCustomersThisMonth: number;
  repeatCustomerRate: number;
  averageSpent: number;
  topCustomers: Array<{ id: string; name: string; rentals: number; totalSpent: number; lastVisit: string }>;
}

interface CustomerReport {
  totalCustomers: number;
  repeatRate: number;
  avgSpend: number;
  monthlyCustomers: Array<{ month: string; count: number }>;
  repeatDistribution: Array<{ label: string; count: number }>;
  topCustomers: Array<{ name: string; visits: number; totalSpent: number; lastVisit: string }>;
}

export default function CustomerReportPage() {
  const [data, setData] = useState<CustomerReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/vendor/reports/customers")
      .then((r) => r.ok ? r.json() : null)
      .then((json) => {
        if (json?.data) {
          const api = json.data as CustomerReportAPI;
          // APIレスポンスをフロントエンドの期待する構造にマッピング
          setData({
            totalCustomers: api.totalCustomers,
            repeatRate: Math.round((api.repeatCustomerRate || 0) * 100),
            avgSpend: api.averageSpent || 0,
            monthlyCustomers: [], // APIが未提供
            repeatDistribution: [], // APIが未提供
            topCustomers: (api.topCustomers || []).map((c) => ({
              name: c.name,
              visits: c.rentals,
              totalSpent: c.totalSpent,
              lastVisit: c.lastVisit,
            })),
          });
        }
      })
      .catch((err) => console.error("customer report error:", err))
      .finally(() => setLoading(false));
  }, []);

  const monthlyCustomers = (data?.monthlyCustomers || []).slice(-6).map((m) => {
    const monthNum = parseInt(m.month.split("-")[1]);
    return { label: `${monthNum}月`, value: m.count };
  });

  const repeatDist = data?.repeatDistribution || [
    { label: "1回", count: 0 },
    { label: "2回", count: 0 },
    { label: "3回", count: 0 },
    { label: "4回以上", count: 0 },
  ];

  const topCustomers = data?.topCustomers || [];

  if (loading) return <div className="p-[24px] text-sm text-gray-500">読み込み中...</div>;

  return (
    <div>
      <div className="mb-[24px]">
        <p className="text-xs text-gray-400 mb-[4px]">レポート &gt; 顧客レポート</p>
        <h1 className="font-serif text-2xl font-light">顧客レポート</h1>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-[16px] mb-[24px]">
        <VendorStatsCard title="総顧客数" value={String(data?.totalCustomers ?? 0)} />
        <VendorStatsCard title="リピート率" value={`${data?.repeatRate ?? 0}%`} />
        <VendorStatsCard title="顧客単価" value={`¥${(data?.avgSpend ?? 0).toLocaleString()}`} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-[24px] mb-[24px]">
        <ReportChart title="月別ユニーク顧客数" data={monthlyCustomers} height={220} type="line" />
        <ReportChart title="リピート回数分布" data={repeatDist.map((d) => ({ label: d.label, value: d.count }))} height={220} type="pie" />
      </div>
      <div className="bg-white border border-gray-100">
        <h3 className="px-[16px] py-[12px] text-sm font-medium text-gray-700 border-b border-gray-100">上位顧客</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="px-[16px] py-[10px] text-left text-xs font-medium text-gray-500 uppercase">顧客名</th>
              <th className="px-[16px] py-[10px] text-right text-xs font-medium text-gray-500 uppercase">利用回数</th>
              <th className="px-[16px] py-[10px] text-right text-xs font-medium text-gray-500 uppercase">累計金額</th>
              <th className="px-[16px] py-[10px] text-right text-xs font-medium text-gray-500 uppercase">最終利用日</th>
            </tr>
          </thead>
          <tbody>
            {topCustomers.map((c) => (
              <tr key={c.name} className="border-b border-gray-50">
                <td className="px-[16px] py-[10px] text-gray-700">{c.name}</td>
                <td className="px-[16px] py-[10px] text-right font-mono text-gray-600">{c.visits}</td>
                <td className="px-[16px] py-[10px] text-right font-mono text-gray-700">¥{c.totalSpent.toLocaleString()}</td>
                <td className="px-[16px] py-[10px] text-right text-gray-500">{c.lastVisit}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

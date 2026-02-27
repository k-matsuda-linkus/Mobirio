"use client";

import { useState, useEffect } from "react";
import VendorStatsCard from "@/components/vendor/VendorStatsCard";
import { ReportChart } from "@/components/admin/ReportChart";

interface BikeUsageItem {
  bike_id: string;
  name: string;
  reservations: number;
  utilization: number;
  revenue: number;
}

interface BikesReportAPI {
  bikeUsage: BikeUsageItem[];
  utilizationRate: number;
  totalBikes: number;
  activeBikes: number;
  mostPopularBike: { id: string; name: string; rentals: number } | null;
}

interface BikesReport {
  bikes: BikeUsageItem[];
  avgUtilization: number;
  totalBikes: number;
  activeBikes: number;
  topBike: { name: string; utilization: number } | null;
}

export default function BikeUsageReportPage() {
  const [data, setData] = useState<BikesReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/vendor/reports/bikes")
      .then((r) => r.ok ? r.json() : null)
      .then((json) => {
        if (json?.data) {
          const api = json.data as BikesReportAPI;
          // APIレスポンスをフロントエンドの期待する構造にマッピング
          const topBikeUsage = api.mostPopularBike
            ? api.bikeUsage?.find((b) => b.bike_id === api.mostPopularBike!.id)
            : null;
          setData({
            bikes: api.bikeUsage || [],
            avgUtilization: Math.round((api.utilizationRate || 0) * 100 * 10) / 10,
            totalBikes: api.totalBikes,
            activeBikes: api.activeBikes,
            topBike: api.mostPopularBike
              ? { name: api.mostPopularBike.name, utilization: topBikeUsage?.utilization ?? 0 }
              : null,
          });
        }
      })
      .catch((err) => console.error("bikes report error:", err))
      .finally(() => setLoading(false));
  }, []);

  const bikeUsage = data?.bikes || [];
  const avgUtil = data?.avgUtilization ?? 0;
  const totalBikes = data?.totalBikes ?? 0;
  const activeBikes = data?.activeBikes ?? 0;
  const topBike = data?.topBike;

  if (loading) return <div className="p-[24px] text-sm text-gray-500">読み込み中...</div>;

  return (
    <div>
      <div className="mb-[24px]">
        <p className="text-xs text-gray-400 mb-[4px]">レポート &gt; 車両稼働レポート</p>
        <h1 className="font-serif text-2xl font-light">車両稼働レポート</h1>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-[16px] mb-[24px]">
        <VendorStatsCard title="平均稼働率" value={`${avgUtil}%`} />
        <VendorStatsCard title="稼働台数" value={`${activeBikes} / ${totalBikes}台`} />
        <VendorStatsCard title="最高稼働車両" value={topBike?.name || "-"} subtitle={topBike ? `稼働率 ${topBike.utilization}%` : undefined} />
      </div>
      <div className="mb-[24px]">
        <ReportChart
          title="車両別稼働率"
          data={bikeUsage.map((b) => ({ label: b.name, value: b.utilization }))}
          height={220}
          type="bar"
        />
      </div>
      <div className="bg-white border border-gray-100">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="px-[16px] py-[12px] text-left text-xs font-medium text-gray-500 uppercase">車両名</th>
              <th className="px-[16px] py-[12px] text-right text-xs font-medium text-gray-500 uppercase">予約数</th>
              <th className="px-[16px] py-[12px] text-right text-xs font-medium text-gray-500 uppercase">稼働率</th>
              <th className="px-[16px] py-[12px] text-right text-xs font-medium text-gray-500 uppercase">売上</th>
            </tr>
          </thead>
          <tbody>
            {bikeUsage.map((b) => (
              <tr key={b.bike_id} className="border-b border-gray-50">
                <td className="px-[16px] py-[12px] text-gray-700">{b.name}</td>
                <td className="px-[16px] py-[12px] text-right font-mono text-gray-600">{b.reservations}</td>
                <td className="px-[16px] py-[12px] text-right">
                  <div className="flex items-center justify-end gap-[8px]">
                    <div className="w-[80px] h-[6px] bg-gray-100">
                      <div className="h-full bg-accent" style={{ width: `${b.utilization}%` }} />
                    </div>
                    <span className="font-mono text-gray-600 w-[40px] text-right">{b.utilization}%</span>
                  </div>
                </td>
                <td className="px-[16px] py-[12px] text-right font-mono text-gray-700">¥{b.revenue.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

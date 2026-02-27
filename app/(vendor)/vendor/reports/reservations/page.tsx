"use client";

import { useState, useEffect } from "react";
import VendorStatsCard from "@/components/vendor/VendorStatsCard";
import { ReportChart } from "@/components/admin/ReportChart";

const statusColors: Record<string, string> = {
  "完了": "bg-gray-100 text-gray-600",
  "確認済": "bg-accent/10 text-accent",
  "利用中": "bg-blue-50 text-blue-600",
  "キャンセル": "bg-red-50 text-red-600",
  "ノーショー": "bg-amber-50 text-amber-600",
};

interface ReservationReportAPI {
  totalReservations: number;
  confirmedCount: number;
  pendingCount: number;
  completedCount: number;
  cancelledCount: number;
  noShowCount: number;
  inUseCount: number;
  cancelRate: number;
  reservationsByMonth: Array<{ month: string; count: number }>;
}

interface ReservationReport {
  monthlyCounts: Array<{ month: string; count: number }>;
  statusBreakdown: Array<{ status: string; count: number }>;
  totalReservations: number;
  cancelRate: number;
  avgDuration: number;
}

export default function ReservationReportPage() {
  const [data, setData] = useState<ReservationReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/vendor/reports/reservations")
      .then((r) => r.ok ? r.json() : null)
      .then((json) => {
        if (json?.data) {
          const api = json.data as ReservationReportAPI;
          // APIレスポンスをフロントエンドの期待する構造にマッピング
          const statusBreakdown: Array<{ status: string; count: number }> = [
            { status: "confirmed", count: api.confirmedCount || 0 },
            { status: "completed", count: api.completedCount || 0 },
            { status: "in_use", count: api.inUseCount || 0 },
            { status: "cancelled", count: api.cancelledCount || 0 },
            { status: "no_show", count: api.noShowCount || 0 },
          ].filter((s) => s.count > 0);

          setData({
            monthlyCounts: api.reservationsByMonth || [],
            statusBreakdown,
            totalReservations: api.totalReservations,
            cancelRate: api.cancelRate,
            avgDuration: 0, // APIが未提供のため0固定
          });
        }
      })
      .catch((err) => console.error("reservation report error:", err))
      .finally(() => setLoading(false));
  }, []);

  const STATUS_LABEL_MAP: Record<string, string> = {
    completed: "完了",
    confirmed: "確認済",
    in_use: "利用中",
    cancelled: "キャンセル",
    no_show: "ノーショー",
  };

  const monthlyReservations = (data?.monthlyCounts || []).slice(-6).map((m) => {
    const monthNum = parseInt(m.month.split("-")[1]);
    return { label: `${monthNum}月`, value: m.count };
  });

  const statusBreakdown = (data?.statusBreakdown || []).map((s) => {
    const label = STATUS_LABEL_MAP[s.status] || s.status;
    const total = data?.totalReservations || 1;
    const pct = `${Math.round((s.count / total) * 1000) / 10}%`;
    return { status: label, count: s.count, pct };
  });

  const currentMonthCount = (data?.monthlyCounts || []).length > 0
    ? data!.monthlyCounts[data!.monthlyCounts.length - 1].count
    : 0;
  const prevMonthCount = (data?.monthlyCounts || []).length >= 2
    ? data!.monthlyCounts[data!.monthlyCounts.length - 2].count
    : 0;
  const countTrend = prevMonthCount > 0
    ? Math.round(((currentMonthCount - prevMonthCount) / prevMonthCount) * 1000) / 10
    : 0;

  if (loading) return <div className="p-[24px] text-sm text-gray-500">読み込み中...</div>;

  return (
    <div>
      <div className="mb-[24px]">
        <p className="text-xs text-gray-400 mb-[4px]">レポート &gt; 予約レポート</p>
        <h1 className="font-serif text-2xl font-light">予約レポート</h1>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-[16px] mb-[24px]">
        <VendorStatsCard title="今月の予約数" value={String(currentMonthCount)} trend={countTrend !== 0 ? { value: Math.abs(countTrend), positive: countTrend > 0 } : undefined} />
        <VendorStatsCard title="キャンセル率" value={`${data?.cancelRate ?? 0}%`} />
        <VendorStatsCard title="平均利用日数" value={`${data?.avgDuration ?? 0}日`} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-[24px] mb-[24px]">
        <ReportChart title="月別予約数" data={monthlyReservations} height={220} type="bar" />
        <ReportChart title="ステータス内訳" data={statusBreakdown.map((s) => ({ label: s.status, value: s.count }))} height={220} type="pie" />
      </div>
      <div className="bg-white border border-gray-100">
        <h3 className="px-[16px] py-[12px] text-sm font-medium text-gray-700 border-b border-gray-100">ステータス別内訳（今月）</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="px-[16px] py-[10px] text-left text-xs font-medium text-gray-500 uppercase">ステータス</th>
              <th className="px-[16px] py-[10px] text-right text-xs font-medium text-gray-500 uppercase">件数</th>
              <th className="px-[16px] py-[10px] text-right text-xs font-medium text-gray-500 uppercase">割合</th>
            </tr>
          </thead>
          <tbody>
            {statusBreakdown.map((s) => (
              <tr key={s.status} className="border-b border-gray-50">
                <td className="px-[16px] py-[10px]">
                  <span className={"inline-block px-[8px] py-[2px] text-xs " + (statusColors[s.status] || "bg-gray-100 text-gray-500")}>{s.status}</span>
                </td>
                <td className="px-[16px] py-[10px] text-right font-mono text-gray-600">{s.count}</td>
                <td className="px-[16px] py-[10px] text-right font-mono text-gray-500">{s.pct}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

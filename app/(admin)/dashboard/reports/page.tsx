"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ReportChart } from "@/components/admin/ReportChart";
import { AdminStatsCard } from "@/components/admin/AdminStatsCard";
import { BarChart3, CalendarDays, DollarSign, TrendingUp, Loader2 } from "lucide-react";

interface ReportData {
  period: { startDate: string; endDate: string };
  daily_revenue: { date: string; amount: number }[];
  reservation_by_status: Record<string, number>;
  top_bikes: { bike_id: string; name: string; manufacturer: string; reservation_count: number; revenue: number }[];
  top_vendors: { vendor_id: string; name: string; reservation_count: number; revenue: number }[];
  totals: { reservations: number; revenue: number };
}

export default function ReportsPage() {
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState("month");

  const fetchReport = useCallback(async () => {
    setLoading(true);
    try {
      const now = new Date();
      let startDate: string;
      const endDate = now.toISOString().slice(0, 10);

      if (period === "week") {
        const weekAgo = new Date(now);
        weekAgo.setDate(weekAgo.getDate() - 7);
        startDate = weekAgo.toISOString().slice(0, 10);
      } else if (period === "quarter") {
        const quarterAgo = new Date(now);
        quarterAgo.setMonth(quarterAgo.getMonth() - 3);
        startDate = quarterAgo.toISOString().slice(0, 10);
      } else if (period === "year") {
        startDate = `${now.getFullYear()}-01-01`;
      } else {
        const monthAgo = new Date(now);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        startDate = monthAgo.toISOString().slice(0, 10);
      }

      const res = await fetch(
        `/api/admin/reports?startDate=${startDate}&endDate=${endDate}`
      );
      const json = await res.json();
      if (!res.ok) {
        setError("レポートデータの取得に失敗しました");
        setLoading(false);
        return;
      }
      if (json.data) setReportData(json.data);
    } catch (error) {
      console.error("Reports fetch error:", error);
      setError("レポートデータの取得に失敗しました");
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-[80px]">
        <Loader2 className="w-[24px] h-[24px] animate-spin text-gray-400" />
        <span className="ml-[8px] text-sm text-gray-500">読み込み中...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-[80px]">
        <span className="text-sm text-red-500">{error}</span>
      </div>
    );
  }

  if (!reportData) {
    return <div className="py-[40px] text-center text-gray-500">レポートデータがありません</div>;
  }

  const totalRevenue = reportData.totals.revenue;
  const totalReservations = reportData.totals.reservations;
  const avgOrderValue = totalReservations > 0 ? Math.round(totalRevenue / totalReservations) : 0;

  const revenueChartData = reportData.daily_revenue.map((d) => ({
    label: d.date.slice(5),
    value: d.amount,
  }));

  const statusLabelMap: Record<string, string> = {
    pending: "予約済",
    confirmed: "確認済",
    in_use: "利用中",
    completed: "完了",
    cancelled: "キャンセル",
    no_show: "ノーショー",
  };

  const statusChartData = Object.entries(reportData.reservation_by_status).map(
    ([key, value]) => ({ label: statusLabelMap[key] || key, value })
  );

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
          change=""
          icon={<DollarSign className="w-[24px] h-[24px]" />}
        />
        <AdminStatsCard
          title="総予約数"
          value={String(totalReservations)}
          change=""
          icon={<CalendarDays className="w-[24px] h-[24px]" />}
        />
        <AdminStatsCard
          title="平均注文額"
          value={`¥${avgOrderValue.toLocaleString()}`}
          change=""
          icon={<TrendingUp className="w-[24px] h-[24px]" />}
        />
        <AdminStatsCard
          title="トップベンダー数"
          value={String(reportData.top_vendors.length)}
          change=""
          icon={<BarChart3 className="w-[24px] h-[24px]" />}
        />
      </div>

      {/* チャート */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-[24px] mb-[40px]">
        {revenueChartData.length > 0 && (
          <ReportChart title="売上推移" data={revenueChartData} type="line" />
        )}
        {statusChartData.length > 0 && (
          <ReportChart title="ステータス別予約数" data={statusChartData} type="bar" />
        )}
      </div>

      {/* ベンダー別レポート */}
      {reportData.top_vendors.length > 0 && (
        <div>
          <h2 className="font-serif text-lg font-light mb-[16px]">ベンダー別レポート</h2>
          <div className="bg-white border border-gray-200">
            {reportData.top_vendors.map((v) => (
              <Link
                key={v.vendor_id}
                href={"/dashboard/vendors/" + v.vendor_id}
                className="flex items-center justify-between px-[20px] py-[14px] border-b border-gray-100 hover:bg-gray-50 transition-colors"
              >
                <div>
                  <span className="font-sans text-sm font-medium">{v.name}</span>
                  <span className="text-xs text-gray-400 ml-[12px]">{v.reservation_count}件</span>
                </div>
                <div className="flex items-center gap-[16px]">
                  <span className="font-sans text-sm text-gray-500">
                    ¥{v.revenue.toLocaleString()}
                  </span>
                  <span className="text-accent text-sm">→</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

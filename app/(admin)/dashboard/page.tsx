"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { AdminStatsCard } from "@/components/admin/AdminStatsCard";
import { ReportChart } from "@/components/admin/ReportChart";
import { AdminTable } from "@/components/admin/AdminTable";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { CalendarDays, TrendingUp, Store, Users, Bike, AlertTriangle, Shield, Loader2 } from "lucide-react";

interface StatsData {
  total_reservations: number;
  monthly_reservations: number;
  monthly_revenue: number;
  total_revenue: number;
  active_vendors: number;
  total_users: number;
  active_bikes: number;
  avg_rating: number;
  changes: {
    reservations: number;
    revenue: number;
    vendors: number;
    users: number;
  };
}

interface ReservationRow {
  id: string;
  status: string;
  total_amount: number;
  start_datetime: string;
  end_datetime: string;
  user?: { full_name?: string; email?: string } | null;
  bike?: { name?: string } | null;
  vendor?: { name?: string } | null;
}

interface PendingVendor {
  id: string;
  name: string;
  prefecture?: string | null;
  city?: string | null;
  created_at: string;
  bikes_count: number;
}

const statusLabel = (s: string) => {
  if (s === "confirmed") return "確認済";
  if (s === "pending") return "予約済";
  if (s === "in_use") return "利用中";
  if (s === "completed") return "完了";
  if (s === "cancelled") return "キャンセル";
  return "ノーショー";
};

const statusVariant = (s: string) => {
  if (s === "確認済" || s === "完了") return "success" as const;
  if (s === "予約済") return "info" as const;
  if (s === "利用中") return "warning" as const;
  return "danger" as const;
};

export default function DashboardPage() {
  const [statsData, setStatsData] = useState<StatsData | null>(null);
  const [recentReservations, setRecentReservations] = useState<ReservationRow[]>([]);
  const [pendingVendors, setPendingVendors] = useState<PendingVendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const [statsRes, resRes, vendorsRes] = await Promise.all([
          fetch("/api/admin/stats"),
          fetch("/api/admin/reservations?limit=5"),
          fetch("/api/admin/vendors?is_approved=false&limit=10"),
        ]);

        if (!statsRes.ok || !resRes.ok || !vendorsRes.ok) {
          setError("データの取得に失敗しました");
          setLoading(false);
          return;
        }

        const [statsJson, resJson, vendorsJson] = await Promise.all([
          statsRes.json(),
          resRes.json(),
          vendorsRes.json(),
        ]);

        if (statsJson.data) setStatsData(statsJson.data);
        if (resJson.data) setRecentReservations(resJson.data);
        if (vendorsJson.data) setPendingVendors(vendorsJson.data);
      } catch (error) {
        console.error("Dashboard fetch error:", error);
        setError("データの取得に失敗しました");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

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
        <AlertTriangle className="w-[20px] h-[20px] text-red-400" />
        <span className="ml-[8px] text-sm text-red-500">{error}</span>
      </div>
    );
  }

  const stats = statsData
    ? [
        {
          title: "総予約数",
          value: String(statsData.total_reservations),
          change: `${statsData.changes.reservations > 0 ? "+" : ""}${statsData.changes.reservations}%`,
          icon: <CalendarDays className="w-[24px] h-[24px]" />,
        },
        {
          title: "月間売上",
          value: `¥${statsData.monthly_revenue.toLocaleString()}`,
          change: `${statsData.changes.revenue > 0 ? "+" : ""}${statsData.changes.revenue}%`,
          icon: <TrendingUp className="w-[24px] h-[24px]" />,
        },
        {
          title: "アクティブベンダー",
          value: String(statsData.active_vendors),
          change: `${statsData.changes.vendors > 0 ? "+" : ""}${statsData.changes.vendors}`,
          icon: <Store className="w-[24px] h-[24px]" />,
        },
        {
          title: "登録ユーザー",
          value: String(statsData.total_users),
          change: `${statsData.changes.users > 0 ? "+" : ""}${statsData.changes.users}%`,
          icon: <Users className="w-[24px] h-[24px]" />,
        },
        {
          title: "稼働バイク",
          value: String(statsData.active_bikes),
          change: "",
          icon: <Bike className="w-[24px] h-[24px]" />,
        },
      ]
    : [];

  const reservationRows = recentReservations.map((r) => ({
    id: r.id,
    user: r.user?.full_name || r.user?.email || "—",
    vendor: r.vendor?.name || "—",
    bike: r.bike?.name || "—",
    period: `${r.start_datetime.slice(5, 10)} ~ ${r.end_datetime.slice(5, 10)}`,
    status: statusLabel(r.status),
    amount: `¥${r.total_amount.toLocaleString()}`,
  }));

  const pendingVendorRows = pendingVendors.map((v) => ({
    id: v.id,
    name: v.name,
    area: `${v.prefecture || ""} ${v.city || ""}`.trim() || "—",
    bikes: v.bikes_count || 0,
    appliedAt: v.created_at?.slice(0, 10) || "—",
  }));

  const monthlyRevenueData = statsData
    ? [
        { label: "今月", value: statsData.monthly_revenue },
      ]
    : [];

  return (
    <div>
      <h1 className="font-serif text-2xl font-light mb-[30px]">ダッシュボード</h1>

      {/* KPIカード */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[20px] mb-[40px]">
        {stats.map((s) => (
          <AdminStatsCard key={s.title} {...s} />
        ))}
      </div>

      {/* 売上チャート */}
      {monthlyRevenueData.length > 0 && (
        <div className="mb-[40px]">
          <ReportChart title="月間売上" data={monthlyRevenueData} height={300} type="bar" />
        </div>
      )}

      {/* アラート */}
      {pendingVendors.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 p-[16px] mb-[30px] flex items-start gap-[12px]">
          <AlertTriangle className="w-[20px] h-[20px] text-yellow-600 flex-shrink-0 mt-[2px]" />
          <div>
            <p className="text-sm font-sans font-medium text-yellow-800">
              承認待ちのベンダーが {pendingVendors.length} 件あります
            </p>
            <Link href="/dashboard/vendors" className="text-sm text-accent hover:underline mt-[4px] inline-block">
              ベンダー管理へ →
            </Link>
          </div>
        </div>
      )}

      {/* 最近の予約 */}
      <div className="mb-[40px]">
        <div className="flex items-center justify-between mb-[16px]">
          <h2 className="font-serif text-lg font-light">最近の予約</h2>
          <Link href="/dashboard/reservations" className="text-sm text-accent hover:underline">
            すべて表示 →
          </Link>
        </div>
        <AdminTable
          columns={[
            { key: "id", label: "ID" },
            { key: "user", label: "ユーザー" },
            { key: "vendor", label: "ベンダー" },
            { key: "bike", label: "バイク" },
            { key: "period", label: "期間" },
            {
              key: "status",
              label: "ステータス",
              render: (r) => (
                <StatusBadge status={String(r.status)} variant={statusVariant(String(r.status))} />
              ),
            },
            { key: "amount", label: "金額" },
          ]}
          data={reservationRows}
        />
      </div>

      {/* ベンダー承認待ち */}
      {pendingVendorRows.length > 0 && (
        <div>
          <h2 className="font-serif text-lg font-light mb-[16px]">
            ベンダー承認待ち
            <span className="ml-[8px] bg-red-500 text-white text-xs px-[8px] py-[2px]">
              {pendingVendorRows.length}
            </span>
          </h2>
          <AdminTable
            columns={[
              { key: "name", label: "店舗名" },
              { key: "area", label: "エリア" },
              { key: "bikes", label: "バイク数" },
              { key: "appliedAt", label: "申請日" },
              {
                key: "action",
                label: "操作",
                render: () => (
                  <Link href="/dashboard/vendors" className="text-sm text-accent hover:underline">
                    詳細
                  </Link>
                ),
              },
            ]}
            data={pendingVendorRows}
          />
        </div>
      )}
    </div>
  );
}

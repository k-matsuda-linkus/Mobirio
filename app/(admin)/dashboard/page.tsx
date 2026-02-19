"use client";
import Link from "next/link";
import { AdminStatsCard } from "@/components/admin/AdminStatsCard";
import { ReportChart } from "@/components/admin/ReportChart";
import { AdminTable } from "@/components/admin/AdminTable";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { CalendarDays, TrendingUp, Store, Users, Bike, Star, AlertTriangle } from "lucide-react";
import { mockReservations } from "@/lib/mock/reservations";
import { mockVendors } from "@/lib/mock/vendors";
import { mockUsers } from "@/lib/mock/users";
import { mockBikes } from "@/lib/mock/bikes";
import { mockReviews } from "@/lib/mock/reviews";
import { mockPayments } from "@/lib/mock/payments";

const totalReservations = mockReservations.length;
const monthlyRevenue = mockReservations
  .filter((r) => r.status !== "cancelled")
  .reduce((sum, r) => sum + r.total_amount, 0);
const activeVendors = mockVendors.filter((v) => v.is_active && v.is_approved).length;
const totalUsers = mockUsers.filter((u) => u.role === "customer").length;
const activeBikes = mockBikes.filter((b) => b.is_available).length;
const avgRating = mockReviews.length > 0
  ? (mockReviews.reduce((sum, r) => sum + r.rating, 0) / mockReviews.length).toFixed(1)
  : "0";

const stats = [
  { title: "総予約数", value: String(totalReservations), change: "+12.5%", icon: <CalendarDays className="w-[24px] h-[24px]" /> },
  { title: "月間売上", value: `¥${monthlyRevenue.toLocaleString()}`, change: "+8.3%", icon: <TrendingUp className="w-[24px] h-[24px]" /> },
  { title: "アクティブベンダー", value: String(activeVendors), change: "+2", icon: <Store className="w-[24px] h-[24px]" /> },
  { title: "登録ユーザー", value: String(totalUsers), change: "+45", icon: <Users className="w-[24px] h-[24px]" /> },
  { title: "稼働バイク", value: String(activeBikes), change: "+3", icon: <Bike className="w-[24px] h-[24px]" /> },
  { title: "平均評価", value: avgRating, change: "+0.1", icon: <Star className="w-[24px] h-[24px]" /> },
];

const recentReservations = mockReservations.map((r) => ({
  id: r.id,
  user: mockUsers.find((u) => u.id === r.user_id)?.full_name || r.user_id,
  vendor: r.vendorName,
  bike: r.bikeName,
  period: `${r.start_datetime.slice(5, 10)} ~ ${r.end_datetime.slice(5, 10)}`,
  status: r.status === "confirmed" ? "確認済"
    : r.status === "pending" ? "予約済"
    : r.status === "in_use" ? "利用中"
    : r.status === "completed" ? "完了"
    : r.status === "cancelled" ? "キャンセル"
    : "ノーショー",
  amount: `¥${r.total_amount.toLocaleString()}`,
}));

const pendingVendors = mockVendors
  .filter((v) => !v.is_approved)
  .map((v) => ({
    name: v.name,
    area: `${v.prefecture} ${v.city}`,
    appliedAt: "2026-01-28",
    bikes: mockBikes.filter((b) => b.vendor_id === v.id).length,
  }));

const recentPayments = mockPayments.slice(0, 5).map((p) => ({
  id: p.id,
  amount: `¥${p.amount.toLocaleString()}`,
  status: p.status === "completed" ? "完了"
    : p.status === "pending" ? "保留"
    : p.status === "refunded" ? "返金済"
    : p.status === "failed" ? "失敗"
    : p.status,
  date: p.created_at.slice(0, 10),
}));

const statusVariant = (s: string) => {
  if (s === "確認済" || s === "完了") return "success" as const;
  if (s === "予約済") return "info" as const;
  if (s === "利用中") return "warning" as const;
  return "danger" as const;
};

const paymentVariant = (s: string) => {
  if (s === "完了") return "success" as const;
  if (s === "保留") return "warning" as const;
  if (s === "返金済") return "info" as const;
  return "danger" as const;
};

const monthlyRevenueData = [
  { label: "9月", value: 45000 },
  { label: "10月", value: 52000 },
  { label: "11月", value: 48000 },
  { label: "12月", value: 61000 },
  { label: "1月", value: monthlyRevenue },
  { label: "2月", value: Math.round(monthlyRevenue * 0.85) },
];

export default function DashboardPage() {
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
      <div className="mb-[40px]">
        <ReportChart title="月間売上推移" data={monthlyRevenueData} height={300} type="bar" />
      </div>

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
          data={recentReservations}
        />
      </div>

      {/* 2列グリッド: 決済 + 承認待ち */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-[30px]">
        {/* 最近の決済 */}
        <div>
          <div className="flex items-center justify-between mb-[16px]">
            <h2 className="font-serif text-lg font-light">最近の決済</h2>
            <Link href="/dashboard/payments" className="text-sm text-accent hover:underline">
              すべて表示 →
            </Link>
          </div>
          <AdminTable
            columns={[
              { key: "id", label: "ID" },
              { key: "amount", label: "金額" },
              {
                key: "status",
                label: "ステータス",
                render: (p) => (
                  <StatusBadge status={String(p.status)} variant={paymentVariant(String(p.status))} />
                ),
              },
              { key: "date", label: "日時" },
            ]}
            data={recentPayments}
          />
        </div>

        {/* ベンダー承認待ち */}
        <div>
          <h2 className="font-serif text-lg font-light mb-[16px]">
            ベンダー承認待ち
            {pendingVendors.length > 0 && (
              <span className="ml-[8px] bg-red-500 text-white text-xs px-[8px] py-[2px]">
                {pendingVendors.length}
              </span>
            )}
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
                  <div className="flex gap-[8px]">
                    <button className="bg-accent text-white px-[12px] py-[4px] text-xs font-sans hover:opacity-90">
                      承認
                    </button>
                    <button className="border border-gray-300 px-[12px] py-[4px] text-xs font-sans hover:bg-gray-50">
                      却下
                    </button>
                  </div>
                ),
              },
            ]}
            data={pendingVendors}
          />
        </div>
      </div>
    </div>
  );
}

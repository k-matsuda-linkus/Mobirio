"use client";

import { useState, useEffect } from "react";
import {
  ArrowUpRight,
  ArrowDownLeft,
  AlertCircle,
  JapaneseYen,
} from "lucide-react";
import { GreetingBanner } from "@/components/vendor/dashboard/GreetingBanner";
import { KpiCard } from "@/components/vendor/dashboard/KpiCard";
import { KpiGrid } from "@/components/vendor/dashboard/KpiGrid";
import { DayTimeline } from "@/components/vendor/dashboard/DayTimeline";
import type { TimelineEvent } from "@/components/vendor/dashboard/DayTimeline";
import { VehicleStatusBoard } from "@/components/vendor/dashboard/VehicleStatusBoard";
import type { VehicleStatus } from "@/components/vendor/dashboard/VehicleStatusBoard";
import { MiniSalesChart } from "@/components/vendor/dashboard/MiniSalesChart";
import type { MonthlySales } from "@/components/vendor/dashboard/MiniSalesChart";
import { NoticePanel } from "@/components/vendor/dashboard/NoticePanel";
import type { Notice } from "@/components/vendor/dashboard/NoticePanel";
import { InspectionAlertPanel } from "@/components/vendor/dashboard/InspectionAlertPanel";

// ---------- フォールバックモックデータ ----------

const DEFAULT_TIMELINE: TimelineEvent[] = [
  { time: "09:00", type: "departure", vehicleName: "PCX160", customerName: "田中 太郎", reservationId: "R-20260220-001" },
  { time: "10:00", type: "departure", vehicleName: "ADV150", customerName: "山田 花子", reservationId: "R-20260220-002" },
  { time: "11:00", type: "return", vehicleName: "CB250R", customerName: "佐藤 一郎", reservationId: "R-20260218-010" },
  { time: "13:00", type: "departure", vehicleName: "レブル250", customerName: "鈴木 次郎", reservationId: "R-20260220-003" },
  { time: "15:00", type: "return", vehicleName: "NMAX155", customerName: "高橋 美咲", reservationId: "R-20260217-008" },
  { time: "17:00", type: "return", vehicleName: "MT-07", customerName: "伊藤 健", reservationId: "R-20260216-005" },
];

const DEFAULT_VEHICLE_STATUSES: VehicleStatus[] = [
  { status: "available", count: 4, vehicles: [{ id: "v1", name: "PCX160" }, { id: "v2", name: "スーパーカブ110" }, { id: "v3", name: "ジクサー150" }, { id: "v4", name: "CT125" }] },
  { status: "rented", count: 3, vehicles: [{ id: "v5", name: "CB250R" }, { id: "v6", name: "NMAX155" }, { id: "v7", name: "MT-07" }] },
  { status: "maintenance", count: 1, vehicles: [{ id: "v8", name: "ADV150" }] },
  { status: "reserved", count: 2, vehicles: [{ id: "v9", name: "レブル250" }, { id: "v10", name: "Ninja400" }] },
];

const DEFAULT_SALES: MonthlySales[] = [
  { month: "9月", amount: 280000 },
  { month: "10月", amount: 310000 },
  { month: "11月", amount: 260000 },
  { month: "12月", amount: 190000 },
  { month: "1月", amount: 220000 },
  { month: "2月", amount: 345000 },
];

const DEFAULT_NOTICES: Notice[] = [
  { id: "n1", date: "2026/02/18", title: "春季キャンペーン開始のご案内", isNew: true },
  { id: "n2", date: "2026/02/15", title: "システムメンテナンスのお知らせ（3/1）" },
  { id: "n3", date: "2026/02/10", title: "保険契約更新に関するご確認のお願い" },
];

// ---------- ページ ----------

export default function VendorDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [departureCount, setDepartureCount] = useState(3);
  const [returnCount, setReturnCount] = useState(2);
  const [pendingCount, setPendingCount] = useState(5);
  const [monthlySales, setMonthlySales] = useState(345000);
  const [prevMonthlySales, setPrevMonthlySales] = useState(290000);
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>(DEFAULT_TIMELINE);
  const [vehicleStatuses, setVehicleStatuses] = useState<VehicleStatus[]>(DEFAULT_VEHICLE_STATUSES);
  const [salesData, setSalesData] = useState<MonthlySales[]>(DEFAULT_SALES);
  const [notices, setNotices] = useState<Notice[]>(DEFAULT_NOTICES);

  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);

    Promise.all([
      fetch(`/api/vendor/reservations?startDate=${today}&endDate=${today}`).then((r) => r.ok ? r.json() : null),
      fetch("/api/vendor/reports/sales").then((r) => r.ok ? r.json() : null),
    ])
      .then(([rsvJson, salesJson]) => {
        if (rsvJson?.data) {
          const rsvs = Array.isArray(rsvJson.data) ? rsvJson.data : [];
          const todayDepartures = rsvs.filter((r: any) => r.start_datetime?.startsWith(today));
          const todayReturns = rsvs.filter((r: any) => r.end_datetime?.startsWith(today));
          const pending = rsvs.filter((r: any) => r.status === "pending");

          if (todayDepartures.length > 0 || todayReturns.length > 0) {
            setDepartureCount(todayDepartures.length);
            setReturnCount(todayReturns.length);
          }
          if (pending.length > 0) {
            setPendingCount(pending.length);
          }

          // タイムラインイベントを生成
          const events: TimelineEvent[] = [];
          for (const r of todayDepartures) {
            const time = r.start_datetime?.slice(11, 16) || "09:00";
            events.push({
              time,
              type: "departure",
              vehicleName: r.bike_name || r.bikeName || "不明",
              customerName: r.user_name || r.customerName || "顧客",
              reservationId: r.id,
            });
          }
          for (const r of todayReturns) {
            const time = r.end_datetime?.slice(11, 16) || "17:00";
            events.push({
              time,
              type: "return",
              vehicleName: r.bike_name || r.bikeName || "不明",
              customerName: r.user_name || r.customerName || "顧客",
              reservationId: r.id,
            });
          }
          if (events.length > 0) {
            events.sort((a, b) => a.time.localeCompare(b.time));
            setTimelineEvents(events);
          }
        }

        if (salesJson?.data) {
          const { revenueByMonth, monthlyRevenue, totalRevenue } = salesJson.data;
          if (monthlyRevenue) setMonthlySales(monthlyRevenue);
          if (revenueByMonth && revenueByMonth.length >= 2) {
            const lastTwo = revenueByMonth.slice(-2);
            setPrevMonthlySales(lastTwo[0].revenue);
            if (lastTwo[1]) setMonthlySales(lastTwo[1].revenue);

            const months = ["1月","2月","3月","4月","5月","6月","7月","8月","9月","10月","11月","12月"];
            const chartData: MonthlySales[] = revenueByMonth.slice(-6).map((m: any) => {
              const monthNum = parseInt(m.month.split("-")[1]);
              return { month: months[monthNum - 1], amount: m.revenue };
            });
            if (chartData.length > 0) setSalesData(chartData);
          }
        }
      })
      .catch((err) => console.error("Dashboard API error:", err))
      .finally(() => setLoading(false));
  }, []);

  const currentMonthName = `${new Date().getMonth() + 1}月`;

  if (loading) return <div className="p-[24px]">読み込み中...</div>;

  return (
    <div>
      {/* 挨拶バナー */}
      <GreetingBanner departureCount={departureCount} returnCount={returnCount} />

      {/* KPIカード */}
      <div className="mt-[16px]">
        <KpiGrid>
          <KpiCard
            icon={ArrowUpRight}
            label="今日の出発"
            value={departureCount}
            unit="件"
            href="/vendor/reservations"
          />
          <KpiCard
            icon={ArrowDownLeft}
            label="今日の返却"
            value={returnCount}
            unit="件"
            href="/vendor/reservations"
          />
          <KpiCard
            icon={AlertCircle}
            label="未回答リクエスト"
            value={pendingCount}
            unit="件"
            href="/vendor/reservations?status=unconfirmed"
            accentColor="#F59E0B"
          />
          <KpiCard
            icon={JapaneseYen}
            label="当月売上"
            value={`¥${monthlySales.toLocaleString()}`}
            comparison={{ label: "前月比", diff: monthlySales - prevMonthlySales, isPositive: monthlySales >= prevMonthlySales }}
            subInfo={`前月末時点 ¥${prevMonthlySales.toLocaleString()}`}
            href="/vendor/analytics/shop-performance"
          />
        </KpiGrid>
      </div>

      {/* 車検アラート */}
      <div className="mt-[16px]">
        <InspectionAlertPanel />
      </div>

      {/* タイムライン（全幅） */}
      <div className="mt-[16px]">
        <DayTimeline events={timelineEvents} />
      </div>

      {/* 車両ステータス & 売上推移 & お知らせ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-[16px] mt-[16px]">
        <VehicleStatusBoard statuses={vehicleStatuses} />
        <MiniSalesChart data={salesData} currentMonth={currentMonthName} />
        <NoticePanel notices={notices} />
      </div>
    </div>
  );
}

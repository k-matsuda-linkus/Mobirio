"use client";

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

// ---------- モックデータ ----------

const TIMELINE_EVENTS: TimelineEvent[] = [
  {
    time: "09:00",
    type: "departure",
    vehicleName: "PCX160",
    customerName: "田中 太郎",
    reservationId: "R-20260220-001",
  },
  {
    time: "10:00",
    type: "departure",
    vehicleName: "ADV150",
    customerName: "山田 花子",
    reservationId: "R-20260220-002",
  },
  {
    time: "11:00",
    type: "return",
    vehicleName: "CB250R",
    customerName: "佐藤 一郎",
    reservationId: "R-20260218-010",
  },
  {
    time: "13:00",
    type: "departure",
    vehicleName: "レブル250",
    customerName: "鈴木 次郎",
    reservationId: "R-20260220-003",
  },
  {
    time: "15:00",
    type: "return",
    vehicleName: "NMAX155",
    customerName: "高橋 美咲",
    reservationId: "R-20260217-008",
  },
  {
    time: "17:00",
    type: "return",
    vehicleName: "MT-07",
    customerName: "伊藤 健",
    reservationId: "R-20260216-005",
  },
];

const VEHICLE_STATUSES: VehicleStatus[] = [
  {
    status: "available",
    count: 4,
    vehicles: [
      { id: "v1", name: "PCX160" },
      { id: "v2", name: "スーパーカブ110" },
      { id: "v3", name: "ジクサー150" },
      { id: "v4", name: "CT125" },
    ],
  },
  {
    status: "rented",
    count: 3,
    vehicles: [
      { id: "v5", name: "CB250R" },
      { id: "v6", name: "NMAX155" },
      { id: "v7", name: "MT-07" },
    ],
  },
  {
    status: "maintenance",
    count: 1,
    vehicles: [{ id: "v8", name: "ADV150" }],
  },
  {
    status: "reserved",
    count: 2,
    vehicles: [
      { id: "v9", name: "レブル250" },
      { id: "v10", name: "Ninja400" },
    ],
  },
];

const MONTHLY_SALES: MonthlySales[] = [
  { month: "9月", amount: 280000 },
  { month: "10月", amount: 310000 },
  { month: "11月", amount: 260000 },
  { month: "12月", amount: 190000 },
  { month: "1月", amount: 220000 },
  { month: "2月", amount: 345000 },
];

const NOTICES: Notice[] = [
  {
    id: "n1",
    date: "2026/02/18",
    title: "春季キャンペーン開始のご案内",
    isNew: true,
  },
  {
    id: "n2",
    date: "2026/02/15",
    title: "システムメンテナンスのお知らせ（3/1）",
  },
  {
    id: "n3",
    date: "2026/02/10",
    title: "保険契約更新に関するご確認のお願い",
  },
];

// ---------- ページ ----------

export default function VendorDashboardPage() {
  return (
    <div>
      {/* 挨拶バナー */}
      <GreetingBanner departureCount={3} returnCount={2} />

      {/* KPIカード */}
      <div className="mt-[16px]">
        <KpiGrid>
          <KpiCard
            icon={ArrowUpRight}
            label="今日の出発"
            value={3}
            unit="件"
            comparison={{ label: "前日比", diff: 1, isPositive: true }}
            href="/vendor/reservations"
          />
          <KpiCard
            icon={ArrowDownLeft}
            label="今日の返却"
            value={2}
            unit="件"
            comparison={{ label: "前日比", diff: -1, isPositive: false }}
            href="/vendor/reservations"
          />
          <KpiCard
            icon={AlertCircle}
            label="未回答リクエスト"
            value={5}
            unit="件"
            comparison={{ label: "前日比", diff: 2, isPositive: false }}
            href="/vendor/reservations?status=unconfirmed"
            accentColor="#F59E0B"
          />
          <KpiCard
            icon={JapaneseYen}
            label="当月売上"
            value="¥345,000"
            comparison={{ label: "前月比", diff: 55000, isPositive: true }}
            subInfo="前月末時点 ¥290,000"
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
        <DayTimeline events={TIMELINE_EVENTS} />
      </div>

      {/* 車両ステータス & 売上推移 & お知らせ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-[16px] mt-[16px]">
        <VehicleStatusBoard statuses={VEHICLE_STATUSES} />
        <MiniSalesChart data={MONTHLY_SALES} currentMonth="2月" />
        <NoticePanel notices={NOTICES} />
      </div>
    </div>
  );
}

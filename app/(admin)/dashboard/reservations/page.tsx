"use client";
import { useState } from "react";
import { AdminFilterBar } from "@/components/admin/AdminFilterBar";
import { AdminTable } from "@/components/admin/AdminTable";
import { StatusBadge } from "@/components/admin/StatusBadge";
import {
  mockReservations,
  PAYMENT_TYPE_LABELS,
  PAYMENT_SETTLEMENT_LABELS,
  PaymentType,
  PaymentSettlement,
} from "@/lib/mock/reservations";
import { mockUsers } from "@/lib/mock/users";

const statusLabels: Record<string, string> = {
  pending: "予約済",
  confirmed: "確認済",
  in_use: "利用中",
  completed: "完了",
  cancelled: "キャンセル",
  no_show: "ノーショー",
};

const paymentTypeBadgeStyles: Record<PaymentType, string> = {
  ec_credit: "text-blue-600 bg-blue-50",
  onsite_cash: "text-green-600 bg-green-50",
  onsite_credit: "text-purple-600 bg-purple-50",
};

const settlementVariant: Record<PaymentSettlement, "success" | "warning" | "info" | "danger"> = {
  paid: "success",
  partial: "warning",  // 現状のフローでは発生しないが型の整合性のため残す
  unpaid: "info",
  refunded: "danger",
};

const reservations = mockReservations.map((r) => ({
  id: r.id,
  user: mockUsers.find((u) => u.id === r.user_id)?.full_name || r.user_id,
  vendor: r.vendorName,
  bike: r.bikeName,
  start: r.start_datetime.slice(0, 10),
  end: r.end_datetime.slice(0, 10),
  status: statusLabels[r.status] || r.status,
  statusRaw: r.status,
  paymentTypes: r.payment_types,
  paymentSettlement: r.payment_settlement,
  paymentSettlementLabel: PAYMENT_SETTLEMENT_LABELS[r.payment_settlement],
  amount: `¥${r.total_amount.toLocaleString()}`,
}));

const sv = (s: string) => {
  if (s === "確認済" || s === "完了") return "success" as const;
  if (s === "予約済") return "info" as const;
  if (s === "利用中") return "warning" as const;
  return "danger" as const;
};

export default function ReservationsPage() {
  const [sf, setSf] = useState("");
  const [ptf, setPtf] = useState("");
  const [psf, setPsf] = useState("");
  const [search, setSearch] = useState("");

  let filtered = sf ? reservations.filter((r) => r.status === sf) : reservations;
  if (ptf) {
    filtered = filtered.filter((r) =>
      (r.paymentTypes as PaymentType[]).includes(ptf as PaymentType)
    );
  }
  if (psf) {
    filtered = filtered.filter((r) => r.paymentSettlement === psf);
  }
  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(
      (r) =>
        r.id.toLowerCase().includes(q) ||
        r.user.toLowerCase().includes(q) ||
        r.vendor.toLowerCase().includes(q) ||
        r.bike.toLowerCase().includes(q)
    );
  }

  return (
    <div>
      <h1 className="font-serif text-2xl font-light mb-[24px]">全予約</h1>
      <AdminFilterBar
        searchPlaceholder="予約ID・ユーザー名・バイク名で検索..."
        onSearch={setSearch}
        filters={[
          {
            label: "ステータス",
            options: Object.entries(statusLabels).map(([value, label]) => ({
              value: label,
              label,
            })),
            value: sf,
            onChange: setSf,
          },
          {
            label: "決済種別",
            options: Object.entries(PAYMENT_TYPE_LABELS).map(([value, label]) => ({
              value,
              label,
            })),
            value: ptf,
            onChange: setPtf,
          },
          {
            label: "決済状況",
            options: Object.entries(PAYMENT_SETTLEMENT_LABELS).map(([value, label]) => ({
              value,
              label,
            })),
            value: psf,
            onChange: setPsf,
          },
        ]}
      />
      <AdminTable
        columns={[
          { key: "id", label: "ID" },
          { key: "user", label: "ユーザー" },
          { key: "vendor", label: "ベンダー" },
          { key: "bike", label: "バイク" },
          {
            key: "period",
            label: "期間",
            render: (r) => <span>{String(r.start)} ~ {String(r.end)}</span>,
          },
          {
            key: "status",
            label: "ステータス",
            render: (r) => (
              <StatusBadge status={String(r.status)} variant={sv(String(r.status))} />
            ),
          },
          {
            key: "paymentTypes",
            label: "決済方法",
            render: (r) => (
              <div className="flex flex-wrap gap-[4px]">
                {(r.paymentTypes as PaymentType[]).map((pt) => (
                  <span
                    key={pt}
                    className={`text-xs font-medium px-[8px] py-[2px] ${paymentTypeBadgeStyles[pt]}`}
                  >
                    {PAYMENT_TYPE_LABELS[pt]}
                  </span>
                ))}
              </div>
            ),
          },
          {
            key: "paymentSettlement",
            label: "決済状況",
            render: (r) => (
              <StatusBadge
                status={String(r.paymentSettlementLabel)}
                variant={settlementVariant[r.paymentSettlement as PaymentSettlement]}
              />
            ),
          },
          { key: "amount", label: "金額" },
        ]}
        data={filtered}
      />
    </div>
  );
}

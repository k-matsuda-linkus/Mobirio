"use client";
import { useState } from "react";
import { AdminStatsCard } from "@/components/admin/AdminStatsCard";
import { AdminFilterBar } from "@/components/admin/AdminFilterBar";
import { AdminTable } from "@/components/admin/AdminTable";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { mockPayments } from "@/lib/mock/payments";
import type { PaymentType } from "@/lib/mock/reservations";
import { PAYMENT_TYPE_LABELS } from "@/lib/mock/reservations";
import { CreditCard, Banknote, Wallet, RotateCcw } from "lucide-react";

/* ---------- 統計 ---------- */
const completed = mockPayments.filter((p) => p.status === "completed");

const ecCreditAmount = completed
  .filter((p) => p.payment_type === "ec_credit")
  .reduce((sum, p) => sum + p.amount, 0);

const onsiteCashAmount = completed
  .filter((p) => p.payment_type === "onsite_cash")
  .reduce((sum, p) => sum + p.amount, 0);

const onsiteCreditAmount = completed
  .filter((p) => p.payment_type === "onsite_credit")
  .reduce((sum, p) => sum + p.amount, 0);

const refundAmount = mockPayments
  .filter((p) => p.status === "refunded")
  .reduce((sum, p) => sum + (p.refund_amount || p.amount), 0);

/* ---------- ステータスラベル ---------- */
const statusLabels: Record<string, string> = {
  completed: "完了",
  pending: "保留",
  refunded: "返金済",
  failed: "失敗",
};

/* ---------- 決済種別バッジスタイル ---------- */
const paymentTypeBadgeStyles: Record<PaymentType, string> = {
  ec_credit: "text-blue-600 bg-blue-50",
  onsite_cash: "text-green-600 bg-green-50",
  onsite_credit: "text-purple-600 bg-purple-50",
};

/* ---------- テーブル用データ変換 ---------- */
const payments = mockPayments.map((p) => ({
  id: p.id,
  reservationId: p.reservation_id,
  vendor: p.vendor_id,
  paymentType: p.payment_type,
  paymentTypeLabel: PAYMENT_TYPE_LABELS[p.payment_type],
  amount: `¥${p.amount.toLocaleString()}`,
  amountNum: p.amount,
  status: statusLabels[p.status] || p.status,
  rawStatus: p.status,
  note: p.note ?? "—",
  date: p.created_at.slice(0, 10),
}));

export default function PaymentsPage() {
  const [ptf, setPtf] = useState("");
  const [sf, setSf] = useState("");
  const [search, setSearch] = useState("");

  let filtered = payments;
  if (ptf) {
    filtered = filtered.filter((p) => p.paymentTypeLabel === ptf);
  }
  if (sf) {
    filtered = filtered.filter((p) => p.status === sf);
  }
  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(
      (p) =>
        p.id.toLowerCase().includes(q) ||
        p.reservationId.toLowerCase().includes(q)
    );
  }

  return (
    <div>
      <h1 className="font-serif text-2xl font-light mb-[24px]">決済管理</h1>

      {/* 統計カード 4列 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-[20px] mb-[30px]">
        <AdminStatsCard
          title="EC決済（クレカ）"
          value={`¥${ecCreditAmount.toLocaleString()}`}
          icon={<CreditCard className="w-[24px] h-[24px]" />}
        />
        <AdminStatsCard
          title="現地現金"
          value={`¥${onsiteCashAmount.toLocaleString()}`}
          icon={<Banknote className="w-[24px] h-[24px]" />}
        />
        <AdminStatsCard
          title="現地クレカ"
          value={`¥${onsiteCreditAmount.toLocaleString()}`}
          icon={<Wallet className="w-[24px] h-[24px]" />}
        />
        <AdminStatsCard
          title="返金総額"
          value={`¥${refundAmount.toLocaleString()}`}
          icon={<RotateCcw className="w-[24px] h-[24px]" />}
        />
      </div>

      {/* フィルタバー */}
      <AdminFilterBar
        searchPlaceholder="決済ID・予約IDで検索..."
        onSearch={setSearch}
        filters={[
          {
            label: "決済種別",
            options: Object.values(PAYMENT_TYPE_LABELS).map((label) => ({
              value: label,
              label,
            })),
            value: ptf,
            onChange: setPtf,
          },
          {
            label: "ステータス",
            options: Object.values(statusLabels).map((label) => ({
              value: label,
              label,
            })),
            value: sf,
            onChange: setSf,
          },
        ]}
      />

      {/* テーブル */}
      <AdminTable
        columns={[
          { key: "id", label: "決済ID" },
          { key: "reservationId", label: "予約ID" },
          { key: "vendor", label: "ベンダーID" },
          {
            key: "paymentTypeLabel",
            label: "決済種別",
            render: (p) => (
              <span
                className={`text-xs font-medium px-[8px] py-[2px] ${paymentTypeBadgeStyles[String(p.paymentType) as PaymentType] ?? ""}`}
              >
                {String(p.paymentTypeLabel)}
              </span>
            ),
          },
          { key: "amount", label: "金額" },
          {
            key: "status",
            label: "ステータス",
            render: (p) => (
              <StatusBadge
                status={String(p.rawStatus)}
                category="payment"
              />
            ),
          },
          { key: "note", label: "備考" },
          { key: "date", label: "日時" },
        ]}
        data={filtered}
      />
    </div>
  );
}

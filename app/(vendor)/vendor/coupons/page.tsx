"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Ticket } from "lucide-react";
import { VendorPageHeader } from "@/components/vendor/VendorPageHeader";
import { VendorDataTable, type VendorColumn } from "@/components/vendor/VendorDataTable";
import { StatusBadge } from "@/components/vendor/StatusBadge";
import { EmptyState } from "@/components/vendor/EmptyState";

interface CouponRow {
  id: string;
  code: string;
  name: string;
  discount_type: "fixed" | "percentage";
  discount_value: number;
  max_discount: number | null;
  usage_limit: number | null;
  usage_count: number;
  valid_from: string;
  valid_until: string;
  status: string;
}

const MOCK_COUPONS: CouponRow[] = [
  {
    id: "cpn-001",
    code: "WELCOME10",
    name: "初回10%OFFクーポン",
    discount_type: "percentage",
    discount_value: 10,
    max_discount: 2000,
    usage_limit: 100,
    usage_count: 42,
    valid_from: "2026-01-01",
    valid_until: "2026-12-31",
    status: "coupon_active",
  },
  {
    id: "cpn-002",
    code: "SUMMER500",
    name: "夏季500円OFFクーポン",
    discount_type: "fixed",
    discount_value: 500,
    max_discount: null,
    usage_limit: 200,
    usage_count: 200,
    valid_from: "2026-06-01",
    valid_until: "2026-08-31",
    status: "coupon_exhausted",
  },
  {
    id: "cpn-003",
    code: "REPEAT1000",
    name: "リピーター1000円OFF",
    discount_type: "fixed",
    discount_value: 1000,
    max_discount: null,
    usage_limit: null,
    usage_count: 15,
    valid_from: "2025-01-01",
    valid_until: "2025-12-31",
    status: "coupon_expired",
  },
  {
    id: "cpn-004",
    code: "NEWYEAR20",
    name: "新年20%OFFクーポン",
    discount_type: "percentage",
    discount_value: 20,
    max_discount: 3000,
    usage_limit: 50,
    usage_count: 0,
    valid_from: "2027-01-01",
    valid_until: "2027-01-31",
    status: "coupon_scheduled",
  },
  {
    id: "cpn-005",
    code: "TEST300",
    name: "テスト300円OFF",
    discount_type: "fixed",
    discount_value: 300,
    max_discount: null,
    usage_limit: 10,
    usage_count: 3,
    valid_from: "2026-01-01",
    valid_until: "2026-12-31",
    status: "coupon_disabled",
  },
];

function formatDiscount(coupon: CouponRow): React.ReactNode {
  if (coupon.discount_type === "fixed") {
    return <span>&yen;{coupon.discount_value.toLocaleString()} OFF</span>;
  }
  return (
    <span>
      {coupon.discount_value}% OFF
      {coupon.max_discount != null && (
        <span className="text-xs text-gray-400 ml-[4px]">
          (最大&yen;{coupon.max_discount.toLocaleString()})
        </span>
      )}
    </span>
  );
}

const columns: VendorColumn<CouponRow>[] = [
  {
    key: "code",
    label: "コード",
    width: "w-[130px]",
    render: (item) => (
      <span className="font-mono text-xs font-medium text-gray-800">{item.code}</span>
    ),
  },
  {
    key: "name",
    label: "クーポン名",
    sortable: true,
    render: (item) => (
      <Link
        href={`/vendor/coupons/${item.id}/edit`}
        className="font-medium text-accent hover:underline"
      >
        {item.name}
      </Link>
    ),
  },
  {
    key: "discount",
    label: "割引内容",
    render: (item) => <div className="text-sm">{formatDiscount(item)}</div>,
  },
  {
    key: "usage",
    label: "利用状況",
    render: (item) => (
      <span className="text-sm">
        {item.usage_count} / {item.usage_limit ?? "∞"}回
      </span>
    ),
  },
  {
    key: "period",
    label: "有効期間",
    render: (item) => (
      <span className="text-xs text-gray-600">
        {item.valid_from} 〜 {item.valid_until}
      </span>
    ),
  },
  {
    key: "status",
    label: "ステータス",
    render: (item) => <StatusBadge status={item.status} />,
  },
  {
    key: "action",
    label: "操作",
    width: "w-[70px]",
    render: (item) => (
      <Link
        href={`/vendor/coupons/${item.id}/edit`}
        className="text-xs border border-gray-300 px-[12px] py-[4px] hover:bg-gray-50 whitespace-nowrap"
      >
        詳細
      </Link>
    ),
  },
];

export default function VendorCouponsPage() {
  const [coupons] = useState<CouponRow[]>(MOCK_COUPONS);

  return (
    <div>
      <VendorPageHeader
        title="クーポン管理"
        breadcrumbs={[{ label: "クーポン管理" }]}
        actions={
          <Link
            href="/vendor/coupons/new"
            className="flex items-center gap-[6px] bg-accent text-white px-[16px] py-[8px] text-sm hover:bg-accent/90"
          >
            <Plus className="w-[14px] h-[14px]" />
            新規作成
          </Link>
        }
      />

      {coupons.length === 0 ? (
        <EmptyState
          icon={Ticket}
          title="クーポンがありません"
          description="クーポンを作成して、お客様への割引を開始しましょう。"
          actionLabel="クーポンを作成する"
          actionHref="/vendor/coupons/new"
        />
      ) : (
        <VendorDataTable columns={columns} data={coupons} pageSize={20} />
      )}
    </div>
  );
}

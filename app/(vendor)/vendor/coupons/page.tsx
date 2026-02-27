"use client";

import { useState, useEffect } from "react";
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

function deriveCouponStatus(c: { is_active?: boolean; usage_limit?: number | null; usage_count?: number; valid_from?: string; valid_until?: string }): string {
  if (c.is_active === false) return "coupon_disabled";
  const now = new Date().toISOString();
  if (c.valid_from && now < c.valid_from) return "coupon_scheduled";
  if (c.valid_until && now > c.valid_until) return "coupon_expired";
  if (c.usage_limit && c.usage_count !== undefined && c.usage_count >= c.usage_limit) return "coupon_exhausted";
  return "coupon_active";
}

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
  const [coupons, setCoupons] = useState<CouponRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/vendor/coupons")
      .then((res) => (res.ok ? res.json() : Promise.reject("API error")))
      .then((json) => {
        setCoupons(
          (json.data || []).map((c: Record<string, unknown>) => ({
            id: c.id,
            code: c.code,
            name: c.name,
            discount_type: c.discount_type,
            discount_value: c.discount_value,
            max_discount: c.max_discount ?? null,
            usage_limit: c.usage_limit ?? null,
            usage_count: c.usage_count ?? 0,
            valid_from: typeof c.valid_from === "string" ? c.valid_from.slice(0, 10) : "",
            valid_until: typeof c.valid_until === "string" ? c.valid_until.slice(0, 10) : "",
            status: deriveCouponStatus(c as { is_active?: boolean; usage_limit?: number | null; usage_count?: number; valid_from?: string; valid_until?: string }),
          }))
        );
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-[24px]">読み込み中...</div>;

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

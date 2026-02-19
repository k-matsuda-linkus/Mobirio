"use client";
import { useState } from "react";
import { AdminFilterBar } from "@/components/admin/AdminFilterBar";
import { AdminTable } from "@/components/admin/AdminTable";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { mockBikes } from "@/lib/mock/bikes";
import { mockVendors } from "@/lib/mock/vendors";
import { getInsuranceCategory } from "@/lib/booking/pricing";

const classLabels: Record<string, string> = {
  ev: "特定EV",
  "50": "50cc",
  "125": "125cc",
  "250": "250cc",
  "400": "400cc",
  "950": "950cc",
  "1100": "1100cc",
  "1500": "1500cc",
};

const bikes = mockBikes.map((b) => {
  const vendor = mockVendors.find((v) => v.id === b.vendor_id);
  return {
    id: b.id,
    name: b.name,
    vendor: vendor?.name || b.vendor_id,
    cls: classLabels[b.vehicle_class] || b.vehicle_class,
    cc: b.displacement ? `${b.displacement}cc` : "EV",
    price: `¥${b.daily_rate_1day.toLocaleString()}`,
    status: b.is_available ? "稼働中" : "停止中",
    manufacturer: b.manufacturer,
    insuranceType: b.insurance_type || "mobirio",
    insuranceCategory: getInsuranceCategory(b.vehicle_class),
  };
});

const sv = (s: string) => {
  if (s === "稼働中") return "success" as const;
  if (s === "貸出中") return "info" as const;
  if (s === "メンテナンス") return "warning" as const;
  return "danger" as const;
};

export default function BikesPage() {
  const [cf, setCf] = useState("");
  const [search, setSearch] = useState("");
  let filtered = cf ? bikes.filter((b) => b.cls === cf) : bikes;
  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(
      (b) =>
        b.name.toLowerCase().includes(q) ||
        b.vendor.toLowerCase().includes(q) ||
        b.manufacturer.toLowerCase().includes(q)
    );
  }

  return (
    <div>
      <h1 className="font-serif text-2xl font-light mb-[24px]">全バイク</h1>
      <AdminFilterBar
        searchPlaceholder="車名・ベンダー・メーカーで検索..."
        onSearch={setSearch}
        filters={[
          {
            label: "クラス",
            options: Object.entries(classLabels).map(([value, label]) => ({
              value: label,
              label,
            })),
            value: cf,
            onChange: setCf,
          },
        ]}
      />
      <AdminTable
        columns={[
          { key: "name", label: "車名" },
          { key: "vendor", label: "ベンダー" },
          { key: "manufacturer", label: "メーカー" },
          { key: "cls", label: "クラス" },
          { key: "cc", label: "排気量" },
          { key: "price", label: "日額" },
          {
            key: "status",
            label: "状態",
            render: (b) => (
              <StatusBadge
                status={String(b.status)}
                variant={sv(String(b.status))}
              />
            ),
          },
          {
            key: "insuranceType",
            label: "任意保険",
            render: (b) =>
              b.insuranceType === "mobirio" ? (
                <span className="flex items-center gap-[6px]">
                  <StatusBadge status="Mobirio" variant="info" />
                  <span className="text-xs text-gray-500">
                    {b.insuranceCategory === "motorcycle" ? "二輪" : "原付"}
                  </span>
                </span>
              ) : (
                <StatusBadge status="他社" variant="neutral" />
              ),
          },
        ]}
        data={filtered}
      />
    </div>
  );
}

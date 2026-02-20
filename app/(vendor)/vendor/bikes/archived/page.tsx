"use client";

import { useState } from "react";
import Link from "next/link";
import { VendorPageHeader } from "@/components/vendor/VendorPageHeader";
import { VendorDataTable, type VendorColumn } from "@/components/vendor/VendorDataTable";
import { StatusBadge } from "@/components/vendor/StatusBadge";
import { EmptyState } from "@/components/vendor/EmptyState";
import { Bike } from "lucide-react";

interface ArchivedBike {
  id: string;
  image: string;
  storeName: string;
  vehicleName: string;
  maker: string;
  displacement: string;
  priceClass: string;
  regNumber: string;
  archivedAt: string;
  reason: string;
  totalRentals: number;
  totalRevenue: number;
}

const mockArchivedBikes: ArchivedBike[] = [
  {
    id: "a-001",
    image: "/images/bikes/zx6r.jpg",
    storeName: "宮崎本店",
    vehicleName: "ZX-6R",
    maker: "Kawasaki",
    displacement: "636cc",
    priceClass: "Sクラス",
    regNumber: "宮崎 さ 1111",
    archivedAt: "2025-11-15",
    reason: "保険解約",
    totalRentals: 48,
    totalRevenue: 720000,
  },
  {
    id: "a-002",
    image: "/images/bikes/sv650.jpg",
    storeName: "鹿児島支店",
    vehicleName: "SV650",
    maker: "Suzuki",
    displacement: "650cc",
    priceClass: "Aクラス",
    regNumber: "鹿児島 し 2222",
    archivedAt: "2025-09-20",
    reason: "保険解約",
    totalRentals: 35,
    totalRevenue: 490000,
  },
  {
    id: "a-003",
    image: "/images/bikes/nmax155.jpg",
    storeName: "宮崎本店",
    vehicleName: "NMAX 155",
    maker: "Yamaha",
    displacement: "155cc",
    priceClass: "Bクラス",
    regNumber: "宮崎 す 3333",
    archivedAt: "2025-06-01",
    reason: "保険解約",
    totalRentals: 62,
    totalRevenue: 558000,
  },
];

const columns: VendorColumn<ArchivedBike>[] = [
  {
    key: "storeVehicle",
    label: "店舗 / 車両名",
    sortable: true,
    render: (item) => (
      <div>
        <div className="text-xs text-gray-400">{item.storeName}</div>
        <div className="font-medium">{item.vehicleName}</div>
        <div className="text-xs text-gray-400">{item.maker}</div>
      </div>
    ),
  },
  {
    key: "regNumber",
    label: "登録番号",
    render: (item) => <span className="text-sm">{item.regNumber}</span>,
  },
  {
    key: "priceDisp",
    label: "料金クラス / 排気量",
    render: (item) => (
      <div className="text-xs">
        <div>{item.priceClass}</div>
        <div className="text-gray-400">{item.displacement}</div>
      </div>
    ),
  },
  {
    key: "stats",
    label: "累計レンタル / 売上",
    render: (item) => (
      <div className="text-xs">
        <div>{item.totalRentals}件</div>
        <div className="text-gray-400">¥{item.totalRevenue.toLocaleString()}</div>
      </div>
    ),
  },
  {
    key: "reason",
    label: "理由",
    render: (item) => <StatusBadge status="insurance_cancelled" label={item.reason} />,
  },
  {
    key: "archivedAt",
    label: "アーカイブ日",
    sortable: true,
    render: (item) => <span className="text-sm text-gray-600">{item.archivedAt}</span>,
  },
];

export default function ArchivedBikesPage() {
  return (
    <div>
      <VendorPageHeader
        title="アーカイブ車両"
        breadcrumbs={[
          { label: "車両一覧", href: "/vendor/bikes" },
          { label: "アーカイブ車両" },
        ]}
      />

      <div className="bg-amber-50 border border-amber-200 px-[16px] py-[12px] mb-[24px] text-sm text-amber-800">
        保険解約により非公開になった車両の一覧です。統計データは保持されます。
      </div>

      {mockArchivedBikes.length === 0 ? (
        <EmptyState
          icon={Bike}
          title="アーカイブ車両はありません"
          description="保険解約等でアーカイブされた車両がここに表示されます。"
        />
      ) : (
        <VendorDataTable columns={columns} data={mockArchivedBikes} pageSize={20} />
      )}
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
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

/* eslint-disable @typescript-eslint/no-explicit-any */
function toArchivedBike(bike: any): ArchivedBike {
  return {
    id: bike.id,
    image: bike.image_urls?.[0] ?? "",
    storeName: "宮崎本店",
    vehicleName: bike.name ?? "",
    maker: bike.manufacturer ?? "",
    displacement: bike.displacement ? `${bike.displacement}cc` : "",
    priceClass: bike.vehicle_class ? `${bike.vehicle_class}クラス` : "",
    regNumber: bike.registration_number ?? "",
    archivedAt: bike.updated_at?.split("T")[0] ?? bike.updated_at?.split(" ")[0] ?? "",
    reason: "保険解約",
    totalRentals: 0,
    totalRevenue: 0,
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

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
  const [archivedBikes, setArchivedBikes] = useState<ArchivedBike[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/vendor/bikes?status=archived")
      .then((res) => (res.ok ? res.json() : Promise.reject("API error")))
      .then((json) => {
        const rows = (json.data || []).map(toArchivedBike);
        setArchivedBikes(rows);
      })
      .catch((err) => console.error("アーカイブ車両の取得に失敗:", err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-[24px]">読み込み中...</div>;

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

      {archivedBikes.length === 0 ? (
        <EmptyState
          icon={Bike}
          title="アーカイブ車両はありません"
          description="保険解約等でアーカイブされた車両がここに表示されます。"
        />
      ) : (
        <VendorDataTable columns={columns} data={archivedBikes} pageSize={20} />
      )}
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Search, Download, Plus, GripVertical, Image as ImageIcon, List, LayoutGrid } from "lucide-react";
import { VendorPageHeader } from "@/components/vendor/VendorPageHeader";
import { VendorDataTable, type VendorColumn } from "@/components/vendor/VendorDataTable";
import { StoreSelector } from "@/components/vendor/StoreSelector";
import { StatusBadge } from "@/components/vendor/StatusBadge";
import { ViewToggle } from "@/components/vendor/ViewToggle";
import { BikeGridView } from "@/components/vendor/BikeGridView";
import { EmptyState } from "@/components/vendor/EmptyState";
import { Bike as BikeIcon } from "lucide-react";

function getInspectionStatus(expiryDate?: string): string | null {
  if (!expiryDate) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(expiryDate);
  expiry.setHours(0, 0, 0, 0);
  const diffMs = expiry.getTime() - today.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return "inspection_expired";
  if (diffDays <= 30) return "inspection_expiring";
  return "inspection_ok";
}

interface BikeRow {
  id: string;
  image: string;
  storeName: string;
  vehicleName: string;
  regNumber: string;
  chassisNumber: string;
  priceClass: string;
  displacement: string;
  attributes: string[];
  insurance: string;
  publishStatus: string;
  displayOrder: number;
  inspectionExpiry?: string;
}

const mockStores = [
  { id: "all", name: "全店舗" },
  { id: "s-001", name: "宮崎本店" },
  { id: "s-002", name: "鹿児島支店" },
];

/* eslint-disable @typescript-eslint/no-explicit-any */
function toBikeRow(bike: any): BikeRow {
  const attrs: string[] = [];
  if (bike.is_long_term) attrs.push("長期レンタル");
  return {
    id: bike.id,
    image: bike.image_urls?.[0] ?? "",
    storeName: "宮崎本店",
    vehicleName: bike.name ?? bike.vehicleName ?? "",
    regNumber: bike.registration_number ?? bike.regNumber ?? "",
    chassisNumber: bike.frame_number ?? bike.chassisNumber ?? "",
    priceClass: bike.vehicle_class ? `${bike.vehicle_class}クラス` : "",
    displacement: bike.displacement ? `${bike.displacement}cc` : "",
    attributes: attrs,
    insurance: bike.insurance_status ?? "active",
    publishStatus: bike.is_published ? "published" : "unpublished",
    displayOrder: bike.display_order ?? 0,
    inspectionExpiry: bike.inspection_expiry ?? undefined,
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

const columns: VendorColumn<BikeRow>[] = [
  {
    key: "displayOrder",
    label: "表示順",
    width: "w-[60px]",
    render: (item) => (
      <div className="flex items-center gap-[4px]">
        <GripVertical className="w-[14px] h-[14px] text-gray-300 cursor-grab" />
        <span className="text-gray-500">{item.displayOrder}</span>
      </div>
    ),
  },
  {
    key: "image",
    label: "画像",
    width: "w-[70px]",
    render: (item) => (
      <div className="w-[48px] h-[36px] bg-gray-100 flex items-center justify-center overflow-hidden">
        {item.image ? (
          <img src={item.image} alt={item.vehicleName} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden'); }} />
        ) : null}
        <ImageIcon className={`w-[16px] h-[16px] text-gray-300 ${item.image ? 'hidden' : ''}`} />
      </div>
    ),
  },
  {
    key: "storeVehicle",
    label: "店舗 / 車両名",
    sortable: true,
    render: (item) => (
      <div>
        <div className="text-xs text-gray-400">{item.storeName}</div>
        <Link
          href={`/vendor/bikes/${item.id}/edit`}
          className="font-medium text-accent hover:underline"
        >
          {item.vehicleName}
        </Link>
      </div>
    ),
  },
  {
    key: "regChassis",
    label: "登録番号 / 車台番号",
    render: (item) => (
      <div className="text-xs">
        <div>{item.regNumber}</div>
        <div className="text-gray-400">{item.chassisNumber}</div>
      </div>
    ),
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
    key: "attributes",
    label: "車両属性設定",
    render: (item) => (
      <div className="flex flex-wrap gap-[4px]">
        {item.attributes.length > 0 ? (
          item.attributes.map((attr) => (
            <span key={attr} className="text-xs bg-blue-50 text-blue-700 px-[6px] py-[1px]">
              {attr}
            </span>
          ))
        ) : (
          <span className="text-xs text-gray-300">-</span>
        )}
      </div>
    ),
  },
  {
    key: "insurance",
    label: "任意保険",
    render: (item) => <StatusBadge status={item.insurance} />,
  },
  {
    key: "inspectionExpiry",
    label: "車検期限",
    render: (item) => {
      if (!item.inspectionExpiry) return <span className="text-xs text-gray-300">-</span>;
      const status = getInspectionStatus(item.inspectionExpiry);
      return (
        <div className="text-xs">
          <div className="text-gray-600">{item.inspectionExpiry}</div>
          {status && <StatusBadge status={status} />}
        </div>
      );
    },
  },
  {
    key: "publishStatus",
    label: "公開状況",
    render: (item) => <StatusBadge status={item.publishStatus} />,
  },
  {
    key: "detail",
    label: "",
    width: "w-[70px]",
    render: (item) => (
      <Link
        href={`/vendor/bikes/${item.id}/edit`}
        className="text-xs border border-gray-300 px-[12px] py-[4px] hover:bg-gray-50 whitespace-nowrap"
      >
        詳細
      </Link>
    ),
  },
];

export default function VendorBikesListPage() {
  const [selectedStore, setSelectedStore] = useState("all");
  const [viewMode, setViewMode] = useState<"table" | "grid">("grid");
  const [bikes, setBikes] = useState<BikeRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/vendor/bikes")
      .then((res) => (res.ok ? res.json() : Promise.reject("API error")))
      .then((json) => {
        const rows = (json.data || []).map(toBikeRow);
        setBikes(rows);
      })
      .catch((err) => console.error("車両一覧の取得に失敗:", err))
      .finally(() => setLoading(false));
  }, []);

  const handlePublishChange = (id: string, isPublished: boolean) => {
    setBikes((prev) =>
      prev.map((bike) =>
        bike.id === id
          ? { ...bike, publishStatus: isPublished ? "published" : "unpublished" }
          : bike
      )
    );
    fetch(`/api/vendor/bikes/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_published: isPublished }),
    }).catch((err) => console.error("公開状態の更新に失敗:", err));
  };

  const gridBikes = bikes.map((bike) => ({
    id: bike.id,
    image: bike.image,
    vehicleName: bike.vehicleName,
    storeName: bike.storeName,
    displacement: bike.displacement,
    priceClass: bike.priceClass,
    publishStatus: bike.publishStatus,
    utilizationRate: undefined,
  }));

  if (loading) return <div className="p-[24px]">読み込み中...</div>;

  return (
    <div>
      <VendorPageHeader
        title="車両一覧"
        breadcrumbs={[{ label: "車両一覧" }]}
        actions={
          <>
            <StoreSelector
              stores={mockStores}
              selectedId={selectedStore}
              onChange={setSelectedStore}
            />
            <button className="flex items-center gap-[6px] border border-gray-300 px-[12px] py-[8px] text-sm hover:bg-gray-50">
              <Search className="w-[14px] h-[14px]" />
              検索
            </button>
            <button className="flex items-center gap-[6px] border border-gray-300 px-[12px] py-[8px] text-sm hover:bg-gray-50">
              <Download className="w-[14px] h-[14px]" />
              CSV出力
            </button>
            <Link
              href="/vendor/bikes/new"
              className="flex items-center gap-[6px] bg-accent text-white px-[16px] py-[8px] text-sm hover:bg-accent/90"
            >
              <Plus className="w-[14px] h-[14px]" />
              新規
            </Link>
          </>
        }
      />

      <div className="mb-[16px] px-[16px] py-[8px]">
        <ViewToggle
          views={[
            { key: "table", label: "テーブル", icon: List },
            { key: "grid", label: "グリッド", icon: LayoutGrid },
          ]}
          activeView={viewMode}
          onChange={(key) => setViewMode(key as "table" | "grid")}
        />
      </div>

      {bikes.length === 0 ? (
        <EmptyState
          icon={BikeIcon}
          title="車両がありません"
          description="車両を登録して、レンタル予約の受付を開始しましょう。"
          actionLabel="車両を登録する"
          actionHref="/vendor/bikes/new"
        />
      ) : viewMode === "table" ? (
        <VendorDataTable columns={columns} data={bikes} pageSize={20} />
      ) : (
        <BikeGridView bikes={gridBikes} onPublishChange={handlePublishChange} />
      )}
    </div>
  );
}

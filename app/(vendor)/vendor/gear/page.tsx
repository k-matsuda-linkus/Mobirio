"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, Download, Plus, GripVertical, Copy, HardHat } from "lucide-react";
import { VendorPageHeader } from "@/components/vendor/VendorPageHeader";
import { VendorDataTable, type VendorColumn } from "@/components/vendor/VendorDataTable";
import { StoreSelector } from "@/components/vendor/StoreSelector";
import { StatusBadge } from "@/components/vendor/StatusBadge";
import { EmptyState } from "@/components/vendor/EmptyState";

interface GearRow {
  id: string;
  storeName: string;
  gearTypeName: string;
  size: string;
  comment: string;
  displayOrder: number;
  createdAt: string;
  hasReservation: boolean;
  publishStatus: string;
}

const mockStores = [
  { id: "all", name: "全店舗" },
  { id: "s-001", name: "宮崎本店" },
  { id: "s-002", name: "鹿児島支店" },
];

const mockGear: GearRow[] = [
  {
    id: "1",
    storeName: "宮崎本店",
    gearTypeName: "ヘルメット（ジェット）",
    size: "S",
    comment: "OGK KABUTO EXCEED ジェットヘルメット。軽量で快適な装着感。",
    displayOrder: 1,
    createdAt: "2025-08-15 10:00",
    hasReservation: true,
    publishStatus: "published",
  },
  {
    id: "2",
    storeName: "宮崎本店",
    gearTypeName: "ヘルメット（ジェット）",
    size: "M",
    comment: "SHOEI J-Cruise IIジェットヘルメット。インナーサンバイザー付き。",
    displayOrder: 2,
    createdAt: "2025-08-15 10:05",
    hasReservation: true,
    publishStatus: "published",
  },
  {
    id: "3",
    storeName: "宮崎本店",
    gearTypeName: "リアケース",
    size: "フリー",
    comment: "GIVI モノロックケース E300N2 30L。ワンタッチ着脱可能。",
    displayOrder: 3,
    createdAt: "2025-09-01 14:30",
    hasReservation: false,
    publishStatus: "published",
  },
  {
    id: "4",
    storeName: "鹿児島支店",
    gearTypeName: "グローブ",
    size: "M",
    comment: "RSタイチ メッシュグローブ。夏場の快適なライディングに最適。通気性抜群。",
    displayOrder: 4,
    createdAt: "2025-09-10 09:00",
    hasReservation: false,
    publishStatus: "published",
  },
  {
    id: "5",
    storeName: "鹿児島支店",
    gearTypeName: "ジャケット",
    size: "L",
    comment: "コミネ プロテクトメッシュジャケット。CE規格プロテクター装備。",
    displayOrder: 5,
    createdAt: "2025-10-01 11:00",
    hasReservation: true,
    publishStatus: "unpublished",
  },
  {
    id: "6",
    storeName: "宮崎本店",
    gearTypeName: "ヘルメット（フルフェイス）",
    size: "L",
    comment: "SHOEI Z-8 フルフェイスヘルメット。軽量コンパクト設計。",
    displayOrder: 6,
    createdAt: "2025-10-15 16:00",
    hasReservation: false,
    publishStatus: "published",
  },
];

function useGearColumns(onDuplicate: (item: GearRow) => void): VendorColumn<GearRow>[] {
  return [
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
    key: "storeName",
    label: "店舗名",
    sortable: true,
  },
  {
    key: "gearTypeName",
    label: "ライダーズギア種別名",
    sortable: true,
  },
  {
    key: "size",
    label: "サイズ",
  },
  {
    key: "comment",
    label: "コメント",
    render: (item) => (
      <span className="text-gray-600" title={item.comment}>
        {item.comment.length > 30 ? item.comment.slice(0, 30) + "..." : item.comment}
      </span>
    ),
  },
  {
    key: "createdAt",
    label: "新規登録日時",
    sortable: true,
    render: (item) => <span className="text-xs text-gray-500">{item.createdAt}</span>,
  },
  {
    key: "hasReservation",
    label: "予約状況",
    render: (item) => (
      <span className={`text-xs ${item.hasReservation ? "text-accent font-medium" : "text-gray-400"}`}>
        {item.hasReservation ? "あり" : "なし"}
      </span>
    ),
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
        href={`/vendor/gear/${item.id}`}
        className="text-xs border border-gray-300 px-[12px] py-[4px] hover:bg-gray-50 whitespace-nowrap"
      >
        詳細
      </Link>
    ),
  },
  {
    key: "copy",
    label: "",
    width: "w-[80px]",
    render: (item) => (
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDuplicate(item);
        }}
        className="flex items-center gap-[4px] text-xs border border-gray-300 px-[10px] py-[4px] hover:bg-gray-50 whitespace-nowrap"
      >
        <Copy className="w-[12px] h-[12px]" />
        複製
      </button>
    ),
  },
];
}

export default function VendorGearListPage() {
  const [selectedStore, setSelectedStore] = useState("all");
  const [gearList, setGearList] = useState<GearRow[]>(mockGear);

  const handleDuplicate = (item: GearRow) => {
    const newId = String(Date.now());
    const maxOrder = Math.max(...gearList.map((g) => g.displayOrder), 0);
    const now = new Date();
    const ts = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")} ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    const duplicated: GearRow = {
      ...item,
      id: newId,
      displayOrder: maxOrder + 1,
      createdAt: ts,
      hasReservation: false,
      publishStatus: "unpublished",
      gearTypeName: item.gearTypeName + "（コピー）",
    };
    setGearList((prev) => [...prev, duplicated]);
  };

  const columns = useGearColumns(handleDuplicate);

  return (
    <div>
      <VendorPageHeader
        title="ライダーズギア一覧"
        breadcrumbs={[{ label: "ライダーズギア一覧" }]}
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
              href="/vendor/gear/new"
              className="flex items-center gap-[6px] bg-accent text-white px-[16px] py-[8px] text-sm hover:bg-accent/90"
            >
              <Plus className="w-[14px] h-[14px]" />
              新規
            </Link>
          </>
        }
      />

      {gearList.length === 0 ? (
        <EmptyState
          icon={HardHat}
          title="ライダーズギアがありません"
          description="ヘルメットやグローブなどのギアを登録しましょう。"
          actionLabel="ギアを登録する"
          actionHref="/vendor/gear/new"
        />
      ) : (
        <VendorDataTable columns={columns} data={gearList} pageSize={20} />
      )}
    </div>
  );
}

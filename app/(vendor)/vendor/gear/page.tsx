"use client";

import { useState, useEffect } from "react";
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

/* eslint-disable @typescript-eslint/no-explicit-any */
function toGearRow(opt: any, index: number): GearRow {
  return {
    id: opt.id,
    storeName: "宮崎本店",
    gearTypeName: opt.name ?? "",
    size: "フリー",
    comment: opt.description ?? "",
    displayOrder: opt.sort_order ?? index + 1,
    createdAt: opt.created_at ?? "",
    hasReservation: false,
    publishStatus: opt.is_active ? "published" : "unpublished",
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

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
  const [gearList, setGearList] = useState<GearRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/vendor/options")
      .then((res) => (res.ok ? res.json() : Promise.reject("API error")))
      .then((json) => {
        const rows = (json.data || []).map(toGearRow);
        setGearList(rows);
      })
      .catch((err) => console.error("ギア一覧の取得に失敗:", err))
      .finally(() => setLoading(false));
  }, []);

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

  if (loading) return <div className="p-[24px]">読み込み中...</div>;

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

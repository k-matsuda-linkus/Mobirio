"use client";

import { useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { VendorPageHeader } from "@/components/vendor/VendorPageHeader";
import { VendorDataTable, type VendorColumn } from "@/components/vendor/VendorDataTable";

interface ShopRow {
  id: string;
  corpCode: string;
  branchNo: string;
  shopName: string;
  prefecture: string;
  address: string;
  bikeCount: number;
}

const mockShops: ShopRow[] = [
  {
    id: "1",
    corpCode: "C001",
    branchNo: "01",
    shopName: "サンシャインモータース宮崎本店",
    prefecture: "宮崎県",
    address: "宮崎市橘通東3-1-1",
    bikeCount: 12,
  },
  {
    id: "2",
    corpCode: "C001",
    branchNo: "02",
    shopName: "サンシャインモータース鹿児島支店",
    prefecture: "鹿児島県",
    address: "鹿児島市中央町10-5",
    bikeCount: 8,
  },
  {
    id: "3",
    corpCode: "C001",
    branchNo: "03",
    shopName: "サンシャインモータース熊本支店",
    prefecture: "熊本県",
    address: "熊本市中央区下通1-3-8",
    bikeCount: 5,
  },
];

const columns: VendorColumn<ShopRow>[] = [
  {
    key: "corpCode",
    label: "法人コード",
    sortable: true,
  },
  {
    key: "branchNo",
    label: "拠点番号",
  },
  {
    key: "shopName",
    label: "店舗名",
    sortable: true,
    render: (item) => <span className="font-medium">{item.shopName}</span>,
  },
  {
    key: "prefecture",
    label: "都道府県",
    sortable: true,
  },
  {
    key: "address",
    label: "住所",
  },
  {
    key: "bikeCount",
    label: "取扱台数",
    sortable: true,
    render: (item) => <span>{item.bikeCount}台</span>,
  },
  {
    key: "detail",
    label: "",
    width: "w-[70px]",
    render: (item) => (
      <Link
        href={`/vendor/shop/${item.id}`}
        className="text-xs border border-gray-300 px-[12px] py-[4px] hover:bg-gray-50 whitespace-nowrap"
      >
        詳細
      </Link>
    ),
  },
  {
    key: "closures",
    label: "",
    width: "w-[160px]",
    render: () => (
      <Link
        href="/vendor/shop/closures"
        className="text-xs border border-gray-300 px-[8px] py-[4px] hover:bg-gray-50 whitespace-nowrap"
      >
        臨時休業・休業日登録
      </Link>
    ),
  },
];

export default function VendorShopListPage() {
  const [keyword, setKeyword] = useState("");

  return (
    <div>
      <VendorPageHeader
        title="店舗設定"
        breadcrumbs={[{ label: "店舗設定" }]}
      />

      <div className="bg-white border border-gray-200 p-[16px] mb-[16px]">
        <div className="flex items-center gap-[8px]">
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            className="border border-gray-200 px-[12px] py-[8px] text-sm focus:border-accent focus:outline-none w-[300px]"
            placeholder="店舗名・住所で検索"
          />
          <button className="flex items-center gap-[6px] bg-accent text-white px-[16px] py-[8px] text-sm hover:bg-accent/90">
            <Search className="w-[14px] h-[14px]" />
            検索
          </button>
        </div>
      </div>

      <VendorDataTable columns={columns} data={mockShops} pageSize={20} />
    </div>
  );
}

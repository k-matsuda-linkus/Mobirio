"use client";

import { useState, useEffect } from "react";
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
  const [shops, setShops] = useState<ShopRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/vendor/shop")
      .then((res) => (res.ok ? res.json() : Promise.reject("API error")))
      .then((json) => {
        const d = json.data;
        if (Array.isArray(d)) {
          setShops(d.map((v: Record<string, unknown>, i: number) => ({
            id: (v.id as string) ?? String(i + 1),
            corpCode: (v.business_id as string) ?? "",
            branchNo: String(i + 1).padStart(2, "0"),
            shopName: (v.name as string) ?? "",
            prefecture: (v.prefecture as string) ?? "",
            address: (v.address as string) ?? "",
            bikeCount: 0,
          })));
        } else if (d) {
          setShops([{
            id: (d.id as string) ?? "1",
            corpCode: (d.business_id as string) ?? "",
            branchNo: "01",
            shopName: (d.name as string) ?? "",
            prefecture: (d.prefecture as string) ?? "",
            address: (d.address as string) ?? "",
            bikeCount: 0,
          }]);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-[24px]">読み込み中...</div>;

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

      <VendorDataTable columns={columns} data={shops} pageSize={20} />
    </div>
  );
}

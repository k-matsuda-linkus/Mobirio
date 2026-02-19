"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Download, Plus, Search, ExternalLink } from "lucide-react";
import { VendorPageHeader } from "@/components/vendor/VendorPageHeader";
import { VendorSearchBar } from "@/components/vendor/VendorSearchBar";
import { VendorDataTable, VendorColumn } from "@/components/vendor/VendorDataTable";

interface Announcement {
  id: string;
  type: string;
  title: string;
  store: string;
  publishStart: string;
  publishEnd: string;
  updatedAt: string;
}

const MOCK_ANNOUNCEMENTS: Announcement[] = [
  {
    id: "ann-001",
    type: "店舗からのお知らせ",
    title: "年末年始の営業時間変更のお知らせ",
    store: "宮崎橘通り店",
    publishStart: "2025/12/20",
    publishEnd: "2026/01/10",
    updatedAt: "2025/12/15 10:30",
  },
  {
    id: "ann-002",
    type: "キャンペーン",
    title: "春のツーリングキャンペーン 全車種10%OFF",
    store: "全店舗",
    publishStart: "2026/03/01",
    publishEnd: "2026/04/30",
    updatedAt: "2026/02/10 14:20",
  },
  {
    id: "ann-003",
    type: "メンテナンス",
    title: "システムメンテナンスのお知らせ（2/20深夜）",
    store: "全店舗",
    publishStart: "2026/02/15",
    publishEnd: "2026/02/21",
    updatedAt: "2026/02/12 09:00",
  },
  {
    id: "ann-004",
    type: "店舗からのお知らせ",
    title: "新車両入荷のお知らせ - Ninja 400 / CBR250RR",
    store: "宮崎空港店",
    publishStart: "2026/02/01",
    publishEnd: "2026/03/31",
    updatedAt: "2026/01/28 16:45",
  },
  {
    id: "ann-005",
    type: "キャンペーン",
    title: "初回利用者限定クーポン配布中",
    store: "宮崎橘通り店",
    publishStart: "2026/01/15",
    publishEnd: "2026/06/30",
    updatedAt: "2026/01/10 11:00",
  },
];

export default function VendorAnnouncementsPage() {
  const router = useRouter();
  const [keyword, setKeyword] = useState("");
  const [searchType, setSearchType] = useState("");
  const [searchStore, setSearchStore] = useState("");

  const columns: VendorColumn<Announcement>[] = [
    {
      key: "type",
      label: "お知らせ種別",
      sortable: true,
      render: (item) => (
        <span className="inline-block text-xs px-[8px] py-[2px] bg-gray-100 text-gray-700 whitespace-nowrap">
          {item.type}
        </span>
      ),
    },
    {
      key: "title",
      label: "タイトル",
      sortable: true,
      render: (item) => (
        <Link
          href={`/vendor/announcements/${item.id}`}
          className="text-accent hover:underline text-sm"
        >
          {item.title}
        </Link>
      ),
    },
    {
      key: "store",
      label: "店舗",
      sortable: true,
    },
    {
      key: "publishStart",
      label: "公開開始日",
      sortable: true,
    },
    {
      key: "publishEnd",
      label: "公開終了日",
      sortable: true,
    },
    {
      key: "updatedAt",
      label: "更新日時",
      sortable: true,
    },
    {
      key: "detail",
      label: "",
      render: (item) => (
        <Link
          href={`/vendor/announcements/${item.id}`}
          className="inline-flex items-center gap-[4px] text-xs text-accent hover:underline whitespace-nowrap"
        >
          詳細 <ExternalLink className="w-[12px] h-[12px]" />
        </Link>
      ),
    },
  ];

  const inputClass =
    "border border-gray-300 px-[10px] py-[6px] text-sm w-full focus:outline-none focus:border-accent";

  return (
    <div>
      <VendorPageHeader
        title="お知らせ一覧"
        breadcrumbs={[{ label: "お知らせ一覧" }]}
        actions={
          <>
            <button className="flex items-center gap-[6px] border border-gray-300 bg-white px-[14px] py-[8px] text-sm text-gray-700 hover:bg-gray-50">
              <Search className="w-[14px] h-[14px]" />
              検索
            </button>
            <Link
              href="/vendor/announcements/new"
              className="flex items-center gap-[6px] bg-accent text-white px-[14px] py-[8px] text-sm hover:bg-accent/90"
            >
              <Plus className="w-[14px] h-[14px]" />
              新規
            </Link>
            <button className="flex items-center gap-[6px] border border-gray-300 bg-white px-[14px] py-[8px] text-sm text-gray-700 hover:bg-gray-50">
              <Download className="w-[14px] h-[14px]" />
              CSV出力
            </button>
          </>
        }
      />

      <VendorSearchBar
        defaultOpen={false}
        onSearch={() => {}}
        onReset={() => {
          setKeyword("");
          setSearchType("");
          setSearchStore("");
        }}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[12px]">
          <div>
            <label className="block text-xs text-gray-500 mb-[4px]">キーワード</label>
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="タイトル・内容で検索"
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-[4px]">お知らせ種別</label>
            <select
              value={searchType}
              onChange={(e) => setSearchType(e.target.value)}
              className={inputClass}
            >
              <option value="">すべて</option>
              <option value="店舗からのお知らせ">店舗からのお知らせ</option>
              <option value="キャンペーン">キャンペーン</option>
              <option value="メンテナンス">メンテナンス</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-[4px]">店舗</label>
            <select
              value={searchStore}
              onChange={(e) => setSearchStore(e.target.value)}
              className={inputClass}
            >
              <option value="">すべて</option>
              <option value="宮崎橘通り店">宮崎橘通り店</option>
              <option value="宮崎空港店">宮崎空港店</option>
              <option value="全店舗">全店舗</option>
            </select>
          </div>
        </div>
      </VendorSearchBar>

      <VendorDataTable<Announcement>
        columns={columns}
        data={MOCK_ANNOUNCEMENTS}
        pageSize={10}
        getId={(item) => item.id}
        onRowClick={(item) => router.push(`/vendor/announcements/${item.id}`)}
      />
    </div>
  );
}

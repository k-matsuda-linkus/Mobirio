"use client";

import { useState, useEffect } from "react";
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


export default function VendorAnnouncementsPage() {
  const router = useRouter();
  const [keyword, setKeyword] = useState("");
  const [searchType, setSearchType] = useState("");
  const [searchStore, setSearchStore] = useState("");
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/vendor/announcements")
      .then((res) => (res.ok ? res.json() : Promise.reject("API error")))
      .then((json) => {
        setAnnouncements(
          (json.data || []).map((a: Record<string, unknown>) => ({
            id: a.id,
            type: (a.announcement_type as string) ?? "店舗からのお知らせ",
            title: a.title ?? "",
            store: "全店舗",
            publishStart: typeof a.published_from === "string" ? a.published_from.slice(0, 10) : "",
            publishEnd: typeof a.published_until === "string" ? a.published_until.slice(0, 10) : "",
            updatedAt: typeof a.updated_at === "string" ? a.updated_at.slice(0, 16).replace("T", " ") : "",
          }))
        );
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

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

  if (loading) return <div className="p-[24px]">読み込み中...</div>;

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
        data={announcements}
        pageSize={10}
        getId={(item) => item.id}
        onRowClick={(item) => router.push(`/vendor/announcements/${item.id}`)}
      />
    </div>
  );
}

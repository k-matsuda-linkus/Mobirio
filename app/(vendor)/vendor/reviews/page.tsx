"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Download, Star } from "lucide-react";
import { VendorPageHeader } from "@/components/vendor/VendorPageHeader";
import { VendorSearchBar } from "@/components/vendor/VendorSearchBar";
import { VendorDataTable, type VendorColumn } from "@/components/vendor/VendorDataTable";
import { StatusBadge } from "@/components/vendor/StatusBadge";
import { EmptyState } from "@/components/vendor/EmptyState";

interface ReviewRow {
  id: string;
  storeName: string;
  postedAt: string;
  reviewContent: string;
  repliedAt: string;
  replyContent: string;
  publishStatus: string;
}


const columns: VendorColumn<ReviewRow>[] = [
  {
    key: "storeName",
    label: "店舗名",
    sortable: true,
  },
  {
    key: "postedAt",
    label: "投稿日時",
    sortable: true,
    render: (item) => <span className="text-xs text-gray-500">{item.postedAt}</span>,
  },
  {
    key: "reviewContent",
    label: "クチコミ内容",
    render: (item) => (
      <span className="text-gray-600" title={item.reviewContent}>
        {item.reviewContent.length > 30
          ? item.reviewContent.slice(0, 30) + "..."
          : item.reviewContent}
      </span>
    ),
  },
  {
    key: "repliedAt",
    label: "返信日時",
    sortable: true,
    render: (item) => (
      <span className="text-xs text-gray-500">
        {item.repliedAt || "-"}
      </span>
    ),
  },
  {
    key: "replyContent",
    label: "返信内容",
    render: (item) => (
      <span className="text-gray-600" title={item.replyContent}>
        {item.replyContent
          ? item.replyContent.length > 30
            ? item.replyContent.slice(0, 30) + "..."
            : item.replyContent
          : "-"}
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
        href={`/vendor/reviews/${item.id}`}
        className="text-xs border border-gray-300 px-[12px] py-[4px] hover:bg-gray-50 whitespace-nowrap"
      >
        詳細
      </Link>
    ),
  },
];

export default function VendorReviewsListPage() {
  const [searchStore, setSearchStore] = useState("");
  const [searchStatus, setSearchStatus] = useState("");
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/vendor/shop-reviews").then((res) => (res.ok ? res.json() : Promise.reject("API error"))),
      fetch("/api/vendor/shop").then((res) => (res.ok ? res.json() : null)),
    ])
      .then(([reviewsJson, shopJson]) => {
        const vendorName = shopJson?.data?.name || "";
        setReviews(
          (reviewsJson.data || []).map((r: Record<string, unknown>) => ({
            id: r.id,
            storeName: vendorName,
            postedAt: typeof r.posted_at === "string" ? r.posted_at.slice(0, 16).replace("T", " ") : "",
            reviewContent: (r.content as string) ?? "",
            repliedAt: typeof r.reply_at === "string" ? r.reply_at.slice(0, 16).replace("T", " ") : "",
            replyContent: (r.reply as string) ?? "",
            publishStatus: r.is_published ? "published" : "unpublished",
          }))
        );
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-[24px]">読み込み中...</div>;

  return (
    <div>
      <VendorPageHeader
        title="店舗クチコミ一覧"
        breadcrumbs={[{ label: "店舗クチコミ一覧" }]}
        actions={
          <button className="flex items-center gap-[6px] border border-gray-300 px-[12px] py-[8px] text-sm hover:bg-gray-50">
            <Download className="w-[14px] h-[14px]" />
            CSV出力
          </button>
        }
      />

      <VendorSearchBar defaultOpen={false}>
        <div className="grid grid-cols-3 gap-[12px]">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-[4px]">店舗名</label>
            <select
              value={searchStore}
              onChange={(e) => setSearchStore(e.target.value)}
              className="w-full border border-gray-200 px-[10px] py-[8px] text-sm focus:border-accent focus:outline-none"
            >
              <option value="">全て</option>
              <option value="宮崎本店">宮崎本店</option>
              <option value="鹿児島支店">鹿児島支店</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-[4px]">公開状況</label>
            <select
              value={searchStatus}
              onChange={(e) => setSearchStatus(e.target.value)}
              className="w-full border border-gray-200 px-[10px] py-[8px] text-sm focus:border-accent focus:outline-none"
            >
              <option value="">全て</option>
              <option value="published">公開中</option>
              <option value="unpublished">非公開</option>
            </select>
          </div>
        </div>
      </VendorSearchBar>

      {reviews.length === 0 ? (
        <EmptyState
          icon={Star}
          title="クチコミがありません"
          description="お客様からのクチコミが投稿されると、ここに表示されます。"
        />
      ) : (
        <VendorDataTable columns={columns} data={reviews} pageSize={20} />
      )}
    </div>
  );
}

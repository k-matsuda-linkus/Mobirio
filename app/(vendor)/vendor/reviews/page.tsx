"use client";

import { useState } from "react";
import Link from "next/link";
import { Download } from "lucide-react";
import { VendorPageHeader } from "@/components/vendor/VendorPageHeader";
import { VendorSearchBar } from "@/components/vendor/VendorSearchBar";
import { VendorDataTable, type VendorColumn } from "@/components/vendor/VendorDataTable";
import { StatusBadge } from "@/components/vendor/StatusBadge";

interface ReviewRow {
  id: string;
  storeName: string;
  postedAt: string;
  reviewContent: string;
  repliedAt: string;
  replyContent: string;
  publishStatus: string;
}

const mockReviews: ReviewRow[] = [
  {
    id: "1",
    storeName: "宮崎本店",
    postedAt: "2026-02-10 14:30",
    reviewContent: "CB400SFをレンタルしました。メンテナンスが行き届いていて、とても快適なツーリングができました。スタッフの方も親切に対応してくださり、次回もぜひ利用したいと思います。",
    repliedAt: "2026-02-11 09:00",
    replyContent: "この度はご利用いただきありがとうございます。快適にご利用いただけたとのこと、大変嬉しく思います。またのお越しをお待ちしております。",
    publishStatus: "published",
  },
  {
    id: "2",
    storeName: "宮崎本店",
    postedAt: "2026-02-08 10:15",
    reviewContent: "初めてのバイクレンタルでしたが、丁寧な説明で安心できました。PCX160は燃費も良く、街乗りには最高です。",
    repliedAt: "",
    replyContent: "",
    publishStatus: "published",
  },
  {
    id: "3",
    storeName: "鹿児島支店",
    postedAt: "2026-02-05 16:45",
    reviewContent: "MT-09のパワフルな走りを堪能しました。桜島を一周するルートがおすすめです。ただ、返却時の説明がやや分かりにくかったです。",
    repliedAt: "2026-02-06 11:30",
    replyContent: "ご利用ありがとうございます。返却時の説明について、ご不便をおかけし申し訳ございません。改善に努めてまいります。",
    publishStatus: "published",
  },
  {
    id: "4",
    storeName: "鹿児島支店",
    postedAt: "2026-01-28 09:00",
    reviewContent: "Ninja400でツーリングしました。バイクの状態は良好でしたが、ヘルメットのサイズが少し合わなかったので星マイナス1です。",
    repliedAt: "",
    replyContent: "",
    publishStatus: "unpublished",
  },
  {
    id: "5",
    storeName: "宮崎本店",
    postedAt: "2026-01-20 13:20",
    reviewContent: "GB350Sでのんびりツーリングを楽しめました。レトロなデザインが気に入って、購入も検討中です。料金もリーズナブルで大満足です。",
    repliedAt: "2026-01-21 10:00",
    replyContent: "ご利用ありがとうございます！GB350Sは当店でも人気の車種です。ご購入をご検討とのこと、嬉しい限りです。",
    publishStatus: "published",
  },
];

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

      <VendorDataTable columns={columns} data={mockReviews} pageSize={20} />
    </div>
  );
}

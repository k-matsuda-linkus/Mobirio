"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Download, ExternalLink } from "lucide-react";
import { VendorPageHeader } from "@/components/vendor/VendorPageHeader";
import { VendorSearchBar } from "@/components/vendor/VendorSearchBar";
import { VendorDataTable, VendorColumn } from "@/components/vendor/VendorDataTable";
import { StatusBadge } from "@/components/vendor/StatusBadge";

interface Inquiry {
  id: string;
  inquiryAt: string;
  content: string;
  latestReply: string;
  status: string;
  reservationNo: string;
  customerName: string;
  storeName: string;
  vehicleName: string;
  departureAt: string;
  returnAt: string;
}

const MOCK_INQUIRIES: Inquiry[] = [
  {
    id: "inq-001",
    inquiryAt: "2025/07/10 14:20",
    content: "ヘルメットのサイズについて確認したいのですが、Lサイズはどのくらいの頭囲に対応していますか？",
    latestReply: "Lサイズは頭囲57-59cmに対応しています。ご不明点がございましたら...",
    status: "resolved",
    reservationNo: "R-20250701-001",
    customerName: "田中 太郎",
    storeName: "宮崎橘通り店",
    vehicleName: "PCX160",
    departureAt: "2025/07/14 10:00",
    returnAt: "2025/07/16 10:00",
  },
  {
    id: "inq-002",
    inquiryAt: "2025/07/11 09:30",
    content: "出発時間を30分早められますか？フライトの関係で早めに出発したいです。",
    latestReply: "",
    status: "pending",
    reservationNo: "R-20250702-003",
    customerName: "山田 花子",
    storeName: "宮崎空港店",
    vehicleName: "ADV150",
    departureAt: "2025/07/15 11:00",
    returnAt: "2025/07/17 17:00",
  },
  {
    id: "inq-003",
    inquiryAt: "2025/07/12 16:45",
    content: "ETCカードの利用料金について教えてください。また、高速道路の通行料は別途精算になりますか？",
    latestReply: "ETCカードのレンタル料は1日200円です。高速道路の通行料は...",
    status: "responding",
    reservationNo: "R-20250703-007",
    customerName: "佐藤 一郎",
    storeName: "宮崎橘通り店",
    vehicleName: "CB250R",
    departureAt: "2025/07/16 09:00",
    returnAt: "2025/07/18 09:00",
  },
  {
    id: "inq-004",
    inquiryAt: "2025/07/13 10:15",
    content: "返却場所を宮崎空港店に変更することは可能ですか？乗り捨てサービスはありますか？",
    latestReply: "",
    status: "pending",
    reservationNo: "R-20250704-002",
    customerName: "鈴木 次郎",
    storeName: "宮崎空港店",
    vehicleName: "Rebel 250",
    departureAt: "2025/07/17 10:00",
    returnAt: "2025/07/19 10:00",
  },
  {
    id: "inq-005",
    inquiryAt: "2025/07/13 18:00",
    content: "免責補償に加入した場合、補償の範囲を教えてください。自損事故も補償対象ですか？",
    latestReply: "免責補償にご加入いただくと、事故時の自己負担額が免除されます。自損事故も対象です。",
    status: "resolved",
    reservationNo: "R-20250705-011",
    customerName: "高橋 美咲",
    storeName: "宮崎橘通り店",
    vehicleName: "NMAX155",
    departureAt: "2025/07/18 13:00",
    returnAt: "2025/07/20 13:00",
  },
];

export default function VendorInquiriesPage() {
  const router = useRouter();
  const [searchContent, setSearchContent] = useState("");
  const [searchStatus, setSearchStatus] = useState("");

  const columns: VendorColumn<Inquiry>[] = [
    {
      key: "inquiryAt",
      label: "お問い合わせ日時",
      sortable: true,
      render: (item) => (
        <span className="text-sm whitespace-nowrap">{item.inquiryAt}</span>
      ),
    },
    {
      key: "content",
      label: "お問い合わせ内容",
      render: (item) => (
        <p className="text-sm text-gray-700 max-w-[200px] truncate" title={item.content}>
          {item.content}
        </p>
      ),
    },
    {
      key: "latestReply",
      label: "回答（最終）",
      render: (item) => (
        <p className="text-sm text-gray-500 max-w-[200px] truncate" title={item.latestReply}>
          {item.latestReply || <span className="text-gray-300">未回答</span>}
        </p>
      ),
    },
    {
      key: "status",
      label: "状態",
      render: (item) => <StatusBadge status={item.status} />,
    },
    {
      key: "reservationNo",
      label: "予約番号",
      render: (item) => (
        <Link
          href={`/vendor/reservations/${item.id}`}
          className="text-accent hover:underline font-mono text-xs"
        >
          {item.reservationNo}
        </Link>
      ),
    },
    {
      key: "customerName",
      label: "予約者氏名",
      render: (item) => <span className="text-sm">{item.customerName}</span>,
    },
    {
      key: "vehicleName",
      label: "店舗 / 予約車両",
      render: (item) => (
        <div>
          <p className="text-xs text-gray-400">{item.storeName}</p>
          <p className="text-sm">{item.vehicleName}</p>
        </div>
      ),
    },
    {
      key: "departureAt",
      label: "出発日時 / 返却日時",
      render: (item) => (
        <div className="whitespace-nowrap">
          <p className="text-sm">{item.departureAt}</p>
          <p className="text-xs text-gray-400">{item.returnAt}</p>
        </div>
      ),
    },
    {
      key: "detail",
      label: "",
      render: (item) => (
        <Link
          href={`/vendor/inquiries/${item.id}`}
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
        title="お問い合わせ一覧"
        breadcrumbs={[{ label: "お問い合わせ一覧" }]}
        actions={
          <button className="flex items-center gap-[6px] border border-gray-300 bg-white px-[14px] py-[8px] text-sm text-gray-700 hover:bg-gray-50">
            <Download className="w-[14px] h-[14px]" />
            CSV出力
          </button>
        }
      />

      <VendorSearchBar
        defaultOpen={false}
        onSearch={() => {}}
        onReset={() => {
          setSearchContent("");
          setSearchStatus("");
        }}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[12px]">
          <div>
            <label className="block text-xs text-gray-500 mb-[4px]">お問い合わせ内容</label>
            <input
              type="text"
              value={searchContent}
              onChange={(e) => setSearchContent(e.target.value)}
              placeholder="キーワードを入力"
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-[4px]">状態</label>
            <select
              value={searchStatus}
              onChange={(e) => setSearchStatus(e.target.value)}
              className={inputClass}
            >
              <option value="">すべて</option>
              <option value="pending">未対応</option>
              <option value="responding">対応中</option>
              <option value="resolved">完了</option>
            </select>
          </div>
        </div>
      </VendorSearchBar>

      <VendorDataTable<Inquiry>
        columns={columns}
        data={MOCK_INQUIRIES}
        pageSize={20}
        getId={(item) => item.id}
        onRowClick={(item) => router.push(`/vendor/inquiries/${item.id}`)}
      />
    </div>
  );
}

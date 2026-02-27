"use client";

import { useState, useEffect } from "react";
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


export default function VendorInquiriesPage() {
  const router = useRouter();
  const [searchContent, setSearchContent] = useState("");
  const [searchStatus, setSearchStatus] = useState("");
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/vendor/inquiries")
      .then((res) => (res.ok ? res.json() : Promise.reject("API error")))
      .then((json) => {
        setInquiries(
          (json.data || []).map((i: Record<string, unknown>) => ({
            id: i.id,
            inquiryAt: typeof i.created_at === "string" ? i.created_at.slice(0, 16).replace("T", " ").replace(/-/g, "/") : "",
            content: (i.content as string) ?? "",
            latestReply: (i.reply as string) ?? "",
            status: (i.status as string) ?? "pending",
            reservationNo: (i.reservation_id as string) ?? "",
            customerName: "",
            storeName: "",
            vehicleName: "",
            departureAt: "",
            returnAt: "",
          }))
        );
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

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

  if (loading) return <div className="p-[24px]">読み込み中...</div>;

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
        data={inquiries}
        pageSize={20}
        getId={(item) => item.id}
        onRowClick={(item) => router.push(`/vendor/inquiries/${item.id}`)}
      />
    </div>
  );
}

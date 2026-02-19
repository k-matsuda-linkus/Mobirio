"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { VendorPageHeader } from "@/components/vendor/VendorPageHeader";
import { StatusBadge } from "@/components/vendor/StatusBadge";

const MOCK_INQUIRY = {
  id: "inq-002",
  inquiryAt: "2025/07/11 09:30",
  customerName: "山田 花子",
  memberNo: "M-10567",
  content:
    "出発時間を30分早められますか？フライトの関係で早めに出発したいです。10:30には空港に到着予定ですので、その時間に合わせていただけると助かります。",
  status: "pending",
  reservationNo: "R-20250702-003",
  storeName: "宮崎空港店",
  vehicleName: "ADV150",
  departureAt: "2025/07/15 11:00",
  returnAt: "2025/07/17 17:00",
  replies: [
    {
      id: "rep-001",
      datetime: "2025/07/11 10:15",
      author: "宮崎空港店",
      isStaff: true,
      content: "お問い合わせありがとうございます。確認いたしますので少々お待ちください。",
    },
  ],
};

const STATUS_OPTIONS = [
  { value: "pending", label: "未対応" },
  { value: "responding", label: "対応中" },
  { value: "resolved", label: "完了" },
];

export default function VendorInquiryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const inquiryId = params.id as string;

  const [status, setStatus] = useState(MOCK_INQUIRY.status);
  const [replyText, setReplyText] = useState("");

  const inputClass =
    "border border-gray-300 px-[10px] py-[6px] text-sm w-full focus:outline-none focus:border-accent";

  return (
    <div>
      <VendorPageHeader
        title="お問い合わせ詳細"
        breadcrumbs={[
          { label: "お問い合わせ一覧", href: "/vendor/inquiries" },
          { label: `INQ-${inquiryId}` },
        ]}
        actions={
          <button
            onClick={() => router.back()}
            className="flex items-center gap-[6px] border border-gray-300 bg-white px-[14px] py-[8px] text-sm text-gray-700 hover:bg-gray-50"
          >
            <ArrowLeft className="w-[14px] h-[14px]" />
            戻る
          </button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-[20px]">
        {/* Main content - left 2 columns */}
        <div className="lg:col-span-2 space-y-[20px]">
          {/* Inquiry Content */}
          <div className="bg-white border border-gray-200 p-[20px]">
            <div className="flex items-center justify-between mb-[16px]">
              <h2 className="font-serif text-lg font-light">お問い合わせ内容</h2>
              <StatusBadge status={MOCK_INQUIRY.status} />
            </div>
            <div className="space-y-[10px] mb-[16px]">
              <div className="flex items-center gap-[16px] text-sm">
                <span className="text-gray-400 w-[120px] shrink-0">お問い合わせ日時</span>
                <span>{MOCK_INQUIRY.inquiryAt}</span>
              </div>
              <div className="flex items-center gap-[16px] text-sm">
                <span className="text-gray-400 w-[120px] shrink-0">お問い合わせ者</span>
                <span>{MOCK_INQUIRY.customerName}（{MOCK_INQUIRY.memberNo}）</span>
              </div>
            </div>
            <div className="bg-gray-50 border border-gray-200 p-[16px]">
              <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                {MOCK_INQUIRY.content}
              </p>
            </div>
          </div>

          {/* Replies / Conversation */}
          <div className="bg-white border border-gray-200 p-[20px]">
            <h2 className="font-serif text-lg font-light mb-[16px]">やり取り</h2>
            <div className="space-y-[16px] mb-[20px]">
              {/* Original inquiry */}
              <div className="border-l-4 border-gray-300 pl-[12px]">
                <div className="flex items-center gap-[8px] mb-[6px]">
                  <span className="text-sm font-medium">{MOCK_INQUIRY.customerName}</span>
                  <span className="text-xs text-gray-400">{MOCK_INQUIRY.inquiryAt}</span>
                </div>
                <p className="text-sm text-gray-700">{MOCK_INQUIRY.content}</p>
              </div>

              {/* Replies */}
              {MOCK_INQUIRY.replies.map((reply) => (
                <div
                  key={reply.id}
                  className={
                    "pl-[12px] " +
                    (reply.isStaff
                      ? "border-l-4 border-accent"
                      : "border-l-4 border-gray-300")
                  }
                >
                  <div className="flex items-center gap-[8px] mb-[6px]">
                    <span className="text-sm font-medium">
                      {reply.author}
                      {reply.isStaff && (
                        <span className="ml-[6px] text-xs bg-accent/10 text-accent px-[6px] py-[1px]">スタッフ</span>
                      )}
                    </span>
                    <span className="text-xs text-gray-400">{reply.datetime}</span>
                  </div>
                  <p className="text-sm text-gray-700">{reply.content}</p>
                </div>
              ))}
            </div>

            {/* Reply form */}
            <div className="border-t border-gray-200 pt-[16px]">
              <label className="block text-xs text-gray-500 mb-[6px]">回答を入力</label>
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                rows={4}
                placeholder="回答を入力してください..."
                className="border border-gray-300 px-[10px] py-[8px] text-sm w-full focus:outline-none focus:border-accent resize-y"
              />
            </div>
          </div>

          {/* Status change */}
          <div className="bg-white border border-gray-200 p-[20px]">
            <h2 className="font-serif text-lg font-light mb-[16px]">対応状態</h2>
            <div className="flex items-center gap-[12px]">
              <label className="text-xs text-gray-500 shrink-0">状態</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className={inputClass + " max-w-[200px]"}
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.back()}
              className="border border-gray-300 text-gray-700 px-[20px] py-[10px] text-sm hover:bg-gray-50"
            >
              戻る
            </button>
            <button className="bg-accent text-white px-[24px] py-[10px] text-sm hover:bg-accent-dark">
              登録
            </button>
          </div>
        </div>

        {/* Right sidebar - related reservation info */}
        <div className="space-y-[20px]">
          <div className="bg-white border border-gray-200 p-[20px]">
            <h3 className="font-serif text-sm font-light text-gray-500 mb-[12px]">関連予約情報</h3>
            <div className="space-y-[10px]">
              <div>
                <span className="block text-xs text-gray-400 mb-[2px]">予約番号</span>
                <Link
                  href={`/vendor/reservations/res-002`}
                  className="text-accent hover:underline font-mono text-sm"
                >
                  {MOCK_INQUIRY.reservationNo}
                </Link>
              </div>
              <div>
                <span className="block text-xs text-gray-400 mb-[2px]">予約者氏名</span>
                <p className="text-sm">{MOCK_INQUIRY.customerName}</p>
              </div>
              <div>
                <span className="block text-xs text-gray-400 mb-[2px]">会員番号</span>
                <p className="text-sm font-mono">{MOCK_INQUIRY.memberNo}</p>
              </div>
              <div>
                <span className="block text-xs text-gray-400 mb-[2px]">店舗</span>
                <p className="text-sm">{MOCK_INQUIRY.storeName}</p>
              </div>
              <div>
                <span className="block text-xs text-gray-400 mb-[2px]">予約車両</span>
                <p className="text-sm">{MOCK_INQUIRY.vehicleName}</p>
              </div>
              <div>
                <span className="block text-xs text-gray-400 mb-[2px]">出発日時</span>
                <p className="text-sm">{MOCK_INQUIRY.departureAt}</p>
              </div>
              <div>
                <span className="block text-xs text-gray-400 mb-[2px]">返却日時</span>
                <p className="text-sm">{MOCK_INQUIRY.returnAt}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

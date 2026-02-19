"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Calendar, X } from "lucide-react";
import { StoreSelector } from "@/components/vendor/StoreSelector";

const MOCK_STORES = [
  { id: "s1", name: "宮崎橘通り店" },
  { id: "s2", name: "宮崎空港店" },
];

const MOCK_DEPARTURES = [
  {
    id: "d1",
    vehicle: "PCX160",
    period: "2025/07/14 10:00 ~ 2025/07/16 10:00",
    reservationNo: "R-20250701-001",
    customerName: "田中 太郎",
  },
  {
    id: "d2",
    vehicle: "ADV150",
    period: "2025/07/14 11:00 ~ 2025/07/15 17:00",
    reservationNo: "R-20250703-005",
    customerName: "山田 花子",
  },
  {
    id: "d3",
    vehicle: "CB250R",
    period: "2025/07/14 13:00 ~ 2025/07/17 13:00",
    reservationNo: "R-20250705-012",
    customerName: "佐藤 一郎",
  },
];

const MOCK_NOTICES = [
  { id: "n1", date: "2025/07/10", title: "夏季キャンペーンのご案内" },
  { id: "n2", date: "2025/07/08", title: "システムメンテナンスのお知らせ（7/20）" },
];

export default function VendorDashboardPage() {
  const [selectedStore, setSelectedStore] = useState("s1");

  return (
    <div>
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-[12px] mb-[24px]">
        <StoreSelector
          stores={MOCK_STORES}
          selectedId={selectedStore}
          onChange={setSelectedStore}
        />
        <div className="flex items-center gap-[8px] flex-wrap">
          <Link
            href="/vendor/calendar"
            className="flex items-center gap-[6px] border border-gray-300 bg-white px-[14px] py-[8px] text-sm text-gray-700 hover:bg-gray-50"
          >
            <Calendar className="w-[14px] h-[14px]" />
            車両予約状況
          </Link>
          <Link
            href="/vendor/reservations"
            className="flex items-center gap-[6px] bg-accent text-white px-[14px] py-[8px] text-sm hover:bg-accent-dark"
          >
            <Plus className="w-[14px] h-[14px]" />
            レンタル予約登録
          </Link>
          <Link
            href="/vendor/shop/closures"
            className="flex items-center gap-[6px] border border-gray-300 bg-white px-[14px] py-[8px] text-sm text-gray-700 hover:bg-gray-50"
          >
            <X className="w-[14px] h-[14px]" />
            臨時休業・休業日登録
          </Link>
        </div>
      </div>

      {/* Stats Section */}
      <div className="mb-[24px]">
        <h2 className="font-serif text-lg font-light mb-[12px]">当月売上状況</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-[16px]">
          <div className="bg-white border border-gray-200 p-[20px]">
            <p className="text-xs text-gray-400 mb-[4px]">レンタル件数</p>
            <p className="text-3xl font-medium">
              23<span className="text-base font-normal text-gray-500 ml-[4px]">件</span>
            </p>
          </div>
          <div className="bg-white border border-gray-200 p-[20px]">
            <p className="text-xs text-gray-400 mb-[4px]">レンタル売上金額</p>
            <p className="text-3xl font-medium">
              &yen;345,000
            </p>
          </div>
        </div>
      </div>

      {/* Today Departures */}
      <div className="bg-white border border-gray-200 mb-[24px]">
        <div className="px-[20px] py-[14px] border-b border-gray-200">
          <h2 className="font-serif text-lg font-light">本日出発予定</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-xs text-gray-500">
                <th className="px-[16px] py-[10px] text-left">車両</th>
                <th className="px-[16px] py-[10px] text-left">レンタル期間</th>
                <th className="px-[16px] py-[10px] text-left">予約番号</th>
                <th className="px-[16px] py-[10px] text-left">予約者</th>
              </tr>
            </thead>
            <tbody>
              {MOCK_DEPARTURES.map((dep) => (
                <tr key={dep.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-[16px] py-[12px] font-medium">{dep.vehicle}</td>
                  <td className="px-[16px] py-[12px] text-gray-600 whitespace-nowrap">{dep.period}</td>
                  <td className="px-[16px] py-[12px]">
                    <Link href={`/vendor/reservations/${dep.id}`} className="text-accent hover:underline font-mono text-xs">
                      {dep.reservationNo}
                    </Link>
                  </td>
                  <td className="px-[16px] py-[12px]">{dep.customerName}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bottom 3-column section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-[16px]">
        {/* Unanswered Request Reservations */}
        <div className="bg-white border border-gray-200 p-[20px]">
          <h3 className="font-serif text-sm font-light text-gray-500 mb-[12px]">未回答リクエスト予約</h3>
          <p className="text-4xl font-medium text-orange-600">3<span className="text-sm font-normal text-gray-400 ml-[4px]">件</span></p>
          <Link
            href="/vendor/reservations?status=unconfirmed"
            className="inline-block mt-[12px] text-xs text-accent hover:underline"
          >
            一覧を表示 &rarr;
          </Link>
        </div>

        {/* Unanswered Inquiries */}
        <div className="bg-white border border-gray-200 p-[20px]">
          <h3 className="font-serif text-sm font-light text-gray-500 mb-[12px]">未回答お問い合わせ</h3>
          <p className="text-4xl font-medium text-orange-600">2<span className="text-sm font-normal text-gray-400 ml-[4px]">件</span></p>
          <Link
            href="/vendor/inquiries?status=pending"
            className="inline-block mt-[12px] text-xs text-accent hover:underline"
          >
            一覧を表示 &rarr;
          </Link>
        </div>

        {/* Notices from HQ */}
        <div className="bg-white border border-gray-200 p-[20px]">
          <h3 className="font-serif text-sm font-light text-gray-500 mb-[12px]">本部からのお知らせ</h3>
          <div className="space-y-[10px]">
            {MOCK_NOTICES.map((notice) => (
              <div key={notice.id} className="border-b border-gray-100 pb-[8px] last:border-0">
                <p className="text-xs text-gray-400">{notice.date}</p>
                <p className="text-sm text-gray-700">{notice.title}</p>
              </div>
            ))}
          </div>
          <Link
            href="/vendor/notifications"
            className="inline-block mt-[12px] text-xs text-accent hover:underline"
          >
            すべて表示 &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}

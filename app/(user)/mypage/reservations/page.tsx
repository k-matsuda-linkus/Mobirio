"use client";

import { useState } from "react";
import Link from "next/link";

const TABS = [
  { key: "all", label: "すべて" },
  { key: "pending", label: "承認待ち" },
  { key: "confirmed", label: "確定" },
  { key: "in_use", label: "利用中" },
  { key: "completed", label: "完了" },
  { key: "cancelled", label: "キャンセル" },
];

const STATUS_MAP: Record<string, { label: string; className: string }> = {
  pending: { label: "承認待ち", className: "bg-status-pending/10 text-status-pending" },
  confirmed: { label: "確定", className: "bg-status-confirmed/10 text-status-confirmed" },
  in_use: { label: "利用中", className: "bg-status-in-use/10 text-status-in-use" },
  completed: { label: "完了", className: "bg-status-completed/10 text-status-completed" },
  cancelled: { label: "キャンセル", className: "bg-status-cancelled/10 text-status-cancelled" },
};

const RESERVATIONS = [
  { id: "rsv-001", bike: "Honda PCX 160", vendor: "サンシャインモータース宮崎", startDate: "2025/02/15", endDate: "2025/02/16", amount: 6000, status: "confirmed" },
  { id: "rsv-002", bike: "Yamaha MT-25", vendor: "青島バイクレンタル", startDate: "2025/03/01", endDate: "2025/03/02", amount: 11200, status: "pending" },
  { id: "rsv-003", bike: "Kawasaki Ninja 400", vendor: "青島バイクレンタル", startDate: "2025/01/20", endDate: "2025/01/21", amount: 13200, status: "completed" },
  { id: "rsv-004", bike: "Suzuki Address 125", vendor: "サンシャインモータース宮崎", startDate: "2025/01/10", endDate: "2025/01/10", amount: 3500, status: "cancelled" },
  { id: "rsv-005", bike: "Honda CB400SF", vendor: "ライドパーク日南", startDate: "2025/02/10", endDate: "2025/02/11", amount: 18900, status: "in_use" },
];

export default function ReservationsPage() {
  const [activeTab, setActiveTab] = useState("all");

  const filtered = activeTab === "all"
    ? RESERVATIONS
    : RESERVATIONS.filter((r) => r.status === activeTab);

  return (
    <div>
      <h1 className="font-serif text-2xl font-light text-black mb-[24px]">予約一覧</h1>

      {/* Tabs */}
      <div className="flex gap-[4px] mb-[24px] overflow-x-auto pb-[4px]">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-[16px] py-[8px] text-sm font-sans whitespace-nowrap transition-colors ${
              activeTab === tab.key
                ? "bg-black text-white"
                : "bg-gray-50 text-gray-600 hover:bg-gray-100"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="text-center py-[60px] text-sm font-sans text-gray-400">
          該当する予約はありません
        </div>
      ) : (
        <div className="border border-gray-100 overflow-x-auto">
          <table className="w-full min-w-[640px]">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-[16px] py-[12px] text-xs font-sans font-medium text-gray-500">予約ID</th>
                <th className="text-left px-[16px] py-[12px] text-xs font-sans font-medium text-gray-500">バイク</th>
                <th className="text-left px-[16px] py-[12px] text-xs font-sans font-medium text-gray-500">期間</th>
                <th className="text-right px-[16px] py-[12px] text-xs font-sans font-medium text-gray-500">金額</th>
                <th className="text-center px-[16px] py-[12px] text-xs font-sans font-medium text-gray-500">ステータス</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => {
                const s = STATUS_MAP[r.status];
                return (
                  <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="px-[16px] py-[14px]">
                      <Link href={`/mypage/reservations/${r.id}`} className="text-sm font-sans text-accent hover:underline">
                        {r.id}
                      </Link>
                    </td>
                    <td className="px-[16px] py-[14px]">
                      <p className="text-sm font-sans text-black">{r.bike}</p>
                      <p className="text-xs font-sans text-gray-400">{r.vendor}</p>
                    </td>
                    <td className="px-[16px] py-[14px] text-sm font-sans text-gray-600">
                      {r.startDate} 〜 {r.endDate}
                    </td>
                    <td className="px-[16px] py-[14px] text-sm font-sans text-black text-right">
                      ¥{r.amount.toLocaleString()}
                    </td>
                    <td className="px-[16px] py-[14px] text-center">
                      <span className={`inline-block px-[10px] py-[3px] text-xs font-sans font-medium ${s.className}`}>
                        {s.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

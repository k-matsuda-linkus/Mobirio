"use client";

import { useState, useEffect } from "react";
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

interface ReservationItem {
  id: string;
  bikeName?: string;
  vendorName?: string;
  bike?: { name: string };
  vendor?: { name: string };
  start_datetime: string;
  end_datetime: string;
  total_amount: number;
  status: string;
}

export default function ReservationsPage() {
  const [activeTab, setActiveTab] = useState("all");
  const [reservations, setReservations] = useState<ReservationItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReservations = async () => {
      setLoading(true);
      try {
        const url = activeTab === "all"
          ? "/api/reservations"
          : `/api/reservations?status=${activeTab}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error("API error");
        const data = await res.json();
        setReservations(data.data || []);
      } catch (error) {
        console.error("Failed to fetch reservations:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchReservations();
  }, [activeTab]);

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
      {loading ? (
        <div className="space-y-[8px]">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-[60px] bg-gray-50 animate-pulse" />
          ))}
        </div>
      ) : reservations.length === 0 ? (
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
              {reservations.map((r) => {
                const s = STATUS_MAP[r.status] || { label: r.status, className: "bg-gray-100 text-gray-600" };
                const bikeName = r.bikeName || r.bike?.name || "";
                const vendorName = r.vendorName || r.vendor?.name || "";
                return (
                  <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="px-[16px] py-[14px]">
                      <Link href={`/mypage/reservations/${r.id}`} className="text-sm font-sans text-accent hover:underline">
                        {r.id}
                      </Link>
                    </td>
                    <td className="px-[16px] py-[14px]">
                      <p className="text-sm font-sans text-black">{bikeName}</p>
                      <p className="text-xs font-sans text-gray-400">{vendorName}</p>
                    </td>
                    <td className="px-[16px] py-[14px] text-sm font-sans text-gray-600">
                      {r.start_datetime} 〜 {r.end_datetime}
                    </td>
                    <td className="px-[16px] py-[14px] text-sm font-sans text-black text-right">
                      ¥{r.total_amount.toLocaleString()}
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

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface HistoryItem {
  id: string;
  bikeName?: string;
  vendorName?: string;
  bike?: { name: string };
  vendor?: { name: string };
  start_datetime: string;
  end_datetime: string;
  total_amount: number;
}

export default function HistoryPage() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await fetch("/api/reservations?status=completed");
        if (!res.ok) throw new Error("API error");
        const data = await res.json();
        setHistory(data.data || []);
      } catch (error) {
        console.error("Failed to fetch history:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  if (loading) {
    return (
      <div>
        <h1 className="font-serif text-2xl font-light text-black mb-[8px]">利用履歴</h1>
        <p className="text-sm font-sans text-gray-500 mb-[24px]">過去のレンタル履歴</p>
        <div className="space-y-[12px]">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-[80px] bg-gray-50 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-serif text-2xl font-light text-black mb-[8px]">利用履歴</h1>
      <p className="text-sm font-sans text-gray-500 mb-[24px]">過去のレンタル履歴</p>

      {history.length === 0 ? (
        <div className="text-center py-[80px]">
          <p className="text-sm font-sans text-gray-400">利用履歴はまだありません</p>
        </div>
      ) : (
        <div className="space-y-[12px]">
          {history.map((h) => {
            const bikeName = h.bikeName || h.bike?.name || "";
            const vendorName = h.vendorName || h.vendor?.name || "";
            return (
              <div key={h.id} className="bg-white border border-gray-100 p-[20px] hover:border-gray-200 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-[12px]">
                  <div className="flex-1">
                    <div className="flex items-center gap-[12px] mb-[6px]">
                      <p className="text-sm font-sans font-medium text-black">{bikeName}</p>
                    </div>
                    <p className="text-xs font-sans text-gray-500">{vendorName}</p>
                    <p className="text-xs font-sans text-gray-400 mt-[4px]">
                      {h.start_datetime} 〜 {h.end_datetime}
                    </p>
                  </div>
                  <div className="flex items-center gap-[16px]">
                    <p className="text-sm font-sans font-medium text-black">¥{h.total_amount.toLocaleString()}</p>
                    <Link
                      href={`/mypage/reservations/${h.id}`}
                      className="px-[12px] py-[6px] text-xs font-sans border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
                    >
                      詳細
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

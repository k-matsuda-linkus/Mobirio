"use client";

import { useState } from "react";
import { Bell, CalendarDays, Star, CreditCard, Info } from "lucide-react";

const ICON_MAP: Record<string, typeof Bell> = {
  reservation_confirmed: CalendarDays,
  reservation_cancelled: CalendarDays,
  reservation_reminder: CalendarDays,
  review_request: Star,
  payment_received: CreditCard,
  system: Info,
};

const INITIAL_NOTIFICATIONS = [
  { id: "n-001", type: "reservation_confirmed", title: "予約が確認されました", message: "Honda PCX 160 の予約（2025/02/15）がベンダーにより確認されました。", time: "2時間前", isRead: false },
  { id: "n-002", type: "review_request", title: "レビューのお願い", message: "Yamaha MT-09 のご利用ありがとうございました。ぜひレビューをお寄せください。", time: "1日前", isRead: false },
  { id: "n-003", type: "system", title: "冬季限定キャンペーン", message: "冬季限定20%OFFキャンペーン実施中！対象バイクをチェック。", time: "3日前", isRead: false },
  { id: "n-004", type: "payment_received", title: "お支払い完了", message: "Kawasaki Ninja 400 のレンタル料金 ¥13,200 のお支払いが完了しました。", time: "5日前", isRead: true },
  { id: "n-005", type: "reservation_reminder", title: "明日のご予約リマインダー", message: "Suzuki Address 125 の受取は明日 10:00 です。お忘れなく。", time: "1週間前", isRead: true },
  { id: "n-006", type: "reservation_cancelled", title: "予約がキャンセルされました", message: "ベンダー都合によりご予約がキャンセルされました。全額返金いたします。", time: "2週間前", isRead: true },
];

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-[24px]">
        <div>
          <h1 className="font-serif text-2xl font-light text-black mb-[8px]">通知</h1>
          <p className="text-sm font-sans text-gray-500">
            {unreadCount > 0 ? `${unreadCount}件の未読通知` : "すべて既読です"}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="text-sm font-sans text-accent hover:underline"
          >
            すべて既読にする
          </button>
        )}
      </div>

      <div className="space-y-[8px]">
        {notifications.map((n) => {
          const Icon = ICON_MAP[n.type] || Bell;
          return (
            <div
              key={n.id}
              className={`flex gap-[14px] p-[16px] border transition-colors cursor-pointer ${
                n.isRead
                  ? "bg-white border-gray-100 hover:bg-gray-50"
                  : "bg-accent/5 border-accent/20 hover:bg-accent/10"
              }`}
              onClick={() =>
                setNotifications((prev) =>
                  prev.map((item) =>
                    item.id === n.id ? { ...item, isRead: true } : item
                  )
                )
              }
            >
              <div className={`w-[36px] h-[36px] shrink-0 flex items-center justify-center ${
                n.isRead ? "bg-gray-100" : "bg-accent/10"
              }`}>
                <Icon className={`w-[18px] h-[18px] ${n.isRead ? "text-gray-400" : "text-accent"}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-[8px]">
                  <p className={`text-sm font-sans truncate ${n.isRead ? "text-gray-600" : "text-black font-medium"}`}>
                    {n.title}
                  </p>
                  {!n.isRead && <div className="w-[8px] h-[8px] bg-accent shrink-0 mt-[6px]" />}
                </div>
                <p className="text-xs font-sans text-gray-500 mt-[4px] line-clamp-2">{n.message}</p>
                <p className="text-xs font-sans text-gray-400 mt-[6px]">{n.time}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

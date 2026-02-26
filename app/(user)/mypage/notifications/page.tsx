"use client";

import { useState, useEffect } from "react";
import { Bell, CalendarDays, Star, CreditCard, Info } from "lucide-react";

const ICON_MAP: Record<string, typeof Bell> = {
  reservation: CalendarDays,
  reservation_confirmed: CalendarDays,
  reservation_cancelled: CalendarDays,
  reservation_reminder: CalendarDays,
  booking_cancelled: CalendarDays,
  review: Star,
  review_request: Star,
  payment: CreditCard,
  payment_received: CreditCard,
  promotion: Info,
  system: Info,
};

function timeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "たった今";
  if (minutes < 60) return `${minutes}分前`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}時間前`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}日前`;
  if (days < 30) return `${Math.floor(days / 7)}週間前`;
  if (days < 365) return `${Math.floor(days / 30)}ヶ月前`;
  return `${Math.floor(days / 365)}年前`;
}

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  body?: string;
  message?: string;
  timestamp?: string;
  created_at?: string;
  is_read?: boolean;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await fetch("/api/notifications");
        if (!res.ok) throw new Error("API error");
        const data = await res.json();
        setNotifications(data.data || []);
      } catch (error) {
        console.error("Failed to fetch notifications:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchNotifications();
  }, []);

  const getIsRead = (n: NotificationItem) => n.is_read ?? false;
  const unreadCount = notifications.filter((n) => !getIsRead(n)).length;

  const markAllRead = async () => {
    try {
      await fetch("/api/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAllRead: true }),
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (error) {
      console.error("Failed to mark all read:", error);
    }
  };

  const markRead = async (id: string) => {
    try {
      await fetch("/api/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
    } catch (error) {
      console.error("Failed to mark read:", error);
    }
  };

  if (loading) {
    return (
      <div>
        <h1 className="font-serif text-2xl font-light text-black mb-[24px]">通知</h1>
        <div className="space-y-[8px]">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-[80px] bg-gray-50 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

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
          <button onClick={markAllRead} className="text-sm font-sans text-accent hover:underline">
            すべて既読にする
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="text-center py-[60px] text-sm font-sans text-gray-400">
          通知はありません
        </div>
      ) : (
        <div className="space-y-[8px]">
          {notifications.map((n) => {
            const Icon = ICON_MAP[n.type] || Bell;
            const isRead = getIsRead(n);
            const message = n.body || n.message || "";
            const time = n.timestamp || n.created_at || "";
            return (
              <div
                key={n.id}
                className={`flex gap-[14px] p-[16px] border transition-colors cursor-pointer ${
                  isRead
                    ? "bg-white border-gray-100 hover:bg-gray-50"
                    : "bg-accent/5 border-accent/20 hover:bg-accent/10"
                }`}
                onClick={() => !isRead && markRead(n.id)}
              >
                <div className={`w-[36px] h-[36px] shrink-0 flex items-center justify-center ${
                  isRead ? "bg-gray-100" : "bg-accent/10"
                }`}>
                  <Icon className={`w-[18px] h-[18px] ${isRead ? "text-gray-400" : "text-accent"}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-[8px]">
                    <p className={`text-sm font-sans truncate ${isRead ? "text-gray-600" : "text-black font-medium"}`}>
                      {n.title}
                    </p>
                    {!isRead && <div className="w-[8px] h-[8px] bg-accent shrink-0 mt-[6px]" />}
                  </div>
                  <p className="text-xs font-sans text-gray-500 mt-[4px] line-clamp-2">{message}</p>
                  <p className="text-xs font-sans text-gray-400 mt-[6px]">{time ? timeAgo(time) : ""}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

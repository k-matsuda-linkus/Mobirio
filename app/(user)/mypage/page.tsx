"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { CalendarDays, Bike, Star, Bell } from "lucide-react";

interface ReservationItem {
  id: string;
  bikeName?: string;
  vendorName?: string;
  bike?: { name: string };
  vendor?: { name: string };
  start_datetime: string;
  status: string;
}

interface NotificationItem {
  id: string;
  title: string;
  body?: string;
  timestamp?: string;
  created_at?: string;
  read?: boolean;
  is_read?: boolean;
}

const STATUS_MAP: Record<string, { label: string; className: string }> = {
  confirmed: { label: "確定", className: "bg-status-confirmed/10 text-status-confirmed" },
  pending: { label: "承認待ち", className: "bg-status-pending/10 text-status-pending" },
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

export default function MypageDashboard() {
  const [userName, setUserName] = useState("");
  const [stats, setStats] = useState([
    { label: "予約中", value: "-", icon: CalendarDays, color: "text-accent" },
    { label: "利用回数", value: "-", icon: Bike, color: "text-black" },
    { label: "レビュー", value: "-", icon: Star, color: "text-yellow-500" },
    { label: "未読通知", value: "-", icon: Bell, color: "text-red-500" },
  ]);
  const [upcoming, setUpcoming] = useState<ReservationItem[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [profileRes, reservationsRes, notifRes, completedRes] = await Promise.all([
          fetch("/api/user/profile"),
          fetch("/api/reservations?limit=50"),
          fetch("/api/notifications"),
          fetch("/api/reservations?status=completed"),
        ]);

        const profileData = profileRes.ok ? await profileRes.json() : { data: null };
        const reservationsData = reservationsRes.ok ? await reservationsRes.json() : { data: [] };
        const notifData = notifRes.ok ? await notifRes.json() : { data: [], unreadCount: 0 };
        const completedData = completedRes.ok ? await completedRes.json() : { data: [] };

        setUserName(profileData.data?.full_name || "");

        const active = (reservationsData.data || [])
          .filter((r: ReservationItem) => r.status === "pending" || r.status === "confirmed")
          .slice(0, 2);
        setUpcoming(active);

        const completedCount = (completedData.data || []).length;
        const unreadCount = notifData.unreadCount || 0;

        setStats([
          { label: "予約中", value: String(active.length), icon: CalendarDays, color: "text-accent" },
          { label: "利用回数", value: String(completedCount), icon: Bike, color: "text-black" },
          { label: "レビュー", value: "-", icon: Star, color: "text-yellow-500" },
          { label: "未読通知", value: String(unreadCount), icon: Bell, color: "text-red-500" },
        ]);

        setNotifications((notifData.data || []).slice(0, 3));
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div>
        <div className="mb-[32px]">
          <div className="h-[32px] w-[200px] bg-gray-100 animate-pulse mb-[8px]" />
          <div className="h-[20px] w-[160px] bg-gray-100 animate-pulse" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-[16px] mb-[40px]">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white border border-gray-100 p-[20px]">
              <div className="h-[20px] w-[20px] bg-gray-100 animate-pulse mb-[12px]" />
              <div className="h-[32px] w-[40px] bg-gray-100 animate-pulse" />
              <div className="h-[16px] w-[60px] bg-gray-100 animate-pulse mt-[4px]" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-[32px]">
        <h1 className="font-serif text-2xl font-light text-black mb-[8px]">マイページ</h1>
        <p className="text-sm font-sans text-gray-500">
          こんにちは、{userName || "ゲスト"}さん
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-[16px] mb-[40px]">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-white border border-gray-100 p-[20px]">
              <div className="flex items-center justify-between mb-[12px]">
                <Icon className={`w-[20px] h-[20px] ${stat.color}`} />
              </div>
              <p className="font-serif text-2xl font-light text-black">{stat.value}</p>
              <p className="text-xs font-sans text-gray-500 mt-[4px]">{stat.label}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-[24px]">
        <div>
          <div className="flex items-center justify-between mb-[16px]">
            <h2 className="font-serif text-lg font-light text-black">直近の予約</h2>
            <Link href="/mypage/reservations" className="text-xs font-sans text-accent hover:underline">すべて見る</Link>
          </div>
          <div className="space-y-[12px]">
            {upcoming.length === 0 ? (
              <p className="text-sm font-sans text-gray-400 py-[20px]">直近の予約はありません</p>
            ) : (
              upcoming.map((r) => {
                const s = STATUS_MAP[r.status] || { label: r.status, className: "bg-gray-100 text-gray-600" };
                const bikeName = r.bikeName || r.bike?.name || "";
                const vendorName = r.vendorName || r.vendor?.name || "";
                return (
                  <Link key={r.id} href={`/mypage/reservations/${r.id}`} className="block bg-white border border-gray-100 p-[16px] hover:border-gray-200 transition-colors">
                    <div className="flex items-start justify-between mb-[8px]">
                      <p className="text-sm font-sans font-medium text-black">{bikeName}</p>
                      <span className={`text-xs font-sans px-[8px] py-[2px] ${s.className}`}>{s.label}</span>
                    </div>
                    <p className="text-xs font-sans text-gray-500">{vendorName}</p>
                    <p className="text-xs font-sans text-gray-400 mt-[4px]">{r.start_datetime}</p>
                  </Link>
                );
              })
            )}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-[16px]">
            <h2 className="font-serif text-lg font-light text-black">最近の通知</h2>
            <Link href="/mypage/notifications" className="text-xs font-sans text-accent hover:underline">すべて見る</Link>
          </div>
          <div className="space-y-[8px]">
            {notifications.length === 0 ? (
              <p className="text-sm font-sans text-gray-400 py-[20px]">通知はありません</p>
            ) : (
              notifications.map((n) => {
                const isUnread = !(n.is_read ?? true);
                const message = n.body || "";
                const time = n.timestamp || n.created_at || "";
                return (
                  <div key={n.id} className={`p-[14px] border transition-colors ${isUnread ? "bg-accent/5 border-accent/20" : "bg-white border-gray-100"}`}>
                    <div className="flex items-start gap-[10px]">
                      {isUnread && <div className="w-[6px] h-[6px] bg-accent shrink-0 mt-[6px]" />}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-sans font-medium text-black truncate">{n.title}</p>
                        <p className="text-xs font-sans text-gray-500 mt-[2px] truncate">{message}</p>
                        <p className="text-xs font-sans text-gray-400 mt-[4px]">{time ? timeAgo(time) : ""}</p>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

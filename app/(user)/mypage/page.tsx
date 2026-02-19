import Link from "next/link";
import { CalendarDays, Bike, Star, Bell } from "lucide-react";

const STATS = [
  { label: "予約中", value: "2", icon: CalendarDays, color: "text-accent" },
  { label: "利用回数", value: "12", icon: Bike, color: "text-black" },
  { label: "レビュー", value: "8", icon: Star, color: "text-yellow-500" },
  { label: "未読通知", value: "3", icon: Bell, color: "text-red-500" },
];

const UPCOMING = [
  { id: "rsv-001", bike: "Honda PCX 160", vendor: "サンシャインモータース宮崎", date: "2025/02/15", status: "confirmed" },
  { id: "rsv-002", bike: "Yamaha MT-25", vendor: "青島バイクレンタル", date: "2025/03/01", status: "pending" },
];

const NOTIFICATIONS = [
  { id: 1, title: "予約が確認されました", message: "Honda PCX 160の予約が確認されました。", time: "2時間前", unread: true },
  { id: 2, title: "レビューのお願い", message: "先日のご利用についてレビューをお寄せください。", time: "1日前", unread: true },
  { id: 3, title: "キャンペーンのお知らせ", message: "冬季限定20%OFFキャンペーン実施中！", time: "3日前", unread: false },
];

const STATUS_MAP: Record<string, { label: string; className: string }> = {
  confirmed: { label: "確定", className: "bg-status-confirmed/10 text-status-confirmed" },
  pending: { label: "承認待ち", className: "bg-status-pending/10 text-status-pending" },
};

export default function MypageDashboard() {
  return (
    <div>
      {/* Welcome */}
      <div className="mb-[32px]">
        <h1 className="font-serif text-2xl font-light text-black mb-[8px]">マイページ</h1>
        <p className="text-sm font-sans text-gray-500">こんにちは、田中太郎さん</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-[16px] mb-[40px]">
        {STATS.map((stat) => {
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
        {/* Upcoming Reservations */}
        <div>
          <div className="flex items-center justify-between mb-[16px]">
            <h2 className="font-serif text-lg font-light text-black">直近の予約</h2>
            <Link href="/mypage/reservations" className="text-xs font-sans text-accent hover:underline">すべて見る</Link>
          </div>
          <div className="space-y-[12px]">
            {UPCOMING.map((r) => {
              const s = STATUS_MAP[r.status];
              return (
                <Link key={r.id} href={`/mypage/reservations/${r.id}`} className="block bg-white border border-gray-100 p-[16px] hover:border-gray-200 transition-colors">
                  <div className="flex items-start justify-between mb-[8px]">
                    <p className="text-sm font-sans font-medium text-black">{r.bike}</p>
                    <span className={`text-xs font-sans px-[8px] py-[2px] ${s.className}`}>{s.label}</span>
                  </div>
                  <p className="text-xs font-sans text-gray-500">{r.vendor}</p>
                  <p className="text-xs font-sans text-gray-400 mt-[4px]">{r.date}</p>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Recent Notifications */}
        <div>
          <div className="flex items-center justify-between mb-[16px]">
            <h2 className="font-serif text-lg font-light text-black">最近の通知</h2>
            <Link href="/mypage/notifications" className="text-xs font-sans text-accent hover:underline">すべて見る</Link>
          </div>
          <div className="space-y-[8px]">
            {NOTIFICATIONS.map((n) => (
              <div key={n.id} className={`p-[14px] border transition-colors ${n.unread ? "bg-accent/5 border-accent/20" : "bg-white border-gray-100"}`}>
                <div className="flex items-start gap-[10px]">
                  {n.unread && <div className="w-[6px] h-[6px] bg-accent shrink-0 mt-[6px]" />}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-sans font-medium text-black truncate">{n.title}</p>
                    <p className="text-xs font-sans text-gray-500 mt-[2px] truncate">{n.message}</p>
                    <p className="text-xs font-sans text-gray-400 mt-[4px]">{n.time}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

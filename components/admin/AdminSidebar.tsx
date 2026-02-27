"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Store,
  Users,
  CalendarDays,
  Bike,
  CreditCard,
  BarChart3,
  MessageCircle,
  TrendingUp,
  Bell,
  Settings,
  Menu,
  X,
} from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  { label: "ダッシュボード", href: "/admin", icon: <LayoutDashboard className="w-[18px] h-[18px]" /> },
  { label: "ベンダー管理", href: "/admin/vendors", icon: <Store className="w-[18px] h-[18px]" /> },
  { label: "ユーザー管理", href: "/admin/users", icon: <Users className="w-[18px] h-[18px]" /> },
  { label: "予約管理", href: "/admin/reservations", icon: <CalendarDays className="w-[18px] h-[18px]" /> },
  { label: "バイク管理", href: "/admin/bikes", icon: <Bike className="w-[18px] h-[18px]" /> },
  { label: "決済管理", href: "/admin/payments", icon: <CreditCard className="w-[18px] h-[18px]" /> },
  { label: "レポート", href: "/admin/reports", icon: <BarChart3 className="w-[18px] h-[18px]" /> },
  { label: "お問い合わせ", href: "/admin/inquiries", icon: <MessageCircle className="w-[18px] h-[18px]" /> },
  { label: "アクセス解析", href: "/admin/analytics", icon: <TrendingUp className="w-[18px] h-[18px]" /> },
  { label: "通知配信", href: "/admin/notifications", icon: <Bell className="w-[18px] h-[18px]" /> },
  { label: "システム設定", href: "/admin/settings", icon: <Settings className="w-[18px] h-[18px]" /> },
];

function isActive(pathname: string, href: string) {
  if (href === "/admin") return pathname === "/admin";
  return pathname.startsWith(href);
}

export function AdminSidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navContent = (
    <nav className="flex flex-col gap-[2px] px-[12px] py-[16px]">
      {navItems.map((item) => {
        const active = isActive(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setMobileOpen(false)}
            className={`flex items-center gap-[12px] px-[12px] py-[10px] text-sm font-sans transition-colors ${
              active
                ? "bg-accent/10 text-accent font-medium"
                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            }`}
          >
            <span className={active ? "text-accent" : "text-gray-400"}>
              {item.icon}
            </span>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <>
      {/* desktop sidebar */}
      <aside className="hidden lg:flex lg:flex-col w-[240px] border-r border-gray-200 bg-white h-screen sticky top-0 overflow-y-auto shrink-0">
        <div className="px-[20px] py-[20px] border-b border-gray-200">
          <span className="font-serif text-lg font-medium text-black tracking-tight">
            Mobirio <span className="text-accent">Admin</span>
          </span>
        </div>
        {navContent}
      </aside>

      {/* mobile hamburger */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-[14px] left-[14px] z-40 p-[8px] bg-white border border-gray-200 shadow-sm"
        aria-label="メニューを開く"
      >
        <Menu className="w-[20px] h-[20px] text-gray-700" />
      </button>

      {/* mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-50 bg-black/30"
          onClick={() => setMobileOpen(false)}
        >
          <aside
            className="w-[280px] h-full bg-white overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-[20px] py-[20px] border-b border-gray-200">
              <span className="font-serif text-lg font-medium text-black tracking-tight">
                Mobirio <span className="text-accent">Admin</span>
              </span>
              <button
                onClick={() => setMobileOpen(false)}
                className="p-[4px] text-gray-500 hover:text-gray-700"
                aria-label="メニューを閉じる"
              >
                <X className="w-[20px] h-[20px]" />
              </button>
            </div>
            {navContent}
          </aside>
        </div>
      )}
    </>
  );
}

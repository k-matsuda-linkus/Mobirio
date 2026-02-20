"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { LayoutDashboard, CalendarDays, Bike, Store, Menu } from "lucide-react";

interface BottomNavProps {
  onMenuOpen: () => void;
}

const NAV_ITEMS = [
  { href: "/vendor", label: "TOP", icon: LayoutDashboard, exact: true },
  { href: "/vendor/reservations", label: "予約", icon: CalendarDays },
  { href: "/vendor/bikes", label: "車両", icon: Bike },
  { href: "/vendor/store", label: "店舗", icon: Store },
];

export function BottomNav({ onMenuOpen }: BottomNavProps) {
  const pathname = usePathname();

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href;
    return pathname === href || pathname.startsWith(href + "/");
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-[56px] bg-white border-t border-gray-200 z-40 md:hidden">
      <div className="flex items-center justify-around h-full">
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.href, item.exact);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={
                "flex flex-col items-center justify-center gap-[2px] flex-1 h-full relative " +
                (active ? "text-accent" : "text-gray-400")
              }
            >
              {active && (
                <span className="absolute top-0 left-[25%] right-[25%] h-[2px] bg-accent" />
              )}
              <Icon className="w-[20px] h-[20px]" />
              <span className="text-[10px]">{item.label}</span>
            </Link>
          );
        })}
        <button
          onClick={onMenuOpen}
          className="flex flex-col items-center justify-center gap-[2px] flex-1 h-full text-gray-400"
        >
          <Menu className="w-[20px] h-[20px]" />
          <span className="text-[10px]">その他</span>
        </button>
      </div>
    </nav>
  );
}

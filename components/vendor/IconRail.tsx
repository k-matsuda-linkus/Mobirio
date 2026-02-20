"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Store, Users, CalendarDays, Bike, CreditCard,
  Calculator, BarChart3, Star, MessageSquare, TrendingUp, Bell, Settings,
  Clock, Heart, CalendarCheck, HardHat, Megaphone, FileDown, BookOpen,
  Building2, JapaneseYen, ArrowLeft,
} from "lucide-react";
import { VENDOR_NAV_ITEMS, type NavItem } from "@/lib/constants";

const iconMap: Record<string, React.ElementType> = {
  LayoutDashboard, Store, Users, CalendarDays, Bike, CreditCard,
  Calculator, BarChart3, Star, MessageSquare, TrendingUp, Bell, Settings,
  Clock, Heart, CalendarCheck, HardHat, Megaphone, FileDown, BookOpen,
  Building2, JapaneseYen,
};

interface IconRailProps {
  activeGroup: string | null;
  onHoverGroup: (href: string | null) => void;
  onLeave?: () => void;
}

export function IconRail({ activeGroup, onHoverGroup, onLeave }: IconRailProps) {
  const pathname = usePathname();

  const isGroupActive = (item: NavItem) => {
    if (!item.children || item.children.length === 0) {
      return pathname === item.href || (item.href !== "/vendor" && pathname.startsWith(item.href + "/"));
    }
    return item.children.some(
      (child) => pathname === child.href || pathname.startsWith(child.href + "/")
    );
  };

  return (
    <aside className="hidden md:flex flex-col fixed top-0 left-0 bottom-0 w-[60px] bg-white border-r border-gray-200 z-40" onMouseLeave={onLeave}>
      <nav className="flex-1 flex flex-col items-center pt-[8px] gap-[2px] overflow-y-auto">
        {VENDOR_NAV_ITEMS.map((item) => {
          const Icon = item.icon ? iconMap[item.icon] : null;
          if (!Icon) return null;

          const active = isGroupActive(item);
          const hasChildren = item.children && item.children.length > 0;

          const baseClass =
            "relative flex items-center justify-center w-[48px] h-[48px] transition-colors " +
            (active
              ? "border-l-[3px] border-accent text-accent bg-accent/5"
              : "text-gray-500 hover:text-gray-800 hover:bg-gray-50");

          if (hasChildren) {
            return (
              <button
                key={item.href}
                title={item.label}
                className={baseClass}
                onMouseEnter={() => onHoverGroup(item.href)}
                onClick={() => onHoverGroup(activeGroup === item.href ? null : item.href)}
              >
                <Icon className="w-[20px] h-[20px]" />
              </button>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              title={item.label}
              className={baseClass}
              onMouseEnter={() => onHoverGroup(null)}
            >
              <Icon className="w-[20px] h-[20px]" />
              {item.badge && (
                <span className="absolute top-[6px] right-[6px] w-[6px] h-[6px] bg-orange-400" />
              )}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-gray-200 flex items-center justify-center py-[12px]">
        <Link
          href="/"
          title="サイトに戻る"
          className="flex items-center justify-center w-[48px] h-[48px] text-gray-400 hover:text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <ArrowLeft className="w-[20px] h-[20px]" />
        </Link>
      </div>
    </aside>
  );
}

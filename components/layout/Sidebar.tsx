"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Store, Users, CalendarDays, Bike, CreditCard,
  Calculator, BarChart3, Star, MessageSquare, TrendingUp, Bell, Settings,
  Clock, Heart, CalendarCheck, ChevronDown, HardHat, Megaphone,
  FileDown, BookOpen, ArrowLeft, Building2, JapaneseYen,
} from "lucide-react";
import { NavItem } from "@/lib/constants";
import { useState, useEffect } from "react";

const iconMap: Record<string, React.ElementType> = {
  LayoutDashboard, Store, Users, CalendarDays, Bike, CreditCard,
  Calculator, BarChart3, Star, MessageSquare, TrendingUp, Bell, Settings,
  Clock, Heart, CalendarCheck, HardHat, Megaphone, FileDown, BookOpen,
  Building2, JapaneseYen,
};

interface SidebarProps {
  items: NavItem[];
  currentPath?: string;
  title: string;
  hasHeader?: boolean;
  backHref?: string;
  backLabel?: string;
}

export function Sidebar({ items, title, hasHeader = false, backHref, backLabel }: SidebarProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<string[]>([]);

  // Auto-expand groups that contain the active page
  useEffect(() => {
    const activeGroups: string[] = [];
    items.forEach((item) => {
      if (item.children) {
        const hasActive = item.children.some(
          (child) => pathname === child.href || pathname.startsWith(child.href + "/")
        );
        if (hasActive) activeGroups.push(item.href);
      }
    });
    setExpandedGroups((prev) => {
      const merged = new Set([...prev, ...activeGroups]);
      return Array.from(merged);
    });
  }, [pathname, items]);

  const toggleGroup = (href: string) => {
    setExpandedGroups((prev) =>
      prev.includes(href) ? prev.filter((g) => g !== href) : [...prev, href]
    );
  };

  const isActive = (href: string) =>
    pathname === href || (href !== "/vendor" && href !== "/dashboard" && pathname.startsWith(href + "/"));

  const isChildActive = (item: NavItem) =>
    item.children?.some((child) => pathname === child.href || pathname.startsWith(child.href + "/")) ?? false;

  const topOffset = hasHeader ? "top-[70px]" : "top-0";
  const asideCls =
    `fixed ${topOffset} left-0 bottom-0 w-[260px] bg-white border-r border-gray-200 z-40 overflow-y-auto transition-transform `;

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed ${hasHeader ? "top-[80px]" : "top-[10px]"} left-[10px] z-40 md:hidden bg-white border border-gray-200 p-[8px]`}
      >
        <LayoutDashboard className="w-[20px] h-[20px]" />
      </button>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
      <aside
        className={
          asideCls +
          (isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0")
        }
      >
        {backHref && (
          <Link
            href={backHref}
            className="flex items-center gap-[6px] px-[20px] py-[10px] text-xs text-gray-500 hover:text-black hover:bg-gray-50 border-b border-gray-100 transition-colors"
          >
            <ArrowLeft size={14} />
            {backLabel || "サイトに戻る"}
          </Link>
        )}
        <div className="p-[20px] border-b border-gray-200">
          <h2 className="font-serif text-lg font-light">{title}</h2>
        </div>
        <nav className="p-[12px]">
          {items.map((item) => {
            const Icon = item.icon ? iconMap[item.icon] : null;

            // Item with children = accordion group
            if (item.children && item.children.length > 0) {
              const expanded = expandedGroups.includes(item.href);
              const groupActive = isChildActive(item);

              return (
                <div key={item.href} className="mb-[2px]">
                  <button
                    onClick={() => toggleGroup(item.href)}
                    className={
                      "flex items-center justify-between w-full px-[16px] py-[10px] text-sm font-sans " +
                      (groupActive
                        ? "text-accent font-medium"
                        : "text-gray-600 hover:bg-gray-50")
                    }
                  >
                    <span className="flex items-center gap-[12px]">
                      {Icon && <Icon className="w-[18px] h-[18px]" />}
                      <span>{item.label}</span>
                    </span>
                    <ChevronDown
                      className={
                        "w-[16px] h-[16px] transition-transform " +
                        (expanded ? "rotate-180" : "")
                      }
                    />
                  </button>
                  {expanded && (
                    <div className="ml-[30px] border-l border-gray-200">
                      {item.children.map((child) => {
                        const childActive = isActive(child.href);
                        return (
                          <Link
                            key={child.href}
                            href={child.href}
                            onClick={() => setIsOpen(false)}
                            className={
                              "block px-[16px] py-[8px] text-sm " +
                              (childActive
                                ? "text-accent font-medium bg-accent/5"
                                : "text-gray-500 hover:text-gray-700 hover:bg-gray-50")
                            }
                          >
                            {child.label}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            // Regular link item (no children)
            const act = isActive(item.href);
            const cls =
              "flex items-center gap-[12px] px-[16px] py-[10px] text-sm font-sans mb-[2px] " +
              (act
                ? "bg-accent/10 text-accent border-l-[3px] border-accent"
                : "text-gray-600 hover:bg-gray-50");

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={cls}
              >
                {Icon && <Icon className="w-[18px] h-[18px]" />}
                <span className="flex-1">{item.label}</span>
                {item.badge && (
                  <span className="text-[10px] px-[6px] py-[1px] bg-orange-100 text-orange-600 rounded-full">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}

"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, Store, Users, CalendarDays, Bike, CreditCard,
  Calculator, BarChart3, Star, MessageSquare, TrendingUp, Bell, Settings,
  Clock, Heart, CalendarCheck, HardHat, Megaphone, FileDown, BookOpen,
  Building2, JapaneseYen,
} from "lucide-react";
import { VENDOR_NAV_ITEMS, type NavItem } from "@/lib/constants";
import { getRecentPages, addRecentPage } from "@/lib/vendor-nav";

const iconMap: Record<string, React.ElementType> = {
  LayoutDashboard, Store, Users, CalendarDays, Bike, CreditCard,
  Calculator, BarChart3, Star, MessageSquare, TrendingUp, Bell, Settings,
  Clock, Heart, CalendarCheck, HardHat, Megaphone, FileDown, BookOpen,
  Building2, JapaneseYen,
};

interface FlatItem {
  href: string;
  label: string;
  parentLabel?: string;
  icon?: string;
}

function flattenNavItems(items: NavItem[]): FlatItem[] {
  const result: FlatItem[] = [];
  for (const item of items) {
    if (item.children && item.children.length > 0) {
      for (const child of item.children) {
        result.push({
          href: child.href,
          label: child.label,
          parentLabel: item.label,
          icon: item.icon,
        });
      }
    } else if (!item.href.startsWith("#")) {
      result.push({
        href: item.href,
        label: item.label,
        icon: item.icon,
      });
    }
  }
  return result;
}

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
}

export function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const allItems = useMemo(() => flattenNavItems(VENDOR_NAV_ITEMS), []);
  const recentPages = useMemo(() => (open ? getRecentPages() : []), [open]);

  const recentItems = useMemo(() => {
    if (query) return [];
    return recentPages
      .map((path) => allItems.find((item) => item.href === path))
      .filter((item): item is FlatItem => item !== undefined);
  }, [recentPages, allItems, query]);

  const filteredItems = useMemo(() => {
    if (!query) return allItems;
    const q = query.toLowerCase();
    return allItems.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        (item.parentLabel && item.parentLabel.toLowerCase().includes(q)) ||
        item.href.toLowerCase().includes(q)
    );
  }, [allItems, query]);

  const displayItems = useMemo(() => {
    const sections: { title: string; items: FlatItem[] }[] = [];
    if (recentItems.length > 0) {
      sections.push({ title: "最近", items: recentItems });
    }
    sections.push({ title: query ? "検索結果" : "すべてのページ", items: filteredItems });
    return sections;
  }, [recentItems, filteredItems, query]);

  const totalItems = useMemo(
    () => displayItems.reduce((sum, section) => sum + section.items.length, 0),
    [displayItems]
  );

  const getItemAtIndex = useCallback(
    (index: number): FlatItem | null => {
      let i = 0;
      for (const section of displayItems) {
        for (const item of section.items) {
          if (i === index) return item;
          i++;
        }
      }
      return null;
    },
    [displayItems]
  );

  // openになったらフォーカス
  useEffect(() => {
    if (open) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // selectedIndex変更時にスクロール
  useEffect(() => {
    if (!listRef.current) return;
    const el = listRef.current.querySelector(`[data-index="${selectedIndex}"]`);
    if (el) {
      el.scrollIntoView({ block: "nearest" });
    }
  }, [selectedIndex]);

  const navigate = useCallback(
    (href: string) => {
      addRecentPage(href);
      router.push(href);
      onClose();
    },
    [router, onClose]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % Math.max(totalItems, 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + Math.max(totalItems, 1)) % Math.max(totalItems, 1));
      } else if (e.key === "Enter") {
        e.preventDefault();
        const item = getItemAtIndex(selectedIndex);
        if (item) navigate(item.href);
      } else if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    },
    [totalItems, selectedIndex, getItemAtIndex, navigate, onClose]
  );

  // query変更でselectedIndexリセット
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="command-palette-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-[120px]"
          onClick={onClose}
        >
          <motion.div
            key="command-palette-panel"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="bg-white w-full max-w-[500px] shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 検索入力 */}
            <div className="flex items-center gap-[12px] px-[16px] py-[12px] border-b border-gray-200">
              <Search className="w-[18px] h-[18px] text-gray-400 flex-shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="ページを検索..."
                className="flex-1 text-sm outline-none bg-transparent placeholder:text-gray-400"
              />
              <kbd className="hidden md:inline text-[10px] text-gray-400 border border-gray-200 px-[6px] py-[2px]">
                ESC
              </kbd>
            </div>

            {/* 結果リスト */}
            <div ref={listRef} className="max-h-[400px] overflow-y-auto">
              {totalItems === 0 && (
                <div className="px-[16px] py-[24px] text-center text-sm text-gray-400">
                  一致するページがありません
                </div>
              )}
              {(() => {
                let globalIndex = 0;
                return displayItems.map((section) => {
                  if (section.items.length === 0) return null;
                  return (
                    <div key={section.title}>
                      <div className="px-[16px] py-[8px] text-[11px] font-medium text-gray-400 uppercase tracking-wider">
                        {section.title}
                      </div>
                      {section.items.map((item) => {
                        const idx = globalIndex++;
                        const Icon = item.icon ? iconMap[item.icon] : null;
                        const isSelected = idx === selectedIndex;
                        return (
                          <button
                            key={`${section.title}-${item.href}`}
                            data-index={idx}
                            onClick={() => navigate(item.href)}
                            className={
                              "flex items-center gap-[12px] w-full px-[16px] py-[10px] text-sm text-left transition-colors " +
                              (isSelected
                                ? "bg-accent/10 text-accent"
                                : "text-gray-700 hover:bg-gray-50")
                            }
                          >
                            {Icon && <Icon className="w-[16px] h-[16px] flex-shrink-0 text-gray-400" />}
                            <span className="flex-1 truncate">
                              {item.parentLabel && (
                                <span className="text-gray-400 mr-[4px]">
                                  {item.parentLabel} /
                                </span>
                              )}
                              {item.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  );
                });
              })()}
            </div>

            {/* フッター */}
            <div className="border-t border-gray-200 px-[16px] py-[8px] flex items-center gap-[16px] text-[11px] text-gray-400">
              <span className="flex items-center gap-[4px]">
                <kbd className="border border-gray-200 px-[4px] py-[1px]">&uarr;</kbd>
                <kbd className="border border-gray-200 px-[4px] py-[1px]">&darr;</kbd>
                移動
              </span>
              <span className="flex items-center gap-[4px]">
                <kbd className="border border-gray-200 px-[4px] py-[1px]">Enter</kbd>
                遷移
              </span>
              <span className="flex items-center gap-[4px]">
                <kbd className="border border-gray-200 px-[4px] py-[1px]">Esc</kbd>
                閉じる
              </span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

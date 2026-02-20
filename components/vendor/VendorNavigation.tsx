"use client";

import { useState, useCallback, createContext, useContext, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Menu, X, ChevronDown, ArrowLeft } from "lucide-react";
import Link from "next/link";
import {
  LayoutDashboard, Store, Users, CalendarDays, Bike, CreditCard,
  Calculator, BarChart3, Star, MessageSquare, TrendingUp, Bell, Settings,
  Clock, Heart, CalendarCheck, HardHat, Megaphone, FileDown, BookOpen,
  Building2, JapaneseYen, ChevronRight, Ticket,
} from "lucide-react";
import { VENDOR_NAV_ITEMS, type NavItem } from "@/lib/constants";
import { addRecentPage } from "@/lib/vendor-nav";
import { VendorTopBar } from "./VendorTopBar";
import { CommandPalette } from "./CommandPalette";
import { BottomNav } from "./BottomNav";

const iconMap: Record<string, React.ElementType> = {
  LayoutDashboard, Store, Users, CalendarDays, Bike, CreditCard,
  Calculator, BarChart3, Star, MessageSquare, TrendingUp, Bell, Settings,
  Clock, Heart, CalendarCheck, HardHat, Megaphone, FileDown, BookOpen,
  Building2, JapaneseYen, Ticket,
};

// ---- VendorStoreContext ----
const VendorStoreContext = createContext<{
  storeId: string;
  setStoreId: (id: string) => void;
}>({ storeId: "s1", setStoreId: () => {} });

export const useVendorStore = () => useContext(VendorStoreContext);

// ---- Mock Stores ----
const MOCK_STORES = [
  { id: "s1", name: "宮崎橘通り店" },
  { id: "s2", name: "宮崎空港店" },
];

// ---- VendorNavigation ----
interface VendorNavigationProps {
  children: React.ReactNode;
}

export function VendorNavigation({ children }: VendorNavigationProps) {
  const pathname = usePathname();
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [selectedStore, setSelectedStore] = useState("s1");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<string[]>([]);

  // 初回: 現在のパスに該当するグループを自動展開
  useEffect(() => {
    const active: string[] = [];
    for (const item of VENDOR_NAV_ITEMS) {
      if (item.children && item.children.length > 0) {
        const match = item.children.some(
          (child) => pathname === child.href || pathname.startsWith(child.href + "/")
        );
        if (match) active.push(item.href);
      }
    }
    setExpandedGroups((prev) => {
      const merged = new Set([...prev, ...active]);
      return Array.from(merged);
    });
  }, [pathname]);

  // ページ遷移時にrecentに追加
  useEffect(() => {
    addRecentPage(pathname);
  }, [pathname]);

  // Cmd+K / Ctrl+K でコマンドパレット起動
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // モバイルメニューをページ遷移時に閉じる
  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  const toggleGroup = useCallback((href: string) => {
    setExpandedGroups((prev) =>
      prev.includes(href) ? prev.filter((g) => g !== href) : [...prev, href]
    );
  }, []);

  const isActive = (href: string) =>
    pathname === href || (href !== "/vendor" && pathname.startsWith(href + "/"));

  const handleOpenCommandPalette = useCallback(() => {
    setCommandPaletteOpen(true);
  }, []);

  const handleCloseCommandPalette = useCallback(() => {
    setCommandPaletteOpen(false);
  }, []);

  // ---- 共通ナビ項目レンダラ ----
  const renderNavItems = (items: NavItem[], isMobile?: boolean) =>
    items.map((item) => {
      const Icon = item.icon ? iconMap[item.icon] : null;

      if (item.children && item.children.length > 0) {
        const expanded = expandedGroups.includes(item.href);
        const groupActive = item.children.some(
          (child) => pathname === child.href || pathname.startsWith(child.href + "/")
        );

        return (
          <div key={item.href} className="mb-[2px]">
            <button
              onClick={() => toggleGroup(item.href)}
              className={
                "flex items-center justify-between w-full px-[12px] py-[8px] text-[13px] transition-colors " +
                (groupActive ? "text-accent font-medium" : "text-gray-600 hover:bg-gray-50")
              }
            >
              <span className="flex items-center gap-[10px]">
                {Icon && <Icon className="w-[16px] h-[16px] flex-shrink-0" />}
                <span>{item.label}</span>
              </span>
              <ChevronDown
                className={
                  "w-[14px] h-[14px] text-gray-400 transition-transform " +
                  (expanded ? "rotate-180" : "")
                }
              />
            </button>
            {expanded && (
              <div className="ml-[26px] border-l border-gray-200">
                {item.children.map((child) => {
                  const childActive = isActive(child.href);
                  return (
                    <Link
                      key={child.href}
                      href={child.href}
                      className={
                        "block px-[12px] py-[7px] text-[13px] transition-colors " +
                        (childActive
                          ? "text-accent font-medium bg-accent/5 border-l-[2px] border-accent ml-[-1px]"
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

      const act = isActive(item.href);
      return (
        <Link
          key={item.href}
          href={item.href}
          className={
            "flex items-center gap-[10px] px-[12px] py-[8px] text-[13px] mb-[2px] transition-colors " +
            (act
              ? "bg-accent/10 text-accent font-medium border-l-[3px] border-accent"
              : "text-gray-600 hover:bg-gray-50")
          }
        >
          {Icon && <Icon className="w-[16px] h-[16px] flex-shrink-0" />}
          <span className="flex-1">{item.label}</span>
          {item.badge && (
            <span className="text-[10px] px-[6px] py-[1px] bg-orange-100 text-orange-600">
              {item.badge}
            </span>
          )}
        </Link>
      );
    });

  return (
    <VendorStoreContext.Provider value={{ storeId: selectedStore, setStoreId: setSelectedStore }}>
      {/* デスクトップ: 常時展開サイドバー */}
      <aside className="hidden md:flex flex-col fixed top-0 left-0 bottom-0 w-[240px] bg-white border-r border-gray-200 z-40">
        {/* ロゴ / タイトル */}
        <div className="px-[16px] py-[14px] border-b border-gray-100">
          <Link href="/vendor" className="flex items-center gap-[8px]">
            <span className="font-serif text-[15px] font-light text-gray-800">Mobirio</span>
            <span className="text-[11px] text-gray-400">管理</span>
          </Link>
        </div>

        {/* ナビゲーション */}
        <nav className="flex-1 overflow-y-auto py-[8px] px-[8px]">
          {renderNavItems(VENDOR_NAV_ITEMS)}
        </nav>

        {/* フッター */}
        <div className="border-t border-gray-200 px-[8px] py-[8px]">
          <Link
            href="/"
            className="flex items-center gap-[10px] px-[12px] py-[8px] text-[13px] text-gray-400 hover:text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft className="w-[16px] h-[16px]" />
            サイトに戻る
          </Link>
        </div>
      </aside>

      {/* TopBar + CommandPalette */}
      <VendorTopBar
        stores={MOCK_STORES}
        selectedStore={selectedStore}
        onStoreChange={setSelectedStore}
        onCommandPalette={handleOpenCommandPalette}
      />
      <CommandPalette open={commandPaletteOpen} onClose={handleCloseCommandPalette} />

      {/* モバイル: ハンバーガーボタン（メニューオープン時のみ表示。BottomNavがあるので通常時は非表示） */}
      {isMenuOpen && (
        <button
          onClick={() => setIsMenuOpen(false)}
          className="fixed top-[10px] left-[10px] z-50 md:hidden bg-white border border-gray-200 p-[8px]"
        >
          <X className="w-[20px] h-[20px]" />
        </button>
      )}

      {/* モバイル: 全画面メニュー */}
      {isMenuOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/30 z-[45] md:hidden"
            onClick={() => setIsMenuOpen(false)}
          />
          <div className="fixed inset-0 bg-white md:hidden overflow-y-auto z-[46]">
            <div className="pt-[56px] pb-[20px]">
              <div className="px-[16px] py-[12px] border-b border-gray-200">
                <h2 className="font-serif text-lg font-light">ベンダー管理</h2>
              </div>
              <nav className="p-[8px]">
                {renderNavItems(VENDOR_NAV_ITEMS, true)}
              </nav>
              <div className="border-t border-gray-200 p-[8px]">
                <Link
                  href="/"
                  className="flex items-center gap-[8px] px-[12px] py-[10px] text-sm text-gray-500 hover:text-gray-700"
                >
                  <ArrowLeft className="w-[16px] h-[16px]" />
                  サイトに戻る
                </Link>
              </div>
            </div>
          </div>
        </>
      )}

      {/* モバイル: ボトムナビゲーション */}
      <BottomNav onMenuOpen={() => setIsMenuOpen(true)} />

      {/* コンテンツラッパー: flex + spacer でサイドバー幅を確保 */}
      <div className="md:flex min-h-screen">
        <div className="hidden md:block w-[240px] flex-shrink-0" aria-hidden="true" />
        <div className="flex-1 min-w-0">
          {children}
        </div>
      </div>
    </VendorStoreContext.Provider>
  );
}

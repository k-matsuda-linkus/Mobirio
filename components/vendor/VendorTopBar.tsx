"use client";

import { Bell, Command } from "lucide-react";
import { StoreSelector } from "@/components/vendor/StoreSelector";

interface VendorTopBarProps {
  stores: { id: string; name: string }[];
  selectedStore: string;
  onStoreChange: (id: string) => void;
  onCommandPalette: () => void;
}

export function VendorTopBar({
  stores,
  selectedStore,
  onStoreChange,
  onCommandPalette,
}: VendorTopBarProps) {
  return (
    <header className="fixed top-0 left-0 md:left-[240px] right-0 h-[48px] bg-white border-b border-gray-200 z-40 flex items-center px-[16px] md:px-[24px]">
      {/* 左: StoreSelector */}
      <div className="flex-1 min-w-0 flex items-center">
        <StoreSelector
          stores={stores}
          selectedId={selectedStore}
          onChange={onStoreChange}
        />
      </div>

      {/* 右: 通知 + コマンドパレット */}
      <div className="flex items-center gap-[8px]">
        <button
          title="通知"
          className="relative p-[8px] text-gray-500 hover:text-gray-800 hover:bg-gray-50 transition-colors"
        >
          <Bell className="w-[18px] h-[18px]" />
        </button>
        <button
          onClick={onCommandPalette}
          title="コマンドパレット (Cmd+K)"
          className="hidden md:flex items-center gap-[6px] px-[10px] py-[6px] text-xs text-gray-400 border border-gray-200 hover:border-gray-300 hover:text-gray-600 transition-colors"
        >
          <Command className="w-[12px] h-[12px]" />
          <span>K</span>
        </button>
      </div>
    </header>
  );
}

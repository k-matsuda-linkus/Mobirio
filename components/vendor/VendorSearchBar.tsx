"use client";
import { useState } from "react";
import { ChevronDown, Search } from "lucide-react";

interface VendorSearchBarProps {
  children: React.ReactNode;
  onSearch?: () => void;
  onReset?: () => void;
  defaultOpen?: boolean;
}

export function VendorSearchBar({ children, onSearch, onReset, defaultOpen = false }: VendorSearchBarProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="bg-white border border-gray-200 mb-[16px]">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-[16px] py-[12px] text-sm font-medium text-gray-700 hover:bg-gray-50"
      >
        <span className="flex items-center gap-[8px]">
          <Search className="w-[16px] h-[16px]" />
          検索条件
        </span>
        <ChevronDown className={"w-[16px] h-[16px] transition-transform " + (isOpen ? "rotate-180" : "")} />
      </button>
      {isOpen && (
        <div className="px-[16px] pb-[16px] border-t border-gray-100">
          <div className="pt-[16px] space-y-[12px]">
            {children}
          </div>
          <div className="flex items-center gap-[8px] mt-[16px]">
            <button
              onClick={onSearch}
              className="bg-accent text-white px-[24px] py-[8px] text-sm hover:bg-accent/90"
            >
              検索
            </button>
            <button
              onClick={onReset}
              className="border border-gray-300 text-gray-600 px-[24px] py-[8px] text-sm hover:bg-gray-50"
            >
              リセット
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

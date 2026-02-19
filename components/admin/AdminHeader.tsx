"use client";

import { useState, useRef, useEffect } from "react";
import { Bell, ChevronDown, LogOut, User, Settings } from "lucide-react";

interface AdminHeaderProps {
  userName?: string;
  notificationCount?: number;
}

export function AdminHeader({
  userName = "管理者",
  notificationCount = 0,
}: AdminHeaderProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="h-[56px] bg-white border-b border-gray-200 flex items-center justify-between px-[24px] sticky top-0 z-30">
      {/* left: logo (visible on mobile since sidebar is hidden) */}
      <div className="lg:hidden font-serif text-lg font-medium text-black tracking-tight pl-[40px]">
        Mobirio <span className="text-accent">Admin</span>
      </div>
      <div className="hidden lg:block" />

      {/* right */}
      <div className="flex items-center gap-[16px]">
        {/* notification bell */}
        <button className="relative p-[8px] hover:bg-gray-100 transition-colors" aria-label="通知">
          <Bell className="w-[20px] h-[20px] text-gray-600" />
          {notificationCount > 0 && (
            <span className="absolute top-[4px] right-[4px] w-[16px] h-[16px] bg-red-500 text-white text-[10px] font-medium flex items-center justify-center" style={{ borderRadius: "50%" }}>
              {notificationCount > 9 ? "9+" : notificationCount}
            </span>
          )}
        </button>

        {/* user dropdown */}
        <div ref={dropdownRef} className="relative">
          <button
            onClick={() => setDropdownOpen((v) => !v)}
            className="flex items-center gap-[8px] px-[8px] py-[4px] hover:bg-gray-100 transition-colors"
          >
            <div className="w-[32px] h-[32px] bg-accent/10 text-accent flex items-center justify-center text-sm font-medium" style={{ borderRadius: "50%" }}>
              {userName.charAt(0)}
            </div>
            <span className="text-sm font-sans text-gray-700 hidden sm:inline">
              {userName}
            </span>
            <ChevronDown className="w-[14px] h-[14px] text-gray-400" />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 top-full mt-[4px] w-[180px] bg-white border border-gray-200 shadow-lg z-50">
              <div className="py-[4px]">
                <button className="w-full text-left px-[16px] py-[10px] text-sm font-sans text-gray-700 hover:bg-gray-50 flex items-center gap-[10px] transition-colors">
                  <User className="w-[16px] h-[16px] text-gray-400" />
                  プロフィール
                </button>
                <button className="w-full text-left px-[16px] py-[10px] text-sm font-sans text-gray-700 hover:bg-gray-50 flex items-center gap-[10px] transition-colors">
                  <Settings className="w-[16px] h-[16px] text-gray-400" />
                  設定
                </button>
                <div className="border-t border-gray-100 my-[4px]" />
                <button className="w-full text-left px-[16px] py-[10px] text-sm font-sans text-red-600 hover:bg-red-50 flex items-center gap-[10px] transition-colors">
                  <LogOut className="w-[16px] h-[16px]" />
                  ログアウト
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

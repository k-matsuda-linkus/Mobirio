"use client";

import { useState } from "react";
import Link from "next/link";
import { User, Store, X, MapPin, Shield } from "lucide-react";

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-[70px] bg-white border-b border-gray-200">
      <div className="h-full px-[20px] md:px-[50px] flex items-center justify-between">
        <Link href="/" className="font-serif text-xl tracking-wider">Mobirio</Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-[24px] text-sm">
          <Link href="/bikes" className="hover:text-accent transition-colors">バイクを探す</Link>
          <Link href="/vendors" className="hover:text-accent transition-colors">ショップを探す</Link>
          <div className="flex items-center gap-[12px] ml-[8px]">
            <Link
              href="/mypage"
              className="flex items-center gap-[6px] px-[14px] py-[7px] border border-gray-300 text-gray-700 hover:border-gray-500 hover:text-black transition-colors text-[13px]"
            >
              <User size={15} />
              マイページ
            </Link>
            <Link
              href="/vendor"
              className="flex items-center gap-[6px] px-[14px] py-[7px] bg-black text-white hover:bg-gray-800 transition-colors text-[13px]"
            >
              <Store size={15} />
              ベンダー管理
            </Link>
            <Link
              href="/dashboard"
              className="flex items-center gap-[6px] px-[14px] py-[7px] border border-gray-700 bg-gray-900 text-white hover:bg-gray-700 transition-colors text-[13px]"
            >
              <Shield size={15} />
              運営管理
            </Link>
          </div>
        </nav>

        {/* Mobile hamburger */}
        <button
          className="md:hidden p-[8px]"
          aria-label="メニュー"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? (
            <X size={22} />
          ) : (
            <>
              <span className="block w-[20px] h-[2px] bg-black mb-[4px]" />
              <span className="block w-[20px] h-[2px] bg-black mb-[4px]" />
              <span className="block w-[20px] h-[2px] bg-black" />
            </>
          )}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-white border-b border-gray-200 px-[20px] py-[16px] space-y-[12px]">
          <Link
            href="/bikes"
            className="block text-sm py-[8px] hover:text-accent transition-colors"
            onClick={() => setMobileOpen(false)}
          >
            バイクを探す
          </Link>
          <Link
            href="/vendors"
            className="flex items-center gap-[8px] text-sm py-[8px] hover:text-accent transition-colors"
            onClick={() => setMobileOpen(false)}
          >
            <MapPin size={16} />
            ショップを探す
          </Link>
          <Link
            href="/mypage"
            className="flex items-center gap-[8px] text-sm py-[8px] hover:text-accent transition-colors"
            onClick={() => setMobileOpen(false)}
          >
            <User size={16} />
            マイページ
          </Link>
          <Link
            href="/vendor"
            className="flex items-center gap-[8px] text-sm py-[8px] hover:text-accent transition-colors"
            onClick={() => setMobileOpen(false)}
          >
            <Store size={16} />
            ベンダー管理
          </Link>
          <Link
            href="/dashboard"
            className="flex items-center gap-[8px] text-sm py-[8px] hover:text-accent transition-colors"
            onClick={() => setMobileOpen(false)}
          >
            <Shield size={16} />
            運営管理
          </Link>
        </div>
      )}
    </header>
  );
}

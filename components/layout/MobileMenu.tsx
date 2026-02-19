'use client';

import Link from "next/link";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { PUBLIC_NAV_ITEMS } from "@/lib/constants";

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileMenu({ isOpen, onClose }: MobileMenuProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", duration: 0.3, ease: "easeInOut" }}
            className="absolute top-0 right-0 bottom-0 w-[300px] bg-white"
          >
            {/* Close Button */}
            <div className="flex items-center justify-between h-[70px] px-[24px] border-b border-gray-100">
              <span className="font-serif font-light text-xl tracking-wide">Mobirio</span>
              <button
                onClick={onClose}
                className="p-[8px] text-gray-600 hover:text-black transition-colors"
                aria-label="メニューを閉じる"
              >
                <X className="w-[24px] h-[24px]" />
              </button>
            </div>

            {/* Navigation Links */}
            <nav className="px-[24px] py-[24px]">
              <ul className="space-y-[4px]">
                {PUBLIC_NAV_ITEMS.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onClose}
                      className="block py-[12px] px-[16px] text-sm font-sans text-gray-600 hover:text-black hover:bg-gray-50 transition-colors"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            {/* Auth Buttons */}
            <div className="px-[24px] pt-[16px] border-t border-gray-100 mx-[24px] space-y-[12px]">
              <Link
                href="/login"
                onClick={onClose}
                className="block w-full text-center py-[12px] text-sm font-sans text-gray-600 border border-gray-200 hover:border-gray-400 transition-colors"
              >
                ログイン
              </Link>
              <Link
                href="/register"
                onClick={onClose}
                className="block w-full text-center py-[12px] text-sm font-sans bg-accent text-white hover:opacity-90 transition-opacity"
              >
                新規登録
              </Link>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

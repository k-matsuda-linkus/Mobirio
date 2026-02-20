"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Star } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { VENDOR_NAV_ITEMS } from "@/lib/constants";
import { getPinnedPages, togglePinPage } from "@/lib/vendor-nav";
import { useState, useEffect, useCallback } from "react";

interface SlidePanelProps {
  groupHref: string | null;
  onClose: () => void;
  onEnter?: () => void;
}

export function SlidePanel({ groupHref, onClose, onEnter }: SlidePanelProps) {
  const pathname = usePathname();
  const [pinnedPages, setPinnedPages] = useState<string[]>([]);

  useEffect(() => {
    setPinnedPages(getPinnedPages());
  }, [groupHref]);

  const handleTogglePin = useCallback((path: string) => {
    togglePinPage(path);
    setPinnedPages(getPinnedPages());
  }, []);

  const group = groupHref
    ? VENDOR_NAV_ITEMS.find((item) => item.href === groupHref)
    : null;

  const children = group?.children ?? [];

  return (
    <AnimatePresence>
      {groupHref && group && children.length > 0 && (
        <motion.div
          key="slide-panel"
          initial={{ x: -240 }}
          animate={{ x: 0 }}
          exit={{ x: -240 }}
          transition={{ type: "tween", duration: 0.2 }}
          className="fixed top-0 bottom-0 left-[60px] w-[240px] bg-white border-r border-gray-200 shadow-lg z-35 overflow-y-auto"
          style={{ zIndex: 35 }}
          onMouseEnter={onEnter}
          onMouseLeave={onClose}
        >
          <div className="px-[16px] py-[16px] border-b border-gray-100">
            <h3 className="text-sm font-medium text-gray-800">{group.label}</h3>
          </div>
          <nav className="p-[8px]">
            {children.map((child) => {
              const active =
                pathname === child.href || pathname.startsWith(child.href + "/");
              const isPinned = pinnedPages.includes(child.href);

              return (
                <div
                  key={child.href}
                  className="flex items-center group"
                >
                  <Link
                    href={child.href}
                    onClick={onClose}
                    className={
                      "flex-1 block px-[12px] py-[10px] text-sm transition-colors " +
                      (active
                        ? "text-accent font-medium bg-accent/5"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-50")
                    }
                  >
                    {child.label}
                  </Link>
                  <button
                    onClick={() => handleTogglePin(child.href)}
                    title={isPinned ? "ピン留め解除" : "ピン留め"}
                    className={
                      "p-[6px] transition-colors " +
                      (isPinned
                        ? "text-accent"
                        : "text-gray-300 opacity-0 group-hover:opacity-100 hover:text-gray-500")
                    }
                  >
                    <Star
                      className="w-[14px] h-[14px]"
                      fill={isPinned ? "currentColor" : "none"}
                    />
                  </button>
                </div>
              );
            })}
          </nav>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

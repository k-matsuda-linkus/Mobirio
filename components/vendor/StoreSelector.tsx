"use client";
import { useState } from "react";
import { Store } from "lucide-react";

interface StoreSelectorProps {
  stores: { id: string; name: string }[];
  selectedId: string;
  onChange: (id: string) => void;
}

export function StoreSelector({ stores, selectedId, onChange }: StoreSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const selected = stores.find((s) => s.id === selectedId);

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-[8px] border border-gray-300 px-[12px] py-[8px] text-sm bg-white hover:bg-gray-50"
      >
        <Store className="w-[16px] h-[16px] text-gray-400" />
        <span>{selected?.name ?? "店舗を選択"}</span>
        <svg className="w-[12px] h-[12px] text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full left-0 mt-[2px] bg-white border border-gray-200 shadow-lg z-20 min-w-[200px]">
            {stores.map((store) => (
              <button
                key={store.id}
                onClick={() => { onChange(store.id); setIsOpen(false); }}
                className={"w-full text-left px-[12px] py-[8px] text-sm hover:bg-gray-50 " +
                  (store.id === selectedId ? "bg-accent/5 text-accent font-medium" : "text-gray-700")}
              >
                {store.name}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

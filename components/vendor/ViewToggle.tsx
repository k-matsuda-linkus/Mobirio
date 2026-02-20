"use client";

import React from "react";

interface ViewToggleProps {
  views: { key: string; label: string; icon: React.ElementType }[];
  activeView: string;
  onChange: (key: string) => void;
}

export function ViewToggle({ views, activeView, onChange }: ViewToggleProps) {
  return (
    <div className="inline-flex border border-gray-300">
      {views.map((view) => {
        const Icon = view.icon;
        const isActive = view.key === activeView;
        return (
          <button
            key={view.key}
            type="button"
            onClick={() => onChange(view.key)}
            className={`inline-flex items-center gap-[6px] px-[10px] py-[6px] text-sm transition-colors ${
              isActive
                ? "bg-accent text-white"
                : "bg-white text-gray-600 hover:bg-gray-50"
            }`}
          >
            <Icon className="w-[16px] h-[16px]" />
            {view.label}
          </button>
        );
      })}
    </div>
  );
}

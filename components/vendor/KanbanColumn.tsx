"use client";

import React from "react";

interface KanbanColumnProps {
  title: string;
  color: string;
  count: number;
  children: React.ReactNode;
}

export type { KanbanColumnProps };

export function KanbanColumn({ title, color, count, children }: KanbanColumnProps) {
  return (
    <div className="flex-1 min-w-[200px] flex flex-col">
      <div
        className="border-t-[3px] px-[12px] py-[8px] bg-white"
        style={{ borderTopColor: color }}
      >
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">{title}</span>
          <span className="text-xs text-gray-500 bg-gray-100 px-[6px] py-[2px]">
            {count}
          </span>
        </div>
      </div>
      <div className="bg-surface p-[8px] space-y-[8px] flex-1">
        {children}
      </div>
    </div>
  );
}

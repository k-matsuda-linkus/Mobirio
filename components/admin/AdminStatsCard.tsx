"use client";

import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface AdminStatsCardProps {
  title: string;
  value: string;
  change?: string;
  icon?: React.ReactNode;
  iconBg?: string;
}

export function AdminStatsCard({
  title,
  value,
  change,
  icon,
  iconBg = "bg-accent/10",
}: AdminStatsCardProps) {
  const isPositive = change?.startsWith("+");
  const isNegative = change?.startsWith("-");
  const changeColor = isPositive
    ? "text-green-600"
    : isNegative
      ? "text-red-500"
      : "text-gray-500";

  return (
    <div className="bg-white border border-gray-200 p-[24px] hover:shadow-md transition-shadow duration-200 group">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-sans text-gray-500 truncate">{title}</p>
          <p className="text-2xl font-serif font-light mt-[8px]">{value}</p>
          {change && (
            <div className={`flex items-center gap-[4px] mt-[6px] ${changeColor}`}>
              {isPositive ? (
                <TrendingUp className="w-[14px] h-[14px]" />
              ) : isNegative ? (
                <TrendingDown className="w-[14px] h-[14px]" />
              ) : (
                <Minus className="w-[14px] h-[14px]" />
              )}
              <span className="text-xs font-sans font-medium">{change}</span>
              <span className="text-xs font-sans text-gray-400">前月比</span>
            </div>
          )}
        </div>
        {icon && (
          <div
            className={`w-[44px] h-[44px] flex items-center justify-center ${iconBg} text-accent shrink-0 ml-[16px] group-hover:scale-105 transition-transform duration-200`}
          >
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import React from "react";

interface KpiCardProps {
  icon: React.ElementType;
  label: string;
  value: number | string;
  unit?: string;
  comparison?: { label: string; diff: number; isPositive: boolean };
  subInfo?: string;
  href?: string;
  accentColor?: string;
}

export function KpiCard({
  icon: Icon,
  label,
  value,
  unit,
  comparison,
  subInfo,
  href,
  accentColor,
}: KpiCardProps) {
  const iconBg = accentColor
    ? { backgroundColor: `${accentColor}1A` }
    : undefined;
  const iconColor = accentColor || undefined;

  const content = (
    <div className="bg-white border border-gray-200 p-[20px] h-full transition-colors hover:border-gray-300">
      <div className="flex items-start gap-[12px]">
        <div
          className={`w-[40px] h-[40px] flex items-center justify-center shrink-0 ${
            !accentColor ? "bg-accent/10" : ""
          }`}
          style={iconBg}
        >
          <Icon
            className={iconColor ? "w-[24px] h-[24px]" : "w-[24px] h-[24px] text-accent"}
            style={iconColor ? { color: iconColor } : undefined}
          />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[12px] text-gray-400 mb-[4px]">{label}</p>
          <p className="text-[30px] font-medium">
            {value}
            {unit && (
              <span className="text-[14px] font-normal text-gray-500 ml-[4px]">
                {unit}
              </span>
            )}
          </p>
          {comparison && (
            <p className="text-[12px] mt-[4px]">
              <span className="text-gray-400 mr-[4px]">{comparison.label}</span>
              {comparison.diff === 0 ? (
                <span className="text-gray-400">→ 0</span>
              ) : (
                <span className={comparison.isPositive ? "text-green-600" : "text-red-600"}>
                  {comparison.diff > 0 ? "↑" : "↓"} {comparison.diff > 0 ? "+" : ""}{typeof comparison.diff === "number" && Math.abs(comparison.diff) >= 1000 ? Math.abs(comparison.diff).toLocaleString() : comparison.diff}
                </span>
              )}
            </p>
          )}
          {subInfo && (
            <p className="text-[11px] text-gray-400 mt-[4px]">{subInfo}</p>
          )}
        </div>
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block">
        {content}
      </Link>
    );
  }

  return content;
}

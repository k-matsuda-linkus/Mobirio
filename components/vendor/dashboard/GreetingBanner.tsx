"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { ja } from "date-fns/locale";

interface GreetingBannerProps {
  departureCount: number;
  returnCount: number;
}

function getGreeting(hour: number): string {
  if (hour < 12) return "おはようございます";
  if (hour < 17) return "こんにちは";
  return "お疲れさまです";
}

export function GreetingBanner({ departureCount, returnCount }: GreetingBannerProps) {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const timer = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(timer);
  }, []);

  if (!now) return null;

  const greeting = getGreeting(now.getHours());
  const dateStr = format(now, "yyyy年M月d日（E）HH:mm", { locale: ja });

  return (
    <div className="bg-gradient-to-r from-accent to-accent-light text-white p-[24px]">
      <p className="text-[24px] font-medium">{greeting}</p>
      <p className="text-[14px] mt-[4px] opacity-90">{dateStr}</p>
      <p className="text-[13px] mt-[8px] opacity-80">
        本日の出発 {departureCount}件 / 返却 {returnCount}件
      </p>
    </div>
  );
}

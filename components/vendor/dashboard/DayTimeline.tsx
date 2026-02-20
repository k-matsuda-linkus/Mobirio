"use client";

import Link from "next/link";

export interface TimelineEvent {
  time: string;
  type: "departure" | "return";
  vehicleName: string;
  customerName: string;
  reservationId: string;
}

interface DayTimelineProps {
  events: TimelineEvent[];
}

const HOURS = Array.from({ length: 13 }, (_, i) => i + 8); // 8:00〜20:00

export function DayTimeline({ events }: DayTimelineProps) {
  // 時刻のhour部分を取得
  const getHour = (time: string) => parseInt(time.split(":")[0], 10);

  // 時刻順ソート後、時間帯ごとにグループ化
  const sorted = [...events].sort((a, b) => a.time.localeCompare(b.time));
  const eventsByHour = new Map<number, TimelineEvent[]>();
  for (const ev of sorted) {
    const h = getHour(ev.time);
    if (!eventsByHour.has(h)) eventsByHour.set(h, []);
    eventsByHour.get(h)!.push(ev);
  }

  return (
    <div className="bg-white border border-gray-200 p-[20px]">
      <h3 className="text-[16px] font-medium mb-[16px]">本日のスケジュール</h3>
      <div className="relative">
        {HOURS.map((hour) => {
          const hourEvents = eventsByHour.get(hour) || [];
          const label = `${String(hour).padStart(2, "0")}:00`;
          return (
            <div
              key={hour}
              className="flex items-start min-h-[36px] border-b border-gray-100 last:border-b-0"
            >
              <span className="text-[12px] text-gray-400 w-[48px] shrink-0 pt-[8px]">
                {label}
              </span>
              <div className="flex-1 py-[6px]">
                {hourEvents.map((ev, idx) => {
                  const isDeparture = ev.type === "departure";
                  const dotColor = isDeparture ? "bg-accent" : "bg-sub";
                  const textColor = isDeparture
                    ? "text-accent"
                    : "text-sub";
                  return (
                    <div
                      key={`${ev.reservationId}-${idx}`}
                      className="flex items-center gap-[12px] mb-[4px] last:mb-0"
                    >
                      <span
                        className={`w-[8px] h-[8px] ${dotColor} shrink-0`}
                      />
                      <span className={`text-[13px] font-medium ${textColor} w-[48px] shrink-0`}>
                        {ev.time}
                      </span>
                      <span className={`text-[12px] px-[8px] py-[1px] shrink-0 ${isDeparture ? "bg-accent/10 text-accent" : "bg-sub/10 text-sub"}`}>
                        {isDeparture ? "出発" : "返却"}
                      </span>
                      <span className="text-[13px] font-medium text-gray-800 w-[120px] shrink-0">
                        {ev.vehicleName}
                      </span>
                      <span className="text-[13px] text-gray-500">
                        {ev.customerName}
                      </span>
                      <Link
                        href={`/vendor/reservations/${ev.reservationId}`}
                        className="text-[12px] text-accent hover:underline ml-auto shrink-0"
                      >
                        {ev.reservationId}
                      </Link>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

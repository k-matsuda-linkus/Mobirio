"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { VendorPageHeader } from "@/components/vendor/VendorPageHeader";
import { StoreSelector } from "@/components/vendor/StoreSelector";

/* ------------------------------------------------------------------ */
/*  Types & Helpers                                                    */
/* ------------------------------------------------------------------ */

interface Vehicle {
  id: string;
  name: string;
  registrationNo: string;
}

interface ReservationBlock {
  id: string;
  vehicleId: string;
  customerName: string;
  startDate: string; // YYYY-MM-DD
  startTime: string;
  endDate: string;   // YYYY-MM-DD
  endTime: string;
}

const MOCK_STORES = [
  { id: "s1", name: "宮崎橘通り店" },
  { id: "s2", name: "宮崎空港店" },
];

const HOLIDAYS = new Set(["2025-07-21"]); // Mock holiday: 海の日

const DAY_NAMES = ["日", "月", "火", "水", "木", "金", "土"];
const COL_WIDTH = 80; // px per day column
const LEFT_COL_WIDTH = 180; // px for vehicle column

function formatDate(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

function dateLabel(d: Date): string {
  return `${d.getMonth() + 1}/${d.getDate()}(${DAY_NAMES[d.getDay()]})`;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function VendorCalendarPage() {
  const [selectedStore, setSelectedStore] = useState("s1");
  const [startOffset, setStartOffset] = useState(0); // days from base date
  const scrollRef = useRef<HTMLDivElement>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [reservations, setReservations] = useState<ReservationBlock[]>([]);
  const [loading, setLoading] = useState(true);

  const baseDate = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  }, []);

  const days = useMemo(() => {
    const arr: Date[] = [];
    for (let i = 0; i < 30; i++) {
      const d = new Date(baseDate);
      d.setDate(d.getDate() + startOffset + i);
      arr.push(d);
    }
    return arr;
  }, [baseDate, startOffset]);

  // API fetchでデータ取得
  useEffect(() => {
    setLoading(true);
    const startDate = formatDate(days[0]);
    const endDate = formatDate(days[29]);

    Promise.all([
      fetch("/api/vendor/bikes").then((r) => r.ok ? r.json() : null),
      fetch(`/api/vendor/reservations?startDate=${startDate}&endDate=${endDate}`).then((r) => r.ok ? r.json() : null),
    ])
      .then(([bikesJson, rsvJson]) => {
        if (bikesJson?.data) {
          const bikeData = Array.isArray(bikesJson.data) ? bikesJson.data : [];
          setVehicles(bikeData.map((b: any) => ({
            id: b.id,
            name: b.name || b.model_name || "",
            registrationNo: b.registration_number || "",
          })));
        }
        if (rsvJson?.data) {
          const rsvData = Array.isArray(rsvJson.data) ? rsvJson.data : [];
          setReservations(rsvData.map((r: any) => ({
            id: r.id,
            vehicleId: r.bike_id || "",
            customerName: r.user_name || r.customerName || "顧客",
            startDate: r.start_datetime ? r.start_datetime.slice(0, 10) : "",
            startTime: r.start_datetime ? r.start_datetime.slice(11, 16) : "10:00",
            endDate: r.end_datetime ? r.end_datetime.slice(0, 10) : "",
            endTime: r.end_datetime ? r.end_datetime.slice(11, 16) : "10:00",
          })));
        }
      })
      .catch((err) => console.error("calendar fetch error:", err))
      .finally(() => setLoading(false));
  }, [days]);

  // Calculate the column span for a reservation block
  const getBlockPosition = (block: ReservationBlock) => {
    const start = new Date(block.startDate);
    const end = new Date(block.endDate);
    const firstDay = days[0];
    const lastDay = days[days.length - 1];

    // If block doesn't intersect with visible range, skip
    if (end < firstDay || start > lastDay) return null;

    const startCol = Math.max(0, Math.floor((start.getTime() - firstDay.getTime()) / (1000 * 60 * 60 * 24)));
    const endCol = Math.min(29, Math.floor((end.getTime() - firstDay.getTime()) / (1000 * 60 * 60 * 24)));
    const span = endCol - startCol + 1;

    return { startCol, span };
  };

  return (
    <div>
      <VendorPageHeader
        title="車両予約状況"
        breadcrumbs={[{ label: "車両予約状況" }]}
        actions={
          <StoreSelector
            stores={MOCK_STORES}
            selectedId={selectedStore}
            onChange={setSelectedStore}
          />
        }
      />

      {/* Navigation */}
      <div className="flex items-center gap-[12px] mb-[16px]">
        <button
          onClick={() => setStartOffset(startOffset - 30)}
          className="flex items-center gap-[4px] border border-gray-300 bg-white px-[12px] py-[8px] text-sm hover:bg-gray-50"
        >
          <ChevronLeft className="w-[14px] h-[14px]" />
          前の30日
        </button>
        <button
          onClick={() => setStartOffset(0)}
          className="border border-gray-300 bg-white px-[12px] py-[8px] text-sm hover:bg-gray-50"
        >
          今日
        </button>
        <button
          onClick={() => setStartOffset(startOffset + 30)}
          className="flex items-center gap-[4px] border border-gray-300 bg-white px-[12px] py-[8px] text-sm hover:bg-gray-50"
        >
          次の30日
          <ChevronRight className="w-[14px] h-[14px]" />
        </button>
        <span className="text-sm text-gray-500 ml-[8px]">
          {days[0] && `${days[0].getFullYear()}年${days[0].getMonth() + 1}月${days[0].getDate()}日`}
          {" ~ "}
          {days[29] && `${days[29].getFullYear()}年${days[29].getMonth() + 1}月${days[29].getDate()}日`}
        </span>
      </div>

      {loading ? (
        <div className="text-sm text-gray-500 py-[24px] text-center">読み込み中...</div>
      ) : vehicles.length === 0 ? (
        <div className="text-sm text-gray-400 py-[24px] text-center">車両データがありません</div>
      ) : (
        /* Gantt Chart */
        <div className="bg-white border border-gray-200 overflow-hidden">
          <div className="flex">
            {/* Fixed left column */}
            <div className="shrink-0 border-r border-gray-200" style={{ width: LEFT_COL_WIDTH }}>
              {/* Header cell */}
              <div className="h-[48px] bg-gray-50 border-b border-gray-200 flex items-center px-[12px]">
                <span className="text-xs font-medium text-gray-500">車両</span>
              </div>
              {/* Vehicle rows */}
              {vehicles.map((vehicle) => (
                <div
                  key={vehicle.id}
                  className="h-[60px] border-b border-gray-100 flex items-center gap-[8px] px-[12px]"
                >
                  <div className="w-[36px] h-[36px] bg-gray-200 shrink-0 flex items-center justify-center text-[10px] text-gray-400">
                    IMG
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{vehicle.name}</p>
                    <p className="text-[10px] text-gray-400 truncate">{vehicle.registrationNo}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Scrollable date columns */}
            <div className="flex-1 overflow-x-auto" ref={scrollRef}>
              <div style={{ width: COL_WIDTH * 30 }}>
                {/* Date headers */}
                <div className="flex h-[48px] border-b border-gray-200">
                  {days.map((d, i) => {
                    const dateStr = formatDate(d);
                    const isHoliday = HOLIDAYS.has(dateStr);
                    const isSunday = d.getDay() === 0;
                    const isSaturday = d.getDay() === 6;
                    let headerBg = "bg-gray-50";
                    let textColor = "text-gray-500";
                    if (isHoliday || isSunday) {
                      headerBg = "bg-red-50";
                      textColor = "text-red-500";
                    } else if (isSaturday) {
                      headerBg = "bg-blue-50";
                      textColor = "text-blue-500";
                    }

                    return (
                      <div
                        key={i}
                        className={`shrink-0 flex items-center justify-center border-r border-gray-200 text-xs ${headerBg} ${textColor}`}
                        style={{ width: COL_WIDTH }}
                      >
                        {dateLabel(d)}
                      </div>
                    );
                  })}
                </div>

                {/* Vehicle rows with reservation blocks */}
                {vehicles.map((vehicle) => {
                  const vehicleBlocks = reservations.filter((r) => r.vehicleId === vehicle.id);
                  return (
                    <div key={vehicle.id} className="relative h-[60px] border-b border-gray-100 flex">
                      {/* Background columns */}
                      {days.map((d, i) => {
                        const dateStr = formatDate(d);
                        const isHoliday = HOLIDAYS.has(dateStr);
                        const isSunday = d.getDay() === 0;
                        let bgClass = "";
                        if (isHoliday || isSunday) bgClass = "bg-red-50/30";
                        return (
                          <div
                            key={i}
                            className={`shrink-0 border-r border-gray-100 ${bgClass}`}
                            style={{ width: COL_WIDTH }}
                          />
                        );
                      })}

                      {/* Reservation blocks overlay */}
                      {vehicleBlocks.map((block) => {
                        const pos = getBlockPosition(block);
                        if (!pos) return null;
                        return (
                          <div
                            key={block.id}
                            className="absolute top-[8px] h-[44px] bg-accent/15 border border-accent/40 flex items-center px-[6px] overflow-hidden cursor-pointer hover:bg-accent/25 transition-colors"
                            style={{
                              left: pos.startCol * COL_WIDTH + 2,
                              width: pos.span * COL_WIDTH - 4,
                            }}
                            title={`${block.customerName} (${block.startTime}~${block.endTime})`}
                          >
                            <div className="min-w-0">
                              <p className="text-[10px] text-accent font-medium truncate">
                                {block.startTime}~{block.endTime}
                              </p>
                              <p className="text-xs text-gray-700 truncate">{block.customerName}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

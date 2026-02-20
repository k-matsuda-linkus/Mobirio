"use client";

import { KanbanColumn } from "@/components/vendor/KanbanColumn";
import { KanbanCard } from "@/components/vendor/KanbanCard";

interface KanbanItem {
  id: string;
  reservationNo: string;
  customerName: string;
  vehicleName: string;
  storeName: string;
  departureAt: string;
  returnAt: string;
  totalAmount: number;
  status: string;
}

export type { KanbanItem };

const COLUMNS = [
  { key: "unconfirmed", title: "未確定", color: "#F59E0B" },
  { key: "confirmed", title: "確定済", color: "#10B981" },
  { key: "in_use", title: "利用中", color: "#3B82F6" },
  { key: "completed", title: "完了", color: "#6B7280" },
] as const;

function mapStatusToColumn(status: string): string {
  switch (status) {
    case "unconfirmed":
    case "pending":
      return "unconfirmed";
    case "confirmed":
      return "confirmed";
    case "in_use":
      return "in_use";
    case "completed":
    case "cancelled":
    case "no_show":
      return "completed";
    default:
      return "unconfirmed";
  }
}

interface KanbanBoardProps {
  items: KanbanItem[];
}

function isCurrentMonth(dateStr: string): boolean {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const parsed = new Date(dateStr.replace(/\//g, "-"));
  return parsed.getFullYear() === year && parsed.getMonth() === month;
}

export function KanbanBoard({ items }: KanbanBoardProps) {
  const grouped: Record<string, KanbanItem[]> = {
    unconfirmed: [],
    confirmed: [],
    in_use: [],
    completed: [],
  };

  items.forEach((item) => {
    const col = mapStatusToColumn(item.status);
    if (col === "completed" && !isCurrentMonth(item.returnAt)) return;
    grouped[col].push(item);
  });

  return (
    <div className="overflow-x-auto px-[16px] py-[12px]">
      <div className="flex gap-[12px] min-w-[800px]">
        {COLUMNS.map((col) => (
          <KanbanColumn
            key={col.key}
            title={col.title}
            color={col.color}
            count={grouped[col.key].length}
          >
            {grouped[col.key].map((item) => (
              <KanbanCard
                key={item.id}
                id={item.id}
                reservationNo={item.reservationNo}
                customerName={item.customerName}
                vehicleName={item.vehicleName}
                storeName={item.storeName}
                departureAt={item.departureAt}
                returnAt={item.returnAt}
                totalAmount={item.totalAmount}
              />
            ))}
          </KanbanColumn>
        ))}
      </div>
    </div>
  );
}

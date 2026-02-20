"use client";

import Link from "next/link";
import { Calendar } from "lucide-react";

interface KanbanCardProps {
  id: string;
  reservationNo: string;
  customerName: string;
  vehicleName: string;
  storeName: string;
  departureAt: string;
  returnAt: string;
  totalAmount: number;
}

export type { KanbanCardProps };

export function KanbanCard({
  id,
  reservationNo,
  customerName,
  vehicleName,
  storeName,
  departureAt,
  returnAt,
  totalAmount,
}: KanbanCardProps) {
  return (
    <div className="bg-white border border-gray-200 p-[12px] hover:shadow-md transition-shadow">
      <Link
        href={`/vendor/reservations/${id}`}
        className="text-accent font-mono text-xs hover:underline"
      >
        {reservationNo}
      </Link>
      <p className="text-sm mt-[4px]">{customerName}</p>
      <div className="mt-[6px]">
        <p className="text-sm font-medium">{vehicleName}</p>
        <p className="text-xs text-gray-400">{storeName}</p>
      </div>
      <div className="flex items-center gap-[4px] mt-[6px] text-xs text-gray-500">
        <Calendar className="w-[12px] h-[12px]" />
        <span>{departureAt} ~ {returnAt}</span>
      </div>
      <div className="text-right mt-[8px]">
        <span className="text-sm font-medium">&yen;{totalAmount.toLocaleString()}</span>
      </div>
    </div>
  );
}

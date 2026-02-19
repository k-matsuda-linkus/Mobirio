"use client";
import { RESERVATION_STATUSES } from "@/lib/constants";

type Reservation = {
  id: string;
  user_name: string;
  bike_name: string;
  start_date: string;
  end_date: string;
  status: string;
  amount: number;
};

type Props = {
  reservations: Reservation[];
};

function StatusBadge({ status }: { status: string }) {
  const found = RESERVATION_STATUSES.find((s) => s.value === status);
  return (
    <span className={"inline-block px-[8px] py-[2px] text-xs font-medium " + (found?.color ?? "bg-gray-100 text-gray-500")}>
      {found?.label ?? status}
    </span>
  );
}

export default function VendorReservationTable({ reservations }: Props) {
  if (reservations.length === 0) {
    return <p className="py-[40px] text-center text-sm text-gray-400">予約はまだありません</p>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[700px] text-sm">
        <thead>
          <tr className="border-b border-gray-100">
            <th className="py-[10px] text-left text-xs font-medium text-gray-400 uppercase">予約ID</th>
            <th className="py-[10px] text-left text-xs font-medium text-gray-400 uppercase">顧客名</th>
            <th className="py-[10px] text-left text-xs font-medium text-gray-400 uppercase">バイク</th>
            <th className="py-[10px] text-left text-xs font-medium text-gray-400 uppercase">期間</th>
            <th className="py-[10px] text-left text-xs font-medium text-gray-400 uppercase">ステータス</th>
            <th className="py-[10px] text-right text-xs font-medium text-gray-400 uppercase">金額</th>
          </tr>
        </thead>
        <tbody>
          {reservations.map((r) => (
            <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50/50">
              <td className="py-[10px] font-mono text-xs text-gray-500">{r.id.slice(0, 8)}</td>
              <td className="py-[10px] text-gray-700">{r.user_name}</td>
              <td className="py-[10px] text-gray-700">{r.bike_name}</td>
              <td className="py-[10px] text-gray-500">{r.start_date} ~ {r.end_date}</td>
              <td className="py-[10px]"><StatusBadge status={r.status} /></td>
              <td className="py-[10px] text-right font-mono">{r.amount.toLocaleString()}円</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

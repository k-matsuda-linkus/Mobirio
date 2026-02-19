import Link from "next/link";
import { mockReservations, type ReservationStatus } from "@/lib/mock/reservations";

interface Props {
  params: Promise<{ id: string }>;
}

const statusLabels: Record<ReservationStatus, string> = {
  pending: "申請中",
  confirmed: "確定",
  in_use: "利用中",
  completed: "完了",
  cancelled: "キャンセル",
  no_show: "ノーショー",
};

const statusColors: Record<ReservationStatus, string> = {
  pending: "bg-gray-200 text-gray-700",
  confirmed: "bg-[#2D7D6F]/10 text-[#2D7D6F]",
  in_use: "bg-black text-white",
  completed: "bg-gray-100 text-gray-500",
  cancelled: "bg-gray-100 text-gray-400",
  no_show: "bg-gray-300 text-gray-600",
};

export default async function ReservationDetailPage({ params }: Props) {
  const { id } = await params;
  const reservation = mockReservations.find((r) => r.id === id) || mockReservations[0];

  const timeline = [
    { label: "予約作成", date: reservation.created_at, done: true },
    { label: "確定", date: reservation.status !== "pending" ? reservation.created_at : null, done: reservation.status !== "pending" && reservation.status !== "cancelled" },
    { label: "利用開始", date: reservation.status === "in_use" || reservation.status === "completed" ? reservation.start_datetime : null, done: reservation.status === "in_use" || reservation.status === "completed" },
    { label: "返却完了", date: reservation.status === "completed" ? reservation.end_datetime : null, done: reservation.status === "completed" },
  ];

  const isCancellable = reservation.status === "pending" || reservation.status === "confirmed";
  const isReviewable = reservation.status === "completed";

  return (
    <div>
      <Link href="/mypage/reservations" className="text-sm text-gray-500 hover:text-accent transition-colors">
        &larr; 予約一覧に戻る
      </Link>

      <h1 className="mt-[16px] font-serif text-2xl md:text-3xl font-light">予約詳細</h1>

      <div className="mt-[24px] border border-gray-200 p-[24px]">
        <div className="flex flex-col sm:flex-row gap-[20px]">
          <div className="w-full sm:w-[200px] h-[130px] bg-gray-100 flex items-center justify-center text-sm text-gray-400 shrink-0">
            {reservation.bikeName}
          </div>
          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-medium">{reservation.bikeName}</h2>
                <p className="text-sm text-gray-500 mt-[4px]">{reservation.vendorName}</p>
              </div>
              <span className={`px-[12px] py-[4px] text-xs ${statusColors[reservation.status]}`}>
                {statusLabels[reservation.status]}
              </span>
            </div>
            <div className="mt-[16px] grid grid-cols-2 gap-[12px] text-sm">
              <div>
                <p className="text-gray-400 text-xs">利用開始</p>
                <p>{reservation.start_datetime}</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs">返却日</p>
                <p>{reservation.end_datetime}</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs">予約ID</p>
                <p className="font-mono text-xs">{reservation.id}</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs">予約日</p>
                <p>{reservation.created_at}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {(reservation.status === "confirmed" || reservation.status === "in_use") && (
        <div className="mt-[24px] border border-gray-200 p-[24px]">
          <h3 className="font-serif text-base mb-[16px]">受取用QRコード</h3>
          <div className="w-[160px] h-[160px] bg-gray-100 flex items-center justify-center text-sm text-gray-400 mx-auto">
            QRコード
          </div>
          <p className="mt-[12px] text-center text-xs text-gray-500">店舗でこのQRコードをご提示ください</p>
        </div>
      )}

      <div className="mt-[24px] border border-gray-200 p-[24px]">
        <h3 className="font-serif text-base mb-[16px]">料金内訳</h3>
        <div className="space-y-[8px] text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">基本料金</span>
            <span>&yen;{reservation.base_amount.toLocaleString()}</span>
          </div>
          {reservation.option_amount > 0 && (
            <div className="flex justify-between">
              <span className="text-gray-500">オプション</span>
              <span>&yen;{reservation.option_amount.toLocaleString()}</span>
            </div>
          )}
          {reservation.cdw_amount > 0 && (
            <div className="flex justify-between">
              <span className="text-gray-500">CDW（車両補償）</span>
              <span>&yen;{reservation.cdw_amount.toLocaleString()}</span>
            </div>
          )}
          {reservation.noc_amount > 0 && (
            <div className="flex justify-between">
              <span className="text-gray-500">NOC（営業補償）</span>
              <span>&yen;{reservation.noc_amount.toLocaleString()}</span>
            </div>
          )}
          <div className="pt-[8px] border-t border-gray-200 flex justify-between font-medium">
            <span>合計</span>
            <span>&yen;{reservation.total_amount.toLocaleString()}</span>
          </div>
        </div>
      </div>

      <div className="mt-[24px] border border-gray-200 p-[24px]">
        <h3 className="font-serif text-base mb-[16px]">予約タイムライン</h3>
        <div className="space-y-[16px]">
          {timeline.map((step, i) => (
            <div key={i} className="flex items-start gap-[12px]">
              <div className={`w-[10px] h-[10px] mt-[4px] shrink-0 ${step.done ? "bg-accent" : "bg-gray-200"}`} />
              <div>
                <p className={`text-sm ${step.done ? "font-medium" : "text-gray-400"}`}>{step.label}</p>
                {step.date && <p className="text-xs text-gray-400 mt-[2px]">{step.date}</p>}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-[24px] flex gap-[12px]">
        {isCancellable && (
          <button className="px-[24px] py-[12px] bg-status-cancelled text-white text-sm hover:opacity-90 transition-opacity">
            キャンセルする
          </button>
        )}
        {isReviewable && (
          <Link
            href="/mypage/reviews"
            className="px-[24px] py-[12px] bg-accent text-white text-sm hover:opacity-90 transition-opacity"
          >
            レビューを書く
          </Link>
        )}
      </div>
    </div>
  );
}

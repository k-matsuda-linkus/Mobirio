import Link from "next/link";
import { Star } from "lucide-react";

const HISTORY = [
  { id: "rsv-010", bike: "Honda PCX 160", vendor: "サンシャインモータース宮崎", date: "2025/01/10 〜 2025/01/11", amount: 6000, rating: 4.5, reviewed: true },
  { id: "rsv-009", bike: "Kawasaki Ninja 400", vendor: "青島バイクレンタル", date: "2024/12/20 〜 2024/12/22", amount: 26400, rating: 5.0, reviewed: true },
  { id: "rsv-008", bike: "Yamaha MT-09", vendor: "ライドパーク日南", date: "2024/12/05 〜 2024/12/06", amount: 17200, rating: null, reviewed: false },
  { id: "rsv-007", bike: "Suzuki Address 125", vendor: "サンシャインモータース宮崎", date: "2024/11/15 〜 2024/11/15", amount: 3500, rating: 4.0, reviewed: true },
  { id: "rsv-006", bike: "Honda CB400SF", vendor: "えびのモーターサイクル", date: "2024/10/20 〜 2024/10/21", amount: 18900, rating: 3.5, reviewed: true },
];

export default function HistoryPage() {
  return (
    <div>
      <h1 className="font-serif text-2xl font-light text-black mb-[8px]">利用履歴</h1>
      <p className="text-sm font-sans text-gray-500 mb-[24px]">過去のレンタル履歴</p>

      {HISTORY.length === 0 ? (
        <div className="text-center py-[80px]">
          <p className="text-sm font-sans text-gray-400">利用履歴はまだありません</p>
        </div>
      ) : (
        <div className="space-y-[12px]">
          {HISTORY.map((h) => (
            <div key={h.id} className="bg-white border border-gray-100 p-[20px] hover:border-gray-200 transition-colors">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-[12px]">
                <div className="flex-1">
                  <div className="flex items-center gap-[12px] mb-[6px]">
                    <p className="text-sm font-sans font-medium text-black">{h.bike}</p>
                    {h.rating && (
                      <div className="flex items-center gap-[4px]">
                        <Star className="w-[14px] h-[14px] text-yellow-500 fill-yellow-500" />
                        <span className="text-xs font-sans text-gray-600">{h.rating}</span>
                      </div>
                    )}
                  </div>
                  <p className="text-xs font-sans text-gray-500">{h.vendor}</p>
                  <p className="text-xs font-sans text-gray-400 mt-[4px]">{h.date}</p>
                </div>
                <div className="flex items-center gap-[16px]">
                  <p className="text-sm font-sans font-medium text-black">¥{h.amount.toLocaleString()}</p>
                  <div className="flex gap-[8px]">
                    <Link
                      href={`/mypage/reservations/${h.id}`}
                      className="px-[12px] py-[6px] text-xs font-sans border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
                    >
                      詳細
                    </Link>
                    {!h.reviewed && (
                      <Link
                        href="/mypage/reviews"
                        className="px-[12px] py-[6px] text-xs font-sans bg-accent text-white hover:opacity-90 transition-opacity"
                      >
                        レビュー
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

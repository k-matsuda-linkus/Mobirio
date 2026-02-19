import VendorStatsCard from "@/components/vendor/VendorStatsCard";
import { ReportChart } from "@/components/admin/ReportChart";

const monthlyReservations = [
  { label: "8月", value: 30 },
  { label: "9月", value: 26 },
  { label: "10月", value: 32 },
  { label: "11月", value: 25 },
  { label: "12月", value: 22 },
  { label: "1月", value: 28 },
];

const statusBreakdown = [
  { status: "完了", count: 18, pct: "64.3%" },
  { status: "確認済", count: 5, pct: "17.9%" },
  { status: "利用中", count: 2, pct: "7.1%" },
  { status: "キャンセル", count: 2, pct: "7.1%" },
  { status: "ノーショー", count: 1, pct: "3.6%" },
];

const statusColors: Record<string, string> = {
  "完了": "bg-gray-100 text-gray-600",
  "確認済": "bg-[#2D7D6F]/10 text-[#2D7D6F]",
  "利用中": "bg-blue-50 text-blue-600",
  "キャンセル": "bg-red-50 text-red-600",
  "ノーショー": "bg-amber-50 text-amber-600",
};

export default function ReservationReportPage() {
  return (
    <div>
      <div className="mb-[24px]">
        <p className="text-xs text-gray-400 mb-[4px]">レポート &gt; 予約レポート</p>
        <h1 className="font-serif text-2xl font-light">予約レポート</h1>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-[16px] mb-[24px]">
        <VendorStatsCard title="今月の予約数" value="28" trend={{ value: 27.3, positive: true }} />
        <VendorStatsCard title="キャンセル率" value="7.1%" trend={{ value: 2.1, positive: false }} />
        <VendorStatsCard title="平均利用日数" value="2.3日" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-[24px] mb-[24px]">
        <ReportChart title="月別予約数" data={monthlyReservations} height={220} type="bar" />
        <ReportChart title="ステータス内訳" data={statusBreakdown.map((s) => ({ label: s.status, value: s.count }))} height={220} type="pie" />
      </div>
      <div className="bg-white border border-gray-100">
        <h3 className="px-[16px] py-[12px] text-sm font-medium text-gray-700 border-b border-gray-100">ステータス別内訳（今月）</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="px-[16px] py-[10px] text-left text-xs font-medium text-gray-500 uppercase">ステータス</th>
              <th className="px-[16px] py-[10px] text-right text-xs font-medium text-gray-500 uppercase">件数</th>
              <th className="px-[16px] py-[10px] text-right text-xs font-medium text-gray-500 uppercase">割合</th>
            </tr>
          </thead>
          <tbody>
            {statusBreakdown.map((s) => (
              <tr key={s.status} className="border-b border-gray-50">
                <td className="px-[16px] py-[10px]">
                  <span className={"inline-block px-[8px] py-[2px] text-xs " + (statusColors[s.status] || "bg-gray-100 text-gray-500")}>{s.status}</span>
                </td>
                <td className="px-[16px] py-[10px] text-right font-mono text-gray-600">{s.count}</td>
                <td className="px-[16px] py-[10px] text-right font-mono text-gray-500">{s.pct}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

import VendorStatsCard from "@/components/vendor/VendorStatsCard";
import { ReportChart } from "@/components/admin/ReportChart";

const monthlyCustomers = [
  { label: "8月", value: 22 },
  { label: "9月", value: 18 },
  { label: "10月", value: 25 },
  { label: "11月", value: 20 },
  { label: "12月", value: 16 },
  { label: "1月", value: 21 },
];

const topCustomers = [
  { name: "田中太郎", visits: 5, totalSpent: 75000, lastVisit: "2025-01-28" },
  { name: "佐藤花子", visits: 4, totalSpent: 48000, lastVisit: "2025-01-25" },
  { name: "鈴木一郎", visits: 3, totalSpent: 54000, lastVisit: "2025-01-20" },
  { name: "高橋美咲", visits: 3, totalSpent: 60000, lastVisit: "2025-01-15" },
  { name: "渡辺健太", visits: 2, totalSpent: 28000, lastVisit: "2025-01-10" },
  { name: "山本美優", visits: 2, totalSpent: 24000, lastVisit: "2025-01-05" },
];

export default function CustomerReportPage() {
  return (
    <div>
      <div className="mb-[24px]">
        <p className="text-xs text-gray-400 mb-[4px]">レポート &gt; 顧客レポート</p>
        <h1 className="font-serif text-2xl font-light">顧客レポート</h1>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-[16px] mb-[24px]">
        <VendorStatsCard title="総顧客数" value="86" trend={{ value: 8.5, positive: true }} />
        <VendorStatsCard title="リピート率" value="34.9%" trend={{ value: 2.3, positive: true }} />
        <VendorStatsCard title="顧客単価" value="¥16,071" trend={{ value: 3.2, positive: true }} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-[24px] mb-[24px]">
        <ReportChart title="月別ユニーク顧客数" data={monthlyCustomers} height={220} type="line" />
        <ReportChart title="リピート回数分布" data={[
          { label: "1回", value: 56 },
          { label: "2回", value: 18 },
          { label: "3回", value: 8 },
          { label: "4回以上", value: 4 },
        ]} height={220} type="pie" />
      </div>
      <div className="bg-white border border-gray-100">
        <h3 className="px-[16px] py-[12px] text-sm font-medium text-gray-700 border-b border-gray-100">上位顧客</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="px-[16px] py-[10px] text-left text-xs font-medium text-gray-500 uppercase">顧客名</th>
              <th className="px-[16px] py-[10px] text-right text-xs font-medium text-gray-500 uppercase">利用回数</th>
              <th className="px-[16px] py-[10px] text-right text-xs font-medium text-gray-500 uppercase">累計金額</th>
              <th className="px-[16px] py-[10px] text-right text-xs font-medium text-gray-500 uppercase">最終利用日</th>
            </tr>
          </thead>
          <tbody>
            {topCustomers.map((c) => (
              <tr key={c.name} className="border-b border-gray-50">
                <td className="px-[16px] py-[10px] text-gray-700">{c.name}</td>
                <td className="px-[16px] py-[10px] text-right font-mono text-gray-600">{c.visits}</td>
                <td className="px-[16px] py-[10px] text-right font-mono text-gray-700">¥{c.totalSpent.toLocaleString()}</td>
                <td className="px-[16px] py-[10px] text-right text-gray-500">{c.lastVisit}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

import VendorStatsCard from "@/components/vendor/VendorStatsCard";
import { ReportChart } from "@/components/admin/ReportChart";

const bikeUsage = [
  { name: "CB400SF", reservations: 12, utilization: 78, revenue: 180000 },
  { name: "PCX 125", reservations: 15, utilization: 85, revenue: 120000 },
  { name: "Ninja400", reservations: 8, utilization: 62, revenue: 144000 },
  { name: "レブル250", reservations: 10, utilization: 72, revenue: 100000 },
  { name: "MT-07", reservations: 6, utilization: 45, revenue: 90000 },
];

export default function BikeUsageReportPage() {
  return (
    <div>
      <div className="mb-[24px]">
        <p className="text-xs text-gray-400 mb-[4px]">レポート &gt; 車両稼働レポート</p>
        <h1 className="font-serif text-2xl font-light">車両稼働レポート</h1>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-[16px] mb-[24px]">
        <VendorStatsCard title="平均稼働率" value="68.4%" trend={{ value: 5.2, positive: true }} />
        <VendorStatsCard title="稼働台数" value="5 / 5台" />
        <VendorStatsCard title="最高稼働車両" value="PCX 125" subtitle="稼働率 85%" />
      </div>
      <div className="mb-[24px]">
        <ReportChart
          title="車両別稼働率"
          data={bikeUsage.map((b) => ({ label: b.name, value: b.utilization }))}
          height={220}
          type="bar"
        />
      </div>
      <div className="bg-white border border-gray-100">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="px-[16px] py-[12px] text-left text-xs font-medium text-gray-500 uppercase">車両名</th>
              <th className="px-[16px] py-[12px] text-right text-xs font-medium text-gray-500 uppercase">予約数</th>
              <th className="px-[16px] py-[12px] text-right text-xs font-medium text-gray-500 uppercase">稼働率</th>
              <th className="px-[16px] py-[12px] text-right text-xs font-medium text-gray-500 uppercase">売上</th>
            </tr>
          </thead>
          <tbody>
            {bikeUsage.map((b) => (
              <tr key={b.name} className="border-b border-gray-50">
                <td className="px-[16px] py-[12px] text-gray-700">{b.name}</td>
                <td className="px-[16px] py-[12px] text-right font-mono text-gray-600">{b.reservations}</td>
                <td className="px-[16px] py-[12px] text-right">
                  <div className="flex items-center justify-end gap-[8px]">
                    <div className="w-[80px] h-[6px] bg-gray-100">
                      <div className="h-full bg-[#2D7D6F]" style={{ width: `${b.utilization}%` }} />
                    </div>
                    <span className="font-mono text-gray-600 w-[40px] text-right">{b.utilization}%</span>
                  </div>
                </td>
                <td className="px-[16px] py-[12px] text-right font-mono text-gray-700">¥{b.revenue.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

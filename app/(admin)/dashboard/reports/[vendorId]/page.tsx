import { AdminPageLayout } from '@/components/admin/AdminPageLayout';
import { mockVendors } from '@/lib/mock/vendors';

export default async function AdminVendorReportPage({ params }: { params: Promise<{ vendorId: string }> }) {
  const { vendorId } = await params;
  const vendor = mockVendors.find((v) => v.id === vendorId) || mockVendors[0];

  const mockData = [
    { date: '2025-01-01', revenue: 45000, count: 5 },
    { date: '2025-01-02', revenue: 32000, count: 3 },
    { date: '2025-01-03', revenue: 58000, count: 6 },
    { date: '2025-01-04', revenue: 41000, count: 4 },
    { date: '2025-01-05', revenue: 67000, count: 7 },
  ];

  return (
    <AdminPageLayout title={`${vendor.name} レポート`} subtitle="ベンダー別レポート">
      <div className="grid md:grid-cols-4 gap-[16px] mb-[40px]">
        {[
          { label: '売上合計', value: '¥243,000' },
          { label: '予約数', value: '25' },
          { label: '稼働率', value: '72%' },
          { label: '平均単価', value: '¥9,720' },
        ].map((s) => (
          <div key={s.label} className="border border-gray-100 bg-white p-[20px]">
            <p className="text-xs text-gray-400">{s.label}</p>
            <p className="text-2xl font-light mt-[4px]">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white border border-gray-100 p-[24px]">
        <h2 className="font-serif font-light text-lg mb-[16px]">日別売上</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-xs text-gray-400 text-left">
              <th className="py-[10px]">日付</th>
              <th className="py-[10px] text-right">売上</th>
              <th className="py-[10px] text-right">件数</th>
            </tr>
          </thead>
          <tbody>
            {mockData.map((d) => (
              <tr key={d.date} className="border-b border-gray-50">
                <td className="py-[10px]">{d.date}</td>
                <td className="py-[10px] text-right font-medium">¥{d.revenue.toLocaleString()}</td>
                <td className="py-[10px] text-right">{d.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminPageLayout>
  );
}

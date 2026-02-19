import Link from "next/link";

const reports = [
  { href: "/vendor/reports/sales", label: "売上レポート", desc: "期間別の売上集計" },
  { href: "/vendor/reports/reservations", label: "予約レポート", desc: "予約数・キャンセル率" },
  { href: "/vendor/reports/bikes", label: "車両稼働レポート", desc: "車両ごとの稼働率" },
  { href: "/vendor/reports/customers", label: "顧客レポート", desc: "リピート率・顧客分析" },
];

export default function VendorReportsPage() {
  return (
    <div>
      <h1 className="font-serif text-2xl font-light mb-[24px]">レポート</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-[16px]">
        {reports.map((r) => (
          <Link key={r.href} href={r.href} className="block bg-white border border-gray-100 p-[24px] hover:border-gray-300 transition-colors">
            <h2 className="font-serif text-lg">{r.label}</h2>
            <p className="mt-[4px] text-sm text-gray-400">{r.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}

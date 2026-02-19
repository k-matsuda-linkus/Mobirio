const customers = [
  { id: "1", name: "田中太郎", email: "tanaka@example.com", visits: 3, lastVisit: "2026-01-28" },
  { id: "2", name: "鈴木花子", email: "suzuki@example.com", visits: 1, lastVisit: "2026-02-01" },
];

export default function VendorCustomersPage() {
  return (
    <div>
      <h1 className="font-serif text-2xl font-light mb-[24px]">顧客一覧</h1>
      <div className="bg-white border border-gray-100">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-gray-100 text-left text-xs text-gray-400 uppercase">
            <th className="px-[16px] py-[12px]">名前</th><th className="px-[16px] py-[12px]">メール</th><th className="px-[16px] py-[12px]">利用回数</th><th className="px-[16px] py-[12px]">最終利用日</th>
          </tr></thead>
          <tbody>{customers.map((c) => (
            <tr key={c.id} className="border-b border-gray-50">
              <td className="px-[16px] py-[12px] font-medium">{c.name}</td>
              <td className="px-[16px] py-[12px] text-gray-500">{c.email}</td>
              <td className="px-[16px] py-[12px]">{c.visits}回</td>
              <td className="px-[16px] py-[12px] text-gray-500">{c.lastVisit}</td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </div>
  );
}

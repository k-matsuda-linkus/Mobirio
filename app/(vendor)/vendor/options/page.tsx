const options = [
  { id: "1", name: "ヘルメット（フルフェイス）", category: "ヘルメット", price: 500 },
  { id: "2", name: "ヘルメット（ジェット）", category: "ヘルメット", price: 300 },
  { id: "3", name: "グローブ", category: "グローブ", price: 200 },
  { id: "4", name: "U字ロック", category: "ロック", price: 300 },
];

export default function VendorOptionsPage() {
  return (
    <div>
      <h1 className="font-serif text-2xl font-light mb-[24px]">オプション管理</h1>
      <div className="bg-white border border-gray-100">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-gray-100 text-left text-xs text-gray-400 uppercase">
            <th className="px-[16px] py-[12px]">オプション名</th><th className="px-[16px] py-[12px]">カテゴリ</th><th className="px-[16px] py-[12px]">料金</th>
          </tr></thead>
          <tbody>{options.map((o) => (
            <tr key={o.id} className="border-b border-gray-50">
              <td className="px-[16px] py-[12px] font-medium">{o.name}</td>
              <td className="px-[16px] py-[12px] text-gray-500">{o.category}</td>
              <td className="px-[16px] py-[12px]">¥{o.price.toLocaleString()}/回</td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </div>
  );
}

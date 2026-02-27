"use client";

import { useState, useEffect } from "react";

interface OptionItem {
  id: string;
  name: string;
  category: string;
  price_per_day: number | null;
  price_per_use: number | null;
}

export default function VendorOptionsPage() {
  const [options, setOptions] = useState<OptionItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/vendor/options")
      .then((res) => (res.ok ? res.json() : Promise.reject("API error")))
      .then((json) => setOptions(json.data || []))
      .catch((err) => console.error("オプション一覧の取得に失敗:", err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-[24px]">読み込み中...</div>;

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
              <td className="px-[16px] py-[12px]">
                {o.price_per_day != null
                  ? `¥${o.price_per_day.toLocaleString()}/日`
                  : o.price_per_use != null
                    ? `¥${o.price_per_use.toLocaleString()}/回`
                    : "-"}
              </td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </div>
  );
}

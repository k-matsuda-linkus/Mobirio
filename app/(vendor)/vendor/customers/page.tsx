"use client";

import { useState, useEffect } from "react";

interface Customer {
  id: string;
  name: string;
  email: string;
  total_rentals: number;
  last_rental: string;
}

export default function VendorCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/vendor/customers")
      .then((res) => (res.ok ? res.json() : Promise.reject("API error")))
      .then((json) => setCustomers(json.data || []))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-[24px]">読み込み中...</div>;

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
              <td className="px-[16px] py-[12px]">{c.total_rentals}回</td>
              <td className="px-[16px] py-[12px] text-gray-500">{c.last_rental}</td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </div>
  );
}

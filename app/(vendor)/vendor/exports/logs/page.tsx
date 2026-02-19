"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { VendorPageHeader } from "@/components/vendor/VendorPageHeader";

interface LogRow {
  id: string;
  loginId: string;
  ipAddress: string;
  userAgent: string;
  loginAt: string;
}

const MOCK_LOGS: LogRow[] = [
  {
    id: "log-001",
    loginId: "admin@miyazaki-tachibana.co.jp",
    ipAddress: "192.168.1.100",
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0",
    loginAt: "2026/02/14 09:15:32",
  },
  {
    id: "log-002",
    loginId: "staff01@miyazaki-tachibana.co.jp",
    ipAddress: "192.168.1.101",
    userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_2) Safari/605.1.15",
    loginAt: "2026/02/14 08:45:10",
  },
  {
    id: "log-003",
    loginId: "admin@miyazaki-airport.co.jp",
    ipAddress: "10.0.0.55",
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Firefox/121.0",
    loginAt: "2026/02/13 18:30:44",
  },
  {
    id: "log-004",
    loginId: "staff02@miyazaki-tachibana.co.jp",
    ipAddress: "192.168.1.102",
    userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) Safari/604.1",
    loginAt: "2026/02/13 14:22:18",
  },
  {
    id: "log-005",
    loginId: "admin@miyazaki-tachibana.co.jp",
    ipAddress: "192.168.1.100",
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0",
    loginAt: "2026/02/13 09:05:55",
  },
];

export default function VendorLogsExportPage() {
  const [dateFrom, setDateFrom] = useState("2026-02-01");
  const [dateTo, setDateTo] = useState("2026-02-14");

  const inputClass =
    "border border-gray-300 px-[10px] py-[6px] text-sm focus:outline-none focus:border-accent";

  return (
    <div>
      <VendorPageHeader
        title="ログ出力"
        breadcrumbs={[{ label: "データ出力" }, { label: "ログ出力" }]}
      />

      {/* Filters */}
      <div className="bg-white border border-gray-200 p-[16px] mb-[16px]">
        <div className="flex flex-wrap items-end gap-[16px]">
          <div>
            <label className="block text-xs text-gray-500 mb-[4px]">期間</label>
            <div className="flex items-center gap-[8px]">
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className={inputClass + " w-[170px]"}
              />
              <span className="text-sm text-gray-400">〜</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className={inputClass + " w-[170px]"}
              />
            </div>
          </div>
          <button className="flex items-center gap-[6px] bg-accent text-white px-[16px] py-[7px] text-sm hover:bg-accent/90">
            <Download className="w-[14px] h-[14px]" />
            CSV出力
          </button>
        </div>
      </div>

      {/* Preview table */}
      <div className="bg-white border border-gray-200 overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-[12px] py-[10px] text-left text-xs font-medium text-gray-500 whitespace-nowrap">ログインID</th>
              <th className="px-[12px] py-[10px] text-left text-xs font-medium text-gray-500 whitespace-nowrap">IPアドレス</th>
              <th className="px-[12px] py-[10px] text-left text-xs font-medium text-gray-500 whitespace-nowrap">ユーザーエージェント</th>
              <th className="px-[12px] py-[10px] text-left text-xs font-medium text-gray-500 whitespace-nowrap">ログイン日時</th>
            </tr>
          </thead>
          <tbody>
            {MOCK_LOGS.map((row) => (
              <tr key={row.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="px-[12px] py-[10px] text-sm text-gray-700 whitespace-nowrap">{row.loginId}</td>
                <td className="px-[12px] py-[10px] text-sm text-gray-700 font-mono text-xs whitespace-nowrap">{row.ipAddress}</td>
                <td className="px-[12px] py-[10px] text-sm text-gray-500 text-xs max-w-[400px] truncate">{row.userAgent}</td>
                <td className="px-[12px] py-[10px] text-sm text-gray-700 whitespace-nowrap">{row.loginAt}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

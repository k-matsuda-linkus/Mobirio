"use client";

import { useState, useEffect } from "react";
import { Download } from "lucide-react";
import { VendorPageHeader } from "@/components/vendor/VendorPageHeader";

interface LogRecordAPI {
  id: string;
  vendor_id: string;
  user_id: string;
  user_email: string;
  action: string;
  ip_address: string;
  user_agent: string;
  created_at: string;
}

interface LogRow {
  id: string;
  loginId: string;
  ipAddress: string;
  userAgent: string;
  loginAt: string;
}

export default function VendorLogsExportPage() {
  const [dateFrom, setDateFrom] = useState("2026-02-01");
  const [dateTo, setDateTo] = useState("2026-02-14");
  const [rows, setRows] = useState<LogRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/vendor/exports/logs?from=${dateFrom}&to=${dateTo}`)
      .then((r) => r.ok ? r.json() : null)
      .then((json) => {
        if (json?.data) {
          const mapped: LogRow[] = (json.data as LogRecordAPI[]).map((rec) => ({
            id: rec.id,
            loginId: rec.user_email || rec.user_id || "",
            ipAddress: rec.ip_address || "",
            userAgent: rec.user_agent || "",
            loginAt: rec.created_at || "",
          }));
          setRows(mapped);
        } else {
          setRows([]);
        }
      })
      .catch((err) => console.error("logs export error:", err))
      .finally(() => setLoading(false));
  }, [dateFrom, dateTo]);

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
      {loading ? (
        <div className="text-sm text-gray-500 py-[24px] text-center">読み込み中...</div>
      ) : rows.length === 0 ? (
        <div className="bg-white border border-gray-200 p-[24px] text-sm text-gray-400 text-center">
          該当するログがありません
        </div>
      ) : (
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
              {rows.map((row) => (
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
      )}
    </div>
  );
}

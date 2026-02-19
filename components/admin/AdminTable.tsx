"use client";

import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, ChevronsUpDown, ChevronUp, ChevronDown, Inbox } from "lucide-react";

interface Column {
  key: string;
  label: string;
  sortable?: boolean;
  render?: (item: Record<string, unknown>) => React.ReactNode;
}

interface AdminTableProps {
  columns: Column[];
  data: Record<string, unknown>[];
  onRowClick?: (item: Record<string, unknown>) => void;
  pageSize?: number;
  loading?: boolean;
  emptyMessage?: string;
}

type SortDir = "asc" | "desc" | null;

export function AdminTable({
  columns,
  data,
  onRowClick,
  pageSize = 10,
  loading = false,
  emptyMessage = "データがありません",
}: AdminTableProps) {
  const [page, setPage] = useState(0);
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>(null);

  const handleSort = (key: string, sortable?: boolean) => {
    if (!sortable) return;
    if (sortKey === key) {
      if (sortDir === "asc") setSortDir("desc");
      else if (sortDir === "desc") {
        setSortKey(null);
        setSortDir(null);
      }
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
    setPage(0);
  };

  const sortedData = useMemo(() => {
    if (!sortKey || !sortDir) return data;
    return [...data].sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      if (typeof av === "number" && typeof bv === "number") {
        return sortDir === "asc" ? av - bv : bv - av;
      }
      const as = String(av);
      const bs = String(bv);
      return sortDir === "asc" ? as.localeCompare(bs) : bs.localeCompare(as);
    });
  }, [data, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sortedData.length / pageSize));
  const pagedData = sortedData.slice(page * pageSize, (page + 1) * pageSize);
  const from = sortedData.length === 0 ? 0 : page * pageSize + 1;
  const to = Math.min((page + 1) * pageSize, sortedData.length);

  const SortIcon = ({ colKey, sortable }: { colKey: string; sortable?: boolean }) => {
    if (!sortable) return null;
    if (sortKey === colKey && sortDir === "asc") return <ChevronUp className="w-[14px] h-[14px] inline ml-[4px]" />;
    if (sortKey === colKey && sortDir === "desc") return <ChevronDown className="w-[14px] h-[14px] inline ml-[4px]" />;
    return <ChevronsUpDown className="w-[14px] h-[14px] inline ml-[4px] text-gray-300" />;
  };

  return (
    <div className="bg-white border border-gray-200">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              {columns.map((c) => (
                <th
                  key={c.key}
                  onClick={() => handleSort(c.key, c.sortable)}
                  className={`px-[16px] py-[12px] text-left text-xs font-sans font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap ${c.sortable ? "cursor-pointer select-none hover:text-gray-700" : ""}`}
                >
                  {c.label}
                  <SortIcon colKey={c.key} sortable={c.sortable} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="px-[16px] py-[48px] text-center">
                  <div className="flex flex-col items-center gap-[8px]">
                    <div className="w-[24px] h-[24px] border-2 border-gray-300 border-t-accent animate-spin" style={{ borderRadius: "50%" }} />
                    <span className="text-sm font-sans text-gray-400">読み込み中...</span>
                  </div>
                </td>
              </tr>
            ) : pagedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-[16px] py-[48px] text-center">
                  <div className="flex flex-col items-center gap-[8px]">
                    <Inbox className="w-[32px] h-[32px] text-gray-300" />
                    <span className="text-sm font-sans text-gray-400">{emptyMessage}</span>
                  </div>
                </td>
              </tr>
            ) : (
              pagedData.map((item, i) => (
                <tr
                  key={i}
                  onClick={() => onRowClick?.(item)}
                  className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${onRowClick ? "cursor-pointer" : ""}`}
                >
                  {columns.map((c) => (
                    <td
                      key={c.key}
                      className="px-[16px] py-[12px] text-sm font-sans text-gray-700"
                    >
                      {c.render ? c.render(item) : String(item[c.key] ?? "")}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {!loading && sortedData.length > 0 && (
        <div className="flex items-center justify-between px-[16px] py-[12px] border-t border-gray-200 bg-gray-50">
          <span className="text-xs font-sans text-gray-500">
            {from}-{to}件 / 全{sortedData.length}件
          </span>
          <div className="flex items-center gap-[8px]">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="p-[6px] border border-gray-300 bg-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors"
            >
              <ChevronLeft className="w-[16px] h-[16px] text-gray-600" />
            </button>
            <span className="text-xs font-sans text-gray-600 min-w-[60px] text-center">
              {page + 1} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="p-[6px] border border-gray-300 bg-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors"
            >
              <ChevronRight className="w-[16px] h-[16px] text-gray-600" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

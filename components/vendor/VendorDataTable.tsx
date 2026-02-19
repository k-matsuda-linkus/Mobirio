"use client";
import { useState } from "react";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ArrowUpDown } from "lucide-react";

export interface VendorColumn<T> {
  key: string;
  label: string;
  sortable?: boolean;
  width?: string;
  render?: (item: T, index: number) => React.ReactNode;
}

interface VendorDataTableProps<T> {
  columns: VendorColumn<T>[];
  data: T[];
  pageSize?: number;
  selectable?: boolean;
  selectedIds?: string[];
  onSelect?: (ids: string[]) => void;
  onRowClick?: (item: T) => void;
  getId?: (item: T) => string;
  emptyMessage?: string;
}

export function VendorDataTable<T>({
  columns,
  data,
  pageSize = 20,
  selectable = false,
  selectedIds = [],
  onSelect,
  onRowClick,
  getId = (item: T) => (item as Record<string, unknown>).id as string,
  emptyMessage = "データがありません",
}: VendorDataTableProps<T>) {
  const [page, setPage] = useState(0);
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const totalPages = Math.ceil(data.length / pageSize);
  const sortedData = sortKey
    ? [...data].sort((a, b) => {
        const aVal = (a as Record<string, unknown>)[sortKey];
        const bVal = (b as Record<string, unknown>)[sortKey];
        const cmp = String(aVal ?? "").localeCompare(String(bVal ?? ""), "ja");
        return sortDir === "asc" ? cmp : -cmp;
      })
    : data;
  const pageData = sortedData.slice(page * pageSize, (page + 1) * pageSize);

  const allSelected = pageData.length > 0 && pageData.every((item) => selectedIds.includes(getId(item)));

  const toggleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const toggleAll = () => {
    if (allSelected) {
      onSelect?.(selectedIds.filter((id) => !pageData.some((item) => getId(item) === id)));
    } else {
      const newIds = new Set([...selectedIds, ...pageData.map(getId)]);
      onSelect?.(Array.from(newIds));
    }
  };

  const toggleOne = (id: string) => {
    onSelect?.(selectedIds.includes(id) ? selectedIds.filter((x) => x !== id) : [...selectedIds, id]);
  };

  return (
    <div className="bg-white border border-gray-200">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              {selectable && (
                <th className="px-[12px] py-[10px] w-[40px]">
                  <input type="checkbox" checked={allSelected} onChange={toggleAll} className="accent-accent" />
                </th>
              )}
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={"px-[12px] py-[10px] text-left text-xs font-medium text-gray-500 whitespace-nowrap " + (col.width ?? "")}
                >
                  {col.sortable ? (
                    <button
                      onClick={() => toggleSort(col.key)}
                      className="flex items-center gap-[4px] hover:text-gray-700"
                    >
                      {col.label}
                      <ArrowUpDown className="w-[12px] h-[12px]" />
                    </button>
                  ) : (
                    col.label
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageData.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (selectable ? 1 : 0)} className="px-[16px] py-[40px] text-center text-sm text-gray-400">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              pageData.map((item, i) => {
                const id = getId(item);
                return (
                  <tr
                    key={id}
                    onClick={() => onRowClick?.(item)}
                    className={"border-b border-gray-100 hover:bg-gray-50 " + (onRowClick ? "cursor-pointer" : "")}
                  >
                    {selectable && (
                      <td className="px-[12px] py-[10px]" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(id)}
                          onChange={() => toggleOne(id)}
                          className="accent-accent"
                        />
                      </td>
                    )}
                    {columns.map((col) => (
                      <td key={col.key} className="px-[12px] py-[10px] text-sm text-gray-700">
                        {col.render
                          ? col.render(item, page * pageSize + i)
                          : String((item as Record<string, unknown>)[col.key] ?? "")}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-[16px] py-[12px] border-t border-gray-200">
          <span className="text-xs text-gray-500">
            {data.length}件中 {page * pageSize + 1}〜{Math.min((page + 1) * pageSize, data.length)}件
          </span>
          <div className="flex items-center gap-[4px]">
            <button onClick={() => setPage(0)} disabled={page === 0} className="p-[4px] disabled:opacity-30">
              <ChevronsLeft className="w-[16px] h-[16px]" />
            </button>
            <button onClick={() => setPage(page - 1)} disabled={page === 0} className="p-[4px] disabled:opacity-30">
              <ChevronLeft className="w-[16px] h-[16px]" />
            </button>
            <span className="text-sm text-gray-600 px-[8px]">
              {page + 1} / {totalPages}
            </span>
            <button onClick={() => setPage(page + 1)} disabled={page >= totalPages - 1} className="p-[4px] disabled:opacity-30">
              <ChevronRight className="w-[16px] h-[16px]" />
            </button>
            <button onClick={() => setPage(totalPages - 1)} disabled={page >= totalPages - 1} className="p-[4px] disabled:opacity-30">
              <ChevronsRight className="w-[16px] h-[16px]" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

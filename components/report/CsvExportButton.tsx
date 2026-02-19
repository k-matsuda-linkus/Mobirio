"use client";
import { Download } from "lucide-react";

type Column = { key: string; label: string };
type Props = {
  data: Record<string, any>[];
  filename: string;
  columns: Column[];
};

export default function CsvExportButton({ data, filename, columns }: Props) {
  const handleExport = () => {
    const header = columns.map((c) => c.label).join(",");
    const rows = data.map((row) =>
      columns.map((c) => {
        const val = String(row[c.key] ?? "");
        return val.includes(",") ? ("\"" + val.replace(/"/g, "\"\"") + "\"") : val;
      }).join(",")
    );
    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename.endsWith(".csv") ? filename : filename + ".csv";
    a.click();
    URL.revokeObjectURL(url);
  };
  return (
    <button onClick={handleExport} className="inline-flex items-center gap-[6px] border border-gray-200 bg-white px-[16px] py-[8px] text-sm text-gray-700 hover:bg-gray-50">
      <Download className="h-[14px] w-[14px]" />
      CSV出力
    </button>
  );
}

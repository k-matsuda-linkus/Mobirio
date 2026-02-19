"use client";
import { FileText, Loader2 } from "lucide-react";

type Props = {
  onClick: () => void;
  loading?: boolean;
};

export default function PdfExportButton({ onClick, loading = false }: Props) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="inline-flex items-center gap-[6px] border border-gray-200 bg-white px-[16px] py-[8px] text-sm text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
    >
      {loading ? <Loader2 className="h-[14px] w-[14px] animate-spin" /> : <FileText className="h-[14px] w-[14px]" />}
      PDF出力
    </button>
  );
}

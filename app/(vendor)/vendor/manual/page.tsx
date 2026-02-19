"use client";

import { Play, FileText, Download } from "lucide-react";
import { VendorPageHeader } from "@/components/vendor/VendorPageHeader";

const VIDEO_MANUALS = [
  { id: "v1", title: "予約管理の使い方" },
  { id: "v2", title: "車両登録方法" },
  { id: "v3", title: "ライダーズギア設定" },
  { id: "v4", title: "データ出力方法" },
];

const PDF_OPERATION_MANUALS = [
  { id: "p1", title: "操作マニュアル v2.1.pdf", size: "3.2 MB" },
  { id: "p2", title: "クイックスタートガイド.pdf", size: "1.1 MB" },
];

const PDF_ADMIN_MANUALS = [
  { id: "a1", title: "店舗運用マニュアル.pdf", size: "4.5 MB" },
  { id: "a2", title: "トラブル対応ガイド.pdf", size: "2.8 MB" },
];

const PROMOTION_TOOLS = [
  { id: "pr1", title: "モトオークレンタルバイク販促ツール追加注文書.pdf", size: "0.8 MB" },
];

export default function VendorManualPage() {
  return (
    <div>
      <VendorPageHeader
        title="マニュアル"
        breadcrumbs={[{ label: "マニュアル" }]}
      />

      {/* 操作マニュアル（動画） */}
      <section className="mb-[24px]">
        <h2 className="text-sm font-medium text-gray-700 mb-[12px]">操作マニュアル（動画）</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[16px]">
          {VIDEO_MANUALS.map((video) => (
            <div key={video.id} className="bg-white border border-gray-200 overflow-hidden">
              {/* Video placeholder */}
              <div className="aspect-video bg-gray-100 flex items-center justify-center cursor-pointer hover:bg-gray-200 transition-colors">
                <div className="flex flex-col items-center gap-[8px]">
                  <div className="w-[48px] h-[48px] bg-accent/10 rounded-full flex items-center justify-center">
                    <Play className="w-[24px] h-[24px] text-accent ml-[2px]" />
                  </div>
                </div>
              </div>
              <div className="px-[12px] py-[10px]">
                <p className="text-sm text-gray-700 font-medium">{video.title}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 操作マニュアル（PDF） */}
      <section className="mb-[24px]">
        <h2 className="text-sm font-medium text-gray-700 mb-[12px]">操作マニュアル（PDF）</h2>
        <div className="bg-white border border-gray-200">
          {PDF_OPERATION_MANUALS.map((doc, i) => (
            <div
              key={doc.id}
              className={
                "flex items-center justify-between px-[16px] py-[12px]" +
                (i < PDF_OPERATION_MANUALS.length - 1 ? " border-b border-gray-100" : "")
              }
            >
              <div className="flex items-center gap-[10px]">
                <FileText className="w-[18px] h-[18px] text-red-400 shrink-0" />
                <div>
                  <p className="text-sm text-gray-700">{doc.title}</p>
                  <p className="text-xs text-gray-400">{doc.size}</p>
                </div>
              </div>
              <button className="flex items-center gap-[4px] text-xs text-accent hover:underline">
                <Download className="w-[14px] h-[14px]" />
                ダウンロード
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* 運用マニュアル */}
      <section className="mb-[24px]">
        <h2 className="text-sm font-medium text-gray-700 mb-[12px]">運用マニュアル</h2>
        <div className="bg-white border border-gray-200">
          {PDF_ADMIN_MANUALS.map((doc, i) => (
            <div
              key={doc.id}
              className={
                "flex items-center justify-between px-[16px] py-[12px]" +
                (i < PDF_ADMIN_MANUALS.length - 1 ? " border-b border-gray-100" : "")
              }
            >
              <div className="flex items-center gap-[10px]">
                <FileText className="w-[18px] h-[18px] text-red-400 shrink-0" />
                <div>
                  <p className="text-sm text-gray-700">{doc.title}</p>
                  <p className="text-xs text-gray-400">{doc.size}</p>
                </div>
              </div>
              <button className="flex items-center gap-[4px] text-xs text-accent hover:underline">
                <Download className="w-[14px] h-[14px]" />
                ダウンロード
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* モトオークレンタルバイク販促ツール追加注文書 */}
      <section className="mb-[24px]">
        <h2 className="text-sm font-medium text-gray-700 mb-[12px]">
          モトオークレンタルバイク販促ツール追加注文書
        </h2>
        <div className="bg-white border border-gray-200">
          {PROMOTION_TOOLS.map((doc) => (
            <div key={doc.id} className="flex items-center justify-between px-[16px] py-[12px]">
              <div className="flex items-center gap-[10px]">
                <FileText className="w-[18px] h-[18px] text-red-400 shrink-0" />
                <div>
                  <p className="text-sm text-gray-700">{doc.title}</p>
                  <p className="text-xs text-gray-400">{doc.size}</p>
                </div>
              </div>
              <button className="flex items-center gap-[4px] text-xs text-accent hover:underline">
                <Download className="w-[14px] h-[14px]" />
                ダウンロード
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

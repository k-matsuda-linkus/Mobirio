"use client";
import { useState } from "react";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { mockInquiries } from "@/lib/mock/inquiries";
import { MessageCircle } from "lucide-react";

const sv = (s: string) => {
  if (s === "new") return "danger" as const;
  if (s === "in_progress") return "warning" as const;
  if (s === "resolved") return "success" as const;
  return "default" as const;
};

const statusLabel = (s: string) => {
  if (s === "new") return "未対応";
  if (s === "in_progress") return "対応中";
  if (s === "resolved") return "完了";
  return "クローズ";
};

export default function InquiriesPage() {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("");

  const filtered = statusFilter
    ? mockInquiries.filter((i) => i.status === statusFilter)
    : mockInquiries;

  const newCount = mockInquiries.filter((i) => i.status === "new").length;

  return (
    <div>
      <div className="flex items-center justify-between mb-[24px]">
        <h1 className="font-serif text-2xl font-light">
          お問い合わせ管理
          {newCount > 0 && (
            <span className="ml-[12px] bg-red-500 text-white text-xs px-[8px] py-[2px]">
              未対応 {newCount}
            </span>
          )}
        </h1>
      </div>

      {/* フィルター */}
      <div className="bg-white border border-gray-200 p-[16px] flex gap-[12px] items-center mb-[24px]">
        <MessageCircle className="w-[16px] h-[16px] text-gray-400" />
        {["", "new", "in_progress", "resolved", "closed"].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={
              "px-[12px] py-[6px] text-sm font-sans border " +
              (statusFilter === s
                ? "border-accent text-accent bg-accent/5"
                : "border-gray-200 text-gray-600 hover:bg-gray-50")
            }
          >
            {s === "" ? "すべて" : statusLabel(s)}
            {s === "new" && newCount > 0 && (
              <span className="ml-[4px] text-xs text-red-500">({newCount})</span>
            )}
          </button>
        ))}
      </div>

      {/* 一覧 */}
      <div className="space-y-[4px]">
        {filtered.map((inq) => (
          <div key={inq.id} className="bg-white border border-gray-200">
            <div
              onClick={() => setExpanded(expanded === inq.id ? null : inq.id)}
              className="flex items-center justify-between px-[20px] py-[14px] cursor-pointer hover:bg-gray-50"
            >
              <div className="flex items-center gap-[16px]">
                <StatusBadge status={statusLabel(inq.status)} variant={sv(inq.status)} />
                <span className="text-sm font-sans font-medium">{inq.subject}</span>
              </div>
              <div className="flex items-center gap-[12px]">
                <span className="text-xs text-gray-400">{inq.name}</span>
                <span className="text-xs text-gray-400">
                  {inq.created_at.slice(0, 10)}
                </span>
                <span className="text-gray-400">{expanded === inq.id ? "▲" : "▼"}</span>
              </div>
            </div>
            {expanded === inq.id && (
              <div className="px-[20px] pb-[20px] border-t border-gray-100 pt-[16px]">
                <div className="flex gap-[24px] mb-[12px] text-sm font-sans">
                  <span className="text-gray-500">
                    名前: <strong>{inq.name}</strong>
                  </span>
                  <span className="text-gray-500">
                    メール: <strong>{inq.email}</strong>
                  </span>
                  {inq.phone && (
                    <span className="text-gray-500">
                      電話: <strong>{inq.phone}</strong>
                    </span>
                  )}
                </div>
                <p className="text-sm font-sans text-gray-700 mb-[16px]">{inq.content}</p>
                {inq.reply && (
                  <div className="bg-gray-50 border border-gray-100 p-[12px] mb-[16px]">
                    <p className="text-xs text-gray-400 mb-[4px]">返信済み</p>
                    <p className="text-sm font-sans text-gray-700">{inq.reply}</p>
                  </div>
                )}
                {!inq.reply && (
                  <div className="flex gap-[8px]">
                    <button className="bg-accent text-white px-[16px] py-[6px] text-sm font-sans hover:opacity-90">
                      返信する
                    </button>
                    <select className="border border-gray-300 px-[12px] py-[6px] text-sm font-sans">
                      <option value="new">未対応</option>
                      <option value="in_progress">対応中</option>
                      <option value="resolved">完了</option>
                    </select>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

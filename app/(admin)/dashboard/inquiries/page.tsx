"use client";
import { useState, useEffect, useCallback } from "react";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { MessageCircle, Loader2 } from "lucide-react";

interface InquiryRow {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string;
  content: string;
  reply: string | null;
  status: string;
  created_at: string;
  replied_at: string | null;
}

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
  const [inquiries, setInquiries] = useState<InquiryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("");
  const [replyText, setReplyText] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchInquiries = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set("status", statusFilter);
      const res = await fetch(`/api/admin/inquiries?${params.toString()}`);
      const json = await res.json();
      if (!res.ok) {
        setError("問合せデータの取得に失敗しました");
        setLoading(false);
        return;
      }
      if (json.data) setInquiries(json.data);
    } catch (error) {
      console.error("Inquiries fetch error:", error);
      setError("問合せデータの取得に失敗しました");
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchInquiries();
  }, [fetchInquiries]);

  const handleStatusUpdate = async (inquiryId: string, newStatus: string, reply?: string) => {
    setActionLoading(inquiryId);
    try {
      const body: Record<string, string> = { inquiryId, status: newStatus };
      if (reply) body.reply = reply;

      const res = await fetch("/api/admin/inquiries", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (json.success) {
        await fetchInquiries();
        setReplyText("");
      }
    } catch (error) {
      console.error("Inquiry update error:", error);
    } finally {
      setActionLoading(null);
    }
  };

  const newCount = inquiries.filter((i) => i.status === "new").length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-[80px]">
        <Loader2 className="w-[24px] h-[24px] animate-spin text-gray-400" />
        <span className="ml-[8px] text-sm text-gray-500">読み込み中...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-[80px]">
        <span className="text-sm text-red-500">{error}</span>
      </div>
    );
  }

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
        {inquiries.map((inq) => (
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
                <span className="text-xs text-gray-400">{inq.created_at.slice(0, 10)}</span>
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
                  <div className="space-y-[8px]">
                    <textarea
                      value={expanded === inq.id ? replyText : ""}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="返信内容を入力..."
                      className="w-full border border-gray-200 px-[12px] py-[8px] text-sm focus:border-accent focus:outline-none min-h-[80px]"
                    />
                    <div className="flex gap-[8px]">
                      <button
                        onClick={() =>
                          handleStatusUpdate(inq.id, "resolved", replyText || undefined)
                        }
                        disabled={actionLoading === inq.id}
                        className="bg-accent text-white px-[16px] py-[6px] text-sm font-sans hover:opacity-90 disabled:opacity-50"
                      >
                        {replyText ? "返信して完了" : "完了にする"}
                      </button>
                      <select
                        onChange={(e) => {
                          if (e.target.value) handleStatusUpdate(inq.id, e.target.value);
                        }}
                        className="border border-gray-300 px-[12px] py-[6px] text-sm font-sans"
                        defaultValue=""
                      >
                        <option value="" disabled>
                          ステータス変更
                        </option>
                        <option value="in_progress">対応中</option>
                        <option value="resolved">完了</option>
                        <option value="closed">クローズ</option>
                      </select>
                    </div>
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

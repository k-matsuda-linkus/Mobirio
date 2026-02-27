"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Plus, X, Building2, Store, ArrowLeft, Mail, Send, Loader2 } from "lucide-react";
import { AdminFilterBar } from "@/components/admin/AdminFilterBar";
import { AdminTable } from "@/components/admin/AdminTable";
import { StatusBadge } from "@/components/admin/StatusBadge";

interface VendorRow {
  id: string;
  name: string;
  prefecture?: string | null;
  city?: string | null;
  contact_email?: string | null;
  commission_rate: number;
  is_approved: boolean;
  is_active: boolean;
  bikes_count: number;
  created_at: string;
}

interface VendorSummary {
  total: number;
  approved: number;
  pending_approval: number;
  active: number;
  inactive: number;
}

const sl = (v: VendorRow) => {
  if (!v.is_approved) return { label: "承認待ち", variant: "warning" as const };
  if (v.is_active) return { label: "稼働中", variant: "success" as const };
  return { label: "停止中", variant: "danger" as const };
};

const getStatusValue = (v: VendorRow) => {
  if (!v.is_approved) return "pending";
  if (v.is_active) return "active";
  return "inactive";
};

export default function VendorsPage() {
  const [vendors, setVendors] = useState<VendorRow[]>([]);
  const [summary, setSummary] = useState<VendorSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [sf, setSf] = useState("");
  const [search, setSearch] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 招待モーダル
  const [showNewModal, setShowNewModal] = useState(false);
  const [regStep, setRegStep] = useState<"select" | "invite">("select");
  const [regType, setRegType] = useState<"new" | "existing">("new");
  const [inviteEmail, setInviteEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const fetchVendors = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      const res = await fetch(`/api/admin/vendors?${params.toString()}`);
      const json = await res.json();
      if (!res.ok) {
        setError("ベンダーデータの取得に失敗しました");
        setLoading(false);
        return;
      }
      if (json.data) setVendors(json.data);
      if (json.summary) setSummary(json.summary);
    } catch (error) {
      console.error("Vendors fetch error:", error);
      setError("ベンダーデータの取得に失敗しました");
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchVendors();
  }, [fetchVendors]);

  const handleAction = async (vendorId: string, action: "approve" | "ban" | "activate") => {
    setActionLoading(vendorId);
    try {
      const res = await fetch("/api/admin/vendors", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vendorId, action }),
      });
      const json = await res.json();
      if (json.success) {
        await fetchVendors();
      }
    } catch (error) {
      console.error("Vendor action error:", error);
    } finally {
      setActionLoading(null);
    }
  };

  const openModal = () => {
    setShowNewModal(true);
    setRegStep("select");
    setRegType("new");
    setInviteEmail("");
    setSending(false);
    setSendResult(null);
  };

  const closeModal = () => setShowNewModal(false);

  const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const canSend = isValidEmail(inviteEmail);

  const handleSendInvite = async () => {
    if (!canSend) return;
    setSending(true);
    setSendResult(null);

    try {
      const res = await fetch("/api/admin/vendors/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail, regType }),
      });
      const data = await res.json();

      if (!res.ok) {
        setSendResult({ type: "error", message: data.error || "送信に失敗しました" });
        setSending(false);
        return;
      }

      setSendResult({ type: "success", message: `${inviteEmail} にマジックリンクを送信しました。` });
      setSending(false);
      setTimeout(() => { closeModal(); setSendResult(null); }, 2000);
    } catch {
      setSendResult({ type: "error", message: "通信エラーが発生しました" });
      setSending(false);
    }
  };

  const pc = summary?.pending_approval || 0;
  let filtered = sf
    ? vendors.filter((v) => getStatusValue(v) === sf)
    : vendors;

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
          ベンダー管理
          {pc > 0 && (
            <span className="ml-[12px] bg-red-500 text-white text-xs px-[8px] py-[2px]">
              承認待ち {pc}
            </span>
          )}
        </h1>
        <button
          onClick={openModal}
          className="flex items-center gap-[6px] bg-accent text-white px-[20px] py-[10px] text-sm hover:bg-accent/90"
        >
          <Plus className="w-[14px] h-[14px]" />
          新規店舗登録
        </button>
      </div>

      {/* 新規店舗登録モーダル */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={closeModal} />
          <div className="relative z-10 bg-white w-[520px] max-h-[90vh] flex flex-col border border-gray-200 shadow-xl">
            <div className="flex items-center justify-between px-[24px] py-[16px] border-b border-gray-100 shrink-0">
              <div className="flex items-center gap-[8px]">
                {regStep === "invite" && (
                  <button onClick={() => setRegStep("select")} className="p-[4px] text-gray-400 hover:text-gray-600">
                    <ArrowLeft className="w-[16px] h-[16px]" />
                  </button>
                )}
                <h2 className="text-base font-medium text-gray-800">
                  {regStep === "select" && "新規登録"}
                  {regStep === "invite" && (regType === "new" ? "新規事業者登録" : "既存事業者に店舗追加")}
                </h2>
              </div>
              <button onClick={closeModal} className="p-[4px] text-gray-400 hover:text-gray-600">
                <X className="w-[18px] h-[18px]" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1">
              {regStep === "select" && (
                <div className="px-[24px] py-[24px] space-y-[12px]">
                  <p className="text-xs text-gray-400 mb-[8px]">登録種別を選択してください。</p>
                  <button
                    onClick={() => { setRegType("new"); setRegStep("invite"); }}
                    className="w-full flex items-center gap-[16px] border border-gray-200 p-[20px] hover:border-accent hover:bg-accent/5 transition-colors text-left"
                  >
                    <Building2 className="w-[24px] h-[24px] text-accent shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-gray-800">新規事業者登録</p>
                      <p className="text-xs text-gray-400 mt-[2px]">新しい事業者との契約 → マジックリンクで招待</p>
                    </div>
                  </button>
                  <button
                    onClick={() => { setRegType("existing"); setRegStep("invite"); }}
                    className="w-full flex items-center gap-[16px] border border-gray-200 p-[20px] hover:border-accent hover:bg-accent/5 transition-colors text-left"
                  >
                    <Store className="w-[24px] h-[24px] text-accent shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-gray-800">既存事業者に店舗追加</p>
                      <p className="text-xs text-gray-400 mt-[2px]">契約済みの事業者に新しい拠点を追加する</p>
                    </div>
                  </button>
                </div>
              )}

              {regStep === "invite" && (
                <div className="px-[24px] py-[24px] space-y-[20px]">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-[4px]">
                      <Mail className="w-[12px] h-[12px] inline mr-[4px]" />
                      管理者メールアドレス <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      className="w-full border border-gray-200 px-[12px] py-[10px] text-sm focus:border-accent focus:outline-none"
                      placeholder="vendor@example.jp"
                    />
                  </div>

                  {sendResult && (
                    <div className={
                      "px-[16px] py-[12px] text-sm " +
                      (sendResult.type === "success"
                        ? "bg-green-50 border border-green-200 text-green-700"
                        : "bg-red-50 border border-red-200 text-red-700")
                    }>
                      {sendResult.message}
                    </div>
                  )}
                </div>
              )}
            </div>

            {regStep === "invite" && (
              <div className="flex items-center justify-end gap-[8px] px-[24px] py-[16px] border-t border-gray-100 shrink-0">
                <button onClick={closeModal} className="border border-gray-300 px-[20px] py-[10px] text-sm hover:bg-gray-50">
                  キャンセル
                </button>
                <button
                  onClick={handleSendInvite}
                  disabled={!canSend || sending}
                  className="flex items-center gap-[6px] bg-accent text-white px-[20px] py-[10px] text-sm hover:bg-accent/90 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Send className="w-[14px] h-[14px]" />
                  {sending ? "送信中..." : "マジックリンクを送信"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <AdminFilterBar
        searchPlaceholder="店舗名・エリアで検索..."
        onSearch={setSearch}
        filters={[
          {
            label: "ステータス",
            options: [
              { value: "active", label: "稼働中" },
              { value: "inactive", label: "停止中" },
              { value: "pending", label: "承認待ち" },
            ],
            value: sf,
            onChange: setSf,
          },
        ]}
      />

      <AdminTable
        columns={[
          {
            key: "name",
            label: "店舗名",
            render: (v) => (
              <Link href={"/dashboard/vendors/" + v.id} className="text-accent hover:underline font-medium">
                {String(v.name)}
              </Link>
            ),
          },
          {
            key: "area",
            label: "エリア",
            render: (v) => {
              const raw = v as unknown as VendorRow;
              return <span>{`${raw.prefecture || ""} ${raw.city || ""}`.trim() || "—"}</span>;
            },
          },
          {
            key: "commission_rate",
            label: "手数料",
            render: (v) => {
              const raw = v as unknown as VendorRow;
              return <span>{`${(raw.commission_rate * 100).toFixed(0)}%`}</span>;
            },
          },
          { key: "bikes_count", label: "バイク数" },
          {
            key: "status",
            label: "ステータス",
            render: (v) => {
              const raw = v as unknown as VendorRow;
              const s = sl(raw);
              return <StatusBadge status={s.label} variant={s.variant} />;
            },
          },
          {
            key: "action",
            label: "操作",
            render: (v) => {
              const raw = v as unknown as VendorRow;
              const isLoading = actionLoading === raw.id;
              return (
                <div className="flex gap-[4px]">
                  {!raw.is_approved && (
                    <button
                      onClick={() => handleAction(raw.id, "approve")}
                      disabled={isLoading}
                      className="bg-accent text-white px-[10px] py-[4px] text-xs hover:opacity-90 disabled:opacity-50"
                    >
                      承認
                    </button>
                  )}
                  {raw.is_active && raw.is_approved && (
                    <button
                      onClick={() => handleAction(raw.id, "ban")}
                      disabled={isLoading}
                      className="border border-red-400 text-red-500 px-[10px] py-[4px] text-xs hover:bg-red-50 disabled:opacity-50"
                    >
                      停止
                    </button>
                  )}
                  {!raw.is_active && raw.is_approved && (
                    <button
                      onClick={() => handleAction(raw.id, "activate")}
                      disabled={isLoading}
                      className="border border-accent text-accent px-[10px] py-[4px] text-xs hover:bg-accent/5 disabled:opacity-50"
                    >
                      再開
                    </button>
                  )}
                  <Link href={"/dashboard/vendors/" + raw.id} className="text-sm text-accent hover:underline px-[6px] py-[4px]">
                    詳細
                  </Link>
                </div>
              );
            },
          },
        ]}
        data={filtered as unknown as Record<string, unknown>[]}
      />
    </div>
  );
}

"use client";
import { useState } from "react";
import Link from "next/link";
import { Plus, X, Building2, Store, ArrowLeft, Mail, Send } from "lucide-react";
import { AdminFilterBar } from "@/components/admin/AdminFilterBar";
import { AdminTable } from "@/components/admin/AdminTable";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { mockVendors, VENDOR_PLANS } from "@/lib/mock/vendors";
import type { VendorPlan } from "@/lib/mock/vendors";
import { mockBusinessEntities } from "@/lib/mock/business";
import { mockBikes } from "@/lib/mock/bikes";
import { mockReservations } from "@/lib/mock/reservations";
import { mockReviews } from "@/lib/mock/reviews";

const vendors = mockVendors.map((v) => {
  const vendorBikes = mockBikes.filter((b) => b.vendor_id === v.id);
  const vendorRes = mockReservations.filter((r) => r.vendor_id === v.id && r.status !== "cancelled");
  const revenue = vendorRes.reduce((sum, r) => sum + r.total_amount, 0);
  const vendorReviews = mockReviews.filter((r) => {
    const bike = mockBikes.find((b) => b.id === r.bike_id);
    return bike?.vendor_id === v.id;
  });
  const avgRating = vendorReviews.length > 0
    ? (vendorReviews.reduce((sum, r) => sum + r.rating, 0) / vendorReviews.length).toFixed(1)
    : 0;
  const biz = mockBusinessEntities.find((b) => b.id === v.business_id);
  return {
    id: v.id,
    name: v.name,
    businessName: biz?.name || "—",
    area: `${v.prefecture} ${v.city}`,
    plan: v.plan,
    planLabel: VENDOR_PLANS[v.plan].label,
    commission: `${(v.commission_rate * 100).toFixed(0)}%`,
    bikes: vendorBikes.length,
    revenue: `¥${revenue.toLocaleString()}`,
    rating: avgRating,
    status: !v.is_approved ? "pending" : v.is_active ? "active" : "inactive",
  };
});

const sl = (s: string) => {
  if (s === "active") return { label: "稼働中", variant: "success" as const };
  if (s === "inactive") return { label: "停止中", variant: "danger" as const };
  return { label: "承認待ち", variant: "warning" as const };
};

type RegStep = "select" | "invite";

export default function VendorsPage() {
  const [sf, setSf] = useState("");
  const [search, setSearch] = useState("");
  const [showNewModal, setShowNewModal] = useState(false);
  const [regStep, setRegStep] = useState<RegStep>("select");
  const [regType, setRegType] = useState<"new" | "existing">("new");

  // 招待メールアドレス
  const [inviteEmail, setInviteEmail] = useState("");

  // 既存事業者選択用
  const [selectedBizId, setSelectedBizId] = useState("");
  const [bizSearch, setBizSearch] = useState("");

  // 契約プラン
  const [newPlan, setNewPlan] = useState<VendorPlan>("rental_bike");

  // 送信中フラグ
  const [sending, setSending] = useState(false);

  const pc = vendors.filter((v) => v.status === "pending").length;
  let filtered = sf ? vendors.filter((v) => v.status === sf) : vendors;
  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(
      (v) => v.name.toLowerCase().includes(q) || v.area.toLowerCase().includes(q)
    );
  }

  const filteredBizList = bizSearch
    ? mockBusinessEntities.filter((b) => b.name.toLowerCase().includes(bizSearch.toLowerCase()))
    : mockBusinessEntities;

  const openModal = () => {
    setShowNewModal(true);
    setRegStep("select");
    setRegType("new");
    setInviteEmail("");
    setSelectedBizId("");
    setBizSearch("");
    setNewPlan("rental_bike");
    setSending(false);
  };

  const closeModal = () => {
    setShowNewModal(false);
  };

  const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const canSend = regType === "new"
    ? isValidEmail(inviteEmail)
    : !!selectedBizId && isValidEmail(inviteEmail);

  // 送信結果メッセージ
  const [sendResult, setSendResult] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const handleSendInvite = async () => {
    if (!canSend) return;
    setSending(true);
    setSendResult(null);

    try {
      const res = await fetch("/api/admin/vendors/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: inviteEmail,
          plan: newPlan,
          regType,
          businessId: regType === "existing" ? selectedBizId : undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setSendResult({ type: "error", message: data.error || "送信に失敗しました" });
        setSending(false);
        return;
      }

      setSendResult({
        type: "success",
        message: `${inviteEmail} にマジックリンクを送信しました。`,
      });
      setSending(false);
      // 成功時は少し遅らせてモーダルを閉じる
      setTimeout(() => {
        closeModal();
        setSendResult(null);
      }, 2000);
    } catch {
      setSendResult({ type: "error", message: "通信エラーが発生しました" });
      setSending(false);
    }
  };

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
            {/* ヘッダー */}
            <div className="flex items-center justify-between px-[24px] py-[16px] border-b border-gray-100 shrink-0">
              <div className="flex items-center gap-[8px]">
                {regStep === "invite" && (
                  <button
                    onClick={() => setRegStep("select")}
                    className="p-[4px] text-gray-400 hover:text-gray-600"
                  >
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

            {/* コンテンツ */}
            <div className="overflow-y-auto flex-1">
              {/* ステップ0: 登録種別の選択 */}
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

              {/* ステップ1: 招待情報入力 */}
              {regStep === "invite" && (
                <div className="px-[24px] py-[24px] space-y-[20px]">
                  {/* 既存事業者選択（既存パターンのみ） */}
                  {regType === "existing" && (
                    <div className="space-y-[8px]">
                      <label className="block text-xs font-medium text-gray-500">
                        事業者 <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={bizSearch}
                        onChange={(e) => { setBizSearch(e.target.value); setSelectedBizId(""); }}
                        className="w-full border border-gray-200 px-[12px] py-[10px] text-sm focus:border-accent focus:outline-none"
                        placeholder="事業者名で検索..."
                      />
                      <div className="border border-gray-200 max-h-[200px] overflow-y-auto">
                        {filteredBizList.length > 0 ? (
                          filteredBizList.map((b) => {
                            const shopCount = mockVendors.filter((v) => v.business_id === b.id).length;
                            return (
                              <button
                                key={b.id}
                                onClick={() => { setSelectedBizId(b.id); setBizSearch(b.name); }}
                                className={
                                  "w-full flex items-center justify-between px-[12px] py-[10px] text-left border-b border-gray-50 last:border-b-0 " +
                                  (selectedBizId === b.id
                                    ? "bg-accent/5"
                                    : "hover:bg-gray-50")
                                }
                              >
                                <div>
                                  <p className={
                                    "text-sm font-medium " +
                                    (selectedBizId === b.id ? "text-accent" : "text-gray-800")
                                  }>
                                    {b.name}
                                  </p>
                                  <p className="text-xs text-gray-400 mt-[2px]">{b.address}</p>
                                </div>
                                <span className="text-xs text-gray-400 shrink-0 ml-[12px]">{shopCount}店舗</span>
                              </button>
                            );
                          })
                        ) : (
                          <p className="px-[12px] py-[10px] text-xs text-gray-400">該当する事業者がありません</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* メールアドレス */}
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
                    <p className="text-xs text-gray-400 mt-[4px]">
                      このアドレスにマジックリンクを送信します。ベンダーが登録作業を行います。
                    </p>
                  </div>

                  {/* 契約プラン */}
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-[8px]">
                      契約プラン <span className="text-red-500">*</span>
                    </label>
                    <div className="space-y-[8px]">
                      {(Object.entries(VENDOR_PLANS) as [VendorPlan, { label: string; commissionRate: number }][]).map(
                        ([key, plan]) => (
                          <label
                            key={key}
                            className={
                              "flex items-center gap-[12px] border p-[14px] cursor-pointer transition-colors " +
                              (newPlan === key
                                ? "border-accent bg-accent/5"
                                : "border-gray-200 hover:border-gray-300")
                            }
                          >
                            <input
                              type="radio"
                              name="newPlan"
                              value={key}
                              checked={newPlan === key}
                              onChange={() => setNewPlan(key)}
                              className="accent-accent"
                            />
                            <div>
                              <p className="text-sm font-medium text-gray-800">{plan.label}</p>
                              <p className="text-xs text-gray-400 mt-[2px]">
                                {key === "rental_bike"
                                  ? "すべての車両が登録可能"
                                  : "原付以下の車両のみ登録可能"}
                                ・ロイヤリティ {(plan.commissionRate * 100).toFixed(0)}%
                              </p>
                            </div>
                          </label>
                        )
                      )}
                    </div>
                  </div>

                  {/* フロー説明 */}
                  <div className="bg-gray-50 border border-gray-100 px-[16px] py-[12px]">
                    <p className="text-xs font-medium text-gray-600 mb-[6px]">送信後の流れ</p>
                    <ol className="text-xs text-gray-500 space-y-[4px] list-decimal list-inside">
                      <li>入力されたメールアドレスにマジックリンクを送信</li>
                      <li>ベンダーがリンクから事業者・店舗情報を入力</li>
                      <li>登録完了後、ベンダー一覧に「承認待ち」として表示</li>
                    </ol>
                  </div>

                  {/* 送信結果メッセージ */}
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

            {/* フッター */}
            {regStep === "invite" && (
              <div className="flex items-center justify-end gap-[8px] px-[24px] py-[16px] border-t border-gray-100 shrink-0">
                <button
                  onClick={closeModal}
                  className="border border-gray-300 px-[20px] py-[10px] text-sm hover:bg-gray-50"
                >
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
              <Link
                href={"/dashboard/vendors/" + v.id}
                className="text-accent hover:underline font-medium"
              >
                {String(v.name)}
              </Link>
            ),
          },
          {
            key: "businessName",
            label: "事業者",
            render: (v) => <span className="text-xs text-gray-500">{String(v.businessName)}</span>,
          },
          { key: "area", label: "エリア" },
          {
            key: "planLabel",
            label: "プラン",
            render: (v) => (
              <span className={
                String(v.plan) === "rental_bike"
                  ? "text-blue-600 text-xs font-medium"
                  : "text-green-600 text-xs font-medium"
              }>
                {String(v.planLabel)}
              </span>
            ),
          },
          { key: "commission", label: "手数料" },
          { key: "bikes", label: "バイク数" },
          { key: "revenue", label: "月間売上" },
          {
            key: "rating",
            label: "評価",
            render: (v) => <span>{Number(v.rating) > 0 ? "★ " + v.rating : "—"}</span>,
          },
          {
            key: "status",
            label: "ステータス",
            render: (v) => {
              const s = sl(String(v.status));
              return <StatusBadge status={s.label} variant={s.variant} />;
            },
          },
          {
            key: "action",
            label: "操作",
            render: (v) => (
              <Link
                href={"/dashboard/vendors/" + v.id}
                className="text-sm text-accent hover:underline"
              >
                詳細
              </Link>
            ),
          },
        ]}
        data={filtered}
      />
    </div>
  );
}

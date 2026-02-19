"use client";
import { useState } from "react";
import Link from "next/link";
import { Plus, X, Building2, Store, ArrowLeft, Check } from "lucide-react";
import { AdminFilterBar } from "@/components/admin/AdminFilterBar";
import { AdminTable } from "@/components/admin/AdminTable";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { mockVendors, VENDOR_PLANS } from "@/lib/mock/vendors";
import type { VendorPlan } from "@/lib/mock/vendors";
import { mockBusinessEntities } from "@/lib/mock/business";
import type { BusinessEntity } from "@/lib/mock/business";
import { mockBikes } from "@/lib/mock/bikes";
import { mockReservations } from "@/lib/mock/reservations";
import { mockReviews } from "@/lib/mock/reviews";

const vendors = mockVendors.map((v) => {
  const vendorBikes = mockBikes.filter((b) => b.vendor_id === v.id);
  const vendorRes = mockReservations.filter((r) => r.vendor_id === v.id && r.status !== "cancelled");
  const revenue = vendorRes.reduce((sum, r) => sum + r.total_amount, 0);
  const vendorReviews = mockReviews.filter((r) => {
    const bike = mockBikes.find((b) => b.id === r.bikeId);
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

type RegStep = "select" | "business" | "shop";

const emptyBusiness = {
  type: "corporation" as BusinessEntity["type"],
  name: "",
  corporateNumber: "",
  representative: "",
  postalCode: "",
  address: "",
  phone: "",
  fax: "",
  email: "",
  staff: "",
  staffPhone: "",
};

export default function VendorsPage() {
  const [sf, setSf] = useState("");
  const [search, setSearch] = useState("");
  const [showNewModal, setShowNewModal] = useState(false);
  const [regStep, setRegStep] = useState<RegStep>("select");
  const [regType, setRegType] = useState<"new" | "existing">("new");

  // 事業者情報（新規用）
  const [bizForm, setBizForm] = useState({ ...emptyBusiness });

  // 既存事業者選択用
  const [selectedBizId, setSelectedBizId] = useState("");
  const [bizSearch, setBizSearch] = useState("");

  // 店舗情報
  const [newShopName, setNewShopName] = useState("");
  const [newPlan, setNewPlan] = useState<VendorPlan>("rental_bike");

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
    setBizForm({ ...emptyBusiness });
    setSelectedBizId("");
    setBizSearch("");
    setNewShopName("");
    setNewPlan("rental_bike");
  };

  const closeModal = () => {
    setShowNewModal(false);
  };

  const updateBizForm = (key: string, value: string) => {
    setBizForm((prev) => ({ ...prev, [key]: value }));
  };

  const canProceedBusiness = regType === "new"
    ? bizForm.name.trim() && bizForm.representative.trim() && bizForm.phone.trim() && bizForm.email.trim()
    : !!selectedBizId;

  const canRegister = newShopName.trim();

  const handleRegister = () => {
    if (!canRegister) return;
    const bizName = regType === "new"
      ? bizForm.name
      : mockBusinessEntities.find((b) => b.id === selectedBizId)?.name;
    alert(
      `事業者「${bizName}」の店舗「${newShopName}」を${VENDOR_PLANS[newPlan].label}で登録しました。\n事業者にページを引き渡します。`
    );
    closeModal();
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
          <div className="relative z-10 bg-white w-[560px] max-h-[90vh] flex flex-col border border-gray-200 shadow-xl">
            {/* ヘッダー */}
            <div className="flex items-center justify-between px-[24px] py-[16px] border-b border-gray-100 shrink-0">
              <div className="flex items-center gap-[8px]">
                {regStep !== "select" && (
                  <button
                    onClick={() => setRegStep(regStep === "shop" ? "business" : "select")}
                    className="p-[4px] text-gray-400 hover:text-gray-600"
                  >
                    <ArrowLeft className="w-[16px] h-[16px]" />
                  </button>
                )}
                <h2 className="text-base font-medium text-gray-800">
                  {regStep === "select" && "新規登録"}
                  {regStep === "business" && (regType === "new" ? "1. 事業者情報" : "1. 事業者選択")}
                  {regStep === "shop" && "2. 店舗情報"}
                </h2>
              </div>
              <div className="flex items-center gap-[12px]">
                {/* ステップインジケーター */}
                {regStep !== "select" && (
                  <div className="flex items-center gap-[4px]">
                    <span className={
                      "w-[20px] h-[20px] flex items-center justify-center text-xs " +
                      (regStep === "business"
                        ? "bg-accent text-white"
                        : "bg-accent/20 text-accent")
                    }>
                      {regStep === "shop" ? <Check className="w-[12px] h-[12px]" /> : "1"}
                    </span>
                    <span className="w-[16px] h-[1px] bg-gray-200" />
                    <span className={
                      "w-[20px] h-[20px] flex items-center justify-center text-xs " +
                      (regStep === "shop"
                        ? "bg-accent text-white"
                        : "bg-gray-100 text-gray-400")
                    }>
                      2
                    </span>
                  </div>
                )}
                <button onClick={closeModal} className="p-[4px] text-gray-400 hover:text-gray-600">
                  <X className="w-[18px] h-[18px]" />
                </button>
              </div>
            </div>

            {/* コンテンツ（スクロール可） */}
            <div className="overflow-y-auto flex-1">
              {/* ステップ0: 登録種別の選択 */}
              {regStep === "select" && (
                <div className="px-[24px] py-[24px] space-y-[12px]">
                  <p className="text-xs text-gray-400 mb-[8px]">登録種別を選択してください。</p>
                  <button
                    onClick={() => { setRegType("new"); setRegStep("business"); }}
                    className="w-full flex items-center gap-[16px] border border-gray-200 p-[20px] hover:border-accent hover:bg-accent/5 transition-colors text-left"
                  >
                    <Building2 className="w-[24px] h-[24px] text-accent shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-gray-800">新規事業者登録</p>
                      <p className="text-xs text-gray-400 mt-[2px]">新しい事業者との契約 → 店舗を登録する</p>
                    </div>
                  </button>
                  <button
                    onClick={() => { setRegType("existing"); setRegStep("business"); }}
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

              {/* ステップ1: 事業者情報 */}
              {regStep === "business" && regType === "new" && (
                <div className="px-[24px] py-[24px] space-y-[16px]">
                  <p className="text-xs text-gray-400">新しい事業者の基本情報を入力してください。</p>

                  {/* 事業者区分 */}
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-[6px]">事業者区分</label>
                    <div className="flex gap-[16px]">
                      {(["corporation", "sole_proprietor"] as const).map((t) => (
                        <label key={t} className="flex items-center gap-[6px] cursor-pointer">
                          <input
                            type="radio"
                            name="bizType"
                            checked={bizForm.type === t}
                            onChange={() => updateBizForm("type", t)}
                            className="accent-accent"
                          />
                          <span className="text-sm">{t === "corporation" ? "法人" : "個人事業主"}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* 事業者名 */}
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-[4px]">
                      事業者名 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={bizForm.name}
                      onChange={(e) => updateBizForm("name", e.target.value)}
                      className="w-full border border-gray-200 px-[12px] py-[10px] text-sm focus:border-accent focus:outline-none"
                      placeholder="例: サンシャインモータース株式会社"
                    />
                  </div>

                  {/* 法人番号 */}
                  {bizForm.type === "corporation" && (
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-[4px]">法人番号（13桁）</label>
                      <input
                        type="text"
                        value={bizForm.corporateNumber}
                        onChange={(e) => updateBizForm("corporateNumber", e.target.value)}
                        className="w-full border border-gray-200 px-[12px] py-[10px] text-sm focus:border-accent focus:outline-none max-w-[240px]"
                        placeholder="1234567890123"
                        maxLength={13}
                      />
                    </div>
                  )}

                  {/* 代表者名 */}
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-[4px]">
                      代表者名 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={bizForm.representative}
                      onChange={(e) => updateBizForm("representative", e.target.value)}
                      className="w-full border border-gray-200 px-[12px] py-[10px] text-sm focus:border-accent focus:outline-none max-w-[300px]"
                      placeholder="山田太郎"
                    />
                  </div>

                  {/* 住所 */}
                  <div className="grid grid-cols-3 gap-[12px]">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-[4px]">郵便番号</label>
                      <input
                        type="text"
                        value={bizForm.postalCode}
                        onChange={(e) => updateBizForm("postalCode", e.target.value)}
                        className="w-full border border-gray-200 px-[12px] py-[10px] text-sm focus:border-accent focus:outline-none"
                        placeholder="000-0000"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs font-medium text-gray-500 mb-[4px]">住所</label>
                      <input
                        type="text"
                        value={bizForm.address}
                        onChange={(e) => updateBizForm("address", e.target.value)}
                        className="w-full border border-gray-200 px-[12px] py-[10px] text-sm focus:border-accent focus:outline-none"
                        placeholder="宮崎県宮崎市..."
                      />
                    </div>
                  </div>

                  {/* 連絡先 */}
                  <div className="grid grid-cols-2 gap-[12px]">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-[4px]">
                        電話番号 <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={bizForm.phone}
                        onChange={(e) => updateBizForm("phone", e.target.value)}
                        className="w-full border border-gray-200 px-[12px] py-[10px] text-sm focus:border-accent focus:outline-none"
                        placeholder="0985-12-3456"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-[4px]">FAX番号</label>
                      <input
                        type="text"
                        value={bizForm.fax}
                        onChange={(e) => updateBizForm("fax", e.target.value)}
                        className="w-full border border-gray-200 px-[12px] py-[10px] text-sm focus:border-accent focus:outline-none"
                        placeholder="0985-12-3457"
                      />
                    </div>
                  </div>

                  {/* メール */}
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-[4px]">
                      メールアドレス <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={bizForm.email}
                      onChange={(e) => updateBizForm("email", e.target.value)}
                      className="w-full border border-gray-200 px-[12px] py-[10px] text-sm focus:border-accent focus:outline-none max-w-[360px]"
                      placeholder="info@example.jp"
                    />
                  </div>

                  {/* 担当者 */}
                  <div className="grid grid-cols-2 gap-[12px]">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-[4px]">担当者名</label>
                      <input
                        type="text"
                        value={bizForm.staff}
                        onChange={(e) => updateBizForm("staff", e.target.value)}
                        className="w-full border border-gray-200 px-[12px] py-[10px] text-sm focus:border-accent focus:outline-none"
                        placeholder="鈴木一郎"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-[4px]">担当者電話</label>
                      <input
                        type="text"
                        value={bizForm.staffPhone}
                        onChange={(e) => updateBizForm("staffPhone", e.target.value)}
                        className="w-full border border-gray-200 px-[12px] py-[10px] text-sm focus:border-accent focus:outline-none"
                        placeholder="0985-12-3458"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* ステップ1: 既存事業者選択 */}
              {regStep === "business" && regType === "existing" && (
                <div className="px-[24px] py-[24px] space-y-[16px]">
                  <p className="text-xs text-gray-400">店舗を追加する事業者を選択してください。</p>
                  <div>
                    <input
                      type="text"
                      value={bizSearch}
                      onChange={(e) => { setBizSearch(e.target.value); setSelectedBizId(""); }}
                      className="w-full border border-gray-200 px-[12px] py-[10px] text-sm focus:border-accent focus:outline-none"
                      placeholder="事業者名で検索..."
                    />
                  </div>
                  <div className="border border-gray-200 max-h-[280px] overflow-y-auto">
                    {filteredBizList.length > 0 ? (
                      filteredBizList.map((b) => {
                        const shopCount = mockVendors.filter((v) => v.business_id === b.id).length;
                        return (
                          <button
                            key={b.id}
                            onClick={() => { setSelectedBizId(b.id); setBizSearch(b.name); }}
                            className={
                              "w-full flex items-center justify-between px-[12px] py-[12px] text-left border-b border-gray-50 last:border-b-0 " +
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
                      <p className="px-[12px] py-[12px] text-xs text-gray-400">該当する事業者がありません</p>
                    )}
                  </div>
                </div>
              )}

              {/* ステップ2: 店舗情報 */}
              {regStep === "shop" && (
                <div className="px-[24px] py-[24px] space-y-[20px]">
                  {/* 選択済み事業者の確認 */}
                  <div className="bg-gray-50 border border-gray-100 px-[16px] py-[12px]">
                    <p className="text-xs text-gray-400 mb-[2px]">事業者</p>
                    <p className="text-sm font-medium text-gray-800">
                      {regType === "new"
                        ? bizForm.name
                        : mockBusinessEntities.find((b) => b.id === selectedBizId)?.name}
                    </p>
                  </div>

                  <p className="text-xs text-gray-400">
                    この事業者に紐づく店舗情報を入力してください。登録後、事業者側で詳細情報を入力できるようになります。
                  </p>

                  {/* 店舗名 */}
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-[4px]">
                      店舗名 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={newShopName}
                      onChange={(e) => setNewShopName(e.target.value)}
                      className="w-full border border-gray-200 px-[12px] py-[10px] text-sm focus:border-accent focus:outline-none"
                      placeholder="例: サンシャインモータース宮崎本店"
                    />
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
                </div>
              )}
            </div>

            {/* フッター */}
            {regStep !== "select" && (
              <div className="flex items-center justify-end gap-[8px] px-[24px] py-[16px] border-t border-gray-100 shrink-0">
                <button
                  onClick={closeModal}
                  className="border border-gray-300 px-[20px] py-[10px] text-sm hover:bg-gray-50"
                >
                  キャンセル
                </button>
                {regStep === "business" && (
                  <button
                    onClick={() => setRegStep("shop")}
                    disabled={!canProceedBusiness}
                    className="bg-accent text-white px-[20px] py-[10px] text-sm hover:bg-accent/90 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    次へ：店舗情報
                  </button>
                )}
                {regStep === "shop" && (
                  <button
                    onClick={handleRegister}
                    disabled={!canRegister}
                    className="bg-accent text-white px-[20px] py-[10px] text-sm hover:bg-accent/90 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    登録して事業者に引き渡す
                  </button>
                )}
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

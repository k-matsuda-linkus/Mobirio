"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Trash2 } from "lucide-react";
import { VendorPageHeader } from "@/components/vendor/VendorPageHeader";

const inputClass =
  "border border-gray-300 px-[10px] py-[6px] text-sm w-full focus:outline-none focus:border-accent";
const sectionClass = "bg-white border border-gray-200 p-[20px]";
const labelClass = "block text-sm font-medium text-gray-700 mb-[4px]";

// モック初期データ（cpn-001ベース）
const MOCK_INITIAL = {
  code: "WELCOME10",
  name: "初回10%OFFクーポン",
  description: "初回ご利用のお客様向けクーポン",
  discount_type: "percentage" as const,
  discount_value: 10,
  max_discount: 2000,
  min_order_amount: 0,
  usage_limit: 100,
  usage_count: 42,
  per_user_limit: 1,
  valid_from: "2026-01-01",
  valid_until: "2026-12-31",
  is_active: true,
};

export default function CouponEditPage() {
  const params = useParams();
  const router = useRouter();
  const couponId = params.id as string;

  const [code, setCode] = useState(MOCK_INITIAL.code);
  const [name, setName] = useState(MOCK_INITIAL.name);
  const [description, setDescription] = useState(MOCK_INITIAL.description);
  const [discountType, setDiscountType] = useState<"fixed" | "percentage">(MOCK_INITIAL.discount_type);
  const [discountValue, setDiscountValue] = useState<number | "">(MOCK_INITIAL.discount_value);
  const [maxDiscount, setMaxDiscount] = useState<number | "">(MOCK_INITIAL.max_discount);
  const [minOrderAmount, setMinOrderAmount] = useState<number | "">(MOCK_INITIAL.min_order_amount);
  const [usageLimit, setUsageLimit] = useState<number | "">(MOCK_INITIAL.usage_limit);
  const [perUserLimit, setPerUserLimit] = useState<number | "">(MOCK_INITIAL.per_user_limit);
  const [validFrom, setValidFrom] = useState(MOCK_INITIAL.valid_from);
  const [validUntil, setValidUntil] = useState(MOCK_INITIAL.valid_until);
  const [isActive, setIsActive] = useState(MOCK_INITIAL.is_active);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!code.trim()) {
      newErrors.code = "クーポンコードは必須です";
    } else if (!/^[A-Z0-9]+$/.test(code)) {
      newErrors.code = "英数字大文字のみ使用できます";
    }

    if (!name.trim()) {
      newErrors.name = "クーポン名は必須です";
    }

    if (discountValue === "" || Number(discountValue) <= 0) {
      newErrors.discountValue = "割引額は0より大きい値を入力してください";
    }

    if (!validFrom) {
      newErrors.validFrom = "開始日は必須です";
    }

    if (!validUntil) {
      newErrors.validUntil = "終了日は必須です";
    }

    if (validFrom && validUntil && validFrom >= validUntil) {
      newErrors.validUntil = "終了日は開始日より後の日付にしてください";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const formData = {
      id: couponId,
      code,
      name,
      description,
      discount_type: discountType,
      discount_value: Number(discountValue),
      max_discount: discountType === "percentage" && maxDiscount !== "" ? Number(maxDiscount) : null,
      min_order_amount: Number(minOrderAmount) || 0,
      usage_limit: Number(usageLimit) || null,
      per_user_limit: Number(perUserLimit) || 1,
      valid_from: validFrom,
      valid_until: validUntil,
      is_active: isActive,
    };

    console.log("クーポン更新データ:", formData);
    router.push("/vendor/coupons");
  };

  const handleDelete = () => {
    if (window.confirm("このクーポンを削除してもよろしいですか？この操作は取り消せません。")) {
      console.log("クーポン削除:", couponId);
      router.push("/vendor/coupons");
    }
  };

  return (
    <div>
      <VendorPageHeader
        title="クーポン編集"
        breadcrumbs={[
          { label: "クーポン管理", href: "/vendor/coupons" },
          { label: "編集" },
        ]}
      />

      <form onSubmit={handleSubmit} className="space-y-[20px] max-w-[720px]">
        {/* 基本情報 */}
        <div className={sectionClass}>
          <h2 className="text-sm font-medium text-gray-800 mb-[16px]">基本情報</h2>
          <div className="space-y-[16px]">
            <div>
              <label className={labelClass}>
                クーポンコード <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="例: WELCOME10"
                className={inputClass}
              />
              <p className="text-xs text-gray-400 mt-[4px]">英数字大文字のみ</p>
              {errors.code && <p className="text-xs text-red-500 mt-[2px]">{errors.code}</p>}
            </div>

            <div>
              <label className={labelClass}>
                クーポン名 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="例: 初回10%OFFクーポン"
                className={inputClass}
              />
              {errors.name && <p className="text-xs text-red-500 mt-[2px]">{errors.name}</p>}
            </div>

            <div>
              <label className={labelClass}>説明</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="クーポンの説明（任意）"
                rows={3}
                className={inputClass}
              />
            </div>
          </div>
        </div>

        {/* 割引設定 */}
        <div className={sectionClass}>
          <h2 className="text-sm font-medium text-gray-800 mb-[16px]">割引設定</h2>
          <div className="space-y-[16px]">
            <div>
              <label className={labelClass}>割引タイプ</label>
              <select
                value={discountType}
                onChange={(e) => setDiscountType(e.target.value as "fixed" | "percentage")}
                className={inputClass}
              >
                <option value="fixed">定額割引</option>
                <option value="percentage">定率割引</option>
              </select>
            </div>

            <div>
              <label className={labelClass}>
                割引{discountType === "fixed" ? "額（円）" : "率（%）"}{" "}
                <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={discountValue}
                onChange={(e) => setDiscountValue(e.target.value === "" ? "" : Number(e.target.value))}
                placeholder={discountType === "fixed" ? "例: 500" : "例: 10"}
                min={1}
                className={inputClass}
              />
              {errors.discountValue && (
                <p className="text-xs text-red-500 mt-[2px]">{errors.discountValue}</p>
              )}
            </div>

            {discountType === "percentage" && (
              <div>
                <label className={labelClass}>最大割引額（円）</label>
                <input
                  type="number"
                  value={maxDiscount}
                  onChange={(e) => setMaxDiscount(e.target.value === "" ? "" : Number(e.target.value))}
                  placeholder="例: 2000（未設定で上限なし）"
                  min={0}
                  className={inputClass}
                />
              </div>
            )}

            <div>
              <label className={labelClass}>最低注文金額（円）</label>
              <input
                type="number"
                value={minOrderAmount}
                onChange={(e) => setMinOrderAmount(e.target.value === "" ? "" : Number(e.target.value))}
                placeholder="0で制限なし"
                min={0}
                className={inputClass}
              />
            </div>
          </div>
        </div>

        {/* 利用状況（読み取り専用） */}
        <div className={sectionClass}>
          <h2 className="text-sm font-medium text-gray-800 mb-[16px]">利用状況</h2>
          <div className="flex items-center gap-[20px]">
            <div>
              <span className="text-sm text-gray-500">利用回数</span>
              <p className="text-lg font-medium text-gray-800">
                {MOCK_INITIAL.usage_count} / {MOCK_INITIAL.usage_limit ?? "∞"}回
              </p>
            </div>
            <div className="flex-1 bg-gray-100 h-[8px]">
              <div
                className="bg-accent h-full"
                style={{
                  width: MOCK_INITIAL.usage_limit
                    ? `${Math.min((MOCK_INITIAL.usage_count / MOCK_INITIAL.usage_limit) * 100, 100)}%`
                    : "0%",
                }}
              />
            </div>
          </div>
        </div>

        {/* 利用制限 */}
        <div className={sectionClass}>
          <h2 className="text-sm font-medium text-gray-800 mb-[16px]">利用制限</h2>
          <div className="space-y-[16px]">
            <div>
              <label className={labelClass}>利用上限回数</label>
              <input
                type="number"
                value={usageLimit}
                onChange={(e) => setUsageLimit(e.target.value === "" ? "" : Number(e.target.value))}
                placeholder="0で無制限"
                min={0}
                className={inputClass}
              />
              <p className="text-xs text-gray-400 mt-[4px]">0を設定すると無制限になります</p>
            </div>

            <div>
              <label className={labelClass}>1人あたりの利用上限</label>
              <input
                type="number"
                value={perUserLimit}
                onChange={(e) => setPerUserLimit(e.target.value === "" ? "" : Number(e.target.value))}
                placeholder="デフォルト: 1"
                min={1}
                className={inputClass}
              />
            </div>
          </div>
        </div>

        {/* 有効期間 */}
        <div className={sectionClass}>
          <h2 className="text-sm font-medium text-gray-800 mb-[16px]">有効期間</h2>
          <div className="grid grid-cols-2 gap-[16px]">
            <div>
              <label className={labelClass}>
                開始日 <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={validFrom}
                onChange={(e) => setValidFrom(e.target.value)}
                className={inputClass}
              />
              {errors.validFrom && (
                <p className="text-xs text-red-500 mt-[2px]">{errors.validFrom}</p>
              )}
            </div>

            <div>
              <label className={labelClass}>
                終了日 <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
                className={inputClass}
              />
              {errors.validUntil && (
                <p className="text-xs text-red-500 mt-[2px]">{errors.validUntil}</p>
              )}
            </div>
          </div>
        </div>

        {/* 配布設定 */}
        <div className={sectionClass}>
          <h2 className="text-sm font-medium text-gray-800 mb-[16px]">配布設定</h2>
          <label className="flex items-center gap-[8px] cursor-pointer">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="accent-accent w-[16px] h-[16px]"
            />
            <span className="text-sm text-gray-700">クーポンを有効にする</span>
          </label>
          <p className="text-xs text-gray-400 mt-[4px]">
            無効にすると、有効期間内でもクーポンは利用できなくなります
          </p>
        </div>

        {/* アクションボタン */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-[12px]">
            <button
              type="submit"
              className="bg-accent text-white px-[24px] py-[10px] text-sm hover:bg-accent/90"
            >
              保存する
            </button>
            <Link
              href="/vendor/coupons"
              className="flex items-center gap-[6px] border border-gray-300 px-[24px] py-[10px] text-sm text-gray-600 hover:bg-gray-50"
            >
              <ArrowLeft className="w-[14px] h-[14px]" />
              戻る
            </Link>
          </div>
          <button
            type="button"
            onClick={handleDelete}
            className="flex items-center gap-[6px] border border-red-300 text-red-600 px-[24px] py-[10px] text-sm hover:bg-red-50"
          >
            <Trash2 className="w-[14px] h-[14px]" />
            削除する
          </button>
        </div>
      </form>
    </div>
  );
}

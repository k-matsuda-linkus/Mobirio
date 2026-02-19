"use client";

import { useState } from "react";
import { VendorPageHeader } from "@/components/vendor/VendorPageHeader";
import { mockBusinessEntity, type BusinessEntity } from "@/lib/mock/business";

export default function BusinessInfoPage() {
  const [form, setForm] = useState<BusinessEntity>({ ...mockBusinessEntity });

  const update = <K extends keyof BusinessEntity>(key: K, value: BusinessEntity[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const inputClass =
    "w-full border border-gray-200 px-[12px] py-[10px] text-sm focus:border-accent focus:outline-none";
  const labelClass = "block text-xs font-medium text-gray-500 mb-[4px]";
  const sectionClass = "bg-white border border-gray-200 p-[24px] space-y-[16px]";
  const sectionTitle =
    "text-base font-medium text-gray-800 pb-[8px] border-b border-gray-100 mb-[16px]";

  return (
    <div>
      <VendorPageHeader
        title="事業者情報"
        breadcrumbs={[{ label: "事業者情報" }]}
      />

      <div className="space-y-[24px]">
        {/* 事業者区分 */}
        <div className={sectionClass}>
          <h2 className={sectionTitle}>事業者区分</h2>
          <div className="flex gap-[24px]">
            <label className="flex items-center gap-[6px] cursor-pointer">
              <input
                type="radio"
                name="bizType"
                value="corporation"
                checked={form.type === "corporation"}
                onChange={() => update("type", "corporation")}
                className="accent-accent"
              />
              <span className="text-sm">法人</span>
            </label>
            <label className="flex items-center gap-[6px] cursor-pointer">
              <input
                type="radio"
                name="bizType"
                value="sole_proprietor"
                checked={form.type === "sole_proprietor"}
                onChange={() => update("type", "sole_proprietor")}
                className="accent-accent"
              />
              <span className="text-sm">個人事業主</span>
            </label>
          </div>
        </div>

        {/* 基本情報 */}
        <div className={sectionClass}>
          <h2 className={sectionTitle}>基本情報</h2>

          <div>
            <label className={labelClass}>事業者名</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              className={inputClass}
            />
          </div>

          {form.type === "corporation" && (
            <div>
              <label className={labelClass}>法人番号（13桁）</label>
              <input
                type="text"
                value={form.corporateNumber ?? ""}
                onChange={(e) => update("corporateNumber", e.target.value)}
                className={inputClass + " max-w-[300px]"}
                maxLength={13}
                placeholder="1234567890123"
              />
            </div>
          )}

          <div>
            <label className={labelClass}>代表者名</label>
            <input
              type="text"
              value={form.representative}
              onChange={(e) => update("representative", e.target.value)}
              className={inputClass + " max-w-[300px]"}
            />
          </div>
        </div>

        {/* 連絡先 */}
        <div className={sectionClass}>
          <h2 className={sectionTitle}>連絡先</h2>

          <div className="grid grid-cols-2 gap-[16px]">
            <div>
              <label className={labelClass}>郵便番号</label>
              <input
                type="text"
                value={form.postalCode}
                onChange={(e) => update("postalCode", e.target.value)}
                className={inputClass}
                placeholder="000-0000"
              />
            </div>
            <div>
              <label className={labelClass}>電話番号</label>
              <input
                type="text"
                value={form.phone}
                onChange={(e) => update("phone", e.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>住所</label>
            <input
              type="text"
              value={form.address}
              onChange={(e) => update("address", e.target.value)}
              className={inputClass}
            />
          </div>

          <div className="grid grid-cols-2 gap-[16px]">
            <div>
              <label className={labelClass}>FAX</label>
              <input
                type="text"
                value={form.fax ?? ""}
                onChange={(e) => update("fax", e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>メールアドレス</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
                className={inputClass}
              />
            </div>
          </div>
        </div>

        {/* 担当者 */}
        <div className={sectionClass}>
          <h2 className={sectionTitle}>担当者</h2>

          <div className="grid grid-cols-2 gap-[16px]">
            <div>
              <label className={labelClass}>担当者名</label>
              <input
                type="text"
                value={form.staff}
                onChange={(e) => update("staff", e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>担当者電話番号</label>
              <input
                type="text"
                value={form.staffPhone ?? ""}
                onChange={(e) => update("staffPhone", e.target.value)}
                className={inputClass}
              />
            </div>
          </div>
        </div>

        {/* フッター */}
        <div className="flex justify-end pt-[16px] pb-[40px]">
          <button
            type="button"
            onClick={() => alert("保存しました")}
            className="bg-accent text-white px-[32px] py-[10px] text-sm hover:bg-accent/90"
          >
            保存
          </button>
        </div>
      </div>
    </div>
  );
}

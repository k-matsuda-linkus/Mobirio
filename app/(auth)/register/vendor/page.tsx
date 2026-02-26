"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { VENDOR_PLANS } from "@/lib/mock/vendors";
import type { VendorPlan } from "@/lib/mock/vendors";

const STEPS_INVITED = ["店舗情報", "確認"];
const STEPS_DEFAULT = ["アカウント情報", "店舗情報", "確認"];

export default function VendorRegisterPage() {
  const [step, setStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isInvited, setIsInvited] = useState(false);
  const [invitedEmail, setInvitedEmail] = useState("");
  const [invitedPlan, setInvitedPlan] = useState<VendorPlan | null>(null);
  const [invitedRegType, setInvitedRegType] = useState<"new" | "existing">("new");
  const [invitedBusinessId, setInvitedBusinessId] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    shopName: "",
    shopAddress: "",
    prefecture: "",
    city: "",
    phone: "",
    description: "",
  });

  // 認証済みユーザーチェック（招待経由）
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
          const meta = user.user_metadata;
          setIsInvited(true);
          setInvitedEmail(user.email || "");
          if (meta?.plan && meta.plan in VENDOR_PLANS) {
            setInvitedPlan(meta.plan as VendorPlan);
          }
          if (meta?.regType === "new" || meta?.regType === "existing") {
            setInvitedRegType(meta.regType);
          }
          if (meta?.businessId) {
            setInvitedBusinessId(meta.businessId);
          }
        }
      } catch {
        // 未認証 — 通常フロー
      } finally {
        setIsCheckingAuth(false);
      }
    };
    checkAuth();
  }, []);

  const STEPS = isInvited ? STEPS_INVITED : STEPS_DEFAULT;
  const shopStepIndex = isInvited ? 0 : 1;
  const confirmStepIndex = isInvited ? 1 : 2;

  const update = (key: string, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const next = () => setStep((s) => Math.min(s + 1, STEPS.length - 1));
  const prev = () => setStep((s) => Math.max(s - 1, 0));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setSubmitError("");

    try {
      if (isInvited) {
        // 招待経由: サーバーAPIで登録
        const res = await fetch("/api/auth/register/vendor", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            shopName: form.shopName,
            prefecture: form.prefecture,
            city: form.city,
            address: form.shopAddress,
            phone: form.phone,
            description: form.description,
            name: form.name,
            plan: invitedPlan,
            regType: invitedRegType,
            businessId: invitedBusinessId,
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          setSubmitError(data.error || "登録に失敗しました");
          return;
        }

        setSubmitSuccess(true);
      } else {
        // 自主登録フロー（既存のモック）
        await new Promise((r) => setTimeout(r, 2000));
        setSubmitSuccess(true);
      }
    } catch {
      setSubmitError("通信エラーが発生しました");
    } finally {
      setIsLoading(false);
    }
  };

  const inputClass =
    "w-full px-[14px] py-[12px] border border-gray-200 text-sm font-sans text-black placeholder:text-gray-400 focus:outline-none focus:border-black transition-colors";

  if (isCheckingAuth) {
    return (
      <div className="text-center py-[40px]">
        <p className="text-sm text-gray-400">読み込み中...</p>
      </div>
    );
  }

  if (submitSuccess) {
    return (
      <div className="text-center py-[40px]">
        <h1 className="font-serif text-2xl font-light text-black mb-[16px]">登録申請完了</h1>
        <p className="text-sm text-gray-600 mb-[24px]">
          ベンダー登録の申請を受け付けました。<br />
          管理者の承認後、ダッシュボードをご利用いただけます。
        </p>
        <Link href="/" className="text-sm text-black underline hover:no-underline">
          トップページに戻る
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-serif text-2xl font-light text-center text-black mb-[24px]">
        ベンダー登録
      </h1>

      {/* 招待経由の案内 */}
      {isInvited && (
        <div className="bg-gray-50 border border-gray-100 px-[16px] py-[12px] mb-[24px]">
          <p className="text-xs text-gray-500 mb-[4px]">招待メールからのご登録</p>
          <p className="text-sm text-black">{invitedEmail}</p>
          {invitedPlan && (
            <p className="text-xs text-gray-500 mt-[4px]">
              契約プラン: <span className="font-medium text-black">{VENDOR_PLANS[invitedPlan].label}</span>
            </p>
          )}
        </div>
      )}

      {/* Step indicator */}
      <div className="flex items-center justify-center gap-[8px] mb-[32px]">
        {STEPS.map((label, i) => (
          <div key={label} className="flex items-center gap-[8px]">
            <div
              className={`w-[28px] h-[28px] flex items-center justify-center text-xs font-sans font-medium ${
                i <= step ? "bg-black text-white" : "bg-gray-100 text-gray-400"
              }`}
            >
              {i + 1}
            </div>
            <span
              className={`text-xs font-sans hidden sm:inline ${
                i <= step ? "text-black" : "text-gray-400"
              }`}
            >
              {label}
            </span>
            {i < STEPS.length - 1 && (
              <div className="w-[20px] h-[1px] bg-gray-200" />
            )}
          </div>
        ))}
      </div>

      {submitError && (
        <div className="bg-red-50 border border-red-200 px-[16px] py-[12px] mb-[16px]">
          <p className="text-sm text-red-600">{submitError}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-[18px]">
        {/* アカウント情報（未招待のみ） */}
        {!isInvited && step === 0 && (
          <>
            <div>
              <label className="block text-sm font-sans text-gray-600 mb-[6px]">担当者名</label>
              <input type="text" value={form.name} onChange={(e) => update("name", e.target.value)} required placeholder="田中 太郎" className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-sans text-gray-600 mb-[6px]">メールアドレス</label>
              <input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} required placeholder="vendor@example.com" className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-sans text-gray-600 mb-[6px]">パスワード</label>
              <input type="password" value={form.password} onChange={(e) => update("password", e.target.value)} required minLength={8} placeholder="8文字以上" className={inputClass} />
            </div>
            <button type="button" onClick={next} className="w-full bg-black text-white py-[14px] text-sm font-sans font-medium hover:bg-gray-900 transition-colors">
              次へ
            </button>
          </>
        )}

        {/* 店舗情報 */}
        {step === shopStepIndex && (isInvited || step === 1) && (
          <>
            {isInvited && (
              <div>
                <label className="block text-sm font-sans text-gray-600 mb-[6px]">担当者名</label>
                <input type="text" value={form.name} onChange={(e) => update("name", e.target.value)} required placeholder="田中 太郎" className={inputClass} />
              </div>
            )}
            <div>
              <label className="block text-sm font-sans text-gray-600 mb-[6px]">店舗名</label>
              <input type="text" value={form.shopName} onChange={(e) => update("shopName", e.target.value)} required placeholder="〇〇バイクレンタル" className={inputClass} />
            </div>
            <div className="grid grid-cols-2 gap-[12px]">
              <div>
                <label className="block text-sm font-sans text-gray-600 mb-[6px]">都道府県</label>
                <input type="text" value={form.prefecture} onChange={(e) => update("prefecture", e.target.value)} required placeholder="宮崎県" className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-sans text-gray-600 mb-[6px]">市区町村</label>
                <input type="text" value={form.city} onChange={(e) => update("city", e.target.value)} required placeholder="宮崎市" className={inputClass} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-sans text-gray-600 mb-[6px]">住所</label>
              <input type="text" value={form.shopAddress} onChange={(e) => update("shopAddress", e.target.value)} required placeholder="橘通西3-1-1" className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-sans text-gray-600 mb-[6px]">電話番号</label>
              <input type="tel" value={form.phone} onChange={(e) => update("phone", e.target.value)} required placeholder="0985-00-0000" className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-sans text-gray-600 mb-[6px]">店舗紹介</label>
              <textarea value={form.description} onChange={(e) => update("description", e.target.value)} rows={3} placeholder="店舗の特徴やサービス内容をご記入ください" className={inputClass + " resize-none"} />
            </div>
            <div className="flex gap-[12px]">
              {!isInvited && (
                <button type="button" onClick={prev} className="flex-1 border border-gray-200 text-black py-[14px] text-sm font-sans font-medium hover:bg-gray-50 transition-colors">
                  戻る
                </button>
              )}
              <button type="button" onClick={next} className={`${isInvited ? "w-full" : "flex-1"} bg-black text-white py-[14px] text-sm font-sans font-medium hover:bg-gray-900 transition-colors`}>
                次へ
              </button>
            </div>
          </>
        )}

        {/* 確認 */}
        {step === confirmStepIndex && (
          <>
            <div className="border border-gray-100 divide-y divide-gray-100">
              {[
                ["担当者名", form.name],
                ["メールアドレス", isInvited ? invitedEmail : form.email],
                ...(invitedPlan ? [["契約プラン", VENDOR_PLANS[invitedPlan].label]] : []),
                ["店舗名", form.shopName],
                ["所在地", `${form.prefecture}${form.city}${form.shopAddress}`],
                ["電話番号", form.phone],
                ["店舗紹介", form.description || "（未入力）"],
              ].map(([label, value]) => (
                <div key={label} className="flex py-[12px] px-[16px]">
                  <span className="w-[120px] text-sm font-sans text-gray-500 shrink-0">{label}</span>
                  <span className="text-sm font-sans text-black">{value}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-[12px]">
              <button type="button" onClick={prev} className="flex-1 border border-gray-200 text-black py-[14px] text-sm font-sans font-medium hover:bg-gray-50 transition-colors">
                戻る
              </button>
              <button type="submit" disabled={isLoading} className="flex-1 bg-accent text-white py-[14px] text-sm font-sans font-medium hover:opacity-90 transition-opacity disabled:opacity-50">
                {isLoading ? "送信中..." : "登録申請する"}
              </button>
            </div>
          </>
        )}
      </form>

      <div className="mt-[24px] text-center">
        <p className="text-sm font-sans text-gray-500">
          個人のお客様は{" "}
          <Link href="/register" className="text-black underline hover:no-underline">こちらから登録</Link>
        </p>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";

export default function RegisterPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    agreeTerms: false,
  });
  const [isLoading, setIsLoading] = useState(false);

  const update = (key: string, value: string | boolean) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      alert("パスワードが一致しません");
      return;
    }
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 1500);
  };

  return (
    <div>
      <h1 className="font-serif text-2xl font-light text-center text-black mb-[32px]">
        新規登録
      </h1>

      <form onSubmit={handleSubmit} className="space-y-[18px]">
        <div>
          <label className="block text-sm font-sans text-gray-600 mb-[6px]">お名前</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => update("name", e.target.value)}
            required
            placeholder="田中 太郎"
            className="w-full px-[14px] py-[12px] border border-gray-200 text-sm font-sans text-black placeholder:text-gray-400 focus:outline-none focus:border-black transition-colors"
          />
        </div>

        <div>
          <label className="block text-sm font-sans text-gray-600 mb-[6px]">メールアドレス</label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => update("email", e.target.value)}
            required
            placeholder="example@email.com"
            className="w-full px-[14px] py-[12px] border border-gray-200 text-sm font-sans text-black placeholder:text-gray-400 focus:outline-none focus:border-black transition-colors"
          />
        </div>

        <div>
          <label className="block text-sm font-sans text-gray-600 mb-[6px]">電話番号</label>
          <input
            type="tel"
            value={form.phone}
            onChange={(e) => update("phone", e.target.value)}
            required
            placeholder="090-1234-5678"
            className="w-full px-[14px] py-[12px] border border-gray-200 text-sm font-sans text-black placeholder:text-gray-400 focus:outline-none focus:border-black transition-colors"
          />
        </div>

        <div>
          <label className="block text-sm font-sans text-gray-600 mb-[6px]">パスワード</label>
          <input
            type="password"
            value={form.password}
            onChange={(e) => update("password", e.target.value)}
            required
            minLength={8}
            placeholder="8文字以上"
            className="w-full px-[14px] py-[12px] border border-gray-200 text-sm font-sans text-black placeholder:text-gray-400 focus:outline-none focus:border-black transition-colors"
          />
        </div>

        <div>
          <label className="block text-sm font-sans text-gray-600 mb-[6px]">パスワード確認</label>
          <input
            type="password"
            value={form.confirmPassword}
            onChange={(e) => update("confirmPassword", e.target.value)}
            required
            placeholder="パスワードを再入力"
            className="w-full px-[14px] py-[12px] border border-gray-200 text-sm font-sans text-black placeholder:text-gray-400 focus:outline-none focus:border-black transition-colors"
          />
        </div>

        <label className="flex items-start gap-[10px] cursor-pointer">
          <input
            type="checkbox"
            checked={form.agreeTerms}
            onChange={(e) => update("agreeTerms", e.target.checked)}
            required
            className="mt-[3px] w-[16px] h-[16px] border border-gray-300 accent-black"
          />
          <span className="text-sm font-sans text-gray-600">
            <Link href="/terms" className="text-black underline" target="_blank">利用規約</Link>
            および
            <Link href="/privacy" className="text-black underline" target="_blank">プライバシーポリシー</Link>
            に同意します
          </span>
        </label>

        <button
          type="submit"
          disabled={isLoading || !form.agreeTerms}
          className="w-full bg-black text-white py-[14px] text-sm font-sans font-medium hover:bg-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? "登録中..." : "登録する"}
        </button>
      </form>

      <div className="mt-[24px] space-y-[12px] text-center">
        <p className="text-sm font-sans text-gray-500">
          アカウントをお持ちの方は{" "}
          <Link href="/login" className="text-black underline hover:no-underline">ログイン</Link>
        </p>
        <p className="text-sm font-sans text-gray-500">
          レンタル事業者の方は{" "}
          <Link href="/register/vendor" className="text-accent underline hover:no-underline">ベンダー登録</Link>
        </p>
      </div>
    </div>
  );
}

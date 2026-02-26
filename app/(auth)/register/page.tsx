"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

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
  const [error, setError] = useState("");
  const [isSent, setIsSent] = useState(false);

  const update = (key: string, value: string | boolean) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      setError("パスワードが一致しません");
      return;
    }
    setIsLoading(true);
    setError("");

    const supabase = createClient();
    const { error: signUpError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: {
          full_name: form.name,
          phone: form.phone,
          user_type: "customer",
        },
      },
    });

    setIsLoading(false);

    if (signUpError) {
      if (signUpError.status === 422 || signUpError.message?.includes("already")) {
        setError("このメールアドレスは既に登録されています");
      } else {
        setError("登録に失敗しました。もう一度お試しください。");
      }
      return;
    }

    setIsSent(true);
  };

  if (isSent) {
    return (
      <div className="text-center">
        <div className="w-[56px] h-[56px] bg-accent/10 flex items-center justify-center mx-auto mb-[20px]">
          <svg className="w-[28px] h-[28px] text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="square" strokeLinejoin="miter" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
          </svg>
        </div>
        <h2 className="font-serif text-xl font-light text-black mb-[12px]">
          確認メールを送信しました
        </h2>
        <p className="text-sm font-sans text-gray-500 mb-[24px] leading-relaxed">
          <span className="text-black font-medium">{form.email}</span> 宛に<br />
          確認メールを送信しました。<br />
          メール内のリンクをクリックして登録を完了してください。
        </p>
        <Link
          href="/login"
          className="inline-block text-sm font-sans text-gray-500 hover:text-black transition-colors underline"
        >
          ログインに戻る
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-serif text-2xl font-light text-center text-black mb-[32px]">
        新規登録
      </h1>

      {error && (
        <div className="mb-[20px] px-[14px] py-[12px] bg-red-50 border border-red-200 text-sm font-sans text-red-600">
          {error}
        </div>
      )}

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

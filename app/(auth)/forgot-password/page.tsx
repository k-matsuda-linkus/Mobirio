"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { env } from "@/lib/env";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    const supabase = createClient();
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      email,
      { redirectTo: env.appUrl() + "/auth/set-password" }
    );

    setIsLoading(false);

    if (resetError) {
      setError("送信に失敗しました。もう一度お試しください。");
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
          メールを送信しました
        </h2>
        <p className="text-sm font-sans text-gray-500 mb-[24px] leading-relaxed">
          <span className="text-black font-medium">{email}</span> 宛に<br />
          パスワードリセットのリンクを送信しました。<br />
          メールをご確認ください。
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
      <h1 className="font-serif text-2xl font-light text-center text-black mb-[12px]">
        パスワードリセット
      </h1>
      <p className="text-sm font-sans text-gray-500 text-center mb-[32px]">
        登録済みのメールアドレスを入力してください
      </p>

      {error && (
        <div className="mb-[20px] px-[14px] py-[12px] bg-red-50 border border-red-200 text-sm font-sans text-red-600">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-[20px]">
        <div>
          <label className="block text-sm font-sans text-gray-600 mb-[6px]">
            メールアドレス
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="example@email.com"
            className="w-full px-[14px] py-[12px] border border-gray-200 text-sm font-sans text-black placeholder:text-gray-400 focus:outline-none focus:border-black transition-colors"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-black text-white py-[14px] text-sm font-sans font-medium hover:bg-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? "送信中..." : "リセットメール送信"}
        </button>
      </form>

      <div className="mt-[24px] text-center">
        <Link
          href="/login"
          className="text-sm font-sans text-gray-500 hover:text-black transition-colors"
        >
          ログインに戻る
        </Link>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 1500);
  };

  return (
    <div>
      <h1 className="font-serif text-2xl font-light text-center text-black mb-[32px]">
        ログイン
      </h1>

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

        <div>
          <label className="block text-sm font-sans text-gray-600 mb-[6px]">
            パスワード
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="••••••••"
            className="w-full px-[14px] py-[12px] border border-gray-200 text-sm font-sans text-black placeholder:text-gray-400 focus:outline-none focus:border-black transition-colors"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-black text-white py-[14px] text-sm font-sans font-medium hover:bg-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? "ログイン中..." : "ログイン"}
        </button>
      </form>

      <div className="mt-[24px] space-y-[12px] text-center">
        <Link
          href="/forgot-password"
          className="block text-sm font-sans text-gray-500 hover:text-black transition-colors"
        >
          パスワードをお忘れですか？
        </Link>
        <p className="text-sm font-sans text-gray-500">
          アカウントをお持ちでない方は{" "}
          <Link
            href="/register"
            className="text-black underline hover:no-underline"
          >
            新規登録はこちら
          </Link>
        </p>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Admin login:", { email, password });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-[20px]">
      <div className="w-full max-w-[400px]">
        <div className="text-center mb-[40px]">
          <Link href="/" className="font-serif text-2xl font-light tracking-wide">Mobirio</Link>
          <h1 className="font-serif text-xl font-light mt-[16px]">管理者ログイン</h1>
          <p className="text-sm font-sans text-gray-500 mt-[8px]">管理画面へのアクセスには認証が必要です</p>
        </div>
        <form onSubmit={handleSubmit} className="bg-white border border-gray-200 p-[32px]">
          <div className="mb-[20px]">
            <label className="block text-sm font-sans text-gray-700 mb-[6px]">メールアドレス</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@mobirio.jp" className="w-full border border-gray-300 px-[12px] py-[10px] text-sm font-sans focus:outline-none focus:border-accent" required />
          </div>
          <div className="mb-[24px]">
            <label className="block text-sm font-sans text-gray-700 mb-[6px]">パスワード</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="w-full border border-gray-300 px-[12px] py-[10px] text-sm font-sans focus:outline-none focus:border-accent" required />
          </div>
          <button type="submit" className="w-full bg-black text-white py-[12px] text-sm font-sans hover:bg-gray-800 transition-colors">ログイン</button>
        </form>
        <p className="text-center text-xs font-sans text-gray-400 mt-[24px]">
          管理者専用ページです。一般ユーザーは<Link href="/login" className="text-accent hover:underline">こちら</Link>からログインしてください。
        </p>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isDone, setIsDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      alert("パスワードが一致しません");
      return;
    }
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setIsDone(true);
      setTimeout(() => router.push("/login"), 2000);
    }, 1500);
  };

  if (isDone) {
    return (
      <div className="text-center py-[20px]">
        <div className="w-[56px] h-[56px] bg-accent/10 flex items-center justify-center mx-auto mb-[20px]">
          <svg className="w-[28px] h-[28px] text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="square" strokeLinejoin="miter" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </div>
        <h2 className="font-serif text-xl font-light text-black mb-[8px]">
          パスワードを設定しました
        </h2>
        <p className="text-sm font-sans text-gray-500">
          ログインページへリダイレクトします...
        </p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-serif text-2xl font-light text-center text-black mb-[12px]">
        新しいパスワード設定
      </h1>
      <p className="text-sm font-sans text-gray-500 text-center mb-[32px]">
        新しいパスワードを入力してください
      </p>

      <form onSubmit={handleSubmit} className="space-y-[20px]">
        <div>
          <label className="block text-sm font-sans text-gray-600 mb-[6px]">
            新しいパスワード
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            placeholder="8文字以上"
            className="w-full px-[14px] py-[12px] border border-gray-200 text-sm font-sans text-black placeholder:text-gray-400 focus:outline-none focus:border-black transition-colors"
          />
        </div>

        <div>
          <label className="block text-sm font-sans text-gray-600 mb-[6px]">
            パスワード確認
          </label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            placeholder="パスワードを再入力"
            className="w-full px-[14px] py-[12px] border border-gray-200 text-sm font-sans text-black placeholder:text-gray-400 focus:outline-none focus:border-black transition-colors"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-black text-white py-[14px] text-sm font-sans font-medium hover:bg-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? "設定中..." : "設定する"}
        </button>
      </form>
    </div>
  );
}

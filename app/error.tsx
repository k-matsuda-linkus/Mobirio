"use client";

import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center px-[30px]">
      <div className="text-center max-w-[480px]">
        <p className="text-[120px] font-serif font-light leading-none text-gray-200">
          500
        </p>
        <h1 className="mt-[20px] font-serif font-light text-2xl">
          エラーが発生しました
        </h1>
        <p className="mt-[12px] text-gray-500 text-sm leading-relaxed">
          {error.message || "予期しないエラーが発生しました。"}
        </p>
        <div className="mt-[30px] flex items-center justify-center gap-[16px]">
          <button
            onClick={reset}
            className="px-[32px] py-[14px] bg-black text-white text-sm font-medium hover:bg-gray-800 transition-colors"
          >
            再試行
          </button>
          <Link
            href="/"
            className="px-[32px] py-[14px] border border-gray-300 text-sm font-medium text-gray-700 hover:border-black hover:text-black transition-colors"
          >
            トップへ戻る
          </Link>
        </div>
      </div>
    </div>
  );
}

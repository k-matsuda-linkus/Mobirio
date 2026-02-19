"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push("/mypage");
    }, 3000);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="text-center py-[20px]">
      {/* Spinner */}
      <div className="w-[40px] h-[40px] border-[2px] border-gray-200 border-t-black animate-spin mx-auto mb-[24px]" />

      <h2 className="font-serif text-lg font-light text-black mb-[8px]">
        認証中...
      </h2>
      <p className="text-sm font-sans text-gray-500">
        しばらくお待ちください。自動的にリダイレクトされます。
      </p>
    </div>
  );
}

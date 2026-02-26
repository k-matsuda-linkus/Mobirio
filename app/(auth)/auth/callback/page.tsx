"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");

  useEffect(() => {
    const handleCallback = async () => {
      const supabase = createClient();
      const { data: { user }, error } = await supabase.auth.getUser();

      if (error || !user) {
        setStatus("error");
        setTimeout(() => router.push("/login"), 3000);
        return;
      }

      setStatus("success");

      // ロール別リダイレクト
      let destination = "/mypage";
      try {
        const { data: profile } = await supabase
          .from("users")
          .select("role")
          .eq("id", user.id)
          .single();

        if (profile?.role === "vendor") {
          destination = "/vendor";
        } else if (profile?.role === "admin") {
          destination = "/dashboard";
        }
      } catch {
        // プロフィール取得失敗時はデフォルトの /mypage へ
      }

      setTimeout(() => router.push(destination), 1500);
    };

    handleCallback();
  }, [router]);

  if (status === "error") {
    return (
      <div className="text-center py-[20px]">
        <div className="w-[56px] h-[56px] bg-red-50 flex items-center justify-center mx-auto mb-[20px]">
          <svg className="w-[28px] h-[28px] text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="square" strokeLinejoin="miter" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <h2 className="font-serif text-lg font-light text-black mb-[8px]">
          認証に失敗しました
        </h2>
        <p className="text-sm font-sans text-gray-500">
          ログインページにリダイレクトします...
        </p>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="text-center py-[20px]">
        <div className="w-[56px] h-[56px] bg-accent/10 flex items-center justify-center mx-auto mb-[20px]">
          <svg className="w-[28px] h-[28px] text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="square" strokeLinejoin="miter" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </div>
        <h2 className="font-serif text-lg font-light text-black mb-[8px]">
          認証が完了しました
        </h2>
        <p className="text-sm font-sans text-gray-500">
          リダイレクトしています...
        </p>
      </div>
    );
  }

  return (
    <div className="text-center py-[20px]">
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

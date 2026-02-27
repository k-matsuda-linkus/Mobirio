"use client";

import { useRouter } from "next/navigation";
import VendorOptionForm from "@/components/vendor/VendorOptionForm";

export default function NewOptionPage() {
  const router = useRouter();

  return (
    <div>
      <div className="mb-[30px]">
        <p className="text-xs text-gray-400 mb-[4px]">オプション管理 &gt; 新規追加</p>
        <h1 className="font-serif font-light text-2xl">オプション新規追加</h1>
      </div>
      <div className="bg-white border border-gray-100 p-[24px]">
        <VendorOptionForm
          onSubmit={async (data) => {
            try {
              const res = await fetch("/api/vendor/options", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
              });
              const json = await res.json();
              if (res.ok) {
                alert("オプションを作成しました");
                router.push("/vendor/options");
              } else {
                alert(json.message || "作成に失敗しました");
              }
            } catch {
              alert("作成に失敗しました");
            }
          }}
        />
      </div>
    </div>
  );
}

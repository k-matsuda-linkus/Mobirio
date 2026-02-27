"use client";

import VendorPricingForm from "@/components/vendor/VendorPricingForm";

export default function VendorPricingPage() {
  return (
    <div>
      <h1 className="font-serif text-2xl font-light mb-[24px]">料金設定</h1>
      <div className="bg-white border border-gray-100 p-[24px]">
        <VendorPricingForm
          onSubmit={async (rules, validFrom, validTo) => {
            try {
              const res = await fetch("/api/vendor/pricing", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  rules: rules.map((r) => ({
                    duration: r.duration,
                    price: r.price,
                    valid_from: validFrom || null,
                    valid_until: validTo || null,
                  })),
                }),
              });
              const json = await res.json();
              if (res.ok) {
                alert("料金設定を保存しました");
              } else {
                alert(json.message || "保存に失敗しました");
              }
            } catch {
              alert("保存に失敗しました");
            }
          }}
        />
      </div>
    </div>
  );
}

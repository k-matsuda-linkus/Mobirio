"use client";
import VendorPricingForm from "@/components/vendor/VendorPricingForm";

export default function VendorPricingPage() {
  return (
    <div>
      <h1 className="font-serif text-2xl font-light mb-[24px]">料金設定</h1>
      <div className="bg-white border border-gray-100 p-[24px]">
        <VendorPricingForm vendorId="v-001" onSubmit={() => {}} />
      </div>
    </div>
  );
}

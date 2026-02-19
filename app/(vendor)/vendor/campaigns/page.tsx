"use client";

import { Construction } from "lucide-react";
import { VendorPageHeader } from "@/components/vendor/VendorPageHeader";
import { StatusBadge } from "@/components/vendor/StatusBadge";

export default function VendorCampaignsPage() {
  return (
    <div>
      <VendorPageHeader
        title="キャンペーン一覧"
        breadcrumbs={[{ label: "キャンペーン一覧" }]}
        actions={<StatusBadge status="development" />}
      />

      <div className="flex items-center justify-center min-h-[400px]">
        <div className="bg-white border border-gray-200 px-[48px] py-[48px] text-center max-w-[480px] w-full">
          <div className="flex justify-center mb-[20px]">
            <div className="w-[64px] h-[64px] bg-orange-50 rounded-full flex items-center justify-center">
              <Construction className="w-[32px] h-[32px] text-orange-400" />
            </div>
          </div>
          <h2 className="text-lg font-medium text-gray-800 mb-[8px]">
            この機能は現在開発中です
          </h2>
          <p className="text-sm text-gray-500">
            今後のアップデートでご利用いただけるようになります。
          </p>
        </div>
      </div>
    </div>
  );
}

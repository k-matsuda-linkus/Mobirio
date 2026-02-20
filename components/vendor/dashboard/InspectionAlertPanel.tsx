"use client";

import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { StatusBadge } from "@/components/vendor/StatusBadge";
import { mockBikes } from "@/lib/mock/bikes";

function getInspectionStatus(expiryDate: string): "inspection_expired" | "inspection_expiring" | "inspection_ok" {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(expiryDate);
  expiry.setHours(0, 0, 0, 0);
  const diffMs = expiry.getTime() - today.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return "inspection_expired";
  if (diffDays <= 30) return "inspection_expiring";
  return "inspection_ok";
}

function getDaysRemaining(expiryDate: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(expiryDate);
  expiry.setHours(0, 0, 0, 0);
  return Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export function InspectionAlertPanel() {
  const alertBikes = mockBikes
    .filter((bike) => bike.inspection_expiry)
    .map((bike) => {
      const status = getInspectionStatus(bike.inspection_expiry!);
      const daysRemaining = getDaysRemaining(bike.inspection_expiry!);
      return { ...bike, inspectionStatus: status, daysRemaining };
    })
    .filter((bike) => bike.inspectionStatus !== "inspection_ok")
    .sort((a, b) => a.daysRemaining - b.daysRemaining);

  if (alertBikes.length === 0) return null;

  return (
    <div className="bg-white border border-gray-200 p-[16px]">
      <div className="flex items-center gap-[8px] mb-[12px]">
        <AlertTriangle className="w-[16px] h-[16px] text-orange-500" />
        <h3 className="text-sm font-medium text-gray-700">車検・法定点検アラート</h3>
      </div>
      <div className="space-y-[8px]">
        {alertBikes.map((bike) => {
          const isExpired = bike.inspectionStatus === "inspection_expired";
          return (
            <div
              key={bike.id}
              className={
                "flex items-center justify-between px-[12px] py-[10px] border " +
                (isExpired
                  ? "bg-red-50 border-red-200"
                  : "bg-orange-50 border-orange-200")
              }
            >
              <div className="flex items-center gap-[12px] min-w-0">
                <div className="min-w-0">
                  <Link
                    href={`/vendor/bikes/${bike.id}/edit`}
                    className="text-sm font-medium text-gray-800 hover:text-accent hover:underline"
                  >
                    {bike.display_name || bike.name}
                  </Link>
                  <p className="text-xs text-gray-500">{bike.registration_number}</p>
                </div>
              </div>
              <div className="flex items-center gap-[12px] shrink-0">
                <div className="text-right">
                  <p className="text-xs text-gray-500">期限: {bike.inspection_expiry}</p>
                  <p className={"text-xs font-medium " + (isExpired ? "text-red-600" : "text-orange-600")}>
                    {isExpired
                      ? `${Math.abs(bike.daysRemaining)}日超過`
                      : `残り${bike.daysRemaining}日`}
                  </p>
                </div>
                <StatusBadge status={bike.inspectionStatus} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

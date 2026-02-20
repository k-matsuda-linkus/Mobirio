"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Image as ImageIcon } from "lucide-react";
import { PublishToggle } from "@/components/vendor/PublishToggle";

interface BikeGridCardProps {
  id: string;
  image: string;
  vehicleName: string;
  storeName: string;
  displacement: string;
  priceClass: string;
  publishStatus: string;
  utilizationRate?: number;
  onPublishChange: (id: string, isPublished: boolean) => void;
}

function getUtilizationBadgeClass(rate: number): string {
  if (rate >= 80) return "bg-green-500 text-white";
  if (rate >= 50) return "bg-yellow-500 text-white";
  return "bg-red-500 text-white";
}

export function BikeGridCard({
  id,
  image,
  vehicleName,
  storeName,
  displacement,
  priceClass,
  publishStatus,
  utilizationRate,
  onPublishChange,
}: BikeGridCardProps) {
  const [imgError, setImgError] = useState(false);
  const isPublished = publishStatus === "published";

  return (
    <div className="bg-white border border-gray-200 hover:shadow-md transition-shadow">
      {/* 画像エリア */}
      <div className="relative aspect-video bg-gray-100 overflow-hidden">
        {image && !imgError ? (
          <img
            src={image}
            alt={vehicleName}
            className="w-full h-full object-cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImageIcon className="w-[32px] h-[32px] text-gray-300" />
          </div>
        )}
        {/* 稼働率バッジ */}
        {utilizationRate !== undefined && (
          <span
            className={`absolute top-[8px] right-[8px] text-xs px-[6px] py-[2px] ${getUtilizationBadgeClass(utilizationRate)}`}
          >
            稼働 {utilizationRate}%
          </span>
        )}
      </div>

      {/* 本体 */}
      <div className="p-[12px]">
        <div className="text-xs text-gray-600">{storeName}</div>
        <Link
          href={`/vendor/bikes/${id}/edit`}
          className="text-sm font-semibold text-accent hover:underline"
        >
          {vehicleName}
        </Link>
        <div className="inline-flex gap-[8px] text-xs text-gray-700 mt-[4px]">
          <span>{displacement}</span>
          <span>{priceClass}</span>
        </div>
        <div className="mt-[8px]">
          <PublishToggle
            isPublished={isPublished}
            onChange={(value) => onPublishChange(id, value)}
          />
        </div>
      </div>
    </div>
  );
}

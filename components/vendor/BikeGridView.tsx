"use client";

import React from "react";
import { BikeGridCard } from "@/components/vendor/BikeGridCard";

interface BikeGridItem {
  id: string;
  image: string;
  vehicleName: string;
  storeName: string;
  displacement: string;
  priceClass: string;
  publishStatus: string;
  utilizationRate?: number;
}

interface BikeGridViewProps {
  bikes: BikeGridItem[];
  onPublishChange: (id: string, isPublished: boolean) => void;
}

export function BikeGridView({ bikes, onPublishChange }: BikeGridViewProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-[16px]">
      {bikes.map((bike) => (
        <BikeGridCard
          key={bike.id}
          id={bike.id}
          image={bike.image}
          vehicleName={bike.vehicleName}
          storeName={bike.storeName}
          displacement={bike.displacement}
          priceClass={bike.priceClass}
          publishStatus={bike.publishStatus}
          utilizationRate={bike.utilizationRate}
          onPublishChange={onPublishChange}
        />
      ))}
    </div>
  );
}

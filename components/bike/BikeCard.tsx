import Link from "next/link";
import Image from "next/image";
import { Bike } from "@/types/booking";
import { ENGINE_TYPES } from "@/lib/constants";
import { MapPin } from "lucide-react";

interface BikeCardProps {
  bike: Bike;
  vendorName?: string;
  vendorSlug?: string;
}

export default function BikeCard({ bike, vendorName, vendorSlug }: BikeCardProps) {
  const engineLabel = ENGINE_TYPES.find((e) => e.value === bike.engine_type)?.label || bike.engine_type;

  return (
    <div className="group relative border border-gray-100 hover:border-gray-300 transition-colors overflow-hidden">
      <Link
        href={`/bikes/${bike.id}`}
        className="block"
      >
        {/* Unavailable overlay */}
        {!bike.is_available && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/40">
            <span className="bg-white px-[16px] py-[6px] text-xs font-medium tracking-wider text-black">
              現在利用不可
            </span>
          </div>
        )}

        {/* Image area */}
        <div className="relative aspect-[4/3] bg-gray-100 overflow-hidden">
          {bike.image_urls && bike.image_urls.length > 0 && bike.image_urls[0] ? (
            <Image
              src={bike.image_urls[0]}
              alt={bike.name}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <span className="text-sm text-gray-300">No Image</span>
            </div>
          )}
        </div>

        {/* Info area */}
        <div className="p-[20px]">
          <p className="text-xs uppercase tracking-wider text-gray-400">
            {bike.manufacturer} &middot; {bike.model}
          </p>

          <h3 className="mt-[4px] font-serif text-lg leading-tight text-black">
            {bike.name}
          </h3>

          {/* Specs badges */}
          <div className="mt-[10px] flex flex-wrap gap-[6px]">
            <span className="border border-gray-200 px-[8px] py-[2px] text-xs text-gray-500">
              {bike.displacement}cc
            </span>
            <span className="border border-gray-200 px-[8px] py-[2px] text-xs text-gray-500">
              {engineLabel}
            </span>
          </div>

          {/* Price */}
          <div className="mt-[12px] flex items-baseline gap-[4px]">
            <span className="text-lg font-medium text-black">
              ¥{bike.daily_rate_1day.toLocaleString()}
            </span>
            <span className="text-xs text-gray-400">/日</span>
          </div>
        </div>
      </Link>

      {/* Vendor link */}
      {vendorName && vendorSlug && (
        <div className="px-[20px] pb-[16px]">
          <Link
            href={`/vendors/${vendorSlug}`}
            className="inline-flex items-center gap-[4px] text-xs text-gray-500 hover:text-accent transition-colors"
          >
            <MapPin size={12} />
            {vendorName}
          </Link>
        </div>
      )}
    </div>
  );
}

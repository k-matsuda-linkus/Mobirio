import Link from 'next/link';
import Image from 'next/image';
import { MapPin } from 'lucide-react';

type Vendor = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  prefecture: string;
  city: string;
  logo_url: string | null;
  cover_image_url: string | null;
};

type VendorCardProps = {
  vendor: Vendor;
};

export default function VendorCard({ vendor }: VendorCardProps) {
  const vendorUrl = '/vendors/' + vendor.slug;
  return (
    <Link href={vendorUrl} className="block border border-gray-100 bg-white transition-shadow hover:shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
      <div className="relative aspect-[3/1] bg-gray-100 overflow-hidden">
        {vendor.cover_image_url ? (
          <Image src={vendor.cover_image_url} alt={vendor.name} fill className="object-cover" sizes="(max-width:768px) 100vw,50vw" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center"><span className="text-gray-300 text-sm">No cover</span></div>
        )}
        {vendor.logo_url && (
          <div className="absolute bottom-[-20px] left-[16px] h-[40px] w-[40px] border-2 border-white bg-white overflow-hidden">
            <Image src={vendor.logo_url} alt="" fill className="object-contain" />
          </div>
        )}
      </div>
      <div className="p-[16px] pt-[28px]">
        <h3 className="font-serif text-lg font-medium text-black">{vendor.name}</h3>
        <div className="mt-[4px] flex items-center gap-[4px] text-sm text-gray-500">
          <MapPin className="h-[14px] w-[14px]" />
          <span>{vendor.prefecture} {vendor.city}</span>
        </div>
        {vendor.description && (
          <p className="mt-[8px] text-sm text-gray-600 line-clamp-2">{vendor.description}</p>
        )}
      </div>
    </Link>
  );
}

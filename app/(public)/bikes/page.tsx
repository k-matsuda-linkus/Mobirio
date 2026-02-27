import type { Metadata } from 'next';
import { mockBikes } from "@/lib/mock/bikes";
import { mockVendors } from "@/lib/mock/vendors";
import BikeCard from "@/components/bike/BikeCard";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'バイク一覧',
  description: 'Mobirioで借りられるレンタルバイク一覧。EVスクーターから大型バイクまで多彩な車両をご用意しています。',
  openGraph: {
    title: 'バイク一覧 | Mobirio',
    description: 'Mobirioで借りられるレンタルバイク一覧。EVスクーターから大型バイクまで。',
    url: 'https://mobirio.jp/bikes',
  },
};

export default function BikesPage() {
  return (
    <div className="py-[50px] md:py-[100px]">
      <div className="max-w-[1200px] mx-auto px-[30px] md:px-[50px]">
        <h1 className="font-serif font-light text-3xl md:text-4xl mb-[30px]">バイク一覧</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[20px]">
          {mockBikes.map((bike) => {
            const vendor = mockVendors.find((v) => v.id === bike.vendor_id);
            return (
              <BikeCard
                key={bike.id}
                bike={bike}
                vendorName={vendor?.name}
                vendorSlug={vendor?.slug}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

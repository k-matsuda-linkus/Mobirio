import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { mockBikes } from '@/lib/mock/bikes';
import { mockVendors } from '@/lib/mock/vendors';
import { RENTAL_DURATIONS } from '@/lib/constants';
import { MapPin, Phone } from 'lucide-react';
import { BikeGallery } from './BikeGallery';

export const revalidate = 3600;

const BASE_URL = 'https://mobirio.jp';

const ENGINE_LABELS: Record<string, string> = {
  electric: '電動',
  single: '単気筒',
  twin: '並列二気筒',
  parallel_twin: '並列二気筒',
  v_twin: 'V型二気筒',
  triple: '直列三気筒',
  inline_three: '直列三気筒',
  four: '直列四気筒',
  inline_four: '直列四気筒',
  v_four: 'V型四気筒',
  flat_twin: '水平対向二気筒',
};

const LICENSE_LABELS: Record<string, string> = {
  none: '免許不要',
  gentsuki: '原付免許',
  kogata: '小型限定普通二輪',
  futsu: '普通二輪',
  ogata: '大型二輪',
  at_small: 'AT小型限定普通二輪',
  at_medium: 'AT限定普通二輪',
  at_large: 'AT限定大型二輪',
  moped: '原付免許',
  small: '小型限定普通二輪',
  medium: '普通二輪',
  large: '大型二輪',
  electric_kickboard: '特定小型原付',
};

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const bike = mockBikes.find((b) => b.id === id);
  if (!bike) return { title: 'バイク詳細' };

  const vendor = mockVendors.find((v) => v.id === bike.vendor_id);
  const title = `${bike.name} | ${vendor?.name || 'Mobirio'}`;
  const description = bike.description
    || `${bike.manufacturer} ${bike.name}（${bike.displacement ? `${bike.displacement}cc` : '電動'}）のレンタル。1日 ¥${(bike.daily_rate_1day || 0).toLocaleString()} から。`;
  const imageUrl = bike.image_urls?.[0] || undefined;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${BASE_URL}/bikes/${id}`,
      type: 'website',
      ...(imageUrl && { images: [{ url: imageUrl, width: 1200, height: 630, alt: bike.name }] }),
    },
    twitter: {
      card: imageUrl ? 'summary_large_image' : 'summary',
      title,
      description,
      ...(imageUrl && { images: [imageUrl] }),
    },
  };
}

export default async function BikeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const bike = mockBikes.find((b) => b.id === id) || mockBikes[0];
  const vendor = mockVendors.find((v) => v.id === bike.vendor_id);

  /* --- JSON-LD: Product + BreadcrumbList --- */
  const productJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: bike.name,
    description: bike.description || `${bike.manufacturer} ${bike.name} レンタル`,
    brand: { '@type': 'Brand', name: bike.manufacturer },
    ...(bike.image_urls?.length && { image: bike.image_urls }),
    offers: {
      '@type': 'Offer',
      priceCurrency: 'JPY',
      price: bike.daily_rate_1day || 0,
      availability: 'https://schema.org/InStock',
      url: `${BASE_URL}/bikes/${id}`,
    },
  };

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'TOP', item: BASE_URL },
      { '@type': 'ListItem', position: 2, name: 'バイク一覧', item: `${BASE_URL}/bikes` },
      { '@type': 'ListItem', position: 3, name: bike.name, item: `${BASE_URL}/bikes/${id}` },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
    <div className="max-w-[1200px] mx-auto px-[30px] md:px-[50px] py-[50px] md:py-[100px]">
      <div className="grid md:grid-cols-2 gap-[50px]">
        {/* Gallery */}
        <div>
          {bike.image_urls && bike.image_urls.length > 0 ? (
            <BikeGallery images={bike.image_urls} name={bike.name} />
          ) : (
            <div className="aspect-[4/3] bg-gray-100 flex items-center justify-center text-gray-400">
              No Image
            </div>
          )}
        </div>

        {/* Info */}
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wider">{bike.manufacturer}</p>
          <h1 className="font-serif font-light text-3xl md:text-4xl mt-[8px]">{bike.name}</h1>
          <p className="text-sm text-gray-500 mt-[8px]">{bike.model}</p>

          <div className="mt-[30px] text-2xl font-medium">
            ¥{(bike.daily_rate_1day || 0).toLocaleString()}<span className="text-sm text-gray-400 ml-[4px]">/日</span>
          </div>

          {/* Specs */}
          <div className="mt-[30px] border-t border-gray-100">
            <h2 className="font-serif font-light text-lg mt-[20px] mb-[16px]">スペック</h2>
            <div className="space-y-[1px]">
              {[
                ['メーカー', bike.manufacturer],
                ['モデル', bike.model],
                ['年式', bike.year],
                ['排気量', bike.displacement ? `${bike.displacement}cc` : '電動'],
                ['エンジン', ENGINE_LABELS[bike.engine_type] || bike.engine_type],
                ['シート高', bike.seat_height ? `${bike.seat_height}mm` : '-'],
                ['重量', bike.weight ? `${bike.weight}kg` : '-'],
                ['必要免許', LICENSE_LABELS[bike.license_type] || bike.license_type],
              ].map(([label, value]) => (
                <div key={String(label)} className="flex justify-between py-[12px] border-b border-gray-50">
                  <span className="text-sm text-gray-500">{label}</span>
                  <span className="text-sm font-medium">{String(value || '-')}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Pricing */}
          <div className="mt-[30px]">
            <h2 className="font-serif font-light text-lg mb-[16px]">料金表</h2>
            <div className="border border-gray-100">
              {RENTAL_DURATIONS.map((d) => (
                <div key={d.value} className="flex justify-between px-[16px] py-[12px] border-b border-gray-50 last:border-b-0">
                  <span className="text-sm">{d.label}</span>
                  <span className="text-sm font-medium">¥{(bike.daily_rate_1day || 0).toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <Link href={`/book?bikeId=${id}`} className="block mt-[30px] bg-accent text-white text-center py-[16px] text-sm font-medium hover:bg-accent-dark transition-colors">
            このバイクを予約する
          </Link>
        </div>
      </div>

      {/* Description */}
      {bike.description && (
        <div className="mt-[80px]">
          <h2 className="font-serif font-light text-2xl mb-[20px]">詳細</h2>
          <p className="text-sm text-gray-600 leading-relaxed">{bike.description}</p>
        </div>
      )}

      {/* Vendor Shop */}
      {vendor && (
        <div className="mt-[80px]">
          <h2 className="font-serif font-light text-2xl mb-[24px]">取扱ショップ</h2>
          <div className="border border-gray-100 p-[30px]">
            <Link
              href={`/vendors/${vendor.slug}`}
              className="font-serif text-xl hover:text-accent transition-colors"
            >
              {vendor.name}
            </Link>
            <div className="mt-[16px] space-y-[10px]">
              <div className="flex items-center gap-[8px] text-sm text-gray-600">
                <MapPin size={16} className="text-gray-400 shrink-0" />
                <span>{vendor.address}</span>
              </div>
              <div className="flex items-center gap-[8px] text-sm text-gray-600">
                <Phone size={16} className="text-gray-400 shrink-0" />
                <span>{vendor.contact_phone}</span>
              </div>
            </div>
            <div className="mt-[20px]">
              <Link
                href={`/vendors/${vendor.slug}`}
                className="inline-block border border-gray-200 px-[20px] py-[10px] text-xs font-medium text-gray-600 hover:border-gray-400 hover:text-black transition-colors"
              >
                ショップ詳細を見る
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Related */}
      <div className="mt-[80px]">
        <h2 className="font-serif font-light text-2xl mb-[30px]">関連バイク</h2>
        <div className="grid md:grid-cols-3 gap-[20px]">
          {mockBikes.filter((b) => b.id !== id).slice(0, 3).map((b) => (
            <Link key={b.id} href={`/bikes/${b.id}`} className="border border-gray-100 hover:border-gray-300 transition-colors">
              <div className="aspect-[4/3] bg-gray-100 relative overflow-hidden">
                {b.image_urls && b.image_urls.length > 0 ? (
                  <Image
                    src={b.image_urls[0]}
                    alt={b.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-xs">No Image</div>
                )}
              </div>
              <div className="p-[20px]">
                <p className="text-xs text-gray-400">{b.manufacturer}</p>
                <p className="font-serif text-lg mt-[2px]">{b.name}</p>
                <p className="text-lg font-medium mt-[8px]">¥{(b.daily_rate_1day || 0).toLocaleString()}<span className="text-xs text-gray-400">/日</span></p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
    </>
  );
}

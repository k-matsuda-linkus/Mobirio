import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { mockVendors } from '@/lib/mock/vendors';
import { mockBikes } from '@/lib/mock/bikes';

export const revalidate = 3600;

const BASE_URL = 'https://mobirio.jp';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const vendor = mockVendors.find((v) => v.slug === id || v.id === id);
  if (!vendor) return { title: '店舗詳細' };

  const title = `${vendor.name} | Mobirio`;
  const description = vendor.description || `${vendor.name}（${vendor.prefecture} ${vendor.city}）のレンタルバイクショップ。`;
  const imageUrl = vendor.cover_image_url || vendor.logo_url || undefined;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${BASE_URL}/vendors/${vendor.slug}`,
      type: 'website',
      ...(imageUrl && { images: [{ url: imageUrl, width: 1200, height: 630, alt: vendor.name }] }),
    },
    twitter: {
      card: imageUrl ? 'summary_large_image' : 'summary',
      title,
      description,
      ...(imageUrl && { images: [imageUrl] }),
    },
  };
}

export default async function VendorDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const vendor = mockVendors.find((v) => v.slug === id || v.id === id) || mockVendors[0];
  const vendorBikes = mockBikes.filter((b) => b.vendor_id === vendor.id);

  /* --- JSON-LD: LocalBusiness + BreadcrumbList --- */
  const localBusinessJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: vendor.name,
    description: vendor.description || `${vendor.name} — レンタルバイクショップ`,
    ...(vendor.logo_url && { image: vendor.logo_url }),
    address: {
      '@type': 'PostalAddress',
      streetAddress: vendor.address,
      addressLocality: vendor.city,
      addressRegion: vendor.prefecture,
      postalCode: vendor.postal_code,
      addressCountry: 'JP',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: vendor.latitude,
      longitude: vendor.longitude,
    },
    telephone: vendor.contact_phone,
    email: vendor.contact_email,
    url: `${BASE_URL}/vendors/${vendor.slug}`,
  };

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'TOP', item: BASE_URL },
      { '@type': 'ListItem', position: 2, name: 'ショップ一覧', item: `${BASE_URL}/vendors` },
      { '@type': 'ListItem', position: 3, name: vendor.name, item: `${BASE_URL}/vendors/${vendor.slug}` },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
    <div className="max-w-[1200px] mx-auto px-[30px] md:px-[50px] py-[50px] md:py-[100px]">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-500 mb-[24px]">
        <Link href="/" className="hover:text-black transition-colors">TOP</Link>
        <span className="mx-[8px]">&gt;</span>
        <Link href="/vendors" className="hover:text-black transition-colors">ショップ一覧</Link>
        <span className="mx-[8px]">&gt;</span>
        <span className="text-black">{vendor.name}</span>
      </nav>

      {/* Cover */}
      <div className="aspect-[3/1] bg-gray-100 relative overflow-hidden mb-[40px]">
        {vendor.cover_image_url ? (
          <Image
            src={vendor.cover_image_url}
            alt={`${vendor.name} カバー画像`}
            fill
            className="object-cover"
            sizes="100vw"
            priority
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-gray-400">
            店舗カバー画像
          </div>
        )}
      </div>

      <div className="grid md:grid-cols-3 gap-[50px]">
        <div className="md:col-span-2">
          <div className="flex items-center gap-[16px]">
            {vendor.logo_url && (
              <div className="relative w-[64px] h-[64px] flex-shrink-0 overflow-hidden border border-gray-100">
                <Image
                  src={vendor.logo_url}
                  alt={`${vendor.name} ロゴ`}
                  fill
                  className="object-contain"
                  sizes="64px"
                />
              </div>
            )}
            <h1 className="font-serif font-light text-3xl md:text-4xl">{vendor.name}</h1>
          </div>
          <p className="text-sm text-gray-500 mt-[8px]">{vendor.prefecture} {vendor.city}</p>
          {vendor.description && (
            <p className="text-sm text-gray-600 leading-relaxed mt-[20px]">{vendor.description}</p>
          )}

          {/* Bikes */}
          <div className="mt-[50px]">
            <h2 className="font-serif font-light text-2xl mb-[24px]">取扱バイク</h2>
            {vendorBikes.length > 0 ? (
              <div className="grid md:grid-cols-2 gap-[20px]">
                {vendorBikes.map((b) => (
                  <Link key={b.id} href={`/bikes/${b.id}`} className="border border-gray-100 hover:border-gray-300 transition-colors">
                    <div className="aspect-[4/3] bg-gray-100 relative overflow-hidden">
                      {b.image_urls && b.image_urls.length > 0 ? (
                        <Image
                          src={b.image_urls[0]}
                          alt={b.name}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 100vw, 50vw"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-xs">No Image</div>
                      )}
                    </div>
                    <div className="p-[20px]">
                      <p className="text-xs text-gray-400">{b.manufacturer}</p>
                      <p className="font-serif text-lg mt-[2px]">{b.name}</p>
                      <p className="font-medium mt-[8px]">¥{(b.daily_rate_1day || 0).toLocaleString()}<span className="text-xs text-gray-400">/日</span></p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400">現在取扱バイクはありません</p>
            )}
          </div>

        </div>

        {/* Sidebar Info */}
        <div className="space-y-[24px]">
          <div className="border border-gray-100 p-[24px]">
            <h3 className="text-xs text-gray-400 uppercase tracking-wider mb-[12px]">店舗情報</h3>
            <div className="space-y-[10px] text-sm">
              <div><span className="text-gray-500">住所:</span> <span>{vendor.address}</span></div>
              <div><span className="text-gray-500">電話:</span> <span>{vendor.contact_phone}</span></div>
              <div><span className="text-gray-500">メール:</span> <span>{vendor.contact_email}</span></div>
            </div>
          </div>

          <div className="border border-gray-100 p-[24px]">
            <h3 className="text-xs text-gray-400 uppercase tracking-wider mb-[12px]">営業時間</h3>
            <div className="space-y-[6px] text-sm">
              {['月', '火', '水', '木', '金', '土', '日'].map((day) => (
                <div key={day} className="flex justify-between">
                  <span className="text-gray-500">{day}曜</span>
                  <span>9:00 - 18:00</span>
                </div>
              ))}
            </div>
          </div>

          {/* Map placeholder */}
          <div className="aspect-square bg-gray-100 flex items-center justify-center text-gray-400 text-xs">
            地図表示エリア
          </div>
        </div>
      </div>
    </div>
    </>
  );
}

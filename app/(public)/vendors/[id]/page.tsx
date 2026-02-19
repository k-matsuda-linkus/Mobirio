import Link from 'next/link';
import { mockVendors } from '@/lib/mock/vendors';
import { mockBikes } from '@/lib/mock/bikes';
import { mockReviews } from '@/lib/mock/reviews';
import { Star } from 'lucide-react';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const vendor = mockVendors.find((v) => v.slug === id || v.id === id);
  return { title: vendor?.name || '店舗詳細' };
}

export default async function VendorDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const vendor = mockVendors.find((v) => v.slug === id || v.id === id) || mockVendors[0];
  const vendorBikes = mockBikes.filter((b) => b.vendor_id === vendor.id);
  const vendorReviews = mockReviews.filter((r) => r.vendorId === vendor.id);

  return (
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
      <div className="aspect-[3/1] bg-gray-100 flex items-center justify-center text-gray-400 mb-[40px]">
        店舗カバー画像
      </div>

      <div className="grid md:grid-cols-3 gap-[50px]">
        <div className="md:col-span-2">
          <h1 className="font-serif font-light text-3xl md:text-4xl">{vendor.name}</h1>
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
                    <div className="aspect-[4/3] bg-gray-100 flex items-center justify-center text-gray-400 text-xs">No Image</div>
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

          {/* Reviews */}
          <div className="mt-[50px]">
            <h2 className="font-serif font-light text-2xl mb-[24px]">クチコミ</h2>
            {vendorReviews.length > 0 ? (
              <div className="space-y-[20px]">
                {vendorReviews.map((review) => (
                  <div key={review.id} className="border border-gray-100 p-[24px]">
                    <div className="flex items-center gap-[8px] mb-[8px]">
                      <div className="flex">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            size={16}
                            className={i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'}
                          />
                        ))}
                      </div>
                      <span className="text-sm font-medium">{review.rating}.0</span>
                    </div>
                    <p className="text-sm text-gray-700 leading-relaxed">{review.comment}</p>
                    <div className="flex items-center gap-[12px] mt-[12px]">
                      <span className="text-xs text-gray-400">{review.bikeName}</span>
                      <span className="text-xs text-gray-300">|</span>
                      <span className="text-xs text-gray-400">{review.createdAt}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400">まだクチコミはありません</p>
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
  );
}

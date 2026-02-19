import Link from "next/link";
import { Heart, MapPin } from "lucide-react";

const FAVORITES = [
  { id: "bike-001", name: "Honda PCX 160", vendor: "サンシャインモータース宮崎", location: "宮崎市", price: 6000, image: null },
  { id: "bike-003", name: "Kawasaki Ninja 400", vendor: "青島バイクレンタル", location: "宮崎市青島", price: 13200, image: null },
  { id: "bike-005", name: "Yamaha MT-09", vendor: "ライドパーク日南", location: "日南市", price: 17200, image: null },
];

export default function FavoritesPage() {
  return (
    <div>
      <h1 className="font-serif text-2xl font-light text-black mb-[8px]">お気に入り</h1>
      <p className="text-sm font-sans text-gray-500 mb-[24px]">{FAVORITES.length}台のバイク</p>

      {FAVORITES.length === 0 ? (
        <div className="text-center py-[80px]">
          <Heart className="w-[40px] h-[40px] text-gray-200 mx-auto mb-[16px]" />
          <p className="text-sm font-sans text-gray-400 mb-[8px]">お気に入りに登録されたバイクはありません</p>
          <Link href="/bikes" className="text-sm font-sans text-accent hover:underline">
            バイクを探す
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[16px]">
          {FAVORITES.map((bike) => (
            <div key={bike.id} className="bg-white border border-gray-100 overflow-hidden group">
              {/* Image placeholder */}
              <div className="aspect-[4/3] bg-gray-100 relative">
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xs font-sans text-gray-400">画像</span>
                </div>
                <button className="absolute top-[12px] right-[12px] w-[32px] h-[32px] bg-white/90 flex items-center justify-center hover:bg-white transition-colors">
                  <Heart className="w-[16px] h-[16px] text-red-500 fill-red-500" />
                </button>
              </div>
              {/* Info */}
              <div className="p-[16px]">
                <Link href={`/bikes/${bike.id}`} className="block">
                  <h3 className="text-sm font-sans font-medium text-black group-hover:text-accent transition-colors">
                    {bike.name}
                  </h3>
                </Link>
                <p className="text-xs font-sans text-gray-500 mt-[4px]">{bike.vendor}</p>
                <div className="flex items-center gap-[4px] mt-[6px]">
                  <MapPin className="w-[12px] h-[12px] text-gray-400" />
                  <span className="text-xs font-sans text-gray-400">{bike.location}</span>
                </div>
                <div className="flex items-center justify-between mt-[12px] pt-[12px] border-t border-gray-50">
                  <p className="text-sm font-sans font-medium text-black">
                    ¥{bike.price.toLocaleString()}<span className="text-xs text-gray-400 font-normal">/24h</span>
                  </p>
                  <Link href={`/bikes/${bike.id}`} className="text-xs font-sans text-accent hover:underline">
                    予約する
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

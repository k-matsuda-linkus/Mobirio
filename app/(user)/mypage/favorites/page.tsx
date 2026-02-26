"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Heart, MapPin } from "lucide-react";

interface FavoriteItem {
  id: string;
  bike_id: string;
  bike?: {
    id: string;
    name: string;
    manufacturer?: string;
    image_urls?: string[];
    daily_rate_1day?: number;
    vendor_id?: string;
  } | null;
}

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFavorites = async () => {
      try {
        const res = await fetch("/api/user/favorites");
        if (!res.ok) throw new Error("API error");
        const data = await res.json();
        setFavorites(data.data || []);
      } catch (error) {
        console.error("Failed to fetch favorites:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchFavorites();
  }, []);

  const handleRemove = async (bikeId: string) => {
    try {
      const res = await fetch("/api/user/favorites", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bike_id: bikeId }),
      });
      if (!res.ok) throw new Error("API error");
      const data = await res.json();
      if (data.success) {
        setFavorites((prev) => prev.filter((f) => f.bike_id !== bikeId));
      }
    } catch (error) {
      console.error("Failed to remove favorite:", error);
    }
  };

  if (loading) {
    return (
      <div>
        <h1 className="font-serif text-2xl font-light text-black mb-[8px]">お気に入り</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[16px] mt-[24px]">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white border border-gray-100 overflow-hidden">
              <div className="aspect-[4/3] bg-gray-100 animate-pulse" />
              <div className="p-[16px] space-y-[8px]">
                <div className="h-[16px] w-[120px] bg-gray-100 animate-pulse" />
                <div className="h-[12px] w-[80px] bg-gray-100 animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-serif text-2xl font-light text-black mb-[8px]">お気に入り</h1>
      <p className="text-sm font-sans text-gray-500 mb-[24px]">{favorites.length}台のバイク</p>

      {favorites.length === 0 ? (
        <div className="text-center py-[80px]">
          <Heart className="w-[40px] h-[40px] text-gray-200 mx-auto mb-[16px]" />
          <p className="text-sm font-sans text-gray-400 mb-[8px]">お気に入りに登録されたバイクはありません</p>
          <Link href="/bikes" className="text-sm font-sans text-accent hover:underline">
            バイクを探す
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[16px]">
          {favorites.map((fav) => {
            const bike = fav.bike;
            return (
              <div key={fav.id} className="bg-white border border-gray-100 overflow-hidden group">
                <div className="aspect-[4/3] bg-gray-100 relative">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xs font-sans text-gray-400">画像</span>
                  </div>
                  <button
                    onClick={() => handleRemove(fav.bike_id)}
                    className="absolute top-[12px] right-[12px] w-[32px] h-[32px] bg-white/90 flex items-center justify-center hover:bg-white transition-colors"
                  >
                    <Heart className="w-[16px] h-[16px] text-red-500 fill-red-500" />
                  </button>
                </div>
                <div className="p-[16px]">
                  <Link href={`/bikes/${fav.bike_id}`} className="block">
                    <h3 className="text-sm font-sans font-medium text-black group-hover:text-accent transition-colors">
                      {bike?.name || "バイク"}
                    </h3>
                  </Link>
                  <p className="text-xs font-sans text-gray-500 mt-[4px]">{bike?.manufacturer || ""}</p>
                  <div className="flex items-center justify-between mt-[12px] pt-[12px] border-t border-gray-50">
                    <p className="text-sm font-sans font-medium text-black">
                      {bike?.daily_rate_1day ? (
                        <>¥{bike.daily_rate_1day.toLocaleString()}<span className="text-xs text-gray-400 font-normal">/24h</span></>
                      ) : (
                        <span className="text-xs text-gray-400">料金未設定</span>
                      )}
                    </p>
                    <Link href={`/bikes/${fav.bike_id}`} className="text-xs font-sans text-accent hover:underline">
                      予約する
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

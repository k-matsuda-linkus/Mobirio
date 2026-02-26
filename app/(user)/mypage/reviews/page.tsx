"use client";

import { useState, useEffect } from "react";
import { Star } from "lucide-react";

interface ReviewItem {
  id: string;
  bikeName?: string;
  vendorName?: string;
  bike?: { name: string; model?: string };
  vendor?: { name: string };
  rating: number;
  comment: string;
  createdAt?: string;
  created_at?: string;
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-[2px]">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`w-[14px] h-[14px] ${
            i <= Math.floor(rating)
              ? "text-yellow-500 fill-yellow-500"
              : i - 0.5 <= rating
              ? "text-yellow-500 fill-yellow-500/50"
              : "text-gray-200"
          }`}
        />
      ))}
      <span className="text-xs font-sans text-gray-600 ml-[4px]">{rating.toFixed(1)}</span>
    </div>
  );
}

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const res = await fetch("/api/reviews");
        if (!res.ok) throw new Error("API error");
        const data = await res.json();
        setReviews(data.data || []);
      } catch (error) {
        console.error("Failed to fetch reviews:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchReviews();
  }, []);

  if (loading) {
    return (
      <div>
        <h1 className="font-serif text-2xl font-light text-black mb-[8px]">レビュー一覧</h1>
        <div className="space-y-[16px] mt-[24px]">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-[120px] bg-gray-50 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-serif text-2xl font-light text-black mb-[8px]">レビュー一覧</h1>
      <p className="text-sm font-sans text-gray-500 mb-[24px]">あなたが投稿したレビュー（{reviews.length}件）</p>

      {reviews.length === 0 ? (
        <div className="text-center py-[80px]">
          <Star className="w-[40px] h-[40px] text-gray-200 mx-auto mb-[16px]" />
          <p className="text-sm font-sans text-gray-400">投稿したレビューはありません</p>
        </div>
      ) : (
        <div className="space-y-[16px]">
          {reviews.map((review) => {
            const bikeName = review.bikeName || review.bike?.name || "";
            const vendorName = review.vendorName || review.vendor?.name || "";
            const date = review.createdAt || review.created_at || "";
            return (
              <div key={review.id} className="bg-white border border-gray-100 p-[24px]">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-[12px] mb-[12px]">
                  <div>
                    <p className="text-sm font-sans font-medium text-black">{bikeName}</p>
                    <p className="text-xs font-sans text-gray-500 mt-[2px]">{vendorName}</p>
                  </div>
                  <div className="flex items-center gap-[12px]">
                    <StarRating rating={review.rating} />
                    <span className="text-xs font-sans text-gray-400">{date}</span>
                  </div>
                </div>
                <p className="text-sm font-sans text-gray-600 leading-relaxed">{review.comment}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

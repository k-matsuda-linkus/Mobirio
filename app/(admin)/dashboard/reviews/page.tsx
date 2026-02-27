"use client";
import { useState, useEffect, useCallback } from "react";
import { AdminFilterBar } from "@/components/admin/AdminFilterBar";
import { AdminTable } from "@/components/admin/AdminTable";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Loader2 } from "lucide-react";

interface ReviewRow {
  id: string;
  rating: number;
  comment: string | null;
  is_published: boolean;
  created_at: string;
  // sandbox モック用
  bikeName?: string;
  vendorName?: string;
  createdAt?: string;
  // 本番 JOIN 用
  bike?: { name?: string } | null;
  vendor?: { name?: string } | null;
  user?: { full_name?: string } | null;
}

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [rf, setRf] = useState("");
  const [pf, setPf] = useState("");
  const [search, setSearch] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchReviews = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (rf) {
        params.set("minRating", rf);
        params.set("maxRating", rf);
      }
      if (search) {
        params.set("search", search);
      }
      const res = await fetch(`/api/admin/reviews?${params.toString()}`);
      const json = await res.json();
      if (!res.ok) {
        setError("レビューデータの取得に失敗しました");
        setLoading(false);
        return;
      }
      if (json.data) setReviews(json.data);
    } catch (error) {
      console.error("Reviews fetch error:", error);
      setError("レビューデータの取得に失敗しました");
    } finally {
      setLoading(false);
    }
  }, [rf, search]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const handleToggle = async (reviewId: string, currentPublished: boolean) => {
    setActionLoading(reviewId);
    try {
      const res = await fetch("/api/admin/reviews", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reviewId,
          action: currentPublished ? "hide" : "show",
        }),
      });
      const json = await res.json();
      if (json.success) {
        setReviews((prev) =>
          prev.map((r) =>
            r.id === reviewId ? { ...r, is_published: !currentPublished } : r
          )
        );
      }
    } catch (error) {
      console.error("Review toggle error:", error);
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-[80px]">
        <Loader2 className="w-[24px] h-[24px] animate-spin text-gray-400" />
        <span className="ml-[8px] text-sm text-gray-500">読み込み中...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-[80px]">
        <span className="text-sm text-red-500">{error}</span>
      </div>
    );
  }

  let filtered = reviews;
  if (pf) {
    filtered = filtered.filter((r) =>
      pf === "published" ? r.is_published : !r.is_published
    );
  }

  return (
    <div>
      <h1 className="font-serif text-2xl font-light mb-[24px]">レビュー管理</h1>
      <AdminFilterBar
        searchPlaceholder="ユーザー名・バイク名で検索..."
        onSearch={setSearch}
        filters={[
          {
            label: "評価",
            options: [
              { value: "5", label: "★5" },
              { value: "4", label: "★4" },
              { value: "3", label: "★3" },
              { value: "2", label: "★2" },
              { value: "1", label: "★1" },
            ],
            value: rf,
            onChange: setRf,
          },
          {
            label: "公開状態",
            options: [
              { value: "published", label: "公開中" },
              { value: "unpublished", label: "非公開" },
            ],
            value: pf,
            onChange: setPf,
          },
        ]}
      />
      <AdminTable
        columns={[
          {
            key: "bike",
            label: "バイク",
            render: (r) => {
              const raw = r as unknown as ReviewRow;
              return <span>{raw.bikeName || raw.bike?.name || "—"}</span>;
            },
          },
          {
            key: "vendor",
            label: "ベンダー",
            render: (r) => {
              const raw = r as unknown as ReviewRow;
              return <span>{raw.vendorName || raw.vendor?.name || "—"}</span>;
            },
          },
          {
            key: "rating",
            label: "評価",
            render: (r) => (
              <span className="text-yellow-500">
                {"★".repeat(Number(r.rating))}
              </span>
            ),
          },
          {
            key: "comment",
            label: "コメント",
            render: (r) => (
              <span className="max-w-[200px] truncate block text-gray-600">
                {String(r.comment || "")}
              </span>
            ),
          },
          {
            key: "date",
            label: "日時",
            render: (r) => {
              const raw = r as unknown as ReviewRow;
              return <span>{(raw.createdAt || raw.created_at || "").slice(0, 10)}</span>;
            },
          },
          {
            key: "published",
            label: "公開状態",
            render: (r) => {
              const raw = r as unknown as ReviewRow;
              return (
                <StatusBadge
                  status={raw.is_published ? "公開中" : "非公開"}
                  variant={raw.is_published ? "success" : "default"}
                />
              );
            },
          },
          {
            key: "action",
            label: "操作",
            render: (r) => {
              const raw = r as unknown as ReviewRow;
              const isLoading = actionLoading === raw.id;
              return (
                <button
                  onClick={() => handleToggle(raw.id, raw.is_published)}
                  disabled={isLoading}
                  className={
                    "text-xs px-[10px] py-[4px] border disabled:opacity-50 " +
                    (raw.is_published
                      ? "border-gray-300 text-gray-600"
                      : "border-accent text-accent")
                  }
                >
                  {raw.is_published ? "非公開にする" : "公開する"}
                </button>
              );
            },
          },
        ]}
        data={filtered as unknown as Record<string, unknown>[]}
      />
    </div>
  );
}

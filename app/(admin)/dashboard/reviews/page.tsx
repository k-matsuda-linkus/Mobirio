"use client";
import { useState } from "react";
import { AdminFilterBar } from "@/components/admin/AdminFilterBar";
import { AdminTable } from "@/components/admin/AdminTable";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { mockReviews } from "@/lib/mock/reviews";

const initReviews = mockReviews.map((r) => ({
  id: r.id,
  user: "ユーザー",
  bike: r.bikeName,
  vendor: r.vendorName,
  rating: r.rating,
  comment: r.comment,
  date: r.createdAt,
  published: true,
}));

export default function ReviewsPage() {
  const [rf, setRf] = useState("");
  const [pf, setPf] = useState("");
  const [data, setData] = useState(initReviews);

  const toggle = (id: string) => {
    setData((prev) =>
      prev.map((r) => (r.id === id ? { ...r, published: !r.published } : r))
    );
  };

  let filtered = data;
  if (rf) filtered = filtered.filter((r) => r.rating === Number(rf));
  if (pf)
    filtered = filtered.filter((r) =>
      pf === "published" ? r.published : !r.published
    );

  return (
    <div>
      <h1 className="font-serif text-2xl font-light mb-[24px]">レビュー管理</h1>
      <AdminFilterBar
        searchPlaceholder="ユーザー名・バイク名で検索..."
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
          { key: "bike", label: "バイク" },
          { key: "vendor", label: "ベンダー" },
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
                {String(r.comment)}
              </span>
            ),
          },
          { key: "date", label: "日時" },
          {
            key: "published",
            label: "公開状態",
            render: (r) => (
              <StatusBadge
                status={r.published ? "公開中" : "非公開"}
                variant={r.published ? "success" : "default"}
              />
            ),
          },
          {
            key: "action",
            label: "操作",
            render: (r) => (
              <button
                onClick={() => toggle(String(r.id))}
                className={
                  "text-xs px-[10px] py-[4px] border " +
                  (r.published
                    ? "border-gray-300 text-gray-600"
                    : "border-accent text-accent")
                }
              >
                {r.published ? "非公開にする" : "公開する"}
              </button>
            ),
          },
        ]}
        data={filtered}
      />
    </div>
  );
}

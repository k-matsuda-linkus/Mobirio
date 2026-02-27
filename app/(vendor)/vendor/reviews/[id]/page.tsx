"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { VendorPageHeader } from "@/components/vendor/VendorPageHeader";

const REPLY_MAX_LENGTH = 200;

const mockData = {
  isPublished: true,
  storeName: "宮崎本店",
  nickname: "ライダー太郎",
  reservationNo: "RSV-2026-00152",
  postedAt: "2026-02-10 14:30",
  reviewContent:
    "CB400SFをレンタルしました。メンテナンスが行き届いていて、とても快適なツーリングができました。スタッフの方も親切に対応してくださり、次回もぜひ利用したいと思います。宮崎の海沿いのルートを走りましたが、景色が最高でした。",
  replyContent:
    "この度はご利用いただきありがとうございます。快適にご利用いただけたとのこと、大変嬉しく思います。またのお越しをお待ちしております。",
  replyAuthor: "店長 山田",
  repliedAt: "2026-02-11 09:00",
};

export default function ReviewDetailPage() {
  const params = useParams();
  const reviewId = params.id as string;

  const mockRef = useRef({ ...mockData });

  const [isPublished, setIsPublished] = useState(mockData.isPublished);
  const [replyContent, setReplyContent] = useState(mockData.replyContent);
  const [replyAuthor, setReplyAuthor] = useState(mockData.replyAuthor);
  const [loading, setLoading] = useState(true);
  const [reviewContent, setReviewContent] = useState(mockData.reviewContent);

  useEffect(() => {
    fetch(`/api/vendor/shop-reviews/${reviewId}`)
      .then((res) => (res.ok ? res.json() : Promise.reject("API error")))
      .then((json) => {
        const d = json.data;
        if (d) {
          if (d.content) setReviewContent(d.content);
          if (d.reply) setReplyContent(d.reply);
          if (d.is_published !== undefined) setIsPublished(d.is_published);
          if (d.nickname) mockRef.current.nickname = d.nickname;
          if (d.reservation_id) mockRef.current.reservationNo = d.reservation_id;
          if (d.posted_at) mockRef.current.postedAt = d.posted_at.slice(0, 16).replace("T", " ");
          if (d.reply_by) setReplyAuthor(d.reply_by);
          if (d.reply_at) mockRef.current.repliedAt = d.reply_at.slice(0, 16).replace("T", " ");
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [reviewId]);

  const inputClass = "w-full border border-gray-200 px-[12px] py-[10px] text-sm focus:border-accent focus:outline-none";
  const labelClass = "block text-xs font-medium text-gray-500 mb-[4px]";
  const sectionClass = "bg-white border border-gray-200 p-[24px] space-y-[16px]";
  const sectionTitle = "text-base font-medium text-gray-800 pb-[8px] border-b border-gray-100 mb-[16px]";

  if (loading) return <div className="p-[24px]">読み込み中...</div>;

  return (
    <div>
      <VendorPageHeader
        title="クチコミ詳細"
        breadcrumbs={[
          { label: "店舗クチコミ一覧", href: "/vendor/reviews" },
          { label: `クチコミ #${reviewId}` },
        ]}
      />

      <div className="space-y-[24px]">
        {/* 公開設定 */}
        <div className={sectionClass}>
          <label className="flex items-start gap-[8px] cursor-pointer">
            <input
              type="checkbox"
              checked={isPublished}
              onChange={(e) => setIsPublished(e.target.checked)}
              className="mt-[2px] accent-accent"
            />
            <div>
              <span className="text-sm font-medium">公開する</span>
              <p className="text-xs text-gray-400 mt-[2px]">
                チェックを外すと予約サイトに表示されません
              </p>
            </div>
          </label>
        </div>

        {/* クチコミ情報 */}
        <div className={sectionClass}>
          <h2 className={sectionTitle}>クチコミ情報</h2>

          <div className="grid grid-cols-2 gap-[16px]">
            <div>
              <label className={labelClass}>店舗名</label>
              <input
                type="text"
                value={mockRef.current.storeName}
                readOnly
                className={inputClass + " bg-gray-50 text-gray-500"}
              />
            </div>
            <div>
              <label className={labelClass}>ニックネーム</label>
              <input
                type="text"
                value={mockRef.current.nickname}
                readOnly
                className={inputClass + " bg-gray-50 text-gray-500"}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-[16px]">
            <div>
              <label className={labelClass}>予約番号</label>
              <input
                type="text"
                value={mockRef.current.reservationNo}
                readOnly
                className={inputClass + " bg-gray-50 text-gray-500"}
              />
            </div>
            <div>
              <label className={labelClass}>投稿日時</label>
              <input
                type="text"
                value={mockRef.current.postedAt}
                readOnly
                className={inputClass + " bg-gray-50 text-gray-500"}
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>クチコミ内容</label>
            <textarea
              value={reviewContent}
              readOnly
              className={inputClass + " min-h-[120px] bg-gray-50 text-gray-600 resize-none"}
              rows={5}
            />
          </div>
        </div>

        {/* 返信 */}
        <div className={sectionClass}>
          <h2 className={sectionTitle}>クチコミ返信</h2>

          <div>
            <label className={labelClass}>クチコミ返信内容</label>
            <textarea
              value={replyContent}
              onChange={(e) => {
                if (e.target.value.length <= REPLY_MAX_LENGTH) {
                  setReplyContent(e.target.value);
                }
              }}
              className={inputClass + " min-h-[100px] resize-y"}
              rows={4}
              placeholder="返信内容を入力してください"
            />
            <p className="text-xs text-gray-400 text-right mt-[4px]">
              {replyContent.length} / {REPLY_MAX_LENGTH}文字
            </p>
          </div>

          <div className="grid grid-cols-2 gap-[16px]">
            <div>
              <label className={labelClass}>返信者氏名</label>
              <input
                type="text"
                value={replyAuthor}
                onChange={(e) => setReplyAuthor(e.target.value)}
                className={inputClass}
                placeholder="返信者の氏名"
              />
            </div>
            <div>
              <label className={labelClass}>返信日時</label>
              <input
                type="text"
                value={mockRef.current.repliedAt}
                readOnly
                className={inputClass + " bg-gray-50 text-gray-500"}
              />
            </div>
          </div>
        </div>

        {/* フッター */}
        <div className="flex items-center justify-end gap-[8px] pt-[16px] pb-[40px]">
          <Link
            href="/vendor/reviews"
            className="border border-gray-300 px-[24px] py-[10px] text-sm hover:bg-gray-50"
          >
            戻る
          </Link>
          <button
            type="button"
            onClick={() => {
              fetch(`/api/vendor/shop-reviews/${reviewId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ reply: replyContent, reply_by: replyAuthor, is_published: isPublished }),
              })
                .then((res) => (res.ok ? res.json() : Promise.reject("API error")))
                .then(() => alert("保存しました"))
                .catch(() => alert("保存に失敗しました"));
            }}
            className="bg-accent text-white px-[32px] py-[10px] text-sm hover:bg-accent/90"
          >
            登録
          </button>
        </div>
      </div>
    </div>
  );
}

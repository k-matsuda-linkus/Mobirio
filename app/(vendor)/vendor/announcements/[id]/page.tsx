"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { VendorPageHeader } from "@/components/vendor/VendorPageHeader";
import { RichTextEditor } from "@/components/ui/RichTextEditor";
import { FileUploader } from "@/components/ui/FileUploader";

const MOCK_DETAIL = {
  id: "ann-001",
  type: "店舗からのお知らせ",
  store: "宮崎橘通り店",
  title: "年末年始の営業時間変更のお知らせ",
  url: "https://example.com/news/001",
  titleImage: [] as string[],
  publishStart: "2025-12-20",
  publishEnd: "2026-01-10",
  detail:
    "<p>年末年始の営業時間を下記の通り変更いたします。</p><p>12/29〜1/3: 10:00〜17:00</p><p>ご不便をおかけしますが、何卒ご了承ください。</p>",
  createdAt: "2025/12/15 10:30",
  createdBy: "管理者A",
  updatedAt: "2025/12/15 10:30",
  updatedBy: "管理者A",
};

export default function VendorAnnouncementDetailPage() {
  const router = useRouter();
  const params = useParams();
  const announcementId = params.id as string;
  const [type, setType] = useState(MOCK_DETAIL.type);
  const [store, setStore] = useState(MOCK_DETAIL.store);
  const [title, setTitle] = useState(MOCK_DETAIL.title);
  const [url, setUrl] = useState(MOCK_DETAIL.url);
  const [titleImage, setTitleImage] = useState<string[]>(MOCK_DETAIL.titleImage);
  const [publishStart, setPublishStart] = useState(MOCK_DETAIL.publishStart);
  const [publishEnd, setPublishEnd] = useState(MOCK_DETAIL.publishEnd);
  const [detail, setDetail] = useState(MOCK_DETAIL.detail);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/vendor/announcements/${announcementId}`)
      .then((res) => (res.ok ? res.json() : Promise.reject("API error")))
      .then((json) => {
        const d = json.data;
        if (d) {
          if (d.announcement_type) setType(d.announcement_type);
          if (d.title) setTitle(d.title);
          if (d.url) setUrl(d.url);
          if (d.image_url) setTitleImage([d.image_url]);
          if (d.detail_html) setDetail(d.detail_html);
          if (d.published_from) setPublishStart(d.published_from.slice(0, 10));
          if (d.published_until) setPublishEnd(d.published_until.slice(0, 10));
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [announcementId]);

  const inputClass =
    "border border-gray-300 px-[10px] py-[6px] text-sm w-full focus:outline-none focus:border-accent";

  if (loading) return <div className="p-[24px]">読み込み中...</div>;

  return (
    <div>
      <VendorPageHeader
        title="お知らせ編集"
        breadcrumbs={[
          { label: "お知らせ一覧", href: "/vendor/announcements" },
          { label: "お知らせ編集" },
        ]}
      />

      <div className="bg-white border border-gray-200 p-[24px] space-y-[20px]">
        {/* お知らせ種別 */}
        <div>
          <label className="block text-xs text-gray-500 mb-[4px]">
            お知らせ種別 <span className="text-red-500">*</span>
          </label>
          <select value={type} onChange={(e) => setType(e.target.value)} className={inputClass + " max-w-[300px]"}>
            <option value="店舗からのお知らせ">店舗からのお知らせ</option>
            <option value="キャンペーン">キャンペーン</option>
            <option value="メンテナンス">メンテナンス</option>
          </select>
        </div>

        {/* 店舗 */}
        <div>
          <label className="block text-xs text-gray-500 mb-[4px]">
            店舗 <span className="text-red-500">*</span>
          </label>
          <select value={store} onChange={(e) => setStore(e.target.value)} className={inputClass + " max-w-[300px]"}>
            <option value="全店舗">全店舗</option>
            <option value="宮崎橘通り店">宮崎橘通り店</option>
            <option value="宮崎空港店">宮崎空港店</option>
          </select>
        </div>

        {/* タイトル */}
        <div>
          <label className="block text-xs text-gray-500 mb-[4px]">
            タイトル <span className="text-red-500">*</span>
            <span className="text-gray-400 ml-[8px]">（最大100文字）</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value.slice(0, 100))}
            maxLength={100}
            className={inputClass}
          />
          <p className="text-xs text-gray-400 mt-[4px] text-right">{title.length} / 100</p>
        </div>

        {/* URL */}
        <div>
          <label className="block text-xs text-gray-500 mb-[4px]">URL</label>
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://"
            className={inputClass}
          />
        </div>

        {/* タイトル用画像 */}
        <div>
          <label className="block text-xs text-gray-500 mb-[4px]">タイトル用画像</label>
          <FileUploader
            accept="image/*"
            multiple={false}
            value={titleImage}
            onChange={setTitleImage}
            label="画像をアップロード"
            maxFiles={1}
          />
        </div>

        {/* 公開日 */}
        <div>
          <label className="block text-xs text-gray-500 mb-[4px]">
            公開日 <span className="text-red-500">*</span>
          </label>
          <div className="flex items-center gap-[8px]">
            <input
              type="date"
              value={publishStart}
              onChange={(e) => setPublishStart(e.target.value)}
              className={inputClass + " max-w-[180px]"}
            />
            <span className="text-sm text-gray-400">〜</span>
            <input
              type="date"
              value={publishEnd}
              onChange={(e) => setPublishEnd(e.target.value)}
              className={inputClass + " max-w-[180px]"}
            />
          </div>
        </div>

        {/* 詳細 */}
        <div>
          <label className="block text-xs text-gray-500 mb-[4px]">詳細</label>
          <RichTextEditor value={detail} onChange={setDetail} placeholder="お知らせの内容を入力してください..." />
        </div>

        {/* メタ情報 */}
        <div className="border-t border-gray-200 pt-[20px]">
          <h3 className="text-sm font-medium text-gray-700 mb-[12px]">メタ情報</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-[12px]">
            <div>
              <label className="block text-xs text-gray-500 mb-[4px]">作成日時 / 作成者</label>
              <p className="text-sm text-gray-700">
                {MOCK_DETAIL.createdAt} / {MOCK_DETAIL.createdBy}
              </p>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-[4px]">更新日時 / 更新者</label>
              <p className="text-sm text-gray-700">
                {MOCK_DETAIL.updatedAt} / {MOCK_DETAIL.updatedBy}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer actions */}
      <div className="flex items-center justify-between mt-[24px]">
        <button
          onClick={() => {
            if (confirm("このお知らせを削除しますか？")) {
              fetch(`/api/vendor/announcements/${announcementId}`, { method: "DELETE" })
                .then((res) => (res.ok ? res.json() : Promise.reject("API error")))
                .then(() => router.push("/vendor/announcements"))
                .catch(() => alert("削除に失敗しました"));
            }
          }}
          className="border border-red-300 text-red-600 px-[20px] py-[8px] text-sm hover:bg-red-50"
        >
          削除
        </button>
        <div className="flex items-center gap-[8px]">
          <button
            onClick={() => router.push("/vendor/announcements")}
            className="border border-gray-300 text-gray-600 px-[20px] py-[8px] text-sm hover:bg-gray-50"
          >
            戻る
          </button>
          <button
            onClick={() => {
              fetch(`/api/vendor/announcements/${announcementId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  announcement_type: type,
                  title,
                  url: url || null,
                  image_url: titleImage.length > 0 ? titleImage[0] : null,
                  detail_html: detail,
                  published_from: publishStart || null,
                  published_until: publishEnd || null,
                }),
              })
                .then((res) => (res.ok ? res.json() : Promise.reject("API error")))
                .then(() => alert("保存しました"))
                .catch(() => alert("保存に失敗しました"));
            }}
            className="bg-accent text-white px-[24px] py-[8px] text-sm hover:bg-accent/90"
          >
            登録
          </button>
        </div>
      </div>
    </div>
  );
}

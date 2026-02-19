"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { VendorPageHeader } from "@/components/vendor/VendorPageHeader";
import { RichTextEditor } from "@/components/ui/RichTextEditor";
import { FileUploader } from "@/components/ui/FileUploader";

export default function VendorAnnouncementNewPage() {
  const router = useRouter();
  const [type, setType] = useState("店舗からのお知らせ");
  const [store, setStore] = useState("全店舗");
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [titleImage, setTitleImage] = useState<string[]>([]);
  const [publishStart, setPublishStart] = useState("");
  const [publishEnd, setPublishEnd] = useState("");
  const [detail, setDetail] = useState("");

  const inputClass =
    "border border-gray-300 px-[10px] py-[6px] text-sm w-full focus:outline-none focus:border-accent";

  return (
    <div>
      <VendorPageHeader
        title="お知らせ新規登録"
        breadcrumbs={[
          { label: "お知らせ一覧", href: "/vendor/announcements" },
          { label: "新規登録" },
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
            placeholder="お知らせのタイトルを入力"
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
      </div>

      {/* Footer actions */}
      <div className="flex items-center justify-end mt-[24px] gap-[8px]">
        <button
          onClick={() => router.push("/vendor/announcements")}
          className="border border-gray-300 text-gray-600 px-[20px] py-[8px] text-sm hover:bg-gray-50"
        >
          戻る
        </button>
        <button className="bg-accent text-white px-[24px] py-[8px] text-sm hover:bg-accent/90">
          登録
        </button>
      </div>
    </div>
  );
}

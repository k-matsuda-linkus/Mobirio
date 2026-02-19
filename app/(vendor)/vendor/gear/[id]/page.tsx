"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Trash2 } from "lucide-react";
import { VendorPageHeader } from "@/components/vendor/VendorPageHeader";
import { FileUploader } from "@/components/ui/FileUploader";

const storeOptions = [
  { id: "s-001", name: "宮崎本店" },
  { id: "s-002", name: "鹿児島支店" },
];

const gearTypeOptions = [
  "ヘルメット",
  "リアケース",
  "グローブ",
  "ジャケット",
  "その他",
];

const mockData = {
  isPublished: true,
  store: "s-001",
  gearType: "ヘルメット",
  gearTypeName: "ヘルメット（ジェット）",
  inventoryManagement: "yes",
  size: "M",
  comment: "SHOEI J-Cruise IIジェットヘルメット。インナーサンバイザー付き。快適なフィッティングで長距離ツーリングにも最適です。",
  image: [] as string[],
  firstDayType: "perDay",
  firstDayPrice: "1100",
  secondDayPrice: "550",
  createdAt: "2025-08-15 10:05:00",
  createdBy: "管理者A",
  updatedAt: "2026-01-20 09:30:00",
  updatedBy: "管理者B",
};

const COMMENT_MAX_LENGTH = 500;

export default function GearDetailPage() {
  const params = useParams();
  const router = useRouter();
  const gearId = params.id as string;

  const [isPublished, setIsPublished] = useState(mockData.isPublished);
  const [store, setStore] = useState(mockData.store);
  const [gearType, setGearType] = useState(mockData.gearType);
  const [gearTypeName, setGearTypeName] = useState(mockData.gearTypeName);
  const [inventoryManagement, setInventoryManagement] = useState(mockData.inventoryManagement);
  const [size, setSize] = useState(mockData.size);
  const [comment, setComment] = useState(mockData.comment);
  const [image, setImage] = useState(mockData.image);
  const [firstDayType, setFirstDayType] = useState(mockData.firstDayType);
  const [firstDayPrice, setFirstDayPrice] = useState(mockData.firstDayPrice);
  const [secondDayPrice, setSecondDayPrice] = useState(mockData.secondDayPrice);

  const inputClass = "w-full border border-gray-200 px-[12px] py-[10px] text-sm focus:border-accent focus:outline-none";
  const labelClass = "block text-xs font-medium text-gray-500 mb-[4px]";
  const sectionClass = "bg-white border border-gray-200 p-[24px] space-y-[16px]";
  const sectionTitle = "text-base font-medium text-gray-800 pb-[8px] border-b border-gray-100 mb-[16px]";

  return (
    <div>
      <VendorPageHeader
        title="ライダーズギア編集"
        breadcrumbs={[
          { label: "ライダーズギア一覧", href: "/vendor/gear" },
          { label: mockData.gearTypeName },
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

        {/* 基本情報 */}
        <div className={sectionClass}>
          <h2 className={sectionTitle}>基本情報</h2>

          <div className="grid grid-cols-2 gap-[16px]">
            <div>
              <label className={labelClass}>店舗</label>
              <select
                value={store}
                onChange={(e) => setStore(e.target.value)}
                className={inputClass}
              >
                {storeOptions.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>ライダーズギア種別</label>
              <select
                value={gearType}
                onChange={(e) => setGearType(e.target.value)}
                className={inputClass}
              >
                {gearTypeOptions.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className={labelClass}>ライダーズギア種別名</label>
            <input
              type="text"
              value={gearTypeName}
              onChange={(e) => setGearTypeName(e.target.value)}
              className={inputClass + " max-w-[400px]"}
              placeholder="種別名を入力（自由入力）"
            />
          </div>
        </div>

        {/* 在庫管理 */}
        <div className={sectionClass}>
          <h2 className={sectionTitle}>在庫管理</h2>
          <div className="flex gap-[24px]">
            <label className="flex items-center gap-[6px] cursor-pointer">
              <input
                type="radio"
                name="inventory"
                value="yes"
                checked={inventoryManagement === "yes"}
                onChange={(e) => setInventoryManagement(e.target.value)}
                className="accent-accent"
              />
              <span className="text-sm">する</span>
            </label>
            <label className="flex items-center gap-[6px] cursor-pointer">
              <input
                type="radio"
                name="inventory"
                value="no"
                checked={inventoryManagement === "no"}
                onChange={(e) => setInventoryManagement(e.target.value)}
                className="accent-accent"
              />
              <span className="text-sm">しない</span>
            </label>
          </div>
          <p className="text-xs text-gray-400">
            「しない」の場合在庫数に関わらず予約可能です
          </p>
        </div>

        {/* サイズ */}
        <div className={sectionClass}>
          <h2 className={sectionTitle}>サイズ</h2>
          <input
            type="text"
            value={size}
            onChange={(e) => setSize(e.target.value)}
            className={inputClass + " max-w-[200px]"}
            placeholder="S, M, L, フリー"
          />
          <p className="text-xs text-gray-400">記入例: S, M, L, フリー</p>
        </div>

        {/* コメント */}
        <div className={sectionClass}>
          <h2 className={sectionTitle}>コメント</h2>
          <textarea
            value={comment}
            onChange={(e) => {
              if (e.target.value.length <= COMMENT_MAX_LENGTH) {
                setComment(e.target.value);
              }
            }}
            className={inputClass + " min-h-[100px] resize-y"}
            rows={4}
            placeholder="コメントを入力してください"
          />
          <p className="text-xs text-gray-400 text-right">
            {comment.length} / {COMMENT_MAX_LENGTH}文字
          </p>
        </div>

        {/* 画像 */}
        <div className={sectionClass}>
          <h2 className={sectionTitle}>画像</h2>
          <FileUploader
            accept="image/*"
            value={image}
            onChange={setImage}
            label="画像をアップロード"
            maxFiles={1}
          />
        </div>

        {/* レンタル料金 */}
        <div className={sectionClass}>
          <h2 className={sectionTitle}>レンタル料金</h2>

          <div className="space-y-[12px]">
            <div>
              <label className={labelClass}>1日目タイプ</label>
              <div className="flex gap-[24px] mb-[8px]">
                <label className="flex items-center gap-[6px] cursor-pointer">
                  <input
                    type="radio"
                    name="firstDayType"
                    value="perDay"
                    checked={firstDayType === "perDay"}
                    onChange={(e) => setFirstDayType(e.target.value)}
                    className="accent-accent"
                  />
                  <span className="text-sm">1日目</span>
                </label>
                <label className="flex items-center gap-[6px] cursor-pointer">
                  <input
                    type="radio"
                    name="firstDayType"
                    value="perRental"
                    checked={firstDayType === "perRental"}
                    onChange={(e) => setFirstDayType(e.target.value)}
                    className="accent-accent"
                  />
                  <span className="text-sm">1レンタル</span>
                </label>
              </div>
              <div className="flex items-center gap-[8px]">
                <input
                  type="number"
                  value={firstDayPrice}
                  onChange={(e) => setFirstDayPrice(e.target.value)}
                  className={inputClass + " max-w-[200px]"}
                  placeholder="0"
                />
                <span className="text-sm text-gray-500">円</span>
              </div>
            </div>

            <div>
              <label className={labelClass}>2日目以降</label>
              <div className="flex items-center gap-[8px]">
                <input
                  type="number"
                  value={secondDayPrice}
                  onChange={(e) => setSecondDayPrice(e.target.value)}
                  className={inputClass + " max-w-[200px]"}
                  placeholder="0"
                />
                <span className="text-sm text-gray-500">円</span>
              </div>
            </div>
          </div>

          <p className="text-xs text-gray-400 mt-[8px]">
            その他種別の場合、入力してください。無償貸し出しの場合は、0円を設定してください。
          </p>
        </div>

        {/* メタ情報 */}
        <div className={sectionClass}>
          <h2 className={sectionTitle}>メタ情報</h2>
          <div className="grid grid-cols-2 gap-[16px] text-sm">
            <div>
              <span className="text-xs text-gray-400">作成日時 / 作成者</span>
              <p className="text-gray-600 mt-[2px]">
                {mockData.createdAt} / {mockData.createdBy}
              </p>
            </div>
            <div>
              <span className="text-xs text-gray-400">更新日時 / 更新者</span>
              <p className="text-gray-600 mt-[2px]">
                {mockData.updatedAt} / {mockData.updatedBy}
              </p>
            </div>
          </div>
        </div>

        {/* フッター */}
        <div className="flex items-center justify-between pt-[16px] pb-[40px]">
          <button
            type="button"
            onClick={() => {
              if (confirm("このライダーズギアを削除してもよろしいですか？")) {
                router.push("/vendor/gear");
              }
            }}
            className="flex items-center gap-[6px] text-sm text-red-500 border border-red-300 px-[16px] py-[10px] hover:bg-red-50"
          >
            <Trash2 className="w-[14px] h-[14px]" />
            削除
          </button>
          <div className="flex items-center gap-[8px]">
            <Link
              href="/vendor/gear"
              className="border border-gray-300 px-[24px] py-[10px] text-sm hover:bg-gray-50"
            >
              戻る
            </Link>
            <button
              type="button"
              onClick={() => alert("保存しました")}
              className="bg-accent text-white px-[32px] py-[10px] text-sm hover:bg-accent/90"
            >
              登録
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Download, ArrowLeft } from "lucide-react";
import { VendorPageHeader } from "@/components/vendor/VendorPageHeader";

const EXPORT_FIELDS = [
  { id: "reservationNo", label: "予約番号" },
  { id: "registeredAt", label: "予約登録日時" },
  { id: "customerName", label: "予約者氏名" },
  { id: "memberNo", label: "会員番号" },
  { id: "storeName", label: "店舗" },
  { id: "vehicleName", label: "車両名" },
  { id: "registrationNo", label: "登録番号" },
  { id: "chassisNo", label: "車台番号" },
  { id: "priceClass", label: "料金クラス" },
  { id: "departureDate", label: "出発日" },
  { id: "departureTime", label: "出発時刻" },
  { id: "returnDate", label: "返却日" },
  { id: "returnTime", label: "返却時刻" },
  { id: "rentalDays", label: "レンタル日数" },
  { id: "baseAmount", label: "基本料金" },
  { id: "cdwAmount", label: "免責補償料" },
  { id: "couponDiscount", label: "クーポン割引" },
  { id: "jafDiscount", label: "JAF割引" },
  { id: "gearTotal", label: "ライダーズギア料金" },
  { id: "otherCharges", label: "その他料金" },
  { id: "totalAmount", label: "合計金額" },
  { id: "additionalCharges", label: "追加精算金額" },
  { id: "creditAmount", label: "クレジット決済金額" },
  { id: "settlementAmount", label: "精算金額" },
  { id: "status", label: "予約状態" },
  { id: "confirmDate", label: "確定日時" },
  { id: "departureMileage", label: "出発時走行距離" },
  { id: "arrivalMileage", label: "到着時走行距離" },
  { id: "nationality", label: "国籍" },
  { id: "age", label: "年齢" },
];

export default function VendorReservationExportPage() {
  const router = useRouter();

  // Step 1: Extraction conditions
  const [dateType, setDateType] = useState("registeredAt");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [store, setStore] = useState("");
  const [includeDeleted, setIncludeDeleted] = useState(false);
  const [includeJaf, setIncludeJaf] = useState(false);
  const [includeCancelled, setIncludeCancelled] = useState(false);

  // Step 2: Output fields
  const [selectedFields, setSelectedFields] = useState<string[]>(
    EXPORT_FIELDS.map((f) => f.id)
  );

  const toggleField = (id: string) => {
    setSelectedFields((prev) =>
      prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]
    );
  };

  const selectAllFields = () => {
    setSelectedFields(EXPORT_FIELDS.map((f) => f.id));
  };

  const clearAllFields = () => {
    setSelectedFields([]);
  };

  const inputClass =
    "border border-gray-300 px-[10px] py-[6px] text-sm w-full focus:outline-none focus:border-accent";

  return (
    <div>
      <VendorPageHeader
        title="予約データ抽出"
        breadcrumbs={[
          { label: "予約一覧", href: "/vendor/reservations" },
          { label: "予約データ抽出" },
        ]}
        actions={
          <button
            onClick={() => router.back()}
            className="flex items-center gap-[6px] border border-gray-300 bg-white px-[14px] py-[8px] text-sm text-gray-700 hover:bg-gray-50"
          >
            <ArrowLeft className="w-[14px] h-[14px]" />
            戻る
          </button>
        }
      />

      {/* Step 1: Extraction Conditions */}
      <div className="bg-white border border-gray-200 p-[20px] mb-[20px]">
        <div className="flex items-center gap-[8px] mb-[16px]">
          <span className="bg-accent text-white text-xs px-[10px] py-[4px] font-medium">Step 1</span>
          <h2 className="font-serif text-lg font-light">抽出条件</h2>
        </div>

        <div className="space-y-[14px]">
          {/* Date range */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-[12px] items-end">
            <div>
              <label className="block text-xs text-gray-500 mb-[4px]">日付種別</label>
              <select
                value={dateType}
                onChange={(e) => setDateType(e.target.value)}
                className={inputClass}
              >
                <option value="registeredAt">予約登録日</option>
                <option value="departureDate">出発日</option>
                <option value="returnDate">返却日</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-[4px]">開始日</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-[4px]">終了日</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-[4px]">店舗</label>
              <select
                value={store}
                onChange={(e) => setStore(e.target.value)}
                className={inputClass}
              >
                <option value="">すべて</option>
                <option value="宮崎橘通り店">宮崎橘通り店</option>
                <option value="宮崎空港店">宮崎空港店</option>
              </select>
            </div>
          </div>

          {/* Checkboxes */}
          <div className="flex items-center gap-[20px] pt-[8px]">
            <label className="flex items-center gap-[6px] text-sm text-gray-600 cursor-pointer">
              <input
                type="checkbox"
                checked={includeDeleted}
                onChange={(e) => setIncludeDeleted(e.target.checked)}
                className="accent-accent"
              />
              削除日を含む
            </label>
            <label className="flex items-center gap-[6px] text-sm text-gray-600 cursor-pointer">
              <input
                type="checkbox"
                checked={includeJaf}
                onChange={(e) => setIncludeJaf(e.target.checked)}
                className="accent-accent"
              />
              JAF割を含む
            </label>
            <label className="flex items-center gap-[6px] text-sm text-gray-600 cursor-pointer">
              <input
                type="checkbox"
                checked={includeCancelled}
                onChange={(e) => setIncludeCancelled(e.target.checked)}
                className="accent-accent"
              />
              キャンセルを含む
            </label>
          </div>
        </div>
      </div>

      {/* Step 2: Output Fields */}
      <div className="bg-white border border-gray-200 p-[20px] mb-[20px]">
        <div className="flex items-center gap-[8px] mb-[16px]">
          <span className="bg-accent text-white text-xs px-[10px] py-[4px] font-medium">Step 2</span>
          <h2 className="font-serif text-lg font-light">出力項目選択</h2>
        </div>

        <div className="flex items-center gap-[12px] mb-[14px]">
          <button
            onClick={selectAllFields}
            className="text-xs text-accent hover:underline"
          >
            すべて選択
          </button>
          <span className="text-gray-300">|</span>
          <button
            onClick={clearAllFields}
            className="text-xs text-accent hover:underline"
          >
            すべて解除
          </button>
          <span className="text-xs text-gray-400 ml-[8px]">
            {selectedFields.length} / {EXPORT_FIELDS.length} 項目選択中
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-[8px]">
          {EXPORT_FIELDS.map((field) => (
            <label
              key={field.id}
              className="flex items-center gap-[6px] text-sm text-gray-700 cursor-pointer py-[4px]"
            >
              <input
                type="checkbox"
                checked={selectedFields.includes(field.id)}
                onChange={() => toggleField(field.id)}
                className="accent-accent"
              />
              {field.label}
            </label>
          ))}
        </div>
      </div>

      {/* Step 3: Export */}
      <div className="bg-white border border-gray-200 p-[20px]">
        <div className="flex items-center gap-[8px] mb-[16px]">
          <span className="bg-accent text-white text-xs px-[10px] py-[4px] font-medium">Step 3</span>
          <h2 className="font-serif text-lg font-light">CSVファイル出力</h2>
        </div>

        <p className="text-sm text-gray-500 mb-[16px]">
          上記の条件と出力項目で予約データをCSVファイルとしてダウンロードします。
        </p>

        <button className="flex items-center gap-[6px] bg-accent text-white px-[24px] py-[10px] text-sm hover:bg-accent-dark">
          <Download className="w-[16px] h-[16px]" />
          CSV出力
        </button>
      </div>
    </div>
  );
}

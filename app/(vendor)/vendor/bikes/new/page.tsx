"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, X } from "lucide-react";
import { VendorPageHeader } from "@/components/vendor/VendorPageHeader";
import { FileUploader } from "@/components/ui/FileUploader";
import { RichTextEditor } from "@/components/ui/RichTextEditor";

interface SuspensionPeriod {
  id: string;
  startDate: string;
  endDate: string;
}

const storeOptions = [
  { id: "", name: "選択してください" },
  { id: "s-001", name: "宮崎本店" },
  { id: "s-002", name: "鹿児島支店" },
];

export default function BikeNewPage() {
  const [isPublished, setIsPublished] = useState(false);
  const [store, setStore] = useState("");
  const [vehicleName, setVehicleName] = useState("");
  const [maker, setMaker] = useState("");
  const [displacement, setDisplacement] = useState("");
  const [modelCode, setModelCode] = useState("");
  const [chassisNumber, setChassisNumber] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [color, setColor] = useState("");
  const [modelYear, setModelYear] = useState("");
  const [firstRegYear, setFirstRegYear] = useState("");
  const [firstRegMonth, setFirstRegMonth] = useState("");
  const [inspectionExpiry, setInspectionExpiry] = useState("");
  const [regArea, setRegArea] = useState("");
  const [regKana, setRegKana] = useState("");
  const [regNumber, setRegNumber] = useState("");
  const [priceClass, setPriceClass] = useState("");
  const [insurance, setInsurance] = useState("enrolled");
  const [inspectionFile, setInspectionFile] = useState<string[]>([]);
  const [equipment, setEquipment] = useState({
    etc: false,
    abs: false,
    usb: false,
    smartphoneHolderPaid: false,
    smartphoneHolderFree: false,
    rearCarrier: false,
    gripHeater: false,
    driveRecorder: false,
  });
  const [longTermRental, setLongTermRental] = useState(false);
  const [vehicleImages, setVehicleImages] = useState<string[]>([]);
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [remarks, setRemarks] = useState("");
  const [mileage, setMileage] = useState("");
  const [suspensionPeriods, setSuspensionPeriods] = useState<SuspensionPeriod[]>([]);

  const toggleEquipment = (key: keyof typeof equipment) => {
    setEquipment((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const addSuspensionPeriod = () => {
    setSuspensionPeriods((prev) => [
      ...prev,
      { id: `sp-${Date.now()}`, startDate: "", endDate: "" },
    ]);
  };

  const removeSuspensionPeriod = (id: string) => {
    setSuspensionPeriods((prev) => prev.filter((p) => p.id !== id));
  };

  const updateSuspensionPeriod = (id: string, field: "startDate" | "endDate", value: string) => {
    setSuspensionPeriods((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [field]: value } : p))
    );
  };

  const inputClass = "w-full border border-gray-200 px-[12px] py-[10px] text-sm focus:border-accent focus:outline-none";
  const labelClass = "block text-xs font-medium text-gray-500 mb-[4px]";
  const sectionClass = "bg-white border border-gray-200 p-[24px] space-y-[16px]";
  const sectionTitle = "text-base font-medium text-gray-800 pb-[8px] border-b border-gray-100 mb-[16px]";

  return (
    <div>
      <VendorPageHeader
        title="車両新規登録"
        breadcrumbs={[
          { label: "車両一覧", href: "/vendor/bikes" },
          { label: "新規登録" },
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
              <label className={labelClass}>車両ID</label>
              <input
                type="text"
                value="自動採番"
                readOnly
                className={inputClass + " bg-gray-50 text-gray-400"}
              />
            </div>
            <div>
              <label className={labelClass}>店舗</label>
              <select
                value={store}
                onChange={(e) => setStore(e.target.value)}
                className={inputClass}
              >
                {storeOptions.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className={labelClass}>車両名</label>
            <div className="flex gap-[8px]">
              <input
                type="text"
                value={vehicleName}
                onChange={(e) => setVehicleName(e.target.value)}
                className={inputClass}
                placeholder="車両名を入力"
              />
              <button className="whitespace-nowrap border border-gray-300 px-[16px] py-[10px] text-sm hover:bg-gray-50">
                車種選択
              </button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-[16px]">
            <div>
              <label className={labelClass}>メーカー</label>
              <input
                type="text"
                value={maker}
                onChange={(e) => setMaker(e.target.value)}
                className={inputClass}
                placeholder="Honda"
              />
            </div>
            <div>
              <label className={labelClass}>排気量</label>
              <div className="flex items-center gap-[4px]">
                <input
                  type="text"
                  value={displacement}
                  onChange={(e) => setDisplacement(e.target.value)}
                  className={inputClass}
                  placeholder="250"
                />
                <span className="text-sm text-gray-500 whitespace-nowrap">cc</span>
              </div>
            </div>
            <div>
              <label className={labelClass}>型式（半角）</label>
              <input
                type="text"
                value={modelCode}
                onChange={(e) => setModelCode(e.target.value)}
                className={inputClass}
                placeholder="半角英数字で入力"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-[16px]">
            <div>
              <label className={labelClass}>車台番号（半角）</label>
              <input
                type="text"
                value={chassisNumber}
                onChange={(e) => setChassisNumber(e.target.value)}
                className={inputClass}
                placeholder="半角英数字で入力"
              />
            </div>
            <div>
              <label className={labelClass}>予約サイト表示用車名</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className={inputClass}
                placeholder="予約サイトに表示される名前"
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>色</label>
            <input
              type="text"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className={inputClass + " max-w-[400px]"}
              placeholder="色を入力"
            />
          </div>
        </div>

        {/* 年式・登録 */}
        <div className={sectionClass}>
          <h2 className={sectionTitle}>年式・登録</h2>
          <div className="grid grid-cols-3 gap-[16px]">
            <div>
              <label className={labelClass}>モデル年式</label>
              <input
                type="text"
                value={modelYear}
                onChange={(e) => setModelYear(e.target.value)}
                className={inputClass}
                placeholder="2024"
              />
            </div>
            <div>
              <label className={labelClass}>初度登録年月</label>
              <div className="flex gap-[8px]">
                <input
                  type="text"
                  value={firstRegYear}
                  onChange={(e) => setFirstRegYear(e.target.value)}
                  className={inputClass}
                  placeholder="2024"
                />
                <span className="self-center text-sm text-gray-500">年</span>
                <input
                  type="text"
                  value={firstRegMonth}
                  onChange={(e) => setFirstRegMonth(e.target.value)}
                  className={inputClass + " max-w-[80px]"}
                  placeholder="01"
                />
                <span className="self-center text-sm text-gray-500">月</span>
              </div>
            </div>
            <div>
              <label className={labelClass}>車検有効期限</label>
              <input
                type="date"
                value={inspectionExpiry}
                onChange={(e) => setInspectionExpiry(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>
        </div>

        {/* 登録No */}
        <div className={sectionClass}>
          <h2 className={sectionTitle}>登録No</h2>
          <div className="flex items-end gap-[8px]">
            <div>
              <label className={labelClass}>地名</label>
              <input
                type="text"
                value={regArea}
                onChange={(e) => setRegArea(e.target.value)}
                className={inputClass + " w-[120px]"}
                placeholder="宮崎"
              />
            </div>
            <div>
              <label className={labelClass}>文字</label>
              <input
                type="text"
                value={regKana}
                onChange={(e) => setRegKana(e.target.value)}
                className={inputClass + " w-[80px]"}
                placeholder="あ"
              />
            </div>
            <div>
              <label className={labelClass}>番号</label>
              <input
                type="text"
                value={regNumber}
                onChange={(e) => setRegNumber(e.target.value)}
                className={inputClass + " w-[160px]"}
                placeholder="1234"
              />
            </div>
          </div>
        </div>

        {/* 料金クラス */}
        <div className={sectionClass}>
          <h2 className={sectionTitle}>料金クラス</h2>
          <div className="flex gap-[8px]">
            <input
              type="text"
              value={priceClass}
              onChange={(e) => setPriceClass(e.target.value)}
              className={inputClass + " max-w-[300px]"}
              readOnly
              placeholder="料金クラスを選択してください"
            />
            <button className="whitespace-nowrap border border-gray-300 px-[16px] py-[10px] text-sm hover:bg-gray-50">
              料金クラス選択
            </button>
          </div>
        </div>

        {/* 任意保険 */}
        <div className={sectionClass}>
          <h2 className={sectionTitle}>任意保険</h2>
          <div className="flex gap-[24px]">
            <label className="flex items-center gap-[6px] cursor-pointer">
              <input
                type="radio"
                name="insurance"
                value="enrolled"
                checked={insurance === "enrolled"}
                onChange={(e) => setInsurance(e.target.value)}
                className="accent-accent"
              />
              <span className="text-sm">申込済み</span>
            </label>
            <label className="flex items-center gap-[6px] cursor-pointer">
              <input
                type="radio"
                name="insurance"
                value="cancel"
                checked={insurance === "cancel"}
                onChange={(e) => setInsurance(e.target.value)}
                className="accent-accent"
              />
              <span className="text-sm">解約する</span>
            </label>
          </div>
        </div>

        {/* 車検証ファイル */}
        <div className={sectionClass}>
          <h2 className={sectionTitle}>車検証ファイル</h2>
          <FileUploader
            accept="application/pdf,image/*"
            value={inspectionFile}
            onChange={setInspectionFile}
            label="ファイルをアップロード"
          />
        </div>

        {/* 各種装備設定 */}
        <div className={sectionClass}>
          <h2 className={sectionTitle}>各種装備設定</h2>
          <div className="grid grid-cols-4 gap-[12px]">
            {[
              { key: "etc" as const, label: "ETC" },
              { key: "abs" as const, label: "ABS" },
              { key: "usb" as const, label: "USB" },
              { key: "smartphoneHolderPaid" as const, label: "スマホホルダー（有料）" },
              { key: "smartphoneHolderFree" as const, label: "スマホホルダー（無料）" },
              { key: "rearCarrier" as const, label: "リアキャリア" },
              { key: "gripHeater" as const, label: "グリップヒーター" },
              { key: "driveRecorder" as const, label: "ドライブレコーダー" },
            ].map((item) => (
              <label
                key={item.key}
                className="flex items-center gap-[6px] cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={equipment[item.key]}
                  onChange={() => toggleEquipment(item.key)}
                  className="accent-accent"
                />
                <span className="text-sm">{item.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* 車両属性設定 */}
        <div className={sectionClass}>
          <h2 className={sectionTitle}>車両属性設定</h2>
          <label className="flex items-center gap-[6px] cursor-pointer">
            <input
              type="checkbox"
              checked={longTermRental}
              onChange={(e) => setLongTermRental(e.target.checked)}
              className="accent-accent"
            />
            <span className="text-sm">長期レンタル</span>
          </label>
        </div>

        {/* 車両画像 */}
        <div className={sectionClass}>
          <h2 className={sectionTitle}>車両画像</h2>
          <FileUploader
            accept="image/*"
            multiple
            value={vehicleImages}
            onChange={setVehicleImages}
            label="画像をアップロード"
            maxFiles={10}
          />
          {vehicleImages.length > 0 && (
            <table className="w-full mt-[12px] text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left text-xs text-gray-500">
                  <th className="pb-[8px] pr-[12px]">サムネイル</th>
                  <th className="pb-[8px] pr-[12px]">ファイル名</th>
                  <th className="pb-[8px] w-[80px]">操作</th>
                </tr>
              </thead>
              <tbody>
                {vehicleImages.map((img, i) => (
                  <tr key={i} className="border-b border-gray-50">
                    <td className="py-[8px] pr-[12px]">
                      <div className="w-[48px] h-[36px] bg-gray-100 overflow-hidden">
                        <img src={img} alt="" className="w-full h-full object-cover" />
                      </div>
                    </td>
                    <td className="py-[8px] pr-[12px] text-gray-600">
                      {img.split("/").pop() || `image_${i + 1}`}
                    </td>
                    <td className="py-[8px]">
                      <button
                        type="button"
                        onClick={() =>
                          setVehicleImages((prev) => prev.filter((_, idx) => idx !== i))
                        }
                        className="text-xs text-red-500 hover:text-red-700"
                      >
                        削除
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* YouTube動画URL */}
        <div className={sectionClass}>
          <h2 className={sectionTitle}>YouTube動画URL</h2>
          <input
            type="text"
            value={youtubeUrl}
            onChange={(e) => setYoutubeUrl(e.target.value)}
            className={inputClass + " max-w-[600px]"}
            placeholder="https://www.youtube.com/watch?v=..."
          />
        </div>

        {/* 備考 */}
        <div className={sectionClass}>
          <h2 className={sectionTitle}>備考</h2>
          <RichTextEditor
            value={remarks}
            onChange={setRemarks}
            placeholder="備考を入力してください..."
          />
        </div>

        {/* 走行距離 */}
        <div className={sectionClass}>
          <h2 className={sectionTitle}>走行距離</h2>
          <div className="flex items-center gap-[8px]">
            <input
              type="number"
              value={mileage}
              onChange={(e) => setMileage(e.target.value)}
              className={inputClass + " max-w-[200px]"}
              placeholder="0"
            />
            <span className="text-sm text-gray-500">km</span>
          </div>
          <p className="text-xs text-gray-400 mt-[4px]">
            レンタルの出発時距離として参照されます。返却時に自動更新されます。
          </p>
        </div>

        {/* 予約停止期間 */}
        <div className={sectionClass}>
          <h2 className={sectionTitle}>予約停止期間</h2>
          <div className="space-y-[8px]">
            {suspensionPeriods.map((period) => (
              <div key={period.id} className="flex items-center gap-[8px]">
                <input
                  type="date"
                  value={period.startDate}
                  onChange={(e) =>
                    updateSuspensionPeriod(period.id, "startDate", e.target.value)
                  }
                  className={inputClass + " max-w-[200px]"}
                />
                <span className="text-sm text-gray-500">〜</span>
                <input
                  type="date"
                  value={period.endDate}
                  onChange={(e) =>
                    updateSuspensionPeriod(period.id, "endDate", e.target.value)
                  }
                  className={inputClass + " max-w-[200px]"}
                />
                <button
                  type="button"
                  onClick={() => removeSuspensionPeriod(period.id)}
                  className="p-[6px] text-gray-400 hover:text-red-500"
                >
                  <X className="w-[16px] h-[16px]" />
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={addSuspensionPeriod}
            className="flex items-center gap-[4px] text-sm text-accent hover:text-accent/80 mt-[8px]"
          >
            <Plus className="w-[14px] h-[14px]" />
            追加
          </button>
        </div>

        {/* フッター */}
        <div className="flex items-center justify-end gap-[8px] pt-[16px] pb-[40px]">
          <Link
            href="/vendor/bikes"
            className="border border-gray-300 px-[24px] py-[10px] text-sm hover:bg-gray-50"
          >
            戻る
          </Link>
          <button
            type="button"
            onClick={() => alert("登録しました")}
            className="bg-accent text-white px-[32px] py-[10px] text-sm hover:bg-accent/90"
          >
            登録
          </button>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Trash2, Plus, X, Star, ChevronDown } from "lucide-react";
import { VendorPageHeader } from "@/components/vendor/VendorPageHeader";
import { StatusBadge } from "@/components/vendor/StatusBadge";
import { FileUploader } from "@/components/ui/FileUploader";
import { RichTextEditor } from "@/components/ui/RichTextEditor";
import { mockBikes } from "@/lib/mock/bikes";
import { ENGINE_TYPES, LICENSE_TYPES, VEHICLE_CLASSES } from "@/lib/constants";
import { DEFAULT_PRICING } from "@/lib/booking/pricing";
import type { VehicleClass } from "@/types/database";

interface SuspensionPeriod {
  id: string;
  startDate: string;
  endDate: string;
}

/* ── メーカーマスタ ── */
const DEFAULT_MAKERS = [
  // 日本車
  "Honda", "Yamaha", "Suzuki", "Kawasaki",
  // 海外
  "Harley-Davidson", "BMW", "Ducati", "Triumph",
  "KTM", "Aprilia", "Moto Guzzi", "Indian",
  "Royal Enfield", "Husqvarna", "KYMCO", "SYM",
] as const;

interface MakerSelectProps {
  value: string;
  onChange: (v: string) => void;
  favorites: string[];
  onToggleFavorite: (maker: string) => void;
  customMakers: string[];
  onAddCustom: (maker: string) => void;
  inputClass: string;
}

function MakerSelect({
  value,
  onChange,
  favorites,
  onToggleFavorite,
  customMakers,
  onAddCustom,
  inputClass,
}: MakerSelectProps) {
  const [open, setOpen] = useState(false);
  const [customInput, setCustomInput] = useState("");

  const allMakers = [...DEFAULT_MAKERS, ...customMakers];

  // お気に入りを上位、それ以外はデフォルト順
  const sorted = [...allMakers].sort((a, b) => {
    const aFav = favorites.includes(a) ? 0 : 1;
    const bFav = favorites.includes(b) ? 0 : 1;
    if (aFav !== bFav) return aFav - bFav;
    return 0;
  });

  const handleAddCustom = () => {
    const trimmed = customInput.trim();
    if (!trimmed) return;
    if (allMakers.includes(trimmed)) return;
    onAddCustom(trimmed);
    onChange(trimmed);
    setCustomInput("");
    setOpen(false);
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={inputClass + " flex items-center justify-between text-left"}
      >
        <span className={value ? "text-black" : "text-gray-400"}>
          {value || "メーカーを選択"}
        </span>
        <ChevronDown className={"w-[16px] h-[16px] text-gray-400 transition-transform " + (open ? "rotate-180" : "")} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute top-full left-0 right-0 z-50 mt-[2px] bg-white border border-gray-200 shadow-lg max-h-[320px] overflow-y-auto">
            {sorted.map((m) => {
              const isFav = favorites.includes(m);
              const isSelected = value === m;
              return (
                <div
                  key={m}
                  className={"flex items-center px-[12px] py-[8px] text-sm hover:bg-gray-50 cursor-pointer " + (isSelected ? "bg-accent/5 text-accent font-medium" : "")}
                >
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); onToggleFavorite(m); }}
                    className="mr-[8px] flex-shrink-0"
                  >
                    <Star
                      size={14}
                      className={isFav ? "fill-amber-400 text-amber-400" : "text-gray-300"}
                    />
                  </button>
                  <span
                    className="flex-1"
                    onClick={() => { onChange(m); setOpen(false); }}
                  >
                    {m}
                  </span>
                </div>
              );
            })}

            {/* カスタム追加 */}
            <div className="border-t border-gray-100 px-[12px] py-[8px]">
              <p className="text-[11px] text-gray-400 mb-[6px]">その他のメーカーを追加</p>
              <div className="flex gap-[6px]">
                <input
                  type="text"
                  value={customInput}
                  onChange={(e) => setCustomInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddCustom(); } }}
                  placeholder="メーカー名を入力"
                  className="flex-1 border border-gray-200 px-[8px] py-[6px] text-sm focus:border-accent focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddCustom}
                  disabled={!customInput.trim()}
                  className="px-[12px] py-[6px] bg-accent text-white text-xs hover:bg-accent/90 disabled:opacity-40"
                >
                  追加
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/* ── 2時間プラン無効判定（126cc以上のクラス） ── */
const CLASSES_NO_2H = ["250", "400", "950", "1100", "1500"];

const storeOptions = [
  { id: "s-001", name: "宮崎本店" },
  { id: "s-002", name: "鹿児島支店" },
];

export default function BikeEditPage() {
  const params = useParams();
  const router = useRouter();
  const bikeId = params.id as string;

  // mockBikes からデータを検索（数値indexまたはid一致）
  const bikeData = useMemo(() => {
    const idx = Number(bikeId);
    if (!isNaN(idx) && idx >= 0 && idx < mockBikes.length) {
      return mockBikes[idx];
    }
    return mockBikes.find((b) => b.id === bikeId) ?? mockBikes[0];
  }, [bikeId]);

  // 登録No を3分割
  const regParts = useMemo(() => {
    const parts = (bikeData.registration_number ?? "").split(" ");
    return { area: parts[0] ?? "", kana: parts[1] ?? "", num: parts[2] ?? "" };
  }, [bikeData]);

  // State
  const [isPublished, setIsPublished] = useState(bikeData.is_published ?? true);
  const [store, setStore] = useState("s-001");
  const [vehicleName, setVehicleName] = useState(bikeData.name);
  const [maker, setMaker] = useState(bikeData.manufacturer);
  const [displacement, setDisplacement] = useState(String(bikeData.displacement ?? ""));
  const [modelCode, setModelCode] = useState(bikeData.model_code ?? bikeData.model);
  const [chassisNumber, setChassisNumber] = useState(bikeData.frame_number ?? "");
  const [displayName, setDisplayName] = useState(bikeData.display_name ?? bikeData.name);
  const [color, setColor] = useState(bikeData.color ?? "");
  const [engineType, setEngineType] = useState(bikeData.engine_type);
  const [seatHeight, setSeatHeight] = useState(String(bikeData.seat_height ?? ""));
  const [bikeWeight, setBikeWeight] = useState(String(bikeData.weight ?? ""));
  const [licenseType, setLicenseType] = useState(bikeData.license_type);
  const [description, setDescription] = useState(bikeData.description ?? "");
  const [modelYear, setModelYear] = useState(String(bikeData.model_year ?? bikeData.year ?? ""));
  const [firstRegYear, setFirstRegYear] = useState((bikeData.first_registration ?? "").split("-")[0] ?? "");
  const [firstRegMonth, setFirstRegMonth] = useState((bikeData.first_registration ?? "").split("-")[1] ?? "");
  const [inspectionExpiry, setInspectionExpiry] = useState(bikeData.inspection_expiry ?? "");
  const [regArea, setRegArea] = useState(regParts.area);
  const [regKana, setRegKana] = useState(regParts.kana);
  const [regNumber, setRegNumber] = useState(regParts.num);
  const [vehicleClass, setVehicleClass] = useState(bikeData.vehicle_class);
  const [rate2h, setRate2h] = useState(String(bikeData.hourly_rate_2h));
  const [rate4h, setRate4h] = useState(String(bikeData.hourly_rate_4h));
  const [rate1day, setRate1day] = useState(String(bikeData.daily_rate_1day));
  const [rate24h, setRate24h] = useState(String(bikeData.daily_rate_24h));
  const [rate32h, setRate32h] = useState(String(bikeData.daily_rate_32h));
  const [rateOvertime, setRateOvertime] = useState(String(bikeData.overtime_rate_per_hour));
  const [rateAdditional24h, setRateAdditional24h] = useState(String(bikeData.additional_24h_rate));
  const [insurance, setInsurance] = useState(bikeData.insurance_status ?? "insurance_none");
  const [inspectionFile, setInspectionFile] = useState<string[]>([]);
  const [equipment, setEquipment] = useState(bikeData.equipment ?? {
    etc: false, abs: false, usb: false, smartphoneHolderPaid: false,
    smartphoneHolderFree: false, rearCarrier: false, gripHeater: false, driveRecorder: false,
  });
  const [longTermRental, setLongTermRental] = useState(bikeData.is_long_term ?? false);
  const [isFeatured, setIsFeatured] = useState(bikeData.is_featured ?? false);
  const [displayOrder, setDisplayOrder] = useState(String(bikeData.display_order ?? ""));
  const [vehicleImages, setVehicleImages] = useState(bikeData.image_urls);
  const [youtubeUrl, setYoutubeUrl] = useState(bikeData.youtube_url ?? "");
  const [remarks, setRemarks] = useState(bikeData.notes_html ?? "");
  const [mileage, setMileage] = useState(String(bikeData.current_mileage ?? ""));
  const [suspensionPeriods, setSuspensionPeriods] = useState<SuspensionPeriod[]>(bikeData.suspension_periods ?? []);
  const [insuranceLoading, setInsuranceLoading] = useState(false);
  const [hasExternalInsurance, setHasExternalInsurance] = useState(false);
  const [externalInsuranceFile, setExternalInsuranceFile] = useState<string[]>([]);
  const [insuranceErrors, setInsuranceErrors] = useState<string[]>([]);
  const [favoriteMakers, setFavoriteMakers] = useState<string[]>(["Honda", "Yamaha", "Suzuki", "Kawasaki"]);
  const [customMakers, setCustomMakers] = useState<string[]>([]);

  const is2hDisabled = CLASSES_NO_2H.includes(vehicleClass);

  const toggleFavoriteMaker = (m: string) => {
    setFavoriteMakers((prev) =>
      prev.includes(m) ? prev.filter((f) => f !== m) : [...prev, m]
    );
  };

  const toggleEquipment = (key: string) => {
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

  const selectedClassInfo = VEHICLE_CLASSES.find((c) => c.value === vehicleClass);

  const inputClass = "w-full border border-gray-200 px-[12px] py-[10px] text-sm focus:border-accent focus:outline-none";
  const labelClass = "block text-xs font-medium text-gray-500 mb-[4px]";
  const sectionClass = "bg-white border border-gray-200 p-[24px] space-y-[16px]";
  const sectionTitle = "text-base font-medium text-gray-800 pb-[8px] border-b border-gray-100 mb-[16px]";

  return (
    <div>
      <VendorPageHeader
        title="車両編集"
        breadcrumbs={[
          { label: "車両一覧", href: "/vendor/bikes" },
          { label: `${bikeData.name} (${bikeData.id})` },
        ]}
      />

      <div className="space-y-[24px]">
        {/* 1. 公開設定 */}
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

        {/* 2. 基本情報 */}
        <div className={sectionClass}>
          <h2 className={sectionTitle}>基本情報</h2>

          <div className="grid grid-cols-2 gap-[16px]">
            <div>
              <label className={labelClass}>車両ID</label>
              <input
                type="text"
                value={bikeData.id}
                readOnly
                className={inputClass + " bg-gray-50 text-gray-500"}
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
              />
              <button className="whitespace-nowrap border border-gray-300 px-[16px] py-[10px] text-sm hover:bg-gray-50">
                車種選択
              </button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-[16px]">
            <div>
              <label className={labelClass}>メーカー</label>
              <MakerSelect
                value={maker}
                onChange={setMaker}
                favorites={favoriteMakers}
                onToggleFavorite={toggleFavoriteMaker}
                customMakers={customMakers}
                onAddCustom={(m) => setCustomMakers((prev) => [...prev, m])}
                inputClass={inputClass}
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
            />
          </div>
        </div>

        {/* 3. スペック情報（新規） */}
        <div className={sectionClass}>
          <h2 className={sectionTitle}>スペック情報</h2>
          <div className="grid grid-cols-2 gap-[16px]">
            <div>
              <label className={labelClass}>エンジン形式</label>
              <select
                value={engineType}
                onChange={(e) => setEngineType(e.target.value)}
                className={inputClass}
              >
                <option value="">選択してください</option>
                {ENGINE_TYPES.map((et) => (
                  <option key={et.value} value={et.value}>
                    {et.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>必要免許</label>
              <select
                value={licenseType}
                onChange={(e) => setLicenseType(e.target.value)}
                className={inputClass}
              >
                <option value="">選択してください</option>
                {LICENSE_TYPES.map((lt) => (
                  <option key={lt.value} value={lt.value}>
                    {lt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-[16px]">
            <div>
              <label className={labelClass}>シート高</label>
              <div className="flex items-center gap-[4px]">
                <input
                  type="number"
                  value={seatHeight}
                  onChange={(e) => setSeatHeight(e.target.value)}
                  className={inputClass}
                  placeholder="780"
                />
                <span className="text-sm text-gray-500 whitespace-nowrap">mm</span>
              </div>
            </div>
            <div>
              <label className={labelClass}>車両重量</label>
              <div className="flex items-center gap-[4px]">
                <input
                  type="number"
                  value={bikeWeight}
                  onChange={(e) => setBikeWeight(e.target.value)}
                  className={inputClass}
                  placeholder="200"
                />
                <span className="text-sm text-gray-500 whitespace-nowrap">kg</span>
              </div>
            </div>
          </div>
        </div>

        {/* 4. 紹介文（新規） */}
        <div className={sectionClass}>
          <h2 className={sectionTitle}>紹介文</h2>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className={inputClass}
            placeholder="車両の特徴やおすすめポイントを入力してください"
          />
        </div>

        {/* 5. 年式・登録 */}
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
                placeholder="2023"
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
                  placeholder="2023"
                />
                <span className="self-center text-sm text-gray-500">年</span>
                <input
                  type="text"
                  value={firstRegMonth}
                  onChange={(e) => setFirstRegMonth(e.target.value)}
                  className={inputClass + " max-w-[80px]"}
                  placeholder="06"
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

        {/* 6. 登録No */}
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
              />
            </div>
            <div>
              <label className={labelClass}>文字</label>
              <input
                type="text"
                value={regKana}
                onChange={(e) => setRegKana(e.target.value)}
                className={inputClass + " w-[80px]"}
              />
            </div>
            <div>
              <label className={labelClass}>番号</label>
              <input
                type="text"
                value={regNumber}
                onChange={(e) => setRegNumber(e.target.value)}
                className={inputClass + " w-[160px]"}
              />
            </div>
          </div>
        </div>

        {/* 7. 料金設定（改修） */}
        <div className={sectionClass}>
          <h2 className={sectionTitle}>料金設定</h2>

          <div>
            <label className={labelClass}>車両クラス</label>
            <div className="flex items-center gap-[12px]">
              <select
                value={vehicleClass}
                onChange={(e) => {
                  const cls = e.target.value as VehicleClass;
                  setVehicleClass(cls);
                  const p = DEFAULT_PRICING[cls];
                  if (p) {
                    setRate2h(String(p.rate_2h ?? 0));
                    setRate4h(String(p.rate_4h));
                    setRate1day(String(p.rate_1day));
                    setRate24h(String(p.rate_24h));
                    setRate32h(String(p.rate_32h));
                    setRateOvertime(String(p.overtime_per_hour));
                    setRateAdditional24h(String(p.additional_24h));
                  }
                }}
                className={inputClass + " max-w-[240px]"}
              >
                {VEHICLE_CLASSES.map((vc) => (
                  <option key={vc.value} value={vc.value}>
                    {vc.label}
                  </option>
                ))}
              </select>
              {selectedClassInfo && (
                <span className="text-xs text-gray-400">
                  排気量目安: {selectedClassInfo.displacement}
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-4 gap-[12px] mt-[16px]">
            <div>
              <label className={labelClass}>2時間</label>
              <div className="flex items-center gap-[4px]">
                <input
                  type="number"
                  value={rate2h}
                  onChange={(e) => setRate2h(e.target.value)}
                  disabled={is2hDisabled}
                  className={inputClass + (is2hDisabled ? " bg-gray-100 text-gray-400 cursor-not-allowed" : "")}
                />
                <span className="text-sm text-gray-500 whitespace-nowrap">円</span>
              </div>
              {is2hDisabled && (
                <p className="text-[10px] text-gray-400 mt-[2px]">126cc以上は対象外</p>
              )}
            </div>
            <div>
              <label className={labelClass}>4時間</label>
              <div className="flex items-center gap-[4px]">
                <input
                  type="number"
                  value={rate4h}
                  onChange={(e) => setRate4h(e.target.value)}
                  className={inputClass}
                />
                <span className="text-sm text-gray-500 whitespace-nowrap">円</span>
              </div>
            </div>
            <div>
              <label className={labelClass}>日帰り</label>
              <div className="flex items-center gap-[4px]">
                <input
                  type="number"
                  value={rate1day}
                  onChange={(e) => setRate1day(e.target.value)}
                  className={inputClass}
                />
                <span className="text-sm text-gray-500 whitespace-nowrap">円</span>
              </div>
            </div>
            <div>
              <label className={labelClass}>24時間</label>
              <div className="flex items-center gap-[4px]">
                <input
                  type="number"
                  value={rate24h}
                  onChange={(e) => setRate24h(e.target.value)}
                  className={inputClass}
                />
                <span className="text-sm text-gray-500 whitespace-nowrap">円</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-[12px]">
            <div>
              <label className={labelClass}>1泊2日</label>
              <div className="flex items-center gap-[4px]">
                <input
                  type="number"
                  value={rate32h}
                  onChange={(e) => setRate32h(e.target.value)}
                  className={inputClass}
                />
                <span className="text-sm text-gray-500 whitespace-nowrap">円</span>
              </div>
            </div>
            <div>
              <label className={labelClass}>超過（1時間）</label>
              <div className="flex items-center gap-[4px]">
                <input
                  type="number"
                  value={rateOvertime}
                  onChange={(e) => setRateOvertime(e.target.value)}
                  className={inputClass}
                />
                <span className="text-sm text-gray-500 whitespace-nowrap">円</span>
              </div>
            </div>
            <div>
              <label className={labelClass}>追加24h</label>
              <div className="flex items-center gap-[4px]">
                <input
                  type="number"
                  value={rateAdditional24h}
                  onChange={(e) => setRateAdditional24h(e.target.value)}
                  className={inputClass}
                />
                <span className="text-sm text-gray-500 whitespace-nowrap">円</span>
              </div>
            </div>
          </div>
        </div>

        {/* 8. 任意保険 */}
        <div className={sectionClass}>
          <h2 className={sectionTitle}>任意保険</h2>

          {/* ステータス表示 */}
          <div className="flex items-center gap-[8px] mb-[16px]">
            <span className="text-xs text-gray-500">現在のステータス:</span>
            <StatusBadge status={insurance} />
          </div>

          {/* バリデーションエラー */}
          {insuranceErrors.length > 0 && (
            <div className="bg-red-50 border border-red-200 px-[16px] py-[12px] mb-[16px]">
              <p className="text-sm font-medium text-red-700 mb-[4px]">以下の情報が不足しています</p>
              <ul className="list-disc list-inside text-sm text-red-600 space-y-[2px]">
                {insuranceErrors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          {/* 申込・解約ボタン */}
          <div className="flex items-center gap-[12px]">
            <button
              type="button"
              disabled={insuranceLoading || insurance === "insurance_applying" || insurance === "insurance_active"}
              onClick={async () => {
                // バリデーション
                const errors: string[] = [];
                if (!store) errors.push("店舗を選択してください");
                if (!regArea || !regKana || !regNumber) errors.push("登録No（地名・文字・番号）をすべて入力してください");
                if (!chassisNumber) errors.push("車台番号を入力してください");
                if (inspectionFile.length === 0) errors.push("車検証ファイルをアップロードしてください");
                if (hasExternalInsurance && externalInsuranceFile.length === 0) {
                  errors.push("他社保険証をアップロードしてください");
                }
                setInsuranceErrors(errors);
                if (errors.length > 0) return;

                if (!confirm("保険会社に加入申込メールを送信します。よろしいですか？")) return;
                setInsuranceLoading(true);
                try {
                  const res = await fetch("/api/insurance", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      action: "apply",
                      bikeId: bikeData.id,
                      bikeName: vehicleName,
                      vendorName: "サンプルベンダー",
                      vendorEmail: "vendor@example.com",
                      hasExternalInsurance,
                    }),
                  });
                  const data = await res.json();
                  if (data.success) {
                    setInsurance(data.newStatus);
                    setInsuranceErrors([]);
                    alert(data.message);
                  }
                } catch {
                  alert("送信に失敗しました");
                } finally {
                  setInsuranceLoading(false);
                }
              }}
              className="flex items-center gap-[6px] bg-accent text-white px-[20px] py-[8px] text-sm hover:bg-accent/90 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {insuranceLoading ? "送信中..." : "申し込む"}
            </button>
            <button
              type="button"
              disabled={insuranceLoading || insurance === "insurance_none" || insurance === "insurance_cancelled" || insurance === "insurance_cancelling"}
              onClick={async () => {
                if (!confirm("保険を解約すると車両は非公開になり、アーカイブに移動します。よろしいですか？")) return;
                setInsuranceLoading(true);
                try {
                  const res = await fetch("/api/insurance", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      action: "cancel",
                      bikeId: bikeData.id,
                      bikeName: vehicleName,
                      vendorName: "サンプルベンダー",
                      vendorEmail: "vendor@example.com",
                    }),
                  });
                  const data = await res.json();
                  if (data.success) {
                    setInsurance(data.newStatus);
                    setIsPublished(false);
                    setInsuranceErrors([]);
                    alert(data.message);
                  }
                } catch {
                  alert("送信に失敗しました");
                } finally {
                  setInsuranceLoading(false);
                }
              }}
              className="flex items-center gap-[6px] border border-red-300 text-red-600 px-[20px] py-[8px] text-sm hover:bg-red-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {insuranceLoading ? "送信中..." : "解約する"}
            </button>
          </div>

          {/* 必須情報の案内 */}
          <div className="mt-[16px] bg-gray-50 border border-gray-200 px-[16px] py-[12px]">
            <p className="text-xs font-medium text-gray-600 mb-[6px]">申込に必要な情報</p>
            <div className="grid grid-cols-2 gap-x-[16px] gap-y-[4px] text-xs text-gray-500">
              <div className="flex items-center gap-[6px]">
                <span className={store ? "text-accent" : "text-red-400"}>{store ? "✓" : "○"}</span>
                店舗
              </div>
              <div className="flex items-center gap-[6px]">
                <span className={regArea && regKana && regNumber ? "text-accent" : "text-red-400"}>
                  {regArea && regKana && regNumber ? "✓" : "○"}
                </span>
                登録No
              </div>
              <div className="flex items-center gap-[6px]">
                <span className={chassisNumber ? "text-accent" : "text-red-400"}>{chassisNumber ? "✓" : "○"}</span>
                車台番号
              </div>
              <div className="flex items-center gap-[6px]">
                <span className={inspectionFile.length > 0 ? "text-accent" : "text-red-400"}>
                  {inspectionFile.length > 0 ? "✓" : "○"}
                </span>
                車検証ファイル
              </div>
              {hasExternalInsurance && (
                <div className="flex items-center gap-[6px]">
                  <span className={externalInsuranceFile.length > 0 ? "text-accent" : "text-red-400"}>
                    {externalInsuranceFile.length > 0 ? "✓" : "○"}
                  </span>
                  他社保険証
                </div>
              )}
            </div>
          </div>

          {/* 他社保険 */}
          <div className="mt-[16px]">
            <label className="flex items-start gap-[8px] cursor-pointer">
              <input
                type="checkbox"
                checked={hasExternalInsurance}
                onChange={(e) => setHasExternalInsurance(e.target.checked)}
                className="mt-[2px] accent-accent"
              />
              <div>
                <span className="text-sm font-medium">他社の任意保険に加入している</span>
                <p className="text-xs text-gray-400 mt-[2px]">
                  他社保険に加入済みの場合、保険証のアップロードが必要です
                </p>
              </div>
            </label>

            {hasExternalInsurance && (
              <div className="mt-[12px] ml-[26px]">
                <label className={labelClass}>
                  他社保険証 <span className="text-red-500">*</span>
                </label>
                <FileUploader
                  accept="application/pdf,image/*"
                  value={externalInsuranceFile}
                  onChange={setExternalInsuranceFile}
                  label="保険証をアップロード"
                />
              </div>
            )}
          </div>
        </div>

        {/* 9. 車検証ファイル */}
        <div className={sectionClass}>
          <h2 className={sectionTitle}>車検証ファイル</h2>
          <FileUploader
            accept="application/pdf,image/*"
            value={inspectionFile}
            onChange={setInspectionFile}
            label="ファイルをアップロード"
          />
        </div>

        {/* 10. 各種装備設定 */}
        <div className={sectionClass}>
          <h2 className={sectionTitle}>各種装備設定</h2>
          <div className="grid grid-cols-4 gap-[12px]">
            {[
              { key: "etc", label: "ETC" },
              { key: "abs", label: "ABS" },
              { key: "usb", label: "USB" },
              { key: "smartphoneHolderPaid", label: "スマホホルダー（有料）" },
              { key: "smartphoneHolderFree", label: "スマホホルダー（無料）" },
              { key: "rearCarrier", label: "リアキャリア" },
              { key: "gripHeater", label: "グリップヒーター" },
              { key: "driveRecorder", label: "ドライブレコーダー" },
            ].map((item) => (
              <label
                key={item.key}
                className="flex items-center gap-[6px] cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={!!equipment[item.key]}
                  onChange={() => toggleEquipment(item.key)}
                  className="accent-accent"
                />
                <span className="text-sm">{item.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* 11. 車両属性設定 */}
        <div className={sectionClass}>
          <h2 className={sectionTitle}>車両属性設定</h2>
          <div className="space-y-[12px]">
            <label className="flex items-center gap-[6px] cursor-pointer">
              <input
                type="checkbox"
                checked={longTermRental}
                onChange={(e) => setLongTermRental(e.target.checked)}
                className="accent-accent"
              />
              <span className="text-sm">長期レンタル</span>
            </label>
            <label className="flex items-center gap-[6px] cursor-pointer">
              <input
                type="checkbox"
                checked={isFeatured}
                onChange={(e) => setIsFeatured(e.target.checked)}
                className="accent-accent"
              />
              <span className="text-sm">おすすめ表示</span>
            </label>
            <div className="flex items-center gap-[8px]">
              <label className={labelClass + " mb-0"}>表示順</label>
              <input
                type="number"
                value={displayOrder}
                onChange={(e) => setDisplayOrder(e.target.value)}
                className={inputClass + " max-w-[120px]"}
                placeholder="1"
              />
            </div>
          </div>
        </div>

        {/* 12. 車両画像 */}
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

        {/* 13. YouTube動画URL */}
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

        {/* 14. 備考 */}
        <div className={sectionClass}>
          <h2 className={sectionTitle}>備考</h2>
          <RichTextEditor
            value={remarks}
            onChange={setRemarks}
            placeholder="備考を入力してください..."
          />
        </div>

        {/* 15. 走行距離 */}
        <div className={sectionClass}>
          <h2 className={sectionTitle}>走行距離</h2>
          <div className="flex items-center gap-[8px]">
            <input
              type="number"
              value={mileage}
              onChange={(e) => setMileage(e.target.value)}
              className={inputClass + " max-w-[200px]"}
            />
            <span className="text-sm text-gray-500">km</span>
          </div>
          <p className="text-xs text-gray-400 mt-[4px]">
            レンタルの出発時距離として参照されます。返却時に自動更新されます。
          </p>
        </div>

        {/* 16. 予約停止期間 */}
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

        {/* 17. メタ情報 */}
        <div className={sectionClass}>
          <h2 className={sectionTitle}>メタ情報</h2>
          <div className="grid grid-cols-2 gap-[16px] text-sm">
            <div>
              <span className="text-xs text-gray-400">作成日時</span>
              <p className="text-gray-600 mt-[2px]">
                {bikeData.created_at ?? "—"}
              </p>
            </div>
            <div>
              <span className="text-xs text-gray-400">更新日時</span>
              <p className="text-gray-600 mt-[2px]">
                {bikeData.updated_at ?? "—"}
              </p>
            </div>
          </div>
        </div>

        {/* 18. フッター */}
        <div className="flex items-center justify-between pt-[16px] pb-[40px]">
          <button
            type="button"
            onClick={() => {
              if (confirm("この車両を削除してもよろしいですか？")) {
                router.push("/vendor/bikes");
              }
            }}
            className="flex items-center gap-[6px] text-sm text-red-500 border border-red-300 px-[16px] py-[10px] hover:bg-red-50"
          >
            <Trash2 className="w-[14px] h-[14px]" />
            削除
          </button>
          <div className="flex items-center gap-[8px]">
            <Link
              href="/vendor/bikes"
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

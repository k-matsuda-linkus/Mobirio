"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { Download, Loader2 } from "lucide-react";
import { VendorPageHeader } from "@/components/vendor/VendorPageHeader";
import { mockVendors } from "@/lib/mock/vendors";
import { mockBikes } from "@/lib/mock/bikes";
import { mockBusinessEntity } from "@/lib/mock/business";
import { exportRentalRecordExcel } from "@/lib/excel/rentalRecord";

/* ---------- 定数 ---------- */

const FISCAL_YEARS = [
  { value: "6", label: "令和6年度" },
  { value: "7", label: "令和7年度" },
  { value: "8", label: "令和8年度" },
];

const ALL_BUREAUS = [
  { value: "宮崎", label: "宮崎運輸支局" },
  { value: "福岡", label: "福岡運輸支局" },
  { value: "鹿児島", label: "鹿児島運輸支局" },
  { value: "東京", label: "東京運輸支局" },
  { value: "大阪", label: "大阪運輸支局" },
  { value: "札幌", label: "札幌運輸支局" },
  { value: "名古屋", label: "名古屋（愛知）運輸支局" },
  { value: "広島", label: "広島運輸支局" },
  { value: "仙台", label: "仙台（宮城）運輸支局" },
];

/** 店舗の都道府県から該当する管轄支局のみ抽出 */
const vendorBureauKeys = Array.from(
  new Set(
    mockVendors
      .filter((v) => v.is_active && v.is_approved)
      .map((v) => v.prefecture.replace(/[都府県]$/, "")),
  ),
);
const BUREAUS = ALL_BUREAUS.filter((b) => vendorBureauKeys.includes(b.value));
const DEFAULT_BUREAU = BUREAUS[0]?.value ?? "宮崎";

const CATEGORIES = [
  { key: "passenger", label: "乗用車" },
  { key: "microbus", label: "マイクロバス" },
  { key: "cargo", label: "貨物自動車" },
  { key: "special", label: "特種用途車" },
  { key: "motorcycle", label: "二輪車" },
] as const;

type CategoryKey = (typeof CATEGORIES)[number]["key"];
type RecordFields = { vehicles: string; rentals: string; dayVehicles: string; km: string; revenue: string };
type Records = Record<CategoryKey, RecordFields>;

const VEHICLE_TYPES = ["passenger", "bus", "cargo", "special", "motorcycle"] as const;
const VEHICLE_TYPE_LABELS: Record<string, string> = {
  passenger: "乗用", bus: "バス", cargo: "貨物", special: "特種", motorcycle: "二輪",
};

type VehicleTypeKey = (typeof VEHICLE_TYPES)[number];

type OfficeRow = {
  bureau: string; name: string; address: string;
} & Record<VehicleTypeKey, string>;

const EMPTY_OFFICE: OfficeRow = {
  bureau: "", name: "", address: "",
  passenger: "", bus: "", cargo: "", special: "", motorcycle: "",
};

const MAX_OFFICE_ROWS = 10;

/** 都道府県 → 管轄運輸支局キーの変換 */
function prefectureToBureau(pref: string): string {
  return pref.replace(/[都府県]$/, "");
}

/** 指定した管轄の mockVendors / mockBikes から事務所行を生成 */
function buildOfficesForBureau(bureauKey: string): OfficeRow[] {
  const activeVendors = mockVendors.filter(
    (v) => v.is_active && v.is_approved && prefectureToBureau(v.prefecture) === bureauKey,
  );
  const rows: OfficeRow[] = activeVendors.map((v) => {
    const bikeCount = mockBikes.filter((b) => b.vendor_id === v.id && b.is_available).length;
    return {
      ...EMPTY_OFFICE,
      bureau: prefectureToBureau(v.prefecture),
      name: v.name,
      address: v.address,
      motorcycle: bikeCount > 0 ? String(bikeCount) : "",
    };
  });
  while (rows.length < MAX_OFFICE_ROWS) rows.push({ ...EMPTY_OFFICE });
  return rows.slice(0, MAX_OFFICE_ROWS);
}

/* ---------- ヘルパー ---------- */

function fiscalPeriod(reiwa: string) {
  const y = Number(reiwa);
  return `令和${y}年4月1日から令和${y + 1}年3月31日まで`;
}

function sumField(records: Records, field: keyof RecordFields): number {
  return CATEGORIES.reduce((acc, c) => acc + (Number(records[c.key][field]) || 0), 0);
}

/* ---------- ページ ---------- */

export default function VendorRentalRecordExportPage() {
  /* state */
  const [tab, setTab] = useState<"form1" | "form2">("form1");
  const [fiscalYear, setFiscalYear] = useState("8");
  const [bureau, setBureau] = useState(DEFAULT_BUREAU);
  const [bizInfo, setBizInfo] = useState({
    name: mockBusinessEntity.name,
    address: mockBusinessEntity.address,
    representative: mockBusinessEntity.representative,
    phone: mockBusinessEntity.phone,
    staff: mockBusinessEntity.staff,
  });
  const [officeCount, setOfficeCount] = useState("");
  const [records, setRecords] = useState<Records>({
    passenger:  { vehicles: "", rentals: "", dayVehicles: "", km: "", revenue: "" },
    microbus:   { vehicles: "", rentals: "", dayVehicles: "", km: "", revenue: "" },
    cargo:      { vehicles: "", rentals: "", dayVehicles: "", km: "", revenue: "" },
    special:    { vehicles: "", rentals: "", dayVehicles: "", km: "", revenue: "" },
    motorcycle: { vehicles: "16", rentals: "5", dayVehicles: "8", km: "12500", revenue: "72300" },
  });
  const [carShare, setCarShare] = useState({ depots: "", oneway: "", other: "" });

  /* 様式2: 事務所一覧（最大10行）— 提出先の管轄のみ */
  const [offices, setOffices] = useState<OfficeRow[]>(() => buildOfficesForBureau(DEFAULT_BUREAU));

  useEffect(() => {
    setOffices(buildOfficesForBureau(bureau));
  }, [bureau]);

  function updateOffice(idx: number, field: keyof OfficeRow, value: string) {
    setOffices((prev) => prev.map((row, i) => (i === idx ? { ...row, [field]: value } : row)));
  }

  /* 合計 */
  const totals = useMemo(
    () => ({
      vehicles: sumField(records, "vehicles"),
      rentals: sumField(records, "rentals"),
      dayVehicles: sumField(records, "dayVehicles"),
      km: sumField(records, "km"),
      revenue: sumField(records, "revenue"),
    }),
    [records],
  );

  const carShareTotal = useMemo(() => {
    return (Number(carShare.oneway) || 0) + (Number(carShare.other) || 0);
  }, [carShare]);

  /* record 更新ヘルパー */
  function updateRecord(key: CategoryKey, field: keyof RecordFields, value: string) {
    setRecords((prev) => ({ ...prev, [key]: { ...prev[key], [field]: value } }));
  }

  /* Excel出力 */
  const [exporting, setExporting] = useState(false);

  const handleExport = useCallback(async () => {
    setExporting(true);
    try {
      const form2Offices = offices.map((o) => ({
        bureau: o.bureau,
        name: o.name,
        address: o.address,
        passenger: o.passenger,
        bus: o.bus,
        cargo: o.cargo,
        special: o.special,
        motorcycle: o.motorcycle,
      }));

      await exportRentalRecordExcel(
        {
          fiscalYear,
          bureau,
          bizInfo,
          officeCount,
          records,
          carShare,
        },
        {
          fiscalYear,
          offices: form2Offices,
        },
      );
    } catch (err) {
      console.error("Excel出力エラー:", err);
      alert("Excel出力に失敗しました。");
    } finally {
      setExporting(false);
    }
  }, [fiscalYear, bureau, bizInfo, officeCount, records, carShare, offices]);

  /* スタイル */
  const inputClass =
    "border border-gray-300 px-[10px] py-[6px] text-sm focus:outline-none focus:border-accent";
  const thClass =
    "bg-gray-100 border border-gray-300 px-[8px] py-[6px] text-xs font-medium text-gray-600 whitespace-nowrap";
  const tdClass = "border border-gray-300 px-[8px] py-[6px] text-sm text-right";
  const cellInputClass = "w-full text-right text-sm focus:outline-none focus:bg-blue-50";

  return (
    <div>
      <VendorPageHeader
        title="貸渡実績報告書"
        breadcrumbs={[{ label: "データ出力" }, { label: "貸渡実績報告書" }]}
        actions={
          <button
            onClick={handleExport}
            disabled={exporting}
            className="flex items-center gap-[6px] bg-accent text-white px-[16px] py-[7px] text-sm hover:bg-accent/90 disabled:opacity-50"
          >
            {exporting ? (
              <Loader2 className="w-[14px] h-[14px] animate-spin" />
            ) : (
              <Download className="w-[14px] h-[14px]" />
            )}
            {exporting ? "出力中..." : "Excel出力"}
          </button>
        }
      />

      {/* タブ */}
      <div className="flex border-b border-gray-200 mb-[16px]">
        <button
          onClick={() => setTab("form1")}
          className={`px-[20px] py-[10px] text-sm font-medium border-b-[2px] -mb-[1px] ${
            tab === "form1"
              ? "border-accent text-accent"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          様式1 貸渡実績報告書
        </button>
        <button
          onClick={() => setTab("form2")}
          className={`px-[20px] py-[10px] text-sm font-medium border-b-[2px] -mb-[1px] ${
            tab === "form2"
              ? "border-accent text-accent"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          様式2 事務所別車種別配置車両数一覧
        </button>
      </div>

      {tab === "form1" ? (
        <>
          {/* ========== ヘッダー情報 ========== */}
          <div className="bg-white border border-gray-200 p-[20px] mb-[16px]">
            <h3 className="text-sm font-medium text-gray-700 mb-[16px]">ヘッダー情報</h3>

            {/* 年度 & 提出先 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-[16px] mb-[16px]">
              {/* 年度 */}
              <div>
                <label className="block text-xs text-gray-500 mb-[4px]">対象年度</label>
                <select
                  value={fiscalYear}
                  onChange={(e) => setFiscalYear(e.target.value)}
                  className={inputClass + " w-full"}
                >
                  {FISCAL_YEARS.map((fy) => (
                    <option key={fy.value} value={fy.value}>
                      {fy.label}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-400 mt-[4px]">{fiscalPeriod(fiscalYear)}</p>
              </div>

              {/* 提出先 */}
              <div>
                <label className="block text-xs text-gray-500 mb-[4px]">提出先</label>
                <select
                  value={bureau}
                  onChange={(e) => setBureau(e.target.value)}
                  className={inputClass + " w-full"}
                >
                  {BUREAUS.map((b) => (
                    <option key={b.value} value={b.value}>
                      {b.label}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-400 mt-[4px]">
                  {BUREAUS.find((b) => b.value === bureau)?.label}長 あて
                </p>
              </div>
            </div>

            {/* 事業者情報 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-[12px]">
              <div>
                <label className="block text-xs text-gray-500 mb-[4px]">事業者名</label>
                <input
                  type="text"
                  value={bizInfo.name}
                  onChange={(e) => setBizInfo((p) => ({ ...p, name: e.target.value }))}
                  className={inputClass + " w-full"}
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-[4px]">住所</label>
                <input
                  type="text"
                  value={bizInfo.address}
                  onChange={(e) => setBizInfo((p) => ({ ...p, address: e.target.value }))}
                  className={inputClass + " w-full"}
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-[4px]">代表者名</label>
                <input
                  type="text"
                  value={bizInfo.representative}
                  onChange={(e) => setBizInfo((p) => ({ ...p, representative: e.target.value }))}
                  className={inputClass + " w-full"}
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-[4px]">電話番号</label>
                <input
                  type="text"
                  value={bizInfo.phone}
                  onChange={(e) => setBizInfo((p) => ({ ...p, phone: e.target.value }))}
                  className={inputClass + " w-full"}
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-[4px]">担当者名</label>
                <input
                  type="text"
                  value={bizInfo.staff}
                  onChange={(e) => setBizInfo((p) => ({ ...p, staff: e.target.value }))}
                  className={inputClass + " w-full"}
                />
              </div>
            </div>
          </div>

          {/* ========== ①貸渡実績 ========== */}
          <div className="bg-white border border-gray-200 p-[20px] mb-[16px]">
            <h3 className="text-sm font-medium text-gray-700 mb-[12px]">①貸渡実績</h3>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className={thClass + " text-center"}>運輸支局名</th>
                    <th className={thClass + " text-center"}>事務所数</th>
                    <th className={thClass + " text-center"}>区分</th>
                    <th className={thClass + " text-right"}>車両数</th>
                    <th className={thClass + " text-right"}>延貸渡回数</th>
                    <th className={thClass + " text-right"}>延貸渡日車数</th>
                    <th className={thClass + " text-right"}>延走行キロ</th>
                    <th className={thClass + " text-right"}>総貸渡料金</th>
                  </tr>
                </thead>
                <tbody>
                  {CATEGORIES.map((cat, idx) => (
                    <tr key={cat.key}>
                      {/* 運輸支局名 — 最初の行だけ rowSpan */}
                      {idx === 0 && (
                        <td
                          className="border border-gray-300 px-[8px] py-[6px] text-sm text-center align-middle"
                          rowSpan={CATEGORIES.length + 1}
                        >
                          {BUREAUS.find((b) => b.value === bureau)?.label ?? bureau}
                        </td>
                      )}
                      {/* 事務所数 — 最初の行だけ rowSpan */}
                      {idx === 0 && (
                        <td
                          className="border border-gray-300 px-[8px] py-[6px] text-sm text-center align-middle"
                          rowSpan={CATEGORIES.length + 1}
                        >
                          <input
                            type="text"
                            inputMode="numeric"
                            value={officeCount}
                            onChange={(e) => setOfficeCount(e.target.value)}
                            className={cellInputClass + " text-center"}
                            placeholder="-"
                          />
                        </td>
                      )}
                      {/* 区分 */}
                      <td className="border border-gray-300 px-[8px] py-[6px] text-sm text-center">
                        {cat.label}
                      </td>
                      {/* 各入力列 */}
                      {(["vehicles", "rentals", "dayVehicles", "km", "revenue"] as const).map(
                        (field) => (
                          <td key={field} className={tdClass}>
                            <input
                              type="text"
                              inputMode="numeric"
                              value={records[cat.key][field]}
                              onChange={(e) => updateRecord(cat.key, field, e.target.value)}
                              className={cellInputClass}
                              placeholder="-"
                            />
                          </td>
                        ),
                      )}
                    </tr>
                  ))}

                  {/* 合計行 */}
                  <tr className="bg-gray-50 font-medium">
                    {/* rowSpan でスキップ（運輸支局名・事務所数列なし） */}
                    <td className="border border-gray-300 px-[8px] py-[6px] text-sm text-center font-medium">
                      合計
                    </td>
                    <td className={tdClass + " font-medium"}>{totals.vehicles.toLocaleString()}</td>
                    <td className={tdClass + " font-medium"}>{totals.rentals.toLocaleString()}</td>
                    <td className={tdClass + " font-medium"}>{totals.dayVehicles.toLocaleString()}</td>
                    <td className={tdClass + " font-medium"}>{totals.km.toLocaleString()}</td>
                    <td className={tdClass + " font-medium"}>{totals.revenue.toLocaleString()}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* 注意書き */}
            <div className="text-xs text-gray-500 mt-[12px] space-y-[6px]">
              <p>
                ※
                貸渡を行っている事務所（使用の本拠）を管轄する運輸支局（各都道府県）ごとに別葉で作成してください。
              </p>
              <p>
                ※
                延貸渡回数と貸渡日車数の計算例：車を2台所有しており、A車を3日間、7日間、10日間（計3回）、B車を2日間、4日間（計2回）貸し出した場合、延貸渡回数は、5回（A車：3回＋B車：2回）、延貸渡日車数は26日（A車：20日間＋B車：6日間）となる。
              </p>
              <p>
                ※
                貸渡期間が年度をまたぐ場合は、当年度分と次年度分に分けて集計願います。
              </p>
            </div>
          </div>

          {/* ========== ②カーシェアリング ========== */}
          <div className="bg-white border border-gray-200 p-[20px] mb-[16px]">
            <h3 className="text-sm font-medium text-gray-700 mb-[12px]">
              ②レンタカー型カーシェアリングのみの情報
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className={thClass + " text-center"}>運輸支局名</th>
                    <th className={thClass + " text-right"}>デポジット数</th>
                    <th className={thClass + " text-right"} colSpan={3}>
                      貸渡車両数
                    </th>
                  </tr>
                  <tr>
                    <th className={thClass}></th>
                    <th className={thClass}></th>
                    <th className={thClass + " text-right"}>ワンウェイ方式</th>
                    <th className={thClass + " text-right"}>ワンウェイ方式以外</th>
                    <th className={thClass + " text-right"}>計</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-gray-300 px-[8px] py-[6px] text-sm text-center">
                      {BUREAUS.find((b) => b.value === bureau)?.label ?? bureau}
                    </td>
                    <td className={tdClass}>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={carShare.depots}
                        onChange={(e) => setCarShare((p) => ({ ...p, depots: e.target.value }))}
                        className={cellInputClass}
                        placeholder="-"
                      />
                    </td>
                    <td className={tdClass}>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={carShare.oneway}
                        onChange={(e) => setCarShare((p) => ({ ...p, oneway: e.target.value }))}
                        className={cellInputClass}
                        placeholder="-"
                      />
                    </td>
                    <td className={tdClass}>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={carShare.other}
                        onChange={(e) => setCarShare((p) => ({ ...p, other: e.target.value }))}
                        className={cellInputClass}
                        placeholder="-"
                      />
                    </td>
                    <td className={tdClass + " font-medium bg-gray-50"}>
                      {carShareTotal.toLocaleString()}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* 注意書き */}
            <div className="text-xs text-gray-500 mt-[12px]">
              <p>
                ※
                レンタカー型カーシェアリングのみの情報欄は、「レンタカー事業全体の情報」の内数として記載してください。レンタカー型カーシェアリングを実施していない場合は記載不要です。
              </p>
            </div>
          </div>
        </>
      ) : (
        /* ========== 様式2 事務所別車種別配置車両数一覧 ========== */
        <div className="bg-white border border-gray-200 p-[20px]">
          <h3 className="text-sm font-medium text-gray-700 mb-[4px]">事務所別車種別配置車両数一覧</h3>
          <p className="text-xs text-gray-400 mb-[12px]">
            {fiscalPeriod(fiscalYear).replace("から", "度 ")} — 3月31日現在
          </p>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className={thClass + " text-center"} rowSpan={2}>管轄運輸支局</th>
                  <th className={thClass + " text-center"} rowSpan={2}>事務所名</th>
                  <th className={thClass + " text-center"} rowSpan={2}>所在地</th>
                  <th className={thClass + " text-center"} colSpan={6}>保有車両数</th>
                </tr>
                <tr>
                  {VEHICLE_TYPES.map((t) => (
                    <th key={t} className={thClass + " text-right"}>{VEHICLE_TYPE_LABELS[t]}</th>
                  ))}
                  <th className={thClass + " text-right"}>合計</th>
                </tr>
              </thead>
              <tbody>
                {offices.map((row, idx) => {
                  const rowTotal = VEHICLE_TYPES.reduce((s, t) => s + (Number(row[t]) || 0), 0);
                  return (
                    <tr key={idx}>
                      <td className={tdClass + " text-center"}>
                        <input
                          type="text"
                          value={row.bureau}
                          onChange={(e) => updateOffice(idx, "bureau", e.target.value)}
                          className={cellInputClass + " text-center"}
                          placeholder="-"
                        />
                      </td>
                      <td className={tdClass + " text-left"}>
                        <input
                          type="text"
                          value={row.name}
                          onChange={(e) => updateOffice(idx, "name", e.target.value)}
                          className={cellInputClass + " text-left"}
                          placeholder="-"
                        />
                      </td>
                      <td className={tdClass + " text-left"}>
                        <input
                          type="text"
                          value={row.address}
                          onChange={(e) => updateOffice(idx, "address", e.target.value)}
                          className={cellInputClass + " text-left"}
                          placeholder="-"
                        />
                      </td>
                      {VEHICLE_TYPES.map((t) => (
                        <td key={t} className={tdClass}>
                          <input
                            type="text"
                            inputMode="numeric"
                            value={row[t]}
                            onChange={(e) => updateOffice(idx, t, e.target.value)}
                            className={cellInputClass}
                            placeholder="-"
                          />
                        </td>
                      ))}
                      <td className={tdClass + " font-medium bg-gray-50"}>
                        {rowTotal > 0 ? rowTotal.toLocaleString() : ""}
                      </td>
                    </tr>
                  );
                })}

                {/* 合計行 */}
                <tr className="bg-gray-50 font-medium">
                  <td className="border border-gray-300 px-[8px] py-[6px] text-sm text-center font-medium">
                    事務所数
                  </td>
                  <td className="border border-gray-300 px-[8px] py-[6px] text-sm text-center font-medium">
                    {offices.filter((r) => r.name.trim() !== "").length}
                  </td>
                  <td className="border border-gray-300 px-[8px] py-[6px] text-sm text-center font-medium">
                    合計数
                  </td>
                  {VEHICLE_TYPES.map((t) => (
                    <td key={t} className={tdClass + " font-medium"}>
                      {offices.reduce((s, r) => s + (Number(r[t]) || 0), 0) || ""}
                    </td>
                  ))}
                  <td className={tdClass + " font-medium"}>
                    {offices.reduce((s, r) =>
                      s + VEHICLE_TYPES.reduce((s2, t) => s2 + (Number(r[t]) || 0), 0), 0
                    ) || ""}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <p className="text-xs text-gray-500 mt-[12px]">
            ※ 事務所（使用の本拠）ごとに、3月31日時点の配置車両数を記入してください。
          </p>
        </div>
      )}
    </div>
  );
}

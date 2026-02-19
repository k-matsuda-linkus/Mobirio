"use client";

import { useState, useEffect, useCallback } from "react";
import { Loader2, Check } from "lucide-react";
import type { VehicleClass } from "@/types/database";
import type { ClassPricing } from "@/lib/booking/pricing";

/* ------------------------------------------------------------------ */
/*  定数                                                                */
/* ------------------------------------------------------------------ */

const VEHICLE_CLASSES: { value: VehicleClass; label: string }[] = [
  { value: "ev", label: "特定EV" },
  { value: "50", label: "50cc" },
  { value: "125", label: "125cc" },
  { value: "250", label: "250cc" },
  { value: "400", label: "400cc" },
  { value: "950", label: "950cc" },
  { value: "1100", label: "1100cc" },
  { value: "1500", label: "プレミアム" },
];

/** 2hプランが利用可能な車両クラス（125cc以下 + EV） */
const TWO_HOUR_AVAILABLE = new Set<VehicleClass>(["ev", "50", "125"]);

type RentalColumn = {
  key: keyof ClassPricing;
  label: string;
};

const RENTAL_COLUMNS: RentalColumn[] = [
  { key: "rate_2h", label: "2h" },
  { key: "rate_4h", label: "4h" },
  { key: "rate_1day", label: "日帰り" },
  { key: "rate_24h", label: "24h" },
  { key: "rate_32h", label: "1泊2日" },
  { key: "overtime_per_hour", label: "超過(時間)" },
  { key: "additional_24h", label: "追加24h" },
];

/* ------------------------------------------------------------------ */
/*  SaveButton                                                          */
/* ------------------------------------------------------------------ */

function SaveButton({
  saving,
  msg,
  onClick,
}: {
  saving: boolean;
  msg: string;
  onClick: () => void;
}) {
  return (
    <div className="flex items-center gap-[12px] pt-[4px]">
      <button
        onClick={onClick}
        disabled={saving}
        className="bg-black text-white px-[24px] py-[8px] text-sm font-sans hover:bg-gray-800 transition-colors disabled:opacity-50"
      >
        {saving ? "保存中..." : "保存"}
      </button>
      {msg && (
        <span
          className={`text-sm font-sans flex items-center gap-[4px] ${
            msg === "保存しました" ? "text-green-600" : "text-red-600"
          }`}
        >
          {msg === "保存しました" && <Check size={14} />}
          {msg}
        </span>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page Component                                                      */
/* ------------------------------------------------------------------ */

export default function PricingPage() {
  const [pricing, setPricing] = useState<Record<VehicleClass, ClassPricing> | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const fetchPricing = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/pricing");
      if (res.ok) {
        const json = await res.json();
        setPricing(json.data);
      }
    } catch {
      /* フォールバック */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPricing();
  }, [fetchPricing]);

  const handleChange = (
    vc: VehicleClass,
    key: keyof ClassPricing,
    value: string,
  ) => {
    if (!pricing) return;
    setPricing({
      ...pricing,
      [vc]: {
        ...pricing[vc],
        [key]: value === "" ? 0 : Number(value),
      },
    });
  };

  const savePricing = async () => {
    if (!pricing) return;
    setSaving(true);
    setMsg("");
    try {
      const res = await fetch("/api/admin/pricing", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pricing),
      });
      const json = await res.json();
      setMsg(res.ok ? "保存しました" : json.error || "保存に失敗しました");
      if (res.ok) setTimeout(() => setMsg(""), 3000);
    } catch {
      setMsg("通信エラーが発生しました");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div>
        <h1 className="font-serif text-2xl font-light mb-[30px]">料金表設定</h1>
        <div className="flex items-center gap-[8px] text-sm text-gray-400">
          <Loader2 size={16} className="animate-spin" /> 読み込み中...
        </div>
      </div>
    );
  }

  if (!pricing) {
    return (
      <div>
        <h1 className="font-serif text-2xl font-light mb-[30px]">料金表設定</h1>
        <p className="text-sm text-red-600">料金データの取得に失敗しました。</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-serif text-2xl font-light mb-[30px]">料金表設定</h1>

      <div className="space-y-[32px]">
        {/* ============================================================ */}
        {/* レンタル基本料金 */}
        {/* ============================================================ */}
        <section className="bg-white border border-gray-200 p-[24px]">
          <h2 className="font-serif text-lg font-light mb-[4px]">
            レンタル基本料金
          </h2>
          <p className="text-xs font-sans text-gray-400 mb-[20px]">
            車両クラス別の料金設定（税込）。2hプランは125cc以下・EVのみ対象
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-sm font-sans border-collapse min-w-[800px]">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-[8px] px-[8px] text-xs font-medium text-gray-500 w-[120px]">
                    車両クラス
                  </th>
                  {RENTAL_COLUMNS.map((col) => (
                    <th
                      key={col.key}
                      className="text-center py-[8px] px-[4px] text-xs font-medium text-gray-500"
                    >
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {VEHICLE_CLASSES.map((vc) => (
                  <tr key={vc.value} className="border-b border-gray-100">
                    <td className="py-[6px] px-[8px] text-sm font-medium text-gray-700">
                      {vc.label}
                    </td>
                    {RENTAL_COLUMNS.map((col) => {
                      const isDisabled =
                        col.key === "rate_2h" && !TWO_HOUR_AVAILABLE.has(vc.value);
                      const cellValue = pricing[vc.value][col.key];

                      return (
                        <td key={col.key} className="py-[6px] px-[4px]">
                          {isDisabled ? (
                            <div className="flex items-center justify-center">
                              <span className="block w-full max-w-[100px] bg-gray-100 border border-gray-200 px-[8px] py-[6px] text-center text-xs text-gray-400">
                                対象外
                              </span>
                            </div>
                          ) : (
                            <div className="flex items-center justify-center">
                              <input
                                type="number"
                                min="0"
                                value={cellValue ?? ""}
                                onChange={(e) =>
                                  handleChange(vc.value, col.key, e.target.value)
                                }
                                className="w-full max-w-[100px] border border-gray-300 px-[8px] py-[6px] text-sm font-sans text-right focus:outline-none focus:border-accent"
                              />
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* ============================================================ */}
        {/* CDW（車両免責補償） */}
        {/* ============================================================ */}
        <section className="bg-white border border-gray-200 p-[24px]">
          <h2 className="font-serif text-lg font-light mb-[4px]">
            CDW（車両免責補償）
          </h2>
          <p className="text-xs font-sans text-gray-400 mb-[20px]">
            車両クラス別のCDW 1日あたり料金（税込）
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-sm font-sans border-collapse max-w-[400px]">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-[8px] px-[8px] text-xs font-medium text-gray-500 w-[120px]">
                    車両クラス
                  </th>
                  <th className="text-center py-[8px] px-[4px] text-xs font-medium text-gray-500">
                    CDW / 日
                  </th>
                </tr>
              </thead>
              <tbody>
                {VEHICLE_CLASSES.map((vc) => (
                  <tr key={vc.value} className="border-b border-gray-100">
                    <td className="py-[6px] px-[8px] text-sm font-medium text-gray-700">
                      {vc.label}
                    </td>
                    <td className="py-[6px] px-[4px]">
                      <div className="flex items-center justify-center">
                        <input
                          type="number"
                          min="0"
                          value={pricing[vc.value].cdw_per_day}
                          onChange={(e) =>
                            handleChange(vc.value, "cdw_per_day", e.target.value)
                          }
                          className="w-full max-w-[120px] border border-gray-300 px-[8px] py-[6px] text-sm font-sans text-right focus:outline-none focus:border-accent"
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* ============================================================ */}
        {/* 保存ボタン */}
        {/* ============================================================ */}
        <SaveButton saving={saving} msg={msg} onClick={savePricing} />
      </div>
    </div>
  );
}

"use client";

import { useState, useMemo } from "react";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { mockReservations } from "@/lib/mock/reservations";
import { mockBikes } from "@/lib/mock/bikes";
import {
  calculateRoyalty,
  DEFAULT_ROYALTY_SETTINGS,
  type RoyaltyInput,
  type RoyaltyResult,
  type RefundType,
} from "@/lib/booking/royalty";

/* ------------------------------------------------------------------ */
/*  型                                                                  */
/* ------------------------------------------------------------------ */

interface RevenueRow {
  id: string;
  bikeName: string;
  vendorName: string;
  plan: "bike" | "moped";
  paymentLabel: string;
  isEC: boolean;
  bikeSubtotal: number;
  totalAmount: number;
  refund: RefundType;
  status: string;
  result: RoyaltyResult;
}

interface VendorSummary {
  vendorName: string;
  ecCount: number;
  onsiteCount: number;
  totalRoyalty: number;
  totalEcFee: number;
  totalFee: number;
  vendorPayment: number;
}

/* ------------------------------------------------------------------ */
/*  ヘルパー                                                            */
/* ------------------------------------------------------------------ */

/** バイクのvehicle_classからプラン判定 */
function getPlan(bikeId: string): "bike" | "moped" {
  const bike = mockBikes.find((b) => b.id === bikeId);
  if (!bike) return "bike";
  return bike.vehicle_class === "ev" || bike.vehicle_class === "50"
    ? "moped"
    : "bike";
}

/** ステータスから返金種別を判定 */
function getRefundType(
  status: string,
  settlement: string
): RefundType {
  if (status === "cancelled" && settlement === "refunded") return "full";
  if (status === "no_show") return "same_day_50";
  return "none";
}

/** 決済手段の表示 */
function paymentLabel(types: string[]): string {
  const labels: Record<string, string> = {
    ec_credit: "EC決済",
    onsite_cash: "現地現金",
    onsite_credit: "現地クレカ",
  };
  return types.map((t) => labels[t] || t).join(" + ");
}

/** EC決済を含むかどうか */
function hasEC(types: string[]): boolean {
  return types.includes("ec_credit");
}

/** 金額フォーマット */
function yen(n: number): string {
  const sign = n < 0 ? "-" : "";
  return `${sign}¥${Math.abs(Math.round(n)).toLocaleString()}`;
}

/* ------------------------------------------------------------------ */
/*  メインコンポーネント                                                  */
/* ------------------------------------------------------------------ */

export default function RevenuePage() {
  const [tab, setTab] = useState<"detail" | "vendor" | "split">("detail");

  // 全予約に計算ロジックを適用
  const rows: RevenueRow[] = useMemo(() => {
    return mockReservations.map((r) => {
      const plan = getPlan(r.bike_id);
      const refund = getRefundType(r.status, r.payment_settlement);
      const isEC = hasEC(r.payment_types);

      const input: RoyaltyInput = {
        bikeSubtotal: r.base_amount,
        totalAmount: r.total_amount,
        paymentType: isEC ? "ec_credit" : "onsite_cash",
        plan,
        refund,
      };

      const result = calculateRoyalty(input, DEFAULT_ROYALTY_SETTINGS);

      return {
        id: r.id,
        bikeName: r.bikeName,
        vendorName: r.vendorName,
        plan,
        paymentLabel: paymentLabel(r.payment_types),
        isEC,
        bikeSubtotal: r.base_amount,
        totalAmount: r.total_amount,
        refund,
        status: r.status,
        result,
      };
    });
  }, []);

  // ベンダー別集計
  const vendorSummaries: VendorSummary[] = useMemo(() => {
    const map = new Map<string, VendorSummary>();
    for (const row of rows) {
      let s = map.get(row.vendorName);
      if (!s) {
        s = {
          vendorName: row.vendorName,
          ecCount: 0,
          onsiteCount: 0,
          totalRoyalty: 0,
          totalEcFee: 0,
          totalFee: 0,
          vendorPayment: 0,
        };
        map.set(row.vendorName, s);
      }
      if (row.isEC) s.ecCount++;
      else s.onsiteCount++;
      s.totalRoyalty += row.result.royaltyAmount;
      s.totalEcFee += row.result.ecFee;
      s.totalFee += row.result.totalFee;
      s.vendorPayment += row.result.vendorPayment;
    }
    return Array.from(map.values());
  }, [rows]);

  // 全体集計
  const totals = useMemo(() => {
    let royalty = 0;
    let ecFee = 0;
    let fee = 0;
    let vendor = 0;
    let splitL = 0;
    let splitS = 0;
    let splitA = 0;
    for (const r of rows) {
      royalty += r.result.royaltyAmount;
      ecFee += r.result.ecFee;
      fee += r.result.totalFee;
      vendor += r.result.vendorPayment;
      splitL += r.result.splitLinkus;
      splitS += r.result.splitSystemDev;
      splitA += r.result.splitAdditionalOne;
    }
    return { royalty, ecFee, fee, vendor, splitL, splitS, splitA };
  }, [rows]);

  // タブスタイル
  const tabCls = (t: string) =>
    `px-[16px] py-[8px] text-sm font-sans cursor-pointer transition-colors ${
      tab === t
        ? "border-b-2 border-accent text-accent font-medium"
        : "text-gray-500 hover:text-gray-800"
    }`;

  return (
    <div>
      <h1 className="font-serif text-2xl font-light mb-[8px]">売上計算</h1>
      <p className="text-xs font-sans text-gray-400 mb-[24px]">
        モック予約データに計算ロジックを適用したシミュレーション
      </p>

      {/* ── KPIカード ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-[16px] mb-[24px]">
        <KpiCard label="ロイヤリティ合計" value={yen(totals.royalty)} sub="Mobirio手数料分" />
        <KpiCard label="EC手数料合計" value={yen(totals.ecFee)} sub="Square手数料分" />
        <KpiCard label="手数料合計" value={yen(totals.fee)} sub="ROUND(ロイヤリティ+EC)" />
        <KpiCard
          label="ベンダー支払 純計"
          value={yen(totals.vendor)}
          sub={totals.vendor >= 0 ? "リンクス → ベンダー" : "ベンダー → リンクス"}
          accent={totals.vendor >= 0 ? "green" : "red"}
        />
      </div>

      {/* ── タブ ── */}
      <div className="flex gap-[4px] border-b border-gray-200 mb-[20px]">
        <button className={tabCls("detail")} onClick={() => setTab("detail")}>
          予約別明細
        </button>
        <button className={tabCls("vendor")} onClick={() => setTab("vendor")}>
          ベンダー別集計
        </button>
        <button className={tabCls("split")} onClick={() => setTab("split")}>
          運営3社 分配
        </button>
      </div>

      {/* ── 予約別明細 ── */}
      {tab === "detail" && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm font-sans">
            <thead>
              <tr className="border-b border-gray-200 text-left text-xs text-gray-500">
                <th className="py-[8px] px-[8px] font-medium">予約ID</th>
                <th className="py-[8px] px-[8px] font-medium">バイク</th>
                <th className="py-[8px] px-[8px] font-medium">ベンダー</th>
                <th className="py-[8px] px-[8px] font-medium">プラン</th>
                <th className="py-[8px] px-[8px] font-medium">決済</th>
                <th className="py-[8px] px-[8px] font-medium">返金</th>
                <th className="py-[8px] px-[8px] font-medium text-right">バイク本体</th>
                <th className="py-[8px] px-[8px] font-medium text-right">予約総額</th>
                <th className="py-[8px] px-[8px] font-medium text-right">ロイヤリティ</th>
                <th className="py-[8px] px-[8px] font-medium text-right">EC手数料</th>
                <th className="py-[8px] px-[8px] font-medium text-right">手数料計</th>
                <th className="py-[8px] px-[8px] font-medium text-right">ベンダー支払</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-[10px] px-[8px] font-mono text-xs text-gray-500">{row.id}</td>
                  <td className="py-[10px] px-[8px]">{row.bikeName}</td>
                  <td className="py-[10px] px-[8px] text-gray-600">{row.vendorName}</td>
                  <td className="py-[10px] px-[8px]">
                    <StatusBadge
                      status={row.plan === "bike" ? "バイク" : "原付"}
                      variant={row.plan === "bike" ? "info" : "neutral"}
                    />
                  </td>
                  <td className="py-[10px] px-[8px]">
                    <StatusBadge
                      status={row.paymentLabel}
                      variant={row.isEC ? "success" : "warning"}
                    />
                  </td>
                  <td className="py-[10px] px-[8px]">
                    <RefundBadge refund={row.refund} />
                  </td>
                  <td className="py-[10px] px-[8px] text-right">{yen(row.bikeSubtotal)}</td>
                  <td className="py-[10px] px-[8px] text-right">{yen(row.totalAmount)}</td>
                  <td className="py-[10px] px-[8px] text-right">{yen(row.result.royaltyAmount)}</td>
                  <td className="py-[10px] px-[8px] text-right">{yen(row.result.ecFee)}</td>
                  <td className="py-[10px] px-[8px] text-right font-medium">{yen(row.result.totalFee)}</td>
                  <td className={`py-[10px] px-[8px] text-right font-medium ${row.result.vendorPayment >= 0 ? "text-green-700" : "text-red-600"}`}>
                    {yen(row.result.vendorPayment)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-gray-300 font-medium">
                <td colSpan={6} className="py-[10px] px-[8px] text-right text-gray-500">合計</td>
                <td className="py-[10px] px-[8px] text-right">
                  {yen(rows.reduce((s, r) => s + r.bikeSubtotal, 0))}
                </td>
                <td className="py-[10px] px-[8px] text-right">
                  {yen(rows.reduce((s, r) => s + r.totalAmount, 0))}
                </td>
                <td className="py-[10px] px-[8px] text-right">{yen(totals.royalty)}</td>
                <td className="py-[10px] px-[8px] text-right">{yen(totals.ecFee)}</td>
                <td className="py-[10px] px-[8px] text-right">{yen(totals.fee)}</td>
                <td className={`py-[10px] px-[8px] text-right ${totals.vendor >= 0 ? "text-green-700" : "text-red-600"}`}>
                  {yen(totals.vendor)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {/* ── ベンダー別集計 ── */}
      {tab === "vendor" && (
        <div className="space-y-[16px]">
          {vendorSummaries.map((v) => (
            <div key={v.vendorName} className="bg-white border border-gray-200 p-[20px]">
              <div className="flex items-center justify-between mb-[16px]">
                <h3 className="font-sans text-base font-medium">{v.vendorName}</h3>
                <span
                  className={`text-lg font-sans font-bold ${
                    v.vendorPayment >= 0 ? "text-green-700" : "text-red-600"
                  }`}
                >
                  {v.vendorPayment >= 0 ? "支払い " : "請求 "}
                  {yen(v.vendorPayment)}
                </span>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-5 gap-[12px] text-sm font-sans">
                <div>
                  <p className="text-xs text-gray-500">EC決済件数</p>
                  <p className="font-medium">{v.ecCount}件</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">現地決済件数</p>
                  <p className="font-medium">{v.onsiteCount}件</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">ロイヤリティ</p>
                  <p className="font-medium">{yen(v.totalRoyalty)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">EC手数料</p>
                  <p className="font-medium">{yen(v.totalEcFee)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">手数料合計</p>
                  <p className="font-medium">{yen(v.totalFee)}</p>
                </div>
              </div>

              {/* 支払いフロー説明 */}
              <div className="mt-[12px] pt-[12px] border-t border-gray-100">
                {v.vendorPayment >= 0 ? (
                  <p className="text-xs text-green-700">
                    EC入金からロイヤリティ・EC手数料を差引いた {yen(v.vendorPayment)} をベンダーへ支払い
                  </p>
                ) : (
                  <p className="text-xs text-red-600">
                    現地集金のロイヤリティ {yen(Math.abs(v.vendorPayment))} をベンダーへ請求
                  </p>
                )}
              </div>
            </div>
          ))}

          {/* 全ベンダー合計 */}
          <div className="bg-gray-900 text-white p-[20px]">
            <div className="flex items-center justify-between">
              <h3 className="font-sans text-base font-medium">全ベンダー 月次合計</h3>
              <span className="text-lg font-bold">
                {totals.vendor >= 0 ? "純支払い " : "純請求 "}
                {yen(totals.vendor)}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-[12px] mt-[12px] text-sm">
              <div>
                <p className="text-gray-400 text-xs">ロイヤリティ合計</p>
                <p className="font-medium">{yen(totals.royalty)}</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs">EC手数料合計</p>
                <p className="font-medium">{yen(totals.ecFee)}</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs">手数料合計</p>
                <p className="font-medium">{yen(totals.fee)}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── 運営3社 分配 ── */}
      {tab === "split" && (
        <div className="space-y-[16px]">
          <p className="text-xs font-sans text-gray-400">
            ロイヤリティ額 {yen(totals.royalty)} を3社で分配
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-[16px]">
            <SplitCard
              name="リンクス"
              percent={DEFAULT_ROYALTY_SETTINGS.split_linkus}
              amount={totals.splitL}
              color="bg-blue-500"
            />
            <SplitCard
              name="システム開発（MS）"
              percent={DEFAULT_ROYALTY_SETTINGS.split_system_dev}
              amount={totals.splitS}
              color="bg-emerald-500"
            />
            <SplitCard
              name="アディショナルワン"
              percent={DEFAULT_ROYALTY_SETTINGS.split_additional_one}
              amount={totals.splitA}
              color="bg-amber-500"
            />
          </div>

          {/* 分配バー */}
          <div className="bg-white border border-gray-200 p-[20px]">
            <h3 className="text-sm font-sans font-medium mb-[12px]">分配比率</h3>
            <div className="flex h-[32px] overflow-hidden">
              <div
                className="bg-blue-500 flex items-center justify-center text-white text-xs font-medium"
                style={{ width: `${DEFAULT_ROYALTY_SETTINGS.split_linkus}%` }}
              >
                {DEFAULT_ROYALTY_SETTINGS.split_linkus}%
              </div>
              <div
                className="bg-emerald-500 flex items-center justify-center text-white text-xs font-medium"
                style={{ width: `${DEFAULT_ROYALTY_SETTINGS.split_system_dev}%` }}
              >
                {DEFAULT_ROYALTY_SETTINGS.split_system_dev}%
              </div>
              <div
                className="bg-amber-500 flex items-center justify-center text-white text-xs font-medium"
                style={{ width: `${DEFAULT_ROYALTY_SETTINGS.split_additional_one}%` }}
              >
                {DEFAULT_ROYALTY_SETTINGS.split_additional_one}%
              </div>
            </div>
            <div className="flex mt-[8px] text-xs font-sans text-gray-500">
              <div style={{ width: `${DEFAULT_ROYALTY_SETTINGS.split_linkus}%` }}>リンクス</div>
              <div style={{ width: `${DEFAULT_ROYALTY_SETTINGS.split_system_dev}%` }}>MS</div>
              <div style={{ width: `${DEFAULT_ROYALTY_SETTINGS.split_additional_one}%` }}>AO</div>
            </div>
          </div>

          {/* 予約別の分配内訳 */}
          <div className="bg-white border border-gray-200 p-[20px]">
            <h3 className="text-sm font-sans font-medium mb-[12px]">予約別 分配内訳</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm font-sans">
                <thead>
                  <tr className="border-b border-gray-200 text-left text-xs text-gray-500">
                    <th className="py-[8px] px-[8px] font-medium">予約ID</th>
                    <th className="py-[8px] px-[8px] font-medium">バイク</th>
                    <th className="py-[8px] px-[8px] font-medium text-right">ロイヤリティ</th>
                    <th className="py-[8px] px-[8px] font-medium text-right">リンクス</th>
                    <th className="py-[8px] px-[8px] font-medium text-right">MS</th>
                    <th className="py-[8px] px-[8px] font-medium text-right">AO</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-[8px] px-[8px] font-mono text-xs text-gray-500">{row.id}</td>
                      <td className="py-[8px] px-[8px]">{row.bikeName}</td>
                      <td className="py-[8px] px-[8px] text-right">{yen(row.result.royaltyAmount)}</td>
                      <td className="py-[8px] px-[8px] text-right text-blue-700">{yen(row.result.splitLinkus)}</td>
                      <td className="py-[8px] px-[8px] text-right text-emerald-700">{yen(row.result.splitSystemDev)}</td>
                      <td className="py-[8px] px-[8px] text-right text-amber-700">{yen(row.result.splitAdditionalOne)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-gray-300 font-medium">
                    <td colSpan={2} className="py-[8px] px-[8px] text-right text-gray-500">合計</td>
                    <td className="py-[8px] px-[8px] text-right">{yen(totals.royalty)}</td>
                    <td className="py-[8px] px-[8px] text-right text-blue-700">{yen(totals.splitL)}</td>
                    <td className="py-[8px] px-[8px] text-right text-emerald-700">{yen(totals.splitS)}</td>
                    <td className="py-[8px] px-[8px] text-right text-amber-700">{yen(totals.splitA)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── 計算式リファレンス ── */}
      <div className="mt-[32px] bg-gray-50 border border-gray-200 p-[20px]">
        <h3 className="text-sm font-sans font-medium mb-[8px]">適用中の計算式</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-[16px] text-xs font-sans text-gray-600">
          <div className="space-y-[4px]">
            <p><span className="font-medium text-gray-800">ロイヤリティ（EC）:</span> バイク本体 × ({DEFAULT_ROYALTY_SETTINGS.royalty_bike_percent}% − {DEFAULT_ROYALTY_SETTINGS.ec_payment_fee_percent}%) = バイク本体 × {(DEFAULT_ROYALTY_SETTINGS.royalty_bike_percent - DEFAULT_ROYALTY_SETTINGS.ec_payment_fee_percent).toFixed(1)}%</p>
            <p><span className="font-medium text-gray-800">ロイヤリティ（現地）:</span> バイク本体 × {DEFAULT_ROYALTY_SETTINGS.royalty_bike_percent}%</p>
            <p><span className="font-medium text-gray-800">EC手数料:</span> 予約総額 × {DEFAULT_ROYALTY_SETTINGS.ec_payment_fee_percent}%</p>
          </div>
          <div className="space-y-[4px]">
            <p><span className="font-medium text-gray-800">EC支払い:</span> Square入金額 − 手数料合計 → ベンダーへ</p>
            <p><span className="font-medium text-gray-800">現地支払い:</span> −ロイヤリティ → ベンダーへ請求</p>
            <p><span className="font-medium text-gray-800">分配:</span> リンクス{DEFAULT_ROYALTY_SETTINGS.split_linkus}% / MS{DEFAULT_ROYALTY_SETTINGS.split_system_dev}% / AO{DEFAULT_ROYALTY_SETTINGS.split_additional_one}%</p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  サブコンポーネント                                                    */
/* ------------------------------------------------------------------ */

function KpiCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub: string;
  accent?: "green" | "red";
}) {
  const valColor =
    accent === "green"
      ? "text-green-700"
      : accent === "red"
      ? "text-red-600"
      : "text-gray-900";
  return (
    <div className="bg-white border border-gray-200 p-[16px]">
      <p className="text-xs font-sans text-gray-500 mb-[4px]">{label}</p>
      <p className={`text-xl font-sans font-bold ${valColor}`}>{value}</p>
      <p className="text-xs font-sans text-gray-400 mt-[2px]">{sub}</p>
    </div>
  );
}

function RefundBadge({ refund }: { refund: RefundType }) {
  if (refund === "full")
    return <StatusBadge status="全額返金" variant="danger" />;
  if (refund === "same_day_50")
    return <StatusBadge status="当日50%" variant="warning" />;
  return <StatusBadge status="なし" variant="neutral" />;
}

function SplitCard({
  name,
  percent,
  amount,
  color,
}: {
  name: string;
  percent: number;
  amount: number;
  color: string;
}) {
  return (
    <div className="bg-white border border-gray-200 p-[20px]">
      <div className="flex items-center gap-[8px] mb-[8px]">
        <span className={`w-[12px] h-[12px] ${color}`} />
        <p className="text-sm font-sans font-medium">{name}</p>
      </div>
      <p className="text-2xl font-sans font-bold text-gray-900">{yen(amount)}</p>
      <p className="text-xs font-sans text-gray-400 mt-[2px]">{percent}%</p>
    </div>
  );
}

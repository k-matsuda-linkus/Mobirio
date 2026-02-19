// ============================================================
// Mobirio ロイヤリティ計算モジュール
// ============================================================
//
// ■ ビジネスフロー
//   EC決済:  顧客 → Square(リンクス) → ロイヤリティ+EC手数料を差引 → ベンダーへ支払い
//   現地決済: 顧客 → ベンダー → ロイヤリティをリンクスへ支払い
//
// ■ 月次精算
//   全予約のベンダー支払額を合算
//   プラス → リンクスからベンダーへ支払い
//   マイナス → ベンダーからリンクスへ請求
// ============================================================

import type { PaymentType } from "@/types/database";

// ---------------------------------------------------------------------------
// 設定型
// ---------------------------------------------------------------------------

export interface RoyaltySettings {
  /** バイクレンタルプラン ロイヤリティ率 (%) — デフォルト 12 */
  royalty_bike_percent: number;
  /** 特定小型原付プラン ロイヤリティ率 (%) — デフォルト 11 */
  royalty_moped_percent: number;
  /** EC決済手数料率 (%) — デフォルト 3.6 */
  ec_payment_fee_percent: number;
  /** リンクス取り分 (%) — デフォルト 50 */
  split_linkus: number;
  /** システム開発取り分 (%) — デフォルト 35 */
  split_system_dev: number;
  /** アディショナルワン取り分 (%) — デフォルト 15 */
  split_additional_one: number;
}

export const DEFAULT_ROYALTY_SETTINGS: RoyaltySettings = {
  royalty_bike_percent: 12,
  royalty_moped_percent: 11,
  ec_payment_fee_percent: 3.6,
  split_linkus: 50,
  split_system_dev: 35,
  split_additional_one: 15,
};

// ---------------------------------------------------------------------------
// 返金種別
// ---------------------------------------------------------------------------

export type RefundType = "none" | "full" | "same_day_50";

// ---------------------------------------------------------------------------
// 計算入力（予約1件単位）
// ---------------------------------------------------------------------------

export interface RoyaltyInput {
  /** バイク本体レンタル料金（ロイヤリティ対象） */
  bikeSubtotal: number;
  /** 予約総額 = バイク本体 + オプション + 免責補償等（EC手数料対象） */
  totalAmount: number;
  /** 決済方法 */
  paymentType: PaymentType;
  /** プランの種類: "bike" = バイクレンタル, "moped" = 特定小型原付 */
  plan: "bike" | "moped";
  /** 返金処理 */
  refund: RefundType;
}

// ---------------------------------------------------------------------------
// 計算結果
// ---------------------------------------------------------------------------

export interface RoyaltyResult {
  /** ロイヤリティ額（Mobirio手数料分） */
  royaltyAmount: number;
  /** EC手数料（Square手数料分、EC決済時のみ。予約総額に対して計算） */
  ecFee: number;
  /** 手数料合計（ロイヤリティ + EC手数料、四捨五入） */
  totalFee: number;
  /** 返金額 */
  refundAmount: number;
  /** ベンダー支払額（正=リンクス→ベンダー支払い、負=ベンダー→リンクス請求） */
  vendorPayment: number;
  /** リンクス取り分 */
  splitLinkus: number;
  /** システム開発取り分 */
  splitSystemDev: number;
  /** アディショナルワン取り分 */
  splitAdditionalOne: number;
}

// ---------------------------------------------------------------------------
// メイン計算関数
// ---------------------------------------------------------------------------

/**
 * 予約1件に対するロイヤリティ・手数料・ベンダー支払額を計算
 *
 * ■ ロイヤリティ（バイク本体のみに適用）
 *   EC決済:  バイク本体 × (ロイヤリティ率 − EC手数料率)
 *            → 設定率にはEC手数料が含まれるため差し引く
 *   現地:    バイク本体 × ロイヤリティ率
 *
 * ■ EC手数料（予約総額に適用 — オプション・補償含む）
 *   EC決済:  予約総額 × EC手数料率
 *   現地:    0
 *
 * ■ ベンダー支払額
 *   EC決済:  予約総額 − ロイヤリティ − EC手数料  (リンクス→ベンダー)
 *   現地:    −ロイヤリティ                       (ベンダー→リンクス)
 *
 * ■ 返金乗数: なし=×1, 全額=×0, 当日50%=×0.5
 */
export function calculateRoyalty(
  input: RoyaltyInput,
  settings: RoyaltySettings = DEFAULT_ROYALTY_SETTINGS
): RoyaltyResult {
  const { bikeSubtotal, totalAmount, paymentType, plan, refund } = input;

  // 返金乗数
  const refundMultiplier =
    refund === "full" ? 0 : refund === "same_day_50" ? 0.5 : 1;

  // ロイヤリティ率（%）
  const baseRate =
    plan === "bike"
      ? settings.royalty_bike_percent
      : settings.royalty_moped_percent;

  const isEC = paymentType === "ec_credit";

  // ── ロイヤリティ額（バイク本体に対して） ──
  // EC決済: 設定率にはEC手数料が含まれるため差し引く
  // 現地:   設定率そのまま
  const effectiveRate = isEC
    ? (baseRate - settings.ec_payment_fee_percent) / 100
    : baseRate / 100;

  const royaltyAmount = bikeSubtotal * effectiveRate * refundMultiplier;

  // ── EC手数料（予約総額に対して — オプション・補償含む） ──
  // EC決済時のみ。現地支払い・全額返金 → 0
  let ecFee = 0;
  if (isEC && refund !== "full") {
    const ecRate = settings.ec_payment_fee_percent / 100;
    ecFee = totalAmount * ecRate * (refund === "same_day_50" ? 0.5 : 1);
  }

  // ── 手数料合計 ──
  const totalFee = Math.round(royaltyAmount + ecFee);

  // ── 返金額 ──
  let refundAmount = 0;
  if (refund === "full") refundAmount = totalAmount;
  else if (refund === "same_day_50") refundAmount = totalAmount * 0.5;

  // ── ベンダー支払額 ──
  // EC決済:  Square入金額(= 総額 × 返金乗数) からロイヤリティ+EC手数料を差引
  //          → 正 = リンクスからベンダーへ支払い
  // 現地決済: ベンダーが集金済み → ロイヤリティ分をリンクスへ支払い
  //          → 負 = ベンダーからリンクスへ請求
  let vendorPayment = 0;
  if (refund === "full") {
    vendorPayment = 0;
  } else if (isEC) {
    vendorPayment = totalAmount * refundMultiplier - totalFee;
  } else {
    vendorPayment = -totalFee;
  }

  // ── 運営3社の取り分（ロイヤリティ額に対して） ──
  const splitLinkus = royaltyAmount * (settings.split_linkus / 100);
  const splitSystemDev = royaltyAmount * (settings.split_system_dev / 100);
  const splitAdditionalOne =
    royaltyAmount * (settings.split_additional_one / 100);

  return {
    royaltyAmount,
    ecFee,
    totalFee,
    refundAmount,
    vendorPayment,
    splitLinkus,
    splitSystemDev,
    splitAdditionalOne,
  };
}

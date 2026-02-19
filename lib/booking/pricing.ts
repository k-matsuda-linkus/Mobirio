// ============================================================
// Mobirio Pricing Module — PDF料金表準拠
// ============================================================

import type { VehicleClass } from "@/types/database";

export type { VehicleClass };

export type RentalDuration = "2h" | "4h" | "1day" | "24h" | "32h";

export interface ClassPricing {
  rate_2h: number | null; // null = プラン対象外（126cc以上）
  rate_4h: number;
  rate_1day: number;
  rate_24h: number;
  rate_32h: number;
  overtime_per_hour: number;
  additional_24h: number;
  cdw_per_day: number;
}

/** PDF料金表に完全準拠したデフォルト料金テーブル（税込） */
export const DEFAULT_PRICING: Record<VehicleClass, ClassPricing> = {
  ev: {
    rate_2h: 1500,
    rate_4h: 2500,
    rate_1day: 3000,
    rate_24h: 3500,
    rate_32h: 4200,
    overtime_per_hour: 850,
    additional_24h: 2500,
    cdw_per_day: 1000,
  },
  "50": {
    rate_2h: 2000,
    rate_4h: 3000,
    rate_1day: 3500,
    rate_24h: 4000,
    rate_32h: 5050,
    overtime_per_hour: 1000,
    additional_24h: 2800,
    cdw_per_day: 1000,
  },
  "125": {
    rate_2h: 3000,
    rate_4h: 4200,
    rate_1day: 5000,
    rate_24h: 6000,
    rate_32h: 8000,
    overtime_per_hour: 1200,
    additional_24h: 4300,
    cdw_per_day: 1500,
  },
  "250": {
    rate_2h: null,
    rate_4h: 8300,
    rate_1day: 9300,
    rate_24h: 11200,
    rate_32h: 16500,
    overtime_per_hour: 1600,
    additional_24h: 8500,
    cdw_per_day: 2000,
  },
  "400": {
    rate_2h: null,
    rate_4h: 9800,
    rate_1day: 10900,
    rate_24h: 13200,
    rate_32h: 20600,
    overtime_per_hour: 1800,
    additional_24h: 10000,
    cdw_per_day: 2000,
  },
  "950": {
    rate_2h: null,
    rate_4h: 12800,
    rate_1day: 14200,
    rate_24h: 17200,
    rate_32h: 24600,
    overtime_per_hour: 2150,
    additional_24h: 12000,
    cdw_per_day: 2500,
  },
  "1100": {
    rate_2h: null,
    rate_4h: 14000,
    rate_1day: 15600,
    rate_24h: 18900,
    rate_32h: 26900,
    overtime_per_hour: 2300,
    additional_24h: 13500,
    cdw_per_day: 3000,
  },
  "1500": {
    rate_2h: null,
    rate_4h: 17500,
    rate_1day: 19500,
    rate_24h: 23700,
    rate_32h: 31700,
    overtime_per_hour: 3000,
    additional_24h: 17000,
    cdw_per_day: 3000,
  },
};

/** バイクの個別料金フィールドからレンタル時間に応じた最適料金を計算 */
export interface BikeRates {
  hourly_rate_2h: number;
  hourly_rate_4h: number;
  daily_rate_1day: number;
  daily_rate_24h: number;
  daily_rate_32h: number;
  overtime_rate_per_hour: number;
  additional_24h_rate: number;
}

export interface RentalPriceResult {
  baseAmount: number;
  rentalDuration: RentalDuration;
  days: number;
  overtimeHours: number;
}

/** バイクの個別料金からレンタル時間に応じた最適料金を計算 */
export function calculateRentalPrice(bike: BikeRates, hours: number): RentalPriceResult {
  if (hours <= 0) {
    return { baseAmount: 0, rentalDuration: "2h", days: 0, overtimeHours: 0 };
  }

  // 2時間以内
  if (hours <= 2) {
    const rate = bike.hourly_rate_2h > 0 ? bike.hourly_rate_2h : bike.hourly_rate_4h;
    return { baseAmount: rate, rentalDuration: "2h", days: 0, overtimeHours: 0 };
  }

  // 4時間以内
  if (hours <= 4) {
    return { baseAmount: bike.hourly_rate_4h, rentalDuration: "4h", days: 0, overtimeHours: 0 };
  }

  // 日帰り（8時間以内）
  if (hours <= 8) {
    return { baseAmount: bike.daily_rate_1day, rentalDuration: "1day", days: 1, overtimeHours: 0 };
  }

  // 24時間以内
  if (hours <= 24) {
    return { baseAmount: bike.daily_rate_24h, rentalDuration: "24h", days: 1, overtimeHours: 0 };
  }

  // 32時間以内（1泊2日）
  if (hours <= 32) {
    return { baseAmount: bike.daily_rate_32h, rentalDuration: "32h", days: 2, overtimeHours: 0 };
  }

  // 32時間超 → 24h基本 + 追加24h × 追加日数 + 超過時間料金
  const fullDays = Math.floor(hours / 24);
  const remainderHours = hours % 24;
  const additionalDays = fullDays - 1; // 最初の24hはrate_24h
  const overtimeHours = Math.ceil(remainderHours);

  let baseAmount = bike.daily_rate_24h + bike.additional_24h_rate * additionalDays;
  if (overtimeHours > 0) {
    baseAmount += bike.overtime_rate_per_hour * overtimeHours;
  }

  return {
    baseAmount,
    rentalDuration: "24h",
    days: fullDays + (remainderHours > 0 ? 1 : 0),
    overtimeHours,
  };
}

/** 運営が設定した現在の料金テーブル（インメモリ管理） */
let currentPricing: Record<VehicleClass, ClassPricing> = structuredClone(DEFAULT_PRICING);

/** 現在の料金テーブルを取得 */
export function getPricing(): Record<VehicleClass, ClassPricing> {
  return currentPricing;
}

/** 料金テーブルを更新 */
export function updatePricing(data: Record<VehicleClass, ClassPricing>): void {
  currentPricing = structuredClone(data);
}

/** デフォルト料金テーブル取得（ベンダー未設定時用） */
export function getDefaultPricingForClass(vehicleClass: VehicleClass): ClassPricing {
  return currentPricing[vehicleClass] ?? currentPricing["125"];
}

/** クラス別CDW料金（1日あたり） */
export function getCDWPriceForClass(vehicleClass: VehicleClass): number {
  return currentPricing[vehicleClass]?.cdw_per_day ?? 1500;
}

/** 排気量からVehicleClassを判定 */
export function getVehicleClassFromDisplacement(displacement: number | null): VehicleClass {
  if (displacement === null || displacement === 0) return "ev";
  if (displacement <= 50) return "50";
  if (displacement <= 125) return "125";
  if (displacement <= 250) return "250";
  if (displacement <= 400) return "400";
  if (displacement <= 950) return "950";
  if (displacement <= 1100) return "1100";
  return "1500";
}

/** VehicleClassの表示名 */
export function getVehicleClassName(vehicleClass: VehicleClass): string {
  const names: Record<VehicleClass, string> = {
    ev: "特定EV（~0.6kw）",
    "50": "50cc（~50cc）",
    "125": "125cc（51~125cc）",
    "250": "250cc（126~250cc）",
    "400": "400cc（251~400cc）",
    "950": "950cc（401~950cc）",
    "1100": "1100cc（951cc~）",
    "1500": "プレミアム",
  };
  return names[vehicleClass] ?? vehicleClass;
}

/** 2hプランが利用可能かどうか */
export function isTwoHourPlanAvailable(vehicleClass: VehicleClass): boolean {
  return currentPricing[vehicleClass]?.rate_2h !== null;
}

// ---------------------------------------------------------------------------
// 任意保険料金
// ---------------------------------------------------------------------------

/** 二輪 or 原付の判定: ev/50 → 原付、それ以外 → 二輪 */
export type InsuranceCategory = "motorcycle" | "moped";

export function getInsuranceCategory(vehicleClass: VehicleClass): InsuranceCategory {
  return vehicleClass === "ev" || vehicleClass === "50" ? "moped" : "motorcycle";
}

/** デフォルト任意保険料金・月額（DB未接続時のフォールバック） */
export const DEFAULT_INSURANCE_RATES: Record<InsuranceCategory, number> = {
  motorcycle: 800,
  moped: 500,
};

/** 任意保険料金を取得（月額） */
export function getDefaultInsuranceRate(vehicleClass: VehicleClass): number {
  const category = getInsuranceCategory(vehicleClass);
  return DEFAULT_INSURANCE_RATES[category];
}

/** キャンセル料計算: 前日まで無料、当日は基本料金の50% */
export function calculateCancellationFee(baseAmount: number, startDatetime: string): number {
  const now = new Date();
  const start = new Date(startDatetime);

  // 開始日の0:00を取得（当日判定用）
  const startDay = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (today >= startDay) {
    // 当日キャンセル: 基本料金の50%
    return Math.ceil(baseAmount * 0.5);
  }

  // 前日まで: 無料
  return 0;
}

import type { Coupon } from "@/types/database";

export interface CouponValidationResult {
  valid: boolean;
  reason?: string;
  coupon?: Coupon;
}

export interface CouponDiscountResult {
  discountAmount: number;
  couponId: string;
  couponName: string;
}

/**
 * クーポンの有効性を検証する
 */
export function validateCoupon(
  coupon: Coupon | null,
  options: {
    baseAmount: number;
    bikeId?: string;
    userId?: string;
    userUsageCount?: number;
  }
): CouponValidationResult {
  if (!coupon) {
    return { valid: false, reason: "クーポンが見つかりません" };
  }

  if (!coupon.is_active) {
    return { valid: false, reason: "このクーポンは現在利用できません" };
  }

  const now = new Date();

  if (coupon.valid_from) {
    const from = new Date(coupon.valid_from);
    if (now < from) {
      return { valid: false, reason: "クーポンの利用期間前です" };
    }
  }

  if (coupon.valid_until) {
    const until = new Date(coupon.valid_until);
    if (now > until) {
      return { valid: false, reason: "クーポンの有効期限が切れています" };
    }
  }

  if (coupon.usage_limit !== null && coupon.usage_count >= coupon.usage_limit) {
    return { valid: false, reason: "クーポンの利用上限に達しています" };
  }

  if (
    coupon.per_user_limit > 0 &&
    options.userUsageCount !== undefined &&
    options.userUsageCount >= coupon.per_user_limit
  ) {
    return { valid: false, reason: "お一人様の利用上限に達しています" };
  }

  if (coupon.min_order_amount > 0 && options.baseAmount < coupon.min_order_amount) {
    return {
      valid: false,
      reason: `最低注文金額 ¥${coupon.min_order_amount.toLocaleString()} 以上でご利用いただけます`,
    };
  }

  if (
    coupon.target_bike_ids &&
    coupon.target_bike_ids.length > 0 &&
    options.bikeId &&
    !coupon.target_bike_ids.includes(options.bikeId)
  ) {
    return { valid: false, reason: "このクーポンは対象車両にのみ適用できます" };
  }

  return { valid: true, coupon };
}

/**
 * クーポンの割引額を計算する
 */
export function calculateCouponDiscount(
  coupon: Coupon,
  baseAmount: number
): number {
  if (coupon.discount_type === "fixed") {
    return Math.min(coupon.discount_value, baseAmount);
  }

  // percentage
  const rawDiscount = Math.floor(baseAmount * coupon.discount_value / 100);

  if (coupon.max_discount !== null && coupon.max_discount > 0) {
    return Math.min(rawDiscount, coupon.max_discount);
  }

  return Math.min(rawDiscount, baseAmount);
}

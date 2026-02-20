import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/requireAuth";
import { validateCoupon, calculateCouponDiscount } from "@/lib/booking/coupon";
import type { Coupon } from "@/types/database";

/**
 * モッククーポンDB検索
 */
function findMockCouponByCode(code: string, vendorId: string): Coupon | null {
  const mockCoupons: Record<string, Coupon> = {
    WELCOME10: {
      id: "cpn-001",
      vendor_id: vendorId,
      code: "WELCOME10",
      name: "初回10%OFFクーポン",
      description: "初回ご利用のお客様向けクーポン",
      discount_type: "percentage",
      discount_value: 10,
      max_discount: 2000,
      min_order_amount: 0,
      usage_limit: 100,
      usage_count: 42,
      per_user_limit: 1,
      valid_from: "2026-01-01T00:00:00Z",
      valid_until: "2026-12-31T23:59:59Z",
      is_active: true,
      target_bike_ids: [],
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-01T00:00:00Z",
    },
    SUMMER500: {
      id: "cpn-002",
      vendor_id: vendorId,
      code: "SUMMER500",
      name: "夏季500円OFFクーポン",
      description: "夏季限定の割引クーポン",
      discount_type: "fixed",
      discount_value: 500,
      max_discount: null,
      min_order_amount: 3000,
      usage_limit: 200,
      usage_count: 200,
      per_user_limit: 1,
      valid_from: "2026-06-01T00:00:00Z",
      valid_until: "2026-08-31T23:59:59Z",
      is_active: true,
      target_bike_ids: [],
      created_at: "2026-05-01T00:00:00Z",
      updated_at: "2026-05-01T00:00:00Z",
    },
  };

  return mockCoupons[code] ?? null;
}

/**
 * POST /api/coupons/validate
 * クーポンコードを検証し、割引額を計算する
 */
export async function POST(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  let body: {
    code?: string;
    vendorId?: string;
    bikeId?: string;
    baseAmount?: number;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON", message: "リクエストボディが不正です" },
      { status: 400 }
    );
  }

  if (!body.code) {
    return NextResponse.json(
      { valid: false, reason: "クーポンコードを入力してください" },
      { status: 400 }
    );
  }

  if (!body.vendorId) {
    return NextResponse.json(
      { valid: false, reason: "vendorId は必須です" },
      { status: 400 }
    );
  }

  if (body.baseAmount === undefined || body.baseAmount <= 0) {
    return NextResponse.json(
      { valid: false, reason: "baseAmount は0より大きい値を指定してください" },
      { status: 400 }
    );
  }

  // TODO: Replace with Supabase query once schema is applied
  const coupon = findMockCouponByCode(body.code, body.vendorId);

  // クーポンの有効性を検証
  const validationResult = validateCoupon(coupon, {
    baseAmount: body.baseAmount,
    bikeId: body.bikeId,
  });

  if (!validationResult.valid) {
    return NextResponse.json({
      valid: false,
      reason: validationResult.reason,
    });
  }

  // 割引額を計算
  const discountAmount = calculateCouponDiscount(coupon!, body.baseAmount);

  return NextResponse.json({
    valid: true,
    discountAmount,
    couponName: coupon!.name,
    couponId: coupon!.id,
  });
}

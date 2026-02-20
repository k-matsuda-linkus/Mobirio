import { NextRequest, NextResponse } from "next/server";
import { requireVendor } from "@/lib/auth/requireAuth";
import type { CouponDiscountType } from "@/types/database";

/**
 * モッククーポンデータを生成する（vendor_id を動的に設定）
 */
function getMockCoupons(vendorId: string) {
  return [
    {
      id: "cpn-001",
      vendor_id: vendorId,
      code: "WELCOME10",
      name: "初回10%OFFクーポン",
      description: "初回ご利用のお客様向けクーポン",
      discount_type: "percentage" as CouponDiscountType,
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
    {
      id: "cpn-002",
      vendor_id: vendorId,
      code: "SUMMER500",
      name: "夏季500円OFFクーポン",
      description: "夏季限定の割引クーポン",
      discount_type: "fixed" as CouponDiscountType,
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
    {
      id: "cpn-003",
      vendor_id: vendorId,
      code: "REPEAT1000",
      name: "リピーター1000円OFF",
      description: "リピーター向けクーポン",
      discount_type: "fixed" as CouponDiscountType,
      discount_value: 1000,
      max_discount: null,
      min_order_amount: 5000,
      usage_limit: null,
      usage_count: 15,
      per_user_limit: 1,
      valid_from: "2025-01-01T00:00:00Z",
      valid_until: "2025-12-31T23:59:59Z",
      is_active: false,
      target_bike_ids: [],
      created_at: "2025-01-01T00:00:00Z",
      updated_at: "2025-12-31T00:00:00Z",
    },
    {
      id: "cpn-004",
      vendor_id: vendorId,
      code: "WEEKEND15",
      name: "週末15%OFFクーポン",
      description: "週末限定の割引クーポン",
      discount_type: "percentage" as CouponDiscountType,
      discount_value: 15,
      max_discount: 3000,
      min_order_amount: 5000,
      usage_limit: 50,
      usage_count: 12,
      per_user_limit: 2,
      valid_from: "2026-01-01T00:00:00Z",
      valid_until: "2026-06-30T23:59:59Z",
      is_active: true,
      target_bike_ids: [],
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-01T00:00:00Z",
    },
    {
      id: "cpn-005",
      vendor_id: vendorId,
      code: "SPRING2000",
      name: "春季2000円OFFクーポン",
      description: "春季キャンペーン割引",
      discount_type: "fixed" as CouponDiscountType,
      discount_value: 2000,
      max_discount: null,
      min_order_amount: 10000,
      usage_limit: 30,
      usage_count: 5,
      per_user_limit: 1,
      valid_from: "2026-03-01T00:00:00Z",
      valid_until: "2026-05-31T23:59:59Z",
      is_active: true,
      target_bike_ids: [],
      created_at: "2026-02-15T00:00:00Z",
      updated_at: "2026-02-15T00:00:00Z",
    },
  ];
}

/**
 * GET /api/vendor/coupons/[id]
 * クーポン詳細を取得する
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireVendor(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const { vendor } = authResult;
  const { id } = await params;

  // TODO: Replace with Supabase query once schema is applied
  const mockCoupons = getMockCoupons(vendor.id);
  const coupon = mockCoupons.find((c) => c.id === id);

  if (!coupon) {
    return NextResponse.json(
      { error: "Not found", message: "クーポンが見つかりません" },
      { status: 404 }
    );
  }

  return NextResponse.json({ data: coupon, message: "OK" });
}

/**
 * PUT /api/vendor/coupons/[id]
 * クーポンを更新する（部分更新）
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireVendor(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const { vendor } = authResult;
  const { id } = await params;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON", message: "リクエストボディが不正です" },
      { status: 400 }
    );
  }

  // TODO: Replace with Supabase query once schema is applied
  const mockCoupons = getMockCoupons(vendor.id);
  const coupon = mockCoupons.find((c) => c.id === id);

  if (!coupon) {
    return NextResponse.json(
      { error: "Not found", message: "クーポンが見つかりません" },
      { status: 404 }
    );
  }

  // discount_type のバリデーション（指定がある場合）
  if (body.discount_type && !["fixed", "percentage"].includes(body.discount_type as string)) {
    return NextResponse.json(
      { error: "Bad request", message: "discount_type は 'fixed' または 'percentage' で指定してください" },
      { status: 400 }
    );
  }

  // discount_value のバリデーション（指定がある場合）
  if (body.discount_value !== undefined && (typeof body.discount_value !== "number" || body.discount_value <= 0)) {
    return NextResponse.json(
      { error: "Bad request", message: "discount_value は0より大きい値を指定してください" },
      { status: 400 }
    );
  }

  // モックレスポンス: 既存データとマージ
  const updated = {
    ...coupon,
    ...body,
    id: coupon.id,
    vendor_id: vendor.id,
    updated_at: new Date().toISOString(),
  };

  return NextResponse.json({ data: updated, message: "クーポンを更新しました" });
}

/**
 * DELETE /api/vendor/coupons/[id]
 * クーポンを削除する
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireVendor(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const { vendor } = authResult;
  const { id } = await params;

  // TODO: Replace with Supabase query once schema is applied
  const mockCoupons = getMockCoupons(vendor.id);
  const coupon = mockCoupons.find((c) => c.id === id);

  if (!coupon) {
    return NextResponse.json(
      { error: "Not found", message: "クーポンが見つかりません" },
      { status: 404 }
    );
  }

  return NextResponse.json({ message: "クーポンを削除しました" });
}

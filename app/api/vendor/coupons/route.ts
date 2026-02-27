import { NextRequest, NextResponse } from "next/server";
import { requireVendor } from "@/lib/auth/requireAuth";
import { isSandboxMode, sandboxLog } from "@/lib/sandbox";
import type { CouponDiscountType } from "@/types/database";

const mockCoupons = [
  {
    id: "cpn-001", vendor_id: "v-001", code: "WELCOME10", name: "初回10%OFFクーポン",
    description: "初回ご利用のお客様向けクーポン", discount_type: "percentage" as CouponDiscountType,
    discount_value: 10, max_discount: 2000, min_order_amount: 0, usage_limit: 100, usage_count: 42,
    per_user_limit: 1, valid_from: "2026-01-01T00:00:00Z", valid_until: "2026-12-31T23:59:59Z",
    is_active: true, target_bike_ids: [], created_at: "2026-01-01T00:00:00Z", updated_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "cpn-002", vendor_id: "v-001", code: "SUMMER500", name: "夏季500円OFFクーポン",
    description: "夏季限定の割引クーポン", discount_type: "fixed" as CouponDiscountType,
    discount_value: 500, max_discount: null, min_order_amount: 3000, usage_limit: 200, usage_count: 200,
    per_user_limit: 1, valid_from: "2026-06-01T00:00:00Z", valid_until: "2026-08-31T23:59:59Z",
    is_active: true, target_bike_ids: [], created_at: "2026-05-01T00:00:00Z", updated_at: "2026-05-01T00:00:00Z",
  },
  {
    id: "cpn-003", vendor_id: "v-001", code: "REPEAT1000", name: "リピーター1000円OFF",
    description: "リピーター向けクーポン", discount_type: "fixed" as CouponDiscountType,
    discount_value: 1000, max_discount: null, min_order_amount: 5000, usage_limit: null, usage_count: 15,
    per_user_limit: 1, valid_from: "2025-01-01T00:00:00Z", valid_until: "2025-12-31T23:59:59Z",
    is_active: false, target_bike_ids: [], created_at: "2025-01-01T00:00:00Z", updated_at: "2025-12-31T00:00:00Z",
  },
  {
    id: "cpn-004", vendor_id: "v-001", code: "WEEKEND15", name: "週末15%OFFクーポン",
    description: "週末限定の割引クーポン", discount_type: "percentage" as CouponDiscountType,
    discount_value: 15, max_discount: 3000, min_order_amount: 5000, usage_limit: 50, usage_count: 12,
    per_user_limit: 2, valid_from: "2026-01-01T00:00:00Z", valid_until: "2026-06-30T23:59:59Z",
    is_active: true, target_bike_ids: [], created_at: "2026-01-01T00:00:00Z", updated_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "cpn-005", vendor_id: "v-001", code: "SPRING2000", name: "春季2000円OFFクーポン",
    description: "春季キャンペーン割引", discount_type: "fixed" as CouponDiscountType,
    discount_value: 2000, max_discount: null, min_order_amount: 10000, usage_limit: 30, usage_count: 5,
    per_user_limit: 1, valid_from: "2026-03-01T00:00:00Z", valid_until: "2026-05-31T23:59:59Z",
    is_active: true, target_bike_ids: [], created_at: "2026-02-15T00:00:00Z", updated_at: "2026-02-15T00:00:00Z",
  },
];

export async function GET(request: NextRequest) {
  const authResult = await requireVendor(request);
  if (authResult instanceof NextResponse) return authResult;
  const { vendor, supabase } = authResult;

  const searchParams = request.nextUrl.searchParams;
  const limit = parseInt(searchParams.get("limit") || "50");
  const offset = parseInt(searchParams.get("offset") || "0");

  if (isSandboxMode()) {
    sandboxLog("GET /api/vendor/coupons", `vendor=${vendor.id}`);
    const filtered = mockCoupons.filter((c) => c.vendor_id === vendor.id);
    return NextResponse.json({
      data: filtered.slice(offset, offset + limit),
      pagination: { total: filtered.length, limit, offset },
      message: "OK",
    });
  }

  const { data, error, count } = await supabase
    .from("coupons")
    .select("*", { count: "exact" })
    .eq("vendor_id", vendor.id)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    return NextResponse.json(
      { error: "Database error", message: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    data,
    pagination: { total: count ?? 0, limit, offset },
    message: "OK",
  });
}

export async function POST(request: NextRequest) {
  const authResult = await requireVendor(request);
  if (authResult instanceof NextResponse) return authResult;
  const { vendor, supabase } = authResult;

  let body: {
    code?: string; name?: string; description?: string;
    discount_type?: CouponDiscountType; discount_value?: number;
    max_discount?: number | null; min_order_amount?: number;
    usage_limit?: number | null; per_user_limit?: number;
    valid_from?: string | null; valid_until?: string | null;
    target_bike_ids?: string[];
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
    return NextResponse.json({ error: "Bad request", message: "code は必須です" }, { status: 400 });
  }
  if (!body.name) {
    return NextResponse.json({ error: "Bad request", message: "name は必須です" }, { status: 400 });
  }
  if (!body.discount_type || !["fixed", "percentage"].includes(body.discount_type)) {
    return NextResponse.json(
      { error: "Bad request", message: "discount_type は 'fixed' または 'percentage' で指定してください" },
      { status: 400 }
    );
  }
  if (!body.discount_value || body.discount_value <= 0) {
    return NextResponse.json(
      { error: "Bad request", message: "discount_value は0より大きい値を指定してください" },
      { status: 400 }
    );
  }

  const now = new Date().toISOString();
  const insertData = {
    vendor_id: vendor.id,
    code: body.code,
    name: body.name,
    description: body.description ?? null,
    discount_type: body.discount_type,
    discount_value: body.discount_value,
    max_discount: body.max_discount ?? null,
    min_order_amount: body.min_order_amount ?? 0,
    usage_limit: body.usage_limit ?? null,
    usage_count: 0,
    per_user_limit: body.per_user_limit ?? 1,
    valid_from: body.valid_from ?? null,
    valid_until: body.valid_until ?? null,
    is_active: true,
    target_bike_ids: body.target_bike_ids ?? [],
    created_at: now,
    updated_at: now,
  };

  if (isSandboxMode()) {
    sandboxLog("POST /api/vendor/coupons", `vendor=${vendor.id}`);
    return NextResponse.json(
      { data: { id: `cpn_${Date.now()}`, ...insertData }, message: "クーポンを作成しました" },
      { status: 201 }
    );
  }

  const { data, error } = await supabase
    .from("coupons")
    .insert(insertData)
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { error: "Database error", message: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ data, message: "クーポンを作成しました" }, { status: 201 });
}

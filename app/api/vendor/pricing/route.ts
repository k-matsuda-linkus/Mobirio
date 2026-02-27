import { NextRequest, NextResponse } from "next/server";
import { requireVendor } from "@/lib/auth/requireAuth";
import { isSandboxMode, sandboxLog } from "@/lib/sandbox";
import { DEFAULT_PRICING } from "@/lib/booking/pricing";
import type { PricingDuration } from "@/types/database";

export async function GET(request: NextRequest) {
  const authResult = await requireVendor(request);
  if (authResult instanceof NextResponse) return authResult;
  const { vendor, supabase } = authResult;

  if (isSandboxMode()) {
    sandboxLog("GET /api/vendor/pricing", `vendor=${vendor.id}`);
    // sandbox ではデフォルト料金テーブルを pricing_rules 形式で返す
    const rules = Object.entries(DEFAULT_PRICING).flatMap(([vehicleClass, pricing]) => [
      { id: `pr-${vehicleClass}-2h`, vendor_id: vendor.id, bike_id: null, duration: "2h", price: pricing.rate_2h ?? 0, is_active: true, valid_from: null, valid_until: null },
      { id: `pr-${vehicleClass}-4h`, vendor_id: vendor.id, bike_id: null, duration: "4h", price: pricing.rate_4h, is_active: true, valid_from: null, valid_until: null },
      { id: `pr-${vehicleClass}-1day`, vendor_id: vendor.id, bike_id: null, duration: "1day", price: pricing.rate_1day, is_active: true, valid_from: null, valid_until: null },
      { id: `pr-${vehicleClass}-24h`, vendor_id: vendor.id, bike_id: null, duration: "24h", price: pricing.rate_24h, is_active: true, valid_from: null, valid_until: null },
      { id: `pr-${vehicleClass}-32h`, vendor_id: vendor.id, bike_id: null, duration: "32h", price: pricing.rate_32h, is_active: true, valid_from: null, valid_until: null },
      { id: `pr-${vehicleClass}-overtime`, vendor_id: vendor.id, bike_id: null, duration: "overtime", price: pricing.overtime_per_hour, is_active: true, valid_from: null, valid_until: null },
      { id: `pr-${vehicleClass}-additional24h`, vendor_id: vendor.id, bike_id: null, duration: "additional24h", price: pricing.additional_24h, is_active: true, valid_from: null, valid_until: null },
    ]);
    return NextResponse.json({ data: rules, message: "OK" });
  }

  const { data, error } = await supabase
    .from("pricing_rules")
    .select("*")
    .eq("vendor_id", vendor.id)
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json(
      { error: "Database error", message: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ data, message: "OK" });
}

export async function PUT(request: NextRequest) {
  const authResult = await requireVendor(request);
  if (authResult instanceof NextResponse) return authResult;
  const { vendor, supabase } = authResult;

  let body: { rules?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON", message: "リクエストボディが不正です" },
      { status: 400 }
    );
  }
  const { rules } = body;

  if (!Array.isArray(rules)) {
    return NextResponse.json(
      { error: "Validation error", message: "rules 配列は必須です" },
      { status: 400 }
    );
  }

  if (isSandboxMode()) {
    sandboxLog("PUT /api/vendor/pricing", `vendor=${vendor.id}, rules=${rules.length}`);
    return NextResponse.json({ message: "料金設定を更新しました" });
  }

  // 既存ルールを削除して再挿入（upsertの代わり）
  const { error: deleteError } = await supabase
    .from("pricing_rules")
    .delete()
    .eq("vendor_id", vendor.id);

  if (deleteError) {
    return NextResponse.json(
      { error: "Database error", message: deleteError.message },
      { status: 500 }
    );
  }

  if (rules.length > 0) {
    const insertData = rules.map((rule: { duration: PricingDuration; price: number; bike_id?: string; valid_from?: string; valid_until?: string }) => ({
      vendor_id: vendor.id,
      bike_id: rule.bike_id ?? null,
      duration: rule.duration,
      price: rule.price,
      is_active: true as const,
      valid_from: rule.valid_from ?? null,
      valid_until: rule.valid_until ?? null,
    }));

    const { error: insertError } = await supabase
      .from("pricing_rules")
      .insert(insertData);

    if (insertError) {
      return NextResponse.json(
        { error: "Database error", message: insertError.message },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({ message: "料金設定を更新しました" });
}

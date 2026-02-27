import { NextRequest, NextResponse } from "next/server";
import { requireVendor } from "@/lib/auth/requireAuth";
import { isSandboxMode, sandboxLog } from "@/lib/sandbox";

const mockBusinessHours = {
  monday: { open: "09:00", close: "19:00", closed: false },
  tuesday: { open: "09:00", close: "19:00", closed: false },
  wednesday: { open: "09:00", close: "19:00", closed: false },
  thursday: { open: "09:00", close: "19:00", closed: false },
  friday: { open: "09:00", close: "19:00", closed: false },
  saturday: { open: "10:00", close: "18:00", closed: false },
  sunday: { open: "10:00", close: "18:00", closed: false },
};

export async function GET(request: NextRequest) {
  const authResult = await requireVendor(request);
  if (authResult instanceof NextResponse) return authResult;
  const { vendor, supabase } = authResult;

  if (isSandboxMode()) {
    sandboxLog("GET /api/vendor/business-hours", `vendor=${vendor.id}`);
    return NextResponse.json({ data: mockBusinessHours, message: "OK" });
  }

  const { data, error } = await supabase
    .from("vendor_business_hours")
    .select("*")
    .eq("vendor_id", vendor.id);

  if (error) {
    return NextResponse.json(
      { error: "Database error", message: error.message },
      { status: 500 }
    );
  }

  // Supabaseの配列結果をsandboxと同じオブジェクト形式に変換
  const DAY_NAMES = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  const result: Record<string, { open: string; close: string; closed: boolean }> = {};
  const days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
  for (const day of days) {
    const dayIndex = DAY_NAMES.indexOf(day);
    const row = (data || []).find((r: any) => r.day_of_week === day || r.day_of_week === dayIndex) as any;
    result[day] = {
      open: row?.open_time || "09:00",
      close: row?.close_time || "18:00",
      closed: row?.is_closed || false,
    };
  }

  return NextResponse.json({ data: result, message: "OK" });
}

export async function PUT(request: NextRequest) {
  const authResult = await requireVendor(request);
  if (authResult instanceof NextResponse) return authResult;
  const { vendor, supabase } = authResult;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON", message: "リクエストボディが不正です" },
      { status: 400 }
    );
  }

  if (isSandboxMode()) {
    sandboxLog("PUT /api/vendor/business-hours", `vendor=${vendor.id}`);
    return NextResponse.json({ data: body, message: "営業時間を更新しました" });
  }

  // 一括更新: 既存を削除して再挿入
  const { error: deleteError } = await supabase
    .from("vendor_business_hours")
    .delete()
    .eq("vendor_id", vendor.id);

  if (deleteError) {
    return NextResponse.json(
      { error: "Database error", message: deleteError.message },
      { status: 500 }
    );
  }

  const DAY_MAP: Record<string, number> = {
    sunday: 0, monday: 1, tuesday: 2, wednesday: 3,
    thursday: 4, friday: 5, saturday: 6,
  };

  const rows = Object.entries(body).map(([day, hours]) => {
    const h = hours as Record<string, unknown>;
    return {
      vendor_id: vendor.id,
      day_of_week: DAY_MAP[day] ?? 0,
      open_time: (h.open as string) || "09:00",
      close_time: (h.close as string) || "19:00",
      is_closed: (h.closed as boolean) || false,
    };
  });

  const { data, error } = await supabase
    .from("vendor_business_hours")
    .insert(rows)
    .select();

  if (error) {
    return NextResponse.json(
      { error: "Database error", message: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ data, message: "営業時間を更新しました" });
}

import { NextRequest, NextResponse } from "next/server";
import { requireVendor } from "@/lib/auth/requireAuth";
import { isSandboxMode, sandboxLog } from "@/lib/sandbox";

const mockHolidays = [
  { id: "hol_001", vendor_id: "v-001", date: "2025-12-31", reason: "年末休業" },
  { id: "hol_002", vendor_id: "v-001", date: "2026-01-01", reason: "元日" },
  { id: "hol_003", vendor_id: "v-001", date: "2026-01-02", reason: "正月休業" },
  { id: "hol_004", vendor_id: "v-001", date: "2026-01-03", reason: "正月休業" },
];

export async function GET(request: NextRequest) {
  const authResult = await requireVendor(request);
  if (authResult instanceof NextResponse) return authResult;
  const { vendor, supabase } = authResult;

  if (isSandboxMode()) {
    sandboxLog("GET /api/vendor/holidays", `vendor=${vendor.id}`);
    return NextResponse.json({
      data: mockHolidays.filter((h) => h.vendor_id === vendor.id),
      message: "OK",
    });
  }

  const { data, error } = await supabase
    .from("vendor_holidays")
    .select("*")
    .eq("vendor_id", vendor.id)
    .order("date", { ascending: true });

  if (error) {
    return NextResponse.json(
      { error: "Database error", message: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ data, message: "OK" });
}

export async function POST(request: NextRequest) {
  const authResult = await requireVendor(request);
  if (authResult instanceof NextResponse) return authResult;
  const { vendor, supabase } = authResult;

  let body: { date?: string; reason?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON", message: "リクエストボディが不正です" },
      { status: 400 }
    );
  }

  if (!body.date) {
    return NextResponse.json(
      { error: "Bad request", message: "date は必須です" },
      { status: 400 }
    );
  }

  if (isSandboxMode()) {
    sandboxLog("POST /api/vendor/holidays", `vendor=${vendor.id}`);
    return NextResponse.json(
      {
        data: { id: `hol_${Date.now()}`, vendor_id: vendor.id, date: body.date, reason: body.reason ?? null },
        message: "休日を追加しました",
      },
      { status: 201 }
    );
  }

  const { data, error } = await supabase
    .from("vendor_holidays")
    .insert({ vendor_id: vendor.id, date: body.date, reason: body.reason ?? null })
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { error: "Database error", message: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ data, message: "休日を追加しました" }, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const authResult = await requireVendor(request);
  if (authResult instanceof NextResponse) return authResult;
  const { vendor, supabase } = authResult;

  const id = request.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json(
      { error: "Bad request", message: "id パラメータは必須です" },
      { status: 400 }
    );
  }

  if (isSandboxMode()) {
    sandboxLog("DELETE /api/vendor/holidays", `vendor=${vendor.id}, id=${id}`);
    return NextResponse.json({ success: true, message: "休日を削除しました" });
  }

  const { error } = await supabase
    .from("vendor_holidays")
    .delete()
    .eq("id", id)
    .eq("vendor_id", vendor.id);

  if (error) {
    return NextResponse.json(
      { error: "Database error", message: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, message: "休日を削除しました" });
}

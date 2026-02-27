import { NextRequest, NextResponse } from "next/server";
import { requireVendor } from "@/lib/auth/requireAuth";
import { isSandboxMode, sandboxLog } from "@/lib/sandbox";

const mockClosures = [
  { id: "cls_001", vendor_id: "v-001", closure_date: "2025-12-31", reason: "年末休業", created_at: "2025-01-01T00:00:00Z" },
  { id: "cls_002", vendor_id: "v-001", closure_date: "2025-01-01", reason: "元日休業", created_at: "2025-01-01T00:00:00Z" },
  { id: "cls_003", vendor_id: "v-001", closure_date: "2025-01-02", reason: "正月休業", created_at: "2025-01-01T00:00:00Z" },
];

export async function GET(request: NextRequest) {
  const authResult = await requireVendor(request);
  if (authResult instanceof NextResponse) return authResult;
  const { vendor, supabase } = authResult;

  const searchParams = request.nextUrl.searchParams;
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  if (isSandboxMode()) {
    sandboxLog("GET /api/vendor/closures", `vendor=${vendor.id}`);
    let filtered = mockClosures.filter((c) => c.vendor_id === vendor.id);
    if (from) filtered = filtered.filter((c) => c.closure_date >= from);
    if (to) filtered = filtered.filter((c) => c.closure_date <= to);
    return NextResponse.json({ data: filtered, message: "OK" });
  }

  let query = supabase
    .from("vendor_closures")
    .select("*")
    .eq("vendor_id", vendor.id)
    .order("closure_date", { ascending: true });

  if (from) query = query.gte("closure_date", from);
  if (to) query = query.lte("closure_date", to);

  const { data, error } = await query;

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

  let body: { closure_date?: string; reason?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON", message: "リクエストボディが不正です" },
      { status: 400 }
    );
  }

  if (!body.closure_date) {
    return NextResponse.json(
      { error: "Bad request", message: "closure_date は必須です" },
      { status: 400 }
    );
  }

  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(body.closure_date)) {
    return NextResponse.json(
      { error: "Bad request", message: "closure_date は YYYY-MM-DD 形式で指定してください" },
      { status: 400 }
    );
  }

  if (isSandboxMode()) {
    sandboxLog("POST /api/vendor/closures", `vendor=${vendor.id}`);
    const created = {
      id: `cls_${Date.now()}`,
      vendor_id: vendor.id,
      closure_date: body.closure_date,
      reason: body.reason ?? null,
      created_at: new Date().toISOString(),
    };
    return NextResponse.json({ data: created, message: "休業日を追加しました" }, { status: 201 });
  }

  const { data, error } = await supabase
    .from("vendor_closures")
    .insert({
      vendor_id: vendor.id,
      closure_date: body.closure_date,
      reason: body.reason ?? null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { error: "Database error", message: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ data, message: "休業日を追加しました" }, { status: 201 });
}

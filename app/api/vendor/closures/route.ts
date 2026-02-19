import { NextRequest, NextResponse } from "next/server";
import { requireVendor } from "@/lib/auth/requireAuth";

/**
 * GET /api/vendor/closures
 * List closures (temporary shop closures) for the authenticated vendor.
 */
export async function GET(request: NextRequest) {
  const authResult = await requireVendor(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const { vendor } = authResult;
  const searchParams = request.nextUrl.searchParams;
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  // TODO: Replace with Supabase query once schema is applied
  const mockClosures = [
    {
      id: "cls_001",
      vendor_id: vendor.id,
      closure_date: "2025-12-31",
      reason: "年末休業",
      created_at: "2025-01-01T00:00:00Z",
    },
    {
      id: "cls_002",
      vendor_id: vendor.id,
      closure_date: "2025-01-01",
      reason: "元日休業",
      created_at: "2025-01-01T00:00:00Z",
    },
    {
      id: "cls_003",
      vendor_id: vendor.id,
      closure_date: "2025-01-02",
      reason: "正月休業",
      created_at: "2025-01-01T00:00:00Z",
    },
  ];

  let filtered = mockClosures;
  if (from) {
    filtered = filtered.filter((c) => c.closure_date >= from);
  }
  if (to) {
    filtered = filtered.filter((c) => c.closure_date <= to);
  }

  return NextResponse.json({
    data: filtered,
    message: "OK",
  });
}

/**
 * POST /api/vendor/closures
 * Create a new closure date.
 */
export async function POST(request: NextRequest) {
  const authResult = await requireVendor(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const { vendor } = authResult;

  let body: { vendor_id?: string; closure_date?: string; reason?: string };
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

  // Validate date format (YYYY-MM-DD)
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(body.closure_date)) {
    return NextResponse.json(
      {
        error: "Bad request",
        message: "closure_date は YYYY-MM-DD 形式で指定してください",
      },
      { status: 400 }
    );
  }

  // TODO: Replace with Supabase insert once schema is applied
  const created = {
    id: `cls_${Date.now()}`,
    vendor_id: vendor.id,
    closure_date: body.closure_date,
    reason: body.reason ?? null,
    created_at: new Date().toISOString(),
  };

  return NextResponse.json(
    { data: created, message: "休業日を追加しました" },
    { status: 201 }
  );
}

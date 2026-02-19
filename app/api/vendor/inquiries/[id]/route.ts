import { NextRequest, NextResponse } from "next/server";
import { requireVendor } from "@/lib/auth/requireAuth";

/**
 * GET /api/vendor/inquiries/[id]
 * Get a single inquiry by ID.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const authResult = await requireVendor(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const { vendor } = authResult;

  // TODO: Replace with Supabase query once schema is applied
  const mockInquiry = {
    id,
    vendor_id: vendor.id,
    reservation_id: "res_001",
    content: "返却時間を30分遅らせることは可能ですか？",
    reply: null,
    status: "pending",
    created_at: "2025-01-15T10:30:00Z",
    updated_at: "2025-01-15T10:30:00Z",
    reservation: {
      id: "res_001",
      bike_name: "PCX 160",
      user_name: "田中太郎",
      start_datetime: "2025-01-20T09:00:00Z",
      end_datetime: "2025-01-21T18:00:00Z",
    },
  };

  return NextResponse.json({ data: mockInquiry, message: "OK" });
}

/**
 * PUT /api/vendor/inquiries/[id]
 * Update an inquiry (vendor reply).
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const authResult = await requireVendor(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const { vendor } = authResult;

  let body: { reply?: string; status?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON", message: "リクエストボディが不正です" },
      { status: 400 }
    );
  }

  if (!body.reply && !body.status) {
    return NextResponse.json(
      { error: "Bad request", message: "reply または status が必要です" },
      { status: 400 }
    );
  }

  // TODO: Replace with Supabase update once schema is applied
  const updated = {
    id,
    vendor_id: vendor.id,
    reservation_id: "res_001",
    content: "返却時間を30分遅らせることは可能ですか？",
    reply: body.reply ?? null,
    status: body.status ?? "replied",
    created_at: "2025-01-15T10:30:00Z",
    updated_at: new Date().toISOString(),
  };

  return NextResponse.json({
    data: updated,
    message: "問い合わせを更新しました",
  });
}

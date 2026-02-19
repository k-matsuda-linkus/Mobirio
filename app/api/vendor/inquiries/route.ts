import { NextRequest, NextResponse } from "next/server";
import { requireVendor } from "@/lib/auth/requireAuth";

/**
 * GET /api/vendor/inquiries
 * List inquiries for the authenticated vendor.
 */
export async function GET(request: NextRequest) {
  const authResult = await requireVendor(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const { vendor } = authResult;
  const searchParams = request.nextUrl.searchParams;
  const status = searchParams.get("status");
  const limit = parseInt(searchParams.get("limit") || "50");
  const offset = parseInt(searchParams.get("offset") || "0");

  // TODO: Replace with Supabase query once schema is applied
  const mockInquiries = [
    {
      id: "inq_001",
      vendor_id: vendor.id,
      reservation_id: "res_001",
      content: "返却時間を30分遅らせることは可能ですか？",
      reply: null,
      status: "pending",
      created_at: "2025-01-15T10:30:00Z",
      updated_at: "2025-01-15T10:30:00Z",
    },
    {
      id: "inq_002",
      vendor_id: vendor.id,
      reservation_id: "res_002",
      content: "ヘルメットのサイズを教えてください。",
      reply: "S/M/Lサイズをご用意しております。",
      status: "replied",
      created_at: "2025-01-14T09:00:00Z",
      updated_at: "2025-01-14T12:00:00Z",
    },
  ];

  const filtered = status
    ? mockInquiries.filter((i) => i.status === status)
    : mockInquiries;

  return NextResponse.json({
    data: filtered.slice(offset, offset + limit),
    pagination: {
      total: filtered.length,
      limit,
      offset,
    },
    message: "OK",
  });
}

/**
 * POST /api/vendor/inquiries
 * Create a new inquiry.
 */
export async function POST(request: NextRequest) {
  const authResult = await requireVendor(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const { vendor } = authResult;

  let body: { vendor_id?: string; reservation_id?: string; content?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON", message: "リクエストボディが不正です" },
      { status: 400 }
    );
  }

  if (!body.reservation_id || !body.content) {
    return NextResponse.json(
      {
        error: "Bad request",
        message: "reservation_id と content は必須です",
      },
      { status: 400 }
    );
  }

  // TODO: Replace with Supabase insert once schema is applied
  const created = {
    id: `inq_${Date.now()}`,
    vendor_id: vendor.id,
    reservation_id: body.reservation_id,
    content: body.content,
    reply: null,
    status: "pending",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  return NextResponse.json(
    { data: created, message: "問い合わせを作成しました" },
    { status: 201 }
  );
}

import { NextRequest, NextResponse } from "next/server";
import { requireVendor } from "@/lib/auth/requireAuth";

/**
 * GET /api/vendor/shop-reviews/[id]
 * Get a single shop review by ID.
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
  const mockReview = {
    id,
    vendor_id: vendor.id,
    reservation_id: "res_010",
    user_id: "user_001",
    user_name: "田中太郎",
    rating: 5,
    comment: "とても親切な対応でした。バイクの状態も良好です。",
    vendor_reply: null,
    created_at: "2025-01-12T14:00:00Z",
    updated_at: "2025-01-12T14:00:00Z",
    reservation: {
      id: "res_010",
      bike_name: "PCX 160",
      start_datetime: "2025-01-10T09:00:00Z",
      end_datetime: "2025-01-11T18:00:00Z",
    },
  };

  return NextResponse.json({ data: mockReview, message: "OK" });
}

/**
 * PUT /api/vendor/shop-reviews/[id]
 * Update vendor reply on a review.
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

  let body: { vendor_reply?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON", message: "リクエストボディが不正です" },
      { status: 400 }
    );
  }

  if (body.vendor_reply === undefined) {
    return NextResponse.json(
      { error: "Bad request", message: "vendor_reply は必須です" },
      { status: 400 }
    );
  }

  // TODO: Replace with Supabase update once schema is applied
  const updated = {
    id,
    vendor_id: vendor.id,
    reservation_id: "res_010",
    user_id: "user_001",
    rating: 5,
    comment: "とても親切な対応でした。バイクの状態も良好です。",
    vendor_reply: body.vendor_reply,
    created_at: "2025-01-12T14:00:00Z",
    updated_at: new Date().toISOString(),
  };

  return NextResponse.json({
    data: updated,
    message: "返信を更新しました",
  });
}

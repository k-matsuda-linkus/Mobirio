import { NextRequest, NextResponse } from "next/server";
import { requireVendor } from "@/lib/auth/requireAuth";

/**
 * GET /api/vendor/shop-reviews
 * List shop reviews for the authenticated vendor.
 */
export async function GET(request: NextRequest) {
  const authResult = await requireVendor(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const { vendor } = authResult;
  const searchParams = request.nextUrl.searchParams;
  const limit = parseInt(searchParams.get("limit") || "50");
  const offset = parseInt(searchParams.get("offset") || "0");

  // TODO: Replace with Supabase query once schema is applied
  const mockReviews = [
    {
      id: "rev_001",
      vendor_id: vendor.id,
      reservation_id: "res_010",
      user_id: "user_001",
      user_name: "田中太郎",
      rating: 5,
      comment: "とても親切な対応でした。バイクの状態も良好です。",
      vendor_reply: "ご利用ありがとうございました！",
      created_at: "2025-01-12T14:00:00Z",
      updated_at: "2025-01-13T09:00:00Z",
    },
    {
      id: "rev_002",
      vendor_id: vendor.id,
      reservation_id: "res_011",
      user_id: "user_002",
      user_name: "佐藤花子",
      rating: 4,
      comment: "便利なロケーションでした。",
      vendor_reply: null,
      created_at: "2025-01-10T16:00:00Z",
      updated_at: "2025-01-10T16:00:00Z",
    },
  ];

  const averageRating =
    mockReviews.reduce((sum, r) => sum + r.rating, 0) / mockReviews.length;

  return NextResponse.json({
    data: mockReviews.slice(offset, offset + limit),
    summary: {
      average_rating: Math.round(averageRating * 10) / 10,
      total_count: mockReviews.length,
    },
    pagination: {
      total: mockReviews.length,
      limit,
      offset,
    },
    message: "OK",
  });
}

/**
 * POST /api/vendor/shop-reviews
 * Create a shop review (typically by a customer, but routed through vendor context).
 */
export async function POST(request: NextRequest) {
  const authResult = await requireVendor(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const { vendor } = authResult;

  let body: {
    reservation_id?: string;
    user_id?: string;
    rating?: number;
    comment?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON", message: "リクエストボディが不正です" },
      { status: 400 }
    );
  }

  if (!body.reservation_id || !body.rating) {
    return NextResponse.json(
      {
        error: "Bad request",
        message: "reservation_id と rating は必須です",
      },
      { status: 400 }
    );
  }

  if (body.rating < 1 || body.rating > 5) {
    return NextResponse.json(
      { error: "Bad request", message: "rating は1〜5の範囲で指定してください" },
      { status: 400 }
    );
  }

  // TODO: Replace with Supabase insert once schema is applied
  const created = {
    id: `rev_${Date.now()}`,
    vendor_id: vendor.id,
    reservation_id: body.reservation_id,
    user_id: body.user_id ?? null,
    rating: body.rating,
    comment: body.comment ?? null,
    vendor_reply: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  return NextResponse.json(
    { data: created, message: "レビューを作成しました" },
    { status: 201 }
  );
}

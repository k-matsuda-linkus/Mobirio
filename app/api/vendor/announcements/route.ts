import { NextRequest, NextResponse } from "next/server";
import { requireVendor } from "@/lib/auth/requireAuth";

/**
 * GET /api/vendor/announcements
 * List announcements for the authenticated vendor.
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
  const mockAnnouncements = [
    {
      id: "ann_001",
      vendor_id: vendor.id,
      title: "年末年始の営業時間について",
      body: "12/31〜1/3は休業とさせていただきます。",
      is_published: true,
      published_at: "2025-01-10T00:00:00Z",
      created_at: "2025-01-09T15:00:00Z",
      updated_at: "2025-01-09T15:00:00Z",
    },
    {
      id: "ann_002",
      vendor_id: vendor.id,
      title: "新車追加のお知らせ",
      body: "Honda ADV160を導入しました。",
      is_published: true,
      published_at: "2025-01-05T00:00:00Z",
      created_at: "2025-01-04T10:00:00Z",
      updated_at: "2025-01-04T10:00:00Z",
    },
  ];

  return NextResponse.json({
    data: mockAnnouncements.slice(offset, offset + limit),
    pagination: {
      total: mockAnnouncements.length,
      limit,
      offset,
    },
    message: "OK",
  });
}

/**
 * POST /api/vendor/announcements
 * Create a new announcement.
 */
export async function POST(request: NextRequest) {
  const authResult = await requireVendor(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const { vendor } = authResult;

  let body: {
    title?: string;
    body?: string;
    is_published?: boolean;
    published_at?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON", message: "リクエストボディが不正です" },
      { status: 400 }
    );
  }

  if (!body.title || !body.body) {
    return NextResponse.json(
      { error: "Bad request", message: "title と body は必須です" },
      { status: 400 }
    );
  }

  // TODO: Replace with Supabase insert once schema is applied
  const created = {
    id: `ann_${Date.now()}`,
    vendor_id: vendor.id,
    title: body.title,
    body: body.body,
    is_published: body.is_published ?? false,
    published_at: body.published_at ?? null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  return NextResponse.json(
    { data: created, message: "お知らせを作成しました" },
    { status: 201 }
  );
}

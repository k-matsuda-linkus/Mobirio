import { NextRequest, NextResponse } from "next/server";
import { requireVendor } from "@/lib/auth/requireAuth";

/**
 * GET /api/vendor/announcements/[id]
 * Get a single announcement by ID.
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
  const mockAnnouncement = {
    id,
    vendor_id: vendor.id,
    title: "年末年始の営業時間について",
    body: "12/31〜1/3は休業とさせていただきます。",
    is_published: true,
    published_at: "2025-01-10T00:00:00Z",
    created_at: "2025-01-09T15:00:00Z",
    updated_at: "2025-01-09T15:00:00Z",
  };

  return NextResponse.json({ data: mockAnnouncement, message: "OK" });
}

/**
 * PUT /api/vendor/announcements/[id]
 * Update an announcement.
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

  if (!body.title && !body.body && body.is_published === undefined) {
    return NextResponse.json(
      { error: "Bad request", message: "更新するフィールドがありません" },
      { status: 400 }
    );
  }

  // TODO: Replace with Supabase update once schema is applied
  const updated = {
    id,
    vendor_id: vendor.id,
    title: body.title ?? "年末年始の営業時間について",
    body: body.body ?? "12/31〜1/3は休業とさせていただきます。",
    is_published: body.is_published ?? true,
    published_at: body.published_at ?? "2025-01-10T00:00:00Z",
    created_at: "2025-01-09T15:00:00Z",
    updated_at: new Date().toISOString(),
  };

  return NextResponse.json({
    data: updated,
    message: "お知らせを更新しました",
  });
}

/**
 * DELETE /api/vendor/announcements/[id]
 * Delete an announcement.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const authResult = await requireVendor(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  // TODO: Replace with Supabase delete once schema is applied
  // Verify vendor ownership before deleting

  return NextResponse.json({
    success: true,
    message: "お知らせを削除しました",
    deleted_id: id,
  });
}

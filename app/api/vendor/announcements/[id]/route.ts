import { NextRequest, NextResponse } from "next/server";
import { requireVendor } from "@/lib/auth/requireAuth";
import { isSandboxMode, sandboxLog } from "@/lib/sandbox";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const authResult = await requireVendor(request);
  if (authResult instanceof NextResponse) return authResult;
  const { vendor, supabase } = authResult;

  if (isSandboxMode()) {
    sandboxLog("GET /api/vendor/announcements/[id]", `vendor=${vendor.id}, id=${id}`);
    return NextResponse.json({
      data: {
        id, vendor_id: vendor.id, title: "年末年始の営業時間について",
        announcement_type: "info",
        detail_html: "12/31〜1/3は休業とさせていただきます。",
        url: null, image_url: null,
        published_from: "2025-01-10T00:00:00Z", published_until: null,
        created_at: "2025-01-09T15:00:00Z", updated_at: "2025-01-09T15:00:00Z",
      },
      message: "OK",
    });
  }

  const { data, error } = await supabase
    .from("vendor_announcements")
    .select("*")
    .eq("id", id)
    .eq("vendor_id", vendor.id)
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: "Not found", message: "お知らせが見つかりません" },
      { status: 404 }
    );
  }

  return NextResponse.json({ data, message: "OK" });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const authResult = await requireVendor(request);
  if (authResult instanceof NextResponse) return authResult;
  const { vendor, supabase } = authResult;

  let body: { title?: string; detail_html?: string; announcement_type?: string; published_from?: string; published_until?: string; url?: string; image_url?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON", message: "リクエストボディが不正です" },
      { status: 400 }
    );
  }

  if (!body.title && !body.detail_html && !body.announcement_type && !body.published_from && body.published_until === undefined) {
    return NextResponse.json(
      { error: "Bad request", message: "更新するフィールドがありません" },
      { status: 400 }
    );
  }

  if (isSandboxMode()) {
    sandboxLog("PUT /api/vendor/announcements/[id]", `vendor=${vendor.id}, id=${id}`);
    return NextResponse.json({
      data: {
        id, vendor_id: vendor.id,
        title: body.title ?? "年末年始の営業時間について",
        announcement_type: body.announcement_type ?? "info",
        detail_html: body.detail_html ?? "12/31〜1/3は休業とさせていただきます。",
        url: body.url ?? null, image_url: body.image_url ?? null,
        published_from: body.published_from ?? "2025-01-10T00:00:00Z",
        published_until: body.published_until ?? null,
        created_at: "2025-01-09T15:00:00Z",
        updated_at: new Date().toISOString(),
      },
      message: "お知らせを更新しました",
    });
  }

  const { data, error } = await supabase
    .from("vendor_announcements")
    .update({ ...body, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("vendor_id", vendor.id)
    .select()
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: "Not found", message: "お知らせが見つかりません" },
      { status: 404 }
    );
  }

  return NextResponse.json({ data, message: "お知らせを更新しました" });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const authResult = await requireVendor(request);
  if (authResult instanceof NextResponse) return authResult;
  const { vendor, supabase } = authResult;

  if (isSandboxMode()) {
    sandboxLog("DELETE /api/vendor/announcements/[id]", `vendor=${vendor.id}, id=${id}`);
    return NextResponse.json({ success: true, message: "お知らせを削除しました", deleted_id: id });
  }

  const { error } = await supabase
    .from("vendor_announcements")
    .delete()
    .eq("id", id)
    .eq("vendor_id", vendor.id);

  if (error) {
    return NextResponse.json(
      { error: "Database error", message: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, message: "お知らせを削除しました", deleted_id: id });
}

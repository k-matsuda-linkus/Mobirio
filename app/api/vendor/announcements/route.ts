import { NextRequest, NextResponse } from "next/server";
import { requireVendor } from "@/lib/auth/requireAuth";
import { isSandboxMode, sandboxLog } from "@/lib/sandbox";

const mockAnnouncements = [
  {
    id: "ann_001", vendor_id: "v-001", title: "年末年始の営業時間について",
    announcement_type: "info",
    detail_html: "12/31〜1/3は休業とさせていただきます。", url: null, image_url: null,
    published_from: "2025-01-10T00:00:00Z", published_until: null,
    created_at: "2025-01-09T15:00:00Z", updated_at: "2025-01-09T15:00:00Z",
  },
  {
    id: "ann_002", vendor_id: "v-001", title: "新車追加のお知らせ",
    announcement_type: "info",
    detail_html: "Honda ADV160を導入しました。", url: null, image_url: null,
    published_from: "2025-01-05T00:00:00Z", published_until: null,
    created_at: "2025-01-04T10:00:00Z", updated_at: "2025-01-04T10:00:00Z",
  },
];

export async function GET(request: NextRequest) {
  const authResult = await requireVendor(request);
  if (authResult instanceof NextResponse) return authResult;
  const { vendor, supabase } = authResult;

  const searchParams = request.nextUrl.searchParams;
  const limit = parseInt(searchParams.get("limit") || "50");
  const offset = parseInt(searchParams.get("offset") || "0");

  if (isSandboxMode()) {
    sandboxLog("GET /api/vendor/announcements", `vendor=${vendor.id}`);
    const filtered = mockAnnouncements.filter((a) => a.vendor_id === vendor.id);
    return NextResponse.json({
      data: filtered.slice(offset, offset + limit),
      pagination: { total: filtered.length, limit, offset },
      message: "OK",
    });
  }

  const { data, error, count } = await supabase
    .from("vendor_announcements")
    .select("*", { count: "exact" })
    .eq("vendor_id", vendor.id)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    return NextResponse.json(
      { error: "Database error", message: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    data,
    pagination: { total: count ?? 0, limit, offset },
    message: "OK",
  });
}

export async function POST(request: NextRequest) {
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

  if (!body.title || !body.detail_html) {
    return NextResponse.json(
      { error: "Bad request", message: "title と detail_html は必須です" },
      { status: 400 }
    );
  }

  const now = new Date().toISOString();
  const insertData = {
    vendor_id: vendor.id,
    title: body.title,
    detail_html: body.detail_html,
    announcement_type: body.announcement_type ?? "info",
    published_from: body.published_from ?? null,
    published_until: body.published_until ?? null,
    url: body.url ?? null,
    image_url: body.image_url ?? null,
    created_at: now,
    updated_at: now,
  };

  if (isSandboxMode()) {
    sandboxLog("POST /api/vendor/announcements", `vendor=${vendor.id}`);
    return NextResponse.json(
      { data: { id: `ann_${Date.now()}`, ...insertData }, message: "お知らせを作成しました" },
      { status: 201 }
    );
  }

  const { data, error } = await supabase
    .from("vendor_announcements")
    .insert(insertData)
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { error: "Database error", message: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ data, message: "お知らせを作成しました" }, { status: 201 });
}

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
    sandboxLog("GET /api/vendor/shop-reviews/[id]", `vendor=${vendor.id}, id=${id}`);
    return NextResponse.json({
      data: {
        id, vendor_id: vendor.id, reservation_id: "res_010", user_id: "user_001",
        nickname: "田中太郎",
        content: "とても親切な対応でした。バイクの状態も良好です。",
        reply: null, reply_by: null, reply_at: null,
        is_published: true, posted_at: "2025-01-12T14:00:00Z",
        reservations: {
          id: "res_010", start_datetime: "2025-01-10T09:00:00Z", end_datetime: "2025-01-11T18:00:00Z",
          bike: { id: "bike-001", name: "PCX 160" },
        },
      },
      message: "OK",
    });
  }

  const { data, error } = await supabase
    .from("shop_reviews")
    .select("*, reservations(id, start_datetime, end_datetime, bike:bikes(id, name))")
    .eq("id", id)
    .eq("vendor_id", vendor.id)
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: "Not found", message: "レビューが見つかりません" },
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

  let body: { reply?: string; is_published?: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON", message: "リクエストボディが不正です" },
      { status: 400 }
    );
  }

  if (body.reply === undefined && body.is_published === undefined) {
    return NextResponse.json(
      { error: "Bad request", message: "reply または is_published は必須です" },
      { status: 400 }
    );
  }

  const now = new Date().toISOString();

  if (isSandboxMode()) {
    sandboxLog("PUT /api/vendor/shop-reviews/[id]", `vendor=${vendor.id}, id=${id}`);
    return NextResponse.json({
      data: {
        id, vendor_id: vendor.id, reservation_id: "res_010", user_id: "user_001",
        nickname: "田中太郎",
        content: "とても親切な対応でした。バイクの状態も良好です。",
        reply: body.reply ?? null, reply_by: body.reply !== undefined ? (vendor.name || vendor.id) : null, reply_at: body.reply !== undefined ? now : null,
        is_published: body.is_published !== undefined ? body.is_published : true, posted_at: "2025-01-12T14:00:00Z",
      },
      message: "レビューを更新しました",
    });
  }

  const updatePayload: Record<string, unknown> = {};
  if (body.reply !== undefined) {
    updatePayload.reply = body.reply;
    updatePayload.reply_by = vendor.name || vendor.id;
    updatePayload.reply_at = now;
  }
  if (body.is_published !== undefined) {
    updatePayload.is_published = body.is_published;
  }

  const { data, error } = await supabase
    .from("shop_reviews")
    .update(updatePayload)
    .eq("id", id)
    .eq("vendor_id", vendor.id)
    .select()
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: "Not found", message: "レビューが見つかりません" },
      { status: 404 }
    );
  }

  return NextResponse.json({ data, message: "返信を更新しました" });
}

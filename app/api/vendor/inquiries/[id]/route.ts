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
    sandboxLog("GET /api/vendor/inquiries/[id]", `vendor=${vendor.id}, id=${id}`);
    return NextResponse.json({
      data: {
        id, vendor_id: vendor.id, reservation_id: "res_001",
        content: "返却時間を30分遅らせることは可能ですか？",
        reply: null, status: "pending",
        created_at: "2025-01-15T10:30:00Z", replied_at: null,
        reservation: {
          id: "res_001", start_datetime: "2025-01-20T09:00:00Z", end_datetime: "2025-01-21T18:00:00Z",
        },
      },
      message: "OK",
    });
  }

  const { data, error } = await supabase
    .from("vendor_inquiries")
    .select("*, reservations(id, start_datetime, end_datetime, bike:bikes(id, name), user:users(id, full_name))")
    .eq("id", id)
    .eq("vendor_id", vendor.id)
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: "Not found", message: "問い合わせが見つかりません" },
      { status: 404 }
    );
  }

  // Supabase JOIN結果のキー名 "reservations" を フロントエンドが期待する "reservation" (単数形) に変換
  const raw = data as Record<string, unknown>;
  const { reservations, ...rest } = raw;
  const inquiry = { ...rest, reservation: reservations };
  return NextResponse.json({ data: inquiry, message: "OK" });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const authResult = await requireVendor(request);
  if (authResult instanceof NextResponse) return authResult;
  const { vendor, supabase } = authResult;

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

  const updateData: Record<string, unknown> = {};
  if (body.reply !== undefined) {
    updateData.reply = body.reply;
    updateData.replied_at = new Date().toISOString();
  }
  if (body.status !== undefined) updateData.status = body.status;

  if (isSandboxMode()) {
    sandboxLog("PUT /api/vendor/inquiries/[id]", `vendor=${vendor.id}, id=${id}`);
    return NextResponse.json({
      data: {
        id, vendor_id: vendor.id, reservation_id: "res_001",
        content: "返却時間を30分遅らせることは可能ですか？",
        reply: body.reply ?? null,
        status: body.status ?? "replied",
        created_at: "2025-01-15T10:30:00Z",
        replied_at: body.reply !== undefined ? new Date().toISOString() : null,
      },
      message: "問い合わせを更新しました",
    });
  }

  const { data, error } = await supabase
    .from("vendor_inquiries")
    .update(updateData)
    .eq("id", id)
    .eq("vendor_id", vendor.id)
    .select()
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: "Not found", message: "問い合わせが見つかりません" },
      { status: 404 }
    );
  }

  return NextResponse.json({ data, message: "問い合わせを更新しました" });
}

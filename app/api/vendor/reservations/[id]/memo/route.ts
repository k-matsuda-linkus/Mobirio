import { NextRequest, NextResponse } from "next/server";
import { requireVendor } from "@/lib/auth/requireAuth";
import { isSandboxMode, sandboxLog } from "@/lib/sandbox";

/**
 * PUT /api/vendor/reservations/[id]/memo
 * Update memo / customer notes for a reservation.
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

  const { vendor, supabase } = authResult;

  let body: { memo?: string; customer_note?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON", message: "リクエストボディが不正です" },
      { status: 400 }
    );
  }

  if (body.memo === undefined && body.customer_note === undefined) {
    return NextResponse.json(
      { error: "Bad request", message: "memo または customer_note が必要です" },
      { status: 400 }
    );
  }

  if (isSandboxMode()) {
    sandboxLog("PUT /api/vendor/reservations/[id]/memo", `id=${id}, vendor=${vendor.id}`);

    const updated = {
      id,
      vendor_id: vendor.id,
      memo: body.memo ?? null,
      customer_note: body.customer_note ?? null,
      updated_at: new Date().toISOString(),
    };

    return NextResponse.json({
      data: updated,
      message: "メモを更新しました",
    });
  }

  // 本番: Supabase
  // 予約が対象ベンダーのものか確認
  const { data: existing, error: fetchError } = await supabase
    .from("reservations")
    .select("id, vendor_id")
    .eq("id", id)
    .eq("vendor_id", vendor.id)
    .single();

  if (fetchError || !existing) {
    return NextResponse.json(
      { error: "Not found", message: "予約が見つかりません" },
      { status: 404 }
    );
  }

  const updateData: Record<string, unknown> = {};
  if (body.memo !== undefined) updateData.memo = body.memo;
  if (body.customer_note !== undefined) updateData.customer_note = body.customer_note;

  const { data: updated, error: updateError } = await supabase
    .from("reservations")
    .update(updateData)
    .eq("id", id)
    .select("id, vendor_id, memo, customer_note, updated_at")
    .single();

  if (updateError) {
    return NextResponse.json(
      { error: "Database error", message: updateError.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    data: updated,
    message: "メモを更新しました",
  });
}

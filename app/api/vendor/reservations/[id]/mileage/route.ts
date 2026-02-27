import { NextRequest, NextResponse } from "next/server";
import { requireVendor } from "@/lib/auth/requireAuth";
import { isSandboxMode, sandboxLog } from "@/lib/sandbox";

/**
 * PUT /api/vendor/reservations/[id]/mileage
 * Update mileage readings for a reservation.
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

  let body: { departure_mileage?: number; return_mileage?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON", message: "リクエストボディが不正です" },
      { status: 400 }
    );
  }

  if (body.departure_mileage === undefined && body.return_mileage === undefined) {
    return NextResponse.json(
      { error: "Bad request", message: "departure_mileage または return_mileage が必要です" },
      { status: 400 }
    );
  }

  if (
    (body.departure_mileage !== undefined && body.departure_mileage < 0) ||
    (body.return_mileage !== undefined && body.return_mileage < 0)
  ) {
    return NextResponse.json(
      { error: "Bad request", message: "走行距離は0以上の値を指定してください" },
      { status: 400 }
    );
  }

  if (
    body.departure_mileage !== undefined &&
    body.return_mileage !== undefined &&
    body.return_mileage < body.departure_mileage
  ) {
    return NextResponse.json(
      { error: "Bad request", message: "返却時走行距離は出発時走行距離以上の値を指定してください" },
      { status: 400 }
    );
  }

  if (isSandboxMode()) {
    sandboxLog("PUT /api/vendor/reservations/[id]/mileage", `id=${id}, vendor=${vendor.id}`);

    const updated = {
      id,
      vendor_id: vendor.id,
      departure_mileage: body.departure_mileage ?? null,
      return_mileage: body.return_mileage ?? null,
      updated_at: new Date().toISOString(),
    };

    return NextResponse.json({
      data: updated,
      message: "走行距離を更新しました",
    });
  }

  // 本番: Supabase
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
  if (body.departure_mileage !== undefined) updateData.departure_mileage = body.departure_mileage;
  if (body.return_mileage !== undefined) updateData.return_mileage = body.return_mileage;

  const { data: updated, error: updateError } = await supabase
    .from("reservations")
    .update(updateData)
    .eq("id", id)
    .select("id, vendor_id, departure_mileage, return_mileage, updated_at")
    .single();

  if (updateError) {
    return NextResponse.json(
      { error: "Database error", message: updateError.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    data: updated,
    message: "走行距離を更新しました",
  });
}

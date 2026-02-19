import { NextRequest, NextResponse } from "next/server";
import { requireVendor } from "@/lib/auth/requireAuth";
import type { Reservation } from "@/types/database";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const authResult = await requireVendor(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const { vendor, supabase } = authResult;

  const { data: reservationData, error } = await supabase
    .from("reservations")
    .select(
      `
      *,
      bike:bikes(id, name, model, manufacturer, image_urls),
      user:users(id, full_name, email, phone),
      reservation_options(
        id,
        quantity,
        unit_price,
        subtotal,
        option:options(id, name, description, category)
      ),
      payment:payments(id, amount, status, square_payment_id, created_at)
    `
    )
    .eq("id", id)
    .single();

  if (error || !reservationData) {
    return NextResponse.json(
      { error: "Not found", message: "予約が見つかりません" },
      { status: 404 }
    );
  }

  const reservation = reservationData as Reservation & { bike: unknown; user: unknown; reservation_options: unknown[]; payment: unknown };

  // Verify vendor owns this reservation
  if (reservation.vendor_id !== vendor.id) {
    return NextResponse.json(
      { error: "Forbidden", message: "この予約を閲覧する権限がありません" },
      { status: 403 }
    );
  }

  return NextResponse.json({ data: reservation, message: "OK" });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const authResult = await requireVendor(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const { vendor, supabase } = authResult;

  // Get existing reservation
  const { data: existingData, error: fetchError } = await supabase
    .from("reservations")
    .select("*")
    .eq("id", id)
    .single();

  if (fetchError || !existingData) {
    return NextResponse.json(
      { error: "Not found", message: "予約が見つかりません" },
      { status: 404 }
    );
  }

  const existingReservation = existingData as Reservation;

  // Verify vendor owns this reservation
  if (existingReservation.vendor_id !== vendor.id) {
    return NextResponse.json(
      { error: "Forbidden", message: "この予約を更新する権限がありません" },
      { status: 403 }
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON", message: "リクエストボディが不正です" },
      { status: 400 }
    );
  }

  // Vendors can only update notes
  const allowedFields = ["notes"];
  const updatePayload: { notes?: string; updated_at: string } = {
    updated_at: new Date().toISOString(),
  };

  for (const field of allowedFields) {
    if (body[field] !== undefined && field === "notes") {
      updatePayload.notes = body[field] as string;
    }
  }

  if (!updatePayload.notes) {
    return NextResponse.json(
      { error: "Bad request", message: "更新するフィールドがありません" },
      { status: 400 }
    );
  }

  const { data: updated, error: updateError } = await supabase
    .from("reservations")
    .update(updatePayload as any)
    .eq("id", id)
    .select()
    .single();

  if (updateError) {
    return NextResponse.json(
      { error: "Database error", message: updateError.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    message: "予約を更新しました",
    data: updated,
  });
}

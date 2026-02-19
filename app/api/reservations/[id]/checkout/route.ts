import { NextRequest, NextResponse } from "next/server";
import { requireVendor } from "@/lib/auth/requireAuth";
import { canTransition } from "@/lib/booking/status";
import type { Reservation, ReservationStatus } from "@/types/database";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const authResult = await requireVendor(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const { vendor, supabase } = authResult;

  // Get reservation with bike info for overtime calculation
  const { data: reservationData, error: fetchError } = await supabase
    .from("reservations")
    .select(
      `
      *,
      bike:bikes(overtime_rate_per_hour)
    `
    )
    .eq("id", id)
    .single();

  if (fetchError || !reservationData) {
    return NextResponse.json(
      { error: "Not found", message: "予約が見つかりません" },
      { status: 404 }
    );
  }

  const reservation = reservationData as Reservation & { bike: { overtime_rate_per_hour: number } | null };

  // Verify vendor owns this reservation
  if (reservation.vendor_id !== vendor.id) {
    return NextResponse.json(
      { error: "Forbidden", message: "この予約を操作する権限がありません" },
      { status: 403 }
    );
  }

  // Check if transition is valid (in_use -> completed)
  if (!canTransition(reservation.status as ReservationStatus, "completed")) {
    return NextResponse.json(
      {
        error: "Conflict",
        message: `現在のステータス「${reservation.status}」からチェックアウトへの変更はできません`,
      },
      { status: 409 }
    );
  }

  const checkoutAt = new Date().toISOString();

  // Calculate overtime if applicable
  let overtimeCharge = 0;
  const scheduledEnd = new Date(reservation.end_datetime);
  const actualEnd = new Date(checkoutAt);

  if (actualEnd > scheduledEnd) {
    const overtimeHours = Math.ceil(
      (actualEnd.getTime() - scheduledEnd.getTime()) / (1000 * 60 * 60)
    );
    const overtimeRate = reservation.bike?.overtime_rate_per_hour || 1000;
    overtimeCharge = overtimeHours * overtimeRate;
  }

  // Update reservation status
  const updateData: {
    status: ReservationStatus;
    checkout_at: string;
    updated_at: string;
    total_amount?: number;
  } = {
    status: "completed",
    checkout_at: checkoutAt,
    updated_at: checkoutAt,
  };

  if (overtimeCharge > 0) {
    updateData.total_amount = reservation.total_amount + overtimeCharge;
  }

  const { error: updateError } = await supabase
    .from("reservations")
    .update(updateData as any)
    .eq("id", id);

  if (updateError) {
    return NextResponse.json(
      { error: "Database error", message: updateError.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    message: "チェックアウトが完了しました",
    data: {
      id,
      status: "completed",
      checkout_at: checkoutAt,
      overtime_charge: overtimeCharge,
      final_total: reservation.total_amount + overtimeCharge,
    },
  });
}

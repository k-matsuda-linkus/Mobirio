import { NextRequest, NextResponse } from "next/server";
import { verifyCronSecret } from "@/lib/auth/requireAuth";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { subHours } from "date-fns";
import type { ReservationStatus } from "@/types/database";

export async function GET(request: NextRequest) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createServerSupabaseClient();

  // Find pending reservations older than 24 hours
  const cutoffTime = subHours(new Date(), 24).toISOString();

  const { data: pendingReservationsData, error: fetchError } = await supabase
    .from("reservations")
    .select("id, created_at")
    .eq("status", "pending")
    .lt("created_at", cutoffTime);

  if (fetchError) {
    return NextResponse.json(
      { error: "Database error", message: fetchError.message },
      { status: 500 }
    );
  }

  const pendingReservations = (pendingReservationsData || []) as { id: string; created_at: string }[];

  if (pendingReservations.length === 0) {
    return NextResponse.json({
      success: true,
      message: "No pending reservations to expire",
      processed: 0,
    });
  }

  const reservationIds = pendingReservations.map((r) => r.id);

  const updateData: {
    status: ReservationStatus;
    cancel_reason: string;
    cancelled_at: string;
    updated_at: string;
  } = {
    status: "cancelled",
    cancel_reason: "未決済により自動キャンセル",
    cancelled_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const { error: updateError } = await supabase
    .from("reservations")
    .update(updateData as any)
    .in("id", reservationIds);

  if (updateError) {
    return NextResponse.json(
      { error: "Database error", message: updateError.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    message: "Pending reservations expired",
    processed: reservationIds.length,
    expiredIds: reservationIds,
  });
}

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

  // Find confirmed reservations where start_datetime + 2 hours has passed and no checkin
  const cutoffTime = subHours(new Date(), 2).toISOString();

  const { data: noShowReservationsData, error: fetchError } = await supabase
    .from("reservations")
    .select("id, start_datetime")
    .eq("status", "confirmed")
    .lt("start_datetime", cutoffTime)
    .is("checkin_at", null);

  if (fetchError) {
    return NextResponse.json(
      { error: "Database error", message: fetchError.message },
      { status: 500 }
    );
  }

  const noShowReservations = (noShowReservationsData || []) as { id: string; start_datetime: string }[];

  if (noShowReservations.length === 0) {
    return NextResponse.json({
      success: true,
      message: "No no-shows to mark",
      processed: 0,
    });
  }

  const reservationIds = noShowReservations.map((r) => r.id);

  const updateData: {
    status: ReservationStatus;
    updated_at: string;
  } = {
    status: "no_show",
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
    message: "No-shows marked",
    processed: reservationIds.length,
    markedIds: reservationIds,
  });
}

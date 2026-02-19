import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/requireAuth";
import { canTransition } from "@/lib/booking/status";
import type { Reservation, ReservationStatus } from "@/types/database";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const { user, supabase } = authResult;

  // Get reservation
  const { data, error: fetchError } = await supabase
    .from("reservations")
    .select(
      `
      *,
      bike:bikes(name),
      user:users(email, full_name),
      vendor:vendors(contact_email, name)
    `
    )
    .eq("id", id)
    .single();

  if (fetchError || !data) {
    return NextResponse.json(
      { error: "Not found", message: "予約が見つかりません" },
      { status: 404 }
    );
  }

  const reservation = data as unknown as Reservation & { bike: { name: string }; user: { email: string; full_name: string }; vendor: { contact_email: string; name: string } };

  // Authorization: only owner, vendor, or admin can cancel
  const isOwner = reservation.user_id === user.id;
  const isVendor = user.role === "vendor";
  const isAdmin = user.role === "admin";

  if (!isOwner && !isVendor && !isAdmin) {
    return NextResponse.json(
      { error: "Forbidden", message: "この予約をキャンセルする権限がありません" },
      { status: 403 }
    );
  }

  // Check if transition is valid
  if (!canTransition(reservation.status as ReservationStatus, "cancelled")) {
    return NextResponse.json(
      {
        error: "Conflict",
        message: `現在のステータス「${reservation.status}」からキャンセルへの変更はできません`,
      },
      { status: 409 }
    );
  }

  let body: { reason?: string } = {};
  try {
    body = await request.json();
  } catch {
    // Optional body, ignore parse errors
  }

  const cancelReason = body.reason || null;

  // Update reservation status
  const updateData: {
    status: ReservationStatus;
    cancel_reason: string | null;
    cancelled_at: string;
    updated_at: string;
  } = {
    status: "cancelled",
    cancel_reason: cancelReason,
    cancelled_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

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

  // If payments exist, handle refund (will be implemented in Phase 2)
  // payment_settlement はトリガーで自動更新される
  if (reservation.payment_settlement && reservation.payment_settlement !== "unpaid") {
    console.log(`Refund needed for reservation: ${id}, settlement: ${reservation.payment_settlement}`);
  }

  return NextResponse.json({
    success: true,
    message: "予約をキャンセルしました",
    data: {
      id,
      status: "cancelled",
      cancelled_at: new Date().toISOString(),
    },
  });
}

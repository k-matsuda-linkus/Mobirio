import { NextRequest, NextResponse } from "next/server";
import { requireVendor } from "@/lib/auth/requireAuth";
import { isSandboxMode, sandboxLog } from "@/lib/sandbox";
import { mockReservations } from "@/lib/mock/reservations";
import { canTransition } from "@/lib/booking/status";
import { createNotification } from "@/lib/notifications";
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

  // Sandbox モード
  if (isSandboxMode()) {
    sandboxLog("POST /api/reservations/[id]/checkin", `id=${id}, vendor=${vendor.id}`);

    const reservation = mockReservations.find((r) => r.id === id);
    if (!reservation) {
      return NextResponse.json(
        { error: "Not found", message: "予約が見つかりません" },
        { status: 404 }
      );
    }

    if (reservation.vendor_id !== vendor.id) {
      return NextResponse.json(
        { error: "Forbidden", message: "この予約を操作する権限がありません" },
        { status: 403 }
      );
    }

    if (!canTransition(reservation.status as ReservationStatus, "in_use")) {
      return NextResponse.json(
        {
          error: "Conflict",
          message: `現在のステータス「${reservation.status}」からチェックインへの変更はできません`,
        },
        { status: 409 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "チェックインが完了しました",
      data: {
        id,
        status: "in_use",
        checkin_at: new Date().toISOString(),
      },
    });
  }

  // Supabase モード
  // Get reservation
  const { data, error: fetchError } = await supabase
    .from("reservations")
    .select("*")
    .eq("id", id)
    .single();

  if (fetchError || !data) {
    return NextResponse.json(
      { error: "Not found", message: "予約が見つかりません" },
      { status: 404 }
    );
  }

  const reservation = data as Reservation;

  // Verify vendor owns this reservation
  if (reservation.vendor_id !== vendor.id) {
    return NextResponse.json(
      { error: "Forbidden", message: "この予約を操作する権限がありません" },
      { status: 403 }
    );
  }

  // Check if transition is valid (confirmed -> in_use)
  if (!canTransition(reservation.status as ReservationStatus, "in_use")) {
    return NextResponse.json(
      {
        error: "Conflict",
        message: `現在のステータス「${reservation.status}」からチェックインへの変更はできません`,
      },
      { status: 409 }
    );
  }

  const checkinAt = new Date().toISOString();

  // Update reservation status
  const updateData: {
    status: ReservationStatus;
    checkin_at: string;
    updated_at: string;
  } = {
    status: "in_use",
    checkin_at: checkinAt,
    updated_at: checkinAt,
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

  // ユーザーへ: アプリ内通知
  try {
    createNotification(supabase, {
      userId: reservation.user_id,
      type: "booking_confirmed",
      title: "チェックインが完了しました",
      body: "ご利用ありがとうございます。安全運転でお楽しみください。",
      link: `/mypage/reservations/${id}`,
    }).catch((e) => console.error("Failed to create checkin notification:", e));
  } catch (e) {
    console.error("Failed to send checkin notification:", e);
  }

  return NextResponse.json({
    success: true,
    message: "チェックインが完了しました",
    data: {
      id,
      status: "in_use",
      checkin_at: checkinAt,
    },
  });
}

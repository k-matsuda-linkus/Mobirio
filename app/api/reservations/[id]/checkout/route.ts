import { NextRequest, NextResponse } from "next/server";
import { requireVendor } from "@/lib/auth/requireAuth";
import { isSandboxMode, sandboxLog } from "@/lib/sandbox";
import { mockReservations } from "@/lib/mock/reservations";
import { canTransition } from "@/lib/booking/status";
import { createNotification } from "@/lib/notifications";
import { sendEmail, reviewRequestEmail } from "@/lib/email";
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
    sandboxLog("POST /api/reservations/[id]/checkout", `id=${id}, vendor=${vendor.id}`);

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

    if (!canTransition(reservation.status as ReservationStatus, "completed")) {
      return NextResponse.json(
        {
          error: "Conflict",
          message: `現在のステータス「${reservation.status}」からチェックアウトへの変更はできません`,
        },
        { status: 409 }
      );
    }

    // 超過料金計算（モック）
    const checkoutAt = new Date().toISOString();
    const scheduledEnd = new Date(reservation.end_datetime);
    const actualEnd = new Date(checkoutAt);
    let overtimeCharge = 0;

    if (actualEnd > scheduledEnd) {
      const overtimeHours = Math.ceil(
        (actualEnd.getTime() - scheduledEnd.getTime()) / (1000 * 60 * 60)
      );
      overtimeCharge = overtimeHours * 1000; // モックレート: ¥1,000/時間
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

  // Supabase モード
  // Get reservation with bike info and user info
  const { data: reservationData, error: fetchError } = await supabase
    .from("reservations")
    .select(
      `
      *,
      bike:bikes(name, overtime_rate_per_hour),
      user:users(email, full_name)
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

  const reservation = reservationData as Reservation & {
    bike: { name: string; overtime_rate_per_hour: number } | null;
    user: { email: string; full_name: string } | null;
  };

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
  const updateData: Record<string, unknown> = {
    status: "completed" as ReservationStatus,
    checkout_at: checkoutAt,
    updated_at: checkoutAt,
  };

  if (overtimeCharge > 0) {
    updateData.total_amount = reservation.total_amount + overtimeCharge;
    updateData.overtime_charge = overtimeCharge;
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

  // メール・通知送信
  try {
    const userName = reservation.user?.full_name || "お客様";
    const userEmail = reservation.user?.email;
    const bikeName = reservation.bike?.name || "";

    // ユーザーへ: アプリ内通知
    const notifBody = overtimeCharge > 0
      ? `チェックアウトが完了しました。超過料金: ¥${overtimeCharge.toLocaleString()}`
      : "チェックアウトが完了しました。ご利用ありがとうございました。";

    createNotification(supabase, {
      userId: reservation.user_id,
      type: "booking_confirmed",
      title: "チェックアウトが完了しました",
      body: notifBody,
      link: `/mypage/reservations/${id}`,
    }).catch((e) => console.error("Failed to create checkout notification:", e));

    // ユーザーへ: レビュー依頼メール
    if (userEmail) {
      const review = reviewRequestEmail({
        userName,
        bikeName,
        reservationId: id,
      });
      sendEmail({ to: userEmail, template: review }).catch((e) =>
        console.error("Failed to send review request email:", e)
      );
    }
  } catch (e) {
    console.error("Failed to send checkout notifications:", e);
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

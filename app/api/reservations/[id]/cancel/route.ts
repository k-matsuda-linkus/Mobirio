import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/requireAuth";
import { isSandboxMode, sandboxLog } from "@/lib/sandbox";
import { mockReservations } from "@/lib/mock/reservations";
import { canTransition } from "@/lib/booking/status";
import { refundPayment } from "@/lib/square/client";
import { createNotification } from "@/lib/notifications";
import {
  sendEmail,
  bookingCancellationEmail,
  vendorCancellationEmail,
} from "@/lib/email";
import type { Reservation, ReservationStatus, PaymentStatus } from "@/types/database";

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

  let body: { reason?: string } = {};
  try {
    body = await request.json();
  } catch {
    // Optional body, ignore parse errors
  }

  // Sandbox モード
  if (isSandboxMode()) {
    sandboxLog("POST /api/reservations/[id]/cancel", `id=${id}, user=${user.id}`);

    const reservation = mockReservations.find((r) => r.id === id);
    if (!reservation) {
      return NextResponse.json(
        { error: "Not found", message: "予約が見つかりません" },
        { status: 404 }
      );
    }

    const isOwner = reservation.user_id === user.id;
    const isVendor = user.role === "vendor";
    const isAdmin = user.role === "admin";

    if (!isOwner && !isVendor && !isAdmin) {
      return NextResponse.json(
        { error: "Forbidden", message: "この予約をキャンセルする権限がありません" },
        { status: 403 }
      );
    }

    if (!canTransition(reservation.status as ReservationStatus, "cancelled")) {
      return NextResponse.json(
        {
          error: "Conflict",
          message: `現在のステータス「${reservation.status}」からキャンセルへの変更はできません`,
        },
        { status: 409 }
      );
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

  // Supabase モード
  // Get reservation with related data
  const { data, error: fetchError } = await supabase
    .from("reservations")
    .select(
      `
      *,
      bike:bikes(name),
      user:users(email, full_name),
      vendor:vendors(contact_email, name, user_id),
      payment:payments(*)
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

  const reservation = data as unknown as Reservation & {
    bike: { name: string };
    user: { email: string; full_name: string };
    vendor: { contact_email: string; name: string; user_id: string };
    payment: Array<{ id: string; square_payment_id: string | null; amount: number; refund_amount: number; status: PaymentStatus }>;
  };

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

  // 決済済み予約の場合、自動返金処理
  let refundResult = null;
  const payments = Array.isArray(reservation.payment) ? reservation.payment : [];
  const paidPayment = payments.find(
    (p) => p.square_payment_id && p.status === "completed"
  );

  if (paidPayment) {
    const refundableAmount = paidPayment.amount - (paidPayment.refund_amount || 0);
    if (refundableAmount > 0) {
      try {
        refundResult = await refundPayment({
          paymentId: paidPayment.square_payment_id!,
          amount: refundableAmount,
          reason: cancelReason || "予約キャンセルによる返金",
        });

        if (refundResult.success) {
          // Update payment record
          await supabase
            .from("payments")
            .update({
              refund_amount: paidPayment.amount,
              status: "refunded" as PaymentStatus,
              updated_at: new Date().toISOString(),
            } as any)
            .eq("id", paidPayment.id);
        } else {
          console.error("Auto-refund failed for cancelled reservation:", {
            reservationId: id,
            error: refundResult.error,
          });
        }
      } catch (e) {
        console.error("Auto-refund exception:", e);
      }
    }
  }

  // メール・通知送信
  try {
    const userName = reservation.user?.full_name || "お客様";
    const userEmail = reservation.user?.email;
    const vendorName = reservation.vendor?.name || "";
    const vendorEmail = reservation.vendor?.contact_email;
    const bikeName = reservation.bike?.name || "";

    // ユーザーへ: キャンセルメール
    if (userEmail) {
      const cancelEmail = bookingCancellationEmail({
        userName,
        bikeName,
        reservationId: id,
      });
      sendEmail({ to: userEmail, template: cancelEmail }).catch((e) =>
        console.error("Failed to send cancellation email:", e)
      );
    }

    // ベンダーへ: キャンセル通知メール
    if (vendorEmail) {
      const vendorCancel = vendorCancellationEmail({
        vendorName,
        customerName: userName,
        bikeName,
        reservationId: id,
      });
      sendEmail({ to: vendorEmail, template: vendorCancel }).catch((e) =>
        console.error("Failed to send vendor cancellation email:", e)
      );
    }

    // ユーザーへ: アプリ内通知
    const notifBody = refundResult?.success
      ? `${bikeName} の予約がキャンセルされました。返金処理を開始しました。`
      : `${bikeName} の予約がキャンセルされました。`;

    createNotification(supabase, {
      userId: reservation.user_id,
      type: "booking_cancelled",
      title: "予約がキャンセルされました",
      body: notifBody,
      link: `/mypage/reservations/${id}`,
    }).catch((e) => console.error("Failed to create cancel notification:", e));

    // ベンダーへ: アプリ内通知
    if (reservation.vendor?.user_id) {
      createNotification(supabase, {
        userId: reservation.vendor.user_id,
        type: "booking_cancelled",
        title: "予約がキャンセルされました",
        body: `${userName} 様の ${bikeName} の予約がキャンセルされました。`,
        link: `/vendor/reservations/${id}`,
      }).catch((e) => console.error("Failed to create vendor cancel notification:", e));
    }
  } catch (e) {
    console.error("Failed to send cancellation notifications:", e);
  }

  const refundFailed = paidPayment && (!refundResult || !refundResult.success);

  return NextResponse.json({
    success: true,
    message: refundFailed
      ? "予約をキャンセルしました。返金処理に失敗したため、サポートにお問い合わせください。"
      : "予約をキャンセルしました",
    data: {
      id,
      status: "cancelled",
      cancelled_at: new Date().toISOString(),
      refund: refundResult?.success
        ? { refundId: refundResult.refundId, amount: paidPayment?.amount }
        : null,
      refundFailed: !!refundFailed,
    },
  });
}

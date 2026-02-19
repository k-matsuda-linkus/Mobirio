import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/requireAuth";
import { refundPayment } from "@/lib/square/client";
import type { Reservation, Payment, PaymentStatus } from "@/types/database";

interface ReservationWithPayment extends Reservation {
  payment: Payment[] | Payment | null;
}

export async function POST(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const { user, supabase } = authResult;

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON", message: "リクエストボディが不正です" },
      { status: 400 }
    );
  }

  const { reservationId, amount, reason } = body;

  if (!reservationId) {
    return NextResponse.json(
      { error: "Bad request", message: "reservationId は必須です" },
      { status: 400 }
    );
  }

  // Get reservation with payment info
  const { data: reservationData, error: fetchError } = await supabase
    .from("reservations")
    .select(
      `
      *,
      payment:payments(*)
    `
    )
    .eq("id", reservationId)
    .single();

  if (fetchError || !reservationData) {
    return NextResponse.json(
      { error: "Not found", message: "予約が見つかりません" },
      { status: 404 }
    );
  }

  const reservation = reservationData as ReservationWithPayment;

  // Authorization: only owner or admin can request refund
  if (reservation.user_id !== user.id && user.role !== "admin") {
    return NextResponse.json(
      { error: "Forbidden", message: "返金を要求する権限がありません" },
      { status: 403 }
    );
  }

  // Check if payment exists
  const paymentRecord = Array.isArray(reservation.payment)
    ? reservation.payment[0]
    : reservation.payment;

  if (!paymentRecord || !paymentRecord.square_payment_id) {
    return NextResponse.json(
      { error: "Not found", message: "この予約には決済記録がありません" },
      { status: 404 }
    );
  }

  const payment = paymentRecord as Payment;

  // Check payment status
  if (payment.status === "refunded") {
    return NextResponse.json(
      { error: "Conflict", message: "この決済は既に全額返金済みです" },
      { status: 409 }
    );
  }

  // Calculate refund amount
  const refundAmount = amount || payment.amount;
  const alreadyRefunded = payment.refund_amount || 0;
  const maxRefundable = payment.amount - alreadyRefunded;

  if (refundAmount > maxRefundable) {
    return NextResponse.json(
      {
        error: "Bad request",
        message: `返金可能額を超えています。最大: ¥${maxRefundable.toLocaleString()}`,
      },
      { status: 400 }
    );
  }

  // Execute refund via Square
  const refundResult = await refundPayment({
    paymentId: payment.square_payment_id!, // Already checked for null above
    amount: refundAmount,
    reason: reason || "Customer requested refund",
  });

  if (!refundResult.success) {
    return NextResponse.json(
      {
        error: "Refund failed",
        message: refundResult.error || "返金処理に失敗しました",
      },
      { status: 400 }
    );
  }

  // Update payment record
  const newRefundAmount = alreadyRefunded + refundAmount;
  const newStatus: PaymentStatus = newRefundAmount >= payment.amount ? "refunded" : "partially_refunded";

  const paymentUpdate: {
    refund_amount: number;
    status: PaymentStatus;
    updated_at: string;
  } = {
    refund_amount: newRefundAmount,
    status: newStatus,
    updated_at: new Date().toISOString(),
  };

  const { error: updateError } = await supabase
    .from("payments")
    .update(paymentUpdate as any)
    .eq("id", payment.id);

  if (updateError) {
    console.error("Failed to update payment record:", updateError);
  }

  return NextResponse.json({
    success: true,
    message: "返金が完了しました",
    data: {
      refundId: refundResult.refundId,
      refundAmount,
      totalRefunded: newRefundAmount,
      paymentStatus: newStatus,
    },
  });
}

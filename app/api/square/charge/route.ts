import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/requireAuth";
import { isSandboxMode, sandboxLog } from "@/lib/sandbox";
import { mockReservations } from "@/lib/mock/reservations";
import { createPayment } from "@/lib/square/client";
import { createNotification } from "@/lib/notifications";
import {
  sendEmail,
  paymentReceiptEmail,
  bookingConfirmationEmail,
  vendorNewBookingEmail,
} from "@/lib/email";
import type { Reservation, Payment, ReservationStatus, PaymentStatus } from "@/types/database";

interface ReservationWithRelations extends Reservation {
  bike: { name: string } | null;
  vendor: { id: string; name: string; square_location_id: string | null; contact_email?: string } | null;
  user: { email: string; full_name: string } | null;
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

  const { reservationId, sourceId } = body;

  if (!reservationId || !sourceId) {
    return NextResponse.json(
      { error: "Bad request", message: "reservationId と sourceId は必須です" },
      { status: 400 }
    );
  }

  // Sandbox モード
  if (isSandboxMode()) {
    sandboxLog("POST /api/square/charge", `reservationId=${reservationId}, user=${user.id}`);

    const reservation = mockReservations.find((r) => r.id === reservationId);
    if (!reservation) {
      return NextResponse.json(
        { error: "Not found", message: "予約が見つかりません" },
        { status: 404 }
      );
    }

    if (reservation.user_id !== user.id) {
      return NextResponse.json(
        { error: "Forbidden", message: "この予約の決済を行う権限がありません" },
        { status: 403 }
      );
    }

    if (reservation.status !== "pending") {
      return NextResponse.json(
        {
          error: "Conflict",
          message: `この予約はすでに ${reservation.status} 状態です`,
        },
        { status: 409 }
      );
    }

    if (reservation.payment_settlement === "paid") {
      return NextResponse.json(
        { error: "Conflict", message: "この予約は既に決済済みです" },
        { status: 409 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "決済が完了しました",
      data: {
        paymentId: `pay-sandbox-${Date.now()}`,
        squarePaymentId: `sq-sandbox-${Date.now()}`,
        amount: reservation.total_amount,
        reservationStatus: "confirmed",
      },
    });
  }

  // Supabase モード
  // Get reservation with user and vendor info for email/notification
  const { data: reservationData, error: fetchError } = await supabase
    .from("reservations")
    .select(
      `
      *,
      bike:bikes(name),
      vendor:vendors(id, name, square_location_id, contact_email),
      user:users(email, full_name)
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

  const reservation = reservationData as unknown as ReservationWithRelations;

  // Verify reservation belongs to user
  if (reservation.user_id !== user.id) {
    return NextResponse.json(
      { error: "Forbidden", message: "この予約の決済を行う権限がありません" },
      { status: 403 }
    );
  }

  // Check reservation is in pending status
  if (reservation.status !== "pending") {
    return NextResponse.json(
      {
        error: "Conflict",
        message: `この予約はすでに ${reservation.status} 状態です`,
      },
      { status: 409 }
    );
  }

  // Check if already fully paid
  if (reservation.payment_settlement === "paid") {
    return NextResponse.json(
      { error: "Conflict", message: "この予約は既に決済済みです" },
      { status: 409 }
    );
  }

  // Execute payment via Square
  const paymentResult = await createPayment({
    sourceId,
    amount: reservation.total_amount,
    reservationId,
    note: `Mobirio予約: ${reservation.bike?.name || reservationId}`,
  });

  if (!paymentResult.success) {
    return NextResponse.json(
      {
        error: "Payment failed",
        message: paymentResult.error || "決済処理に失敗しました",
      },
      { status: 400 }
    );
  }

  // Create payment record
  const paymentInsert: {
    reservation_id: string;
    vendor_id: string;
    payment_type: "ec_credit";
    square_payment_id: string | null;
    square_order_id: string | null;
    square_location_id: string | null;
    amount: number;
    currency: string;
    status: PaymentStatus;
    square_response: unknown;
  } = {
    reservation_id: reservationId,
    vendor_id: reservation.vendor_id,
    payment_type: "ec_credit",
    square_payment_id: paymentResult.paymentId || null,
    square_order_id: paymentResult.orderId || null,
    square_location_id: process.env.SQUARE_LOCATION_ID || null,
    amount: reservation.total_amount,
    currency: "JPY",
    status: "completed",
    square_response: paymentResult.rawResponse,
  };

  const { data: paymentData, error: paymentError } = await supabase
    .from("payments")
    .insert(paymentInsert as any)
    .select()
    .single();

  if (paymentError) {
    // Payment succeeded but DB insert failed - log for manual reconciliation
    console.error("Payment succeeded but DB insert failed:", {
      reservationId,
      paymentId: paymentResult.paymentId,
      error: paymentError,
    });

    return NextResponse.json(
      {
        error: "Database error",
        message: "決済は成功しましたが、記録に失敗しました。サポートにお問い合わせください。",
        paymentId: paymentResult.paymentId,
      },
      { status: 500 }
    );
  }

  const payment = paymentData as Payment;

  // Update reservation status to confirmed
  // payment_settlement はトリガーで自動更新される
  const reservationUpdate: {
    status: ReservationStatus;
    updated_at: string;
  } = {
    status: "confirmed",
    updated_at: new Date().toISOString(),
  };

  const { error: updateError } = await supabase
    .from("reservations")
    .update(reservationUpdate as any)
    .eq("id", reservationId);

  if (updateError) {
    console.error("Failed to update reservation status:", updateError);
  }

  // メール・通知送信（エラーがあってもレスポンスは返す）
  try {
    const userName = reservation.user?.full_name || "お客様";
    const userEmail = reservation.user?.email;
    const vendorName = reservation.vendor?.name || "";
    const vendorEmail = reservation.vendor?.contact_email;
    const bikeName = reservation.bike?.name || "";
    const now = new Date();

    // ユーザーへ: 領収書メール
    if (userEmail) {
      const receipt = paymentReceiptEmail({
        userName,
        amount: reservation.total_amount,
        paymentDate: now.toLocaleDateString("ja-JP"),
        reservationId,
      });
      sendEmail({ to: userEmail, template: receipt }).catch((e) =>
        console.error("Failed to send receipt email:", e)
      );

      // ユーザーへ: 予約確定メール
      const confirmation = bookingConfirmationEmail({
        userName,
        bikeName,
        vendorName,
        startDate: reservation.start_datetime,
        endDate: reservation.end_datetime,
        totalAmount: reservation.total_amount,
      });
      sendEmail({ to: userEmail, template: confirmation }).catch((e) =>
        console.error("Failed to send confirmation email:", e)
      );
    }

    // ベンダーへ: 新規予約通知メール
    if (vendorEmail) {
      const vendorNotif = vendorNewBookingEmail({
        vendorName,
        customerName: userName,
        bikeName,
        startDate: reservation.start_datetime,
      });
      sendEmail({ to: vendorEmail, template: vendorNotif }).catch((e) =>
        console.error("Failed to send vendor booking email:", e)
      );
    }

    // ユーザーへ: アプリ内通知
    createNotification(supabase, {
      userId: user.id,
      type: "booking_confirmed",
      title: "予約が確定しました",
      body: `${bikeName} の予約が確定しました。`,
      link: `/mypage/reservations/${reservationId}`,
    }).catch((e) => console.error("Failed to create user notification:", e));

    // ベンダーへ: アプリ内通知（vendor の user_id が必要）
    if (reservation.vendor?.id) {
      const { data: vendorUser } = await supabase
        .from("vendors")
        .select("user_id")
        .eq("id", reservation.vendor.id)
        .single();

      if (vendorUser?.user_id) {
        createNotification(supabase, {
          userId: vendorUser.user_id,
          type: "booking_confirmed",
          title: "新規予約が入りました",
          body: `${userName} 様から ${bikeName} の予約が入りました。`,
          link: `/vendor/reservations/${reservationId}`,
        }).catch((e) => console.error("Failed to create vendor notification:", e));
      }
    }
  } catch (e) {
    console.error("Failed to send notifications:", e);
  }

  return NextResponse.json({
    success: true,
    message: "決済が完了しました",
    data: {
      paymentId: payment.id,
      squarePaymentId: paymentResult.paymentId,
      amount: reservation.total_amount,
      reservationStatus: "confirmed",
    },
  });
}

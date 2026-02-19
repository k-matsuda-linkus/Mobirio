import { NextRequest, NextResponse } from "next/server";
import { verifyCronSecret } from "@/lib/auth/requireAuth";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email/send";
import { reviewRequestEmail } from "@/lib/email/reviewRequest";
import { subDays, format } from "date-fns";

interface ReviewReservation {
  id: string;
  checkout_at: string | null;
  user: { id: string; email: string; full_name: string | null } | null;
  bike: { name: string } | null;
}

export async function GET(request: NextRequest) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createServerSupabaseClient();

  // Find completed reservations from 1-2 days ago without a review
  const twoDaysAgo = subDays(new Date(), 2);
  const oneDayAgo = subDays(new Date(), 1);

  const startDate = format(twoDaysAgo, "yyyy-MM-dd") + "T00:00:00";
  const endDate = format(oneDayAgo, "yyyy-MM-dd") + "T23:59:59";

  const { data: completedReservationsData, error: fetchError } = await supabase
    .from("reservations")
    .select(
      `
      id,
      checkout_at,
      user:users(id, email, full_name),
      bike:bikes(name)
    `
    )
    .eq("status", "completed")
    .gte("checkout_at", startDate)
    .lte("checkout_at", endDate);

  if (fetchError) {
    return NextResponse.json(
      { error: "Database error", message: fetchError.message },
      { status: 500 }
    );
  }

  const completedReservations = (completedReservationsData || []) as ReviewReservation[];

  if (completedReservations.length === 0) {
    return NextResponse.json({
      success: true,
      message: "No review reminders to send",
      processed: 0,
    });
  }

  // Get existing reviews for these reservations
  const reservationIds = completedReservations.map((r) => r.id);
  const { data: existingReviewsData } = await supabase
    .from("reviews")
    .select("reservation_id")
    .in("reservation_id", reservationIds);

  const existingReviews = (existingReviewsData || []) as { reservation_id: string }[];
  const reviewedIds = new Set(existingReviews.map((r) => r.reservation_id));

  // Filter to only unreview reservations
  const unreviewedReservations = completedReservations.filter(
    (r) => !reviewedIds.has(r.id)
  );

  let sent = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const reservation of unreviewedReservations) {
    const userEmail = reservation.user?.email;
    const userName = reservation.user?.full_name || "お客様";
    const bikeName = reservation.bike?.name || "バイク";

    if (!userEmail) {
      failed++;
      errors.push(`No email for reservation ${reservation.id}`);
      continue;
    }

    const template = reviewRequestEmail({
      userName,
      bikeName,
      reservationId: reservation.id,
    });

    const result = await sendEmail({ to: userEmail, template });

    if (result.success) {
      sent++;
    } else {
      failed++;
      errors.push(`Failed to send to ${userEmail}: ${result.error}`);
    }
  }

  return NextResponse.json({
    success: true,
    message: "Review reminders sent",
    processed: unreviewedReservations.length,
    sent,
    failed,
    errors: errors.slice(0, 10),
  });
}

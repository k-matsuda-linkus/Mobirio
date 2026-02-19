import { NextRequest, NextResponse } from "next/server";
import { verifyCronSecret } from "@/lib/auth/requireAuth";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email/send";
import { bookingReminderEmail } from "@/lib/email/bookingReminder";
import { addDays, format } from "date-fns";

interface ReminderReservation {
  id: string;
  start_datetime: string;
  user: { id: string; email: string; full_name: string | null } | null;
  bike: { name: string } | null;
  vendor: { name: string } | null;
}

export async function GET(request: NextRequest) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createServerSupabaseClient();

  // Find reservations starting in 3 days
  const now = new Date();
  const targetDate = addDays(now, 3);
  const targetStart = format(targetDate, "yyyy-MM-dd") + "T00:00:00";
  const targetEnd = format(targetDate, "yyyy-MM-dd") + "T23:59:59";

  const { data: reservationsData, error } = await supabase
    .from("reservations")
    .select(
      `
      id,
      start_datetime,
      user:users(id, email, full_name),
      bike:bikes(name),
      vendor:vendors(name)
    `
    )
    .eq("status", "confirmed")
    .gte("start_datetime", targetStart)
    .lte("start_datetime", targetEnd);

  if (error) {
    return NextResponse.json(
      { error: "Database error", message: error.message },
      { status: 500 }
    );
  }

  const reservations = (reservationsData || []) as ReminderReservation[];

  let sent = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const reservation of reservations) {
    const userEmail = reservation.user?.email;
    const userName = reservation.user?.full_name || "お客様";
    const bikeName = reservation.bike?.name || "バイク";
    const vendorName = reservation.vendor?.name || "店舗";
    const startDate = format(new Date(reservation.start_datetime), "yyyy年M月d日 HH:mm");

    if (!userEmail) {
      failed++;
      errors.push(`No email for reservation ${reservation.id}`);
      continue;
    }

    const template = bookingReminderEmail({
      userName,
      bikeName,
      vendorName,
      startDate,
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
    message: "Booking reminders sent",
    processed: (reservations || []).length,
    sent,
    failed,
    errors: errors.slice(0, 10),
  });
}

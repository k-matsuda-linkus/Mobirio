import { NextRequest, NextResponse } from "next/server";
import { requireVendor } from "@/lib/auth/requireAuth";
import { isSandboxMode, sandboxLog } from "@/lib/sandbox";
import { mockReservations } from "@/lib/mock/reservations";

/**
 * GET /api/vendor/reservations/export
 * Export reservation data as CSV-ready JSON.
 * Query params: date_type (start|end|completed), from, to, fields (comma-separated)
 */
export async function GET(request: NextRequest) {
  const authResult = await requireVendor(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const { vendor, supabase } = authResult;
  const searchParams = request.nextUrl.searchParams;
  const dateType = searchParams.get("date_type") || "start";
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const fieldsParam = searchParams.get("fields");

  if (!from || !to) {
    return NextResponse.json(
      { error: "Bad request", message: "from と to は必須です" },
      { status: 400 }
    );
  }

  const validDateTypes = ["start", "end", "completed"];
  if (!validDateTypes.includes(dateType)) {
    return NextResponse.json(
      { error: "Bad request", message: "date_type は start, end, completed のいずれかを指定してください" },
      { status: 400 }
    );
  }

  const allFields = [
    "reservation_id", "status", "bike_name", "user_name", "user_email", "user_phone",
    "start_datetime", "end_datetime", "rental_days", "rental_amount", "option_amount",
    "insurance_amount", "total_amount", "payment_status", "confirmed_at", "completed_at",
    "cancelled_at", "notes",
  ];

  const requestedFields = fieldsParam ? fieldsParam.split(",").map((f) => f.trim()) : null;
  const fieldsToExport = requestedFields
    ? allFields.filter((f) => requestedFields.includes(f))
    : allFields;

  if (isSandboxMode()) {
    sandboxLog("GET /api/vendor/reservations/export", `vendor=${vendor.id}, from=${from}, to=${to}`);

    const dateField = dateType === "end" ? "end_datetime" : "start_datetime";
    const vendorRsvs = mockReservations
      .filter((r) => r.vendor_id === vendor.id)
      .filter((r) => {
        const val = (r as any)[dateField] || "";
        return val >= from && val <= to + "T23:59:59";
      });

    const records = vendorRsvs.map((r) => {
      const full: Record<string, unknown> = {
        reservation_id: r.id,
        status: r.status,
        bike_name: r.bikeName,
        user_name: r.user_id,
        user_email: "",
        user_phone: "",
        start_datetime: r.start_datetime,
        end_datetime: r.end_datetime,
        rental_days: 1,
        rental_amount: r.base_amount,
        option_amount: r.option_amount,
        insurance_amount: r.insurance_amount,
        total_amount: r.total_amount,
        payment_status: r.payment_settlement,
        confirmed_at: null,
        completed_at: null,
        cancelled_at: null,
        notes: "",
      };
      const filtered: Record<string, unknown> = {};
      for (const field of fieldsToExport) {
        if (field in full) filtered[field] = full[field];
      }
      return filtered;
    });

    return NextResponse.json({
      data: records,
      fields: fieldsToExport,
      filters: { date_type: dateType, from, to },
      vendor_id: vendor.id,
      total: records.length,
      message: "OK",
    });
  }

  // 本番: Supabase
  const dateColumn = dateType === "end" ? "end_datetime" : dateType === "completed" ? "checkout_at" : "start_datetime";

  const { data: reservations, error } = await supabase
    .from("reservations")
    .select("*, bikes(name), users:user_id(full_name, email, phone)")
    .eq("vendor_id", vendor.id)
    .gte(dateColumn, from)
    .lte(dateColumn, to + "T23:59:59")
    .order(dateColumn, { ascending: false });

  if (error) {
    return NextResponse.json(
      { error: "Database error", message: error.message },
      { status: 500 }
    );
  }

  const rsvList = reservations || [];

  const records = rsvList.map((r: any) => {
    const startDt = r.start_datetime ? new Date(r.start_datetime) : null;
    const endDt = r.end_datetime ? new Date(r.end_datetime) : null;
    const rentalDays = startDt && endDt
      ? Math.max(1, Math.ceil((endDt.getTime() - startDt.getTime()) / (1000 * 60 * 60 * 24)))
      : 0;

    const full: Record<string, unknown> = {
      reservation_id: r.id,
      status: r.status,
      bike_name: r.bikes?.name || "",
      user_name: r.users?.full_name || "",
      user_email: r.users?.email || "",
      user_phone: r.users?.phone || "",
      start_datetime: r.start_datetime,
      end_datetime: r.end_datetime,
      rental_days: rentalDays,
      rental_amount: r.base_amount || 0,
      option_amount: r.option_amount || 0,
      insurance_amount: r.insurance_amount || 0,
      total_amount: r.total_amount || 0,
      payment_status: r.payment_settlement,
      confirmed_at: r.confirmed_at,
      completed_at: r.checkout_at,
      cancelled_at: r.cancelled_at,
      notes: r.notes || "",
    };

    const filtered: Record<string, unknown> = {};
    for (const field of fieldsToExport) {
      if (field in full) filtered[field] = full[field];
    }
    return filtered;
  });

  return NextResponse.json({
    data: records,
    fields: fieldsToExport,
    filters: { date_type: dateType, from, to },
    vendor_id: vendor.id,
    total: records.length,
    message: "OK",
  });
}

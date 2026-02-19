import { NextRequest, NextResponse } from "next/server";
import { requireVendor } from "@/lib/auth/requireAuth";

/**
 * GET /api/vendor/reservations/export
 * Export reservation data as CSV-ready JSON.
 * Query params: date_type (start|end|completed), from, to, vendor_id,
 *               fields (comma-separated list of fields to include)
 */
export async function GET(request: NextRequest) {
  const authResult = await requireVendor(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const { vendor } = authResult;
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
      {
        error: "Bad request",
        message: "date_type は start, end, completed のいずれかを指定してください",
      },
      { status: 400 }
    );
  }

  const requestedFields = fieldsParam
    ? fieldsParam.split(",").map((f) => f.trim())
    : null;

  // TODO: Replace with Supabase query once schema is applied
  const allFields = [
    "reservation_id",
    "status",
    "bike_name",
    "user_name",
    "user_email",
    "user_phone",
    "start_datetime",
    "end_datetime",
    "rental_days",
    "rental_amount",
    "option_amount",
    "insurance_amount",
    "total_amount",
    "payment_status",
    "confirmed_at",
    "completed_at",
    "cancelled_at",
    "notes",
  ];

  const fieldsToExport = requestedFields
    ? allFields.filter((f) => requestedFields.includes(f))
    : allFields;

  const mockRecords = [
    {
      reservation_id: "res_001",
      status: "completed",
      bike_name: "PCX 160",
      user_name: "田中太郎",
      user_email: "tanaka@example.com",
      user_phone: "090-1234-5678",
      start_datetime: "2025-01-05T09:00:00Z",
      end_datetime: "2025-01-07T18:00:00Z",
      rental_days: 3,
      rental_amount: 24000,
      option_amount: 1500,
      insurance_amount: 1500,
      total_amount: 27000,
      payment_status: "paid",
      confirmed_at: "2025-01-04T12:00:00Z",
      completed_at: "2025-01-07T18:30:00Z",
      cancelled_at: null,
      notes: "",
    },
    {
      reservation_id: "res_002",
      status: "completed",
      bike_name: "NMAX 155",
      user_name: "佐藤花子",
      user_email: "sato@example.com",
      user_phone: "080-9876-5432",
      start_datetime: "2025-01-10T10:00:00Z",
      end_datetime: "2025-01-12T17:00:00Z",
      rental_days: 3,
      rental_amount: 22500,
      option_amount: 0,
      insurance_amount: 3000,
      total_amount: 25500,
      payment_status: "paid",
      confirmed_at: "2025-01-09T15:00:00Z",
      completed_at: "2025-01-12T17:15:00Z",
      cancelled_at: null,
      notes: "ヘルメット持参",
    },
  ];

  // Filter records to only include requested fields
  const filteredRecords = mockRecords.map((record) => {
    const filtered: Record<string, unknown> = {};
    for (const field of fieldsToExport) {
      if (field in record) {
        filtered[field] = (record as Record<string, unknown>)[field];
      }
    }
    return filtered;
  });

  return NextResponse.json({
    data: filteredRecords,
    fields: fieldsToExport,
    filters: { date_type: dateType, from, to },
    vendor_id: vendor.id,
    total: filteredRecords.length,
    message: "OK",
  });
}

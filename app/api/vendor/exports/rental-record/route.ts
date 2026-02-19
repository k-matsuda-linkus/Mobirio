import { NextRequest, NextResponse } from "next/server";
import { requireVendor } from "@/lib/auth/requireAuth";

/**
 * GET /api/vendor/exports/rental-record
 * Export rental record data for a given fiscal year.
 * Query params: fiscal_year, vendor_id
 */
export async function GET(request: NextRequest) {
  const authResult = await requireVendor(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const { vendor } = authResult;
  const searchParams = request.nextUrl.searchParams;
  const fiscalYear = searchParams.get("fiscal_year");

  if (!fiscalYear) {
    return NextResponse.json(
      { error: "Bad request", message: "fiscal_year は必須です" },
      { status: 400 }
    );
  }

  // TODO: Replace with Supabase query once schema is applied
  const mockRentalRecordData = {
    vendor_id: vendor.id,
    vendor_name: "サンプルレンタルバイク店",
    fiscal_year: parseInt(fiscalYear),
    records: [
      {
        month: 4,
        total_reservations: 25,
        total_rental_days: 68,
        total_revenue: 520000,
        completed: 23,
        cancelled: 2,
      },
      {
        month: 5,
        total_reservations: 30,
        total_rental_days: 82,
        total_revenue: 640000,
        completed: 28,
        cancelled: 2,
      },
      {
        month: 6,
        total_reservations: 18,
        total_rental_days: 45,
        total_revenue: 350000,
        completed: 17,
        cancelled: 1,
      },
    ],
    summary: {
      total_reservations: 73,
      total_rental_days: 195,
      total_revenue: 1510000,
      total_completed: 68,
      total_cancelled: 5,
    },
  };

  return NextResponse.json({ data: mockRentalRecordData, message: "OK" });
}

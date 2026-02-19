import { NextRequest, NextResponse } from "next/server";
import { requireVendor } from "@/lib/auth/requireAuth";

/**
 * GET /api/vendor/exports/insurance
 * Export insurance detail data for a given year/month.
 * Query params: year, month, vendor_id
 */
export async function GET(request: NextRequest) {
  const authResult = await requireVendor(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const { vendor } = authResult;
  const searchParams = request.nextUrl.searchParams;
  const year = searchParams.get("year");
  const month = searchParams.get("month");

  if (!year || !month) {
    return NextResponse.json(
      { error: "Bad request", message: "year と month は必須です" },
      { status: 400 }
    );
  }

  // TODO: Replace with Supabase query once schema is applied
  const mockInsuranceData = {
    vendor_id: vendor.id,
    vendor_name: "サンプルレンタルバイク店",
    year: parseInt(year),
    month: parseInt(month),
    records: [
      {
        reservation_id: "res_001",
        bike_name: "PCX 160",
        user_name: "田中太郎",
        start_date: `${year}-${month.padStart(2, "0")}-05`,
        end_date: `${year}-${month.padStart(2, "0")}-07`,
        days: 3,
        insurance_type: "standard",
        insurance_daily_rate: 500,
        insurance_total: 1500,
      },
      {
        reservation_id: "res_002",
        bike_name: "NMAX 155",
        user_name: "佐藤花子",
        start_date: `${year}-${month.padStart(2, "0")}-10`,
        end_date: `${year}-${month.padStart(2, "0")}-12`,
        days: 3,
        insurance_type: "premium",
        insurance_daily_rate: 1000,
        insurance_total: 3000,
      },
    ],
    summary: {
      total_reservations: 2,
      total_insurance_amount: 4500,
    },
  };

  return NextResponse.json({ data: mockInsuranceData, message: "OK" });
}

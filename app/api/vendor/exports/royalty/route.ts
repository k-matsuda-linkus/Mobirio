import { NextRequest, NextResponse } from "next/server";
import { requireVendor } from "@/lib/auth/requireAuth";

/**
 * GET /api/vendor/exports/royalty
 * Export royalty detail data for a given year/month.
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
  const mockRoyaltyData = {
    vendor_id: vendor.id,
    vendor_name: "サンプルレンタルバイク店",
    year: parseInt(year),
    month: parseInt(month),
    records: [
      {
        reservation_id: "res_001",
        bike_name: "PCX 160",
        user_name: "田中太郎",
        rental_amount: 24000,
        option_amount: 1500,
        insurance_amount: 1500,
        total_amount: 27000,
        royalty_rate: 0.1,
        royalty_amount: 2700,
        net_amount: 24300,
        completed_at: `${year}-${month.padStart(2, "0")}-07T18:00:00Z`,
      },
      {
        reservation_id: "res_002",
        bike_name: "NMAX 155",
        user_name: "佐藤花子",
        rental_amount: 22500,
        option_amount: 0,
        insurance_amount: 3000,
        total_amount: 25500,
        royalty_rate: 0.1,
        royalty_amount: 2550,
        net_amount: 22950,
        completed_at: `${year}-${month.padStart(2, "0")}-12T18:00:00Z`,
      },
    ],
    summary: {
      total_revenue: 52500,
      total_royalty: 5250,
      total_net: 47250,
      royalty_rate: 0.1,
    },
  };

  return NextResponse.json({ data: mockRoyaltyData, message: "OK" });
}

import { NextRequest, NextResponse } from "next/server";
import { requireVendor } from "@/lib/auth/requireAuth";

/**
 * GET /api/vendor/analytics/bike-performance
 * Get per-bike performance analytics (amounts and reservation counts).
 * Query params: vendor_id, year, date_type (start|end|completed),
 *               paid_type (all|paid|unpaid), display (amount|count)
 */
export async function GET(request: NextRequest) {
  const authResult = await requireVendor(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const { vendor } = authResult;
  const searchParams = request.nextUrl.searchParams;
  const year = searchParams.get("year") || new Date().getFullYear().toString();
  const dateType = searchParams.get("date_type") || "start";
  const paidType = searchParams.get("paid_type") || "all";
  const display = searchParams.get("display") || "amount";

  const validDateTypes = ["start", "end", "completed"];
  const validPaidTypes = ["all", "paid", "unpaid"];
  const validDisplays = ["amount", "count"];

  if (!validDateTypes.includes(dateType)) {
    return NextResponse.json(
      {
        error: "Bad request",
        message: "date_type は start, end, completed のいずれかを指定してください",
      },
      { status: 400 }
    );
  }

  if (!validPaidTypes.includes(paidType)) {
    return NextResponse.json(
      {
        error: "Bad request",
        message: "paid_type は all, paid, unpaid のいずれかを指定してください",
      },
      { status: 400 }
    );
  }

  if (!validDisplays.includes(display)) {
    return NextResponse.json(
      {
        error: "Bad request",
        message: "display は amount, count のいずれかを指定してください",
      },
      { status: 400 }
    );
  }

  // TODO: Replace with Supabase query once schema is applied
  const mockBikes = [
    { bike_id: "bike_001", bike_name: "PCX 160", manufacturer: "Honda" },
    { bike_id: "bike_002", bike_name: "NMAX 155", manufacturer: "Yamaha" },
    { bike_id: "bike_003", bike_name: "ADV 160", manufacturer: "Honda" },
  ];

  const data = mockBikes.map((bike) => {
    const months = Array.from({ length: 12 }, (_, i) => {
      const month = i + 1;
      if (display === "amount") {
        const rental = Math.floor(Math.random() * 200000) + 30000;
        const option = Math.floor(Math.random() * 20000) + 2000;
        const insurance = Math.floor(Math.random() * 10000) + 1000;
        return {
          label: `${year}-${String(month).padStart(2, "0")}`,
          rental_amount: rental,
          option_amount: option,
          insurance_amount: insurance,
          total_amount: rental + option + insurance,
        };
      } else {
        return {
          label: `${year}-${String(month).padStart(2, "0")}`,
          reservation_count: Math.floor(Math.random() * 15) + 1,
          completed_count: Math.floor(Math.random() * 12) + 1,
          cancelled_count: Math.floor(Math.random() * 3),
        };
      }
    });

    return { ...bike, months };
  });

  return NextResponse.json({
    data,
    filters: { year: parseInt(year), date_type: dateType, paid_type: paidType, display },
    vendor_id: vendor.id,
    message: "OK",
  });
}

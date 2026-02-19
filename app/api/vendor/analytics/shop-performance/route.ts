import { NextRequest, NextResponse } from "next/server";
import { requireVendor } from "@/lib/auth/requireAuth";

/**
 * GET /api/vendor/analytics/shop-performance
 * Get shop-level performance analytics (amounts and reservation counts).
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
  const mockMonthlyData = Array.from({ length: 12 }, (_, i) => {
    const month = i + 1;
    if (display === "amount") {
      return {
        label: `${year}-${String(month).padStart(2, "0")}`,
        rental_amount: Math.floor(Math.random() * 500000) + 100000,
        option_amount: Math.floor(Math.random() * 50000) + 5000,
        insurance_amount: Math.floor(Math.random() * 30000) + 3000,
        total_amount: 0, // calculated below
      };
    } else {
      return {
        label: `${year}-${String(month).padStart(2, "0")}`,
        reservation_count: Math.floor(Math.random() * 40) + 5,
        completed_count: Math.floor(Math.random() * 35) + 4,
        cancelled_count: Math.floor(Math.random() * 5),
      };
    }
  });

  // Calculate totals for amount display
  if (display === "amount") {
    for (const entry of mockMonthlyData) {
      const e = entry as {
        rental_amount: number;
        option_amount: number;
        insurance_amount: number;
        total_amount: number;
      };
      e.total_amount = e.rental_amount + e.option_amount + e.insurance_amount;
    }
  }

  const summary =
    display === "amount"
      ? {
          total_rental: mockMonthlyData.reduce(
            (sum, d) => sum + ((d as any).rental_amount || 0),
            0
          ),
          total_option: mockMonthlyData.reduce(
            (sum, d) => sum + ((d as any).option_amount || 0),
            0
          ),
          total_insurance: mockMonthlyData.reduce(
            (sum, d) => sum + ((d as any).insurance_amount || 0),
            0
          ),
          grand_total: mockMonthlyData.reduce(
            (sum, d) => sum + ((d as any).total_amount || 0),
            0
          ),
        }
      : {
          total_reservations: mockMonthlyData.reduce(
            (sum, d) => sum + ((d as any).reservation_count || 0),
            0
          ),
          total_completed: mockMonthlyData.reduce(
            (sum, d) => sum + ((d as any).completed_count || 0),
            0
          ),
          total_cancelled: mockMonthlyData.reduce(
            (sum, d) => sum + ((d as any).cancelled_count || 0),
            0
          ),
        };

  return NextResponse.json({
    data: mockMonthlyData,
    summary,
    filters: { year: parseInt(year), date_type: dateType, paid_type: paidType, display },
    vendor_id: vendor.id,
    message: "OK",
  });
}

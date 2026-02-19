import { NextRequest, NextResponse } from "next/server";
import { requireVendor } from "@/lib/auth/requireAuth";

/**
 * GET /api/vendor/analytics/bike-pv
 * Get per-bike page view analytics.
 * Query params: vendor_id, year, unit (year|month|day)
 */
export async function GET(request: NextRequest) {
  const authResult = await requireVendor(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const { vendor } = authResult;
  const searchParams = request.nextUrl.searchParams;
  const year = searchParams.get("year") || new Date().getFullYear().toString();
  const unit = searchParams.get("unit") || "month";

  if (!["year", "month", "day"].includes(unit)) {
    return NextResponse.json(
      {
        error: "Bad request",
        message: "unit は year, month, day のいずれかを指定してください",
      },
      { status: 400 }
    );
  }

  // TODO: Replace with Supabase query once schema is applied
  const mockBikes = [
    { bike_id: "bike_001", bike_name: "PCX 160" },
    { bike_id: "bike_002", bike_name: "NMAX 155" },
    { bike_id: "bike_003", bike_name: "ADV 160" },
  ];

  const generatePeriods = () => {
    if (unit === "month") {
      return Array.from({ length: 12 }, (_, i) =>
        `${year}-${String(i + 1).padStart(2, "0")}`
      );
    } else if (unit === "day") {
      const month = searchParams.get("month") || "01";
      const daysInMonth = new Date(
        parseInt(year),
        parseInt(month),
        0
      ).getDate();
      return Array.from({ length: daysInMonth }, (_, i) =>
        `${year}-${month.padStart(2, "0")}-${String(i + 1).padStart(2, "0")}`
      );
    } else {
      return Array.from({ length: 3 }, (_, i) => `${parseInt(year) - 2 + i}`);
    }
  };

  const periods = generatePeriods();

  const data = mockBikes.map((bike) => ({
    ...bike,
    periods: periods.map((label) => {
      const pc = Math.floor(Math.random() * 50) + 5;
      const sp = Math.floor(Math.random() * 80) + 10;
      return { label, pc, sp, total: pc + sp };
    }),
  }));

  return NextResponse.json({
    data,
    vendor_id: vendor.id,
    year: parseInt(year),
    unit,
    message: "OK",
  });
}

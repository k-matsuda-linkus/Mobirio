import { NextRequest, NextResponse } from "next/server";
import { requireVendor } from "@/lib/auth/requireAuth";

/**
 * GET /api/vendor/analytics/shop-pv
 * Get shop page view analytics.
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
  let mockData: Array<{
    label: string;
    pc: number;
    sp: number;
    total: number;
  }>;

  if (unit === "month") {
    mockData = Array.from({ length: 12 }, (_, i) => {
      const pc = Math.floor(Math.random() * 300) + 50;
      const sp = Math.floor(Math.random() * 500) + 100;
      return {
        label: `${year}-${String(i + 1).padStart(2, "0")}`,
        pc,
        sp,
        total: pc + sp,
      };
    });
  } else if (unit === "day") {
    const month = searchParams.get("month") || "01";
    const daysInMonth = new Date(parseInt(year), parseInt(month), 0).getDate();
    mockData = Array.from({ length: daysInMonth }, (_, i) => {
      const pc = Math.floor(Math.random() * 30) + 5;
      const sp = Math.floor(Math.random() * 50) + 10;
      return {
        label: `${year}-${month.padStart(2, "0")}-${String(i + 1).padStart(2, "0")}`,
        pc,
        sp,
        total: pc + sp,
      };
    });
  } else {
    // unit === "year"
    mockData = Array.from({ length: 3 }, (_, i) => {
      const y = parseInt(year) - 2 + i;
      const pc = Math.floor(Math.random() * 3000) + 500;
      const sp = Math.floor(Math.random() * 5000) + 1000;
      return {
        label: `${y}`,
        pc,
        sp,
        total: pc + sp,
      };
    });
  }

  const totalPc = mockData.reduce((sum, d) => sum + d.pc, 0);
  const totalSp = mockData.reduce((sum, d) => sum + d.sp, 0);

  return NextResponse.json({
    data: mockData,
    summary: {
      total_pc: totalPc,
      total_sp: totalSp,
      total: totalPc + totalSp,
    },
    vendor_id: vendor.id,
    year: parseInt(year),
    unit,
    message: "OK",
  });
}

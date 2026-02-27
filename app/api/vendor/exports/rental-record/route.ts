import { NextRequest, NextResponse } from "next/server";
import { requireVendor } from "@/lib/auth/requireAuth";
import { isSandboxMode, sandboxLog } from "@/lib/sandbox";

/**
 * GET /api/vendor/exports/rental-record
 * Export rental record data for a given fiscal year.
 * Query params: fiscal_year
 */
export async function GET(request: NextRequest) {
  const authResult = await requireVendor(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const { vendor, supabase } = authResult;
  const searchParams = request.nextUrl.searchParams;
  const fiscalYear = searchParams.get("fiscal_year");

  if (!fiscalYear) {
    return NextResponse.json(
      { error: "Bad request", message: "fiscal_year は必須です" },
      { status: 400 }
    );
  }

  if (isSandboxMode()) {
    sandboxLog("GET /api/vendor/exports/rental-record", `vendor=${vendor.id}, fiscal_year=${fiscalYear}`);

    const mockRentalRecordData = {
      vendor_id: vendor.id,
      vendor_name: vendor.name,
      fiscal_year: parseInt(fiscalYear),
      records: [
        { month: 4, total_reservations: 25, total_rental_days: 68, total_revenue: 520000, completed: 23, cancelled: 2 },
        { month: 5, total_reservations: 30, total_rental_days: 82, total_revenue: 640000, completed: 28, cancelled: 2 },
        { month: 6, total_reservations: 18, total_rental_days: 45, total_revenue: 350000, completed: 17, cancelled: 1 },
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

  // 本番: Supabase — 年度(4月〜翌3月)
  const fy = parseInt(fiscalYear);
  // 令和→西暦変換: 令和6=2024, 令和7=2025, 令和8=2026
  const startCalYear = 2018 + fy;
  const startDate = `${startCalYear}-04-01`;
  const endDate = `${startCalYear + 1}-03-31T23:59:59`;

  const { data: reservations, error } = await supabase
    .from("reservations")
    .select("status, total_amount, start_datetime, end_datetime")
    .eq("vendor_id", vendor.id)
    .gte("start_datetime", startDate)
    .lte("start_datetime", endDate);

  if (error) {
    return NextResponse.json(
      { error: "Database error", message: error.message },
      { status: 500 }
    );
  }

  const rsvList = reservations || [];

  // 月別集計（4月〜3月）
  const records: Array<{
    month: number;
    total_reservations: number;
    total_rental_days: number;
    total_revenue: number;
    completed: number;
    cancelled: number;
  }> = [];

  for (let m = 4; m <= 15; m++) {
    const actualMonth = m <= 12 ? m : m - 12;
    const calYear = m <= 12 ? startCalYear : startCalYear + 1;
    const monthStr = `${calYear}-${String(actualMonth).padStart(2, "0")}`;

    const monthRsvs = rsvList.filter((r) => r.start_datetime?.startsWith(monthStr));

    let totalDays = 0;
    for (const r of monthRsvs) {
      if (r.start_datetime && r.end_datetime) {
        const start = new Date(r.start_datetime);
        const end = new Date(r.end_datetime);
        totalDays += Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
      }
    }

    records.push({
      month: actualMonth,
      total_reservations: monthRsvs.length,
      total_rental_days: totalDays,
      total_revenue: monthRsvs.reduce((s, r) => s + (r.total_amount || 0), 0),
      completed: monthRsvs.filter((r) => r.status === "completed").length,
      cancelled: monthRsvs.filter((r) => r.status === "cancelled").length,
    });
  }

  const summary = {
    total_reservations: records.reduce((s, r) => s + r.total_reservations, 0),
    total_rental_days: records.reduce((s, r) => s + r.total_rental_days, 0),
    total_revenue: records.reduce((s, r) => s + r.total_revenue, 0),
    total_completed: records.reduce((s, r) => s + r.completed, 0),
    total_cancelled: records.reduce((s, r) => s + r.cancelled, 0),
  };

  return NextResponse.json({
    data: {
      vendor_id: vendor.id,
      vendor_name: vendor.name,
      fiscal_year: fy,
      records,
      summary,
    },
    message: "OK",
  });
}

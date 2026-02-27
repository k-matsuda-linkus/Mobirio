import { NextRequest, NextResponse } from "next/server";
import { requireVendor } from "@/lib/auth/requireAuth";
import { isSandboxMode, sandboxLog } from "@/lib/sandbox";
import { mockReservations } from "@/lib/mock/reservations";

/**
 * GET /api/vendor/reports/reservations
 * Reservation report: status breakdown, monthly counts, average duration.
 */
export async function GET(request: NextRequest) {
  const authResult = await requireVendor(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const { vendor, supabase } = authResult;

  if (isSandboxMode()) {
    sandboxLog("GET /api/vendor/reports/reservations", `vendor=${vendor.id}`);

    const vendorReservations = mockReservations.filter((r) => r.vendor_id === vendor.id);
    const totalReservations = vendorReservations.length;
    const confirmedCount = vendorReservations.filter((r) => r.status === "confirmed").length;
    const pendingCount = vendorReservations.filter((r) => r.status === "pending").length;
    const completedCount = vendorReservations.filter((r) => r.status === "completed").length;
    const cancelledCount = vendorReservations.filter((r) => r.status === "cancelled").length;
    const noShowCount = vendorReservations.filter((r) => r.status === "no_show").length;
    const inUseCount = vendorReservations.filter((r) => r.status === "in_use").length;

    // 月別集計
    const monthMap: Record<string, number> = {};
    for (const r of vendorReservations) {
      const month = r.start_datetime.slice(0, 7);
      monthMap[month] = (monthMap[month] || 0) + 1;
    }
    const reservationsByMonth = Object.entries(monthMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, count]) => ({ month, count }));

    return NextResponse.json({
      data: {
        totalReservations,
        confirmedCount,
        pendingCount,
        completedCount,
        cancelledCount,
        noShowCount,
        inUseCount,
        cancelRate: totalReservations > 0 ? Math.round((cancelledCount / totalReservations) * 1000) / 10 : 0,
        reservationsByMonth,
      },
      message: "OK",
    });
  }

  // 本番: Supabase
  const { data: reservations, error } = await supabase
    .from("reservations")
    .select("status, start_datetime, end_datetime")
    .eq("vendor_id", vendor.id);

  if (error) {
    return NextResponse.json(
      { error: "Database error", message: error.message },
      { status: 500 }
    );
  }

  const rsvList = reservations || [];
  const totalReservations = rsvList.length;
  const confirmedCount = rsvList.filter((r) => r.status === "confirmed").length;
  const pendingCount = rsvList.filter((r) => r.status === "pending").length;
  const completedCount = rsvList.filter((r) => r.status === "completed").length;
  const cancelledCount = rsvList.filter((r) => r.status === "cancelled").length;
  const noShowCount = rsvList.filter((r) => r.status === "no_show").length;
  const inUseCount = rsvList.filter((r) => r.status === "in_use").length;

  const monthMap: Record<string, number> = {};
  for (const r of rsvList) {
    const month = r.start_datetime?.slice(0, 7);
    if (month) {
      monthMap[month] = (monthMap[month] || 0) + 1;
    }
  }
  const reservationsByMonth = Object.entries(monthMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, count]) => ({ month, count }));

  return NextResponse.json({
    data: {
      totalReservations,
      confirmedCount,
      pendingCount,
      completedCount,
      cancelledCount,
      noShowCount,
      inUseCount,
      cancelRate: totalReservations > 0 ? Math.round((cancelledCount / totalReservations) * 1000) / 10 : 0,
      reservationsByMonth,
    },
    message: "OK",
  });
}

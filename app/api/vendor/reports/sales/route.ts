import { NextRequest, NextResponse } from "next/server";
import { requireVendor } from "@/lib/auth/requireAuth";
import { isSandboxMode, sandboxLog } from "@/lib/sandbox";
import { mockReservations } from "@/lib/mock/reservations";
import { mockPayments } from "@/lib/mock/payments";

/**
 * GET /api/vendor/reports/sales
 * Sales report: monthly revenue, reservation count, average order value.
 */
export async function GET(request: NextRequest) {
  const authResult = await requireVendor(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const { vendor, supabase } = authResult;

  if (isSandboxMode()) {
    sandboxLog("GET /api/vendor/reports/sales", `vendor=${vendor.id}`);

    const vendorReservations = mockReservations.filter((r) => r.vendor_id === vendor.id);
    const vendorPayments = mockPayments.filter((p) => p.vendor_id === vendor.id);

    const totalRevenue = vendorPayments
      .filter((p) => p.status === "completed")
      .reduce((s, p) => s + p.amount, 0);
    const totalOrders = vendorReservations.filter((r) => r.status !== "cancelled").length;
    const averageOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;

    // 月別集計
    const monthMap: Record<string, { revenue: number; count: number }> = {};
    for (const r of vendorReservations) {
      if (r.status === "cancelled") continue;
      const month = r.start_datetime.slice(0, 7);
      if (!monthMap[month]) monthMap[month] = { revenue: 0, count: 0 };
      monthMap[month].revenue += r.total_amount;
      monthMap[month].count += 1;
    }

    const revenueByMonth = Object.entries(monthMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, data]) => ({ month, revenue: data.revenue, count: data.count }));

    const latestMonth = revenueByMonth[revenueByMonth.length - 1];

    return NextResponse.json({
      data: {
        totalRevenue,
        monthlyRevenue: latestMonth?.revenue || 0,
        averageOrderValue,
        totalOrders,
        revenueByMonth,
      },
      message: "OK",
    });
  }

  // 本番: Supabase
  const { data: reservations, error: rsvError } = await supabase
    .from("reservations")
    .select("id, status, total_amount, start_datetime")
    .eq("vendor_id", vendor.id)
    .neq("status", "cancelled");

  if (rsvError) {
    return NextResponse.json(
      { error: "Database error", message: rsvError.message },
      { status: 500 }
    );
  }

  const { data: payments, error: payError } = await supabase
    .from("payments")
    .select("amount, status")
    .eq("vendor_id", vendor.id)
    .eq("status", "completed");

  if (payError) {
    return NextResponse.json(
      { error: "Database error", message: payError.message },
      { status: 500 }
    );
  }

  const rsvList = reservations || [];
  const payList = payments || [];

  const totalRevenue = payList.reduce((s, p) => s + (p.amount || 0), 0);
  const totalOrders = rsvList.length;
  const averageOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;

  const monthMap: Record<string, { revenue: number; count: number }> = {};
  for (const r of rsvList) {
    const month = r.start_datetime?.slice(0, 7);
    if (!month) continue;
    if (!monthMap[month]) monthMap[month] = { revenue: 0, count: 0 };
    monthMap[month].revenue += r.total_amount || 0;
    monthMap[month].count += 1;
  }

  const revenueByMonth = Object.entries(monthMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, data]) => ({ month, revenue: data.revenue, count: data.count }));

  const latestMonth = revenueByMonth[revenueByMonth.length - 1];

  return NextResponse.json({
    data: {
      totalRevenue,
      monthlyRevenue: latestMonth?.revenue || 0,
      averageOrderValue,
      totalOrders,
      revenueByMonth,
    },
    message: "OK",
  });
}

import { NextRequest, NextResponse } from "next/server";
import { requireVendor } from "@/lib/auth/requireAuth";
import { isSandboxMode, sandboxLog } from "@/lib/sandbox";
import { mockReservations } from "@/lib/mock/reservations";
import { mockBikes } from "@/lib/mock/bikes";

/**
 * GET /api/vendor/reports/bikes
 * Bike usage report: utilization rate, reservations per bike, revenue per bike.
 */
export async function GET(request: NextRequest) {
  const authResult = await requireVendor(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const { vendor, supabase } = authResult;

  if (isSandboxMode()) {
    sandboxLog("GET /api/vendor/reports/bikes", `vendor=${vendor.id}`);

    const vendorBikes = mockBikes.filter((b) => b.vendor_id === vendor.id);
    const vendorReservations = mockReservations.filter(
      (r) => r.vendor_id === vendor.id && r.status !== "cancelled"
    );

    const bikeUsage = vendorBikes.map((bike) => {
      const bikeRsvs = vendorReservations.filter((r) => r.bike_id === bike.id);
      const revenue = bikeRsvs.reduce((s, r) => s + r.total_amount, 0);
      const reservationDays = bikeRsvs.length * 1.5; // 平均1.5日/予約
      const utilization = Math.min(Math.round((reservationDays / 30) * 100), 100);
      return {
        bike_id: bike.id,
        name: bike.name,
        reservations: bikeRsvs.length,
        utilization,
        revenue,
      };
    });

    const totalBikes = vendorBikes.length;
    const activeBikes = vendorBikes.filter((b) => b.is_available).length;
    const avgUtilization = bikeUsage.length > 0
      ? Math.round(bikeUsage.reduce((s, b) => s + b.utilization, 0) / bikeUsage.length * 10) / 10
      : 0;
    const mostPopular = bikeUsage.sort((a, b) => b.reservations - a.reservations)[0];

    return NextResponse.json({
      data: {
        totalBikes,
        activeBikes,
        utilizationRate: avgUtilization / 100,
        mostPopularBike: mostPopular
          ? { id: mostPopular.bike_id, name: mostPopular.name, rentals: mostPopular.reservations }
          : null,
        bikeUsage,
      },
      message: "OK",
    });
  }

  // 本番: Supabase
  const { data: bikes, error: bikesError } = await supabase
    .from("bikes")
    .select("id, name, is_available")
    .eq("vendor_id", vendor.id);

  if (bikesError) {
    return NextResponse.json(
      { error: "Database error", message: bikesError.message },
      { status: 500 }
    );
  }

  const { data: reservations, error: rsvError } = await supabase
    .from("reservations")
    .select("bike_id, total_amount, start_datetime, end_datetime, status")
    .eq("vendor_id", vendor.id)
    .neq("status", "cancelled");

  if (rsvError) {
    return NextResponse.json(
      { error: "Database error", message: rsvError.message },
      { status: 500 }
    );
  }

  const bikeList = bikes || [];
  const rsvList = reservations || [];

  const bikeUsage = bikeList.map((bike) => {
    const bikeRsvs = rsvList.filter((r) => r.bike_id === bike.id);
    const revenue = bikeRsvs.reduce((s, r) => s + (r.total_amount || 0), 0);

    // 稼働日数の計算
    let totalDays = 0;
    for (const r of bikeRsvs) {
      if (r.start_datetime && r.end_datetime) {
        const start = new Date(r.start_datetime);
        const end = new Date(r.end_datetime);
        const diffMs = end.getTime() - start.getTime();
        totalDays += Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
      }
    }
    const utilization = Math.min(Math.round((totalDays / 30) * 100), 100);

    return {
      bike_id: bike.id,
      name: bike.name,
      reservations: bikeRsvs.length,
      utilization,
      revenue,
    };
  });

  const totalBikes = bikeList.length;
  const activeBikes = bikeList.filter((b) => b.is_available).length;
  const avgUtilization = bikeUsage.length > 0
    ? Math.round(bikeUsage.reduce((s, b) => s + b.utilization, 0) / bikeUsage.length * 10) / 10
    : 0;
  const sortedUsage = [...bikeUsage].sort((a, b) => b.reservations - a.reservations);
  const mostPopular = sortedUsage[0];

  return NextResponse.json({
    data: {
      totalBikes,
      activeBikes,
      utilizationRate: avgUtilization / 100,
      mostPopularBike: mostPopular
        ? { id: mostPopular.bike_id, name: mostPopular.name, rentals: mostPopular.reservations }
        : null,
      bikeUsage,
    },
    message: "OK",
  });
}

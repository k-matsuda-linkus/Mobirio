import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/requireAuth";
import { createAdminSupabaseClient } from "@/lib/supabase/server";
import { isSandboxMode } from "@/lib/sandbox";
import { mockReservations, mockPayments, mockBikes, mockVendors } from "@/lib/mock";

export async function GET(request: NextRequest) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  const searchParams = request.nextUrl.searchParams;
  const startDate = searchParams.get("startDate") || "2026-01-01";
  const endDate = searchParams.get("endDate") || "2026-12-31";

  if (isSandboxMode()) {
    const filteredReservations = mockReservations.filter(
      (r) => r.created_at >= startDate && r.created_at <= endDate
    );

    const filteredPayments = mockPayments.filter(
      (p) => p.created_at >= startDate && p.created_at <= endDate
    );

    const revenueByDate: Record<string, number> = {};
    for (const p of filteredPayments) {
      if (p.status === "completed") {
        const date = p.created_at.split("T")[0];
        revenueByDate[date] = (revenueByDate[date] || 0) + p.amount;
      }
    }

    const daily_revenue = Object.entries(revenueByDate)
      .map(([date, amount]) => ({ date, amount }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const reservation_by_status = {
      pending: filteredReservations.filter((r) => r.status === "pending").length,
      confirmed: filteredReservations.filter((r) => r.status === "confirmed").length,
      in_use: filteredReservations.filter((r) => r.status === "in_use").length,
      completed: filteredReservations.filter((r) => r.status === "completed").length,
      cancelled: filteredReservations.filter((r) => r.status === "cancelled").length,
      no_show: filteredReservations.filter((r) => r.status === "no_show").length,
    };

    const bikeReservationCount: Record<string, number> = {};
    const bikeRevenue: Record<string, number> = {};
    for (const r of filteredReservations) {
      bikeReservationCount[r.bike_id] = (bikeReservationCount[r.bike_id] || 0) + 1;
      bikeRevenue[r.bike_id] = (bikeRevenue[r.bike_id] || 0) + r.total_amount;
    }

    const top_bikes = Object.entries(bikeReservationCount)
      .map(([bikeId, count]) => {
        const bike = mockBikes.find((b) => b.id === bikeId);
        return {
          bike_id: bikeId,
          name: bike?.name || bikeId,
          manufacturer: bike?.manufacturer || "",
          reservation_count: count,
          revenue: bikeRevenue[bikeId] || 0,
        };
      })
      .sort((a, b) => b.reservation_count - a.reservation_count)
      .slice(0, 10);

    const vendorReservationCount: Record<string, number> = {};
    const vendorRevenue: Record<string, number> = {};
    for (const r of filteredReservations) {
      vendorReservationCount[r.vendor_id] = (vendorReservationCount[r.vendor_id] || 0) + 1;
      vendorRevenue[r.vendor_id] = (vendorRevenue[r.vendor_id] || 0) + r.total_amount;
    }

    const top_vendors = Object.entries(vendorReservationCount)
      .map(([vendorId, count]) => {
        const vendor = mockVendors.find((v) => v.id === vendorId);
        return {
          vendor_id: vendorId,
          name: vendor?.name || vendorId,
          reservation_count: count,
          revenue: vendorRevenue[vendorId] || 0,
        };
      })
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    return NextResponse.json({
      data: {
        period: { startDate, endDate },
        daily_revenue,
        reservation_by_status,
        top_bikes,
        top_vendors,
        totals: {
          reservations: filteredReservations.length,
          revenue: filteredPayments
            .filter((p) => p.status === "completed")
            .reduce((sum, p) => sum + p.amount, 0),
        },
      },
      message: "OK",
    });
  }

  // 本番: Supabase
  try {
    const supabase = createAdminSupabaseClient();

    const [reservationsResult, paymentsResult] = await Promise.all([
      supabase
        .from("reservations")
        .select("id, bike_id, vendor_id, status, total_amount, created_at")
        .gte("created_at", startDate)
        .lte("created_at", endDate + "T23:59:59"),
      supabase
        .from("payments")
        .select("amount, status, created_at")
        .gte("created_at", startDate)
        .lte("created_at", endDate + "T23:59:59"),
    ]);

    const reservations = reservationsResult.data || [];
    const payments = paymentsResult.data || [];

    // 日別売上
    const revenueByDate: Record<string, number> = {};
    for (const p of payments) {
      if (p.status === "completed") {
        const date = p.created_at.split("T")[0];
        revenueByDate[date] = (revenueByDate[date] || 0) + p.amount;
      }
    }

    const daily_revenue = Object.entries(revenueByDate)
      .map(([date, amount]) => ({ date, amount }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // ステータス別
    const reservation_by_status = {
      pending: reservations.filter((r) => r.status === "pending").length,
      confirmed: reservations.filter((r) => r.status === "confirmed").length,
      in_use: reservations.filter((r) => r.status === "in_use").length,
      completed: reservations.filter((r) => r.status === "completed").length,
      cancelled: reservations.filter((r) => r.status === "cancelled").length,
      no_show: reservations.filter((r) => r.status === "no_show").length,
    };

    // トップバイク
    const bikeCount: Record<string, number> = {};
    const bikeRev: Record<string, number> = {};
    for (const r of reservations) {
      bikeCount[r.bike_id] = (bikeCount[r.bike_id] || 0) + 1;
      bikeRev[r.bike_id] = (bikeRev[r.bike_id] || 0) + r.total_amount;
    }

    const bikeIds = Object.keys(bikeCount);
    let bikeNames: Record<string, { name: string; manufacturer: string }> = {};
    if (bikeIds.length > 0) {
      const { data: bikes } = await supabase
        .from("bikes")
        .select("id, name, manufacturer")
        .in("id", bikeIds);

      for (const b of bikes || []) {
        bikeNames[b.id] = { name: b.name, manufacturer: b.manufacturer };
      }
    }

    const top_bikes = Object.entries(bikeCount)
      .map(([bikeId, count]) => ({
        bike_id: bikeId,
        name: bikeNames[bikeId]?.name || bikeId,
        manufacturer: bikeNames[bikeId]?.manufacturer || "",
        reservation_count: count,
        revenue: bikeRev[bikeId] || 0,
      }))
      .sort((a, b) => b.reservation_count - a.reservation_count)
      .slice(0, 10);

    // トップベンダー
    const vendorCount: Record<string, number> = {};
    const vendorRev: Record<string, number> = {};
    for (const r of reservations) {
      vendorCount[r.vendor_id] = (vendorCount[r.vendor_id] || 0) + 1;
      vendorRev[r.vendor_id] = (vendorRev[r.vendor_id] || 0) + r.total_amount;
    }

    const vendorIds = Object.keys(vendorCount);
    let vendorNames: Record<string, string> = {};
    if (vendorIds.length > 0) {
      const { data: vendors } = await supabase
        .from("vendors")
        .select("id, name")
        .in("id", vendorIds);

      for (const v of vendors || []) {
        vendorNames[v.id] = v.name;
      }
    }

    const top_vendors = Object.entries(vendorCount)
      .map(([vendorId, count]) => ({
        vendor_id: vendorId,
        name: vendorNames[vendorId] || vendorId,
        reservation_count: count,
        revenue: vendorRev[vendorId] || 0,
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    return NextResponse.json({
      data: {
        period: { startDate, endDate },
        daily_revenue,
        reservation_by_status,
        top_bikes,
        top_vendors,
        totals: {
          reservations: reservations.length,
          revenue: payments
            .filter((p) => p.status === "completed")
            .reduce((sum, p) => sum + p.amount, 0),
        },
      },
      message: "OK",
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Server error", message: String(error) },
      { status: 500 }
    );
  }
}

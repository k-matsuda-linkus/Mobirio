import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/requireAuth";
import { createAdminSupabaseClient } from "@/lib/supabase/server";
import { isSandboxMode } from "@/lib/sandbox";
import {
  mockReservations,
  mockPayments,
  mockVendors,
  mockUsers,
  mockBikes,
  mockReviews,
} from "@/lib/mock";

export async function GET(request: NextRequest) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  if (isSandboxMode()) {
    const completedPayments = mockPayments.filter((p) => p.status === "completed");
    const totalRevenue = completedPayments.reduce((sum, p) => sum + p.amount, 0);

    const currentMonth = "2026-02";
    const previousMonth = "2026-01";

    const currentMonthReservations = mockReservations.filter((r) =>
      r.created_at.startsWith(currentMonth)
    );
    const previousMonthReservations = mockReservations.filter((r) =>
      r.created_at.startsWith(previousMonth)
    );

    const currentMonthRevenue = mockPayments
      .filter((p) => p.status === "completed" && p.created_at.startsWith(currentMonth))
      .reduce((sum, p) => sum + p.amount, 0);
    const previousMonthRevenue = mockPayments
      .filter((p) => p.status === "completed" && p.created_at.startsWith(previousMonth))
      .reduce((sum, p) => sum + p.amount, 0);

    const activeVendors = mockVendors.filter((v) => v.is_active && v.is_approved).length;
    const totalUsers = mockUsers.length;
    const activeBikes = mockBikes.filter((b) => b.is_available).length;

    const ratings = mockReviews.map((r) => r.rating);
    const avgRating =
      ratings.length > 0
        ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10
        : 0;

    const calcChange = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return Math.round(((current - previous) / previous) * 100 * 10) / 10;
    };

    return NextResponse.json({
      data: {
        total_reservations: mockReservations.length,
        monthly_reservations: currentMonthReservations.length,
        monthly_revenue: currentMonthRevenue,
        total_revenue: totalRevenue,
        active_vendors: activeVendors,
        total_users: totalUsers,
        active_bikes: activeBikes,
        avg_rating: avgRating,
        changes: {
          reservations: calcChange(
            currentMonthReservations.length,
            previousMonthReservations.length
          ),
          revenue: calcChange(currentMonthRevenue, previousMonthRevenue),
          vendors: 0,
          users: 5.2,
        },
      },
      message: "OK",
    });
  }

  // 本番: Supabase 並列カウント
  try {
    const supabase = createAdminSupabaseClient();
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
    const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59).toISOString();

    const [
      reservationsTotal,
      reservationsCurrent,
      reservationsPrevious,
      paymentsCurrent,
      paymentsPrevious,
      vendorsActive,
      usersTotal,
      bikesActive,
      reviewsData,
      paymentsAll,
    ] = await Promise.all([
      supabase.from("reservations").select("id", { count: "exact", head: true }),
      supabase
        .from("reservations")
        .select("id", { count: "exact", head: true })
        .gte("created_at", currentMonthStart),
      supabase
        .from("reservations")
        .select("id", { count: "exact", head: true })
        .gte("created_at", previousMonthStart)
        .lte("created_at", previousMonthEnd),
      supabase
        .from("payments")
        .select("amount")
        .eq("status", "completed")
        .gte("created_at", currentMonthStart),
      supabase
        .from("payments")
        .select("amount")
        .eq("status", "completed")
        .gte("created_at", previousMonthStart)
        .lte("created_at", previousMonthEnd),
      supabase
        .from("vendors")
        .select("id", { count: "exact", head: true })
        .eq("is_active", true)
        .eq("is_approved", true),
      supabase.from("users").select("id", { count: "exact", head: true }),
      supabase
        .from("bikes")
        .select("id", { count: "exact", head: true })
        .eq("is_available", true),
      supabase.from("reviews").select("rating"),
      supabase
        .from("payments")
        .select("amount")
        .eq("status", "completed"),
    ]);

    const totalRevenue = (paymentsAll.data || []).reduce(
      (sum, p) => sum + (p.amount || 0),
      0
    );
    const currentMonthRevenue = (paymentsCurrent.data || []).reduce(
      (sum, p) => sum + (p.amount || 0),
      0
    );
    const previousMonthRevenue = (paymentsPrevious.data || []).reduce(
      (sum, p) => sum + (p.amount || 0),
      0
    );

    const ratings = (reviewsData.data || []).map((r) => r.rating);
    const avgRating =
      ratings.length > 0
        ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10
        : 0;

    const calcChange = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return Math.round(((current - previous) / previous) * 100 * 10) / 10;
    };

    const currentRes = reservationsCurrent.count || 0;
    const previousRes = reservationsPrevious.count || 0;

    return NextResponse.json({
      data: {
        total_reservations: reservationsTotal.count || 0,
        monthly_reservations: currentRes,
        monthly_revenue: currentMonthRevenue,
        total_revenue: totalRevenue,
        active_vendors: vendorsActive.count || 0,
        total_users: usersTotal.count || 0,
        active_bikes: bikesActive.count || 0,
        avg_rating: avgRating,
        changes: {
          reservations: calcChange(currentRes, previousRes),
          revenue: calcChange(currentMonthRevenue, previousMonthRevenue),
          vendors: 0,
          users: 0,
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

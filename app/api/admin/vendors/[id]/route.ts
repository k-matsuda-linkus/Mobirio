import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/requireAuth";
import { createAdminSupabaseClient } from "@/lib/supabase/server";
import { isSandboxMode } from "@/lib/sandbox";
import { mockVendors, mockBikes, mockReservations, mockPayments } from "@/lib/mock";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  const { id } = await params;

  if (isSandboxMode()) {
    const vendor = mockVendors.find((v) => v.id === id);
    if (!vendor) {
      return NextResponse.json(
        { error: "Not found", message: "ベンダーが見つかりません" },
        { status: 404 }
      );
    }

    const vendorBikes = mockBikes.filter((b) => b.vendor_id === id);
    const vendorReservations = mockReservations.filter((r) => r.vendor_id === id);
    const vendorPayments = mockPayments.filter((p) => p.vendor_id === id);

    const completedRevenue = vendorReservations
      .filter((r) => r.status !== "cancelled")
      .reduce((sum, r) => sum + r.total_amount, 0);

    const ecAmount = vendorPayments
      .filter((p) => p.payment_type === "ec_credit" && p.status === "completed")
      .reduce((sum, p) => sum + p.amount, 0);

    const onsiteAmount = vendorPayments
      .filter(
        (p) =>
          (p.payment_type === "onsite_cash" || p.payment_type === "onsite_credit") &&
          p.status === "completed"
      )
      .reduce((sum, p) => sum + p.amount, 0);

    return NextResponse.json({
      data: {
        vendor,
        stats: {
          total_revenue: completedRevenue,
          ec_amount: ecAmount,
          onsite_amount: onsiteAmount,
          total_reservations: vendorReservations.length,
          completed_reservations: vendorReservations.filter((r) => r.status === "completed").length,
          bikes_count: vendorBikes.length,
        },
        bikes: vendorBikes,
        reservations: vendorReservations.slice(0, 20),
      },
      message: "OK",
    });
  }

  // 本番: Supabase
  try {
    const supabase = createAdminSupabaseClient();

    const [vendorResult, bikesResult, reservationsResult, paymentsResult] = await Promise.all([
      supabase
        .from("vendors")
        .select("*, user:users(id, full_name, email)")
        .eq("id", id)
        .single(),
      supabase
        .from("bikes")
        .select("id, name, model, manufacturer, displacement, daily_rate_1day, is_available")
        .eq("vendor_id", id)
        .order("created_at", { ascending: false }),
      supabase
        .from("reservations")
        .select(
          "id, status, total_amount, start_datetime, end_datetime, created_at, user:users(id, full_name, email), bike:bikes(id, name)"
        )
        .eq("vendor_id", id)
        .order("created_at", { ascending: false })
        .limit(20),
      supabase
        .from("payments")
        .select("amount, payment_type, status")
        .eq("vendor_id", id)
        .eq("status", "completed"),
    ]);

    const vendorData = vendorResult.data;
    if (vendorResult.error || !vendorData) {
      return NextResponse.json(
        { error: "Not found", message: "ベンダーが見つかりません" },
        { status: 404 }
      );
    }

    const payments = paymentsResult.data || [];
    const reservations = reservationsResult.data || [];
    const bikes = bikesResult.data || [];

    const ecAmount = payments
      .filter((p) => p.payment_type === "ec_credit")
      .reduce((sum, p) => sum + p.amount, 0);
    const onsiteAmount = payments
      .filter((p) => p.payment_type === "onsite_cash" || p.payment_type === "onsite_credit")
      .reduce((sum, p) => sum + p.amount, 0);

    // 予約の売上集計
    const { data: revenueData } = await supabase
      .from("reservations")
      .select("total_amount, status")
      .eq("vendor_id", id);

    const allRes = revenueData || [];
    const totalRevenue = allRes
      .filter((r) => r.status !== "cancelled")
      .reduce((sum, r) => sum + r.total_amount, 0);

    return NextResponse.json({
      data: {
        vendor: vendorData,
        stats: {
          total_revenue: totalRevenue,
          ec_amount: ecAmount,
          onsite_amount: onsiteAmount,
          total_reservations: allRes.length,
          completed_reservations: allRes.filter((r) => r.status === "completed").length,
          bikes_count: bikes.length,
        },
        bikes,
        reservations,
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

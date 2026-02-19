import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/requireAuth";
import type { PaymentStatus } from "@/types/database";

export async function GET(request: NextRequest) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const { supabase } = authResult;
  const searchParams = request.nextUrl.searchParams;

  const status = searchParams.get("status");
  const vendorId = searchParams.get("vendorId");
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");
  const limit = parseInt(searchParams.get("limit") || "50");
  const offset = parseInt(searchParams.get("offset") || "0");

  let query = supabase
    .from("payments")
    .select(
      `
      *,
      reservation:reservations(id, user_id, bike_id, start_datetime, end_datetime),
      vendor:vendors(id, name, slug)
    `,
      { count: "exact" }
    )
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (status) {
    query = query.eq("status", status as PaymentStatus);
  }

  if (vendorId) {
    query = query.eq("vendor_id", vendorId);
  }

  if (startDate) {
    query = query.gte("created_at", startDate);
  }

  if (endDate) {
    query = query.lte("created_at", endDate);
  }

  const { data, error, count } = await query;

  if (error) {
    return NextResponse.json(
      { error: "Database error", message: error.message },
      { status: 500 }
    );
  }

  // Get summary stats
  const { data: allPaymentsData } = await supabase
    .from("payments")
    .select("status, amount, refund_amount");

  const allPayments = (allPaymentsData || []) as { status: PaymentStatus; amount: number; refund_amount: number | null }[];

  const summary = {
    total: allPayments.length,
    completed: allPayments.filter((p) => p.status === "completed").length,
    refunded: allPayments.filter((p) => p.status === "refunded").length,
    failed: allPayments.filter((p) => p.status === "failed").length,
    totalAmount: allPayments
      .filter((p) => p.status === "completed")
      .reduce((sum, p) => sum + (p.amount || 0), 0),
    totalRefunded: allPayments.reduce((sum, p) => sum + (p.refund_amount || 0), 0),
  };

  return NextResponse.json({
    data,
    summary,
    pagination: {
      total: count || 0,
      limit,
      offset,
    },
    message: "OK",
  });
}

import { NextRequest, NextResponse } from "next/server";
import { requireVendor } from "@/lib/auth/requireAuth";
import type { ReservationStatus } from "@/types/database";

export async function GET(request: NextRequest) {
  const authResult = await requireVendor(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const { vendor, supabase } = authResult;
  const searchParams = request.nextUrl.searchParams;

  const status = searchParams.get("status");
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");
  const limit = parseInt(searchParams.get("limit") || "50");
  const offset = parseInt(searchParams.get("offset") || "0");

  let query = supabase
    .from("reservations")
    .select(
      `
      *,
      bike:bikes(id, name, model, image_urls),
      user:users(id, full_name, email, phone)
    `
    )
    .eq("vendor_id", vendor.id)
    .order("start_datetime", { ascending: true })
    .range(offset, offset + limit - 1);

  if (status) {
    query = query.eq("status", status as ReservationStatus);
  }

  if (startDate) {
    query = query.gte("start_datetime", startDate);
  }

  if (endDate) {
    query = query.lte("end_datetime", endDate);
  }

  const { data, error, count } = await query;

  if (error) {
    return NextResponse.json(
      { error: "Database error", message: error.message },
      { status: 500 }
    );
  }

  // Get summary counts
  const { data: statusCountsData } = await supabase
    .from("reservations")
    .select("status")
    .eq("vendor_id", vendor.id);

  const statusCounts = (statusCountsData || []) as { status: ReservationStatus }[];

  const summary = {
    total: statusCounts.length,
    pending: statusCounts.filter((r) => r.status === "pending").length,
    confirmed: statusCounts.filter((r) => r.status === "confirmed").length,
    in_use: statusCounts.filter((r) => r.status === "in_use").length,
    completed: statusCounts.filter((r) => r.status === "completed").length,
    cancelled: statusCounts.filter((r) => r.status === "cancelled").length,
  };

  return NextResponse.json({
    data,
    summary,
    pagination: {
      total: count || data?.length || 0,
      limit,
      offset,
    },
    message: "OK",
  });
}

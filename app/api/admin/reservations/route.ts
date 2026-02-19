import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/requireAuth";
import type { ReservationStatus } from "@/types/database";

interface AdminReservation {
  id: string;
  status: ReservationStatus;
  total_amount: number;
  user_id: string;
  bike_id: string;
  vendor_id: string;
  start_datetime: string;
  end_datetime: string;
  created_at: string;
  user: { id: string; full_name: string | null; email: string } | null;
  bike: { id: string; name: string; model: string } | null;
  vendor: { id: string; name: string; slug: string } | null;
}

export async function GET(request: NextRequest) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const { supabase } = authResult;
  const searchParams = request.nextUrl.searchParams;

  const status = searchParams.get("status");
  const vendorId = searchParams.get("vendorId");
  const userId = searchParams.get("userId");
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");
  const search = searchParams.get("search");
  const limit = parseInt(searchParams.get("limit") || "50");
  const offset = parseInt(searchParams.get("offset") || "0");

  let query = supabase
    .from("reservations")
    .select(
      `
      *,
      bike:bikes(id, name, model),
      user:users(id, full_name, email),
      vendor:vendors(id, name, slug)
    `,
      { count: "exact" }
    )
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (status) {
    query = query.eq("status", status as ReservationStatus);
  }

  if (vendorId) {
    query = query.eq("vendor_id", vendorId);
  }

  if (userId) {
    query = query.eq("user_id", userId);
  }

  if (startDate) {
    query = query.gte("start_datetime", startDate);
  }

  if (endDate) {
    query = query.lte("end_datetime", endDate);
  }

  const { data: dataRaw, error, count } = await query;

  if (error) {
    return NextResponse.json(
      { error: "Database error", message: error.message },
      { status: 500 }
    );
  }

  const data = (dataRaw || []) as AdminReservation[];

  // Filter by search term if provided (client-side filtering for simplicity)
  let filteredData = data;
  if (search) {
    const searchLower = search.toLowerCase();
    filteredData = filteredData.filter(
      (r) =>
        r.id.toLowerCase().includes(searchLower) ||
        r.user?.full_name?.toLowerCase().includes(searchLower) ||
        r.user?.email?.toLowerCase().includes(searchLower) ||
        r.bike?.name?.toLowerCase().includes(searchLower) ||
        r.vendor?.name?.toLowerCase().includes(searchLower)
    );
  }

  // Get summary stats
  const { data: allReservationsData } = await supabase
    .from("reservations")
    .select("status, total_amount");

  const allReservations = (allReservationsData || []) as { status: ReservationStatus; total_amount: number }[];

  const summary = {
    total: allReservations.length,
    pending: allReservations.filter((r) => r.status === "pending").length,
    confirmed: allReservations.filter((r) => r.status === "confirmed").length,
    in_use: allReservations.filter((r) => r.status === "in_use").length,
    completed: allReservations.filter((r) => r.status === "completed").length,
    cancelled: allReservations.filter((r) => r.status === "cancelled").length,
    totalRevenue: allReservations
      .filter((r) => r.status === "completed" || r.status === "in_use")
      .reduce((sum, r) => sum + (r.total_amount || 0), 0),
  };

  return NextResponse.json({
    data: filteredData,
    summary,
    pagination: {
      total: count || 0,
      limit,
      offset,
    },
    message: "OK",
  });
}

import { NextRequest, NextResponse } from "next/server";
import { requireVendor } from "@/lib/auth/requireAuth";
import { isSandboxMode, sandboxLog } from "@/lib/sandbox";
import { mockReservations } from "@/lib/mock/reservations";
import { mockUsers } from "@/lib/mock/users";
import { mockBikes } from "@/lib/mock/bikes";
import { mockVendors } from "@/lib/mock/vendors";
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

  if (isSandboxMode()) {
    sandboxLog("GET /api/vendor/reservations", `vendor=${vendor.id}`);
    let filtered = mockReservations.filter((r) => r.vendor_id === vendor.id);
    if (status) filtered = filtered.filter((r) => r.status === status);
    if (startDate) filtered = filtered.filter((r) => r.start_datetime >= startDate);
    if (endDate) filtered = filtered.filter((r) => r.end_datetime <= endDate);

    const allVendor = mockReservations.filter((r) => r.vendor_id === vendor.id);
    const summary = {
      total: allVendor.length,
      pending: allVendor.filter((r) => r.status === "pending").length,
      confirmed: allVendor.filter((r) => r.status === "confirmed").length,
      in_use: allVendor.filter((r) => r.status === "in_use").length,
      completed: allVendor.filter((r) => r.status === "completed").length,
      cancelled: allVendor.filter((r) => r.status === "cancelled").length,
    };

    const paged = filtered.slice(offset, offset + limit);
    // FEが期待するフラットフィールドを付与
    const enriched = paged.map((r) => {
      const user = mockUsers.find((u) => u.id === r.user_id);
      const bike = mockBikes.find((b) => b.id === r.bike_id);
      const vendorData = mockVendors.find((v) => v.id === r.vendor_id);
      return {
        ...r,
        bike_name: r.bikeName || bike?.name || "",
        user_name: user?.full_name || "",
        store_name: r.vendorName || vendorData?.name || "",
        registration_number: bike?.registration_number || "",
        chassis_number: bike?.frame_number || "",
      };
    });
    return NextResponse.json({
      data: enriched,
      summary,
      pagination: { total: filtered.length, limit, offset },
      message: "OK",
    });
  }

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

  // JOINネスト結果をフラット化（FEが bike_name, user_name 等を期待）
  const flatData = (data || []).map((row: any) => {
    const { bike, user, ...rest } = row;
    return {
      ...rest,
      bike_name: bike?.name || "",
      user_name: user?.full_name || "",
      store_name: vendor.name || "",
      registration_number: bike?.registration_number || "",
      chassis_number: bike?.frame_number || "",
    };
  });

  return NextResponse.json({
    data: flatData,
    summary,
    pagination: {
      total: count || data?.length || 0,
      limit,
      offset,
    },
    message: "OK",
  });
}

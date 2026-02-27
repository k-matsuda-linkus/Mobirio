import { NextRequest, NextResponse } from "next/server";
import { requireVendor } from "@/lib/auth/requireAuth";
import { isSandboxMode, sandboxLog } from "@/lib/sandbox";

/**
 * GET /api/vendor/exports/royalty
 * Export royalty detail data for a given year/month.
 * Query params: year, month
 */
export async function GET(request: NextRequest) {
  const authResult = await requireVendor(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const { vendor, supabase } = authResult;
  const searchParams = request.nextUrl.searchParams;
  const year = searchParams.get("year");
  const month = searchParams.get("month");

  if (!year || !month) {
    return NextResponse.json(
      { error: "Bad request", message: "year と month は必須です" },
      { status: 400 }
    );
  }

  if (isSandboxMode()) {
    sandboxLog("GET /api/vendor/exports/royalty", `vendor=${vendor.id}, year=${year}, month=${month}`);

    const commissionRate = vendor.commission_rate || 0.1;

    const mockRoyaltyData = {
      vendor_id: vendor.id,
      vendor_name: vendor.name,
      year: parseInt(year),
      month: parseInt(month),
      records: [
        {
          reservation_id: "rsv-001",
          bike_name: "PCX 125",
          user_name: "田中太郎",
          rental_amount: 24000,
          option_amount: 1500,
          insurance_amount: 1500,
          total_amount: 27000,
          royalty_rate: commissionRate,
          royalty_amount: Math.round(27000 * commissionRate),
          net_amount: 27000 - Math.round(27000 * commissionRate),
          completed_at: `${year}-${month.padStart(2, "0")}-07T18:00:00Z`,
        },
      ],
      summary: {
        total_revenue: 27000,
        total_royalty: Math.round(27000 * commissionRate),
        total_net: 27000 - Math.round(27000 * commissionRate),
        royalty_rate: commissionRate,
      },
    };

    return NextResponse.json({ data: mockRoyaltyData, message: "OK" });
  }

  // 本番: Supabase
  const monthStr = month.padStart(2, "0");
  const startDate = `${year}-${monthStr}-01`;
  const daysInMonth = new Date(parseInt(year), parseInt(month), 0).getDate();
  const endDate = `${year}-${monthStr}-${daysInMonth}T23:59:59`;

  const { data: reservations, error } = await supabase
    .from("reservations")
    .select("id, bike_id, user_id, base_amount, option_amount, insurance_amount, total_amount, checkout_at, status")
    .eq("vendor_id", vendor.id)
    .eq("status", "completed")
    .gte("checkout_at", startDate)
    .lte("checkout_at", endDate);

  if (error) {
    return NextResponse.json(
      { error: "Database error", message: error.message },
      { status: 500 }
    );
  }

  const rsvList = reservations || [];
  const commissionRate = vendor.commission_rate || 0.1;

  // バイク名・ユーザー名取得
  const bikeIds = [...new Set(rsvList.map((r) => r.bike_id))];
  const userIds = [...new Set(rsvList.map((r) => r.user_id))];

  const [bikesRes, usersRes] = await Promise.all([
    bikeIds.length > 0
      ? supabase.from("bikes").select("id, name").in("id", bikeIds)
      : { data: [], error: null },
    userIds.length > 0
      ? supabase.from("users").select("id, full_name").in("id", userIds)
      : { data: [], error: null },
  ]);

  const bikeMap: Record<string, string> = {};
  for (const b of bikesRes.data || []) bikeMap[b.id] = b.name;

  const userMap: Record<string, string> = {};
  for (const u of usersRes.data || []) userMap[u.id] = u.full_name || "";

  const records = rsvList.map((r) => {
    const totalAmt = r.total_amount || 0;
    const royaltyAmount = Math.round(totalAmt * commissionRate);

    return {
      reservation_id: r.id,
      bike_name: bikeMap[r.bike_id] || r.bike_id,
      user_name: userMap[r.user_id] || r.user_id,
      rental_amount: r.base_amount || 0,
      option_amount: r.option_amount || 0,
      insurance_amount: r.insurance_amount || 0,
      total_amount: totalAmt,
      royalty_rate: commissionRate,
      royalty_amount: royaltyAmount,
      net_amount: totalAmt - royaltyAmount,
      completed_at: r.checkout_at,
    };
  });

  const totalRevenue = records.reduce((s, r) => s + r.total_amount, 0);
  const totalRoyalty = records.reduce((s, r) => s + r.royalty_amount, 0);

  return NextResponse.json({
    data: {
      vendor_id: vendor.id,
      vendor_name: vendor.name,
      year: parseInt(year),
      month: parseInt(month),
      records,
      summary: {
        total_revenue: totalRevenue,
        total_royalty: totalRoyalty,
        total_net: totalRevenue - totalRoyalty,
        royalty_rate: commissionRate,
      },
    },
    message: "OK",
  });
}

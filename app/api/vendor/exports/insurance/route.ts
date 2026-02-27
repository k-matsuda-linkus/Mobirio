import { NextRequest, NextResponse } from "next/server";
import { requireVendor } from "@/lib/auth/requireAuth";
import { isSandboxMode, sandboxLog } from "@/lib/sandbox";

/**
 * GET /api/vendor/exports/insurance
 * Export insurance detail data for a given year/month.
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
    sandboxLog("GET /api/vendor/exports/insurance", `vendor=${vendor.id}, year=${year}, month=${month}`);

    const mockInsuranceData = {
      vendor_id: vendor.id,
      vendor_name: vendor.name,
      year: parseInt(year),
      month: parseInt(month),
      records: [
        {
          reservation_id: "rsv-001",
          bike_name: "PCX 125",
          user_name: "田中太郎",
          start_date: `${year}-${month.padStart(2, "0")}-05`,
          end_date: `${year}-${month.padStart(2, "0")}-07`,
          days: 3,
          insurance_type: "standard",
          insurance_daily_rate: 500,
          insurance_total: 1500,
        },
        {
          reservation_id: "rsv-002",
          bike_name: "MT-25",
          user_name: "佐藤花子",
          start_date: `${year}-${month.padStart(2, "0")}-10`,
          end_date: `${year}-${month.padStart(2, "0")}-12`,
          days: 3,
          insurance_type: "premium",
          insurance_daily_rate: 1000,
          insurance_total: 3000,
        },
      ],
      summary: {
        total_reservations: 2,
        total_insurance_amount: 4500,
      },
    };

    return NextResponse.json({ data: mockInsuranceData, message: "OK" });
  }

  // 本番: Supabase
  const monthStr = month.padStart(2, "0");
  const startDate = `${year}-${monthStr}-01`;
  const daysInMonth = new Date(parseInt(year), parseInt(month), 0).getDate();
  const endDate = `${year}-${monthStr}-${daysInMonth}T23:59:59`;

  const { data: reservations, error } = await supabase
    .from("reservations")
    .select("id, bike_id, user_id, start_datetime, end_datetime, insurance_amount, status")
    .eq("vendor_id", vendor.id)
    .neq("status", "cancelled")
    .gte("start_datetime", startDate)
    .lte("start_datetime", endDate)
    .gt("insurance_amount", 0);

  if (error) {
    return NextResponse.json(
      { error: "Database error", message: error.message },
      { status: 500 }
    );
  }

  const rsvList = reservations || [];

  // バイク名・ユーザー名を取得
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
    const start = new Date(r.start_datetime);
    const end = new Date(r.end_datetime);
    const days = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
    const dailyRate = days > 0 ? Math.round(r.insurance_amount / days) : 0;

    return {
      reservation_id: r.id,
      bike_name: bikeMap[r.bike_id] || r.bike_id,
      user_name: userMap[r.user_id] || r.user_id,
      start_date: r.start_datetime.slice(0, 10),
      end_date: r.end_datetime.slice(0, 10),
      days,
      insurance_type: "standard",
      insurance_daily_rate: dailyRate,
      insurance_total: r.insurance_amount,
    };
  });

  const totalInsurance = records.reduce((s, r) => s + r.insurance_total, 0);

  return NextResponse.json({
    data: {
      vendor_id: vendor.id,
      vendor_name: vendor.name,
      year: parseInt(year),
      month: parseInt(month),
      records,
      summary: {
        total_reservations: records.length,
        total_insurance_amount: totalInsurance,
      },
    },
    message: "OK",
  });
}

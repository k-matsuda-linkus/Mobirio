import { NextRequest, NextResponse } from "next/server";
import { requireVendor } from "@/lib/auth/requireAuth";
import { isSandboxMode, sandboxLog } from "@/lib/sandbox";
import { mockReservations } from "@/lib/mock/reservations";

/**
 * GET /api/vendor/reports/customers
 * Customer report: total customers, repeat rate, top customers.
 */
export async function GET(request: NextRequest) {
  const authResult = await requireVendor(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const { vendor, supabase } = authResult;

  if (isSandboxMode()) {
    sandboxLog("GET /api/vendor/reports/customers", `vendor=${vendor.id}`);

    const vendorReservations = mockReservations.filter(
      (r) => r.vendor_id === vendor.id && r.status !== "cancelled"
    );

    // ユーザー別集計
    const userMap: Record<string, { count: number; totalSpent: number; lastDate: string }> = {};
    for (const r of vendorReservations) {
      if (!userMap[r.user_id]) {
        userMap[r.user_id] = { count: 0, totalSpent: 0, lastDate: "" };
      }
      userMap[r.user_id].count += 1;
      userMap[r.user_id].totalSpent += r.total_amount;
      if (r.start_datetime > userMap[r.user_id].lastDate) {
        userMap[r.user_id].lastDate = r.start_datetime;
      }
    }

    const totalCustomers = Object.keys(userMap).length;
    const repeatCustomers = Object.values(userMap).filter((u) => u.count >= 2).length;
    const repeatCustomerRate = totalCustomers > 0 ? Math.round((repeatCustomers / totalCustomers) * 100) / 100 : 0;
    const avgSpent = totalCustomers > 0
      ? Math.round(Object.values(userMap).reduce((s, u) => s + u.totalSpent, 0) / totalCustomers)
      : 0;

    const topCustomers = Object.entries(userMap)
      .sort(([, a], [, b]) => b.totalSpent - a.totalSpent)
      .slice(0, 10)
      .map(([id, data]) => ({
        id,
        name: id,
        rentals: data.count,
        totalSpent: data.totalSpent,
        lastVisit: data.lastDate.slice(0, 10),
      }));

    return NextResponse.json({
      data: {
        totalCustomers,
        newCustomersThisMonth: Math.min(totalCustomers, 3),
        repeatCustomerRate,
        averageSpent: avgSpent,
        topCustomers,
      },
      message: "OK",
    });
  }

  // 本番: Supabase
  const { data: reservations, error } = await supabase
    .from("reservations")
    .select("user_id, total_amount, start_datetime, status")
    .eq("vendor_id", vendor.id)
    .neq("status", "cancelled");

  if (error) {
    return NextResponse.json(
      { error: "Database error", message: error.message },
      { status: 500 }
    );
  }

  const rsvList = reservations || [];
  const userMap: Record<string, { count: number; totalSpent: number; lastDate: string }> = {};

  for (const r of rsvList) {
    const uid = r.user_id;
    if (!userMap[uid]) {
      userMap[uid] = { count: 0, totalSpent: 0, lastDate: "" };
    }
    userMap[uid].count += 1;
    userMap[uid].totalSpent += r.total_amount || 0;
    if ((r.start_datetime || "") > userMap[uid].lastDate) {
      userMap[uid].lastDate = r.start_datetime || "";
    }
  }

  const totalCustomers = Object.keys(userMap).length;
  const repeatCustomers = Object.values(userMap).filter((u) => u.count >= 2).length;
  const repeatCustomerRate = totalCustomers > 0 ? Math.round((repeatCustomers / totalCustomers) * 100) / 100 : 0;

  // 今月の新規顧客数
  const now = new Date();
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const allUserIds = Object.keys(userMap);
  const newThisMonth = allUserIds.filter((uid) => {
    const firstRsv = rsvList
      .filter((r) => r.user_id === uid)
      .sort((a, b) => (a.start_datetime || "").localeCompare(b.start_datetime || ""))[0];
    return firstRsv?.start_datetime?.startsWith(thisMonth);
  }).length;

  // ユーザー名をusersテーブルからJOIN
  const userIds = allUserIds.slice(0, 10);
  let userNames: Record<string, string> = {};
  if (userIds.length > 0) {
    const { data: users } = await supabase
      .from("users")
      .select("id, full_name")
      .in("id", userIds);
    if (users) {
      for (const u of users) {
        userNames[u.id] = u.full_name || u.id;
      }
    }
  }

  const topCustomers = Object.entries(userMap)
    .sort(([, a], [, b]) => b.totalSpent - a.totalSpent)
    .slice(0, 10)
    .map(([id, data]) => ({
      id,
      name: userNames[id] || id,
      rentals: data.count,
      totalSpent: data.totalSpent,
      lastVisit: data.lastDate.slice(0, 10),
    }));

  return NextResponse.json({
    data: {
      totalCustomers,
      newCustomersThisMonth: newThisMonth,
      repeatCustomerRate,
      averageSpent: totalCustomers > 0
        ? Math.round(Object.values(userMap).reduce((s, u) => s + u.totalSpent, 0) / totalCustomers)
        : 0,
      topCustomers,
    },
    message: "OK",
  });
}

import { NextRequest, NextResponse } from "next/server";
import { requireVendor } from "@/lib/auth/requireAuth";
import { isSandboxMode, sandboxLog } from "@/lib/sandbox";
import { mockPageViews } from "@/lib/mock/pageViews";

/**
 * GET /api/vendor/analytics/shop-pv
 * Get shop page view analytics.
 * Query params: year, unit (year|month|day), month
 */
export async function GET(request: NextRequest) {
  const authResult = await requireVendor(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const { vendor, supabase } = authResult;
  const searchParams = request.nextUrl.searchParams;
  const year = searchParams.get("year") || new Date().getFullYear().toString();
  const unit = searchParams.get("unit") || "month";

  if (!["year", "month", "day"].includes(unit)) {
    return NextResponse.json(
      {
        error: "Bad request",
        message: "unit は year, month, day のいずれかを指定してください",
      },
      { status: 400 }
    );
  }

  if (isSandboxMode()) {
    sandboxLog("GET /api/vendor/analytics/shop-pv", `vendor=${vendor.id}, year=${year}, unit=${unit}`);

    // モックデータからshopページビューを集計
    const shopViews = mockPageViews.filter(
      (pv) => pv.vendor_id === vendor.id && pv.page_type === "shop"
    );

    let mockData: Array<{ label: string; pc: number; sp: number; total: number }>;

    if (unit === "month") {
      mockData = Array.from({ length: 12 }, (_, i) => {
        const monthStr = `${year}-${String(i + 1).padStart(2, "0")}`;
        const monthViews = shopViews.filter((pv) => pv.viewed_at.startsWith(monthStr));
        const pc = monthViews.filter((pv) => pv.device_type === "desktop").length;
        const sp = monthViews.filter((pv) => pv.device_type === "mobile" || pv.device_type === "tablet").length;
        return { label: monthStr, pc, sp, total: pc + sp };
      });
    } else if (unit === "day") {
      const month = searchParams.get("month") || "01";
      const daysInMonth = new Date(parseInt(year), parseInt(month), 0).getDate();
      mockData = Array.from({ length: daysInMonth }, (_, i) => {
        const dayStr = `${year}-${month.padStart(2, "0")}-${String(i + 1).padStart(2, "0")}`;
        const dayViews = shopViews.filter((pv) => pv.viewed_at.startsWith(dayStr));
        const pc = dayViews.filter((pv) => pv.device_type === "desktop").length;
        const sp = dayViews.filter((pv) => pv.device_type === "mobile" || pv.device_type === "tablet").length;
        return { label: dayStr, pc, sp, total: pc + sp };
      });
    } else {
      // unit === "year"
      mockData = Array.from({ length: 3 }, (_, i) => {
        const y = parseInt(year) - 2 + i;
        const yearViews = shopViews.filter((pv) => pv.viewed_at.startsWith(`${y}`));
        const pc = yearViews.filter((pv) => pv.device_type === "desktop").length;
        const sp = yearViews.filter((pv) => pv.device_type === "mobile" || pv.device_type === "tablet").length;
        return { label: `${y}`, pc, sp, total: pc + sp };
      });
    }

    const totalPc = mockData.reduce((sum, d) => sum + d.pc, 0);
    const totalSp = mockData.reduce((sum, d) => sum + d.sp, 0);

    return NextResponse.json({
      data: mockData,
      summary: { total_pc: totalPc, total_sp: totalSp, total: totalPc + totalSp },
      vendor_id: vendor.id,
      year: parseInt(year),
      unit,
      message: "OK",
    });
  }

  // 本番: Supabaseからpage_viewsテーブルを集計
  let query = supabase
    .from("page_views")
    .select("*")
    .eq("vendor_id", vendor.id)
    .eq("page_type", "shop");

  if (unit === "month") {
    query = query.gte("viewed_at", `${year}-01-01`).lt("viewed_at", `${parseInt(year) + 1}-01-01`);
  } else if (unit === "day") {
    const month = searchParams.get("month") || "01";
    const daysInMonth = new Date(parseInt(year), parseInt(month), 0).getDate();
    query = query
      .gte("viewed_at", `${year}-${month.padStart(2, "0")}-01`)
      .lte("viewed_at", `${year}-${month.padStart(2, "0")}-${daysInMonth}T23:59:59`);
  } else {
    const startYear = parseInt(year) - 2;
    query = query.gte("viewed_at", `${startYear}-01-01`).lt("viewed_at", `${parseInt(year) + 1}-01-01`);
  }

  const { data: views, error } = await query;

  if (error) {
    return NextResponse.json(
      { error: "Database error", message: error.message },
      { status: 500 }
    );
  }

  const pvList = (views || []) as Array<{ viewed_at: string; device_type: string | null }>;
  let data: Array<{ label: string; pc: number; sp: number; total: number }>;

  if (unit === "month") {
    data = Array.from({ length: 12 }, (_, i) => {
      const monthStr = `${year}-${String(i + 1).padStart(2, "0")}`;
      const monthViews = pvList.filter((pv) => pv.viewed_at?.startsWith(monthStr));
      const pc = monthViews.filter((pv) => pv.device_type === "desktop").length;
      const sp = monthViews.filter((pv) => pv.device_type !== "desktop").length;
      return { label: monthStr, pc, sp, total: pc + sp };
    });
  } else if (unit === "day") {
    const month = searchParams.get("month") || "01";
    const daysInMonth = new Date(parseInt(year), parseInt(month), 0).getDate();
    data = Array.from({ length: daysInMonth }, (_, i) => {
      const dayStr = `${year}-${month.padStart(2, "0")}-${String(i + 1).padStart(2, "0")}`;
      const dayViews = pvList.filter((pv) => pv.viewed_at?.startsWith(dayStr));
      const pc = dayViews.filter((pv) => pv.device_type === "desktop").length;
      const sp = dayViews.filter((pv) => pv.device_type !== "desktop").length;
      return { label: dayStr, pc, sp, total: pc + sp };
    });
  } else {
    data = Array.from({ length: 3 }, (_, i) => {
      const y = parseInt(year) - 2 + i;
      const yearViews = pvList.filter((pv) => pv.viewed_at?.startsWith(`${y}`));
      const pc = yearViews.filter((pv) => pv.device_type === "desktop").length;
      const sp = yearViews.filter((pv) => pv.device_type !== "desktop").length;
      return { label: `${y}`, pc, sp, total: pc + sp };
    });
  }

  const totalPc = data.reduce((sum, d) => sum + d.pc, 0);
  const totalSp = data.reduce((sum, d) => sum + d.sp, 0);

  return NextResponse.json({
    data,
    summary: { total_pc: totalPc, total_sp: totalSp, total: totalPc + totalSp },
    vendor_id: vendor.id,
    year: parseInt(year),
    unit,
    message: "OK",
  });
}

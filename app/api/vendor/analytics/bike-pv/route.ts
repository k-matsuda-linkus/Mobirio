import { NextRequest, NextResponse } from "next/server";
import { requireVendor } from "@/lib/auth/requireAuth";
import { isSandboxMode, sandboxLog } from "@/lib/sandbox";
import { mockPageViews } from "@/lib/mock/pageViews";
import { mockBikes } from "@/lib/mock/bikes";

/**
 * GET /api/vendor/analytics/bike-pv
 * Get per-bike page view analytics.
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

  const generatePeriods = () => {
    if (unit === "month") {
      return Array.from({ length: 12 }, (_, i) =>
        `${year}-${String(i + 1).padStart(2, "0")}`
      );
    } else if (unit === "day") {
      const month = searchParams.get("month") || "01";
      const daysInMonth = new Date(parseInt(year), parseInt(month), 0).getDate();
      return Array.from({ length: daysInMonth }, (_, i) =>
        `${year}-${month.padStart(2, "0")}-${String(i + 1).padStart(2, "0")}`
      );
    } else {
      return Array.from({ length: 3 }, (_, i) => `${parseInt(year) - 2 + i}`);
    }
  };

  const periods = generatePeriods();

  if (isSandboxMode()) {
    sandboxLog("GET /api/vendor/analytics/bike-pv", `vendor=${vendor.id}, year=${year}, unit=${unit}`);

    const vendorBikes = mockBikes.filter((b) => b.vendor_id === vendor.id);
    const bikeViews = mockPageViews.filter(
      (pv) => pv.vendor_id === vendor.id && pv.page_type === "bike_detail"
    );

    const data = vendorBikes.map((bike) => ({
      bike_id: bike.id,
      bike_name: bike.name,
      periods: periods.map((label) => {
        const views = bikeViews.filter(
          (pv) => pv.bike_id === bike.id && pv.viewed_at.startsWith(label)
        );
        const pc = views.filter((pv) => pv.device_type === "desktop").length;
        const sp = views.filter((pv) => pv.device_type === "mobile" || pv.device_type === "tablet").length;
        return { label, pc, sp, total: pc + sp };
      }),
    }));

    return NextResponse.json({
      data,
      vendor_id: vendor.id,
      year: parseInt(year),
      unit,
      message: "OK",
    });
  }

  // 本番: Supabase
  const { data: bikes, error: bikesError } = await supabase
    .from("bikes")
    .select("id, name")
    .eq("vendor_id", vendor.id);

  if (bikesError) {
    return NextResponse.json(
      { error: "Database error", message: bikesError.message },
      { status: 500 }
    );
  }

  let pvQuery = supabase
    .from("page_views")
    .select("*")
    .eq("vendor_id", vendor.id)
    .eq("page_type", "bike_detail");

  if (unit === "year") {
    const startYear = parseInt(year) - 2;
    pvQuery = pvQuery.gte("viewed_at", `${startYear}-01-01`).lt("viewed_at", `${parseInt(year) + 1}-01-01`);
  } else if (unit === "day") {
    const month = searchParams.get("month") || "01";
    const daysInMonth = new Date(parseInt(year), parseInt(month), 0).getDate();
    pvQuery = pvQuery
      .gte("viewed_at", `${year}-${month.padStart(2, "0")}-01`)
      .lte("viewed_at", `${year}-${month.padStart(2, "0")}-${daysInMonth}T23:59:59`);
  } else {
    pvQuery = pvQuery.gte("viewed_at", `${year}-01-01`).lt("viewed_at", `${parseInt(year) + 1}-01-01`);
  }

  const { data: views, error: pvError } = await pvQuery;

  if (pvError) {
    return NextResponse.json(
      { error: "Database error", message: pvError.message },
      { status: 500 }
    );
  }

  const pvList = (views || []) as Array<{ bike_id: string | null; viewed_at: string; device_type: string | null }>;
  const bikeList = bikes || [];

  const data = bikeList.map((bike) => ({
    bike_id: bike.id,
    bike_name: bike.name,
    periods: periods.map((label) => {
      const periodViews = pvList.filter(
        (pv) => pv.bike_id === bike.id && pv.viewed_at?.startsWith(label)
      );
      const pc = periodViews.filter((pv) => pv.device_type === "desktop").length;
      const sp = periodViews.filter((pv) => pv.device_type !== "desktop").length;
      return { label, pc, sp, total: pc + sp };
    }),
  }));

  return NextResponse.json({
    data,
    vendor_id: vendor.id,
    year: parseInt(year),
    unit,
    message: "OK",
  });
}

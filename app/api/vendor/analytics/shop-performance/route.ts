import { NextRequest, NextResponse } from "next/server";
import { requireVendor } from "@/lib/auth/requireAuth";
import { isSandboxMode, sandboxLog } from "@/lib/sandbox";
import { mockReservations } from "@/lib/mock/reservations";

/**
 * GET /api/vendor/analytics/shop-performance
 * Get shop-level performance analytics (amounts and reservation counts).
 * Query params: year, date_type (start|end|completed),
 *               paid_type (all|paid|unpaid), display (amount|count)
 */
export async function GET(request: NextRequest) {
  const authResult = await requireVendor(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const { vendor, supabase } = authResult;
  const searchParams = request.nextUrl.searchParams;
  const year = searchParams.get("year") || new Date().getFullYear().toString();
  const dateType = searchParams.get("date_type") || "start";
  const paidType = searchParams.get("paid_type") || "all";
  const display = searchParams.get("display") || "amount";

  const validDateTypes = ["start", "end", "completed"];
  const validPaidTypes = ["all", "paid", "unpaid"];
  const validDisplays = ["amount", "count"];

  if (!validDateTypes.includes(dateType)) {
    return NextResponse.json(
      { error: "Bad request", message: "date_type は start, end, completed のいずれかを指定してください" },
      { status: 400 }
    );
  }
  if (!validPaidTypes.includes(paidType)) {
    return NextResponse.json(
      { error: "Bad request", message: "paid_type は all, paid, unpaid のいずれかを指定してください" },
      { status: 400 }
    );
  }
  if (!validDisplays.includes(display)) {
    return NextResponse.json(
      { error: "Bad request", message: "display は amount, count のいずれかを指定してください" },
      { status: 400 }
    );
  }

  if (isSandboxMode()) {
    sandboxLog("GET /api/vendor/analytics/shop-performance", `vendor=${vendor.id}, year=${year}`);

    const vendorReservations = mockReservations.filter((r) => r.vendor_id === vendor.id);

    const getDateField = (r: (typeof vendorReservations)[0]) => {
      if (dateType === "end") return r.end_datetime;
      return r.start_datetime;
    };

    const filteredByPaid = vendorReservations.filter((r) => {
      if (paidType === "paid") return r.payment_settlement === "paid";
      if (paidType === "unpaid") return r.payment_settlement === "unpaid";
      return true;
    });

    const monthlyData = Array.from({ length: 12 }, (_, i) => {
      const month = i + 1;
      const monthStr = `${year}-${String(month).padStart(2, "0")}`;
      const monthReservations = filteredByPaid.filter((r) => {
        const dateVal = getDateField(r);
        return dateVal?.startsWith(monthStr);
      });

      if (display === "amount") {
        const rentalAmount = monthReservations.reduce((s, r) => s + r.base_amount, 0);
        const optionAmount = monthReservations.reduce((s, r) => s + r.option_amount, 0);
        const insuranceAmount = monthReservations.reduce((s, r) => s + r.insurance_amount, 0);
        return {
          label: monthStr,
          rental_amount: rentalAmount,
          option_amount: optionAmount,
          insurance_amount: insuranceAmount,
          total_amount: rentalAmount + optionAmount + insuranceAmount,
        };
      } else {
        return {
          label: monthStr,
          reservation_count: monthReservations.length,
          completed_count: monthReservations.filter((r) => r.status === "completed").length,
          cancelled_count: monthReservations.filter((r) => r.status === "cancelled").length,
        };
      }
    });

    const summary =
      display === "amount"
        ? {
            total_rental: monthlyData.reduce((s, d) => s + ((d as any).rental_amount || 0), 0),
            total_option: monthlyData.reduce((s, d) => s + ((d as any).option_amount || 0), 0),
            total_insurance: monthlyData.reduce((s, d) => s + ((d as any).insurance_amount || 0), 0),
            grand_total: monthlyData.reduce((s, d) => s + ((d as any).total_amount || 0), 0),
          }
        : {
            total_reservations: monthlyData.reduce((s, d) => s + ((d as any).reservation_count || 0), 0),
            total_completed: monthlyData.reduce((s, d) => s + ((d as any).completed_count || 0), 0),
            total_cancelled: monthlyData.reduce((s, d) => s + ((d as any).cancelled_count || 0), 0),
          };

    return NextResponse.json({
      data: monthlyData,
      summary,
      filters: { year: parseInt(year), date_type: dateType, paid_type: paidType, display },
      vendor_id: vendor.id,
      message: "OK",
    });
  }

  // 本番: Supabase
  const dateColumn = dateType === "end" ? "end_datetime" : dateType === "completed" ? "checkout_at" : "start_datetime";

  let query = supabase
    .from("reservations")
    .select("*")
    .eq("vendor_id", vendor.id)
    .gte(dateColumn, `${year}-01-01`)
    .lt(dateColumn, `${parseInt(year) + 1}-01-01`);

  if (paidType === "paid") {
    query = query.eq("payment_settlement", "paid");
  } else if (paidType === "unpaid") {
    query = query.eq("payment_settlement", "unpaid");
  }

  const { data: reservations, error } = await query;

  if (error) {
    return NextResponse.json(
      { error: "Database error", message: error.message },
      { status: 500 }
    );
  }

  type RsvRow = Record<string, unknown> & { base_amount?: number; option_amount?: number; insurance_amount?: number; status?: string };
  const rsvList = (reservations || []) as RsvRow[];

  const monthlyData = Array.from({ length: 12 }, (_, i) => {
    const month = i + 1;
    const monthStr = `${year}-${String(month).padStart(2, "0")}`;
    const monthReservations = rsvList.filter((r) => {
      const val = r[dateColumn] as string | undefined;
      return val?.startsWith(monthStr);
    });

    if (display === "amount") {
      const rentalAmount = monthReservations.reduce((s, r) => s + (r.base_amount || 0), 0);
      const optionAmount = monthReservations.reduce((s, r) => s + (r.option_amount || 0), 0);
      const insuranceAmount = monthReservations.reduce((s, r) => s + (r.insurance_amount || 0), 0);
      return {
        label: monthStr,
        rental_amount: rentalAmount,
        option_amount: optionAmount,
        insurance_amount: insuranceAmount,
        total_amount: rentalAmount + optionAmount + insuranceAmount,
      };
    } else {
      return {
        label: monthStr,
        reservation_count: monthReservations.length,
        completed_count: monthReservations.filter((r) => r.status === "completed").length,
        cancelled_count: monthReservations.filter((r) => r.status === "cancelled").length,
      };
    }
  });

  const summary =
    display === "amount"
      ? {
          total_rental: monthlyData.reduce((s, d) => s + ((d as any).rental_amount || 0), 0),
          total_option: monthlyData.reduce((s, d) => s + ((d as any).option_amount || 0), 0),
          total_insurance: monthlyData.reduce((s, d) => s + ((d as any).insurance_amount || 0), 0),
          grand_total: monthlyData.reduce((s, d) => s + ((d as any).total_amount || 0), 0),
        }
      : {
          total_reservations: monthlyData.reduce((s, d) => s + ((d as any).reservation_count || 0), 0),
          total_completed: monthlyData.reduce((s, d) => s + ((d as any).completed_count || 0), 0),
          total_cancelled: monthlyData.reduce((s, d) => s + ((d as any).cancelled_count || 0), 0),
        };

  return NextResponse.json({
    data: monthlyData,
    summary,
    filters: { year: parseInt(year), date_type: dateType, paid_type: paidType, display },
    vendor_id: vendor.id,
    message: "OK",
  });
}

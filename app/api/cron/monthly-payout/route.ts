import { NextRequest, NextResponse } from "next/server";
import { verifyCronSecret } from "@/lib/auth/requireAuth";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { subMonths, startOfMonth, endOfMonth, format } from "date-fns";
import type { PayoutStatus } from "@/types/database";

const DEFAULT_COMMISSION_RATE = 0.15; // 15%

interface VendorForPayout {
  id: string;
  name: string;
  commission_rate: number | null;
}

export async function GET(request: NextRequest) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createServerSupabaseClient();

  // Calculate last month's date range
  const lastMonth = subMonths(new Date(), 1);
  const periodStart = startOfMonth(lastMonth);
  const periodEnd = endOfMonth(lastMonth);

  const periodStartStr = format(periodStart, "yyyy-MM-dd") + "T00:00:00";
  const periodEndStr = format(periodEnd, "yyyy-MM-dd") + "T23:59:59";
  const periodLabel = format(lastMonth, "yyyy-MM");

  // Get all active vendors
  const { data: vendorsData, error: vendorError } = await supabase
    .from("vendors")
    .select("id, name, commission_rate")
    .eq("is_active", true)
    .eq("is_approved", true);

  if (vendorError) {
    return NextResponse.json(
      { error: "Database error", message: vendorError.message },
      { status: 500 }
    );
  }

  const vendors = (vendorsData || []) as VendorForPayout[];

  if (vendors.length === 0) {
    return NextResponse.json({
      success: true,
      message: "No active vendors found",
      processed: 0,
    });
  }

  let created = 0;
  let skipped = 0;
  const payouts: { vendorId: string; vendorName: string; gross: number; net: number }[] = [];

  for (const vendor of vendors) {
    // Check if payout already exists for this period
    const { data: existingPayout } = await supabase
      .from("vendor_payouts")
      .select("id")
      .eq("vendor_id", vendor.id)
      .eq("period_start", periodStartStr.split("T")[0])
      .single();

    if (existingPayout) {
      skipped++;
      continue;
    }

    // Get completed reservations for this vendor in the period
    const { data: completedReservationsData, error: resError } = await supabase
      .from("reservations")
      .select("id, total_amount")
      .eq("vendor_id", vendor.id)
      .eq("status", "completed")
      .gte("checkout_at", periodStartStr)
      .lte("checkout_at", periodEndStr);

    if (resError) {
      console.error(`Error fetching reservations for vendor ${vendor.id}:`, resError);
      continue;
    }

    const completedReservations = (completedReservationsData || []) as { id: string; total_amount: number }[];
    const grossAmount = completedReservations.reduce((sum, r) => sum + (r.total_amount || 0), 0);

    // Skip if no revenue
    if (grossAmount === 0) {
      skipped++;
      continue;
    }

    const commissionRate = vendor.commission_rate || DEFAULT_COMMISSION_RATE;
    const commissionAmount = Math.round(grossAmount * commissionRate);
    const netAmount = grossAmount - commissionAmount;

    // Create payout record
    const payoutInsert: {
      vendor_id: string;
      period_start: string;
      period_end: string;
      gross_amount: number;
      commission_amount: number;
      net_amount: number;
      status: PayoutStatus;
    } = {
      vendor_id: vendor.id,
      period_start: periodStartStr.split("T")[0],
      period_end: periodEndStr.split("T")[0],
      gross_amount: grossAmount,
      commission_amount: commissionAmount,
      net_amount: netAmount,
      status: "pending",
    };

    const { error: insertError } = await supabase.from("vendor_payouts").insert(payoutInsert as any);

    if (insertError) {
      console.error(`Error creating payout for vendor ${vendor.id}:`, insertError);
      continue;
    }

    created++;
    payouts.push({
      vendorId: vendor.id,
      vendorName: vendor.name,
      gross: grossAmount,
      net: netAmount,
    });
  }

  return NextResponse.json({
    success: true,
    message: "Monthly payouts processed",
    period: periodLabel,
    processed: vendors.length,
    created,
    skipped,
    payouts,
  });
}

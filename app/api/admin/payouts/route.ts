import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/requireAuth";
import type { PayoutStatus, VendorPayout } from "@/types/database";

export async function GET(request: NextRequest) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const { supabase } = authResult;
  const searchParams = request.nextUrl.searchParams;

  const status = searchParams.get("status");
  const vendorId = searchParams.get("vendorId");
  const limit = parseInt(searchParams.get("limit") || "50");
  const offset = parseInt(searchParams.get("offset") || "0");

  let query = supabase
    .from("vendor_payouts")
    .select(
      `
      *,
      vendor:vendors(id, name, slug)
    `,
      { count: "exact" }
    )
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (status) {
    query = query.eq("status", status as PayoutStatus);
  }

  if (vendorId) {
    query = query.eq("vendor_id", vendorId);
  }

  const { data, error, count } = await query;

  if (error) {
    return NextResponse.json(
      { error: "Database error", message: error.message },
      { status: 500 }
    );
  }

  // Get summary stats
  const { data: allPayoutsData } = await supabase
    .from("vendor_payouts")
    .select("status, gross_amount, commission_amount, net_amount");

  const allPayouts = (allPayoutsData || []) as { status: PayoutStatus; gross_amount: number; commission_amount: number; net_amount: number }[];

  const summary = {
    total: allPayouts.length,
    pending: allPayouts.filter((p) => p.status === "pending").length,
    processing: allPayouts.filter((p) => p.status === "processing").length,
    completed: allPayouts.filter((p) => p.status === "completed").length,
    totalGross: allPayouts.reduce((sum, p) => sum + (p.gross_amount || 0), 0),
    totalCommission: allPayouts.reduce((sum, p) => sum + (p.commission_amount || 0), 0),
    totalPaid: allPayouts
      .filter((p) => p.status === "completed")
      .reduce((sum, p) => sum + (p.net_amount || 0), 0),
  };

  return NextResponse.json({
    data,
    summary,
    pagination: {
      total: count || 0,
      limit,
      offset,
    },
    message: "OK",
  });
}

export async function POST(request: NextRequest) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const { supabase } = authResult;

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON", message: "リクエストボディが不正です" },
      { status: 400 }
    );
  }

  const { payoutId, action } = body;

  if (!payoutId || !action) {
    return NextResponse.json(
      { error: "Bad request", message: "payoutId と action は必須です" },
      { status: 400 }
    );
  }

  // Get payout
  const { data: payoutData, error: fetchError } = await supabase
    .from("vendor_payouts")
    .select("*")
    .eq("id", payoutId)
    .single();

  if (fetchError || !payoutData) {
    return NextResponse.json(
      { error: "Not found", message: "支払い記録が見つかりません" },
      { status: 404 }
    );
  }

  const payout = payoutData as VendorPayout;

  let newStatus: PayoutStatus;
  const now = new Date().toISOString();

  if (action === "process") {
    if (payout.status !== "pending") {
      return NextResponse.json(
        { error: "Conflict", message: "この支払いは処理開始できません" },
        { status: 409 }
      );
    }
    newStatus = "processing";
  } else if (action === "complete") {
    if (payout.status !== "processing") {
      return NextResponse.json(
        { error: "Conflict", message: "この支払いは完了にできません" },
        { status: 409 }
      );
    }
    newStatus = "completed";
  } else {
    return NextResponse.json(
      { error: "Bad request", message: "不正なアクションです" },
      { status: 400 }
    );
  }

  const updateData: { status: PayoutStatus; updated_at: string; paid_at?: string } = {
    status: newStatus,
    updated_at: now,
  };

  if (newStatus === "completed") {
    updateData.paid_at = now;
  }

  const { error: updateError } = await supabase
    .from("vendor_payouts")
    .update(updateData as any)
    .eq("id", payoutId);

  if (updateError) {
    return NextResponse.json(
      { error: "Database error", message: updateError.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    message: `支払いステータスを ${newStatus} に更新しました`,
    data: { payoutId, status: newStatus },
  });
}

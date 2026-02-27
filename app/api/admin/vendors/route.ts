import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/requireAuth";
import { createAdminSupabaseClient } from "@/lib/supabase/server";
import { isSandboxMode, sandboxLog } from "@/lib/sandbox";
import { mockVendors, mockBikes } from "@/lib/mock";

export async function GET(request: NextRequest) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  const searchParams = request.nextUrl.searchParams;
  const isApproved = searchParams.get("is_approved");
  const isActive = searchParams.get("is_active");
  const search = searchParams.get("search");
  const limit = parseInt(searchParams.get("limit") || "50");
  const offset = parseInt(searchParams.get("offset") || "0");

  if (isSandboxMode()) {
    let filtered = [...mockVendors];

    if (isApproved !== null) {
      filtered = filtered.filter((v) => v.is_approved === (isApproved === "true"));
    }
    if (isActive !== null) {
      filtered = filtered.filter((v) => v.is_active === (isActive === "true"));
    }
    if (search) {
      const s = search.toLowerCase();
      filtered = filtered.filter(
        (v) =>
          v.name.toLowerCase().includes(s) ||
          v.slug.toLowerCase().includes(s) ||
          v.contact_email.toLowerCase().includes(s) ||
          v.prefecture.includes(search) ||
          v.city.includes(search)
      );
    }

    const total = filtered.length;
    const paged = filtered.slice(offset, offset + limit);

    const data = paged.map((v) => ({
      ...v,
      bikes_count: mockBikes.filter((b) => b.vendor_id === v.id).length,
    }));

    const summary = {
      total: mockVendors.length,
      approved: mockVendors.filter((v) => v.is_approved).length,
      pending_approval: mockVendors.filter((v) => !v.is_approved).length,
      active: mockVendors.filter((v) => v.is_active).length,
      inactive: mockVendors.filter((v) => !v.is_active).length,
    };

    return NextResponse.json({
      data,
      summary,
      pagination: { total, limit, offset },
      message: "OK",
    });
  }

  // 本番: Supabase
  try {
    const supabase = createAdminSupabaseClient();

    let query = supabase
      .from("vendors")
      .select("*, user:users(id, full_name, email)", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (isApproved !== null) {
      query = query.eq("is_approved", isApproved === "true");
    }
    if (isActive !== null) {
      query = query.eq("is_active", isActive === "true");
    }
    if (search) {
      query = query.or(
        `name.ilike.%${search}%,slug.ilike.%${search}%,contact_email.ilike.%${search}%,prefecture.ilike.%${search}%,city.ilike.%${search}%`
      );
    }

    const vendorsResult = await query;
    const summaryResult = await supabase.from("vendors").select("is_approved, is_active");

    if (vendorsResult.error) {
      return NextResponse.json(
        { error: "Database error", message: vendorsResult.error.message },
        { status: 500 }
      );
    }

    const vendorsData = (vendorsResult.data || []) as unknown as { id: string; [key: string]: unknown }[];

    // バイク数を並列取得
    const vendorIds = vendorsData.map((v) => v.id);
    let bikeCounts: Record<string, number> = {};
    if (vendorIds.length > 0) {
      const { data: bikesData } = await supabase
        .from("bikes")
        .select("vendor_id")
        .in("vendor_id", vendorIds);

      if (bikesData) {
        for (const b of bikesData) {
          bikeCounts[b.vendor_id] = (bikeCounts[b.vendor_id] || 0) + 1;
        }
      }
    }

    const data = vendorsData.map((v) => ({
      ...v,
      bikes_count: bikeCounts[v.id] || 0,
    }));

    const allVendors = summaryResult.data || [];
    const summary = {
      total: allVendors.length,
      approved: allVendors.filter((v) => v.is_approved).length,
      pending_approval: allVendors.filter((v) => !v.is_approved).length,
      active: allVendors.filter((v) => v.is_active).length,
      inactive: allVendors.filter((v) => !v.is_active).length,
    };

    return NextResponse.json({
      data,
      summary,
      pagination: { total: vendorsResult.count || 0, limit, offset },
      message: "OK",
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Server error", message: String(error) },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON", message: "リクエストボディが不正です" },
      { status: 400 }
    );
  }

  const { vendorId, action } = body;

  if (!vendorId || !action) {
    return NextResponse.json(
      { error: "Bad request", message: "vendorId と action は必須です" },
      { status: 400 }
    );
  }

  if (isSandboxMode()) {
    const vendor = mockVendors.find((v) => v.id === vendorId);
    if (!vendor) {
      return NextResponse.json(
        { error: "Not found", message: "ベンダーが見つかりません" },
        { status: 404 }
      );
    }

    if (action === "approve") {
      sandboxLog("vendor_approve", `${vendor.name} (${vendorId}) を承認`);
      return NextResponse.json({
        success: true,
        message: `${vendor.name} を承認しました`,
        data: { vendorId, is_approved: true },
      });
    } else if (action === "ban") {
      sandboxLog("vendor_ban", `${vendor.name} (${vendorId}) をBAN`);
      return NextResponse.json({
        success: true,
        message: `${vendor.name} をBANしました`,
        data: { vendorId, is_active: false },
      });
    } else if (action === "activate") {
      sandboxLog("vendor_activate", `${vendor.name} (${vendorId}) をアクティブ化`);
      return NextResponse.json({
        success: true,
        message: `${vendor.name} をアクティブにしました`,
        data: { vendorId, is_active: true },
      });
    }

    return NextResponse.json(
      { error: "Bad request", message: "不正なアクションです (approve / ban / activate)" },
      { status: 400 }
    );
  }

  // 本番: Supabase
  try {
    const supabase = createAdminSupabaseClient();

    const { data: vendor, error: fetchError } = await supabase
      .from("vendors")
      .select("id, name")
      .eq("id", vendorId)
      .single();

    if (fetchError || !vendor) {
      return NextResponse.json(
        { error: "Not found", message: "ベンダーが見つかりません" },
        { status: 404 }
      );
    }

    if (action === "approve") {
      const { error } = await supabase
        .from("vendors")
        .update({ is_approved: true, approved_at: new Date().toISOString() })
        .eq("id", vendorId);

      if (error) throw error;

      return NextResponse.json({
        success: true,
        message: `${vendor.name} を承認しました`,
        data: { vendorId, is_approved: true },
      });
    } else if (action === "ban") {
      const { error } = await supabase
        .from("vendors")
        .update({ is_active: false })
        .eq("id", vendorId);

      if (error) throw error;

      return NextResponse.json({
        success: true,
        message: `${vendor.name} をBANしました`,
        data: { vendorId, is_active: false },
      });
    } else if (action === "activate") {
      const { error } = await supabase
        .from("vendors")
        .update({ is_active: true })
        .eq("id", vendorId);

      if (error) throw error;

      return NextResponse.json({
        success: true,
        message: `${vendor.name} をアクティブにしました`,
        data: { vendorId, is_active: true },
      });
    }

    return NextResponse.json(
      { error: "Bad request", message: "不正なアクションです (approve / ban / activate)" },
      { status: 400 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Server error", message: String(error) },
      { status: 500 }
    );
  }
}

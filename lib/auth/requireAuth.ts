import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import type { User, Vendor } from "@/types/database";

export interface AuthResult {
  user: User;
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>;
}

export interface VendorAuthResult extends AuthResult {
  vendor: Vendor;
}

export interface AdminAuthResult extends AuthResult {
  user: User & { role: "admin" };
}

export async function requireAuth(
  request: NextRequest
): Promise<AuthResult | NextResponse> {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user: authUser },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !authUser) {
    return NextResponse.json(
      { error: "Unauthorized", message: "ログインが必要です" },
      { status: 401 }
    );
  }

  const { data: userData, error: userError } = await supabase
    .from("users")
    .select("*")
    .eq("id", authUser.id)
    .single();

  if (userError || !userData) {
    return NextResponse.json(
      { error: "Unauthorized", message: "ユーザー情報が見つかりません" },
      { status: 401 }
    );
  }

  const user = userData as User;

  if (user.is_banned) {
    return NextResponse.json(
      { error: "Forbidden", message: "このアカウントは停止されています" },
      { status: 403 }
    );
  }

  return { user, supabase };
}

export async function requireVendor(
  request: NextRequest
): Promise<VendorAuthResult | NextResponse> {
  const authResult = await requireAuth(request);

  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const { user, supabase } = authResult;

  if (user.role !== "vendor" && user.role !== "admin") {
    return NextResponse.json(
      { error: "Forbidden", message: "店舗管理者権限が必要です" },
      { status: 403 }
    );
  }

  const { data: vendorData, error: vendorError } = await supabase
    .from("vendors")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (vendorError || !vendorData) {
    return NextResponse.json(
      { error: "Forbidden", message: "店舗情報が見つかりません" },
      { status: 403 }
    );
  }

  const vendor = vendorData as Vendor;

  if (!vendor.is_active || !vendor.is_approved) {
    return NextResponse.json(
      { error: "Forbidden", message: "店舗がアクティブではありません" },
      { status: 403 }
    );
  }

  return { user, vendor, supabase };
}

export async function requireAdmin(
  request: NextRequest
): Promise<AdminAuthResult | NextResponse> {
  const authResult = await requireAuth(request);

  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const { user, supabase } = authResult;

  if (user.role !== "admin") {
    return NextResponse.json(
      { error: "Forbidden", message: "管理者権限が必要です" },
      { status: 403 }
    );
  }

  return { user: user as User & { role: "admin" }, supabase };
}

export function verifyCronSecret(request: NextRequest): boolean {
  const authHeader = request.headers.get("authorization");
  const expected = "Bearer " + (process.env.CRON_SECRET || "");
  return authHeader === expected;
}

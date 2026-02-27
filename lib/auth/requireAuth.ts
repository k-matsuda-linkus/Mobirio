import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { isSandboxMode, sandboxLog } from "@/lib/sandbox";
import { mockUsers } from "@/lib/mock/users";
import { isAdminAsync } from "@/lib/admin";
import type { User, Vendor, AdminRole } from "@/types/database";

export interface AuthResult {
  user: User;
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>;
}

export interface VendorAuthResult extends AuthResult {
  vendor: Vendor;
}

export interface AdminAuthResult extends AuthResult {
  user: User & { role: "admin" };
  adminRole: AdminRole;
}

export async function requireAuth(
  request: NextRequest
): Promise<AuthResult | NextResponse> {
  // Sandbox モード: Supabase 認証をバイパスしモックユーザーを返す
  if (isSandboxMode()) {
    const sandboxUserId = request.headers.get("x-sandbox-user-id");
    const mockUser = sandboxUserId
      ? mockUsers.find((u) => u.id === sandboxUserId)
      : mockUsers[0];

    if (!mockUser) {
      return NextResponse.json(
        { error: "Unauthorized", message: "指定されたsandboxユーザーが見つかりません" },
        { status: 401 }
      );
    }

    sandboxLog("requireAuth", `user=${mockUser.id} (${mockUser.full_name})`);

    const user: User = {
      id: mockUser.id,
      email: mockUser.email,
      full_name: mockUser.full_name,
      phone: mockUser.phone,
      role: mockUser.role,
      avatar_url: null,
      is_banned: mockUser.is_banned,
      banned_at: null,
      banned_reason: null,
      created_at: mockUser.created_at,
      updated_at: mockUser.updated_at,
    };

    // sandbox では supabase を null として扱う（型互換のためキャスト）
    return { user, supabase: null as unknown as AuthResult["supabase"] };
  }

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

  // Sandbox モード: モックベンダーを返す
  if (isSandboxMode()) {
    const { mockVendors } = await import("@/lib/mock/vendors");
    const mockVendor = mockVendors.find((v) => v.id === "v-001");

    if (!mockVendor) {
      return NextResponse.json(
        { error: "Forbidden", message: "店舗情報が見つかりません" },
        { status: 403 }
      );
    }

    sandboxLog("requireVendor", `vendor=${mockVendor.id} (${mockVendor.name})`);

    const vendor = {
      ...mockVendor,
      user_id: user.id,
    } as unknown as Vendor;

    return { user, vendor, supabase };
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

  // sandbox モードは super_admin 固定
  if (isSandboxMode()) {
    return {
      user: user as User & { role: "admin" },
      supabase,
      adminRole: "super_admin",
    };
  }

  // 本番: 環境変数 + DB 二重チェック
  const { isAdmin, role: adminRole } = await isAdminAsync(user.email);
  if (!isAdmin) {
    return NextResponse.json(
      { error: "Forbidden", message: "管理者権限が必要です" },
      { status: 403 }
    );
  }

  return { user: user as User & { role: "admin" }, supabase, adminRole };
}

export function verifyCronSecret(request: NextRequest): boolean {
  const authHeader = request.headers.get("authorization");
  const expected = "Bearer " + (process.env.CRON_SECRET || "");
  return authHeader === expected;
}

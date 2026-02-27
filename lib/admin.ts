import type { AdminRole } from "@/types/database";
import { createAdminSupabaseClient } from "@/lib/supabase/server";

// ---------------------------------------------------------------------------
// ロール定義
// ---------------------------------------------------------------------------

export const ADMIN_ROLES = {
  super_admin: { level: 3, label: "スーパー管理者" },
  admin: { level: 2, label: "管理者" },
  moderator: { level: 1, label: "モデレーター" },
} as const;

// ---------------------------------------------------------------------------
// 権限マトリクス
// ---------------------------------------------------------------------------

export type Permission =
  | "dashboard:view"
  | "users:view"
  | "users:ban"
  | "vendors:view"
  | "vendors:approve"
  | "vendors:ban"
  | "reviews:view"
  | "reviews:moderate"
  | "inquiries:view"
  | "inquiries:reply"
  | "reports:view"
  | "settings:view"
  | "settings:edit";

const PERMISSION_MATRIX: Record<AdminRole, Permission[]> = {
  super_admin: [
    "dashboard:view",
    "users:view",
    "users:ban",
    "vendors:view",
    "vendors:approve",
    "vendors:ban",
    "reviews:view",
    "reviews:moderate",
    "inquiries:view",
    "inquiries:reply",
    "reports:view",
    "settings:view",
    "settings:edit",
  ],
  admin: [
    "dashboard:view",
    "users:view",
    "users:ban",
    "vendors:view",
    "vendors:approve",
    "vendors:ban",
    "reviews:view",
    "reviews:moderate",
    "inquiries:view",
    "inquiries:reply",
    "reports:view",
    "settings:view",
  ],
  moderator: [
    "dashboard:view",
    "users:view",
    "vendors:view",
    "reviews:view",
    "reviews:moderate",
    "inquiries:view",
    "inquiries:reply",
    "reports:view",
  ],
};

// ---------------------------------------------------------------------------
// 権限チェック
// ---------------------------------------------------------------------------

export function hasPermission(role: AdminRole, permission: Permission): boolean {
  return PERMISSION_MATRIX[role]?.includes(permission) ?? false;
}

export function getPermissions(role: AdminRole): Permission[] {
  return PERMISSION_MATRIX[role] ?? [];
}

// ---------------------------------------------------------------------------
// 管理者判定（環境変数リスト + DB 二重チェック）
// ---------------------------------------------------------------------------

export function isAdminEmail(email: string): boolean {
  const adminEmails = (process.env.ADMIN_EMAILS || process.env.ADMIN_EMAIL || "admin@mobirio.jp")
    .split(",")
    .map((e) => e.trim().toLowerCase());
  return adminEmails.includes(email.toLowerCase());
}

export async function isAdminAsync(
  email: string
): Promise<{ isAdmin: boolean; role: AdminRole }> {
  // 1) 環境変数チェック
  if (!isAdminEmail(email)) {
    return { isAdmin: false, role: "moderator" };
  }

  // 2) DB チェック
  try {
    const supabase = createAdminSupabaseClient();
    const { data } = await supabase
      .from("admins")
      .select("role")
      .eq("email", email.toLowerCase())
      .single();

    if (data) {
      return { isAdmin: true, role: data.role as AdminRole };
    }
  } catch {
    // DB接続失敗時は環境変数のみで判定
  }

  // 環境変数にはあるが DB にない → super_admin 扱い
  return { isAdmin: true, role: "super_admin" };
}

// ---------------------------------------------------------------------------
// BAN判定
// ---------------------------------------------------------------------------

export async function checkBan(userId: string): Promise<boolean> {
  try {
    const supabase = createAdminSupabaseClient();
    const { data } = await supabase
      .from("users")
      .select("is_banned")
      .eq("id", userId)
      .single();

    return data?.is_banned ?? false;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// タイミング攻撃防止
// ---------------------------------------------------------------------------

export async function enforceMinDelay<T>(
  promise: Promise<T>,
  minMs: number = 200
): Promise<T> {
  const start = Date.now();
  const result = await promise;
  const elapsed = Date.now() - start;
  if (elapsed < minMs) {
    await new Promise((resolve) => setTimeout(resolve, minMs - elapsed));
  }
  return result;
}

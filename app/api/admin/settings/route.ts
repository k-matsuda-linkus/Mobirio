import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/requireAuth";
import { createAdminSupabaseClient } from "@/lib/supabase/server";
import { isSandboxMode, sandboxLog } from "@/lib/sandbox";

const mockSettings: Record<string, unknown> = {
  platform_fee_percent: 10,
  max_reservation_days: 30,
  cancellation_policy_hours: 48,
  auto_expire_pending_minutes: 30,
  review_reminder_days: 3,
  maintenance_mode: false,
  support_email: "support@mobirio.jp",
  notification_email_enabled: true,
  notification_sms_enabled: false,
  min_payout_amount: 5000,
  payout_schedule: "monthly",
  cdw_default_rate: 1000,
  noc_default_rate: 500,
};

const ALLOWED_KEYS = Object.keys(mockSettings);

export async function GET(request: NextRequest) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  if (isSandboxMode()) {
    return NextResponse.json({ data: mockSettings, message: "OK" });
  }

  // 本番: system_settings テーブルから key-value → オブジェクト変換
  try {
    const supabase = createAdminSupabaseClient();

    const { data, error } = await supabase.from("system_settings").select("key, value");

    if (error) {
      return NextResponse.json(
        { error: "Database error", message: error.message },
        { status: 500 }
      );
    }

    const settings: Record<string, unknown> = { ...mockSettings };
    for (const row of data || []) {
      try {
        settings[row.key] = JSON.parse(row.value);
      } catch {
        settings[row.key] = row.value;
      }
    }

    return NextResponse.json({ data: settings, message: "OK" });
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

  const { settings } = body;

  if (!settings || typeof settings !== "object") {
    return NextResponse.json(
      { error: "Bad request", message: "settings オブジェクトは必須です" },
      { status: 400 }
    );
  }

  const invalidKeys = Object.keys(settings).filter((k) => !ALLOWED_KEYS.includes(k));
  if (invalidKeys.length > 0) {
    return NextResponse.json(
      { error: "Bad request", message: `不正な設定キー: ${invalidKeys.join(", ")}` },
      { status: 400 }
    );
  }

  if (isSandboxMode()) {
    sandboxLog("settings_update", JSON.stringify(settings));
    const merged = { ...mockSettings, ...settings };
    return NextResponse.json({
      success: true,
      message: "システム設定を更新しました",
      data: merged,
    });
  }

  // 本番: system_settings テーブルに upsert
  try {
    const supabase = createAdminSupabaseClient();

    const upsertRows = Object.entries(settings as Record<string, unknown>).map(([key, value]) => ({
      key,
      value: JSON.stringify(value),
      updated_at: new Date().toISOString(),
    }));

    const { error } = await supabase
      .from("system_settings")
      .upsert(upsertRows, { onConflict: "key" });

    if (error) {
      return NextResponse.json(
        { error: "Database error", message: error.message },
        { status: 500 }
      );
    }

    // 更新後の全設定を返す
    const { data: allSettings } = await supabase.from("system_settings").select("key, value");

    const merged: Record<string, unknown> = { ...mockSettings };
    for (const row of allSettings || []) {
      try {
        merged[row.key] = JSON.parse(row.value);
      } catch {
        merged[row.key] = row.value;
      }
    }

    return NextResponse.json({
      success: true,
      message: "システム設定を更新しました",
      data: merged,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Server error", message: String(error) },
      { status: 500 }
    );
  }
}

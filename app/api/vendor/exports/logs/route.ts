import { NextRequest, NextResponse } from "next/server";
import { requireVendor } from "@/lib/auth/requireAuth";
import { isSandboxMode, sandboxLog } from "@/lib/sandbox";

/**
 * GET /api/vendor/exports/logs
 * Export login logs for a given date range.
 * Query params: from, to
 */
export async function GET(request: NextRequest) {
  const authResult = await requireVendor(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const { vendor, supabase } = authResult;
  const searchParams = request.nextUrl.searchParams;
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  if (!from || !to) {
    return NextResponse.json(
      { error: "Bad request", message: "from と to は必須です" },
      { status: 400 }
    );
  }

  if (isSandboxMode()) {
    sandboxLog("GET /api/vendor/exports/logs", `vendor=${vendor.id}, from=${from}, to=${to}`);

    const mockLogs = [
      {
        id: "log_001",
        vendor_id: vendor.id,
        user_id: "user_vendor_001",
        user_email: "vendor@example.com",
        action: "login",
        ip_address: "203.0.113.1",
        user_agent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        created_at: "2026-02-15T08:30:00Z",
      },
      {
        id: "log_002",
        vendor_id: vendor.id,
        user_id: "user_vendor_001",
        user_email: "vendor@example.com",
        action: "login",
        ip_address: "203.0.113.1",
        user_agent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        created_at: "2026-02-14T09:15:00Z",
      },
      {
        id: "log_003",
        vendor_id: vendor.id,
        user_id: "user_vendor_001",
        user_email: "vendor@example.com",
        action: "login",
        ip_address: "198.51.100.5",
        user_agent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)",
        created_at: "2026-02-13T18:45:00Z",
      },
    ];

    return NextResponse.json({
      data: mockLogs,
      period: { from, to },
      total: mockLogs.length,
      message: "OK",
    });
  }

  // 本番: Supabase — ログテーブルがない場合はauth.audit_log等を参照
  // 現時点ではschemaにlogsテーブルがないため、空配列を返す
  // 将来的にはaudit_logや専用テーブルから取得

  return NextResponse.json({
    data: [],
    period: { from, to },
    total: 0,
    message: "OK",
  });
}

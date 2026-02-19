import { NextRequest, NextResponse } from "next/server";
import { requireVendor } from "@/lib/auth/requireAuth";

/**
 * GET /api/vendor/exports/logs
 * Export login logs for a given date range.
 * Query params: from, to, vendor_id
 */
export async function GET(request: NextRequest) {
  const authResult = await requireVendor(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const { vendor } = authResult;
  const searchParams = request.nextUrl.searchParams;
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  if (!from || !to) {
    return NextResponse.json(
      { error: "Bad request", message: "from と to は必須です" },
      { status: 400 }
    );
  }

  // TODO: Replace with Supabase query once schema is applied
  const mockLogs = [
    {
      id: "log_001",
      vendor_id: vendor.id,
      user_id: "user_vendor_001",
      user_email: "vendor@example.com",
      action: "login",
      ip_address: "203.0.113.1",
      user_agent:
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
      created_at: "2025-01-15T08:30:00Z",
    },
    {
      id: "log_002",
      vendor_id: vendor.id,
      user_id: "user_vendor_001",
      user_email: "vendor@example.com",
      action: "login",
      ip_address: "203.0.113.1",
      user_agent:
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
      created_at: "2025-01-14T09:15:00Z",
    },
    {
      id: "log_003",
      vendor_id: vendor.id,
      user_id: "user_vendor_001",
      user_email: "vendor@example.com",
      action: "login",
      ip_address: "198.51.100.5",
      user_agent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)",
      created_at: "2025-01-13T18:45:00Z",
    },
  ];

  return NextResponse.json({
    data: mockLogs,
    period: { from, to },
    total: mockLogs.length,
    message: "OK",
  });
}

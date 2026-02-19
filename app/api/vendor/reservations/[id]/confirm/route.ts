import { NextRequest, NextResponse } from "next/server";
import { requireVendor } from "@/lib/auth/requireAuth";

/**
 * PUT /api/vendor/reservations/[id]/confirm
 * Confirm a reservation.
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const authResult = await requireVendor(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const { vendor } = authResult;

  let body: { confirmed_by?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON", message: "リクエストボディが不正です" },
      { status: 400 }
    );
  }

  // TODO: Replace with Supabase query + update once schema is applied
  // 1. Fetch reservation and verify vendor ownership
  // 2. Verify status is "pending"
  // 3. Update status to "confirmed" and set confirmed_at

  const now = new Date().toISOString();
  const updated = {
    id,
    vendor_id: vendor.id,
    status: "confirmed",
    confirmed_at: now,
    confirmed_by: body.confirmed_by ?? vendor.id,
    updated_at: now,
  };

  return NextResponse.json({
    data: updated,
    message: "予約を確定しました",
  });
}

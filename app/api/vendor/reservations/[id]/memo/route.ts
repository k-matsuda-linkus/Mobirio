import { NextRequest, NextResponse } from "next/server";
import { requireVendor } from "@/lib/auth/requireAuth";

/**
 * PUT /api/vendor/reservations/[id]/memo
 * Update memo / customer notes for a reservation.
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

  let body: { memo?: string; customer_note?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON", message: "リクエストボディが不正です" },
      { status: 400 }
    );
  }

  if (body.memo === undefined && body.customer_note === undefined) {
    return NextResponse.json(
      {
        error: "Bad request",
        message: "memo または customer_note が必要です",
      },
      { status: 400 }
    );
  }

  // TODO: Replace with Supabase update once schema is applied
  // 1. Fetch reservation and verify vendor ownership
  // 2. Update memo / customer_note fields

  const updated = {
    id,
    vendor_id: vendor.id,
    memo: body.memo ?? null,
    customer_note: body.customer_note ?? null,
    updated_at: new Date().toISOString(),
  };

  return NextResponse.json({
    data: updated,
    message: "メモを更新しました",
  });
}

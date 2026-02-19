import { NextRequest, NextResponse } from "next/server";
import { requireVendor } from "@/lib/auth/requireAuth";

/**
 * PUT /api/vendor/reservations/[id]/mileage
 * Update mileage readings for a reservation.
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

  let body: { departure_mileage?: number; return_mileage?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON", message: "リクエストボディが不正です" },
      { status: 400 }
    );
  }

  if (body.departure_mileage === undefined && body.return_mileage === undefined) {
    return NextResponse.json(
      {
        error: "Bad request",
        message: "departure_mileage または return_mileage が必要です",
      },
      { status: 400 }
    );
  }

  // Validate mileage values are non-negative
  if (
    (body.departure_mileage !== undefined && body.departure_mileage < 0) ||
    (body.return_mileage !== undefined && body.return_mileage < 0)
  ) {
    return NextResponse.json(
      {
        error: "Bad request",
        message: "走行距離は0以上の値を指定してください",
      },
      { status: 400 }
    );
  }

  // Validate return >= departure if both present
  if (
    body.departure_mileage !== undefined &&
    body.return_mileage !== undefined &&
    body.return_mileage < body.departure_mileage
  ) {
    return NextResponse.json(
      {
        error: "Bad request",
        message: "返却時走行距離は出発時走行距離以上の値を指定してください",
      },
      { status: 400 }
    );
  }

  // TODO: Replace with Supabase update once schema is applied
  // 1. Fetch reservation and verify vendor ownership
  // 2. Update mileage fields

  const updated = {
    id,
    vendor_id: vendor.id,
    departure_mileage: body.departure_mileage ?? null,
    return_mileage: body.return_mileage ?? null,
    updated_at: new Date().toISOString(),
  };

  return NextResponse.json({
    data: updated,
    message: "走行距離を更新しました",
  });
}

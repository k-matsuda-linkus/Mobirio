import { NextRequest, NextResponse } from "next/server";
import { requireVendor } from "@/lib/auth/requireAuth";
import { isSandboxMode, sandboxLog } from "@/lib/sandbox";
import { mockReservations } from "@/lib/mock/reservations";
import { mockUsers } from "@/lib/mock/users";
import { mockBikes } from "@/lib/mock/bikes";
import type { Reservation } from "@/types/database";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const authResult = await requireVendor(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const { vendor, supabase } = authResult;

  if (isSandboxMode()) {
    sandboxLog("GET /api/vendor/reservations/[id]", `vendor=${vendor.id}, id=${id}`);
    const mock = mockReservations.find((r) => r.id === id && r.vendor_id === vendor.id);
    if (!mock) {
      return NextResponse.json(
        { error: "Not found", message: "予約が見つかりません" },
        { status: 404 }
      );
    }
    // FEが期待するフラットフィールドを付与
    const user = mockUsers.find((u) => u.id === mock.user_id);
    const bike = mockBikes.find((b) => b.id === mock.bike_id);
    const enriched = {
      ...mock,
      bike_name: mock.bikeName || bike?.name || "",
      user_name: user?.full_name || "",
      store_name: mock.vendorName || "",
      registration_number: bike?.registration_number || "",
      chassis_number: bike?.frame_number || "",
      payments: [],
    };
    return NextResponse.json({ data: enriched, message: "OK" });
  }

  const { data: reservationData, error } = await supabase
    .from("reservations")
    .select(
      `
      *,
      bike:bikes(id, name, model, manufacturer, image_urls),
      user:users(id, full_name, email, phone),
      reservation_options(
        id,
        quantity,
        unit_price,
        subtotal,
        option:options(id, name, description, category)
      ),
      payment:payments(id, amount, status, square_payment_id, created_at)
    `
    )
    .eq("id", id)
    .single();

  if (error || !reservationData) {
    return NextResponse.json(
      { error: "Not found", message: "予約が見つかりません" },
      { status: 404 }
    );
  }

  const raw = reservationData as Record<string, unknown>;

  // Verify vendor owns this reservation
  if (raw.vendor_id !== vendor.id) {
    return NextResponse.json(
      { error: "Forbidden", message: "この予約を閲覧する権限がありません" },
      { status: 403 }
    );
  }

  // JOINネスト結果をフラット化（FEが bike_name, user_name, payments 等を期待）
  const bike = raw.bike as Record<string, unknown> | null;
  const user = raw.user as Record<string, unknown> | null;
  const payment = raw.payment as unknown[];
  const reservationOptions = raw.reservation_options as unknown[];
  const { bike: _b, user: _u, payment: _p, reservation_options: _ro, ...rest } = raw;
  const flatReservation = {
    ...rest,
    bike_name: bike?.name || "",
    user_name: user?.full_name || "",
    store_name: vendor.name || "",
    registration_number: bike?.registration_number || "",
    chassis_number: bike?.frame_number || "",
    payments: Array.isArray(payment) ? payment : payment ? [payment] : [],
    reservation_options: reservationOptions || [],
  };

  return NextResponse.json({ data: flatReservation, message: "OK" });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const authResult = await requireVendor(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const { vendor, supabase } = authResult;

  if (isSandboxMode()) {
    sandboxLog("PATCH /api/vendor/reservations/[id]", `vendor=${vendor.id}, id=${id}`);
    const mock = mockReservations.find((r) => r.id === id && r.vendor_id === vendor.id);
    if (!mock) {
      return NextResponse.json(
        { error: "Not found", message: "予約が見つかりません" },
        { status: 404 }
      );
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON", message: "リクエストボディが不正です" },
        { status: 400 }
      );
    }

    if (body.notes === undefined) {
      return NextResponse.json(
        { error: "Bad request", message: "更新するフィールドがありません" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "予約を更新しました",
      data: { ...mock, notes: body.notes ?? (mock as any).notes, updated_at: new Date().toISOString() },
    });
  }

  // Get existing reservation
  const { data: existingData, error: fetchError } = await supabase
    .from("reservations")
    .select("*")
    .eq("id", id)
    .single();

  if (fetchError || !existingData) {
    return NextResponse.json(
      { error: "Not found", message: "予約が見つかりません" },
      { status: 404 }
    );
  }

  const existingReservation = existingData as Reservation;

  // Verify vendor owns this reservation
  if (existingReservation.vendor_id !== vendor.id) {
    return NextResponse.json(
      { error: "Forbidden", message: "この予約を更新する権限がありません" },
      { status: 403 }
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON", message: "リクエストボディが不正です" },
      { status: 400 }
    );
  }

  // Vendors can only update notes
  const allowedFields = ["notes"];
  const updatePayload: { notes?: string; updated_at: string } = {
    updated_at: new Date().toISOString(),
  };

  for (const field of allowedFields) {
    if (body[field] !== undefined && field === "notes") {
      updatePayload.notes = body[field] as string;
    }
  }

  if (!updatePayload.notes) {
    return NextResponse.json(
      { error: "Bad request", message: "更新するフィールドがありません" },
      { status: 400 }
    );
  }

  const { data: updated, error: updateError } = await supabase
    .from("reservations")
    .update(updatePayload as any)
    .eq("id", id)
    .select()
    .single();

  if (updateError) {
    return NextResponse.json(
      { error: "Database error", message: updateError.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    message: "予約を更新しました",
    data: updated,
  });
}

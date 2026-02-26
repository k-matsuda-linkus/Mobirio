import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/requireAuth";
import { isSandboxMode, sandboxLog } from "@/lib/sandbox";
import { mockReservations } from "@/lib/mock/reservations";
import type { Reservation } from "@/types/database";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const { user, supabase } = authResult;

  // Sandbox モード
  if (isSandboxMode()) {
    sandboxLog("GET /api/reservations/[id]", `id=${id}, user=${user.id}`);

    const reservation = mockReservations.find((r) => r.id === id);
    if (!reservation) {
      return NextResponse.json(
        { error: "Not found", message: "予約が見つかりません" },
        { status: 404 }
      );
    }

    if (reservation.user_id !== user.id && user.role === "customer") {
      return NextResponse.json(
        { error: "Forbidden", message: "この予約を閲覧する権限がありません" },
        { status: 403 }
      );
    }

    return NextResponse.json({ data: reservation, message: "OK" });
  }

  const { data, error } = await supabase
    .from("reservations")
    .select(
      `
      *,
      bike:bikes(id, name, model, manufacturer, image_urls, vendor_id),
      vendor:vendors(id, name, slug, address, contact_phone, contact_email),
      reservation_options(
        id,
        quantity,
        unit_price,
        subtotal,
        option:options(id, name, description, category)
      )
    `
    )
    .eq("id", id)
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: "Not found", message: "予約が見つかりません" },
      { status: 404 }
    );
  }

  const reservation = data as unknown as Reservation & { bike: unknown; vendor: unknown };

  // Check authorization: user can only see their own reservations unless admin/vendor
  if (reservation.user_id !== user.id && user.role === "customer") {
    return NextResponse.json(
      { error: "Forbidden", message: "この予約を閲覧する権限がありません" },
      { status: 403 }
    );
  }

  return NextResponse.json({ data, message: "OK" });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const { user, supabase } = authResult;

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON", message: "リクエストボディが不正です" },
      { status: 400 }
    );
  }

  // Sandbox モード
  if (isSandboxMode()) {
    sandboxLog("PATCH /api/reservations/[id]", `id=${id}, user=${user.id}`);

    const reservation = mockReservations.find((r) => r.id === id);
    if (!reservation) {
      return NextResponse.json(
        { error: "Not found", message: "予約が見つかりません" },
        { status: 404 }
      );
    }

    if (reservation.user_id !== user.id && user.role !== "admin") {
      return NextResponse.json(
        { error: "Forbidden", message: "この予約を更新する権限がありません" },
        { status: 403 }
      );
    }

    if (reservation.status !== "pending") {
      return NextResponse.json(
        { error: "Conflict", message: "確定済みの予約は変更できません" },
        { status: 409 }
      );
    }

    const allowedSandboxFields = ["notes"];
    const sandboxUpdate: Record<string, unknown> = {};
    for (const field of allowedSandboxFields) {
      if (body[field] !== undefined) {
        sandboxUpdate[field] = body[field];
      }
    }

    if (Object.keys(sandboxUpdate).length === 0) {
      return NextResponse.json(
        { error: "Bad request", message: "更新するフィールドがありません" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "予約を更新しました",
      data: { ...reservation, ...sandboxUpdate },
    });
  }

  // Get existing reservation
  const { data, error: fetchError } = await supabase
    .from("reservations")
    .select("*")
    .eq("id", id)
    .single();

  if (fetchError || !data) {
    return NextResponse.json(
      { error: "Not found", message: "予約が見つかりません" },
      { status: 404 }
    );
  }

  const reservation = data as Reservation;

  // Only owner or admin can update
  if (reservation.user_id !== user.id && user.role !== "admin") {
    return NextResponse.json(
      { error: "Forbidden", message: "この予約を更新する権限がありません" },
      { status: 403 }
    );
  }

  // Only pending reservations can be updated
  if (reservation.status !== "pending") {
    return NextResponse.json(
      { error: "Conflict", message: "確定済みの予約は変更できません" },
      { status: 409 }
    );
  }

  const allowedFields = ["notes"];
  const updateData: Record<string, unknown> = {};

  for (const field of allowedFields) {
    if (body[field] !== undefined) {
      updateData[field] = body[field];
    }
  }

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json(
      { error: "Bad request", message: "更新するフィールドがありません" },
      { status: 400 }
    );
  }

  updateData.updated_at = new Date().toISOString();

  const updatePayload: { notes?: string; updated_at: string } = {
    updated_at: updateData.updated_at as string,
  };
  if (updateData.notes !== undefined) {
    updatePayload.notes = updateData.notes as string;
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

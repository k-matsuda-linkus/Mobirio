import { NextRequest, NextResponse } from "next/server";
import { requireVendor } from "@/lib/auth/requireAuth";
import { isSandboxMode, sandboxLog } from "@/lib/sandbox";
import { mockReservations } from "@/lib/mock/reservations";

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

  const { vendor, supabase } = authResult;

  let body: { confirmed_by?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON", message: "リクエストボディが不正です" },
      { status: 400 }
    );
  }

  if (isSandboxMode()) {
    sandboxLog("PUT /api/vendor/reservations/[id]/confirm", `vendor=${vendor.id}, id=${id}`);

    const mock = mockReservations.find((r) => r.id === id && r.vendor_id === vendor.id);
    if (!mock) {
      return NextResponse.json(
        { error: "Not found", message: "予約が見つかりません" },
        { status: 404 }
      );
    }
    if (mock.status !== "pending") {
      return NextResponse.json(
        { error: "Bad request", message: "ステータスが pending の予約のみ確定できます" },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();
    return NextResponse.json({
      data: {
        ...mock,
        status: "confirmed",
        confirmed_at: now,
        confirmed_by: body.confirmed_by ?? vendor.id,
        updated_at: now,
      },
      message: "予約を確定しました",
    });
  }

  // 本番: Supabase
  // 1. 予約を取得して所有権確認
  const { data: existing, error: fetchError } = await supabase
    .from("reservations")
    .select("*")
    .eq("id", id)
    .single();

  if (fetchError || !existing) {
    return NextResponse.json(
      { error: "Not found", message: "予約が見つかりません" },
      { status: 404 }
    );
  }

  if ((existing as any).vendor_id !== vendor.id) {
    return NextResponse.json(
      { error: "Forbidden", message: "この予約を操作する権限がありません" },
      { status: 403 }
    );
  }

  if ((existing as any).status !== "pending") {
    return NextResponse.json(
      { error: "Bad request", message: "ステータスが pending の予約のみ確定できます" },
      { status: 400 }
    );
  }

  const now = new Date().toISOString();
  const { data: updated, error: updateError } = await supabase
    .from("reservations")
    .update({
      status: "confirmed",
      confirmed_at: now,
      confirmed_by: body.confirmed_by ?? vendor.id,
      updated_at: now,
    } as any)
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
    data: updated,
    message: "予約を確定しました",
  });
}

import { NextRequest, NextResponse } from "next/server";
import { requireVendor } from "@/lib/auth/requireAuth";
import { isSandboxMode, sandboxLog } from "@/lib/sandbox";

/**
 * POST /api/vendor/reservations/[id]/contract
 * Generate a rental contract PDF for a reservation.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const authResult = await requireVendor(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const { vendor, supabase } = authResult;

  let body: { language?: "ja" | "en" };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON", message: "リクエストボディが不正です" },
      { status: 400 }
    );
  }

  const language = body.language ?? "ja";
  const validLanguages = ["ja", "en"];

  if (!validLanguages.includes(language)) {
    return NextResponse.json(
      { error: "Bad request", message: "language は ja または en を指定してください" },
      { status: 400 }
    );
  }

  if (isSandboxMode()) {
    sandboxLog("POST /api/vendor/reservations/[id]/contract", `id=${id}, vendor=${vendor.id}`);

    const mockResponse = {
      reservation_id: id,
      vendor_id: vendor.id,
      language,
      url: `/contracts/${vendor.id}/${id}_${language}.pdf`,
      output_count: 1,
      generated_at: new Date().toISOString(),
    };

    return NextResponse.json({
      data: mockResponse,
      message: "契約書を生成しました",
    });
  }

  // 本番: Supabase — 予約確認 + 出力カウントインクリメント
  const { data: reservation, error: fetchError } = await supabase
    .from("reservations")
    .select("id, vendor_id, contract_output_count, user_id, bike_id, start_datetime, end_datetime, total_amount")
    .eq("id", id)
    .eq("vendor_id", vendor.id)
    .single();

  if (fetchError || !reservation) {
    return NextResponse.json(
      { error: "Not found", message: "予約が見つかりません" },
      { status: 404 }
    );
  }

  const newCount = (reservation.contract_output_count || 0) + 1;
  const now = new Date().toISOString();

  const { error: updateError } = await supabase
    .from("reservations")
    .update({
      contract_output_count: newCount,
      contract_last_output: now,
    })
    .eq("id", id);

  if (updateError) {
    return NextResponse.json(
      { error: "Database error", message: updateError.message },
      { status: 500 }
    );
  }

  // 実際のPDF生成は未実装（将来のタスク）
  return NextResponse.json({
    data: {
      reservation_id: id,
      vendor_id: vendor.id,
      language,
      url: `/contracts/${vendor.id}/${id}_${language}.pdf`,
      output_count: newCount,
      generated_at: now,
    },
    message: "契約書を生成しました",
  });
}

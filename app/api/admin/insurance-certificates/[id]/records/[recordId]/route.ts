import { NextRequest, NextResponse } from "next/server";
import { mockInsuranceCertificates } from "@/lib/mock/insuranceCertificates";
import { mockBikes } from "@/lib/mock/bikes";
import { mockArchivedBikes } from "@/lib/mock/insuranceCertificates";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; recordId: string }> }
) {
  // TODO: 本番では requireAdmin を使用
  const { id, recordId } = await params;

  try {
    const body = await request.json();
    const { bikeId } = body;

    if (!bikeId) {
      return NextResponse.json({ error: "bikeId が必要です" }, { status: 400 });
    }

    // 証明書を検索
    const cert = mockInsuranceCertificates.find((c) => c.id === id);
    if (!cert) {
      return NextResponse.json({ error: "証明書が見つかりません" }, { status: 404 });
    }

    // レコードを検索
    const record = cert.records.find((r) => r.id === recordId);
    if (!record) {
      return NextResponse.json({ error: "レコードが見つかりません" }, { status: 404 });
    }

    // バイクを検索（アクティブ + アーカイブ）
    const allBikes = [...mockBikes, ...mockArchivedBikes];
    const bike = allBikes.find((b) => b.id === bikeId);
    if (!bike) {
      return NextResponse.json({ error: "バイクが見つかりません" }, { status: 404 });
    }

    // 紐付け更新
    record.bikeId = bike.id;
    record.bikeName = bike.name;
    record.matchStatus = 'manual_matched';
    record.isArchived = mockArchivedBikes.some((b) => b.id === bike.id);

    // カウント再計算
    cert.matchedCount = cert.records.filter((r) => r.matchStatus !== 'unmatched').length;
    cert.unmatchedCount = cert.records.filter((r) => r.matchStatus === 'unmatched').length;

    return NextResponse.json({
      record,
      message: "紐付けを更新しました",
    });
  } catch {
    return NextResponse.json({ error: "リクエストの処理に失敗しました" }, { status: 400 });
  }
}

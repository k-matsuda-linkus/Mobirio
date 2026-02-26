import { NextRequest, NextResponse } from "next/server";
import { parseInsuranceCertificate } from "@/lib/pdf/parseInsuranceCertificate";
import { matchVehicles } from "@/lib/pdf/matchVehicles";
import { mockBikes } from "@/lib/mock/bikes";
import { mockArchivedBikes, mockInsuranceCertificates } from "@/lib/mock/insuranceCertificates";
import type { InsuranceCertificate } from "@/types/insurance";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(request: NextRequest) {
  // TODO: 本番では requireAdmin を使用
  // const authResult = await requireAdmin(request);
  // if (authResult instanceof NextResponse) return authResult;

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const password = formData.get("password") as string | null;
    const targetYear = Number(formData.get("target_year"));
    const targetMonth = Number(formData.get("target_month"));

    // バリデーション
    if (!file) {
      return NextResponse.json({ error: "PDFファイルが必要です" }, { status: 400 });
    }
    if (!password) {
      return NextResponse.json({ error: "パスワードが必要です" }, { status: 400 });
    }
    if (!targetYear || !targetMonth || targetMonth < 1 || targetMonth > 12) {
      return NextResponse.json({ error: "対象年月が不正です" }, { status: 400 });
    }
    if (file.type !== "application/pdf") {
      return NextResponse.json({ error: "PDFファイルのみアップロード可能です" }, { status: 400 });
    }
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "ファイルサイズが10MBを超えています" }, { status: 400 });
    }

    // PDF解析
    const arrayBuffer = await file.arrayBuffer();
    const { records: parsedRecords, warnings } = await parseInsuranceCertificate(arrayBuffer, password);

    if (parsedRecords.length === 0) {
      return NextResponse.json(
        { error: "PDFから車両データを抽出できませんでした", warnings },
        { status: 422 }
      );
    }

    // 車両マッチング
    const { records, matchedCount, unmatchedCount } = matchVehicles(
      parsedRecords,
      mockBikes,
      mockArchivedBikes
    );

    // 証明書データ作成
    const certificate: InsuranceCertificate = {
      id: `cert-${targetYear}${String(targetMonth).padStart(2, '0')}`,
      targetYear,
      targetMonth,
      fileName: file.name,
      totalVehicles: records.length,
      matchedCount,
      unmatchedCount,
      documentDate: records[0]?.documentDate || '',
      uploadedAt: new Date().toISOString(),
      records,
    };

    // 同月データの上書き（モックストアに追加）
    const existingIndex = mockInsuranceCertificates.findIndex(
      (c) => c.targetYear === targetYear && c.targetMonth === targetMonth
    );
    if (existingIndex >= 0) {
      mockInsuranceCertificates[existingIndex] = certificate;
    } else {
      mockInsuranceCertificates.unshift(certificate);
    }

    return NextResponse.json({
      certificate,
      matchedCount,
      unmatchedCount,
      warnings,
      message: `${records.length}台の車両データを読み込みました`,
    });
  } catch (err: unknown) {
    const error = err as Error;
    return NextResponse.json(
      { error: error.message || "PDF処理中にエラーが発生しました" },
      { status: 500 }
    );
  }
}

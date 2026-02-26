import { NextResponse } from "next/server";
import { mockInsuranceCertificates } from "@/lib/mock/insuranceCertificates";

export async function GET() {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const currentDay = now.getDate();

  // 25日以降 かつ 当月の証明書が未アップロード → アラート
  const shouldAlert = currentDay >= 25 && !mockInsuranceCertificates.some(
    (c) => c.targetYear === currentYear && c.targetMonth === currentMonth
  );

  return NextResponse.json({
    shouldAlert,
    currentYear,
    currentMonth,
  });
}

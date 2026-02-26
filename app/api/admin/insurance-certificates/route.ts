import { NextRequest, NextResponse } from "next/server";
import { mockInsuranceCertificates } from "@/lib/mock/insuranceCertificates";

export async function GET(request: NextRequest) {
  // TODO: 本番では requireAdmin を使用
  const { searchParams } = new URL(request.url);
  const year = searchParams.get("year") ? Number(searchParams.get("year")) : null;
  const month = searchParams.get("month") ? Number(searchParams.get("month")) : null;

  let data = mockInsuranceCertificates;

  if (year && month) {
    data = data.filter((c) => c.targetYear === year && c.targetMonth === month);
  } else if (year) {
    data = data.filter((c) => c.targetYear === year);
  }

  return NextResponse.json({
    data,
    total: data.length,
    message: "OK",
  });
}

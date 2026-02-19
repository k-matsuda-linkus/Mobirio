import { NextRequest, NextResponse } from "next/server";
import type { VehicleClass } from "@/types/database";
import type { ClassPricing } from "@/lib/booking/pricing";
import { getPricing, updatePricing } from "@/lib/booking/pricing";

const VEHICLE_CLASSES: VehicleClass[] = [
  "ev", "50", "125", "250", "400", "950", "1100", "1500",
];

const PRICING_KEYS: (keyof ClassPricing)[] = [
  "rate_2h", "rate_4h", "rate_1day", "rate_24h", "rate_32h",
  "overtime_per_hour", "additional_24h", "cdw_per_day",
];

/** 現在の料金テーブルを返す */
export async function GET() {
  return NextResponse.json({ data: getPricing() });
}

/** 料金テーブルを更新 */
export async function PUT(request: NextRequest) {
  let body: Record<string, Record<string, number | null>>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "リクエストボディが不正です" },
      { status: 400 },
    );
  }

  // バリデーション
  for (const vc of VEHICLE_CLASSES) {
    if (!body[vc]) {
      return NextResponse.json(
        { error: `車両クラス "${vc}" のデータがありません` },
        { status: 400 },
      );
    }
    for (const key of PRICING_KEYS) {
      const val = body[vc][key];
      if (key === "rate_2h") {
        // 126cc以上は null 許容
        if (val !== null && (typeof val !== "number" || val < 0)) {
          return NextResponse.json(
            { error: `${vc}.${key} は0以上の数値またはnullを指定してください` },
            { status: 400 },
          );
        }
        continue;
      }
      if (typeof val !== "number" || val < 0) {
        return NextResponse.json(
          { error: `${vc}.${key} は0以上の数値を指定してください` },
          { status: 400 },
        );
      }
    }
  }

  updatePricing(body as unknown as Record<VehicleClass, ClassPricing>);

  return NextResponse.json({
    success: true,
    message: "料金テーブルを更新しました",
  });
}

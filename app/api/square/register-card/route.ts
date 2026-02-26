import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/requireAuth";
import { isSandboxMode, sandboxLog } from "@/lib/sandbox";
import { saveCard } from "@/lib/square/client";

export async function POST(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const { user } = authResult;

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON", message: "リクエストボディが不正です" },
      { status: 400 }
    );
  }

  const { sourceId, cardholderName } = body;

  if (!sourceId) {
    return NextResponse.json(
      { error: "Bad request", message: "sourceId は必須です" },
      { status: 400 }
    );
  }

  // Sandbox モード
  if (isSandboxMode()) {
    sandboxLog("POST /api/square/register-card", `user=${user.id}`);

    return NextResponse.json({
      success: true,
      cardId: `card-sandbox-${Date.now()}`,
      message: "カードが登録されました",
    });
  }

  // Supabase モード: Square API でカード保存
  const result = await saveCard({
    sourceId,
    customerId: user.id,
    cardholderName: cardholderName || user.full_name || undefined,
  });

  if (!result.success) {
    return NextResponse.json(
      {
        error: "Card registration failed",
        message: result.error || "カード登録に失敗しました",
      },
      { status: 400 }
    );
  }

  return NextResponse.json({
    success: true,
    cardId: result.cardId,
    message: "カードが登録されました",
  });
}

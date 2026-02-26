import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/requireAuth";
import { isSandboxMode, sandboxLog } from "@/lib/sandbox";

export async function PATCH(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

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

  const { password } = body;

  if (!password || typeof password !== "string" || password.length < 8) {
    return NextResponse.json(
      { error: "Validation error", message: "パスワードは8文字以上で入力してください" },
      { status: 400 }
    );
  }

  // Sandbox モード
  if (isSandboxMode()) {
    sandboxLog("PATCH /api/user/password", `user=${user.id}`);
    return NextResponse.json({
      success: true,
      message: "パスワードを変更しました",
    });
  }

  // 本番モード: Supabase Auth
  const { createServerSupabaseClient } = await import("@/lib/supabase/server");
  const supabase = await createServerSupabaseClient();

  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    return NextResponse.json(
      { error: "Auth error", message: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    message: "パスワードを変更しました",
  });
}

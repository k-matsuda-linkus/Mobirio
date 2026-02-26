import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/requireAuth";
import { isSandboxMode, sandboxLog } from "@/lib/sandbox";

export async function DELETE(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  const { user, supabase } = authResult;

  // Sandbox モード
  if (isSandboxMode()) {
    sandboxLog("DELETE /api/user/account", `user=${user.id}`);
    return NextResponse.json({
      success: true,
      message: "アカウントを退会しました",
    });
  }

  // ソフトデリート: is_banned + banned_reason
  const { error } = await supabase
    .from("users")
    .update({
      is_banned: true,
      banned_reason: "ユーザー退会",
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) {
    return NextResponse.json(
      { error: "Database error", message: error.message },
      { status: 500 }
    );
  }

  // セッション無効化
  await supabase.auth.signOut().catch(() => {});

  return NextResponse.json({
    success: true,
    message: "アカウントを退会しました",
  });
}

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/requireAuth";
import { isSandboxMode, sandboxLog } from "@/lib/sandbox";
import { mockNotifications } from "@/lib/mock/notifications";

export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  const { user, supabase } = authResult;

  // Sandbox モード
  if (isSandboxMode()) {
    sandboxLog("GET /api/notifications", `user=${user.id}`);
    const unreadCount = mockNotifications.filter((n) => !n.is_read).length;
    return NextResponse.json({
      data: mockNotifications,
      unreadCount,
    });
  }

  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    return NextResponse.json(
      { error: "Failed to fetch notifications" },
      { status: 500 }
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const unreadCount = data?.filter((n: any) => !n.is_read).length ?? 0;

  return NextResponse.json({ data, unreadCount });
}

export async function PUT(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  const { user, supabase } = authResult;

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON", message: "リクエストボディが不正です" },
      { status: 400 }
    );
  }

  // Sandbox モード
  if (isSandboxMode()) {
    sandboxLog("PUT /api/notifications", `user=${user.id}, body=${JSON.stringify(body)}`);
    return NextResponse.json({ success: true });
  }

  // 単一IDまたは一括既読
  if (body.id) {
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", body.id)
      .eq("user_id", user.id);

    if (error) {
      return NextResponse.json({ error: "Failed to update" }, { status: 500 });
    }
  } else if (body.markAllRead) {
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", user.id)
      .eq("is_read", false);

    if (error) {
      return NextResponse.json({ error: "Failed to update" }, { status: 500 });
    }
  }

  return NextResponse.json({ success: true });
}

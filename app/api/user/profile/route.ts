import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/requireAuth";
import { isSandboxMode, sandboxLog } from "@/lib/sandbox";
import { mockUsers } from "@/lib/mock/users";

export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  const { user, supabase } = authResult;

  // Sandbox モード
  if (isSandboxMode()) {
    sandboxLog("GET /api/user/profile", `user=${user.id}`);
    const mockUser = mockUsers.find((u) => u.id === user.id) || mockUsers[0];
    return NextResponse.json({
      data: {
        id: mockUser.id,
        email: mockUser.email,
        full_name: mockUser.full_name,
        phone: mockUser.phone,
        role: mockUser.role,
        avatar_url: null,
        created_at: mockUser.created_at,
      },
    });
  }

  const { data, error } = await supabase
    .from("users")
    .select("id, email, full_name, phone, role, avatar_url, created_at")
    .eq("id", user.id)
    .single();

  if (error) {
    return NextResponse.json(
      { error: "Database error", message: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ data });
}

export async function PATCH(request: NextRequest) {
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

  const allowedFields = ["full_name", "phone", "avatar_url"];
  const updateData: Record<string, unknown> = {};

  for (const field of allowedFields) {
    if (body[field] !== undefined) {
      updateData[field] = body[field];
    }
  }

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json(
      { error: "Bad request", message: "更新するフィールドがありません" },
      { status: 400 }
    );
  }

  // Sandbox モード
  if (isSandboxMode()) {
    sandboxLog("PATCH /api/user/profile", `user=${user.id}, fields=${Object.keys(updateData).join(",")}`);
    return NextResponse.json({
      success: true,
      message: "プロフィールを更新しました",
      data: { ...user, ...updateData },
    });
  }

  updateData.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from("users")
    .update(updateData)
    .eq("id", user.id)
    .select("id, email, full_name, phone, role, avatar_url, created_at")
    .single();

  if (error) {
    return NextResponse.json(
      { error: "Database error", message: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    message: "プロフィールを更新しました",
    data,
  });
}

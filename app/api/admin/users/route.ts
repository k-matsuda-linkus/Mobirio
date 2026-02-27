import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/requireAuth";
import { createAdminSupabaseClient } from "@/lib/supabase/server";
import { isSandboxMode, sandboxLog } from "@/lib/sandbox";
import { mockUsers } from "@/lib/mock";

export async function GET(request: NextRequest) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  const searchParams = request.nextUrl.searchParams;
  const role = searchParams.get("role");
  const isBanned = searchParams.get("is_banned");
  const search = searchParams.get("search");
  const limit = parseInt(searchParams.get("limit") || "50");
  const offset = parseInt(searchParams.get("offset") || "0");

  if (isSandboxMode()) {
    let filtered = [...mockUsers];

    if (role) {
      filtered = filtered.filter((u) => u.role === role);
    }
    if (isBanned !== null) {
      filtered = filtered.filter((u) => u.is_banned === (isBanned === "true"));
    }
    if (search) {
      const s = search.toLowerCase();
      filtered = filtered.filter(
        (u) =>
          u.email.toLowerCase().includes(s) ||
          (u.full_name && u.full_name.toLowerCase().includes(s)) ||
          (u.phone && u.phone.includes(search))
      );
    }

    const total = filtered.length;
    const paged = filtered.slice(offset, offset + limit);

    const summary = {
      total: mockUsers.length,
      customers: mockUsers.filter((u) => u.role === "customer").length,
      vendors: mockUsers.filter((u) => u.role === "vendor").length,
      admins: mockUsers.filter((u) => u.role === "admin").length,
      banned: mockUsers.filter((u) => u.is_banned).length,
    };

    return NextResponse.json({
      data: paged,
      summary,
      pagination: { total, limit, offset },
      message: "OK",
    });
  }

  // 本番: Supabase
  try {
    const supabase = createAdminSupabaseClient();

    let query = supabase
      .from("users")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (role) {
      query = query.eq("role", role as "customer" | "vendor" | "admin");
    }
    if (isBanned !== null) {
      query = query.eq("is_banned", isBanned === "true");
    }
    if (search) {
      query = query.or(
        `email.ilike.%${search}%,full_name.ilike.%${search}%,phone.ilike.%${search}%`
      );
    }

    const [usersResult, summaryResult] = await Promise.all([
      query,
      supabase.from("users").select("role, is_banned"),
    ]);

    if (usersResult.error) {
      return NextResponse.json(
        { error: "Database error", message: usersResult.error.message },
        { status: 500 }
      );
    }

    const allUsers = summaryResult.data || [];
    const summary = {
      total: allUsers.length,
      customers: allUsers.filter((u) => u.role === "customer").length,
      vendors: allUsers.filter((u) => u.role === "vendor").length,
      admins: allUsers.filter((u) => u.role === "admin").length,
      banned: allUsers.filter((u) => u.is_banned).length,
    };

    return NextResponse.json({
      data: usersResult.data || [],
      summary,
      pagination: { total: usersResult.count || 0, limit, offset },
      message: "OK",
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Server error", message: String(error) },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON", message: "リクエストボディが不正です" },
      { status: 400 }
    );
  }

  const { userId, action, reason } = body;

  if (!userId || !action) {
    return NextResponse.json(
      { error: "Bad request", message: "userId と action は必須です" },
      { status: 400 }
    );
  }

  if (isSandboxMode()) {
    const user = mockUsers.find((u) => u.id === userId);
    if (!user) {
      return NextResponse.json(
        { error: "Not found", message: "ユーザーが見つかりません" },
        { status: 404 }
      );
    }

    if (action === "ban") {
      sandboxLog("user_ban", `${user.full_name || user.email} (${userId}) をBAN`);
      return NextResponse.json({
        success: true,
        message: `${user.full_name || user.email} をBANしました`,
        data: { userId, is_banned: true },
      });
    } else if (action === "unban") {
      sandboxLog("user_unban", `${user.full_name || user.email} (${userId}) のBANを解除`);
      return NextResponse.json({
        success: true,
        message: `${user.full_name || user.email} のBANを解除しました`,
        data: { userId, is_banned: false },
      });
    }

    return NextResponse.json(
      { error: "Bad request", message: "不正なアクションです (ban / unban)" },
      { status: 400 }
    );
  }

  // 本番: Supabase
  try {
    const supabase = createAdminSupabaseClient();

    const { data: user, error: fetchError } = await supabase
      .from("users")
      .select("id, full_name, email")
      .eq("id", userId)
      .single();

    if (fetchError || !user) {
      return NextResponse.json(
        { error: "Not found", message: "ユーザーが見つかりません" },
        { status: 404 }
      );
    }

    if (action === "ban") {
      const { error } = await supabase
        .from("users")
        .update({
          is_banned: true,
          banned_at: new Date().toISOString(),
          banned_reason: reason || null,
        })
        .eq("id", userId);

      if (error) throw error;

      return NextResponse.json({
        success: true,
        message: `${user.full_name || user.email} をBANしました`,
        data: { userId, is_banned: true },
      });
    } else if (action === "unban") {
      const { error } = await supabase
        .from("users")
        .update({
          is_banned: false,
          banned_at: null,
          banned_reason: null,
        })
        .eq("id", userId);

      if (error) throw error;

      return NextResponse.json({
        success: true,
        message: `${user.full_name || user.email} のBANを解除しました`,
        data: { userId, is_banned: false },
      });
    }

    return NextResponse.json(
      { error: "Bad request", message: "不正なアクションです (ban / unban)" },
      { status: 400 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Server error", message: String(error) },
      { status: 500 }
    );
  }
}

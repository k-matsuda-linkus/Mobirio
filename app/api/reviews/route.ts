import { NextRequest, NextResponse } from "next/server";
import { isSandboxMode, sandboxLog } from "@/lib/sandbox";
import { mockReviews } from "@/lib/mock/reviews";
import { requireAuth } from "@/lib/auth/requireAuth";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const bikeId = searchParams.get("bike_id");
  const vendorId = searchParams.get("vendor_id");
  const userId = searchParams.get("user_id");
  const page = Math.max(1, Number(searchParams.get("page") || "1"));
  const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit") || "20")));

  // Sandbox モード
  if (isSandboxMode()) {
    sandboxLog("GET /api/reviews", `bike_id=${bikeId}, vendor_id=${vendorId}`);

    let filtered = [...mockReviews];

    if (bikeId) {
      filtered = filtered.filter((r) => r.bike_id === bikeId);
    }
    if (vendorId) {
      filtered = filtered.filter((r) => r.vendor_id === vendorId);
    }
    if (userId) {
      filtered = filtered.filter((r) => r.user_id === userId);
    }

    const total = filtered.length;
    const start = (page - 1) * limit;
    const paged = filtered.slice(start, start + limit);

    return NextResponse.json({
      data: paged,
      total,
      page,
      limit,
    });
  }

  // 本番モード: Supabase
  const { createServerSupabaseClient } = await import("@/lib/supabase/server");
  const supabase = await createServerSupabaseClient();

  let query = supabase
    .from("reviews")
    .select(
      `
      *,
      user:users(id, full_name, avatar_url),
      bike:bikes(id, name, model),
      vendor:vendors(id, name)
    `,
      { count: "exact" }
    )
    .order("created_at", { ascending: false });

  if (bikeId) {
    query = query.eq("bike_id", bikeId);
  }
  if (vendorId) {
    query = query.eq("vendor_id", vendorId);
  }
  if (userId) {
    query = query.eq("user_id", userId);
  }

  const start = (page - 1) * limit;
  query = query.range(start, start + limit - 1);

  const { data, count, error } = await query;

  if (error) {
    return NextResponse.json(
      { data: [], total: 0, page, limit, error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    data: data || [],
    total: count || 0,
    page,
    limit,
  });
}

export async function POST(request: NextRequest) {
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

  const { bike_id, vendor_id, reservation_id, rating, comment } = body;

  // バリデーション
  if (!bike_id || !vendor_id || rating === undefined || rating === null || !comment) {
    return NextResponse.json(
      { error: "Validation error", message: "bike_id, vendor_id, rating, comment は必須です" },
      { status: 400 }
    );
  }

  if (typeof rating !== "number" || !Number.isInteger(rating) || rating < 1 || rating > 5) {
    return NextResponse.json(
      { error: "Validation error", message: "rating は 1〜5 の整数で指定してください" },
      { status: 400 }
    );
  }

  if (typeof comment !== "string" || comment.trim().length === 0) {
    return NextResponse.json(
      { error: "Validation error", message: "comment は空にできません" },
      { status: 400 }
    );
  }

  // Sandbox モード
  if (isSandboxMode()) {
    sandboxLog("POST /api/reviews", `user=${user.id}, bike=${bike_id}, rating=${rating}`);

    return NextResponse.json(
      {
        success: true,
        message: "レビューを投稿しました",
        data: {
          id: `rev-sandbox-${Date.now()}`,
          user_id: user.id,
          bike_id,
          vendor_id,
          reservation_id: reservation_id || null,
          rating,
          comment,
          created_at: new Date().toISOString(),
        },
      },
      { status: 201 }
    );
  }

  // 本番モード: Supabase INSERT
  const { data, error } = await supabase
    .from("reviews")
    .insert({
      user_id: user.id,
      bike_id,
      vendor_id,
      reservation_id: reservation_id || null,
      rating,
      comment: comment.trim(),
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { error: "Database error", message: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json(
    {
      success: true,
      message: "レビューを投稿しました",
      data,
    },
    { status: 201 }
  );
}

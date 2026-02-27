import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/requireAuth";
import { createAdminSupabaseClient } from "@/lib/supabase/server";
import { isSandboxMode, sandboxLog } from "@/lib/sandbox";
import { mockReviews } from "@/lib/mock";

const reviewsWithVisibility = mockReviews.map((r) => ({
  ...r,
  is_published: true,
}));

export async function GET(request: NextRequest) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  const searchParams = request.nextUrl.searchParams;
  const search = searchParams.get("search");
  const minRating = searchParams.get("minRating");
  const maxRating = searchParams.get("maxRating");
  const limit = parseInt(searchParams.get("limit") || "50");
  const offset = parseInt(searchParams.get("offset") || "0");

  if (isSandboxMode()) {
    let filtered = [...reviewsWithVisibility];

    if (search) {
      const s = search.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.bikeName.toLowerCase().includes(s) ||
          r.vendorName.toLowerCase().includes(s) ||
          r.comment.toLowerCase().includes(s)
      );
    }
    if (minRating) {
      filtered = filtered.filter((r) => r.rating >= parseInt(minRating));
    }
    if (maxRating) {
      filtered = filtered.filter((r) => r.rating <= parseInt(maxRating));
    }

    const total = filtered.length;
    const paged = filtered.slice(offset, offset + limit);

    const ratings = mockReviews.map((r) => r.rating);
    const avgRating =
      ratings.length > 0
        ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10
        : 0;

    const summary = {
      total: mockReviews.length,
      avg_rating: avgRating,
      rating_distribution: {
        1: mockReviews.filter((r) => r.rating === 1).length,
        2: mockReviews.filter((r) => r.rating === 2).length,
        3: mockReviews.filter((r) => r.rating === 3).length,
        4: mockReviews.filter((r) => r.rating === 4).length,
        5: mockReviews.filter((r) => r.rating === 5).length,
      },
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
      .from("reviews")
      .select(
        "*, bike:bikes(id, name, model), vendor:vendors(id, name), user:users(id, full_name, email)",
        { count: "exact" }
      )
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (minRating) {
      query = query.gte("rating", parseInt(minRating));
    }
    if (maxRating) {
      query = query.lte("rating", parseInt(maxRating));
    }

    const [reviewsResult, summaryResult] = await Promise.all([
      query,
      supabase.from("reviews").select("rating, is_published"),
    ]);

    if (reviewsResult.error) {
      return NextResponse.json(
        { error: "Database error", message: reviewsResult.error.message },
        { status: 500 }
      );
    }

    let data = reviewsResult.data || [];

    // テキスト検索はアプリ側
    if (search) {
      const s = search.toLowerCase();
      data = data.filter(
        (r: Record<string, unknown>) => {
          const bike = r.bike as { name?: string } | null;
          const vendor = r.vendor as { name?: string } | null;
          const user = r.user as { full_name?: string } | null;
          return (
            bike?.name?.toLowerCase().includes(s) ||
            vendor?.name?.toLowerCase().includes(s) ||
            user?.full_name?.toLowerCase().includes(s) ||
            (r.comment as string)?.toLowerCase().includes(s)
          );
        }
      );
    }

    const allReviews = summaryResult.data || [];
    const ratings = allReviews.map((r) => r.rating);
    const avgRating =
      ratings.length > 0
        ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10
        : 0;

    const summary = {
      total: allReviews.length,
      avg_rating: avgRating,
      rating_distribution: {
        1: allReviews.filter((r) => r.rating === 1).length,
        2: allReviews.filter((r) => r.rating === 2).length,
        3: allReviews.filter((r) => r.rating === 3).length,
        4: allReviews.filter((r) => r.rating === 4).length,
        5: allReviews.filter((r) => r.rating === 5).length,
      },
    };

    return NextResponse.json({
      data,
      summary,
      pagination: { total: reviewsResult.count || 0, limit, offset },
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

  const { reviewId, action } = body;

  if (!reviewId || !action) {
    return NextResponse.json(
      { error: "Bad request", message: "reviewId と action は必須です" },
      { status: 400 }
    );
  }

  if (isSandboxMode()) {
    const review = mockReviews.find((r) => r.id === reviewId);
    if (!review) {
      return NextResponse.json(
        { error: "Not found", message: "レビューが見つかりません" },
        { status: 404 }
      );
    }

    if (action === "show") {
      sandboxLog("review_show", `${reviewId} を公開`);
      return NextResponse.json({
        success: true,
        message: `レビュー ${reviewId} を公開しました`,
        data: { reviewId, is_published: true },
      });
    } else if (action === "hide") {
      sandboxLog("review_hide", `${reviewId} を非表示`);
      return NextResponse.json({
        success: true,
        message: `レビュー ${reviewId} を非表示にしました`,
        data: { reviewId, is_published: false },
      });
    }

    return NextResponse.json(
      { error: "Bad request", message: "不正なアクションです (show / hide)" },
      { status: 400 }
    );
  }

  // 本番: Supabase
  try {
    const supabase = createAdminSupabaseClient();

    if (action === "show") {
      const { error } = await supabase
        .from("reviews")
        .update({ is_published: true })
        .eq("id", reviewId);

      if (error) throw error;

      return NextResponse.json({
        success: true,
        message: `レビュー ${reviewId} を公開しました`,
        data: { reviewId, is_published: true },
      });
    } else if (action === "hide") {
      const { error } = await supabase
        .from("reviews")
        .update({ is_published: false })
        .eq("id", reviewId);

      if (error) throw error;

      return NextResponse.json({
        success: true,
        message: `レビュー ${reviewId} を非表示にしました`,
        data: { reviewId, is_published: false },
      });
    }

    return NextResponse.json(
      { error: "Bad request", message: "不正なアクションです (show / hide)" },
      { status: 400 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Server error", message: String(error) },
      { status: 500 }
    );
  }
}

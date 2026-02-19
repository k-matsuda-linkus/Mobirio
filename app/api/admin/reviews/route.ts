import { NextRequest, NextResponse } from 'next/server';
import { isSandboxMode, sandboxLog } from '@/lib/sandbox';
import { mockReviews } from '@/lib/mock';

// レビューに公開状態を付与（モック拡張）
const reviewsWithVisibility = mockReviews.map((r) => ({
  ...r,
  is_visible: true,
}));

export async function GET(request: NextRequest) {
  if (isSandboxMode()) {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search');
    const minRating = searchParams.get('minRating');
    const maxRating = searchParams.get('maxRating');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

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
      message: 'OK',
    });
  }

  return NextResponse.json({ data: [], message: 'Production mode not configured' });
}

export async function PUT(request: NextRequest) {
  if (isSandboxMode()) {
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON', message: 'リクエストボディが不正です' },
        { status: 400 }
      );
    }

    const { reviewId, action } = body;

    if (!reviewId || !action) {
      return NextResponse.json(
        { error: 'Bad request', message: 'reviewId と action は必須です' },
        { status: 400 }
      );
    }

    const review = mockReviews.find((r) => r.id === reviewId);
    if (!review) {
      return NextResponse.json(
        { error: 'Not found', message: 'レビューが見つかりません' },
        { status: 404 }
      );
    }

    if (action === 'show') {
      sandboxLog('review_show', `${reviewId} を公開`);
      return NextResponse.json({
        success: true,
        message: `レビュー ${reviewId} を公開しました`,
        data: { reviewId, is_visible: true },
      });
    } else if (action === 'hide') {
      sandboxLog('review_hide', `${reviewId} を非表示`);
      return NextResponse.json({
        success: true,
        message: `レビュー ${reviewId} を非表示にしました`,
        data: { reviewId, is_visible: false },
      });
    }

    return NextResponse.json(
      { error: 'Bad request', message: '不正なアクションです (show / hide)' },
      { status: 400 }
    );
  }

  return NextResponse.json({ success: false, message: 'Production mode not configured' });
}

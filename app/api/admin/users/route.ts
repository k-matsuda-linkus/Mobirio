import { NextRequest, NextResponse } from 'next/server';
import { isSandboxMode, sandboxLog } from '@/lib/sandbox';
import { mockUsers } from '@/lib/mock';

export async function GET(request: NextRequest) {
  if (isSandboxMode()) {
    const searchParams = request.nextUrl.searchParams;
    const role = searchParams.get('role');
    const isBanned = searchParams.get('is_banned');
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    let filtered = [...mockUsers];

    if (role) {
      filtered = filtered.filter((u) => u.role === role);
    }

    if (isBanned !== null) {
      filtered = filtered.filter((u) => u.is_banned === (isBanned === 'true'));
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
      customers: mockUsers.filter((u) => u.role === 'customer').length,
      vendors: mockUsers.filter((u) => u.role === 'vendor').length,
      admins: mockUsers.filter((u) => u.role === 'admin').length,
      banned: mockUsers.filter((u) => u.is_banned).length,
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

    const { userId, action } = body;

    if (!userId || !action) {
      return NextResponse.json(
        { error: 'Bad request', message: 'userId と action は必須です' },
        { status: 400 }
      );
    }

    const user = mockUsers.find((u) => u.id === userId);
    if (!user) {
      return NextResponse.json(
        { error: 'Not found', message: 'ユーザーが見つかりません' },
        { status: 404 }
      );
    }

    if (action === 'ban') {
      sandboxLog('user_ban', `${user.full_name || user.email} (${userId}) をBAN`);
      return NextResponse.json({
        success: true,
        message: `${user.full_name || user.email} をBANしました`,
        data: { userId, is_banned: true },
      });
    } else if (action === 'unban') {
      sandboxLog('user_unban', `${user.full_name || user.email} (${userId}) のBANを解除`);
      return NextResponse.json({
        success: true,
        message: `${user.full_name || user.email} のBANを解除しました`,
        data: { userId, is_banned: false },
      });
    }

    return NextResponse.json(
      { error: 'Bad request', message: '不正なアクションです (ban / unban)' },
      { status: 400 }
    );
  }

  return NextResponse.json({ success: false, message: 'Production mode not configured' });
}

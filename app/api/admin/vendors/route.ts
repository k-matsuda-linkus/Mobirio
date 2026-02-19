import { NextRequest, NextResponse } from 'next/server';
import { isSandboxMode, sandboxLog } from '@/lib/sandbox';
import { mockVendors, mockBikes } from '@/lib/mock';

export async function GET(request: NextRequest) {
  if (isSandboxMode()) {
    const searchParams = request.nextUrl.searchParams;
    const isApproved = searchParams.get('is_approved');
    const isActive = searchParams.get('is_active');
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    let filtered = [...mockVendors];

    if (isApproved !== null) {
      filtered = filtered.filter((v) => v.is_approved === (isApproved === 'true'));
    }

    if (isActive !== null) {
      filtered = filtered.filter((v) => v.is_active === (isActive === 'true'));
    }

    if (search) {
      const s = search.toLowerCase();
      filtered = filtered.filter(
        (v) =>
          v.name.toLowerCase().includes(s) ||
          v.slug.toLowerCase().includes(s) ||
          v.contact_email.toLowerCase().includes(s) ||
          v.prefecture.includes(search) ||
          v.city.includes(search)
      );
    }

    const total = filtered.length;
    const paged = filtered.slice(offset, offset + limit);

    const data = paged.map((v) => ({
      ...v,
      bikes_count: mockBikes.filter((b) => b.vendor_id === v.id).length,
    }));

    const summary = {
      total: mockVendors.length,
      approved: mockVendors.filter((v) => v.is_approved).length,
      pending_approval: mockVendors.filter((v) => !v.is_approved).length,
      active: mockVendors.filter((v) => v.is_active).length,
      inactive: mockVendors.filter((v) => !v.is_active).length,
    };

    return NextResponse.json({
      data,
      summary,
      pagination: { total, limit, offset },
      message: 'OK',
    });
  }

  // 本番モード: Supabase接続
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

    const { vendorId, action } = body;

    if (!vendorId || !action) {
      return NextResponse.json(
        { error: 'Bad request', message: 'vendorId と action は必須です' },
        { status: 400 }
      );
    }

    const vendor = mockVendors.find((v) => v.id === vendorId);
    if (!vendor) {
      return NextResponse.json(
        { error: 'Not found', message: 'ベンダーが見つかりません' },
        { status: 404 }
      );
    }

    if (action === 'approve') {
      sandboxLog('vendor_approve', `${vendor.name} (${vendorId}) を承認`);
      return NextResponse.json({
        success: true,
        message: `${vendor.name} を承認しました`,
        data: { vendorId, is_approved: true },
      });
    } else if (action === 'ban') {
      sandboxLog('vendor_ban', `${vendor.name} (${vendorId}) をBAN`);
      return NextResponse.json({
        success: true,
        message: `${vendor.name} をBANしました`,
        data: { vendorId, is_active: false },
      });
    } else if (action === 'activate') {
      sandboxLog('vendor_activate', `${vendor.name} (${vendorId}) をアクティブ化`);
      return NextResponse.json({
        success: true,
        message: `${vendor.name} をアクティブにしました`,
        data: { vendorId, is_active: true },
      });
    }

    return NextResponse.json(
      { error: 'Bad request', message: '不正なアクションです (approve / ban / activate)' },
      { status: 400 }
    );
  }

  return NextResponse.json({ success: false, message: 'Production mode not configured' });
}

import { NextRequest, NextResponse } from 'next/server';
import { isSandboxMode, sandboxLog } from '@/lib/sandbox';
import { mockInquiries } from '@/lib/mock';

export async function GET(request: NextRequest) {
  if (isSandboxMode()) {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    let filtered = [...mockInquiries];

    if (status) {
      filtered = filtered.filter((i) => i.status === status);
    }

    if (search) {
      const s = search.toLowerCase();
      filtered = filtered.filter(
        (i) =>
          i.name.toLowerCase().includes(s) ||
          i.email.toLowerCase().includes(s) ||
          i.subject.toLowerCase().includes(s) ||
          i.content.toLowerCase().includes(s)
      );
    }

    const total = filtered.length;
    const paged = filtered.slice(offset, offset + limit);

    const summary = {
      total: mockInquiries.length,
      new: mockInquiries.filter((i) => i.status === 'new').length,
      in_progress: mockInquiries.filter((i) => i.status === 'in_progress').length,
      resolved: mockInquiries.filter((i) => i.status === 'resolved').length,
      closed: mockInquiries.filter((i) => i.status === 'closed').length,
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

    const { inquiryId, status, reply } = body;

    if (!inquiryId || !status) {
      return NextResponse.json(
        { error: 'Bad request', message: 'inquiryId と status は必須です' },
        { status: 400 }
      );
    }

    const validStatuses = ['new', 'in_progress', 'resolved', 'closed'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Bad request', message: `不正なステータスです (${validStatuses.join(' / ')})` },
        { status: 400 }
      );
    }

    const inquiry = mockInquiries.find((i) => i.id === inquiryId);
    if (!inquiry) {
      return NextResponse.json(
        { error: 'Not found', message: 'お問い合わせが見つかりません' },
        { status: 404 }
      );
    }

    sandboxLog('inquiry_update', `${inquiryId} を ${status} に更新${reply ? ' (返信あり)' : ''}`);

    return NextResponse.json({
      success: true,
      message: `お問い合わせ ${inquiryId} のステータスを ${status} に更新しました`,
      data: {
        inquiryId,
        status,
        reply: reply || inquiry.reply,
        replied_at: reply ? new Date().toISOString() : inquiry.replied_at,
      },
    });
  }

  return NextResponse.json({ success: false, message: 'Production mode not configured' });
}

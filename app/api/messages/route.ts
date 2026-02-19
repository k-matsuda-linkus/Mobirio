import { NextRequest, NextResponse } from 'next/server';

// TODO: Add authentication check
// TODO: Connect to Supabase

export async function GET(request: NextRequest) {
  return NextResponse.json({
    data: [
      { id: 'msg_001', from_user_id: 'user_001', to_user_id: 'vendor_001', body: 'ヘルメットは借りられますか？', created_at: '2025-05-20T10:00:00Z' },
    ],
    message: 'OK',
  });
}

export async function POST(request: NextRequest) {
  return NextResponse.json({ success: true, message: 'Message sent' }, { status: 201 });
}

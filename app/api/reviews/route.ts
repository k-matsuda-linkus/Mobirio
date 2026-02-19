import { NextRequest, NextResponse } from 'next/server';

// TODO: Add authentication check
// TODO: Connect to Supabase

export async function GET(request: NextRequest) {
  return NextResponse.json({
    data: [
      { id: 'rev_001', user_id: 'user_001', bike_id: 'bike_001', rating: 5, comment: '最高のバイクでした！', created_at: '2025-05-01' },
      { id: 'rev_002', user_id: 'user_002', bike_id: 'bike_003', rating: 4, comment: 'とても楽しかったです。', created_at: '2025-05-10' },
    ],
    message: 'OK',
  });
}

export async function POST(request: NextRequest) {
  return NextResponse.json({ success: true, message: 'Review created' }, { status: 201 });
}

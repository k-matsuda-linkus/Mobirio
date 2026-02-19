import { NextRequest, NextResponse } from 'next/server';

// TODO: Add authentication check
// TODO: Connect to Supabase

export async function GET(request: NextRequest) {
  return NextResponse.json({
    data: [
      { id: 'notif_001', user_id: 'user_001', type: 'reservation_confirmed', title: '予約確認', body: '予約が確認されました', is_read: false, created_at: '2025-05-20T10:00:00Z' },
    ],
    message: 'OK',
  });
}

export async function PUT(request: NextRequest) {
  return NextResponse.json({ success: true, message: 'Notification marked as read' });
}

import { NextRequest, NextResponse } from 'next/server';

// TODO: Add authentication check
// TODO: Connect to Supabase

export async function GET(request: NextRequest) {
  return NextResponse.json({
    data: [{ id: 'fav_001', user_id: 'user_001', bike_id: 'bike_001', created_at: '2025-04-01' }],
    message: 'OK',
  });
}

export async function POST(request: NextRequest) {
  return NextResponse.json({ success: true, message: 'Added to favorites' }, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  return NextResponse.json({ success: true, message: 'Removed from favorites' });
}

import { NextRequest, NextResponse } from 'next/server';

// TODO: Add authentication check
// TODO: Connect to Supabase

export async function GET(request: NextRequest) {
  return NextResponse.json({
    data: [
      { id: 'user_001', email: 'tanaka@example.com', name: '田中太郎', role: 'user', created_at: '2025-01-01' },
      { id: 'user_002', email: 'suzuki@example.com', name: '鈴木花子', role: 'vendor', created_at: '2025-01-05' },
    ],
    message: 'OK',
  });
}

export async function POST(request: NextRequest) {
  return NextResponse.json({ success: true, message: 'User created', id: 'user_new_001' }, { status: 201 });
}

import { NextRequest, NextResponse } from 'next/server';

// TODO: Add Supabase session verification

export async function GET(request: NextRequest) {
  return NextResponse.json({
    authenticated: true,
    user: { id: 'user_mock_001', email: 'test@example.com', role: 'user' },
  });
}

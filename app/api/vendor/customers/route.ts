import { NextRequest, NextResponse } from 'next/server';

// TODO: Add vendor authentication check
// TODO: Connect to Supabase

export async function GET(request: NextRequest) {
  return NextResponse.json({
    data: [
      { id: 'user_001', name: '田中太郎', email: 'tanaka@example.com', total_rentals: 5, last_rental: '2025-05-15' },
      { id: 'user_003', name: '佐藤次郎', email: 'sato@example.com', total_rentals: 2, last_rental: '2025-04-20' },
    ],
    message: 'OK',
  });
}

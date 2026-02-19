import { NextRequest, NextResponse } from 'next/server';

// TODO: Add vendor authentication check
// TODO: Connect to Supabase

export async function GET(request: NextRequest) {
  return NextResponse.json({
    data: {
      totalReservations: 45, confirmedCount: 30, pendingCount: 5,
      cancelledCount: 8, noShowCount: 2, averageDuration: 2.3,
    },
    message: 'OK',
  });
}

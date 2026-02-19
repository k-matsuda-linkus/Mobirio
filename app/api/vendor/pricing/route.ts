import { NextRequest, NextResponse } from 'next/server';

// TODO: Add vendor authentication check
// TODO: Connect to Supabase

export async function GET(request: NextRequest) {
  return NextResponse.json({
    data: {
      base_rates: { daily_1day: 8000, daily_2day: 7000, daily_3day: 6000, daily_week: 5000 },
      seasonal_adjustments: [],
    },
    message: 'OK',
  });
}

export async function PUT(request: NextRequest) {
  return NextResponse.json({ success: true, message: 'Pricing updated' });
}

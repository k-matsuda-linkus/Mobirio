import { NextRequest, NextResponse } from 'next/server';

// TODO: Add vendor authentication check
// TODO: Connect to Supabase

export async function GET(request: NextRequest) {
  return NextResponse.json({
    data: [
      { id: 'bike_001', name: 'PCX 160', manufacturer: 'Honda', displacement: 160, daily_rate_1day: 8000, is_available: true },
      { id: 'bike_002', name: 'NMAX 155', manufacturer: 'Yamaha', displacement: 155, daily_rate_1day: 7500, is_available: true },
    ],
    message: 'OK',
  });
}

export async function POST(request: NextRequest) {
  return NextResponse.json({ success: true, message: 'Bike added', id: 'bike_new_001' }, { status: 201 });
}

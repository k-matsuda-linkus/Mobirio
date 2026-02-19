import { NextRequest, NextResponse } from 'next/server';

// TODO: Add vendor authentication check
// TODO: Connect to Supabase

export async function GET(request: NextRequest) {
  return NextResponse.json({
    data: {
      totalBikes: 15, activeBikes: 12, utilizationRate: 0.73,
      mostPopularBike: { id: 'bike_001', name: 'PCX 160', rentals: 18 },
      bikeUsage: [
        { bike_id: 'bike_001', name: 'PCX 160', rentals: 18, revenue: 144000 },
        { bike_id: 'bike_003', name: 'CBR250RR', rentals: 12, revenue: 144000 },
      ],
    },
    message: 'OK',
  });
}

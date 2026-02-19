import { NextRequest, NextResponse } from 'next/server';

// TODO: Add vendor authentication check
// TODO: Connect to Supabase

export async function GET(request: NextRequest) {
  return NextResponse.json({
    data: {
      totalRevenue: 234500, monthlyRevenue: 78500, averageOrderValue: 15600, totalOrders: 15,
      revenueByMonth: [
        { month: '2025-03', revenue: 65000 },
        { month: '2025-04', revenue: 91000 },
        { month: '2025-05', revenue: 78500 },
      ],
    },
    message: 'OK',
  });
}

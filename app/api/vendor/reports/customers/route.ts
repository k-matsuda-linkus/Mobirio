import { NextRequest, NextResponse } from 'next/server';

// TODO: Add vendor authentication check
// TODO: Connect to Supabase

export async function GET(request: NextRequest) {
  return NextResponse.json({
    data: {
      totalCustomers: 32, newCustomersThisMonth: 8, repeatCustomerRate: 0.45, averageRating: 4.3,
      topCustomers: [{ id: 'user_001', name: '田中太郎', rentals: 5, totalSpent: 78000 }],
    },
    message: 'OK',
  });
}

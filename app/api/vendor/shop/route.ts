import { NextRequest, NextResponse } from 'next/server';

// TODO: Add vendor authentication check
// TODO: Connect to Supabase

export async function GET(request: NextRequest) {
  return NextResponse.json({
    data: {
      id: 'vendor_001', name: 'Tokyo Bike Rental', description: '渋谷駅から徒歩5分',
      address: '東京都渋谷区神南1-1-1', phone: '03-1234-5678',
      email: 'info@tokyobikerental.com', logo_url: '/images/vendor/logo.png',
    },
    message: 'OK',
  });
}

export async function PUT(request: NextRequest) {
  return NextResponse.json({ success: true, message: 'Shop info updated' });
}

import { NextRequest, NextResponse } from 'next/server';

// TODO: Add vendor authentication check
// TODO: Connect to Supabase

export async function GET(request: NextRequest) {
  return NextResponse.json({
    data: {
      monday: { open: '09:00', close: '19:00', closed: false },
      tuesday: { open: '09:00', close: '19:00', closed: false },
      wednesday: { open: '09:00', close: '19:00', closed: false },
      thursday: { open: '09:00', close: '19:00', closed: false },
      friday: { open: '09:00', close: '19:00', closed: false },
      saturday: { open: '10:00', close: '18:00', closed: false },
      sunday: { open: '10:00', close: '18:00', closed: false },
    },
    message: 'OK',
  });
}

export async function PUT(request: NextRequest) {
  return NextResponse.json({ success: true, message: 'Business hours updated' });
}

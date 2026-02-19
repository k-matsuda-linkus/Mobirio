import { NextRequest, NextResponse } from 'next/server';

// TODO: Add vendor authentication check
// TODO: Connect to Supabase

export async function GET(request: NextRequest) {
  return NextResponse.json({
    data: [
      { id: 'hol_001', date: '2025-12-31', name: '年末休業' },
      { id: 'hol_002', date: '2026-01-01', name: '元日' },
      { id: 'hol_003', date: '2026-01-02', name: '正月休業' },
      { id: 'hol_004', date: '2026-01-03', name: '正月休業' },
    ],
    message: 'OK',
  });
}

export async function POST(request: NextRequest) {
  return NextResponse.json({ success: true, message: 'Holiday added' }, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  return NextResponse.json({ success: true, message: 'Holiday removed' });
}

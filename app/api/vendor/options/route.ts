import { NextRequest, NextResponse } from 'next/server';

// TODO: Add vendor authentication check
// TODO: Connect to Supabase

export async function GET(request: NextRequest) {
  return NextResponse.json({
    data: [
      { id: 'opt_001', name: 'ヘルメット', price: 500, description: 'フルフェイスヘルメット' },
      { id: 'opt_002', name: 'グローブ', price: 300, description: 'ライディンググローブ' },
      { id: 'opt_003', name: 'スマホホルダー', price: 200, description: 'ハンドルマウント' },
    ],
    message: 'OK',
  });
}

export async function POST(request: NextRequest) {
  return NextResponse.json({ success: true, message: 'Option created', id: 'opt_new_001' }, { status: 201 });
}

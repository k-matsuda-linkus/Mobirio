import { NextRequest, NextResponse } from 'next/server';

// TODO: Add authentication check
// TODO: Connect to Square API

export async function POST(request: NextRequest) {
  return NextResponse.json({ success: true, cardId: 'card_mock_001', message: 'Card registered' });
}

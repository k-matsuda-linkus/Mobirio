import { NextRequest, NextResponse } from 'next/server';

// TODO: Connect to Supabase
// TODO: Send notification email

export async function POST(request: NextRequest) {
  return NextResponse.json({ success: true, message: 'Contact form submitted' }, { status: 201 });
}

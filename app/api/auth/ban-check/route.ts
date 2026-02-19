import { NextRequest, NextResponse } from 'next/server';

// TODO: Connect to Supabase to check user ban status

export async function GET(request: NextRequest) {
  return NextResponse.json({ banned: false });
}

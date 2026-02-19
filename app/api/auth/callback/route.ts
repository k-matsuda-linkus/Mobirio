import { NextRequest, NextResponse } from 'next/server';

// TODO: Add Supabase OAuth callback handling

export async function GET(request: NextRequest) {
  const redirectUrl = new URL('/', request.url);
  return NextResponse.redirect(redirectUrl);
}

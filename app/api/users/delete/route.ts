import { NextRequest, NextResponse } from 'next/server';

// TODO: Add authentication check
// TODO: Connect to Supabase - soft delete

export async function POST(request: NextRequest) {
  return NextResponse.json({ success: true, message: 'Account soft-deleted' });
}

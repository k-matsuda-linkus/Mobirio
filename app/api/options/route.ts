import { NextRequest, NextResponse } from 'next/server';
import { isSandboxMode } from '@/lib/sandbox';
import { mockOptions } from '@/lib/mock';

export async function GET(request: NextRequest) {
  const vendorId = request.nextUrl.searchParams.get('vendorId');

  if (!vendorId) {
    return NextResponse.json(
      { error: 'vendorId is required', data: [] },
      { status: 400 }
    );
  }

  if (isSandboxMode()) {
    const filtered = mockOptions.filter(
      (o) => o.vendor_id === vendorId && o.is_active
    );
    filtered.sort((a, b) => a.sort_order - b.sort_order);

    return NextResponse.json({ data: filtered });
  }

  // 本番モード: Supabase
  const { createServerSupabaseClient } = await import('@/lib/supabase/server');
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from('options')
    .select('*')
    .eq('vendor_id', vendorId)
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (error) {
    return NextResponse.json(
      { error: error.message, data: [] },
      { status: 500 }
    );
  }

  return NextResponse.json({ data: data || [] });
}

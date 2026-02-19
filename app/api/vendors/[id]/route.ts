import { NextRequest, NextResponse } from 'next/server';
import { isSandboxMode } from '@/lib/sandbox';
import { mockVendors } from '@/lib/mock/vendors';
import { mockBikes } from '@/lib/mock/bikes';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (isSandboxMode()) {
    const vendor = mockVendors.find((v) => v.id === id);
    if (!vendor) {
      return NextResponse.json(
        { vendor: null, bikes: [], message: 'ベンダーが見つかりません' },
        { status: 404 }
      );
    }

    const vendorBikes = mockBikes.filter(
      (b) => b.vendor_id === id && b.is_available
    );

    return NextResponse.json({
      vendor,
      bikes: vendorBikes,
      message: 'OK',
    });
  }

  // 本番モード: Supabase
  const { createServerSupabaseClient } = await import('@/lib/supabase/server');
  const supabase = await createServerSupabaseClient();

  const { data: vendor, error: vendorError } = await supabase
    .from('vendors')
    .select('*')
    .eq('id', id)
    .single();

  if (vendorError || !vendor) {
    return NextResponse.json(
      { vendor: null, bikes: [], message: 'ベンダーが見つかりません' },
      { status: 404 }
    );
  }

  const { data: bikes } = await supabase
    .from('bikes')
    .select('*')
    .eq('vendor_id', id)
    .eq('is_available', true);

  return NextResponse.json({
    vendor,
    bikes: bikes || [],
    message: 'OK',
  });
}

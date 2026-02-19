import { NextRequest, NextResponse } from 'next/server';
import { isSandboxMode } from '@/lib/sandbox';
import { mockBikes } from '@/lib/mock/bikes';
import { mockVendors } from '@/lib/mock/vendors';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (isSandboxMode()) {
    const bike = mockBikes.find((b) => b.id === id);
    if (!bike) {
      return NextResponse.json(
        { data: null, message: 'バイクが見つかりません' },
        { status: 404 }
      );
    }

    const vendor = mockVendors.find((v) => v.id === bike.vendor_id) || null;

    return NextResponse.json({
      data: {
        ...bike,
        vendor: vendor
          ? { id: vendor.id, name: vendor.name, slug: vendor.slug, address: vendor.address }
          : null,
      },
      message: 'OK',
    });
  }

  // 本番モード: Supabase
  const { createServerSupabaseClient } = await import('@/lib/supabase/server');
  const supabase = await createServerSupabaseClient();

  const { data: bike, error } = await supabase
    .from('bikes')
    .select('*, vendors(id, name, slug, address)')
    .eq('id', id)
    .single();

  if (error || !bike) {
    return NextResponse.json(
      { data: null, message: 'バイクが見つかりません' },
      { status: 404 }
    );
  }

  return NextResponse.json({ data: bike, message: 'OK' });
}

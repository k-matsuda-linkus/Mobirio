import { NextRequest, NextResponse } from 'next/server';
import { isSandboxMode } from '@/lib/sandbox';
import { mockVendors } from '@/lib/mock/vendors';
import { REGIONS } from '@/lib/constants';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  const region = searchParams.get('region');
  const prefecture = searchParams.get('prefecture');
  const keyword = searchParams.get('keyword');
  const page = Math.max(1, Number(searchParams.get('page') || '1'));
  const limit = Math.min(50, Math.max(1, Number(searchParams.get('limit') || '20')));

  // region → 都道府県リスト解決
  const regionPrefectures = region
    ? REGIONS.find((r) => r.id === region)?.prefectures || []
    : [];

  if (isSandboxMode()) {
    let filtered = mockVendors.filter((v) => v.is_active && v.is_approved);

    if (prefecture) {
      filtered = filtered.filter((v) => v.prefecture === prefecture);
    } else if (regionPrefectures.length > 0) {
      filtered = filtered.filter((v) => regionPrefectures.includes(v.prefecture));
    }
    if (keyword) {
      const kw = keyword.toLowerCase();
      filtered = filtered.filter(
        (v) =>
          v.name.toLowerCase().includes(kw) ||
          v.description.toLowerCase().includes(kw) ||
          v.address.toLowerCase().includes(kw) ||
          v.city.toLowerCase().includes(kw)
      );
    }

    const total = filtered.length;
    const start = (page - 1) * limit;
    const paged = filtered.slice(start, start + limit);

    return NextResponse.json({
      vendors: paged,
      total,
      page,
      limit,
    });
  }

  // 本番モード: Supabase
  const { createServerSupabaseClient } = await import('@/lib/supabase/server');
  const supabase = await createServerSupabaseClient();

  let query = supabase
    .from('vendors')
    .select('*', { count: 'exact' })
    .eq('is_active', true)
    .eq('is_approved', true);

  if (prefecture) {
    query = query.eq('prefecture', prefecture);
  } else if (regionPrefectures.length > 0) {
    query = query.in('prefecture', regionPrefectures);
  }
  if (keyword) {
    query = query.or(
      `name.ilike.%${keyword}%,description.ilike.%${keyword}%,address.ilike.%${keyword}%`
    );
  }

  const start = (page - 1) * limit;
  query = query.range(start, start + limit - 1);

  const { data, count, error } = await query;

  if (error) {
    return NextResponse.json(
      { vendors: [], total: 0, page, limit, error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    vendors: data || [],
    total: count || 0,
    page,
    limit,
  });
}

export async function POST(request: NextRequest) {
  return NextResponse.json(
    { success: true, message: 'Vendor registered', id: 'vendor_new_001' },
    { status: 201 }
  );
}

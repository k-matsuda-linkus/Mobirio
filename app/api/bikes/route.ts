import { NextRequest, NextResponse } from 'next/server';
import { isSandboxMode } from '@/lib/sandbox';
import { mockBikes } from '@/lib/mock/bikes';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  const vehicleClass = searchParams.get('vehicle_class');
  const manufacturer = searchParams.get('manufacturer');
  const minPrice = searchParams.get('min_price');
  const maxPrice = searchParams.get('max_price');
  const keyword = searchParams.get('keyword');
  const sort = searchParams.get('sort') || 'price_asc';
  const page = Math.max(1, Number(searchParams.get('page') || '1'));
  const limit = Math.min(50, Math.max(1, Number(searchParams.get('limit') || '20')));

  if (isSandboxMode()) {
    let filtered = mockBikes.filter((b) => b.is_available);

    if (vehicleClass) {
      const classes = vehicleClass.split(',');
      filtered = filtered.filter((b) => classes.includes(b.vehicle_class));
    }
    if (manufacturer) {
      const mfrs = manufacturer.split(',').map((m) => m.toLowerCase());
      filtered = filtered.filter((b) =>
        mfrs.includes(b.manufacturer.toLowerCase())
      );
    }
    if (minPrice) {
      const min = Number(minPrice);
      filtered = filtered.filter((b) => b.daily_rate_1day >= min);
    }
    if (maxPrice) {
      const max = Number(maxPrice);
      filtered = filtered.filter((b) => b.daily_rate_1day <= max);
    }
    if (keyword) {
      const kw = keyword.toLowerCase();
      filtered = filtered.filter(
        (b) =>
          b.name.toLowerCase().includes(kw) ||
          b.model.toLowerCase().includes(kw) ||
          b.manufacturer.toLowerCase().includes(kw) ||
          (b.description && b.description.toLowerCase().includes(kw))
      );
    }

    // Sort
    switch (sort) {
      case 'price_asc':
        filtered.sort((a, b) => a.daily_rate_1day - b.daily_rate_1day);
        break;
      case 'price_desc':
        filtered.sort((a, b) => b.daily_rate_1day - a.daily_rate_1day);
        break;
      case 'displacement_asc':
        filtered.sort((a, b) => (a.displacement ?? 0) - (b.displacement ?? 0));
        break;
      case 'displacement_desc':
        filtered.sort((a, b) => (b.displacement ?? 0) - (a.displacement ?? 0));
        break;
      default:
        filtered.sort((a, b) => a.daily_rate_1day - b.daily_rate_1day);
    }

    const total = filtered.length;
    const start = (page - 1) * limit;
    const paged = filtered.slice(start, start + limit);

    return NextResponse.json({
      bikes: paged,
      total,
      page,
      limit,
    });
  }

  // 本番モード: Supabase
  const { createServerSupabaseClient } = await import('@/lib/supabase/server');
  const supabase = await createServerSupabaseClient();

  let query = supabase.from('bikes').select('*', { count: 'exact' }).eq('is_available', true);

  if (vehicleClass) {
    query = query.in('vehicle_class', vehicleClass.split(','));
  }
  if (manufacturer) {
    query = query.in('manufacturer', manufacturer.split(','));
  }
  if (minPrice) {
    query = query.gte('daily_rate_1day', Number(minPrice));
  }
  if (maxPrice) {
    query = query.lte('daily_rate_1day', Number(maxPrice));
  }
  if (keyword) {
    query = query.or(
      `name.ilike.%${keyword}%,model.ilike.%${keyword}%,manufacturer.ilike.%${keyword}%`
    );
  }

  // Sort
  switch (sort) {
    case 'price_desc':
      query = query.order('daily_rate_1day', { ascending: false });
      break;
    case 'displacement_asc':
      query = query.order('displacement', { ascending: true });
      break;
    case 'displacement_desc':
      query = query.order('displacement', { ascending: false });
      break;
    default:
      query = query.order('daily_rate_1day', { ascending: true });
  }

  const start = (page - 1) * limit;
  query = query.range(start, start + limit - 1);

  const { data, count, error } = await query;

  if (error) {
    return NextResponse.json(
      { bikes: [], total: 0, page, limit, error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    bikes: data || [],
    total: count || 0,
    page,
    limit,
  });
}

import { NextRequest, NextResponse } from 'next/server';
import { isSandboxMode } from '@/lib/sandbox';
import { mockBikes } from '@/lib/mock/bikes';
import { mockReservations } from '@/lib/mock/reservations';
import type { DayAvailability } from '@/types/booking';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const searchParams = request.nextUrl.searchParams;

  const startDate = searchParams.get('start_date') || searchParams.get('startDate');
  const endDate = searchParams.get('end_date') || searchParams.get('endDate');
  const checkStart = searchParams.get('checkStart');
  const checkEnd = searchParams.get('checkEnd');

  if (isSandboxMode()) {
    const bike = mockBikes.find((b) => b.id === id);
    if (!bike) {
      return NextResponse.json(
        { available: false, conflicts: [], message: 'バイクが見つかりません' },
        { status: 404 }
      );
    }

    // Specific availability check
    if (checkStart && checkEnd) {
      if (!bike.is_available) {
        return NextResponse.json({
          available: false,
          reason: 'このバイクは現在予約を受け付けていません',
          conflictingReservations: [],
          nextAvailable: null,
          message: 'OK',
        });
      }

      const reqStart = new Date(checkStart);
      const reqEnd = new Date(checkEnd);

      const conflicts = mockReservations.filter(
        (r) =>
          r.bike_id === id &&
          ['pending', 'confirmed', 'in_use'].includes(r.status) &&
          new Date(r.start_datetime) < reqEnd &&
          new Date(r.end_datetime) > reqStart
      );

      if (conflicts.length > 0) {
        const sorted = [...conflicts].sort(
          (a, b) => new Date(a.end_datetime).getTime() - new Date(b.end_datetime).getTime()
        );
        return NextResponse.json({
          available: false,
          reason: '指定期間に既存の予約があります',
          conflictingReservations: conflicts.map((c) => c.id),
          nextAvailable: sorted[sorted.length - 1].end_datetime,
          message: 'OK',
        });
      }

      return NextResponse.json({
        available: true,
        conflictingReservations: [],
        nextAvailable: null,
        message: 'OK',
      });
    }

    // Calendar data
    const now = new Date();
    const calStart = startDate
      ? new Date(startDate)
      : new Date(now.getFullYear(), now.getMonth(), 1);
    const calEnd = endDate
      ? new Date(endDate)
      : new Date(now.getFullYear(), now.getMonth() + 2, 0);

    const bikeReservations = mockReservations.filter(
      (r) =>
        r.bike_id === id &&
        ['pending', 'confirmed', 'in_use'].includes(r.status)
    );

    const calendar: DayAvailability[] = [];
    for (let d = new Date(calStart); d <= calEnd; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];

      let status: DayAvailability['status'] = 'available';

      if (!bike.is_available) {
        status = 'unavailable';
      } else {
        const dayStart = new Date(dateStr);
        const dayEnd = new Date(dateStr);
        dayEnd.setDate(dayEnd.getDate() + 1);

        const hasReservation = bikeReservations.some((r) => {
          const rStart = new Date(r.start_datetime);
          const rEnd = new Date(r.end_datetime);
          return rStart < dayEnd && rEnd > dayStart;
        });

        if (hasReservation) {
          status = 'booked';
        }
      }

      calendar.push({ date: dateStr, status });
    }

    return NextResponse.json({
      bikeId: id,
      calendar,
      startDate: calStart.toISOString(),
      endDate: calEnd.toISOString(),
      message: 'OK',
    });
  }

  // 本番モード: Supabase
  const { checkAvailability, getBikeAvailabilityCalendar } = await import(
    '@/lib/booking/availability'
  );

  if (checkStart && checkEnd) {
    const result = await checkAvailability(id, checkStart, checkEnd);
    return NextResponse.json({
      available: result.available,
      reason: result.reason || null,
      conflictingReservations: result.conflictingReservations,
      nextAvailable: result.nextAvailable,
      message: 'OK',
    });
  }

  const now = new Date();
  const defaultStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const defaultEnd = new Date(now.getFullYear(), now.getMonth() + 2, 0).toISOString();

  const calendarStart = startDate || defaultStart;
  const calendarEnd = endDate || defaultEnd;

  const calendar = await getBikeAvailabilityCalendar(id, calendarStart, calendarEnd);

  return NextResponse.json({
    bikeId: id,
    calendar,
    startDate: calendarStart,
    endDate: calendarEnd,
    message: 'OK',
  });
}

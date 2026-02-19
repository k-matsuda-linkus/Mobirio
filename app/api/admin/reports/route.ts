import { NextRequest, NextResponse } from 'next/server';
import { isSandboxMode } from '@/lib/sandbox';
import { mockReservations, mockPayments, mockBikes, mockVendors } from '@/lib/mock';

export async function GET(request: NextRequest) {
  if (isSandboxMode()) {
    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get('startDate') || '2026-01-01';
    const endDate = searchParams.get('endDate') || '2026-02-28';

    // 期間内の予約をフィルタリング
    const filteredReservations = mockReservations.filter(
      (r) => r.created_at >= startDate && r.created_at <= endDate
    );

    const filteredPayments = mockPayments.filter(
      (p) => p.created_at >= startDate && p.created_at <= endDate
    );

    // 日別売上を生成
    const revenueByDate: Record<string, number> = {};
    for (const p of filteredPayments) {
      if (p.status === 'completed') {
        const date = p.created_at.split('T')[0];
        revenueByDate[date] = (revenueByDate[date] || 0) + p.amount;
      }
    }

    const daily_revenue = Object.entries(revenueByDate)
      .map(([date, amount]) => ({ date, amount }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // ステータス別予約数
    const reservation_by_status = {
      pending: filteredReservations.filter((r) => r.status === 'pending').length,
      confirmed: filteredReservations.filter((r) => r.status === 'confirmed').length,
      in_use: filteredReservations.filter((r) => r.status === 'in_use').length,
      completed: filteredReservations.filter((r) => r.status === 'completed').length,
      cancelled: filteredReservations.filter((r) => r.status === 'cancelled').length,
      no_show: filteredReservations.filter((r) => r.status === 'no_show').length,
    };

    // 人気バイクランキング
    const bikeReservationCount: Record<string, number> = {};
    const bikeRevenue: Record<string, number> = {};
    for (const r of filteredReservations) {
      bikeReservationCount[r.bike_id] = (bikeReservationCount[r.bike_id] || 0) + 1;
      bikeRevenue[r.bike_id] = (bikeRevenue[r.bike_id] || 0) + r.total_amount;
    }

    const top_bikes = Object.entries(bikeReservationCount)
      .map(([bikeId, count]) => {
        const bike = mockBikes.find((b) => b.id === bikeId);
        return {
          bike_id: bikeId,
          name: bike?.name || bikeId,
          manufacturer: bike?.manufacturer || '',
          reservation_count: count,
          revenue: bikeRevenue[bikeId] || 0,
        };
      })
      .sort((a, b) => b.reservation_count - a.reservation_count);

    // 人気ベンダーランキング
    const vendorReservationCount: Record<string, number> = {};
    const vendorRevenue: Record<string, number> = {};
    for (const r of filteredReservations) {
      vendorReservationCount[r.vendor_id] = (vendorReservationCount[r.vendor_id] || 0) + 1;
      vendorRevenue[r.vendor_id] = (vendorRevenue[r.vendor_id] || 0) + r.total_amount;
    }

    const top_vendors = Object.entries(vendorReservationCount)
      .map(([vendorId, count]) => {
        const vendor = mockVendors.find((v) => v.id === vendorId);
        return {
          vendor_id: vendorId,
          name: vendor?.name || vendorId,
          reservation_count: count,
          revenue: vendorRevenue[vendorId] || 0,
        };
      })
      .sort((a, b) => b.revenue - a.revenue);

    return NextResponse.json({
      data: {
        period: { startDate, endDate },
        daily_revenue,
        reservation_by_status,
        top_bikes,
        top_vendors,
        totals: {
          reservations: filteredReservations.length,
          revenue: filteredPayments
            .filter((p) => p.status === 'completed')
            .reduce((sum, p) => sum + p.amount, 0),
        },
      },
      message: 'OK',
    });
  }

  return NextResponse.json({ data: {}, message: 'Production mode not configured' });
}

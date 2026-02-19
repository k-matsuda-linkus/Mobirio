import { NextRequest, NextResponse } from 'next/server';
import { isSandboxMode } from '@/lib/sandbox';
import {
  mockReservations,
  mockPayments,
  mockVendors,
  mockUsers,
  mockBikes,
  mockReviews,
} from '@/lib/mock';

export async function GET(_request: NextRequest) {
  if (isSandboxMode()) {
    const completedPayments = mockPayments.filter((p) => p.status === 'completed');
    const totalRevenue = completedPayments.reduce((sum, p) => sum + p.amount, 0);

    // 今月 (2026-02) のデータ
    const currentMonth = '2026-02';
    const previousMonth = '2026-01';

    const currentMonthReservations = mockReservations.filter((r) =>
      r.created_at.startsWith(currentMonth)
    );
    const previousMonthReservations = mockReservations.filter((r) =>
      r.created_at.startsWith(previousMonth)
    );

    const currentMonthRevenue = mockPayments
      .filter((p) => p.status === 'completed' && p.created_at.startsWith(currentMonth))
      .reduce((sum, p) => sum + p.amount, 0);
    const previousMonthRevenue = mockPayments
      .filter((p) => p.status === 'completed' && p.created_at.startsWith(previousMonth))
      .reduce((sum, p) => sum + p.amount, 0);

    const activeVendors = mockVendors.filter((v) => v.is_active && v.is_approved).length;
    const totalUsers = mockUsers.length;
    const activeBikes = mockBikes.filter((b) => b.is_available).length;

    const ratings = mockReviews.map((r) => r.rating);
    const avgRating =
      ratings.length > 0
        ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10
        : 0;

    // 変化率の計算
    const calcChange = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return Math.round(((current - previous) / previous) * 100 * 10) / 10;
    };

    return NextResponse.json({
      data: {
        total_reservations: mockReservations.length,
        monthly_reservations: currentMonthReservations.length,
        monthly_revenue: currentMonthRevenue,
        total_revenue: totalRevenue,
        active_vendors: activeVendors,
        total_users: totalUsers,
        active_bikes: activeBikes,
        avg_rating: avgRating,
        changes: {
          reservations: calcChange(
            currentMonthReservations.length,
            previousMonthReservations.length
          ),
          revenue: calcChange(currentMonthRevenue, previousMonthRevenue),
          vendors: 0,
          users: 5.2,
        },
      },
      message: 'OK',
    });
  }

  return NextResponse.json({ data: {}, message: 'Production mode not configured' });
}

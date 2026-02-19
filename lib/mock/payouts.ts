import type { PayoutStatus } from '@/types/database';

export interface MockPayout {
  id: string;
  vendor_id: string;
  period_start: string;
  period_end: string;
  gross_amount: number;
  commission_amount: number;
  net_amount: number;
  status: PayoutStatus;
  paid_at: string | null;
  created_at: string;
}

export const mockPayouts: MockPayout[] = [
  {
    id: 'payout-001',
    vendor_id: 'v-001',
    period_start: '2026-01-01',
    period_end: '2026-01-31',
    gross_amount: 45800,
    commission_amount: 4580,
    net_amount: 41220,
    status: 'completed',
    paid_at: '2026-02-03T03:00:00',
    created_at: '2026-02-01T03:00:00',
  },
  {
    id: 'payout-002',
    vendor_id: 'v-002',
    period_start: '2026-01-01',
    period_end: '2026-01-31',
    gross_amount: 67000,
    commission_amount: 6700,
    net_amount: 60300,
    status: 'completed',
    paid_at: '2026-02-03T03:00:00',
    created_at: '2026-02-01T03:00:00',
  },
  {
    id: 'payout-003',
    vendor_id: 'v-003',
    period_start: '2026-01-01',
    period_end: '2026-01-31',
    gross_amount: 33000,
    commission_amount: 3300,
    net_amount: 29700,
    status: 'pending',
    paid_at: null,
    created_at: '2026-02-01T03:00:00',
  },
];

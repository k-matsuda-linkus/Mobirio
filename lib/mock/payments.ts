import type { PaymentStatus } from '@/types/database';
import type { PaymentType } from './reservations';

export interface MockPayment {
  id: string;
  reservation_id: string;
  vendor_id: string;
  /** 決済手段の種別 */
  payment_type: PaymentType;
  /** 外部決済ID（EC/現地クレカの場合） */
  square_payment_id: string | null;
  amount: number;
  currency: string;
  status: PaymentStatus;
  refund_amount: number | null;
  /** 備考（追加オプション等の説明） */
  note: string | null;
  created_at: string;
  updated_at: string;
}

export const mockPayments: MockPayment[] = [
  // rsv-001: EC決済のみ（¥6,000）
  {
    id: 'pay-001',
    reservation_id: 'rsv-001',
    vendor_id: 'v-002',
    payment_type: 'ec_credit',
    square_payment_id: 'sq-sandbox-001',
    amount: 6000,
    currency: 'JPY',
    status: 'completed',
    refund_amount: null,
    note: null,
    created_at: '2026-01-28T10:00:00',
    updated_at: '2026-01-28T10:00:00',
  },

  // rsv-002: EC決済（事前¥19,000）+ 現地現金追加（当日追加オプション¥2,000）
  {
    id: 'pay-002a',
    reservation_id: 'rsv-002',
    vendor_id: 'v-002',
    payment_type: 'ec_credit',
    square_payment_id: 'sq-sandbox-002',
    amount: 19000,
    currency: 'JPY',
    status: 'completed',
    refund_amount: null,
    note: '事前決済（基本料金+CDW+NOC）',
    created_at: '2026-01-15T09:30:00',
    updated_at: '2026-01-15T09:30:00',
  },
  {
    id: 'pay-002b',
    reservation_id: 'rsv-002',
    vendor_id: 'v-002',
    payment_type: 'onsite_cash',
    square_payment_id: null,
    amount: 2000,
    currency: 'JPY',
    status: 'completed',
    refund_amount: null,
    note: '当日追加オプション（ETC車載器レンタル）',
    created_at: '2026-01-20T09:15:00',
    updated_at: '2026-01-20T09:15:00',
  },

  // rsv-003: 現地現金決済のみ（利用中のため未決済）
  {
    id: 'pay-003',
    reservation_id: 'rsv-003',
    vendor_id: 'v-001',
    payment_type: 'onsite_cash',
    square_payment_id: null,
    amount: 15800,
    currency: 'JPY',
    status: 'pending',
    refund_amount: null,
    note: '返却時現金精算予定',
    created_at: '2026-02-01T11:00:00',
    updated_at: '2026-02-01T11:00:00',
  },

  // rsv-004: EC決済（事前¥12,900）+ 現地クレカ追加（¥1,500）
  {
    id: 'pay-004a',
    reservation_id: 'rsv-004',
    vendor_id: 'v-003',
    payment_type: 'ec_credit',
    square_payment_id: 'sq-sandbox-004',
    amount: 12900,
    currency: 'JPY',
    status: 'completed',
    refund_amount: null,
    note: '事前決済（基本料金+CDW+NOC）',
    created_at: '2026-02-02T14:00:00',
    updated_at: '2026-02-02T14:00:00',
  },
  {
    id: 'pay-004b',
    reservation_id: 'rsv-004',
    vendor_id: 'v-003',
    payment_type: 'onsite_credit',
    square_payment_id: null,
    amount: 1500,
    currency: 'JPY',
    status: 'pending',
    refund_amount: null,
    note: '当日追加オプション（グローブレンタル）',
    created_at: '2026-02-15T09:10:00',
    updated_at: '2026-02-15T09:10:00',
  },

  // rsv-005: EC決済のみ → 全額返金
  {
    id: 'pay-005',
    reservation_id: 'rsv-005',
    vendor_id: 'v-001',
    payment_type: 'ec_credit',
    square_payment_id: 'sq-sandbox-005',
    amount: 1500,
    currency: 'JPY',
    status: 'refunded',
    refund_amount: 1500,
    note: 'キャンセルによる全額返金',
    created_at: '2026-01-05T08:00:00',
    updated_at: '2026-01-10T10:00:00',
  },

  // rsv-006: 現地クレカ決済のみ
  {
    id: 'pay-006',
    reservation_id: 'rsv-006',
    vendor_id: 'v-003',
    payment_type: 'onsite_credit',
    square_payment_id: 'sq-sandbox-006',
    amount: 18600,
    currency: 'JPY',
    status: 'completed',
    refund_amount: null,
    note: null,
    created_at: '2026-01-20T09:00:00',
    updated_at: '2026-01-20T09:00:00',
  },

  // rsv-007: 現地現金（¥10,000）+ 現地クレカ（¥5,000）
  {
    id: 'pay-007a',
    reservation_id: 'rsv-007',
    vendor_id: 'v-004',
    payment_type: 'onsite_cash',
    square_payment_id: null,
    amount: 10000,
    currency: 'JPY',
    status: 'completed',
    refund_amount: null,
    note: '現金支払い分',
    created_at: '2026-02-12T09:05:00',
    updated_at: '2026-02-12T09:05:00',
  },
  {
    id: 'pay-007b',
    reservation_id: 'rsv-007',
    vendor_id: 'v-004',
    payment_type: 'onsite_credit',
    square_payment_id: 'sq-sandbox-007',
    amount: 5000,
    currency: 'JPY',
    status: 'completed',
    refund_amount: null,
    note: 'クレジットカード支払い分',
    created_at: '2026-02-12T09:05:00',
    updated_at: '2026-02-12T09:05:00',
  },
];

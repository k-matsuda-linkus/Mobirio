export type ReservationStatus = 'pending' | 'confirmed' | 'in_use' | 'completed' | 'cancelled' | 'no_show';

/** 決済手段の種別 */
export type PaymentType = 'ec_credit' | 'onsite_cash' | 'onsite_credit';

/** 予約全体の決済状況 */
export type PaymentSettlement = 'unpaid' | 'partial' | 'paid' | 'refunded';

export const PAYMENT_TYPE_LABELS: Record<PaymentType, string> = {
  ec_credit: 'EC決済',
  onsite_cash: '現地現金',
  onsite_credit: '現地クレカ',
};

export const PAYMENT_SETTLEMENT_LABELS: Record<PaymentSettlement, string> = {
  unpaid: '未決済',
  partial: '一部決済',
  paid: '決済済',
  refunded: '返金済',
};

export interface Reservation {
  id: string;
  user_id: string;
  bike_id: string;
  vendor_id: string;
  bikeName: string;
  vendorName: string;
  start_datetime: string;
  end_datetime: string;
  rental_duration: string;
  status: ReservationStatus;
  /** この予約で使われた決済手段（複数可） */
  payment_types: PaymentType[];
  /** 予約全体の決済状況 */
  payment_settlement: PaymentSettlement;
  base_amount: number;
  option_amount: number;
  cdw_amount: number;
  noc_amount: number;
  insurance_amount: number;
  total_amount: number;
  created_at: string;
}

export const mockReservations: Reservation[] = [
  {
    // パターン1: EC決済のみ（125cc → 二輪）
    id: 'rsv-001',
    user_id: 'user-001',
    bike_id: 'bike-003',
    vendor_id: 'v-002',
    bikeName: 'PCX 125',
    vendorName: '青島バイクレンタル',
    start_datetime: '2026-02-10T09:00',
    end_datetime: '2026-02-10T18:00',
    rental_duration: '1day',
    status: 'confirmed',
    payment_types: ['ec_credit'],
    payment_settlement: 'paid',
    base_amount: 5000,
    option_amount: 0,
    cdw_amount: 1000,
    noc_amount: 0,
    insurance_amount: 800,
    total_amount: 6800,
    created_at: '2026-01-28',
  },
  {
    // パターン4: EC決済（事前）+ 現地現金追加（MT-25 = 250cc → 二輪、2日）
    id: 'rsv-002',
    user_id: 'user-001',
    bike_id: 'bike-004',
    vendor_id: 'v-002',
    bikeName: 'MT-25',
    vendorName: '青島バイクレンタル',
    start_datetime: '2026-01-20T09:00',
    end_datetime: '2026-01-21T18:00',
    rental_duration: '32h',
    status: 'completed',
    payment_types: ['ec_credit', 'onsite_cash'],
    payment_settlement: 'paid',
    base_amount: 16500,
    option_amount: 2000,
    cdw_amount: 2000,
    noc_amount: 500,
    insurance_amount: 1600,
    total_amount: 22600,
    created_at: '2026-01-15',
  },
  {
    // パターン2: 現地現金決済のみ（MT-09 SP = 950cc → 二輪、1日）
    id: 'rsv-003',
    user_id: 'user-002',
    bike_id: 'bike-006',
    vendor_id: 'v-001',
    bikeName: 'MT-09 SP',
    vendorName: 'サンシャインモータース宮崎',
    start_datetime: '2026-02-05T10:00',
    end_datetime: '2026-02-05T14:00',
    rental_duration: '4h',
    status: 'in_use',
    payment_types: ['onsite_cash'],
    payment_settlement: 'unpaid',
    base_amount: 12800,
    option_amount: 0,
    cdw_amount: 3000,
    noc_amount: 0,
    insurance_amount: 800,
    total_amount: 16600,
    created_at: '2026-02-01',
  },
  {
    // パターン5: EC決済（事前）+ 現地クレカ追加 → 全額決済済み（Ninja 400 → 二輪、1日）
    id: 'rsv-004',
    user_id: 'user-003',
    bike_id: 'bike-005',
    vendor_id: 'v-003',
    bikeName: 'Ninja 400',
    vendorName: '日南モーターサイクル',
    start_datetime: '2026-02-15T09:00',
    end_datetime: '2026-02-15T18:00',
    rental_duration: '1day',
    status: 'pending',
    payment_types: ['ec_credit', 'onsite_credit'],
    payment_settlement: 'paid',
    base_amount: 10900,
    option_amount: 1000,
    cdw_amount: 2000,
    noc_amount: 500,
    insurance_amount: 800,
    total_amount: 15200,
    created_at: '2026-02-02',
  },
  {
    // パターン1: EC決済のみ → 返金（BENLY e: = EV → 原付、1日）
    id: 'rsv-005',
    user_id: 'user-001',
    bike_id: 'bike-001',
    vendor_id: 'v-001',
    bikeName: 'BENLY e:',
    vendorName: 'サンシャインモータース宮崎',
    start_datetime: '2026-01-10T09:00',
    end_datetime: '2026-01-10T11:00',
    rental_duration: '2h',
    status: 'cancelled',
    payment_types: ['ec_credit'],
    payment_settlement: 'refunded',
    base_amount: 1500,
    option_amount: 0,
    cdw_amount: 0,
    noc_amount: 0,
    insurance_amount: 500,
    total_amount: 2000,
    created_at: '2026-01-05',
  },
  {
    // パターン3: 現地クレカ決済のみ（Z H2 = 1000cc → 二輪、1日）
    id: 'rsv-006',
    user_id: 'user-002',
    bike_id: 'bike-007',
    vendor_id: 'v-003',
    bikeName: 'Z H2',
    vendorName: '日南モーターサイクル',
    start_datetime: '2026-01-25T09:00',
    end_datetime: '2026-01-25T18:00',
    rental_duration: '1day',
    status: 'no_show',
    payment_types: ['onsite_credit'],
    payment_settlement: 'paid',
    base_amount: 15600,
    option_amount: 0,
    cdw_amount: 3000,
    noc_amount: 0,
    insurance_amount: 800,
    total_amount: 19400,
    created_at: '2026-01-20',
  },
  {
    // パターン6: 現地現金 + 現地クレカ（CBR650R = 650cc → 二輪、1日）
    id: 'rsv-007',
    user_id: 'user-003',
    bike_id: 'bike-002',
    vendor_id: 'v-004',
    bikeName: 'CBR650R',
    vendorName: '博多バイクステーション',
    start_datetime: '2026-02-12T09:00',
    end_datetime: '2026-02-12T18:00',
    rental_duration: '1day',
    status: 'completed',
    payment_types: ['onsite_cash', 'onsite_credit'],
    payment_settlement: 'paid',
    base_amount: 11000,
    option_amount: 1500,
    cdw_amount: 2000,
    noc_amount: 500,
    insurance_amount: 800,
    total_amount: 15800,
    created_at: '2026-02-08',
  },
];

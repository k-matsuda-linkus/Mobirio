export interface MockMessage {
  id: string;
  sender_id: string;
  receiver_id: string;
  reservation_id: string | null;
  subject: string | null;
  body: string;
  is_read: boolean;
  created_at: string;
}

export const mockMessages: MockMessage[] = [
  {
    id: 'msg-001',
    sender_id: 'user-001',
    receiver_id: 'vendor-user-001',
    reservation_id: 'rsv-001',
    subject: 'PCX 125の装備について',
    body: '予約しているPCX 125にトップケースは付いていますか？荷物が多いので確認したいです。',
    is_read: true,
    created_at: '2026-01-29T10:00:00',
  },
  {
    id: 'msg-002',
    sender_id: 'vendor-user-001',
    receiver_id: 'user-001',
    reservation_id: 'rsv-001',
    subject: 'Re: PCX 125の装備について',
    body: '田中様、トップケース（30L）が標準装備されています。ご安心ください。',
    is_read: true,
    created_at: '2026-01-29T11:30:00',
  },
  {
    id: 'msg-003',
    sender_id: 'user-002',
    receiver_id: 'vendor-user-001',
    reservation_id: 'rsv-003',
    subject: '受け取り場所の確認',
    body: '明日のMT-09 SPの受け取りですが、店舗の場所がわからないので目印を教えていただけますか？',
    is_read: false,
    created_at: '2026-02-04T18:00:00',
  },
  {
    id: 'msg-004',
    sender_id: 'user-003',
    receiver_id: 'vendor-user-001',
    reservation_id: null,
    subject: '長期レンタルについて',
    body: '1週間のレンタルを検討しています。長期割引はありますか？',
    is_read: false,
    created_at: '2026-02-14T09:00:00',
  },
];

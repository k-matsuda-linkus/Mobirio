export interface Notification {
  id: string;
  title: string;
  body: string;
  timestamp: string;
  is_read: boolean;
  type: 'reservation' | 'system' | 'promotion' | 'review';
}

export const mockNotifications: Notification[] = [
  { id: 'notif-001', title: '予約が確定しました', body: 'Honda PCX 160 の予約（2/10〜2/12）が確定されました。', timestamp: '2026-01-28 14:30', is_read: false, type: 'reservation' },
  { id: 'notif-002', title: '新しいキャンペーン', body: '冬季限定20%OFFキャンペーン実施中！対象店舗をチェック。', timestamp: '2026-01-25 10:00', is_read: false, type: 'promotion' },
  { id: 'notif-003', title: 'レビューのお願い', body: 'Kawasaki Z400 のご利用ありがとうございました。レビューをお書きください。', timestamp: '2026-01-08 09:00', is_read: true, type: 'review' },
  { id: 'notif-004', title: 'システムメンテナンスのお知らせ', body: '2/5 深夜2:00〜4:00にメンテナンスを実施します。', timestamp: '2026-01-20 12:00', is_read: true, type: 'system' },
  { id: 'notif-005', title: '予約リマインダー', body: 'Yamaha NMAX 155 のご予約日が近づいています（2/15）。', timestamp: '2026-02-01 08:00', is_read: false, type: 'reservation' },
];

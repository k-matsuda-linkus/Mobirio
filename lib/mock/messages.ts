export interface MockMessage {
  id: string;
  sender_id: string;
  receiver_id: string;
  reservation_id: string | null;
  body: string;
  is_read: boolean;
  created_at: string;
}

export const mockMessages: MockMessage[] = [
  {
    id: "msg-001",
    sender_id: "vendor-user-001",
    receiver_id: "user-001",
    reservation_id: "rsv-001",
    body: "ご予約ありがとうございます。当日は店舗にて受付をお済ませください。",
    is_read: true,
    created_at: "2026-01-29T10:00:00Z",
  },
  {
    id: "msg-002",
    sender_id: "user-001",
    receiver_id: "vendor-user-001",
    reservation_id: "rsv-001",
    body: "ありがとうございます。駐車場の場所を教えてください。",
    is_read: true,
    created_at: "2026-01-29T11:30:00Z",
  },
  {
    id: "msg-003",
    sender_id: "vendor-user-001",
    receiver_id: "user-001",
    reservation_id: "rsv-001",
    body: "店舗正面に専用駐車場がございます。看板が目印です。",
    is_read: false,
    created_at: "2026-01-29T12:00:00Z",
  },
  {
    id: "msg-004",
    sender_id: "user-002",
    receiver_id: "vendor-user-001",
    reservation_id: "rsv-003",
    body: "MT-09 SPの返却時間を1時間延長したいのですが可能でしょうか？",
    is_read: true,
    created_at: "2026-02-05T13:00:00Z",
  },
  {
    id: "msg-005",
    sender_id: "vendor-user-001",
    receiver_id: "user-002",
    reservation_id: "rsv-003",
    body: "1時間延長で承りました。超過料金は返却時にお支払いください。",
    is_read: false,
    created_at: "2026-02-05T13:15:00Z",
  },
];

export interface MockInquiry {
  id: string;
  vendor_id: string | null;
  user_id: string | null;
  name: string;
  email: string;
  phone: string | null;
  subject: string;
  content: string;
  reply: string | null;
  status: 'new' | 'in_progress' | 'resolved' | 'closed';
  created_at: string;
  replied_at: string | null;
}

export const mockInquiries: MockInquiry[] = [
  {
    id: 'inq-001',
    vendor_id: null,
    user_id: 'user-001',
    name: '田中太郎',
    email: 'tanaka@example.com',
    phone: '090-1234-5678',
    subject: '予約のキャンセルについて',
    content: '来週のPCX125の予約をキャンセルしたいのですが、キャンセル料はどのくらいかかりますか？48時間以上前なのですが。',
    reply: '田中様、お問い合わせありがとうございます。48時間以上前のキャンセルは無料です。マイページからキャンセル操作をお願いいたします。',
    status: 'resolved',
    created_at: '2026-01-25T10:00:00',
    replied_at: '2026-01-25T14:00:00',
  },
  {
    id: 'inq-002',
    vendor_id: 'v-002',
    user_id: 'user-002',
    name: '鈴木花子',
    email: 'suzuki@example.com',
    phone: '080-2345-6789',
    subject: 'ヘルメットのレンタルについて',
    content: 'バイクと一緒にヘルメットをレンタルすることは可能でしょうか？サイズはMサイズ希望です。',
    reply: null,
    status: 'new',
    created_at: '2026-02-10T15:30:00',
    replied_at: null,
  },
  {
    id: 'inq-003',
    vendor_id: null,
    user_id: null,
    name: '佐藤次郎',
    email: 'sato@example.com',
    phone: null,
    subject: 'ベンダー登録について',
    content: '宮崎市内でバイクレンタルショップを経営しております。Mobirioへのベンダー登録の流れを教えてください。',
    reply: null,
    status: 'in_progress',
    created_at: '2026-02-12T09:00:00',
    replied_at: null,
  },
  {
    id: 'inq-004',
    vendor_id: 'v-001',
    user_id: 'user-003',
    name: '山田一郎',
    email: 'yamada@example.com',
    phone: '070-3456-7890',
    subject: '返却時間の延長について',
    content: '本日18時返却予定ですが、20時まで延長できますでしょうか？超過料金をお支払いします。',
    reply: '山田様、延長可能です。超過料金は1時間あたりの超過料金×2時間分となります。お気をつけてお戻りください。',
    status: 'resolved',
    created_at: '2026-02-05T16:00:00',
    replied_at: '2026-02-05T16:30:00',
  },
  {
    id: 'inq-005',
    vendor_id: null,
    user_id: null,
    name: '木村美咲',
    email: 'kimura@example.com',
    phone: '090-5678-9012',
    subject: '初めてバイクをレンタルする場合',
    content: 'バイクのレンタルが初めてなのですが、何か必要な持ち物や注意事項はありますか？免許証は必要ですか？',
    reply: null,
    status: 'new',
    created_at: '2026-02-15T11:00:00',
    replied_at: null,
  },
];

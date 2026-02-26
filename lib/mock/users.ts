export interface MockUser {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  role: 'customer' | 'vendor' | 'admin';
  is_banned: boolean;
  created_at: string;
  updated_at: string;
}

export const mockUsers: MockUser[] = [
  {
    id: 'user-001',
    email: 'tanaka@example.com',
    full_name: '田中太郎',
    phone: '090-1234-5678',
    role: 'customer',
    is_banned: false,
    created_at: '2025-06-15',
    updated_at: '2025-06-15',
  },
  {
    id: 'user-002',
    email: 'suzuki@example.com',
    full_name: '鈴木花子',
    phone: '080-2345-6789',
    role: 'customer',
    is_banned: false,
    created_at: '2025-07-20',
    updated_at: '2025-07-20',
  },
  {
    id: 'user-003',
    email: 'yamada@example.com',
    full_name: '山田一郎',
    phone: '070-3456-7890',
    role: 'customer',
    is_banned: false,
    created_at: '2025-08-10',
    updated_at: '2025-08-10',
  },
  {
    id: 'vendor-user-001',
    email: 'vendor@sunshine-motors.jp',
    full_name: '佐藤健太',
    phone: '0985-12-3456',
    role: 'vendor',
    is_banned: false,
    created_at: '2025-05-01',
    updated_at: '2025-05-01',
  },
  {
    id: 'admin-001',
    email: 'admin@mobirio.jp',
    full_name: '管理者',
    phone: null,
    role: 'admin',
    is_banned: false,
    created_at: '2025-01-01',
    updated_at: '2025-01-01',
  },
];

export const mockUser = mockUsers[0];

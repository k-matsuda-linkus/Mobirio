-- contact_inquiries テーブル: サイト全体の問い合わせ管理
CREATE TABLE IF NOT EXISTS public.contact_inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  subject TEXT NOT NULL,
  content TEXT NOT NULL,
  reply TEXT,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'in_progress', 'resolved', 'closed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  replied_at TIMESTAMPTZ
);

-- RLS有効化（service_roleのみアクセス）
ALTER TABLE public.contact_inquiries ENABLE ROW LEVEL SECURITY;

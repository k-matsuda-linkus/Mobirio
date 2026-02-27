-- admins テーブル: 管理者ロール管理
CREATE TABLE IF NOT EXISTS public.admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('super_admin', 'admin', 'moderator')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS有効化（service_roleのみアクセス）
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

-- updated_at 自動更新トリガー
CREATE OR REPLACE FUNCTION update_admins_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER admins_updated_at
  BEFORE UPDATE ON public.admins
  FOR EACH ROW EXECUTE FUNCTION update_admins_updated_at();

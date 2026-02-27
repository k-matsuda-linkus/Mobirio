-- ============================================================================
-- 重複防止インデックス + banned_users テーブル
-- ============================================================================

-- 重複防止ユニークインデックス
CREATE UNIQUE INDEX IF NOT EXISTS idx_favorites_user_bike ON public.favorites(user_id, bike_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_reviews_user_bike ON public.reviews(user_id, bike_id);

-- BAN 再登録防止テーブル
CREATE TABLE IF NOT EXISTS public.banned_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  reason TEXT,
  banned_by UUID REFERENCES public.admins(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_banned_users_email ON public.banned_users(email);

-- service_role のみアクセス可（ポリシーなし = anon/authenticated は全拒否）
ALTER TABLE public.banned_users ENABLE ROW LEVEL SECURITY;

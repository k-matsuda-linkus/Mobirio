-- ==========================================
-- 任意保険料金設定 + system_settings テーブル
-- 2026-02-18
-- ==========================================

-- ==========================================
-- 1. システム設定テーブル（汎用キーバリュー）
-- ==========================================
CREATE TABLE IF NOT EXISTS public.system_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- admin のみ読み書き可（service_role は RLS を bypass）
CREATE POLICY "system_settings_admin_read" ON public.system_settings
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_profiles.id = auth.uid() AND user_profiles.role = 'admin'
    )
  );

CREATE POLICY "system_settings_admin_write" ON public.system_settings
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_profiles.id = auth.uid() AND user_profiles.role = 'admin'
    )
  );

-- ==========================================
-- 2. 任意保険料金の初期値を投入
-- ==========================================
INSERT INTO public.system_settings (key, value, description) VALUES
  ('insurance_rate_motorcycle', '800', '任意保険料金（二輪）1日あたり'),
  ('insurance_rate_moped', '500', '任意保険料金（原付）1日あたり')
ON CONFLICT (key) DO NOTHING;

-- ==========================================
-- 3. reservations に insurance_amount カラム追加
-- ==========================================
ALTER TABLE public.reservations
  ADD COLUMN IF NOT EXISTS insurance_amount INTEGER NOT NULL DEFAULT 0;

-- total_amount の再計算は既存レコードでは不要（全て 0 で追加）

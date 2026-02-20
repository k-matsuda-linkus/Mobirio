-- ============================================================
-- クーポン管理テーブル
-- ============================================================

-- 1. coupons テーブル
CREATE TABLE IF NOT EXISTS public.coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('fixed', 'percentage')),
  discount_value NUMERIC NOT NULL CHECK (discount_value > 0),
  max_discount NUMERIC,            -- 定率時の上限額（NULLなら上限なし）
  min_order_amount NUMERIC DEFAULT 0,
  usage_limit INTEGER,             -- 全体の使用上限（NULLなら無制限）
  usage_count INTEGER NOT NULL DEFAULT 0,
  per_user_limit INTEGER DEFAULT 1,
  valid_from TIMESTAMPTZ,
  valid_until TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  target_bike_ids UUID[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT coupons_vendor_code_unique UNIQUE (vendor_id, code)
);

-- インデックス
CREATE INDEX idx_coupons_vendor_id ON public.coupons(vendor_id);
CREATE INDEX idx_coupons_code ON public.coupons(code);
CREATE INDEX idx_coupons_valid_period ON public.coupons(valid_from, valid_until);

-- 2. coupon_usages テーブル
CREATE TABLE IF NOT EXISTS public.coupon_usages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id UUID NOT NULL REFERENCES public.coupons(id) ON DELETE CASCADE,
  reservation_id UUID NOT NULL REFERENCES public.reservations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  discount_amount NUMERIC NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_coupon_usages_coupon_id ON public.coupon_usages(coupon_id);
CREATE INDEX idx_coupon_usages_user_id ON public.coupon_usages(user_id);
CREATE INDEX idx_coupon_usages_reservation_id ON public.coupon_usages(reservation_id);

-- 3. reservations に coupon_id カラム追加
ALTER TABLE public.reservations
  ADD COLUMN IF NOT EXISTS coupon_id UUID REFERENCES public.coupons(id);

-- ============================================================
-- RLS
-- ============================================================

ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupon_usages ENABLE ROW LEVEL SECURITY;

-- coupons: ベンダーは自身のクーポンのみ操作可能
CREATE POLICY "Vendors can manage own coupons"
  ON public.coupons
  FOR ALL
  USING (vendor_id IN (
    SELECT id FROM public.vendors WHERE user_id = auth.uid()
  ))
  WITH CHECK (vendor_id IN (
    SELECT id FROM public.vendors WHERE user_id = auth.uid()
  ));

-- coupons: 有効なクーポンは誰でも参照可能（検証用）
CREATE POLICY "Anyone can read active coupons"
  ON public.coupons
  FOR SELECT
  USING (is_active = true);

-- coupon_usages: ベンダーは自身のクーポン使用履歴を参照可能
CREATE POLICY "Vendors can read own coupon usages"
  ON public.coupon_usages
  FOR SELECT
  USING (coupon_id IN (
    SELECT id FROM public.coupons WHERE vendor_id IN (
      SELECT id FROM public.vendors WHERE user_id = auth.uid()
    )
  ));

-- coupon_usages: 認証ユーザーは使用履歴を作成可能
CREATE POLICY "Authenticated users can insert coupon usages"
  ON public.coupon_usages
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- updated_at 自動更新トリガー（coupons用）
CREATE OR REPLACE FUNCTION update_coupons_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_coupons_updated_at
  BEFORE UPDATE ON public.coupons
  FOR EACH ROW
  EXECUTE FUNCTION update_coupons_updated_at();

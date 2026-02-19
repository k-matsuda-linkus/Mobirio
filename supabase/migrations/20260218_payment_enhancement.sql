-- ==========================================
-- 決済機能拡張マイグレーション
-- 2026-02-18
-- ==========================================
-- 変更内容:
--   1. payment_type ENUM 追加（ec_credit / onsite_cash / onsite_credit）
--   2. payment_settlement ENUM 追加（unpaid / partial / paid / refunded）
--   3. payments テーブルに payment_type, note, refund_amount カラム追加
--   4. reservations テーブルに payment_settlement カラム追加
--   5. reservations.payment_id（単一参照）を削除（payments.reservation_id で1:N対応済み）
--   6. payment_status ENUM に partially_refunded を追加
--   7. reservation_status ENUM に in_use, no_show を追加
-- ==========================================

-- ==========================================
-- ENUM型の追加・拡張
-- ==========================================

-- 決済手段の種別
CREATE TYPE payment_type AS ENUM ('ec_credit', 'onsite_cash', 'onsite_credit');

-- 予約全体の決済状況
CREATE TYPE payment_settlement AS ENUM ('unpaid', 'partial', 'paid', 'refunded');

-- payment_status に partially_refunded を追加
ALTER TYPE payment_status ADD VALUE IF NOT EXISTS 'partially_refunded';

-- reservation_status に in_use, no_show を追加
ALTER TYPE reservation_status ADD VALUE IF NOT EXISTS 'in_use';
ALTER TYPE reservation_status ADD VALUE IF NOT EXISTS 'no_show';

-- ==========================================
-- payments テーブルの拡張
-- ==========================================

-- 決済手段（EC決済 / 現地現金 / 現地クレカ）
ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS payment_type payment_type NOT NULL DEFAULT 'ec_credit';

-- 返金額（一部返金にも対応）
ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS refund_amount INTEGER DEFAULT 0;

-- 備考（ベンダーが記録時に入力）
ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS note TEXT;

-- ==========================================
-- reservations テーブルの拡張
-- ==========================================

-- 予約全体の決済状況
ALTER TABLE public.reservations
  ADD COLUMN IF NOT EXISTS payment_settlement payment_settlement NOT NULL DEFAULT 'unpaid';

-- option_amount カラム追加（既存スキーマに不足）
ALTER TABLE public.reservations
  ADD COLUMN IF NOT EXISTS option_amount INTEGER DEFAULT 0;

-- payment_id（単一参照）の削除
-- payments.reservation_id で1:N対応済みのため不要
ALTER TABLE public.reservations
  DROP COLUMN IF EXISTS payment_id;

-- ==========================================
-- インデックス追加
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_payments_payment_type ON payments(payment_type);
CREATE INDEX IF NOT EXISTS idx_reservations_payment_settlement ON reservations(payment_settlement);

-- ==========================================
-- payment_settlement 自動更新関数
-- ==========================================
-- 決済レコードの挿入・更新時に、紐づく予約の payment_settlement を自動計算する
CREATE OR REPLACE FUNCTION update_reservation_payment_settlement()
RETURNS TRIGGER AS $$
DECLARE
  v_reservation_id UUID;
  v_total_amount INTEGER;
  v_paid_total INTEGER;
  v_refund_total INTEGER;
  v_net_paid INTEGER;
BEGIN
  -- 対象の reservation_id を特定
  IF TG_OP = 'DELETE' THEN
    v_reservation_id := OLD.reservation_id;
  ELSE
    v_reservation_id := NEW.reservation_id;
  END IF;

  -- 予約の合計金額を取得
  SELECT total_amount INTO v_total_amount
  FROM reservations WHERE id = v_reservation_id;

  -- completed な決済の合計を算出
  SELECT COALESCE(SUM(amount), 0) INTO v_paid_total
  FROM payments
  WHERE reservation_id = v_reservation_id
    AND status = 'completed';

  -- 返金合計を算出
  SELECT COALESCE(SUM(refund_amount), 0) INTO v_refund_total
  FROM payments
  WHERE reservation_id = v_reservation_id
    AND refund_amount > 0;

  v_net_paid := v_paid_total - v_refund_total;

  -- 決済状況を判定
  UPDATE reservations
  SET payment_settlement = CASE
    WHEN v_refund_total > 0 AND v_net_paid <= 0 THEN 'refunded'::payment_settlement
    WHEN v_net_paid <= 0 THEN 'unpaid'::payment_settlement
    WHEN v_net_paid >= v_total_amount THEN 'paid'::payment_settlement
    ELSE 'partial'::payment_settlement
  END
  WHERE id = v_reservation_id;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- トリガー設定
DROP TRIGGER IF EXISTS trg_update_payment_settlement ON payments;
CREATE TRIGGER trg_update_payment_settlement
  AFTER INSERT OR UPDATE OR DELETE ON payments
  FOR EACH ROW
  EXECUTE FUNCTION update_reservation_payment_settlement();

-- ==========================================
-- payments テーブルの RLS ポリシー追加
-- ==========================================
-- ベンダーが現地決済を記録できるようにする
CREATE POLICY "Vendors can insert payments for own reservations"
  ON payments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM vendors
      WHERE vendors.id = payments.vendor_id
      AND vendors.user_id = auth.uid()
    )
  );

-- ベンダーが決済ステータスを更新できるようにする
CREATE POLICY "Vendors can update own vendor payments"
  ON payments FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM vendors
      WHERE vendors.id = payments.vendor_id
      AND vendors.user_id = auth.uid()
    )
  );

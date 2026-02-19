-- ==========================================
-- 任意保険 追加設定 + ロイヤリティ・EC決済手数料
-- 2026-02-18
-- ==========================================

-- 保険仕入（二輪 / 原付）
INSERT INTO public.system_settings (key, value, description) VALUES
  ('insurance_cost_motorcycle', '0', '保険仕入（二輪）1日あたり'),
  ('insurance_cost_moped', '0', '保険仕入（原付）1日あたり')
ON CONFLICT (key) DO NOTHING;

-- リンクス手数料（二輪 / 原付）
INSERT INTO public.system_settings (key, value, description) VALUES
  ('linkus_fee_motorcycle', '0', 'リンクス手数料（二輪）1日あたり'),
  ('linkus_fee_moped', '0', 'リンクス手数料（原付）1日あたり')
ON CONFLICT (key) DO NOTHING;

-- アディショナルワン手数料（二輪 / 原付）
INSERT INTO public.system_settings (key, value, description) VALUES
  ('additional_one_fee_motorcycle', '0', 'アディショナルワン手数料（二輪）1日あたり'),
  ('additional_one_fee_moped', '0', 'アディショナルワン手数料（原付）1日あたり')
ON CONFLICT (key) DO NOTHING;

-- ロイヤリティ（レンタルバイク / 特定小型原付）
INSERT INTO public.system_settings (key, value, description) VALUES
  ('royalty_bike_percent', '12', 'ロイヤリティ（レンタルバイクプラン）%'),
  ('royalty_moped_percent', '11', 'ロイヤリティ（特定小型原付プラン）%')
ON CONFLICT (key) DO NOTHING;

-- EC決済手数料
INSERT INTO public.system_settings (key, value, description) VALUES
  ('ec_payment_fee_percent', '3.6', 'EC決済手数料（%）')
ON CONFLICT (key) DO NOTHING;

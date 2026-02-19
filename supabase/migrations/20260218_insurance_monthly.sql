-- ==========================================
-- 任意保険: 日額 → 月額に変更 + ラベル修正
-- 2026-02-18
-- ==========================================

-- 保険請求額（ベンダー請求単価）
UPDATE public.system_settings SET description = '保険請求額（二輪）月額・台あたり' WHERE key = 'insurance_rate_motorcycle';
UPDATE public.system_settings SET description = '保険請求額（原付）月額・台あたり' WHERE key = 'insurance_rate_moped';

-- 内訳: 保険仕入［クロダ保険支払額］
UPDATE public.system_settings SET description = '保険仕入［クロダ保険支払額］（二輪）月額' WHERE key = 'insurance_cost_motorcycle';
UPDATE public.system_settings SET description = '保険仕入［クロダ保険支払額］（原付）月額' WHERE key = 'insurance_cost_moped';

-- 内訳: リンクス手数料
UPDATE public.system_settings SET description = 'リンクス手数料（二輪）月額' WHERE key = 'linkus_fee_motorcycle';
UPDATE public.system_settings SET description = 'リンクス手数料（原付）月額' WHERE key = 'linkus_fee_moped';

-- 内訳: アディショナルワン手数料
UPDATE public.system_settings SET description = 'アディショナルワン手数料（二輪）月額' WHERE key = 'additional_one_fee_motorcycle';
UPDATE public.system_settings SET description = 'アディショナルワン手数料（原付）月額' WHERE key = 'additional_one_fee_moped';

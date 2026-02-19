-- ==========================================
-- ロイヤリティ 運営3社 分配率
-- 2026-02-18
-- ==========================================

INSERT INTO public.system_settings (key, value, description) VALUES
  ('royalty_split_linkus', '50', 'ロイヤリティ分配 リンクス（%）'),
  ('royalty_split_system_dev', '35', 'ロイヤリティ分配 システム開発（%）'),
  ('royalty_split_additional_one', '15', 'ロイヤリティ分配 アディショナルワン（%）')
ON CONFLICT (key) DO NOTHING;

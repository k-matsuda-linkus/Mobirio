-- ============================================================================
-- Storage バケット作成
-- ============================================================================

-- 1. bike-images（公開読取）
INSERT INTO storage.buckets (id, name, public) VALUES ('bike-images', 'bike-images', true)
ON CONFLICT (id) DO NOTHING;

-- 2. vendor-logos（公開読取）
INSERT INTO storage.buckets (id, name, public) VALUES ('vendor-logos', 'vendor-logos', true)
ON CONFLICT (id) DO NOTHING;

-- 3. vendor-covers（公開読取）
INSERT INTO storage.buckets (id, name, public) VALUES ('vendor-covers', 'vendor-covers', true)
ON CONFLICT (id) DO NOTHING;

-- 4. user-avatars（公開読取）
INSERT INTO storage.buckets (id, name, public) VALUES ('user-avatars', 'user-avatars', true)
ON CONFLICT (id) DO NOTHING;

-- 5. contracts（認証済みのみ — 署名付きURL経由）
INSERT INTO storage.buckets (id, name, public) VALUES ('contracts', 'contracts', false)
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- Storage RLS ポリシー
-- ---------------------------------------------------------------------------

-- bike-images: 誰でも読取、ベンダーのみアップロード/削除
CREATE POLICY "bike_images_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'bike-images');

CREATE POLICY "bike_images_vendor_insert" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'bike-images'
    AND auth.uid() IS NOT NULL
    AND EXISTS (SELECT 1 FROM public.vendors WHERE user_id = auth.uid())
  );

CREATE POLICY "bike_images_vendor_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'bike-images'
    AND auth.uid() IS NOT NULL
    AND EXISTS (SELECT 1 FROM public.vendors WHERE user_id = auth.uid())
  );

-- vendor-logos: 誰でも読取、自ベンダーのみアップロード/削除
CREATE POLICY "vendor_logos_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'vendor-logos');

CREATE POLICY "vendor_logos_vendor_insert" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'vendor-logos'
    AND auth.uid() IS NOT NULL
    AND EXISTS (SELECT 1 FROM public.vendors WHERE user_id = auth.uid())
  );

CREATE POLICY "vendor_logos_vendor_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'vendor-logos'
    AND auth.uid() IS NOT NULL
    AND EXISTS (SELECT 1 FROM public.vendors WHERE user_id = auth.uid())
  );

-- vendor-covers: 誰でも読取、自ベンダーのみアップロード/削除
CREATE POLICY "vendor_covers_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'vendor-covers');

CREATE POLICY "vendor_covers_vendor_insert" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'vendor-covers'
    AND auth.uid() IS NOT NULL
    AND EXISTS (SELECT 1 FROM public.vendors WHERE user_id = auth.uid())
  );

CREATE POLICY "vendor_covers_vendor_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'vendor-covers'
    AND auth.uid() IS NOT NULL
    AND EXISTS (SELECT 1 FROM public.vendors WHERE user_id = auth.uid())
  );

-- user-avatars: 誰でも読取、自分のみアップロード/削除
CREATE POLICY "user_avatars_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'user-avatars');

CREATE POLICY "user_avatars_owner_insert" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'user-avatars'
    AND auth.uid() IS NOT NULL
  );

CREATE POLICY "user_avatars_owner_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'user-avatars'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- contracts: 認証済みユーザーのみ（署名付きURL経由）
CREATE POLICY "contracts_auth_read" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'contracts'
    AND auth.uid() IS NOT NULL
  );

CREATE POLICY "contracts_vendor_insert" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'contracts'
    AND auth.uid() IS NOT NULL
    AND EXISTS (SELECT 1 FROM public.vendors WHERE user_id = auth.uid())
  );

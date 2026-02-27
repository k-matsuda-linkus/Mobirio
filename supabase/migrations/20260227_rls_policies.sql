-- ============================================================================
-- RLS Policies — 全テーブル一括設定
-- 既にRLS有効: coupons, coupon_usages, admins, contact_inquiries, payments
-- admin操作は全て service_role 経由でRLSバイパス
-- ============================================================================

-- ヘルパー: 自分のvendor_idを取得
CREATE OR REPLACE FUNCTION public.get_my_vendor_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT id FROM public.vendors WHERE user_id = auth.uid() LIMIT 1;
$$;

-- ---------------------------------------------------------------------------
-- 1. users
-- ---------------------------------------------------------------------------
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_select_own" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "users_update_own" ON public.users
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ---------------------------------------------------------------------------
-- 2. vendors
-- ---------------------------------------------------------------------------
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "vendors_select_approved" ON public.vendors
  FOR SELECT USING (is_approved = true AND is_active = true);

CREATE POLICY "vendors_select_own" ON public.vendors
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "vendors_update_own" ON public.vendors
  FOR UPDATE USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- 3. bikes
-- ---------------------------------------------------------------------------
ALTER TABLE public.bikes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "bikes_select_published" ON public.bikes
  FOR SELECT USING (is_published = true);

CREATE POLICY "bikes_select_own_vendor" ON public.bikes
  FOR SELECT USING (vendor_id = public.get_my_vendor_id());

CREATE POLICY "bikes_insert_own_vendor" ON public.bikes
  FOR INSERT WITH CHECK (vendor_id = public.get_my_vendor_id());

CREATE POLICY "bikes_update_own_vendor" ON public.bikes
  FOR UPDATE USING (vendor_id = public.get_my_vendor_id())
  WITH CHECK (vendor_id = public.get_my_vendor_id());

CREATE POLICY "bikes_delete_own_vendor" ON public.bikes
  FOR DELETE USING (vendor_id = public.get_my_vendor_id());

-- ---------------------------------------------------------------------------
-- 4. bike_images
-- ---------------------------------------------------------------------------
ALTER TABLE public.bike_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "bike_images_select_published" ON public.bike_images
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.bikes WHERE bikes.id = bike_images.bike_id AND bikes.is_published = true
    )
  );

CREATE POLICY "bike_images_select_own_vendor" ON public.bike_images
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.bikes WHERE bikes.id = bike_images.bike_id AND bikes.vendor_id = public.get_my_vendor_id()
    )
  );

CREATE POLICY "bike_images_insert_own_vendor" ON public.bike_images
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.bikes WHERE bikes.id = bike_images.bike_id AND bikes.vendor_id = public.get_my_vendor_id()
    )
  );

CREATE POLICY "bike_images_update_own_vendor" ON public.bike_images
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.bikes WHERE bikes.id = bike_images.bike_id AND bikes.vendor_id = public.get_my_vendor_id()
    )
  );

CREATE POLICY "bike_images_delete_own_vendor" ON public.bike_images
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.bikes WHERE bikes.id = bike_images.bike_id AND bikes.vendor_id = public.get_my_vendor_id()
    )
  );

-- ---------------------------------------------------------------------------
-- 5. options
-- ---------------------------------------------------------------------------
ALTER TABLE public.options ENABLE ROW LEVEL SECURITY;

CREATE POLICY "options_select_all" ON public.options
  FOR SELECT USING (true);

CREATE POLICY "options_insert_own_vendor" ON public.options
  FOR INSERT WITH CHECK (vendor_id = public.get_my_vendor_id());

CREATE POLICY "options_update_own_vendor" ON public.options
  FOR UPDATE USING (vendor_id = public.get_my_vendor_id())
  WITH CHECK (vendor_id = public.get_my_vendor_id());

CREATE POLICY "options_delete_own_vendor" ON public.options
  FOR DELETE USING (vendor_id = public.get_my_vendor_id());

-- ---------------------------------------------------------------------------
-- 6. bike_options
-- ---------------------------------------------------------------------------
ALTER TABLE public.bike_options ENABLE ROW LEVEL SECURITY;

CREATE POLICY "bike_options_select_published" ON public.bike_options
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.bikes WHERE bikes.id = bike_options.bike_id AND bikes.is_published = true
    )
  );

CREATE POLICY "bike_options_select_own_vendor" ON public.bike_options
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.bikes WHERE bikes.id = bike_options.bike_id AND bikes.vendor_id = public.get_my_vendor_id()
    )
  );

CREATE POLICY "bike_options_insert_own_vendor" ON public.bike_options
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.bikes WHERE bikes.id = bike_options.bike_id AND bikes.vendor_id = public.get_my_vendor_id()
    )
  );

CREATE POLICY "bike_options_update_own_vendor" ON public.bike_options
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.bikes WHERE bikes.id = bike_options.bike_id AND bikes.vendor_id = public.get_my_vendor_id()
    )
  );

CREATE POLICY "bike_options_delete_own_vendor" ON public.bike_options
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.bikes WHERE bikes.id = bike_options.bike_id AND bikes.vendor_id = public.get_my_vendor_id()
    )
  );

-- ---------------------------------------------------------------------------
-- 7. pricing_rules
-- ---------------------------------------------------------------------------
ALTER TABLE public.pricing_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pricing_rules_select_all" ON public.pricing_rules
  FOR SELECT USING (true);

CREATE POLICY "pricing_rules_insert_own_vendor" ON public.pricing_rules
  FOR INSERT WITH CHECK (vendor_id = public.get_my_vendor_id());

CREATE POLICY "pricing_rules_update_own_vendor" ON public.pricing_rules
  FOR UPDATE USING (vendor_id = public.get_my_vendor_id())
  WITH CHECK (vendor_id = public.get_my_vendor_id());

CREATE POLICY "pricing_rules_delete_own_vendor" ON public.pricing_rules
  FOR DELETE USING (vendor_id = public.get_my_vendor_id());

-- ---------------------------------------------------------------------------
-- 8. reservations
-- ---------------------------------------------------------------------------
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reservations_select_own_user" ON public.reservations
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "reservations_select_own_vendor" ON public.reservations
  FOR SELECT USING (vendor_id = public.get_my_vendor_id());

CREATE POLICY "reservations_insert_auth" ON public.reservations
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND user_id = auth.uid());

CREATE POLICY "reservations_update_own_user" ON public.reservations
  FOR UPDATE USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "reservations_update_own_vendor" ON public.reservations
  FOR UPDATE USING (vendor_id = public.get_my_vendor_id())
  WITH CHECK (vendor_id = public.get_my_vendor_id());

-- ---------------------------------------------------------------------------
-- 9. reservation_options
-- ---------------------------------------------------------------------------
ALTER TABLE public.reservation_options ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reservation_options_select" ON public.reservation_options
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.reservations r
      WHERE r.id = reservation_options.reservation_id
        AND (r.user_id = auth.uid() OR r.vendor_id = public.get_my_vendor_id())
    )
  );

CREATE POLICY "reservation_options_insert_auth" ON public.reservation_options
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.reservations r
      WHERE r.id = reservation_options.reservation_id AND r.user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- 10. reviews
-- ---------------------------------------------------------------------------
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reviews_select_all" ON public.reviews
  FOR SELECT USING (true);

CREATE POLICY "reviews_insert_auth" ON public.reviews
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND user_id = auth.uid());

CREATE POLICY "reviews_update_own" ON public.reviews
  FOR UPDATE USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "reviews_delete_own" ON public.reviews
  FOR DELETE USING (user_id = auth.uid());

-- ベンダーが vendor_reply / vendor_replied_at を更新するためのポリシー
CREATE POLICY "reviews_update_vendor_reply" ON public.reviews
  FOR UPDATE USING (vendor_id = public.get_my_vendor_id())
  WITH CHECK (vendor_id = public.get_my_vendor_id());

-- ---------------------------------------------------------------------------
-- 11. shop_reviews
-- ---------------------------------------------------------------------------
ALTER TABLE public.shop_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "shop_reviews_select_all" ON public.shop_reviews
  FOR SELECT USING (true);

CREATE POLICY "shop_reviews_insert_auth" ON public.shop_reviews
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND user_id = auth.uid());

CREATE POLICY "shop_reviews_update_own" ON public.shop_reviews
  FOR UPDATE USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "shop_reviews_delete_own" ON public.shop_reviews
  FOR DELETE USING (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- 12. favorites
-- ---------------------------------------------------------------------------
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "favorites_select_own" ON public.favorites
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "favorites_insert_own" ON public.favorites
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "favorites_delete_own" ON public.favorites
  FOR DELETE USING (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- 13. messages
-- ---------------------------------------------------------------------------
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "messages_select_own" ON public.messages
  FOR SELECT USING (sender_id = auth.uid() OR receiver_id = auth.uid());

CREATE POLICY "messages_insert_auth" ON public.messages
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND sender_id = auth.uid());

-- ---------------------------------------------------------------------------
-- 14. notifications
-- ---------------------------------------------------------------------------
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notifications_select_own" ON public.notifications
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "notifications_update_own_read" ON public.notifications
  FOR UPDATE USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- 15. vendor_business_hours
-- ---------------------------------------------------------------------------
ALTER TABLE public.vendor_business_hours ENABLE ROW LEVEL SECURITY;

CREATE POLICY "vendor_business_hours_select_all" ON public.vendor_business_hours
  FOR SELECT USING (true);

CREATE POLICY "vendor_business_hours_insert_own" ON public.vendor_business_hours
  FOR INSERT WITH CHECK (vendor_id = public.get_my_vendor_id());

CREATE POLICY "vendor_business_hours_update_own" ON public.vendor_business_hours
  FOR UPDATE USING (vendor_id = public.get_my_vendor_id())
  WITH CHECK (vendor_id = public.get_my_vendor_id());

CREATE POLICY "vendor_business_hours_delete_own" ON public.vendor_business_hours
  FOR DELETE USING (vendor_id = public.get_my_vendor_id());

-- ---------------------------------------------------------------------------
-- 16. vendor_holidays
-- ---------------------------------------------------------------------------
ALTER TABLE public.vendor_holidays ENABLE ROW LEVEL SECURITY;

CREATE POLICY "vendor_holidays_select_all" ON public.vendor_holidays
  FOR SELECT USING (true);

CREATE POLICY "vendor_holidays_insert_own" ON public.vendor_holidays
  FOR INSERT WITH CHECK (vendor_id = public.get_my_vendor_id());

CREATE POLICY "vendor_holidays_update_own" ON public.vendor_holidays
  FOR UPDATE USING (vendor_id = public.get_my_vendor_id())
  WITH CHECK (vendor_id = public.get_my_vendor_id());

CREATE POLICY "vendor_holidays_delete_own" ON public.vendor_holidays
  FOR DELETE USING (vendor_id = public.get_my_vendor_id());

-- ---------------------------------------------------------------------------
-- 17. vendor_closures
-- ---------------------------------------------------------------------------
ALTER TABLE public.vendor_closures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "vendor_closures_select_all" ON public.vendor_closures
  FOR SELECT USING (true);

CREATE POLICY "vendor_closures_insert_own" ON public.vendor_closures
  FOR INSERT WITH CHECK (vendor_id = public.get_my_vendor_id());

CREATE POLICY "vendor_closures_update_own" ON public.vendor_closures
  FOR UPDATE USING (vendor_id = public.get_my_vendor_id())
  WITH CHECK (vendor_id = public.get_my_vendor_id());

CREATE POLICY "vendor_closures_delete_own" ON public.vendor_closures
  FOR DELETE USING (vendor_id = public.get_my_vendor_id());

-- ---------------------------------------------------------------------------
-- 18. vendor_announcements
-- ---------------------------------------------------------------------------
ALTER TABLE public.vendor_announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "vendor_announcements_select_all" ON public.vendor_announcements
  FOR SELECT USING (true);

CREATE POLICY "vendor_announcements_insert_own" ON public.vendor_announcements
  FOR INSERT WITH CHECK (vendor_id = public.get_my_vendor_id());

CREATE POLICY "vendor_announcements_update_own" ON public.vendor_announcements
  FOR UPDATE USING (vendor_id = public.get_my_vendor_id())
  WITH CHECK (vendor_id = public.get_my_vendor_id());

CREATE POLICY "vendor_announcements_delete_own" ON public.vendor_announcements
  FOR DELETE USING (vendor_id = public.get_my_vendor_id());

-- ---------------------------------------------------------------------------
-- 19. vendor_inquiries
-- ---------------------------------------------------------------------------
ALTER TABLE public.vendor_inquiries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "vendor_inquiries_select_own_vendor" ON public.vendor_inquiries
  FOR SELECT USING (vendor_id = public.get_my_vendor_id());

CREATE POLICY "vendor_inquiries_select_own_user" ON public.vendor_inquiries
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "vendor_inquiries_insert_auth" ON public.vendor_inquiries
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND user_id = auth.uid());

CREATE POLICY "vendor_inquiries_update_own_vendor" ON public.vendor_inquiries
  FOR UPDATE USING (vendor_id = public.get_my_vendor_id())
  WITH CHECK (vendor_id = public.get_my_vendor_id());

-- ---------------------------------------------------------------------------
-- 20. vendor_payouts
-- ---------------------------------------------------------------------------
ALTER TABLE public.vendor_payouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "vendor_payouts_select_own" ON public.vendor_payouts
  FOR SELECT USING (vendor_id = public.get_my_vendor_id());

-- ---------------------------------------------------------------------------
-- 21. page_views
-- ---------------------------------------------------------------------------
ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "page_views_insert_anon" ON public.page_views
  FOR INSERT WITH CHECK (true);

-- ---------------------------------------------------------------------------
-- 22. system_settings — service_role のみ（ポリシーなし = 全拒否）
-- ---------------------------------------------------------------------------
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

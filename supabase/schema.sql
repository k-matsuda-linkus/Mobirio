-- Miyazaki Creative Bridge レンタルバイクプラットフォーム データベーススキーマ
-- Supabase PostgreSQL用の完全なスキーマ定義

-- ==========================================
-- 1. 拡張機能の有効化
-- ==========================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==========================================
-- 2. ENUM型の定義
-- ==========================================
CREATE TYPE user_role AS ENUM ('customer', 'vendor', 'admin');
CREATE TYPE reservation_status AS ENUM ('pending', 'confirmed', 'cancelled', 'completed');
CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'failed', 'refunded');
CREATE TYPE vehicle_class AS ENUM ('ev', '50', '125', '250', '400', '950', '1100', '1500');
CREATE TYPE rental_duration AS ENUM ('2h', '4h', '1day', '24h', '32h', 'overtime', 'additional24h');

-- ==========================================
-- 3. ユーザープロファイルテーブル（auth.usersと連携）
-- ==========================================
CREATE TABLE public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  phone TEXT,
  role user_role NOT NULL DEFAULT 'customer',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==========================================
-- 4. 加盟店（ベンダー）テーブル
-- ==========================================
CREATE TABLE public.vendors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  address TEXT,
  prefecture TEXT DEFAULT '宮崎県',
  city TEXT DEFAULT '宮崎市',
  postal_code TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  contact_email TEXT NOT NULL,
  contact_phone TEXT,
  business_hours JSONB,
  -- Square連携情報
  square_merchant_id TEXT,
  square_access_token TEXT, -- 暗号化して保存（実際の実装ではSupabase Vault使用推奨）
  square_location_id TEXT,
  square_oauth_refresh_token TEXT,
  -- ステータス
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_approved BOOLEAN NOT NULL DEFAULT false,
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES auth.users(id),
  -- メタデータ
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==========================================
-- 5. 車両クラスマスタ
-- ==========================================
CREATE TABLE public.bike_classes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  class_code vehicle_class NOT NULL UNIQUE,
  class_name TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==========================================
-- 6. 料金プランマスタ
-- ==========================================
CREATE TABLE public.pricing_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  class_id UUID NOT NULL REFERENCES bike_classes(id) ON DELETE CASCADE,
  duration rental_duration NOT NULL,
  price INTEGER NOT NULL, -- 税込価格（円）
  is_available BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(class_id, duration)
);

-- ==========================================
-- 7. バイク情報テーブル
-- ==========================================
CREATE TABLE public.bikes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES bike_classes(id),
  name TEXT NOT NULL,
  model TEXT NOT NULL,
  manufacturer TEXT,
  year INTEGER,
  displacement INTEGER, -- cc
  description TEXT,
  -- 画像
  image_urls TEXT[] DEFAULT ARRAY[]::TEXT[],
  -- 料金設定（ベンダーが個別に設定可能）
  hourly_rate_2h INTEGER,
  hourly_rate_4h INTEGER,
  daily_rate_1day INTEGER,
  daily_rate_24h INTEGER,
  daily_rate_32h INTEGER,
  overtime_rate_per_hour INTEGER,
  additional_24h_rate INTEGER,
  -- ステータス
  is_available BOOLEAN NOT NULL DEFAULT true,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  -- メタデータ
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==========================================
-- 8. 予約テーブル
-- ==========================================
CREATE TABLE public.reservations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  bike_id UUID NOT NULL REFERENCES bikes(id) ON DELETE RESTRICT,
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE RESTRICT,
  -- 予約期間
  start_datetime TIMESTAMPTZ NOT NULL,
  end_datetime TIMESTAMPTZ NOT NULL,
  rental_duration rental_duration NOT NULL,
  -- 料金情報
  base_amount INTEGER NOT NULL,
  cdw_amount INTEGER DEFAULT 0, -- CDW（車両免責補償）料金
  noc_amount INTEGER DEFAULT 0, -- NOC（休車補償）料金
  total_amount INTEGER NOT NULL,
  -- ステータス
  status reservation_status NOT NULL DEFAULT 'pending',
  -- 決済情報
  payment_id UUID REFERENCES payments(id),
  -- メタデータ
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- 制約
  CONSTRAINT valid_datetime_range CHECK (end_datetime > start_datetime),
  CONSTRAINT valid_amount CHECK (total_amount >= 0)
);

-- ==========================================
-- 9. 決済テーブル
-- ==========================================
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reservation_id UUID NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE RESTRICT,
  -- Square決済情報
  square_payment_id TEXT UNIQUE,
  square_order_id TEXT,
  square_location_id TEXT,
  -- 決済金額
  amount INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'JPY',
  -- ステータス
  status payment_status NOT NULL DEFAULT 'pending',
  -- メタデータ
  square_response JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==========================================
-- 10. レビューテーブル
-- ==========================================
CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reservation_id UUID NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  bike_id UUID NOT NULL REFERENCES bikes(id) ON DELETE CASCADE,
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  -- 評価
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT,
  comment TEXT,
  -- メタデータ
  is_verified BOOLEAN NOT NULL DEFAULT false, -- 実際に利用したかどうか
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(reservation_id)
);

-- ==========================================
-- 8a. reservations テーブル追加カラム（ベンダーダッシュボード拡張）
-- ==========================================
ALTER TABLE public.reservations ADD COLUMN IF NOT EXISTS departure_mileage INTEGER;
ALTER TABLE public.reservations ADD COLUMN IF NOT EXISTS return_mileage INTEGER;
ALTER TABLE public.reservations ADD COLUMN IF NOT EXISTS memo TEXT;
ALTER TABLE public.reservations ADD COLUMN IF NOT EXISTS customer_note TEXT;
ALTER TABLE public.reservations ADD COLUMN IF NOT EXISTS contract_output_count INTEGER DEFAULT 0;
ALTER TABLE public.reservations ADD COLUMN IF NOT EXISTS contract_last_output TIMESTAMPTZ;
ALTER TABLE public.reservations ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMPTZ;
ALTER TABLE public.reservations ADD COLUMN IF NOT EXISTS confirmed_by TEXT;
ALTER TABLE public.reservations ADD COLUMN IF NOT EXISTS additional_charges JSONB;
ALTER TABLE public.reservations ADD COLUMN IF NOT EXISTS cdw_enabled BOOLEAN DEFAULT false;
ALTER TABLE public.reservations ADD COLUMN IF NOT EXISTS coupon_code TEXT;
ALTER TABLE public.reservations ADD COLUMN IF NOT EXISTS coupon_discount INTEGER DEFAULT 0;
ALTER TABLE public.reservations ADD COLUMN IF NOT EXISTS jaf_discount INTEGER DEFAULT 0;

-- ==========================================
-- 7a. bikes テーブル追加カラム（ベンダーダッシュボード拡張）
-- ==========================================
ALTER TABLE public.bikes ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT true;
ALTER TABLE public.bikes ADD COLUMN IF NOT EXISTS model_code VARCHAR(20);
ALTER TABLE public.bikes ADD COLUMN IF NOT EXISTS frame_number VARCHAR(50);
ALTER TABLE public.bikes ADD COLUMN IF NOT EXISTS display_name VARCHAR(100);
ALTER TABLE public.bikes ADD COLUMN IF NOT EXISTS color VARCHAR(20);
ALTER TABLE public.bikes ADD COLUMN IF NOT EXISTS model_year INTEGER;
ALTER TABLE public.bikes ADD COLUMN IF NOT EXISTS first_registration VARCHAR(10);
ALTER TABLE public.bikes ADD COLUMN IF NOT EXISTS inspection_expiry VARCHAR(10);
ALTER TABLE public.bikes ADD COLUMN IF NOT EXISTS registration_number VARCHAR(50);
ALTER TABLE public.bikes ADD COLUMN IF NOT EXISTS insurance_status VARCHAR(20) DEFAULT 'none';
ALTER TABLE public.bikes ADD COLUMN IF NOT EXISTS inspection_file_url TEXT;
ALTER TABLE public.bikes ADD COLUMN IF NOT EXISTS equipment JSONB DEFAULT '[]';
ALTER TABLE public.bikes ADD COLUMN IF NOT EXISTS is_long_term BOOLEAN DEFAULT false;
ALTER TABLE public.bikes ADD COLUMN IF NOT EXISTS long_term_discount JSONB;
ALTER TABLE public.bikes ADD COLUMN IF NOT EXISTS youtube_url TEXT;
ALTER TABLE public.bikes ADD COLUMN IF NOT EXISTS notes_html TEXT;
ALTER TABLE public.bikes ADD COLUMN IF NOT EXISTS current_mileage INTEGER DEFAULT 0;
ALTER TABLE public.bikes ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;
ALTER TABLE public.bikes ADD COLUMN IF NOT EXISTS suspension_periods JSONB DEFAULT '[]';

-- ==========================================
-- 4a. vendors テーブル追加カラム（ベンダーダッシュボード拡張）
-- ==========================================
ALTER TABLE public.vendors ADD COLUMN IF NOT EXISTS rental_hours_start VARCHAR(5);
ALTER TABLE public.vendors ADD COLUMN IF NOT EXISTS rental_hours_end VARCHAR(5);
ALTER TABLE public.vendors ADD COLUMN IF NOT EXISTS regular_holidays JSONB DEFAULT '[]';
ALTER TABLE public.vendors ADD COLUMN IF NOT EXISTS web_stop_rules JSONB DEFAULT '{}';
ALTER TABLE public.vendors ADD COLUMN IF NOT EXISTS parking_type VARCHAR(50);
ALTER TABLE public.vendors ADD COLUMN IF NOT EXISTS parking_count INTEGER;
ALTER TABLE public.vendors ADD COLUMN IF NOT EXISTS jaf_discount_enabled BOOLEAN DEFAULT false;
ALTER TABLE public.vendors ADD COLUMN IF NOT EXISTS insurance_company VARCHAR(100);
ALTER TABLE public.vendors ADD COLUMN IF NOT EXISTS insurance_phone VARCHAR(20);
ALTER TABLE public.vendors ADD COLUMN IF NOT EXISTS line_id VARCHAR(50);
ALTER TABLE public.vendors ADD COLUMN IF NOT EXISTS min_rental_age INTEGER DEFAULT 18;
ALTER TABLE public.vendors ADD COLUMN IF NOT EXISTS two_hour_plan BOOLEAN DEFAULT false;
ALTER TABLE public.vendors ADD COLUMN IF NOT EXISTS request_booking BOOLEAN DEFAULT false;
ALTER TABLE public.vendors ADD COLUMN IF NOT EXISTS request_cutoff_hours INTEGER DEFAULT 24;
ALTER TABLE public.vendors ADD COLUMN IF NOT EXISTS store_description_html TEXT;
ALTER TABLE public.vendors ADD COLUMN IF NOT EXISTS youtube_url TEXT;
ALTER TABLE public.vendors ADD COLUMN IF NOT EXISTS payment_cash BOOLEAN DEFAULT true;
ALTER TABLE public.vendors ADD COLUMN IF NOT EXISTS payment_credit BOOLEAN DEFAULT true;
ALTER TABLE public.vendors ADD COLUMN IF NOT EXISTS report_emails JSONB DEFAULT '[]';
ALTER TABLE public.vendors ADD COLUMN IF NOT EXISTS name_en TEXT;
ALTER TABLE public.vendors ADD COLUMN IF NOT EXISTS trade_name TEXT;
ALTER TABLE public.vendors ADD COLUMN IF NOT EXISTS trade_name_en TEXT;
ALTER TABLE public.vendors ADD COLUMN IF NOT EXISTS representative_name TEXT;
ALTER TABLE public.vendors ADD COLUMN IF NOT EXISTS fax TEXT;
ALTER TABLE public.vendors ADD COLUMN IF NOT EXISTS contact_emails JSONB DEFAULT '[]';
ALTER TABLE public.vendors ADD COLUMN IF NOT EXISTS access_info TEXT;
ALTER TABLE public.vendors ADD COLUMN IF NOT EXISTS hp_url TEXT;
ALTER TABLE public.vendors ADD COLUMN IF NOT EXISTS corporate_code VARCHAR(20);
ALTER TABLE public.vendors ADD COLUMN IF NOT EXISTS branch_number VARCHAR(10);

-- ==========================================
-- 新規テーブル: 店舗臨時休業日
-- ==========================================
CREATE TABLE IF NOT EXISTS public.vendor_closures (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  closure_date DATE NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==========================================
-- 新規テーブル: 店舗お知らせ
-- ==========================================
CREATE TABLE IF NOT EXISTS public.vendor_announcements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  announcement_type VARCHAR(50) DEFAULT '店舗からのお知らせ',
  title VARCHAR(100) NOT NULL,
  url TEXT,
  image_url TEXT,
  detail_html TEXT,
  published_from DATE,
  published_until DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==========================================
-- 新規テーブル: 店舗クチコミ
-- ==========================================
CREATE TABLE IF NOT EXISTS public.shop_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  reservation_id UUID REFERENCES reservations(id),
  nickname VARCHAR(50),
  content TEXT NOT NULL,
  reply TEXT,
  reply_by TEXT,
  reply_at TIMESTAMPTZ,
  is_published BOOLEAN DEFAULT true,
  posted_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 新規テーブル: お問い合わせ
-- ==========================================
CREATE TABLE IF NOT EXISTS public.vendor_inquiries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  reservation_id UUID REFERENCES reservations(id),
  user_id UUID REFERENCES auth.users(id),
  content TEXT NOT NULL,
  reply TEXT,
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  replied_at TIMESTAMPTZ
);

-- ==========================================
-- 新規テーブル: PV記録
-- ==========================================
CREATE TABLE IF NOT EXISTS public.page_views (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendor_id UUID REFERENCES vendors(id),
  bike_id UUID REFERENCES bikes(id),
  page_type VARCHAR(20) NOT NULL,
  device_type VARCHAR(10),
  viewed_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- オプションテーブル追加カラム（ライダーズギア拡張）
-- ==========================================
ALTER TABLE public.options ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT true;
ALTER TABLE public.options ADD COLUMN IF NOT EXISTS gear_type VARCHAR(50);
ALTER TABLE public.options ADD COLUMN IF NOT EXISTS gear_type_name VARCHAR(50);
ALTER TABLE public.options ADD COLUMN IF NOT EXISTS size VARCHAR(30);
ALTER TABLE public.options ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE public.options ADD COLUMN IF NOT EXISTS stock_managed BOOLEAN DEFAULT true;
ALTER TABLE public.options ADD COLUMN IF NOT EXISTS stock_quantity INTEGER DEFAULT 1;
ALTER TABLE public.options ADD COLUMN IF NOT EXISTS day1_price INTEGER DEFAULT 0;
ALTER TABLE public.options ADD COLUMN IF NOT EXISTS day2_price INTEGER DEFAULT 0;
ALTER TABLE public.options ADD COLUMN IF NOT EXISTS is_per_rental BOOLEAN DEFAULT false;
ALTER TABLE public.options ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;

-- ==========================================
-- 新規テーブルのインデックス
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_vendor_closures_vendor_id ON vendor_closures(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_closures_date ON vendor_closures(closure_date);
CREATE INDEX IF NOT EXISTS idx_vendor_announcements_vendor_id ON vendor_announcements(vendor_id);
CREATE INDEX IF NOT EXISTS idx_shop_reviews_vendor_id ON shop_reviews(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_inquiries_vendor_id ON vendor_inquiries(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_inquiries_status ON vendor_inquiries(status);
CREATE INDEX IF NOT EXISTS idx_page_views_vendor_id ON page_views(vendor_id);
CREATE INDEX IF NOT EXISTS idx_page_views_bike_id ON page_views(bike_id);
CREATE INDEX IF NOT EXISTS idx_page_views_viewed_at ON page_views(viewed_at);
CREATE INDEX IF NOT EXISTS idx_bikes_display_order ON bikes(display_order);
CREATE INDEX IF NOT EXISTS idx_bikes_is_published ON bikes(is_published);

-- ==========================================
-- 11. インデックスの作成
-- ==========================================
CREATE INDEX idx_vendors_user_id ON vendors(user_id);
CREATE INDEX idx_vendors_slug ON vendors(slug);
CREATE INDEX idx_vendors_is_active ON vendors(is_active) WHERE is_active = true;
CREATE INDEX idx_bikes_vendor_id ON bikes(vendor_id);
CREATE INDEX idx_bikes_class_id ON bikes(class_id);
CREATE INDEX idx_bikes_is_available ON bikes(is_available) WHERE is_available = true;
CREATE INDEX idx_reservations_user_id ON reservations(user_id);
CREATE INDEX idx_reservations_bike_id ON reservations(bike_id);
CREATE INDEX idx_reservations_vendor_id ON reservations(vendor_id);
CREATE INDEX idx_reservations_status ON reservations(status);
CREATE INDEX idx_reservations_datetime_range ON reservations USING GIST (tstzrange(start_datetime, end_datetime));
CREATE INDEX idx_payments_reservation_id ON payments(reservation_id);
CREATE INDEX idx_payments_vendor_id ON payments(vendor_id);
CREATE INDEX idx_payments_square_payment_id ON payments(square_payment_id);
CREATE INDEX idx_reviews_bike_id ON reviews(bike_id);
CREATE INDEX idx_reviews_vendor_id ON reviews(vendor_id);

-- ==========================================
-- 12. 更新日時の自動更新トリガー
-- ==========================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vendors_updated_at BEFORE UPDATE ON vendors
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bikes_updated_at BEFORE UPDATE ON bikes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reservations_updated_at BEFORE UPDATE ON reservations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON reviews
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==========================================
-- 13. RLS（Row Level Security）の有効化
-- ==========================================
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bike_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pricing_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bikes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- 14. RLSポリシーの定義
-- ==========================================

-- user_profiles: 自分のプロファイルは全員閲覧・更新可能
CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- vendors: 公開情報は全員閲覧可能、詳細はベンダー自身と管理者のみ
CREATE POLICY "Anyone can view active vendors"
  ON vendors FOR SELECT
  USING (is_active = true AND is_approved = true);

CREATE POLICY "Vendors can view own vendor"
  ON vendors FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Vendors can update own vendor"
  ON vendors FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all vendors"
  ON vendors FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update all vendors"
  ON vendors FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- bike_classes: 全員閲覧可能
CREATE POLICY "Anyone can view bike classes"
  ON bike_classes FOR SELECT
  USING (true);

-- pricing_plans: 全員閲覧可能
CREATE POLICY "Anyone can view pricing plans"
  ON pricing_plans FOR SELECT
  USING (is_available = true);

-- bikes: 公開されているバイクは全員閲覧可能
CREATE POLICY "Anyone can view available bikes"
  ON bikes FOR SELECT
  USING (is_available = true);

CREATE POLICY "Vendors can manage own bikes"
  ON bikes FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM vendors
      WHERE vendors.id = bikes.vendor_id
      AND vendors.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all bikes"
  ON bikes FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- reservations: 顧客は自分の予約のみ閲覧・作成可能
CREATE POLICY "Users can view own reservations"
  ON reservations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own reservations"
  ON reservations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own pending reservations"
  ON reservations FOR UPDATE
  USING (auth.uid() = user_id AND status = 'pending');

-- reservations: ベンダーは自店舗の予約を閲覧・更新可能
CREATE POLICY "Vendors can view own vendor reservations"
  ON reservations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM vendors
      WHERE vendors.id = reservations.vendor_id
      AND vendors.user_id = auth.uid()
    )
  );

CREATE POLICY "Vendors can update own vendor reservations"
  ON reservations FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM vendors
      WHERE vendors.id = reservations.vendor_id
      AND vendors.user_id = auth.uid()
    )
  );

-- reservations: 管理者は全予約を閲覧・更新可能
CREATE POLICY "Admins can view all reservations"
  ON reservations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update all reservations"
  ON reservations FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- payments: 顧客は自分の決済のみ閲覧可能
CREATE POLICY "Users can view own payments"
  ON payments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM reservations
      WHERE reservations.id = payments.reservation_id
      AND reservations.user_id = auth.uid()
    )
  );

-- payments: ベンダーは自店舗の決済を閲覧可能
CREATE POLICY "Vendors can view own vendor payments"
  ON payments FOR SELECT
  USING (auth.uid() = (SELECT user_id FROM vendors WHERE vendors.id = payments.vendor_id));

-- payments: 管理者は全決済を閲覧可能
CREATE POLICY "Admins can view all payments"
  ON payments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- reviews: 全員が閲覧可能、自分のレビューのみ作成・更新可能
CREATE POLICY "Anyone can view reviews"
  ON reviews FOR SELECT
  USING (true);

CREATE POLICY "Users can create own reviews"
  ON reviews FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM reservations
      WHERE reservations.id = reviews.reservation_id
      AND reservations.user_id = auth.uid()
      AND reservations.status = 'completed'
    )
  );

CREATE POLICY "Users can update own reviews"
  ON reviews FOR UPDATE
  USING (auth.uid() = user_id);

-- ==========================================
-- 15. 初期データの投入（マスタデータ）
-- ==========================================

-- 車両クラスの初期データ
INSERT INTO bike_classes (class_code, class_name, display_order, description) VALUES
  ('ev', '特定小型原付（電動）', 1, '免許不要 / 電動キックボード等'),
  ('50', '50cc', 2, '気軽な街乗りに最適'),
  ('125', '125cc', 3, 'ツーリングの入門に'),
  ('250', '250cc', 4, '本格的なツーリングを楽しむ'),
  ('400', '400cc', 5, 'パワーと扱いやすさのバランス'),
  ('950', '950cc', 6, '大型ツアラー'),
  ('1100', '1100cc', 7, 'プレミアムツアラー'),
  ('1500', '1500cc', 8, '最高級ツアラー');

-- 料金プランの初期データ（リーフレット準拠）
-- 特定EV
INSERT INTO pricing_plans (class_id, duration, price) 
SELECT id, '2h', 1500 FROM bike_classes WHERE class_code = 'ev';
INSERT INTO pricing_plans (class_id, duration, price) 
SELECT id, '4h', 2500 FROM bike_classes WHERE class_code = 'ev';
INSERT INTO pricing_plans (class_id, duration, price) 
SELECT id, '1day', 3000 FROM bike_classes WHERE class_code = 'ev';
INSERT INTO pricing_plans (class_id, duration, price) 
SELECT id, '24h', 3500 FROM bike_classes WHERE class_code = 'ev';
INSERT INTO pricing_plans (class_id, duration, price) 
SELECT id, '32h', 4200 FROM bike_classes WHERE class_code = 'ev';
INSERT INTO pricing_plans (class_id, duration, price) 
SELECT id, 'overtime', 850 FROM bike_classes WHERE class_code = 'ev';
INSERT INTO pricing_plans (class_id, duration, price) 
SELECT id, 'additional24h', 2500 FROM bike_classes WHERE class_code = 'ev';

-- 50cc
INSERT INTO pricing_plans (class_id, duration, price) 
SELECT id, '2h', 2000 FROM bike_classes WHERE class_code = '50';
INSERT INTO pricing_plans (class_id, duration, price) 
SELECT id, '4h', 3000 FROM bike_classes WHERE class_code = '50';
INSERT INTO pricing_plans (class_id, duration, price) 
SELECT id, '1day', 3500 FROM bike_classes WHERE class_code = '50';
INSERT INTO pricing_plans (class_id, duration, price) 
SELECT id, '24h', 4000 FROM bike_classes WHERE class_code = '50';
INSERT INTO pricing_plans (class_id, duration, price) 
SELECT id, '32h', 5050 FROM bike_classes WHERE class_code = '50';
INSERT INTO pricing_plans (class_id, duration, price) 
SELECT id, 'overtime', 1000 FROM bike_classes WHERE class_code = '50';
INSERT INTO pricing_plans (class_id, duration, price) 
SELECT id, 'additional24h', 2800 FROM bike_classes WHERE class_code = '50';

-- 125cc
INSERT INTO pricing_plans (class_id, duration, price) 
SELECT id, '2h', 3000 FROM bike_classes WHERE class_code = '125';
INSERT INTO pricing_plans (class_id, duration, price) 
SELECT id, '4h', 4200 FROM bike_classes WHERE class_code = '125';
INSERT INTO pricing_plans (class_id, duration, price) 
SELECT id, '1day', 5000 FROM bike_classes WHERE class_code = '125';
INSERT INTO pricing_plans (class_id, duration, price) 
SELECT id, '24h', 6000 FROM bike_classes WHERE class_code = '125';
INSERT INTO pricing_plans (class_id, duration, price) 
SELECT id, '32h', 8000 FROM bike_classes WHERE class_code = '125';
INSERT INTO pricing_plans (class_id, duration, price) 
SELECT id, 'overtime', 1200 FROM bike_classes WHERE class_code = '125';
INSERT INTO pricing_plans (class_id, duration, price) 
SELECT id, 'additional24h', 4300 FROM bike_classes WHERE class_code = '125';

-- 250cc
INSERT INTO pricing_plans (class_id, duration, price) 
SELECT id, '4h', 8300 FROM bike_classes WHERE class_code = '250';
INSERT INTO pricing_plans (class_id, duration, price) 
SELECT id, '1day', 9300 FROM bike_classes WHERE class_code = '250';
INSERT INTO pricing_plans (class_id, duration, price) 
SELECT id, '24h', 11200 FROM bike_classes WHERE class_code = '250';
INSERT INTO pricing_plans (class_id, duration, price) 
SELECT id, '32h', 16500 FROM bike_classes WHERE class_code = '250';
INSERT INTO pricing_plans (class_id, duration, price) 
SELECT id, 'overtime', 1600 FROM bike_classes WHERE class_code = '250';
INSERT INTO pricing_plans (class_id, duration, price) 
SELECT id, 'additional24h', 8500 FROM bike_classes WHERE class_code = '250';

-- 400cc
INSERT INTO pricing_plans (class_id, duration, price) 
SELECT id, '4h', 9800 FROM bike_classes WHERE class_code = '400';
INSERT INTO pricing_plans (class_id, duration, price) 
SELECT id, '1day', 10900 FROM bike_classes WHERE class_code = '400';
INSERT INTO pricing_plans (class_id, duration, price) 
SELECT id, '24h', 13200 FROM bike_classes WHERE class_code = '400';
INSERT INTO pricing_plans (class_id, duration, price) 
SELECT id, '32h', 20600 FROM bike_classes WHERE class_code = '400';
INSERT INTO pricing_plans (class_id, duration, price) 
SELECT id, 'overtime', 1800 FROM bike_classes WHERE class_code = '400';
INSERT INTO pricing_plans (class_id, duration, price) 
SELECT id, 'additional24h', 10000 FROM bike_classes WHERE class_code = '400';

-- 950cc
INSERT INTO pricing_plans (class_id, duration, price) 
SELECT id, '4h', 12800 FROM bike_classes WHERE class_code = '950';
INSERT INTO pricing_plans (class_id, duration, price) 
SELECT id, '1day', 14200 FROM bike_classes WHERE class_code = '950';
INSERT INTO pricing_plans (class_id, duration, price) 
SELECT id, '24h', 17200 FROM bike_classes WHERE class_code = '950';
INSERT INTO pricing_plans (class_id, duration, price) 
SELECT id, '32h', 24600 FROM bike_classes WHERE class_code = '950';
INSERT INTO pricing_plans (class_id, duration, price) 
SELECT id, 'overtime', 2150 FROM bike_classes WHERE class_code = '950';
INSERT INTO pricing_plans (class_id, duration, price) 
SELECT id, 'additional24h', 12000 FROM bike_classes WHERE class_code = '950';

-- 1100cc
INSERT INTO pricing_plans (class_id, duration, price) 
SELECT id, '4h', 14000 FROM bike_classes WHERE class_code = '1100';
INSERT INTO pricing_plans (class_id, duration, price) 
SELECT id, '1day', 15600 FROM bike_classes WHERE class_code = '1100';
INSERT INTO pricing_plans (class_id, duration, price) 
SELECT id, '24h', 18900 FROM bike_classes WHERE class_code = '1100';
INSERT INTO pricing_plans (class_id, duration, price) 
SELECT id, '32h', 26900 FROM bike_classes WHERE class_code = '1100';
INSERT INTO pricing_plans (class_id, duration, price) 
SELECT id, 'overtime', 2300 FROM bike_classes WHERE class_code = '1100';
INSERT INTO pricing_plans (class_id, duration, price) 
SELECT id, 'additional24h', 13500 FROM bike_classes WHERE class_code = '1100';

-- 1500cc
INSERT INTO pricing_plans (class_id, duration, price) 
SELECT id, '4h', 17500 FROM bike_classes WHERE class_code = '1500';
INSERT INTO pricing_plans (class_id, duration, price) 
SELECT id, '1day', 19500 FROM bike_classes WHERE class_code = '1500';
INSERT INTO pricing_plans (class_id, duration, price) 
SELECT id, '24h', 23700 FROM bike_classes WHERE class_code = '1500';
INSERT INTO pricing_plans (class_id, duration, price) 
SELECT id, '32h', 31700 FROM bike_classes WHERE class_code = '1500';
INSERT INTO pricing_plans (class_id, duration, price) 
SELECT id, 'overtime', 3000 FROM bike_classes WHERE class_code = '1500';
INSERT INTO pricing_plans (class_id, duration, price) 
SELECT id, 'additional24h', 17000 FROM bike_classes WHERE class_code = '1500';

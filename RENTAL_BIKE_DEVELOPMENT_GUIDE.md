# レンタルバイクプラットフォーム 開発ガイド

**作成日**: 2026年2月2日
**ベースプロジェクト**: Creator's Bridge（株式会社リンクス）
**ドキュメント種別**: 新規プロジェクト構築用リファレンス

---

## 目次

1. [プロジェクト概要](#1-プロジェクト概要)
2. [技術スタック](#2-技術スタック)
3. [アーキテクチャ全体像](#3-アーキテクチャ全体像)
4. [ディレクトリ構成](#4-ディレクトリ構成)
5. [データベース設計](#5-データベース設計)
6. [認証・認可設計](#6-認証認可設計)
7. [予約システム設計](#7-予約システム設計)
8. [商品管理設計（バイク＋オプション）](#8-商品管理設計バイクオプション)
9. [マルチベンダー設計](#9-マルチベンダー設計)
10. [ベンダーダッシュボード](#10-ベンダーダッシュボード)
11. [利用者マイページ](#11-利用者マイページ)
12. [運営管理ダッシュボード](#12-運営管理ダッシュボード)
13. [帳票出力（CSV / PDF）](#13-帳票出力csv--pdf)
14. [決済システム](#14-決済システム)
15. [通知・メール](#15-通知メール)
16. [デザインシステム（リンクスルール）](#16-デザインシステムリンクスルール)
17. [API設計](#17-api設計)
18. [Supabase Storage](#18-supabase-storage)
19. [Row Level Security（RLS）](#19-row-level-securityrls)
20. [Cron・自動処理](#20-cron自動処理)
21. [SEO・パフォーマンス](#21-seoパフォーマンス)
22. [開発フェーズ計画](#22-開発フェーズ計画)
23. [環境構築手順](#23-環境構築手順)
24. [Creator's Bridge からの流用・参考マッピング](#24-creators-bridge-からの流用参考マッピング)

---

## 1. プロジェクト概要

### サービスコンセプト

マルチベンダー型のレンタルバイク（自転車）プラットフォーム。
複数のレンタルバイク事業者（ベンダー）が自社の車両を登録・管理し、利用者がWebから検索・予約・決済まで完結できるサービス。

### 3つのロール

| ロール | 説明 |
|--------|------|
| **利用者（User）** | バイクを検索・予約・利用する一般ユーザー |
| **ベンダー（Vendor）** | バイクを保有・管理するレンタル事業者 |
| **運営（Admin）** | プラットフォーム全体を管理する運営者 |

### 予約の3形態

| 形態 | 説明 | 例 |
|------|------|----|
| **時間貸し** | 1時間単位でのレンタル | 1時間 500円、3時間 1,200円 |
| **日貸し** | 1日（営業時間内）単位 | 1日 2,000円 |
| **複数日貸し** | 連続する複数日のレンタル | 3日間 5,000円 |

### 商品構成

```
予約 = バイク本体（必須・1台） + オプション（任意・複数）

例:
  ロードバイク Aモデル（日貸し 3,000円）
  + ヘルメット（500円/日）
  + サイクルコンピュータ（300円/日）
  + 補償パック（800円/日）
  ─────────────────────────
  合計: 4,600円/日
```

---

## 2. 技術スタック

Creator's Bridgeと同一スタックを採用し、学習コスト・保守コストを最小化する。

| レイヤー | 技術 | バージョン | 用途 |
|---------|------|-----------|------|
| フレームワーク | **Next.js** | 16.x (App Router) | SSR/SSG/ISR/API Routes |
| 言語 | **TypeScript** | 5.x (strict mode) | 型安全な開発 |
| スタイリング | **Tailwind CSS** | v4 | ユーティリティファーストCSS |
| データベース | **Supabase** (PostgreSQL) | - | DB/認証/Storage/Realtime |
| 認証 | **Supabase Auth** | - | メール認証/OAuth |
| 決済 | **Square Web Payments SDK** | - | カード決済 |
| PDF生成 | **@react-pdf/renderer** | 4.x | 帳票PDF出力 |
| CSV生成 | ネイティブ実装 | - | 帳票CSV出力 |
| メール | **Resend** | - | トランザクションメール |
| アイコン | **Lucide React** | - | UIアイコン |
| アニメーション | **Framer Motion** | 12.x | UIアニメーション |
| ホスティング | **Vercel** | - | デプロイ・CDN・Cron |

### Creator's Bridgeからの追加検討

| 技術 | 用途 | 採用判断 |
|------|------|---------|
| **react-calendar** / **date-fns** | 予約カレンダーUI・日時操作 | 新規追加 |
| **Supabase Realtime** | 予約状況のリアルタイム更新 | 新規追加 |
| **QRコード生成（qrcode.react）** | 予約確認QRコード | 新規追加 |
| **react-leaflet** / **Google Maps** | 店舗マップ表示 | 新規追加 |

---

## 3. アーキテクチャ全体像

```
┌──────────────────────────────────────────────────────────────┐
│                       Vercel (Hosting)                       │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────────┐  │
│  │  SSR Pages  │  │  API Routes  │  │   Cron Jobs        │  │
│  │  (App Router)│  │  /api/*      │  │  予約期限/集計/通知 │  │
│  └──────┬──────┘  └──────┬───────┘  └────────┬───────────┘  │
│         │                │                    │              │
└─────────┼────────────────┼────────────────────┼──────────────┘
          │                │                    │
          ▼                ▼                    ▼
┌──────────────────────────────────────────────────────────────┐
│                     Supabase (Backend)                        │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────────────┐  │
│  │PostgreSQL│ │   Auth   │ │ Storage  │ │   Realtime     │  │
│  │  + RLS   │ │          │ │ (images) │ │ (availability) │  │
│  └──────────┘ └──────────┘ └──────────┘ └────────────────┘  │
└──────────────────────────────────────────────────────────────┘
          │                │
          ▼                ▼
┌──────────────┐  ┌──────────────┐
│    Square    │  │    Resend    │
│   (決済)     │  │   (メール)   │
└──────────────┘  └──────────────┘
```

---

## 4. ディレクトリ構成

Creator's Bridgeの構成を踏襲し、3ロール分のルートグループを配置。

```
rental-bike-platform/
├── app/
│   ├── (public)/                     # 公開ページ
│   │   ├── page.tsx                  # トップページ
│   │   ├── bikes/                    # バイク一覧・検索
│   │   │   └── [id]/                 # バイク詳細
│   │   ├── vendors/                  # ベンダー一覧
│   │   │   └── [id]/                 # ベンダー詳細（店舗ページ）
│   │   ├── about/
│   │   ├── faq/
│   │   └── contact/
│   │
│   ├── (auth)/                       # 認証系
│   │   ├── login/
│   │   ├── register/                 # ユーザー登録
│   │   ├── register/vendor/          # ベンダー登録
│   │   ├── forgot-password/
│   │   └── auth/
│   │       ├── callback/
│   │       ├── confirm/
│   │       └── set-password/
│   │
│   ├── (user)/                       # 利用者マイページ
│   │   └── mypage/
│   │       ├── page.tsx              # ダッシュボード
│   │       ├── reservations/         # 予約一覧
│   │       │   └── [id]/            # 予約詳細
│   │       ├── history/              # 利用履歴
│   │       ├── favorites/            # お気に入りバイク
│   │       ├── reviews/              # レビュー管理
│   │       ├── card/                 # カード管理
│   │       ├── notifications/        # 通知
│   │       ├── messages/             # メッセージ
│   │       └── settings/             # アカウント設定
│   │
│   ├── (vendor)/                     # ベンダーダッシュボード
│   │   └── vendor/
│   │       ├── page.tsx              # ダッシュボード（売上サマリ等）
│   │       ├── bikes/                # バイク管理
│   │       │   ├── page.tsx          # 一覧
│   │       │   ├── new/              # 新規登録
│   │       │   └── [id]/            # 編集
│   │       │       └── edit/
│   │       ├── options/              # オプション管理
│   │       │   ├── page.tsx
│   │       │   └── new/
│   │       ├── reservations/         # 予約管理
│   │       │   ├── page.tsx          # 予約一覧（カレンダー/リスト）
│   │       │   └── [id]/            # 予約詳細
│   │       ├── calendar/             # 空き状況カレンダー
│   │       ├── pricing/              # 料金設定
│   │       ├── customers/            # 顧客一覧
│   │       ├── reviews/              # レビュー管理
│   │       ├── reports/              # 帳票・レポート
│   │       │   ├── page.tsx          # レポートダッシュボード
│   │       │   ├── sales/            # 売上レポート
│   │       │   ├── reservations/     # 予約レポート
│   │       │   ├── bikes/            # 車両稼働レポート
│   │       │   └── customers/        # 顧客レポート
│   │       ├── shop/                 # 店舗情報管理
│   │       ├── notifications/
│   │       ├── messages/
│   │       └── settings/             # ベンダー設定
│   │
│   ├── (admin)/                      # 運営管理ダッシュボード
│   │   ├── admin/
│   │   │   └── login/
│   │   └── dashboard/
│   │       ├── page.tsx              # 管理トップ
│   │       ├── vendors/              # ベンダー管理
│   │       │   └── [id]/
│   │       ├── users/                # ユーザー管理
│   │       │   └── [id]/
│   │       ├── reservations/         # 全予約管理
│   │       ├── bikes/                # 全バイク管理
│   │       ├── payments/             # 決済管理
│   │       ├── reports/              # 全体レポート
│   │       │   └── [vendorId]/       # ベンダー別レポート
│   │       ├── reviews/              # レビュー管理
│   │       ├── inquiries/            # 問い合わせ管理
│   │       ├── analytics/            # アクセス解析
│   │       ├── notifications/        # 通知管理
│   │       └── settings/             # システム設定
│   │
│   ├── (legal)/                      # 法務ページ
│   │   ├── terms/
│   │   ├── privacy/
│   │   ├── legal/                    # 特商法
│   │   └── cancellation-policy/      # キャンセルポリシー
│   │
│   ├── api/                          # APIルート（セクション17で詳述）
│   │   └── ...
│   │
│   ├── layout.tsx                    # ルートレイアウト
│   ├── globals.css                   # グローバルCSS
│   └── not-found.tsx
│
├── components/
│   ├── ui/                           # 汎用UIコンポーネント
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Select.tsx
│   │   ├── Textarea.tsx
│   │   ├── Modal.tsx
│   │   ├── Calendar.tsx              # 予約カレンダー
│   │   ├── DateTimePicker.tsx         # 日時選択
│   │   ├── PriceTag.tsx              # 料金表示
│   │   ├── Badge.tsx                 # ステータスバッジ
│   │   ├── Toast.tsx
│   │   └── index.ts
│   ├── booking/                      # 予約系
│   │   ├── BookingForm.tsx           # 予約フォーム
│   │   ├── BookingCalendar.tsx       # 空き状況カレンダー
│   │   ├── BookingSummary.tsx        # 予約サマリ
│   │   ├── TimeSlotPicker.tsx        # 時間枠選択
│   │   ├── DateRangePicker.tsx       # 日付範囲選択
│   │   ├── OptionSelector.tsx        # オプション選択
│   │   └── PriceBreakdown.tsx        # 料金内訳
│   ├── bike/                         # バイク系
│   │   ├── BikeCard.tsx              # バイクカード
│   │   ├── BikeGallery.tsx           # 画像ギャラリー
│   │   ├── BikeSpecTable.tsx         # スペック表
│   │   ├── BikeSearchFilter.tsx      # 検索フィルター
│   │   └── BikeAvailability.tsx      # 空き状況表示
│   ├── vendor/                       # ベンダー系
│   │   ├── VendorCard.tsx
│   │   ├── VendorBikeForm.tsx        # バイク登録フォーム
│   │   ├── VendorOptionForm.tsx      # オプション登録フォーム
│   │   ├── VendorPricingForm.tsx     # 料金設定フォーム
│   │   ├── VendorStatsCard.tsx       # 統計カード
│   │   └── VendorReservationTable.tsx
│   ├── report/                       # 帳票系
│   │   ├── ReportFilter.tsx          # フィルタUI
│   │   ├── ReportTable.tsx           # データテーブル
│   │   ├── ReportChart.tsx           # グラフ
│   │   ├── CsvExportButton.tsx       # CSV出力ボタン
│   │   └── PdfExportButton.tsx       # PDF出力ボタン
│   ├── admin/                        # 管理画面系
│   │   ├── AdminPageLayout.tsx
│   │   ├── AdminTable.tsx
│   │   ├── AdminFilterBar.tsx
│   │   └── AdminStatsCard.tsx
│   ├── layout/                       # レイアウト系
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   ├── MobileMenu.tsx
│   │   ├── Sidebar.tsx               # ベンダー/管理サイドバー
│   │   └── Breadcrumb.tsx
│   └── animations/
│       ├── FadeIn.tsx
│       └── StaggerContainer.tsx
│
├── lib/
│   ├── supabase/                     # CB流用
│   │   ├── client.ts
│   │   ├── server.ts
│   │   ├── middleware.ts
│   │   ├── storage.ts
│   │   ├── helpers.ts
│   │   └── index.ts
│   ├── square/                       # CB流用
│   │   ├── client.ts
│   │   └── index.ts
│   ├── email/                        # CB構成を踏襲
│   │   ├── template.ts
│   │   ├── bookingConfirmation.ts    # 予約確認
│   │   ├── bookingReminder.ts        # 利用前リマインダー
│   │   ├── bookingCancellation.ts    # キャンセル通知
│   │   ├── vendorNewBooking.ts       # ベンダー新規予約通知
│   │   ├── vendorCancellation.ts     # ベンダーキャンセル通知
│   │   ├── reviewRequest.ts          # レビュー依頼
│   │   └── paymentReceipt.ts         # 領収書
│   ├── pdf/
│   │   ├── BookingReceiptDocument.tsx # 予約確認書PDF
│   │   ├── InvoiceDocument.tsx        # 請求書PDF
│   │   ├── SalesReportDocument.tsx    # 売上レポートPDF
│   │   ├── ReservationReportDocument.tsx # 予約レポートPDF
│   │   ├── BikeUsageReportDocument.tsx   # 車両稼働レポートPDF
│   │   └── CustomerReportDocument.tsx    # 顧客レポートPDF
│   ├── csv/
│   │   ├── generator.ts              # CSV生成ユーティリティ
│   │   └── templates.ts              # 帳票別カラム定義
│   ├── booking/
│   │   ├── availability.ts           # 空き状況計算ロジック
│   │   ├── pricing.ts                # 料金計算ロジック
│   │   ├── validation.ts             # 予約バリデーション
│   │   └── status.ts                 # ステータス遷移定義
│   ├── env.ts                        # CB流用
│   ├── admin.ts                      # CB流用
│   ├── dateUtils.ts                  # CB流用＋拡張
│   └── sanitize.ts                   # CB流用
│
├── types/
│   ├── database.ts                   # DB型定義
│   ├── booking.ts                    # 予約関連型
│   └── report.ts                     # 帳票関連型
│
├── middleware.ts                      # CB流用（CSRF + 認可）
├── next.config.ts                     # CB流用
├── package.json
├── tsconfig.json
├── postcss.config.mjs
└── vercel.json                        # Cron設定
```

---

## 5. データベース設計

### 5.1 ER図（概念）

```
vendors ──< bikes ──< bike_images
   │          │
   │          ├──< bike_options (中間テーブル)──> options
   │          │
   │          ├──< pricing_rules
   │          │
   │          └──< reservations ──< reservation_options
   │                   │
   │                   ├──> users
   │                   ├──> payments
   │                   └──< reviews
   │
   ├──< vendor_business_hours
   ├──< vendor_holidays
   └──< vendor_payouts

users ──< reservations
  │   ──< reviews
  │   ──< favorites
  └── ──< notifications

admins（auth.users + admin判定）
```

### 5.2 テーブル定義

#### users（利用者）

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,

  -- 基本情報
  display_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  avatar_url TEXT,

  -- Square決済
  square_customer_id TEXT,
  square_card_id TEXT,
  card_last_four TEXT,
  card_brand TEXT,
  card_registered_at TIMESTAMPTZ,

  -- ステータス
  status TEXT NOT NULL DEFAULT 'active',
  is_banned BOOLEAN NOT NULL DEFAULT FALSE,
  banned_at TIMESTAMPTZ,
  ban_reason TEXT,

  -- 統計
  total_reservations INTEGER NOT NULL DEFAULT 0,
  total_spent NUMERIC(12,2) NOT NULL DEFAULT 0,

  -- タイムスタンプ
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

#### vendors（ベンダー/レンタル事業者）

```sql
CREATE TABLE vendors (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,

  -- 基本情報
  company_name TEXT NOT NULL,
  representative_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  logo_url TEXT,

  -- 店舗情報
  address TEXT,
  prefecture TEXT,
  city TEXT,
  latitude NUMERIC(10,7),
  longitude NUMERIC(10,7),
  description TEXT,
  business_type TEXT,                       -- 個人事業主 / 法人

  -- 営業情報
  default_open_time TIME NOT NULL DEFAULT '09:00',
  default_close_time TIME NOT NULL DEFAULT '18:00',

  -- Square決済
  square_customer_id TEXT,
  square_card_id TEXT,
  card_last_four TEXT,
  card_brand TEXT,
  card_registered_at TIMESTAMPTZ,

  -- ステータス
  status TEXT NOT NULL DEFAULT 'pending',   -- pending / active / suspended
  approved_at TIMESTAMPTZ,
  is_banned BOOLEAN NOT NULL DEFAULT FALSE,
  banned_at TIMESTAMPTZ,
  ban_reason TEXT,

  -- 統計
  total_reservations INTEGER NOT NULL DEFAULT 0,
  total_revenue NUMERIC(12,2) NOT NULL DEFAULT 0,
  rating NUMERIC(3,2) NOT NULL DEFAULT 0,
  review_count INTEGER NOT NULL DEFAULT 0,

  -- タイムスタンプ
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_vendors_status ON vendors(status);
CREATE INDEX idx_vendors_prefecture ON vendors(prefecture);
```

#### vendor_business_hours（営業時間）

```sql
CREATE TABLE vendor_business_hours (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,

  day_of_week INTEGER NOT NULL,             -- 0=日 1=月 ... 6=土
  open_time TIME NOT NULL,
  close_time TIME NOT NULL,
  is_closed BOOLEAN NOT NULL DEFAULT FALSE, -- 定休日

  UNIQUE(vendor_id, day_of_week)
);
```

#### vendor_holidays（臨時休業日）

```sql
CREATE TABLE vendor_holidays (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,

  holiday_date DATE NOT NULL,
  reason TEXT,

  UNIQUE(vendor_id, holiday_date)
);
```

#### bikes（バイク車両）

```sql
CREATE TABLE bikes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,

  -- 基本情報
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,                   -- road / cross / city / e-bike / mtb / kids / other
  brand TEXT,
  model TEXT,
  color TEXT,
  frame_size TEXT,                          -- S / M / L / XL

  -- スペック
  wheel_size TEXT,                          -- 700c / 26 / 27.5 / 29
  gear_count INTEGER,
  weight_kg NUMERIC(5,2),
  has_electric_assist BOOLEAN DEFAULT FALSE,
  max_rider_height_cm INTEGER,
  min_rider_height_cm INTEGER,

  -- 在庫
  total_quantity INTEGER NOT NULL DEFAULT 1,
  available_quantity INTEGER NOT NULL DEFAULT 1,

  -- 画像
  thumbnail_url TEXT,

  -- ステータス
  status TEXT NOT NULL DEFAULT 'active',    -- active / inactive / maintenance
  is_featured BOOLEAN NOT NULL DEFAULT FALSE,

  -- 統計
  total_bookings INTEGER NOT NULL DEFAULT 0,
  rating NUMERIC(3,2) NOT NULL DEFAULT 0,
  review_count INTEGER NOT NULL DEFAULT 0,

  -- タイムスタンプ
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_bikes_vendor ON bikes(vendor_id);
CREATE INDEX idx_bikes_category ON bikes(category);
CREATE INDEX idx_bikes_status ON bikes(status);
```

#### bike_images（バイク画像）

```sql
CREATE TABLE bike_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bike_id UUID NOT NULL REFERENCES bikes(id) ON DELETE CASCADE,

  image_url TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_bike_images_bike ON bike_images(bike_id);
```

#### options（レンタルオプション）

```sql
CREATE TABLE options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,

  -- 基本情報
  name TEXT NOT NULL,                       -- ヘルメット / 鍵 / サイクルコンピュータ / 補償パック / チャイルドシート etc
  description TEXT,
  category TEXT NOT NULL,                   -- safety / accessory / insurance / other
  image_url TEXT,

  -- 在庫（NULL = 無制限）
  total_quantity INTEGER,
  available_quantity INTEGER,

  -- ステータス
  status TEXT NOT NULL DEFAULT 'active',    -- active / inactive

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_options_vendor ON options(vendor_id);
```

#### bike_options（バイク↔オプション紐付け）

```sql
CREATE TABLE bike_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bike_id UUID NOT NULL REFERENCES bikes(id) ON DELETE CASCADE,
  option_id UUID NOT NULL REFERENCES options(id) ON DELETE CASCADE,

  is_default BOOLEAN NOT NULL DEFAULT FALSE,  -- デフォルトで選択済み
  is_required BOOLEAN NOT NULL DEFAULT FALSE, -- 必須オプション

  UNIQUE(bike_id, option_id)
);
```

#### pricing_rules（料金設定）

```sql
CREATE TABLE pricing_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,

  -- 対象
  target_type TEXT NOT NULL,                -- bike / option
  target_id UUID NOT NULL,                  -- bikes.id または options.id

  -- 料金タイプ
  rental_type TEXT NOT NULL,                -- hourly / daily / multi_day
  duration_hours INTEGER,                   -- 時間貸し: 時間数（1, 2, 3...）
  duration_days INTEGER,                    -- 複数日: 日数（2, 3, 5, 7...）

  -- 料金
  price NUMERIC(10,2) NOT NULL,
  tax_rate NUMERIC(5,4) NOT NULL DEFAULT 0.10,  -- 消費税率（10%）

  -- 適用条件
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  valid_from DATE,                          -- シーズン料金の開始日
  valid_until DATE,                         -- シーズン料金の終了日
  day_of_week INTEGER[],                    -- 曜日限定（NULL=全曜日）

  -- 優先度（高い方が優先。シーズン料金 > 通常料金）
  priority INTEGER NOT NULL DEFAULT 0,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_pricing_vendor ON pricing_rules(vendor_id);
CREATE INDEX idx_pricing_target ON pricing_rules(target_type, target_id);
```

#### reservations（予約）

```sql
CREATE TABLE reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 関連
  user_id UUID NOT NULL REFERENCES users(id),
  vendor_id UUID NOT NULL REFERENCES vendors(id),
  bike_id UUID NOT NULL REFERENCES bikes(id),

  -- 予約内容
  rental_type TEXT NOT NULL,                -- hourly / daily / multi_day
  start_datetime TIMESTAMPTZ NOT NULL,
  end_datetime TIMESTAMPTZ NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,      -- 同一バイクの台数

  -- 金額
  bike_subtotal NUMERIC(10,2) NOT NULL,
  options_subtotal NUMERIC(10,2) NOT NULL DEFAULT 0,
  subtotal NUMERIC(10,2) NOT NULL,
  tax_amount NUMERIC(10,2) NOT NULL,
  total_amount NUMERIC(10,2) NOT NULL,
  discount_amount NUMERIC(10,2) NOT NULL DEFAULT 0,

  -- プラットフォーム手数料
  platform_fee_rate NUMERIC(5,4) NOT NULL DEFAULT 0.10,  -- 10%
  platform_fee_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  vendor_payout_amount NUMERIC(10,2) NOT NULL DEFAULT 0,

  -- ステータス
  status TEXT NOT NULL DEFAULT 'pending',
  -- pending → confirmed → in_use → completed
  -- pending → cancelled
  -- confirmed → cancelled
  -- confirmed → no_show

  -- キャンセル
  cancelled_at TIMESTAMPTZ,
  cancel_reason TEXT,
  cancellation_fee NUMERIC(10,2) DEFAULT 0,

  -- メモ
  user_note TEXT,
  vendor_note TEXT,

  -- QRコード用トークン
  checkin_token TEXT UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),

  -- タイムスタンプ
  confirmed_at TIMESTAMPTZ,
  checked_in_at TIMESTAMPTZ,
  checked_out_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_reservations_user ON reservations(user_id);
CREATE INDEX idx_reservations_vendor ON reservations(vendor_id);
CREATE INDEX idx_reservations_bike ON reservations(bike_id);
CREATE INDEX idx_reservations_status ON reservations(status);
CREATE INDEX idx_reservations_dates ON reservations(start_datetime, end_datetime);
```

#### reservation_options（予約に紐づくオプション）

```sql
CREATE TABLE reservation_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id UUID NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
  option_id UUID NOT NULL REFERENCES options(id),

  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC(10,2) NOT NULL,
  subtotal NUMERIC(10,2) NOT NULL,

  UNIQUE(reservation_id, option_id)
);

CREATE INDEX idx_reservation_options_reservation ON reservation_options(reservation_id);
```

#### payments（決済）

```sql
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id UUID NOT NULL REFERENCES reservations(id),
  user_id UUID NOT NULL REFERENCES users(id),

  -- Square決済情報
  square_payment_id TEXT,
  square_order_id TEXT,

  -- 金額
  amount NUMERIC(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'JPY',

  -- ステータス
  status TEXT NOT NULL DEFAULT 'pending',    -- pending / completed / refunded / failed
  payment_method TEXT NOT NULL DEFAULT 'card',

  -- 返金
  refund_amount NUMERIC(10,2) DEFAULT 0,
  refunded_at TIMESTAMPTZ,

  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_payments_reservation ON payments(reservation_id);
CREATE INDEX idx_payments_user ON payments(user_id);
CREATE INDEX idx_payments_status ON payments(status);
```

#### vendor_payouts（ベンダーへの支払い）

```sql
CREATE TABLE vendor_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES vendors(id),

  -- 対象期間
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,

  -- 金額
  gross_amount NUMERIC(12,2) NOT NULL,       -- 売上総額
  platform_fee NUMERIC(12,2) NOT NULL,       -- プラットフォーム手数料
  net_amount NUMERIC(12,2) NOT NULL,         -- 支払額

  -- 明細
  reservation_count INTEGER NOT NULL,
  detail_json JSONB,                          -- 予約ID一覧等

  -- ステータス
  status TEXT NOT NULL DEFAULT 'pending',     -- pending / processing / completed
  paid_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_payouts_vendor ON vendor_payouts(vendor_id);
CREATE INDEX idx_payouts_status ON vendor_payouts(status);
```

#### reviews（レビュー）

```sql
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id UUID NOT NULL REFERENCES reservations(id),
  user_id UUID NOT NULL REFERENCES users(id),
  vendor_id UUID NOT NULL REFERENCES vendors(id),
  bike_id UUID NOT NULL REFERENCES bikes(id),

  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,

  -- ベンダー返信
  vendor_reply TEXT,
  vendor_replied_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(reservation_id, user_id)
);

CREATE INDEX idx_reviews_vendor ON reviews(vendor_id);
CREATE INDEX idx_reviews_bike ON reviews(bike_id);
```

#### favorites（お気に入り）

```sql
CREATE TABLE favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  target_type TEXT NOT NULL,                 -- bike / vendor
  target_id UUID NOT NULL,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(user_id, target_type, target_id)
);
```

#### notifications（通知）

```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,                     -- users.id or vendors.id

  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  link TEXT,
  metadata JSONB,

  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  read_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = FALSE;
```

#### messages（メッセージ）

```sql
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id UUID REFERENCES reservations(id),

  sender_id UUID NOT NULL,
  receiver_id UUID NOT NULL,
  sender_type TEXT NOT NULL,                 -- user / vendor / admin

  content TEXT NOT NULL,
  attachments TEXT[],

  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  read_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_messages_reservation ON messages(reservation_id);
CREATE INDEX idx_messages_receiver ON messages(receiver_id, is_read);
```

#### inquiries（お問い合わせ）

```sql
CREATE TABLE inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  inquiry_type TEXT NOT NULL,                -- general / vendor_support / user_support / partnership
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  company TEXT,
  subject TEXT,
  message TEXT NOT NULL,

  status TEXT NOT NULL DEFAULT 'new',
  admin_notes TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

## 6. 認証・認可設計

Creator's Bridgeの認証基盤をそのまま流用する。

### 認証方式
- **Supabase Auth** によるメール + パスワード認証
- OAuth（Google等）は将来対応

### ロール判定

```typescript
// lib/auth.ts

type UserRole = 'user' | 'vendor' | 'admin';

export async function getUserRole(userId: string): Promise<UserRole> {
  const supabase = createServerClient();

  // 管理者チェック（メールアドレスベース。CB方式を踏襲）
  if (isAdmin(email)) return 'admin';

  // ベンダーチェック
  const { data: vendor } = await supabase
    .from('vendors')
    .select('id')
    .eq('id', userId)
    .maybeSingle();

  if (vendor) return 'vendor';

  return 'user';
}
```

### ミドルウェアによるアクセス制御

```typescript
// middleware.ts のルーティング

// /vendor/* → ベンダーロール必須
// /dashboard/* → 管理者ロール必須
// /mypage/* → ログイン必須
// /api/vendor/* → ベンダーロール必須
// /api/admin/* → 管理者ロール必須
```

---

## 7. 予約システム設計

### 7.1 予約タイプ別の動作

#### 時間貸し（hourly）

```
入力: 利用日 + 開始時刻 + 利用時間数
例:   2026/3/15 10:00 〜 13:00（3時間）

料金計算:
  pricing_rules WHERE rental_type = 'hourly' AND duration_hours = 3
  → 該当なければ、1時間単価 × 3時間
```

#### 日貸し（daily）

```
入力: 利用日
例:   2026/3/15（営業時間内）

料金計算:
  pricing_rules WHERE rental_type = 'daily'
  → 日額料金
```

#### 複数日貸し（multi_day）

```
入力: 開始日 + 終了日
例:   2026/3/15 〜 2026/3/17（3日間）

料金計算:
  pricing_rules WHERE rental_type = 'multi_day' AND duration_days = 3
  → 該当なければ、日額 × 日数
  → さらに該当なければ、最も近いmulti_dayルール + 差分日数 × 日額
```

### 7.2 料金計算ロジック

```typescript
// lib/booking/pricing.ts

interface PriceCalculation {
  bikePrice: number;
  optionPrices: { optionId: string; name: string; unitPrice: number; quantity: number; subtotal: number }[];
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  appliedRule: PricingRule;
}

export async function calculatePrice(params: {
  bikeId: string;
  rentalType: 'hourly' | 'daily' | 'multi_day';
  startDatetime: Date;
  endDatetime: Date;
  quantity: number;
  optionIds: string[];
}): Promise<PriceCalculation> {
  // 1. 該当する料金ルールを取得（優先度順）
  //    - シーズン料金（valid_from/valid_until内）を優先
  //    - 曜日限定料金を次に優先
  //    - 通常料金をフォールバック

  // 2. バイク料金を計算

  // 3. オプション料金を計算（各オプションも同様のルール適用）

  // 4. 消費税を計算

  // 5. 合計を返却
}
```

### 7.3 空き状況チェック

```typescript
// lib/booking/availability.ts

export async function checkAvailability(params: {
  bikeId: string;
  startDatetime: Date;
  endDatetime: Date;
  quantity: number;
}): Promise<{ available: boolean; remainingQuantity: number }> {
  // 1. bikes.total_quantity を取得

  // 2. 指定期間と重なる予約を集計
  //    reservations WHERE bike_id = ? AND status IN ('pending', 'confirmed', 'in_use')
  //    AND start_datetime < endDatetime AND end_datetime > startDatetime

  // 3. 残数 = total_quantity - 重複予約数

  // 4. 残数 >= quantity なら available: true
}
```

### 7.4 予約ステータス遷移

```
                    ┌──────────┐
                    │ pending  │  ← 予約作成（決済前）
                    └────┬─────┘
                         │ 決済完了
                         ▼
┌──────────┐      ┌──────────┐
│cancelled │ ←──── │confirmed │  ← 予約確定
└──────────┘      └────┬─────┘
                       │ チェックイン
                       ▼
                 ┌──────────┐
                 │  in_use  │  ← 利用中
                 └────┬─────┘
                      │ チェックアウト
                      ▼
                 ┌──────────┐
                 │completed │  ← 利用完了
                 └──────────┘

※ confirmed → no_show（無断キャンセル。Cron処理で自動判定）
```

### 7.5 キャンセルポリシー

```typescript
// lib/booking/cancellation.ts

export function calculateCancellationFee(
  reservation: Reservation,
  cancelAt: Date
): number {
  const hoursBeforeStart = differenceInHours(reservation.start_datetime, cancelAt);

  if (hoursBeforeStart >= 48) return 0;                          // 48時間以上前: 無料
  if (hoursBeforeStart >= 24) return reservation.total_amount * 0.30;  // 24-48時間前: 30%
  if (hoursBeforeStart >= 12) return reservation.total_amount * 0.50;  // 12-24時間前: 50%
  return reservation.total_amount;                                // 12時間未満: 100%
}
```

---

## 8. 商品管理設計（バイク＋オプション）

### 8.1 バイクカテゴリ

```typescript
export const BIKE_CATEGORIES = [
  { value: 'road',    label: 'ロードバイク' },
  { value: 'cross',   label: 'クロスバイク' },
  { value: 'city',    label: 'シティサイクル' },
  { value: 'e-bike',  label: '電動アシスト' },
  { value: 'mtb',     label: 'マウンテンバイク' },
  { value: 'kids',    label: 'キッズ' },
  { value: 'other',   label: 'その他' },
] as const;
```

### 8.2 オプションカテゴリ

```typescript
export const OPTION_CATEGORIES = [
  { value: 'safety',     label: '安全装備',   examples: 'ヘルメット、ライト、反射ベスト' },
  { value: 'accessory',  label: 'アクセサリ', examples: 'サイクルコンピュータ、ボトルホルダー、バッグ' },
  { value: 'insurance',  label: '補償・保険', examples: '車両補償、対人対物保険' },
  { value: 'child',      label: 'キッズ用品', examples: 'チャイルドシート、子供用ヘルメット' },
  { value: 'other',      label: 'その他',     examples: 'ガイドマップ、GPS' },
] as const;
```

### 8.3 料金設定パターン

ベンダーが自由に設定できる柔軟な料金体系。

```
【バイク: ロードバイク Aモデル】
  時間貸し:
    1時間  → 800円
    2時間  → 1,400円
    3時間  → 1,800円
    半日(4h) → 2,200円
  日貸し:
    1日 → 3,000円
  複数日:
    2日 → 5,500円
    3日 → 7,500円
    7日 → 15,000円

  シーズン料金（GW / お盆 / 年末年始）:
    日貸し → 4,000円（priority: 10）

  週末料金:
    日貸し → 3,500円（day_of_week: [0, 6], priority: 5）

【オプション: ヘルメット】
  時間貸し: 200円/回
  日貸し: 300円/日
  複数日: 日数 × 250円/日
```

---

## 9. マルチベンダー設計

### 9.1 データの分離

すべてのテーブルに `vendor_id` を持たせ、RLSで厳密にデータ分離する。

```sql
-- ベンダーは自分のデータのみアクセス可能
CREATE POLICY "vendor_own_data" ON bikes
  FOR ALL USING (vendor_id = auth.uid());
```

### 9.2 ベンダー登録フロー

```
1. メール認証 → パスワード設定
2. 事業者情報入力（会社名、住所、営業時間など）
3. 運営が審査 → status = 'active' に変更
4. バイク・オプション・料金を登録
5. サービス公開
```

### 9.3 プラットフォーム手数料

```
予約成立時:
  売上総額: 10,000円
  プラットフォーム手数料（10%）: 1,000円
  ベンダー受取額: 9,000円

→ vendor_payouts テーブルで月次精算
```

---

## 10. ベンダーダッシュボード

### 10.1 画面構成

```
/vendor/
├── ダッシュボード（トップ）
│   ├── 本日の予約件数・売上
│   ├── 今週の予約カレンダー（ミニ）
│   ├── 直近の通知
│   └── 稼働率グラフ
│
├── バイク管理 → CRUD + 在庫管理
├── オプション管理 → CRUD
├── 料金設定 → バイク別・オプション別の料金ルール設定
├── 予約管理
│   ├── カレンダービュー（月/週/日）
│   ├── リストビュー（フィルタ・検索）
│   └── 予約詳細（ステータス変更、メモ）
│
├── 空き状況カレンダー → バイク別の空き状況一覧
│
├── 顧客一覧 → 利用回数・金額でソート可能
├── レビュー管理 → 返信機能付き
│
├── 帳票・レポート ★
│   ├── 売上レポート
│   ├── 予約レポート
│   ├── 車両稼働レポート
│   └── 顧客レポート
│
├── 店舗情報 → 基本情報・営業時間・休業日の管理
├── メッセージ → 利用者とのやり取り
├── 通知
└── 設定 → アカウント設定・決済設定
```

### 10.2 帳票の詳細（セクション13で後述）

---

## 11. 利用者マイページ

### 11.1 画面構成

```
/mypage/
├── ダッシュボード（トップ）
│   ├── 直近の予約
│   ├── 過去の利用回数・総額
│   └── 未読通知
│
├── 予約一覧
│   ├── 予約中（confirmed / in_use）
│   ├── 過去の予約（completed）
│   └── キャンセル済み
│
├── 予約詳細
│   ├── 予約情報・QRコード表示
│   ├── キャンセルボタン
│   └── レビュー投稿
│
├── 利用履歴 → 月別の利用実績
├── お気に入り → バイク・ベンダー
├── レビュー → 投稿済みレビュー一覧
├── カード管理 → Square連携
├── メッセージ → ベンダーとのやり取り
├── 通知
└── 設定 → プロフィール・パスワード変更・退会
```

---

## 12. 運営管理ダッシュボード

### 12.1 画面構成

```
/dashboard/
├── トップ
│   ├── KPI: 月間予約数 / 月間GMV / アクティブベンダー数 / 新規ユーザー数
│   ├── 予約推移グラフ
│   └── 直近のアラート
│
├── ベンダー管理
│   ├── 一覧（ステータスフィルタ）
│   ├── 詳細（情報確認・ステータス変更・BAN）
│   └── 審査待ち一覧
│
├── ユーザー管理
│   ├── 一覧
│   └── 詳細（利用履歴・BAN）
│
├── 全予約管理 → 全ベンダーの予約を横断検索
├── 全バイク管理 → ベンダー別一覧
│
├── 決済管理
│   ├── 決済一覧
│   ├── 返金処理
│   └── ベンダー精算管理（vendor_payouts）
│
├── レポート
│   ├── プラットフォーム全体の売上レポート
│   ├── ベンダー別レポート
│   └── CSV / PDF出力
│
├── レビュー管理 → 不適切レビューの非表示
├── 問い合わせ管理
├── アクセス解析
├── 通知管理 → 全体通知の配信
└── システム設定 → 手数料率変更・管理者追加
```

---

## 13. 帳票出力（CSV / PDF）

### 13.1 帳票一覧

| 帳票名 | 対象 | 出力形式 | 主要項目 |
|--------|------|---------|---------|
| **売上レポート** | ベンダー / 運営 | CSV, PDF | 日別/月別売上、手数料、純売上、前月比 |
| **予約レポート** | ベンダー / 運営 | CSV, PDF | 予約件数、キャンセル率、平均単価、レンタルタイプ別集計 |
| **車両稼働レポート** | ベンダー | CSV, PDF | バイク別稼働率、予約回数、売上貢献度 |
| **顧客レポート** | ベンダー | CSV, PDF | リピート率、顧客別利用回数・金額、新規/既存比率 |
| **精算明細書** | ベンダー / 運営 | PDF | 期間売上、手数料控除、支払額明細 |
| **予約確認書** | 利用者 | PDF | 予約内容、料金内訳、QRコード |
| **領収書** | 利用者 | PDF | 支払金額、内訳、決済情報 |

### 13.2 CSV生成

```typescript
// lib/csv/generator.ts

export function generateCsv<T extends Record<string, unknown>>(
  data: T[],
  columns: { key: keyof T; label: string; formatter?: (value: unknown) => string }[]
): string {
  // BOM付きUTF-8でExcel互換
  const BOM = '\uFEFF';

  // ヘッダー行
  const header = columns.map(c => `"${c.label}"`).join(',');

  // データ行
  const rows = data.map(row =>
    columns.map(col => {
      const value = row[col.key];
      const formatted = col.formatter ? col.formatter(value) : String(value ?? '');
      return `"${formatted.replace(/"/g, '""')}"`;
    }).join(',')
  );

  return BOM + [header, ...rows].join('\n');
}

// ダウンロード処理
export function downloadCsv(csvContent: string, filename: string): void {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}_${format(new Date(), 'yyyyMMdd')}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
```

### 13.3 CSV帳票テンプレート例

```typescript
// lib/csv/templates.ts

export const SALES_REPORT_COLUMNS = [
  { key: 'date',             label: '日付',           formatter: formatDate },
  { key: 'reservation_count', label: '予約件数' },
  { key: 'gross_amount',     label: '売上（税込）',    formatter: formatCurrency },
  { key: 'tax_amount',       label: '消費税',         formatter: formatCurrency },
  { key: 'net_amount',       label: '売上（税抜）',    formatter: formatCurrency },
  { key: 'platform_fee',    label: 'プラットフォーム手数料', formatter: formatCurrency },
  { key: 'payout_amount',   label: '受取額',         formatter: formatCurrency },
  { key: 'cancel_count',    label: 'キャンセル件数' },
  { key: 'cancel_fee',      label: 'キャンセル料',    formatter: formatCurrency },
] as const;

export const RESERVATION_REPORT_COLUMNS = [
  { key: 'reservation_id',  label: '予約ID' },
  { key: 'date',            label: '利用日',          formatter: formatDate },
  { key: 'user_name',       label: '利用者名' },
  { key: 'bike_name',       label: 'バイク名' },
  { key: 'rental_type',     label: 'レンタルタイプ',   formatter: formatRentalType },
  { key: 'start_time',      label: '開始時刻',        formatter: formatTime },
  { key: 'end_time',        label: '終了時刻',        formatter: formatTime },
  { key: 'options',         label: 'オプション' },
  { key: 'total_amount',    label: '合計金額',        formatter: formatCurrency },
  { key: 'status',          label: 'ステータス',      formatter: formatStatus },
] as const;

export const BIKE_USAGE_REPORT_COLUMNS = [
  { key: 'bike_name',       label: 'バイク名' },
  { key: 'category',        label: 'カテゴリ',        formatter: formatCategory },
  { key: 'total_bookings',  label: '予約回数' },
  { key: 'utilization_rate', label: '稼働率（%）',    formatter: formatPercent },
  { key: 'revenue',         label: '売上貢献額',      formatter: formatCurrency },
  { key: 'avg_booking_value', label: '平均単価',      formatter: formatCurrency },
  { key: 'cancel_rate',     label: 'キャンセル率（%）', formatter: formatPercent },
] as const;

export const CUSTOMER_REPORT_COLUMNS = [
  { key: 'user_name',        label: '顧客名' },
  { key: 'email',            label: 'メール' },
  { key: 'first_visit',      label: '初回利用日',     formatter: formatDate },
  { key: 'last_visit',       label: '最終利用日',     formatter: formatDate },
  { key: 'visit_count',      label: '利用回数' },
  { key: 'total_spent',      label: '累計利用額',     formatter: formatCurrency },
  { key: 'avg_spent',        label: '平均利用額',     formatter: formatCurrency },
  { key: 'favorite_bike',    label: 'よく利用するバイク' },
] as const;
```

### 13.4 PDF帳票

`@react-pdf/renderer` を使用。Creator's Bridgeの `TransactionTermsDocument.tsx` と同じ実装パターン。

```typescript
// lib/pdf/SalesReportDocument.tsx（構造イメージ）

import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

interface SalesReportProps {
  vendorName: string;
  period: { start: string; end: string };
  summary: {
    totalRevenue: number;
    totalFee: number;
    totalPayout: number;
    reservationCount: number;
    cancelCount: number;
  };
  dailyData: {
    date: string;
    reservations: number;
    revenue: number;
    fee: number;
    payout: number;
  }[];
}

export function SalesReportDocument({ vendorName, period, summary, dailyData }: SalesReportProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* ヘッダー: ロゴ + タイトル + 期間 */}
        {/* サマリーセクション: KPIカード風 */}
        {/* 日別明細テーブル */}
        {/* フッター: 生成日時 + ページ番号 */}
      </Page>
    </Document>
  );
}
```

### 13.5 帳票のAPI

```typescript
// app/api/vendor/reports/sales/route.ts

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const format = searchParams.get('format');  // 'csv' | 'pdf' | 'json'
  const startDate = searchParams.get('start');
  const endDate = searchParams.get('end');

  // 1. 認証・認可チェック
  // 2. データ取得・集計
  // 3. フォーマットに応じて出力

  if (format === 'csv') {
    const csv = generateCsv(data, SALES_REPORT_COLUMNS);
    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="sales_report_${startDate}_${endDate}.csv"`,
      },
    });
  }

  if (format === 'pdf') {
    const pdfStream = await renderToStream(
      <SalesReportDocument {...reportData} />
    );
    return new Response(pdfStream, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="sales_report_${startDate}_${endDate}.pdf"`,
      },
    });
  }

  // デフォルト: JSON
  return Response.json(data);
}
```

---

## 14. 決済システム

Creator's BridgeのSquare連携を踏襲。

### 14.1 決済フロー

```
1. ユーザーがカードを事前登録（Square Web Payments SDK）
2. 予約確定時にSquare Payments APIで即時課金
3. 決済成功 → reservations.status = 'confirmed'
4. 決済失敗 → reservations.status = 'pending'のまま → 一定時間後に自動キャンセル

キャンセル時:
5. キャンセルポリシーに基づく返金額を計算
6. Square Refunds APIで返金処理
7. payments.refund_amount を更新
```

### 14.2 ベンダー精算

```
月次バッチ:
1. 前月の completed な予約を集計
2. プラットフォーム手数料（10%）を控除
3. vendor_payouts レコードを作成
4. ベンダーに精算通知メールを送信
5. 運営が確認後、振込処理
```

---

## 15. 通知・メール

### 15.1 メールテンプレート

| テンプレート | 送信先 | トリガー |
|-------------|--------|---------|
| 予約確認 | 利用者 | 予約確定時 |
| 新規予約通知 | ベンダー | 予約確定時 |
| 利用前リマインダー | 利用者 | 利用日の前日 |
| キャンセル完了 | 利用者 + ベンダー | キャンセル時 |
| 利用完了 + レビュー依頼 | 利用者 | チェックアウト時 |
| 精算通知 | ベンダー | 月次精算時 |
| 領収書 | 利用者 | 決済完了時 |

### 15.2 アプリ内通知

Creator's Bridgeの `notifications` テーブル + `NotificationDropdown` コンポーネントを流用。

---

## 16. デザインシステム（リンクスルール）

Creator's Bridgeのデザイン言語をベースに、レンタルバイクに適したビジュアルに調整。

### 16.1 デザイン原則

| 原則 | 内容 |
|------|------|
| **ミニマル** | 情報量の多い予約画面でも余白を活かし、視線誘導を明確に |
| **モノトーン+アクセント** | ブラック/ホワイト/グレーの基調に、1色のアクセントカラー |
| **日本語タイポグラフィ** | Noto Serif JP（見出し）+ Noto Sans JP（本文） |
| **カード型レイアウト** | バイクリスト・予約一覧はカードで統一 |
| **直線的** | 角丸なし、border-radius不使用（ボタン・カード・入力欄すべて） |

### 16.2 カラーパレット

```css
@theme {
  /* ベース（CB踏襲） */
  --color-black: #000000;
  --color-white: #FFFFFF;
  --color-gray-50: #FAFAFA;
  --color-gray-100: #F5F5F5;
  --color-gray-200: #E5E5E5;
  --color-gray-300: #D4D4D4;
  --color-gray-400: #A3A3A3;
  --color-gray-500: #737373;
  --color-gray-600: #525252;
  --color-gray-700: #404040;
  --color-gray-800: #262626;
  --color-gray-900: #171717;

  /* アクセントカラー（サービスに合わせて変更可） */
  --color-accent: #2D7D6F;
  --color-accent-dark: #1A5A4F;
  --color-accent-light: #3D9D8F;

  /* ステータスカラー */
  --color-status-pending: #F59E0B;
  --color-status-confirmed: #10B981;
  --color-status-in-use: #3B82F6;
  --color-status-completed: #6B7280;
  --color-status-cancelled: #EF4444;
}
```

### 16.3 コンポーネントスタイル例

```tsx
// ボタン（CB踏襲のスタイリッシュなデザイン）
<button className="px-8 py-3 bg-black text-white text-sm hover:bg-gray-800 transition-colors">
  予約する
</button>

// カード
<div className="bg-white border border-gray-100 p-6">
  ...
</div>

// 入力フィールド
<input className="w-full px-4 py-3 text-sm border border-gray-200 focus:outline-none focus:border-black" />

// ラベル
<label className="block text-xs text-gray-400 mb-2">利用日</label>
```

---

## 17. API設計

### 17.1 APIルート一覧

```
app/api/
├── auth/
│   ├── callback/              POST  OAuth/メール認証コールバック
│   ├── check/                 GET   認証状態確認
│   └── ban-check/             GET   BAN状態確認
│
├── users/
│   ├── route.ts               GET   プロフィール取得
│   │                          PUT   プロフィール更新
│   └── delete/                DELETE 退会
│
├── bikes/
│   ├── route.ts               GET   バイク一覧（検索・フィルタ）
│   └── [id]/
│       ├── route.ts           GET   バイク詳細
│       └── availability/      GET   空き状況
│
├── vendors/
│   ├── route.ts               GET   ベンダー一覧
│   └── [id]/                  GET   ベンダー詳細
│
├── reservations/
│   ├── route.ts               GET   予約一覧（利用者）
│   │                          POST  予約作成
│   └── [id]/
│       ├── route.ts           GET   予約詳細
│       ├── cancel/            POST  キャンセル
│       ├── checkin/           POST  チェックイン
│       └── checkout/          POST  チェックアウト
│
├── reviews/
│   └── route.ts               GET   レビュー一覧
│                              POST  レビュー投稿
│
├── favorites/
│   └── route.ts               GET/POST/DELETE
│
├── messages/
│   └── route.ts               GET/POST
│
├── notifications/
│   └── route.ts               GET/PUT
│
├── square/
│   ├── register-card/         POST  カード登録
│   ├── charge/                POST  決済実行
│   └── refund/                POST  返金
│
├── contact/                   POST  お問い合わせ
│
├── vendor/                            # ベンダー向けAPI
│   ├── bikes/
│   │   └── route.ts           GET/POST  バイクCRUD
│   ├── bikes/[id]/
│   │   └── route.ts           PUT/DELETE
│   ├── options/
│   │   └── route.ts           GET/POST
│   ├── options/[id]/
│   │   └── route.ts           PUT/DELETE
│   ├── pricing/
│   │   └── route.ts           GET/POST/PUT/DELETE
│   ├── reservations/
│   │   └── route.ts           GET   予約一覧（ベンダー）
│   ├── reservations/[id]/
│   │   └── route.ts           PUT   ステータス変更
│   ├── customers/
│   │   └── route.ts           GET   顧客一覧
│   ├── reports/
│   │   ├── sales/             GET   売上レポート（json/csv/pdf）
│   │   ├── reservations/      GET   予約レポート
│   │   ├── bikes/             GET   車両稼働レポート
│   │   └── customers/         GET   顧客レポート
│   ├── shop/
│   │   └── route.ts           GET/PUT 店舗情報
│   ├── business-hours/
│   │   └── route.ts           GET/PUT
│   └── holidays/
│       └── route.ts           GET/POST/DELETE
│
├── admin/                             # 運営向けAPI
│   ├── vendors/               GET/PUT  ベンダー管理
│   ├── users/                 GET/PUT  ユーザー管理
│   ├── reservations/          GET      全予約
│   ├── payments/              GET      決済管理
│   ├── payouts/               GET/POST ベンダー精算
│   ├── reports/               GET      全体レポート
│   ├── reviews/               GET/PUT  レビュー管理
│   ├── inquiries/             GET/PUT  問い合わせ
│   ├── stats/                 GET      KPI統計
│   └── settings/              GET/PUT  システム設定
│
└── cron/
    ├── expire-pending/        POST  未決済予約の自動キャンセル
    ├── no-show/               POST  ノーショー判定
    ├── review-reminder/       POST  レビューリマインダー
    ├── monthly-payout/        POST  月次精算バッチ
    └── booking-reminder/      POST  利用前リマインダー
```

---

## 18. Supabase Storage

Creator's Bridgeの `lib/supabase/storage.ts` を流用。

### バケット構成

```typescript
export const STORAGE_BUCKETS = {
  VENDOR_LOGOS: 'vendor-logos',
  BIKE_IMAGES: 'bike-images',
  OPTION_IMAGES: 'option-images',
  USER_AVATARS: 'user-avatars',
  VENDOR_DOCUMENTS: 'vendor-documents',  // 事業者証明書等（非公開）
} as const;
```

---

## 19. Row Level Security（RLS）

### 基本方針

| テーブル | SELECT | INSERT | UPDATE | DELETE |
|---------|--------|--------|--------|--------|
| users | 本人のみ | 本人のみ | 本人のみ | 本人のみ |
| vendors | 全員（公開情報） | 本人のみ | 本人のみ | - |
| bikes | 全員（active） | 所属vendor | 所属vendor | 所属vendor |
| options | 全員（active） | 所属vendor | 所属vendor | 所属vendor |
| pricing_rules | 全員 | 所属vendor | 所属vendor | 所属vendor |
| reservations | 本人 or 対象vendor | 本人 | 本人 or 対象vendor | - |
| reviews | 全員 | 予約した本人 | 本人 | - |
| payments | 本人 | system | system | - |
| notifications | 本人 | system | 本人 | - |
| messages | 送受信者 | 送信者 | - | - |

※ Admin は service_role key で RLS をバイパス。

---

## 20. Cron・自動処理

`vercel.json` で設定（CB踏襲）。

```json
{
  "crons": [
    {
      "path": "/api/cron/expire-pending",
      "schedule": "*/15 * * * *"
    },
    {
      "path": "/api/cron/no-show",
      "schedule": "0 * * * *"
    },
    {
      "path": "/api/cron/booking-reminder",
      "schedule": "0 9 * * *"
    },
    {
      "path": "/api/cron/review-reminder",
      "schedule": "0 10 * * *"
    },
    {
      "path": "/api/cron/monthly-payout",
      "schedule": "0 3 1 * *"
    }
  ]
}
```

| ジョブ | スケジュール | 処理内容 |
|--------|-------------|---------|
| expire-pending | 15分毎 | 30分以上pendingの予約を自動キャンセル |
| no-show | 毎時 | 開始時刻を1時間過ぎてもcheckin無しをno_showに |
| booking-reminder | 毎朝9時 | 翌日の予約者にリマインダーメール |
| review-reminder | 毎朝10時 | 完了後24時間経過でレビュー依頼 |
| monthly-payout | 毎月1日3時 | 前月分の精算データ生成 |

---

## 21. SEO・パフォーマンス

### SEO

- 静的ページ（トップ・FAQ・法務）: SSG
- バイク一覧: ISR（revalidate: 3600）
- バイク詳細: ISR（revalidate: 1800）
- ベンダー詳細: ISR（revalidate: 3600）
- ダッシュボード系: CSR（認証必須のため）

### 構造化データ

```typescript
// LocalBusiness + Product スキーマ
{
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "name": "ベンダー名",
  "address": { ... },
  "makesOffer": [
    {
      "@type": "Offer",
      "itemOffered": {
        "@type": "Product",
        "name": "ロードバイク Aモデル",
        "category": "Bicycle"
      },
      "price": "3000",
      "priceCurrency": "JPY"
    }
  ]
}
```

---

## 22. 開発フェーズ計画

### Phase 1: MVP（コア機能）

| 機能 | 優先度 |
|------|--------|
| 認証（メール登録/ログイン） | 必須 |
| ベンダー登録・審査 | 必須 |
| バイク登録・管理 | 必須 |
| 料金設定（日貸しのみ） | 必須 |
| バイク検索・一覧 | 必須 |
| 予約作成・確認（日貸し） | 必須 |
| Square決済 | 必須 |
| 予約管理（ベンダー） | 必須 |
| 運営ダッシュボード（基本） | 必須 |
| メール通知（予約確認） | 必須 |

### Phase 2: 予約拡張

| 機能 | 優先度 |
|------|--------|
| 時間貸し対応 | 高 |
| 複数日貸し対応 | 高 |
| オプション管理・予約 | 高 |
| シーズン料金・曜日料金 | 高 |
| キャンセルポリシー・返金 | 高 |
| QRチェックイン/アウト | 中 |
| 空き状況カレンダー | 中 |

### Phase 3: エンゲージメント

| 機能 | 優先度 |
|------|--------|
| レビュー機能 | 高 |
| お気に入り | 中 |
| メッセージ機能 | 中 |
| アプリ内通知 | 中 |
| リマインダーメール | 中 |

### Phase 4: 帳票・分析

| 機能 | 優先度 |
|------|--------|
| 売上レポート（CSV/PDF） | 高 |
| 予約レポート（CSV/PDF） | 高 |
| 車両稼働レポート | 高 |
| 顧客レポート | 中 |
| 精算明細書（PDF） | 高 |
| 予約確認書・領収書（PDF） | 中 |
| ベンダー月次精算 | 高 |

### Phase 5: 高度な機能

| 機能 | 優先度 |
|------|--------|
| 地図検索（Google Maps / Leaflet） | 中 |
| 多言語対応（英語） | 低 |
| クーポン・プロモーション | 低 |
| ベンダー向けモバイルアプリ | 低 |
| Supabase Realtimeで空き状況リアルタイム更新 | 低 |

---

## 23. 環境構築手順

### 23.1 初期セットアップ

```bash
# プロジェクト作成
npx create-next-app@latest rental-bike-platform --typescript --tailwind --app

# 依存パッケージ
npm install @supabase/supabase-js @supabase/ssr
npm install square resend
npm install @react-pdf/renderer
npm install lucide-react framer-motion
npm install date-fns                    # 日時操作
npm install qrcode.react                # QRコード（Phase 2）

# 開発依存
npm install -D @tailwindcss/postcss @types/node @types/react @types/react-dom
```

### 23.2 環境変数

```env
# .env.local

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxxxx
SUPABASE_SERVICE_ROLE_KEY=xxxxx

# Square
SQUARE_ACCESS_TOKEN=xxxxx
SQUARE_LOCATION_ID=xxxxx
NEXT_PUBLIC_SQUARE_APPLICATION_ID=xxxxx

# Resend
RESEND_API_KEY=xxxxx

# Site
NEXT_PUBLIC_SITE_URL=http://localhost:3000
CRON_SECRET=xxxxx
```

### 23.3 Supabase設定

1. プロジェクト作成
2. テーブル作成（セクション5のSQL実行）
3. RLSポリシー設定（セクション19）
4. Storageバケット作成（セクション18）
5. Auth設定（メール認証有効化）

---

## 24. Creator's Bridge からの流用・参考マッピング

Creator's Bridgeの実装をレンタルバイクにマッピングした対応表。

### コード流用（そのまま使えるもの）

| CBファイル | 流用先 | 変更点 |
|-----------|--------|--------|
| `lib/supabase/client.ts` | そのまま | Supabase URLの変更のみ |
| `lib/supabase/server.ts` | そのまま | 同上 |
| `lib/supabase/middleware.ts` | そのまま | 同上 |
| `lib/supabase/storage.ts` | バケット名変更 | STORAGE_BUCKETS定義をバイク用に |
| `lib/square/client.ts` | そのまま | 同上 |
| `lib/env.ts` | 環境変数追加 | バイク固有の変数を追加 |
| `lib/admin.ts` | そのまま | 管理者メールを変更 |
| `lib/sanitize.ts` | そのまま | - |
| `lib/dateUtils.ts` | 拡張 | 時間計算・営業時間判定を追加 |
| `middleware.ts` | ルート変更 | /vendor /dashboard /mypage のガード |
| `next.config.ts` | そのまま | images.remotePatterns を更新 |
| `app/globals.css` | カラー変更可 | アクセントカラーを変更する場合のみ |

### パターン流用（構造を参考にして新規実装）

| CBの実装 | レンタルバイクでの対応 |
|---------|---------------------|
| `profiles` テーブル + 登録フロー | `users` テーブル + ユーザー登録 |
| `clients` テーブル + 登録フロー | `vendors` テーブル + ベンダー登録 |
| `projects` + ステータス遷移 | `reservations` + ステータス遷移 |
| `applications` + `estimates` | `pricing_rules` + 料金計算 |
| `messages` テーブル + メッセージUI | そのまま流用可能 |
| `reviews` テーブル + レビューUI | 構造ほぼ同じ。ベンダー返信を追加 |
| `notifications` + NotificationDropdown | そのまま流用可能 |
| Square決済フロー（register-card / charge） | そのまま流用可能 |
| メールテンプレート基盤（lib/email/template.ts） | テンプレート内容を予約用に変更 |
| PDF生成（TransactionTermsDocument） | 帳票PDFのベースとして流用 |
| 管理画面（AdminPageLayout / AdminTable） | そのまま流用可能 |
| 画像アップロード（ImageUploader） | バイク画像アップロードに流用 |
| カード登録（CardRegistration） | そのまま流用可能 |
| BAN管理（is_banned + banned_users） | 同じパターンで実装 |
| Cron処理（vercel.json + /api/cron/） | ジョブ内容を予約用に変更 |

---

**本ドキュメントに関する質問・更新依頼は開発チーム内で共有してください。**

# Mobirio ロードマップ — 本番リリースまでの実装計画

**作成日**: 2026年2月25日
**現在バージョン**: 0.2.0
**目標**: 本番環境でのサービス開始

---

## 現状サマリー

| 項目 | 数値 | 備考 |
|------|------|------|
| ページ数 | 104 (page.tsx + layout.tsx) | 公開/ベンダー/管理者/ユーザー |
| APIルート | 83 (route.ts) | 大半がサンドボックスモード |
| コンポーネント | 85 (.tsx) | ベンダー系39個 |
| Supabase連携率 | ~25% | 予約API等のみ実装済 |
| モックデータ参照箇所 | 364+ | 本番前に全て実データ化が必要 |

### 完成している領域
- 公開ページUI全般（トップ、バイク一覧/詳細、ショップ一覧/詳細、予約フォーム、静的ページ）
- ベンダーダッシュボードUI全9フェーズ（ナビ、KPI、カンバン、カレンダー、車両管理、分析チャート等）
- 管理者ダッシュボードUI（18ページ）
- ユーザーマイページUI（ダッシュボード、予約一覧、履歴等）
- 認証基盤コード（requireVendor/requireAdmin、3層Supabaseクライアント）
- メールテンプレート7種（Resend）
- サンドボックスモード（ローカル開発用モック切替）

### 未完成の領域（本ロードマップで実装）
- Supabase Auth連携（ログイン/登録が未接続）
- Square決済SDK統合（モックnonceのまま）
- APIルートの本番Supabase接続（大半がモック返却）
- 画像アップロード/表示（全てプレースホルダー）
- CSRF/セキュリティミドルウェア
- Cronジョブ（予約期限切れ、リマインダー等）
- SEO構造化データ、OGP画像

---

## フェーズ構成

```
Phase 0: 基盤整備（DB・認証・ミドルウェア）
    ↓
Phase 1: コアバックエンド（API実データ化）
    ↓
Phase 2: 決済・予約フロー完結
    ↓
Phase 3: ユーザー向け機能完結
    ↓
Phase 4: ベンダーダッシュボード実データ化
    ↓
Phase 5: 管理者ダッシュボード実データ化
    ↓
Phase 6: 画像・ストレージ
    ↓
Phase 7: SEO・パフォーマンス
    ↓
Phase 8: 本番リリース準備
```

---

## Phase 0: 基盤整備（DB・認証・ミドルウェア）

> 全ての後続フェーズの土台。最優先で完了させる。

### 0-1. データベーススキーマ最終化

**設計原則（PRODUCTION_GUIDE §5準拠）:**
- UUID主キー (`gen_random_uuid()`)
- TIMESTAMPTZ で統一
- RLS全テーブル有効化
- 論理削除 (`is_deleted` + `deleted_at`) ※関連データがある場合
- 冪等性 (`ON CONFLICT DO NOTHING` / `DO UPDATE`)
- 既存ENUM型 (`reservation_status`, `payment_type` 等) はそのまま維持

- [ ] 既存マイグレーションファイルの棚卸し・整合性確認
  - `supabase/migrations/` 内の全ファイルレビュー
  - テーブル間の外部キー制約の確認
- [ ] 不足テーブル・カラムの追加マイグレーション作成
  - `notifications` テーブル（ユーザー通知）
  - `messages` テーブル（ユーザー⇔ベンダーメッセージ）
  - `favorites` テーブル（お気に入りバイク）
  - `contact_inquiries` テーブル（お問い合わせ）
  - `user_cards` テーブル（Square顧客カード情報）
  - `admins` テーブル（管理者ロール: super_admin/admin/moderator）
  - `banned_users` テーブル（BAN済みユーザー再登録防止）
- [ ] 重複防止インデックスの作成
  - `favorites(user_id, bike_id)` — お気に入り重複防止
  - `reviews(vendor_id, user_id)` — レビュー重複防止
- [ ] RLSポリシーの実装・テスト
  - users: 自分のデータのみ読み書き可
  - vendors: 自店舗データのみ読み書き可（`vendor_id` ベースのマルチベンダー分離）
  - bikes/options: 公開データは誰でも読み取り可、書き込みは所有ベンダーのみ
  - reservations: ユーザーは自分の予約のみ、ベンダーは自店舗の予約のみ
  - notifications: 自分の通知のみ読み書き可
  - admin: service_role経由のみフルアクセス
- [ ] DB Trigger `handle_new_user()` 作成（PRODUCTION_GUIDE §3準拠）
  - メール確認完了時にプロフィールを自動作成
  - `ON CONFLICT (id) DO NOTHING` で冪等性確保
- [ ] Supabase Storageバケット作成
  - `bike-images`（公開読み取り）
  - `vendor-logos`（公開読み取り）
  - `vendor-covers`（公開読み取り）
  - `user-avatars`（公開読み取り）
  - `contracts`（認証済みのみ — 署名付きURL経由）

**対象ファイル:**
- `supabase/migrations/` — 新規マイグレーション追加
- `types/database.ts` — 型定義同期

### 0-2. 認証システム接続

- [ ] ブラウザクライアントのダブルキャッシュ実装（PRODUCTION_GUIDE §3準拠）
  - `lib/supabase/client.ts` に window + module変数の二重キャッシュ
  - HMRによる重複生成防止
- [ ] ログインページ (`app/(auth)/login/page.tsx`) をSupabase Auth接続
  - `signInWithPassword` + ユーザータイプ二重検証（`signInWithTypeCheck`）
  - エラーハンドリング（無効な認証情報、メール未確認等）
  - ログイン後リダイレクト（元のURL or ロール別トップ）
- [ ] 新規登録ページ (`app/(auth)/register/page.tsx`) をSupabase Auth接続
  - `signUp` + `user_metadata` にユーザータイプ設定（DB Triggerで自動プロフィール作成）
  - メール確認フロー
  - 入力バリデーション
- [ ] ベンダー登録ページ
  - ベンダー用signUp + `user_metadata.user_type = 'vendor'`
  - 承認待ち状態の表示
- [ ] パスワードリセット (`app/(auth)/forgot-password/`)
  - `resetPasswordForEmail` 実装
  - パスワード再設定ページ (`app/(auth)/auth/set-password/`)
- [ ] Auth Callbackハンドラ (`app/(auth)/auth/callback/`)（PRODUCTION_GUIDE §3準拠）
  - `exchangeCodeForSession` 実装
  - ユーザータイプに応じたリダイレクト先振り分け（vendor → `/vendor`、customer → `/mypage`）
- [ ] middleware.ts のセッション管理確認
  - Supabaseセッション更新ロジック
  - 保護パスの認証リダイレクト

**対象ファイル:**
- `lib/supabase/client.ts`（ダブルキャッシュ）
- `app/(auth)/login/page.tsx`
- `app/(auth)/register/page.tsx`
- `app/(auth)/forgot-password/page.tsx`
- `app/(auth)/auth/callback/route.ts`
- `app/(auth)/auth/set-password/page.tsx`
- `lib/auth/actions.ts`
- `middleware.ts`

### 0-3. ミドルウェア・セキュリティ基盤

- [ ] CSRF検証の実装（PRODUCTION_GUIDE §2準拠）
  - `isAllowedOrigin()` でOrigin/Refererチェック（サブドメインマッチング対応）
  - Cronルート・Auth Callbackの除外
- [ ] セキュリティヘッダーの追加（PRODUCTION_GUIDE §12準拠）
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: DENY`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Permissions-Policy: camera=(), microphone=(), geolocation=()`
  - CSPヘッダー（本番のみ、Square SDK/Supabase/Google Fonts許可）
- [ ] レート制限の検討（Vercel Edge Middleware or API単位）

**対象ファイル:**
- `middleware.ts`
- `next.config.ts`（ヘッダー設定）

### 0-4. 通知統一ヘルパー作成

- [ ] `lib/notifications.ts` 作成（PRODUCTION_GUIDE §9準拠）
  - `NotificationType` 型定義（booking_confirmed, payment_completed 等）
  - `createNotification()` 単一通知
  - `createNotifications()` 一括通知
  - **全通知はこのヘルパー経由（直接INSERT禁止）**
- [ ] 通知API（`app/api/notifications/route.ts`）
  - GET: 一覧取得（未読フィルタ、未読カウント付き）
  - PATCH: 既読化（単一 / 一括）

**対象ファイル:**
- `lib/notifications.ts`（新規）
- `app/api/notifications/route.ts`（新規 or 既存修正）

### 0-5. 開発基盤（Pre-commit + 型安全）

- [ ] Husky + lint-staged 設定（PRODUCTION_GUIDE §15/§23準拠）
  - `npx husky init`
  - pre-commit: `lint-staged` → 型キャッシュクリア → `tsc --noEmit`
  - `package.json` に `lint-staged` 設定追加
- [ ] `.husky/pre-commit` ファイル作成

**対象ファイル:**
- `.husky/pre-commit`（新規）
- `package.json`（lint-staged設定追加）

---

## Phase 1: コアバックエンド（API実データ化）

> サンドボックスモードからSupabase本番接続への切替。Phase 0完了後に着手。
>
> **実装パターン（PRODUCTION_GUIDE準拠）:**
> - 軽量SELECT: 必要カラムのみ `.select('id, name, price_day')` （§21）
> - ページネーション: `.range()` + `{ count: 'exact' }` （§21）
> - 統計カウント: `{ count: 'exact', head: true }` でボディなし取得 （§5）
> - 公開ページ: `export const revalidate = 3600` でISRキャッシュ （§5）
> - レスポンス形式: `{ success, data, message }` / `{ error }` 統一 （§6）

### 1-1. 公開API実データ化

- [ ] `GET /api/bikes` — Supabaseからバイク一覧取得
  - 軽量SELECT（必要カラムのみ指定）
  - フィルタリング（エリア、車種、排気量、価格帯）
  - ページネーション（`.range()` + `{ count: 'exact' }`）
  - ソート（人気順、価格順、新着順）
- [ ] `GET /api/bikes/[id]` — バイク詳細取得（リレーション含む）
- [ ] `GET /api/vendors` — 既にデュアルモード実装済み → テスト確認
- [ ] `GET /api/vendors/[id]` — ベンダー詳細（バイク・レビュー含む）
- [ ] `GET /api/options` — 既にデュアルモード実装済み → テスト確認
- [ ] `GET /api/reviews` — レビュー取得API（ベンダー別、バイク別）

**対象ファイル:**
- `app/api/bikes/route.ts`
- `app/api/bikes/[id]/route.ts`
- `app/api/vendors/[id]/route.ts`
- `app/api/reviews/route.ts`（新規作成の可能性）
- `lib/mock/` — 本番移行後、段階的にimport除去

### 1-2. ユーザーAPI実データ化

- [ ] `GET/PUT /api/user/profile` — プロフィール取得・更新
- [ ] `GET /api/user/reservations` — 自分の予約一覧
- [ ] `GET /api/user/reservations/[id]` — 予約詳細
- [ ] `POST /api/user/reservations/[id]/cancel` — 予約キャンセル
- [ ] `GET/POST/DELETE /api/user/favorites` — お気に入り管理
- [ ] `GET/POST /api/user/reviews` — レビュー投稿・一覧
- [ ] `GET /api/user/notifications` — 通知一覧
- [ ] `GET/POST /api/user/messages` — メッセージ送受信
- [ ] `GET/POST/DELETE /api/user/cards` — Squareカード管理

**対象ファイル:**
- `app/api/user/` — 新規APIルートディレクトリ作成

### 1-3. お問い合わせAPI

- [ ] `POST /api/contact` — お問い合わせ送信
  - `contact_inquiries`テーブルへ保存
  - 管理者へメール通知（Resend）
  - 送信者へ自動返信

**対象ファイル:**
- `app/api/contact/route.ts`（新規）
- `lib/email/contactConfirmation.ts`（新規テンプレート）

---

## Phase 2: 決済・予約フロー完結

> ユーザーがバイクを検索→予約→決済→完了まで通せるようにする。

### 2-1. Square Web Payments SDK統合

- [ ] `/book/[reservationId]/pay` ページにSquare SDK組み込み
  - `<script src="https://sandbox.web.squarecdn.com/v1/square.js">` ローディング
  - Card Payment Form初期化
  - カードnonce取得→サーバーに送信
- [ ] `POST /api/square/charge` のSupabase連携
  - 本番Square APIでの決済実行（`square` パッケージ使用）
  - `payments`テーブルへ記録
  - `reservations.status` を `confirmed` に更新
- [ ] 決済エラーハンドリング
  - カード拒否、残高不足等のユーザー向けメッセージ
- [ ] 返金処理API (`POST /api/square/refund`)
  - Square Refund API呼び出し
  - `payments`テーブル更新

**対象ファイル:**
- `app/(public)/book/[reservationId]/pay/page.tsx`
- `app/api/square/charge/route.ts`
- `app/api/square/refund/route.ts`（新規）
- `lib/square/client.ts`

### 2-2. 予約フロー完結

- [ ] `POST /api/reservations` の本番実装
  - 空き状況チェック（ダブルブッキング防止）
  - 予約レコード作成
  - オプション関連レコード作成
  - クーポン使用記録
- [ ] 予約確認メール送信（`bookingConfirmationEmail`）
- [ ] ベンダーへの新規予約通知メール（`vendorNewBookingEmail`）
- [ ] 予約完了ページでの実データ表示

**対象ファイル:**
- `app/api/reservations/route.ts`
- `lib/booking/availability.ts` — 空き状況チェックロジック
- `lib/booking/pricing.ts` — 料金計算ロジック

### 2-3. 予約ステータス管理

- [ ] ステータス遷移の実装
  ```
  pending → confirmed（決済完了）
  confirmed → in_use（出発）
  in_use → completed（返却）
  pending/confirmed → cancelled（キャンセル）
  pending → expired（期限切れ：Cron）
  ```
- [ ] 各遷移時のメール通知
- [ ] キャンセルポリシーに基づく返金計算

---

## Phase 3: ユーザー向け機能完結

> マイページの全機能を実データで動作させる。

### 3-1. マイページダッシュボード

- [ ] `app/(user)/mypage/page.tsx` — 実データ取得
  - 現在の予約件数
  - 累計利用回数
  - レビュー件数
  - 未読通知数
  - 直近の予約一覧
  - 最新通知

### 3-2. 予約管理

- [ ] `app/(user)/mypage/reservations/page.tsx` — API連携
  - ステータスタブフィルタリング
  - ページネーション
- [ ] `app/(user)/mypage/reservations/[id]/page.tsx` — 予約詳細
  - キャンセルボタン機能化
  - 予約変更リクエスト

### 3-3. その他マイページ

- [ ] `/mypage/favorites` — お気に入りバイク一覧（API連携）
- [ ] `/mypage/reviews` — レビュー管理（投稿済み・投稿可能）
- [ ] `/mypage/card` — Squareカード管理
- [ ] `/mypage/notifications` — 通知一覧（既読/未読管理）
- [ ] `/mypage/messages` — ベンダーとのメッセージ
- [ ] `/mypage/history` — 利用履歴（API連携）
- [ ] `/mypage/settings` — アカウント設定（メール変更、パスワード変更、退会）

### 3-4. お問い合わせフォーム機能化

- [ ] `app/(public)/contact/page.tsx` — API送信接続

---

## Phase 4: ベンダーダッシュボード実データ化

> UIは完成済み。バックエンドAPIをSupabase接続する。

### 4-1. 車両管理API

- [ ] `GET /api/vendor/bikes` — 自店舗バイク一覧（Supabase）
- [ ] `POST /api/vendor/bikes` — 新規バイク登録
- [ ] `GET /api/vendor/bikes/[id]` — バイク詳細
- [ ] `PUT /api/vendor/bikes/[id]` — バイク更新
- [ ] `DELETE /api/vendor/bikes/[id]` — バイク削除（論理削除）
- [ ] 車両一覧ページ・新規登録ページのAPI接続

### 4-2. オプション/ギア管理API

- [ ] `GET/POST /api/vendor/options` — オプション一覧・作成
- [ ] `PUT/DELETE /api/vendor/options/[id]` — オプション更新・削除
- [ ] ギア一覧・新規登録ページのAPI接続

### 4-3. 店舗管理API

- [ ] `GET/PUT /api/vendor/shop` — 店舗情報取得・更新
- [ ] `GET/POST/PUT/DELETE /api/vendor/closures` — 休業日管理
- [ ] `GET/PUT /api/vendor/business-hours` — 営業時間管理
- [ ] 店舗設定ページのAPI接続

### 4-4. クーポン管理API

- [ ] `GET/POST /api/vendor/coupons` — Supabase接続
- [ ] `GET/PUT/DELETE /api/vendor/coupons/[id]` — Supabase接続
- [ ] クーポン一覧・新規・編集ページのAPI接続

### 4-5. お知らせ管理API

- [ ] `GET/POST /api/vendor/announcements` — Supabase接続
- [ ] `GET/PUT/DELETE /api/vendor/announcements/[id]` — Supabase接続

### 4-6. 分析データAPI

- [ ] `/api/vendor/analytics/shop-pv` — 実PVデータ取得
- [ ] `/api/vendor/analytics/bike-pv` — 実PVデータ取得
- [ ] `/api/vendor/analytics/shop-performance` — 予約実績集計
- [ ] `/api/vendor/analytics/bike-performance` — 車両別実績集計
- [ ] PV記録の仕組み（ページアクセス時にログ挿入）

### 4-7. データ出力

- [ ] `/api/vendor/exports/insurance` — 保険データExcel出力（Supabase接続）
- [ ] `/api/vendor/exports/rental-record` — 貸渡実績Excel出力
- [ ] `/api/vendor/exports/royalty` — ロイヤリティExcel出力
- [ ] `/api/vendor/exports/logs` — ログExcel出力

### 4-8. レビュー管理

- [ ] `GET /api/vendor/shop-reviews` — Supabase接続
- [ ] `PUT /api/vendor/shop-reviews/[id]` — 返信機能

### 4-9. メッセージ・問合せ

- [ ] メッセージ機能のSupabase接続
- [ ] 問合せ一覧のSupabase接続

---

## Phase 5: 管理者ダッシュボード実データ化

### 5-1. 管理者RBAC基盤（PRODUCTION_GUIDE §4/§16準拠）

- [ ] `ADMIN_ROLES` 3層ロール実装
  - super_admin（スーパー管理者: 全権限）
  - admin（管理者: ユーザー管理、設定変更）
  - moderator（モデレーター: 閲覧のみ）
- [ ] `PERMISSION_MATRIX` 権限マトリクス実装
- [ ] `isAdminAsync()` 二重チェック実装（環境変数 `ADMIN_EMAILS` + DBの `admins` テーブル）
- [ ] `GET /api/admin/check` — タイミング攻撃防止付き管理者判定API
  - `enforceMinDelay(200ms)` で全レスポンスパスの処理時間を均一化
- [ ] `checkBan()` — BAN判定パターン実装（プロフィールフラグ + `banned_users` テーブル）
- [ ] 管理画面レイアウト（ダークテーマ）
  - 権限フィルタ付きサイドバー（`hasPermission()` でメニュー制御）

### 5-2. 管理API Supabase接続

- [ ] `GET /api/admin/stats` — ダッシュボード統計（`Promise.all` 並列クエリ）
- [ ] `GET/PUT /api/admin/vendors` — ベンダー管理（承認/停止/BAN）
- [ ] `GET/PUT /api/admin/users` — ユーザー管理（BAN機能含む）
- [ ] `GET /api/admin/reservations` — 全予約管理（`service_role` でRLSバイパス）
- [ ] `GET /api/admin/reviews` — レビュー管理（非表示/削除）
- [ ] `GET /api/admin/inquiries` — お問い合わせ管理
- [ ] `GET/PUT /api/admin/settings` — システム設定
- [ ] `GET /api/admin/reports` — レポート生成

### 5-3. 管理画面ページのAPI接続

- [ ] 各管理ページのfetchをモックから実APIに切替
- [ ] 統計カードで `{ count: 'exact', head: true }` 軽量カウント活用

---

## Phase 6: 画像・ストレージ

### 6-1. 画像アップロード機能（PRODUCTION_GUIDE §18/§19準拠）

- [ ] `ImageUploader` コンポーネント作成
  - ドラッグ&ドロップ対応（`onDragOver`/`onDrop`）
  - `AnimatePresence` でプレビュー表示
  - 複数画像対応（`maxFiles` 制限）
  - バリデーション（ファイルサイズ `maxSizeMB`、MIMEタイプチェック）
  - `URL.createObjectURL` / `URL.revokeObjectURL` でメモリ管理
- [ ] `POST /api/upload` — Supabase Storageへのアップロード
  - パス構造: `{vendorId}/{bikeId}/main.jpg`
  - `cacheControl: '3600'`, `upsert: true`
  - 公開URL返却: `supabase.storage.from('bike-images').getPublicUrl()`
- [ ] `POST /api/attachments/signed-url` — 署名付きURL API
  - 当事者チェック（ベンダー所有確認）付き
  - 有効期限1時間

### 6-2. 画像表示の実装（PRODUCTION_GUIDE §19準拠）

- [ ] `next/image` での最適化表示
  - ファーストビュー画像: `priority` + `quality={80}`
  - レスポンシブ: `sizes` 属性でビューポート幅指定
- [ ] バイク画像ギャラリー（メイン + サブ画像）
- [ ] ベンダーロゴ・カバー画像
- [ ] ユーザーアバター
- [ ] 全プレースホルダーの実画像置換

### 6-3. ベンダー側画像管理

- [ ] バイク登録/編集フォームに `ImageUploader` 組み込み
- [ ] 店舗設定にロゴ・カバー画像アップロード追加
- [ ] 画像の並び替え・削除機能

---

## Phase 7: SEO・パフォーマンス

### 7-1. 構造化データ（JSON-LD）

- [ ] トップページ: `Organization` + `WebSite`（既存）
- [ ] バイク詳細: `Product` スキーマ
- [ ] ベンダー詳細: `LocalBusiness` スキーマ
- [ ] FAQ: `FAQPage` スキーマ
- [ ] パンくず: `BreadcrumbList`（全詳細ページ）

### 7-2. OGP・メタデータ強化

- [ ] 動的OGP画像生成（`@vercel/og` or 静的画像テンプレート）
- [ ] Twitter Card対応
- [ ] 各ページの`generateMetadata`精査

### 7-3. サイトマップ・robots

- [ ] 動的サイトマップ生成 (`app/sitemap.ts`)
  - 全公開ページ
  - バイク詳細（動的）
  - ベンダー詳細（動的）
- [ ] `robots.txt` 最適化
- [ ] Google Search Console連携

### 7-4. パフォーマンス（PRODUCTION_GUIDE §5/§21準拠）

- [ ] ISR/revalidate戦略の設定
  - 静的コンテンツ（規約等）: `revalidate = 86400`（24時間）
  - 準動的コンテンツ（バイク一覧、ベンダー一覧）: `revalidate = 3600`（1時間）
  - 動的コンテンツ（ダッシュボード等）: `revalidate = 0`（毎回再生成）
- [ ] ダッシュボードのPromise.all並列クエリ化
  - ベンダーTOP: 予約・売上・車両・レビューの4並列
  - 管理者TOP: 統計・ベンダー数・ユーザー数の並列
- [ ] 複合インデックス設計
  - `reservations(vendor_id, status, created_at DESC) WHERE is_deleted = FALSE`
  - `bikes(status, created_at DESC) WHERE status = 'published'`
- [ ] 画像最適化（next/image + WebP + `sizes` 属性）
- [ ] ページ遷移のプリフェッチ設定
- [ ] Core Web Vitals測定・改善
- [ ] 不要なクライアントバンドル削減

---

## Phase 8: 本番リリース準備

### 8-1. セキュリティ最終確認（PRODUCTION_GUIDE §12準拠 — 層別チェック）

**ミドルウェア層:**
- [ ] CSRF検証の有効化（middleware.ts）
- [ ] ドメイン正規化（www → naked リダイレクト）

**API層:**
- [ ] 全APIの先頭で認証チェック確認
- [ ] `safeJsonParse()` + 個別フィールド検証の確認
- [ ] エラーメッセージに内部情報が漏れていないか確認

**データベース層:**
- [ ] 全テーブルでRLS有効化の確認
- [ ] Admin操作が `service_role_key` 経由であることの確認

**フロントエンド層:**
- [ ] `escapeHtml()` がユーザー入力表示箇所で使用されていることの確認
- [ ] CSPヘッダーが正しく設定されていることの確認
- [ ] 環境変数の本番値設定

### 8-2. Cronジョブ

- [ ] 予約期限切れ処理（`/api/cron/expire-pending`）
  - 30分経過した`pending`予約を`expired`に変更
- [ ] 予約リマインダー（`/api/cron/send-reminders`）
  - 出発24時間前にメール送信
- [ ] レビュー依頼（`/api/cron/review-request`）
  - 返却3日後にレビュー依頼メール
- [ ] Vercel cron設定（`vercel.json`）

### 8-3. エラーハンドリング・監視

- [ ] グローバルエラーバウンダリ (`app/error.tsx`)
- [ ] Sentry統合グローバルエラー (`app/global-error.tsx`)（PRODUCTION_GUIDE §15準拠）
- [ ] Not Foundページ (`app/not-found.tsx`) の充実化（離脱防止リンク付き）
- [ ] Sentry セットアップ
  - `sentry.client.config.ts` / `sentry.server.config.ts` / `sentry.edge.config.ts`
  - `next.config.ts` に `withSentryConfig` 統合
  - エラー時リプレイ 100%、トレースサンプル 10%
- [ ] API共通エラーレスポンス形式の統一
- [ ] トースト通知コンポーネント（成功/エラー/警告）

### 8-4. テスト・動作確認

- [ ] 予約フロー E2Eテスト（手動）
  - バイク検索 → 詳細 → 予約 → 決済 → 完了
  - 予約確認メール受信確認
- [ ] ベンダーフロー確認
  - ログイン → ダッシュボード → 予約確認 → 出発/返却チェック
- [ ] 管理者フロー確認
  - ベンダー承認 → 予約管理 → レビュー管理
- [ ] モバイル動作確認
- [ ] クロスブラウザ確認

### 8-5. デプロイ設定

- [ ] Vercel環境変数設定（本番/ステージング）
  - `NEXT_PUBLIC_SENTRY_DSN` 追加
  - `SENTRY_ORG` / `SENTRY_PROJECT` 追加
  - `ADMIN_EMAILS` 追加
- [ ] カスタムドメイン設定（mobirio.jp）
- [ ] SSL/TLS確認
- [ ] Supabase本番プロジェクト設定
- [ ] Square本番アカウント切替

### 8-6. 運用準備

- [ ] 初期データ投入（テストベンダー、テストバイク）
- [ ] 管理者アカウント作成（`ADMIN_EMAILS` + `admins` テーブル）
- [ ] バックアップ設定
- [ ] 監視・アラート設定（Sentry + Vercel Analytics）
- [ ] `MOBIRIO_PRODUCTION_GUIDE.md` 最終同期
- [ ] Husky pre-commitフック動作確認
- [ ] ドキュメント同期ルール最終確認（PRODUCTION_GUIDE §22準拠）

---

## 実装優先度マトリクス

```
              重要度 高
                │
   Phase 0     │     Phase 2
   (基盤)      │     (決済)
                │
  ─────────────┼─────────────── 緊急度
                │
   Phase 7     │     Phase 1
   (SEO)       │     (API)
                │
              重要度 低
```

**クリティカルパス:**
```
Phase 0 (基盤) → Phase 1 (API) → Phase 2 (決済) → Phase 3 (ユーザー機能)
                                                          ↓
Phase 8 (リリース準備) ← Phase 7 (SEO) ← Phase 6 (画像) ← Phase 4 (ベンダー)
                                                          ↑
                                                    Phase 5 (管理者)
```

---

## 進捗チェックリスト

| Phase | 項目数 | 完了 | 進捗率 |
|-------|--------|------|--------|
| Phase 0: 基盤整備 | 26 | 0 | 0% |
| Phase 1: コアバックエンド | 15 | 0 | 0% |
| Phase 2: 決済・予約 | 10 | 0 | 0% |
| Phase 3: ユーザー機能 | 12 | 0 | 0% |
| Phase 4: ベンダーBE | 20 | 0 | 0% |
| Phase 5: 管理者BE | 16 | 0 | 0% |
| Phase 6: 画像 | 10 | 0 | 0% |
| Phase 7: SEO | 14 | 0 | 0% |
| Phase 8: リリース準備 | 24 | 0 | 0% |
| **合計** | **147** | **0** | **0%** |

---

## 変更履歴

| 日付 | 内容 |
|------|------|
| 2026-02-25 | ロードマップ初版作成 |
| 2026-02-25 | PRODUCTION_GUIDE更新反映: Phase 0にDB Trigger/通知ヘルパー/Husky追加、Phase 5にRBAC3層/BAN判定追加、Phase 6にImageUploader/署名付きURL追加、Phase 7にISR/並列クエリ/インデックス追加、Phase 8にSentry/層別セキュリティ追加（121→147項目） |

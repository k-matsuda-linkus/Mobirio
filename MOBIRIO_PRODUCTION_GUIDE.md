# Mobirio プロダクションガイド

**レンタルバイクプラットフォーム専用 - 本番環境対応ガイド**

**最終更新: 2026年2月25日**

---

## 目次

1. [プロジェクト概要](#1-プロジェクト概要)
2. [ミドルウェア設計（CSRF + セッション）](#2-ミドルウェア設計)
3. [認証システム](#3-認証システム)
4. [認可・権限管理（RBAC）](#4-認可権限管理)
5. [データベース設計](#5-データベース設計)
6. [APIルート設計](#6-apiルート設計)
7. [決済システム（Square）](#7-決済システム)
8. [メールシステム（Resend）](#8-メールシステム)
9. [通知システム](#9-通知システム)
10. [Cronジョブ設計](#10-cronジョブ設計)
11. [SEO最適化](#11-seo最適化)
12. [セキュリティ](#12-セキュリティ)
13. [エラーハンドリング](#13-エラーハンドリング)
14. [環境変数管理](#14-環境変数管理)
15. [デプロイ・運用](#15-デプロイ運用)
16. [管理画面設計](#16-管理画面設計)
17. [UIコンポーネント設計](#17-uiコンポーネント設計)
18. [フォーム設計](#18-フォーム設計)
19. [画像・ファイル管理](#19-画像ファイル管理)
20. [レスポンシブ・アニメーション](#20-レスポンシブアニメーション)
21. [DB読込パフォーマンス最適化](#21-db読込パフォーマンス最適化)
22. [情報管理・ドキュメント体系](#22-情報管理ドキュメント体系)
23. [コード品質チェック機構](#23-コード品質チェック機構)

---

## 1. プロジェクト概要

### 技術スタック

| カテゴリ | 技術 | バージョン |
|---------|------|----------|
| Framework | Next.js (App Router, Turbopack) | 15.5.7 |
| UI | React | 19.x |
| スタイル | Tailwind CSS v4 | 4.1.x |
| DB/Auth | Supabase (SSR) | 2.39+ |
| 決済 | Square Web Payments SDK | 44.x |
| メール | Resend | 6.9+ |
| アイコン | lucide-react | 0.562+ |
| アニメーション | framer-motion | 12.x |
| 帳票 | exceljs | 4.4+ |

### アーキテクチャ

```
app/
├── (public)/     # 公開ページ（トップ、バイク一覧/詳細、ベンダー一覧/詳細、予約、FAQ）
├── (auth)/       # 認証（ログイン、会員登録、パスワード）
├── (legal)/      # 法律・規約
├── (user)/       # ユーザーマイページ（予約、カード管理、メッセージ、クチコミ）
├── (vendor)/     # ベンダーダッシュボード（Phase 1-9、44ページ）
├── (admin)/      # 管理者ダッシュボード
└── api/          # APIルート（40+ルート）
```

### スタイル規約

- **ピクセルブラケット記法**: `px-[16px]`, `py-[8px]`, `gap-[12px]`
- **border-radius なし**: `rounded` 系クラスは使わない
- **アイコン**: lucide-react のみ使用

---

## 2. ミドルウェア設計

### 現在の構成（middleware.ts）

```typescript
// セッションチェック + パス保護
// 注意: /vendor は保護パス、/vendors は公開パス
// 厳密マッチ必須: pathname === '/vendor' || pathname.startsWith('/vendor/')
```

### CSRF検証の追加（本番環境で必須）

```typescript
// middleware.ts に追加
function handleCsrf(request: NextRequest): NextResponse | null {
  const { pathname, method } = {
    pathname: request.nextUrl.pathname,
    method: request.method,
  };

  // APIルートのみ、かつ副作用のあるメソッドのみチェック
  if (!pathname.startsWith("/api/") || ["GET", "HEAD", "OPTIONS"].includes(method)) {
    return null;
  }

  // Cron と Auth Callback は除外
  if (pathname.startsWith("/api/cron/") || pathname.startsWith("/api/auth/callback")) {
    return null;
  }

  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");
  const allowedOrigin = process.env.NEXT_PUBLIC_APP_URL;

  if (!allowedOrigin) return null; // 開発環境ではスキップ

  const isValid =
    origin === allowedOrigin ||
    referer?.startsWith(allowedOrigin);

  if (!isValid) {
    return NextResponse.json(
      { error: "CSRF検証に失敗しました" },
      { status: 403 }
    );
  }

  return null;
}
```

### middleware 統合パターン

```typescript
export async function middleware(request: NextRequest) {
  // 1. CSRF検証（本番環境のPOST/PUT/DELETE）
  const csrfError = handleCsrf(request);
  if (csrfError) return csrfError;

  // 2. セッション更新（既存処理）
  // ...既存のSupabaseセッション更新ロジック...

  // 3. 保護パスの認証チェック（既存処理）
  // ...既存の認証リダイレクトロジック...
}
```

---

## 3. 認証システム

### Supabase 3層クライアント構成

| レイヤー | ファイル | 用途 |
|---------|--------|------|
| Client | `lib/supabase/client.ts` | ブラウザ側（シングルトン） |
| Server | `lib/supabase/server.ts` | Server Components / Route Handlers |
| Middleware | `lib/supabase/middleware.ts` | ミドルウェア用（Cookie更新） |

### ユーザータイプ二重検証

```typescript
// lib/auth/actions.ts
export async function signInWithTypeCheck(
  email: string,
  password: string,
  expectedRole: "customer" | "vendor"
) {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) return { error: "メールアドレスまたはパスワードが間違っています" };

  // DB側でロールを二重確認
  const { data: user } = await supabase
    .from("users")
    .select("role")
    .eq("id", data.user.id)
    .single();

  if (!user || user.role !== expectedRole) {
    await supabase.auth.signOut();
    const roleLabel = expectedRole === "vendor" ? "ベンダー" : "ユーザー";
    return { error: `このアカウントは${roleLabel}として登録されていません` };
  }

  return { success: true };
}
```

### 認証ガード（API用）

```typescript
// lib/auth/requireAuth.ts
// 既存実装を継続利用
// 戻り値: { user, supabase } | NextResponse（401エラー）
```

### ブラウザクライアント（ダブルキャッシュ）

HMRによるクライアント重複生成を防ぐため、window + module変数の二重キャッシュを使用:

```typescript
// lib/supabase/client.ts
let moduleClient: SupabaseClient | null = null;

declare global {
  interface Window { __supabaseClient?: SupabaseClient; }
}

export function createClient(): SupabaseClient {
  if (typeof window === 'undefined') {
    return createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }
  // ダブルキャッシュ: window + module 変数
  if (window.__supabaseClient) return window.__supabaseClient;
  if (moduleClient) { window.__supabaseClient = moduleClient; return moduleClient; }

  const client = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  moduleClient = client;
  window.__supabaseClient = client;
  return client;
}
```

### DB Trigger による自動プロフィール作成

メール確認完了時にプロフィールを自動作成:

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (
    id, email, display_name, role
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'user_type', 'customer')
  ) ON CONFLICT (id) DO NOTHING;  -- 冪等性
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;  -- RLSバイパス

CREATE TRIGGER on_auth_user_confirmed
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  WHEN (OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL)
  EXECUTE FUNCTION public.handle_new_user();
```

### Auth Callback ルート

```typescript
// app/auth/callback/route.ts
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // ユーザータイプに応じたリダイレクト先を決定
      const { data: { user } } = await supabase.auth.getUser();
      const userType = user?.user_metadata?.user_type;
      const redirectTo = userType === 'vendor' ? '/vendor' : '/mypage';
      return NextResponse.redirect(new URL(redirectTo, request.url));
    }
  }

  return NextResponse.redirect(new URL('/', request.url));
}
```

---

## 4. 認可・権限管理

### ロール定義

```typescript
// Mobirioのロール構造
export const ROLES = {
  admin:    { level: 3, label: "管理者" },
  vendor:   { level: 2, label: "ベンダー" },
  customer: { level: 1, label: "ユーザー" },
} as const;
```

### 権限マトリクス（ベンダーダッシュボード用）

```typescript
export const VENDOR_PERMISSIONS: Record<string, string[]> = {
  "dashboard:view":        ["admin", "vendor"],
  "reservations:view":     ["admin", "vendor"],
  "reservations:update":   ["admin", "vendor"],
  "bikes:view":            ["admin", "vendor"],
  "bikes:edit":            ["admin", "vendor"],
  "bikes:delete":          ["admin"],
  "analytics:view":        ["admin", "vendor"],
  "exports:download":      ["admin", "vendor"],
  "shop:settings":         ["admin", "vendor"],
  "payments:record":       ["admin", "vendor"],  // 現地決済記録
  "payments:refund":       ["admin"],             // 返金処理
};
```

### API側の権限チェック

```typescript
// 予約の操作権限チェック例
const isOwner = reservation.user_id === user.id;
const isVendor = user.role === "vendor";
const isAdmin = user.role === "admin";

if (!isOwner && !isVendor && !isAdmin) {
  return NextResponse.json(
    { error: "Forbidden", message: "この操作を行う権限がありません" },
    { status: 403 }
  );
}
```

### 管理者ロール（ADMIN_ROLES）

```typescript
// lib/admin.ts
export const ADMIN_ROLES = {
  super_admin: { level: 3, label: 'スーパー管理者' },
  admin:       { level: 2, label: '管理者' },
  moderator:   { level: 1, label: 'モデレーター' },
} as const;

export const PERMISSION_MATRIX: Record<string, string[]> = {
  'dashboard:view':       ['super_admin', 'admin', 'moderator'],
  'users:view':           ['super_admin', 'admin', 'moderator'],
  'users:edit':           ['super_admin', 'admin'],
  'users:delete':         ['super_admin'],
  'vendors:view':         ['super_admin', 'admin', 'moderator'],
  'vendors:edit':         ['super_admin', 'admin'],
  'admins:invite':        ['super_admin'],
  'settings:edit':        ['super_admin'],
  'analytics:view':       ['super_admin', 'admin'],
  'email-templates:edit': ['super_admin', 'admin'],
};

export function hasPermission(role: string, permission: string): boolean {
  const allowedRoles = PERMISSION_MATRIX[permission];
  return allowedRoles?.includes(role) ?? false;
}

// 管理者判定（環境変数 + DB の二重チェック）
export async function isAdminAsync(email: string | null): Promise<{
  isAdmin: boolean;
  role: string | null;
}> {
  if (!email) return { isAdmin: false, role: null };

  // 1. 環境変数のハードコード管理者
  const adminEmails = (process.env.ADMIN_EMAILS ?? '').split(',').map(e => e.trim());
  if (adminEmails.includes(email)) {
    return { isAdmin: true, role: 'super_admin' };
  }

  // 2. DBの admins テーブル
  const supabase = getSupabaseAdmin();
  const { data } = await supabase
    .from('admins')
    .select('role')
    .eq('email', email)
    .maybeSingle();

  if (data) return { isAdmin: true, role: data.role };
  return { isAdmin: false, role: null };
}
```

### タイミング攻撃防止

管理者チェックAPIで応答時間を均一化し、ユーザーの管理者判定を推測不能にする:

```typescript
const MIN_RESPONSE_TIME = 200; // ms

async function enforceMinDelay(startTime: number) {
  const elapsed = Date.now() - startTime;
  if (elapsed < MIN_RESPONSE_TIME) {
    await new Promise(r => setTimeout(r, MIN_RESPONSE_TIME - elapsed));
  }
}

// 全レスポンスパスで同一フォーマット + 同一最小処理時間
```

### BAN判定パターン

```typescript
// 二重チェック: プロフィールフラグ + banned_users テーブル
export async function checkBan(userId: string, paymentCustomerId?: string) {
  const supabase = getSupabaseAdmin();

  // 1. プロフィールのBANフラグ
  const { data: profile } = await supabase
    .from('users')
    .select('is_banned, ban_reason')
    .eq('id', userId)
    .maybeSingle();

  if (profile?.is_banned) return { banned: true, reason: profile.ban_reason };

  // 2. banned_users テーブル（再登録防止）
  if (paymentCustomerId) {
    const { data: banned } = await supabase
      .from('banned_users')
      .select('ban_reason')
      .eq('payment_customer_id', paymentCustomerId)
      .maybeSingle();

    if (banned) return { banned: true, reason: banned.ban_reason };
  }

  return { banned: false };
}
```

---

## 5. データベース設計

### テーブル一覧（17テーブル）

| テーブル | 説明 | RLS |
|---------|------|-----|
| users | ユーザー基本情報 | 有効 |
| vendors | ベンダー情報 | 有効 |
| vendor_business_hours | 営業時間 | 有効 |
| vendor_holidays | 休業日 | 有効 |
| bikes | 車両情報 | 有効 |
| bike_pricing | 料金設定 | 有効 |
| bike_options | オプション | 有効 |
| reservations | 予約 | 有効 |
| payments | 決済記録 | 有効 |
| payouts | ペイアウト | 有効 |
| reviews | クチコミ | 有効 |
| favorites | お気に入り | 有効 |
| inquiries | 問い合わせ | 有効 |
| messages | メッセージ | 有効 |
| notifications | 通知 | 有効 |
| page_views | ページビュー | 有効 |

### ENUM型一覧

```sql
-- ユーザーロール
user_role: 'customer' | 'vendor' | 'admin'

-- 予約ステータス
reservation_status: 'pending' | 'confirmed' | 'in_use' | 'completed' | 'cancelled' | 'no_show'

-- 決済ステータス
payment_status: 'pending' | 'completed' | 'failed' | 'refunded' | 'partially_refunded'

-- 決済手段
payment_type: 'ec_credit' | 'onsite_cash' | 'onsite_credit'

-- 決済状況（予約全体）
payment_settlement: 'unpaid' | 'partial' | 'paid' | 'refunded'

-- エンジンタイプ
engine_type: 'electric' | 'single' | 'parallel_twin' | 'v_twin' | 'inline_3' | 'inline_4' | ...

-- 免許タイプ
license_type: 'none' | 'gentsuki' | 'kogata' | 'futsu' | 'oogata'

-- 車両クラス
vehicle_class: 'ev' | '50' | '125' | '250' | '400' | '950' | '1100' | '1500'

-- レンタル期間
rental_duration: '2h' | '4h' | '1day' | '24h' | '32h'
```

### payment_settlement 自動更新トリガー

```sql
-- payments テーブルの INSERT/UPDATE/DELETE 時に
-- 紐づく reservations.payment_settlement を自動計算
-- completed な決済の合計 - 返金合計 で判定:
--   全額返金 → 'refunded'
--   未払い   → 'unpaid'
--   全額払い → 'paid'
--   一部払い → 'partial'
```

### RLSポリシー設計指針

```sql
-- 1. ベンダーは自分のデータのみ操作可能
CREATE POLICY "Vendors can view own bikes"
  ON bikes FOR SELECT
  USING (
    vendor_id IN (
      SELECT id FROM vendors WHERE user_id = auth.uid()
    )
  );

-- 2. ユーザーは自分の予約のみ閲覧可能
CREATE POLICY "Users can view own reservations"
  ON reservations FOR SELECT
  USING (user_id = auth.uid());

-- 3. 公開データは誰でも閲覧可能
CREATE POLICY "Published bikes viewable by all"
  ON bikes FOR SELECT
  USING (status = 'published' AND is_deleted = FALSE);

-- 4. ベンダーが現地決済を記録できる
CREATE POLICY "Vendors can insert payments for own reservations"
  ON payments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM vendors
      WHERE vendors.id = payments.vendor_id
      AND vendors.user_id = auth.uid()
    )
  );
```

### 設計原則

1. **UUID主キー**: `gen_random_uuid()` で自動生成。auth.users との FK には auth.uid() を使用
2. **TEXT型ステータス**: PostgreSQL ENUMではなくTEXTを使用（マイグレーションの容易さ）※ Mobirio既存ENUM (`reservation_status`, `payment_type` 等) はそのまま維持
3. **TIMESTAMPTZ**: タイムゾーン付きタイムスタンプで統一
4. **RLS有効化**: 全テーブルで Row Level Security を有効化
5. **論理削除**: 関連データがある場合は `is_deleted` + `deleted_at`。関連なしなら物理削除
6. **冪等性**: `ON CONFLICT DO NOTHING` / `ON CONFLICT DO UPDATE` でUPSERT対応

### 重複防止インデックス

```sql
-- お気に入り重複防止
CREATE UNIQUE INDEX idx_favorites_unique
  ON favorites(user_id, bike_id);

-- 1ベンダーにつき1レビュー（同一ユーザー）
CREATE UNIQUE INDEX idx_reviews_unique
  ON reviews(vendor_id, user_id);
```

### 軽量カウントクエリ

統計表示用にデータ本体を転送せず件数だけ取得する:

```typescript
// head: true でレスポンスボディを空にし、count のみ返す
const { count } = await supabase
  .from('bikes')
  .select('*', { count: 'exact', head: true })
  .eq('status', 'published');
```

### ISR / revalidate パターン

ページ特性に応じてキャッシュ戦略を使い分ける:

```typescript
// 静的コンテンツ（利用規約等）: 24時間キャッシュ
export const revalidate = 86400;

// 準動的コンテンツ（バイク一覧、ベンダー一覧等）: 1時間キャッシュ
export const revalidate = 3600;

// 動的コンテンツ（ダッシュボード等）: 毎回再生成
export const revalidate = 0;
```

### マイグレーション管理

```
supabase/
├── schema.sql                              # ベーススキーマ（全テーブル定義）
└── migrations/
    └── 20260218_payment_enhancement.sql    # 差分マイグレーション
```

**マイグレーション作成ルール:**
- ファイル名: `YYYYMMDD_description.sql`
- `IF NOT EXISTS` / `IF EXISTS` で冪等性を確保
- 変更内容をコメントで明記

---

## 6. APIルート設計

### ルート構造

```
/api/
├── auth/          # 認証（callback, check, ban-check）
├── bikes/         # バイク（一覧、詳細、空き状況）
├── reservations/  # 予約（CRUD、キャンセル、チェックイン）
├── square/        # 決済（charge, refund, register-card）
├── vendors/       # ベンダー公開API
├── favorites/     # お気に入り
├── messages/      # メッセージ
├── notifications/ # 通知
├── contact/       # お問い合わせ
├── page-views/    # PV記録
├── users/         # ユーザー管理
├── options/       # オプション
├── insurance/     # 保険
├── vendor/        # ベンダー専用API（bikes, pricing, options, reservations, ...）
├── admin/         # 管理者API（vendors, users, reservations, payments, ...）
└── cron/          # 定期実行（booking-reminder, no-show, expire-pending, monthly-payout）
```

### 共通パターン

```typescript
// 全APIの先頭で認証チェック
export async function POST(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) {
    return authResult; // 401エラー
  }
  const { user, supabase } = authResult;

  // リクエストボディのパース
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON", message: "リクエストボディが不正です" },
      { status: 400 }
    );
  }

  // バリデーション
  if (!body.field?.trim()) {
    return NextResponse.json(
      { error: "Bad request", message: "フィールドは必須です" },
      { status: 400 }
    );
  }

  try {
    // DB操作（RLSが自動適用）
    const { data, error } = await supabase
      .from("table")
      .insert({ ... })
      .select()
      .single();

    if (error) throw error;

    // 非同期副作用（通知等は主処理を止めない）
    try {
      await sendNotification({ ... });
    } catch (notifyError) {
      console.error("通知送信エラー:", notifyError);
    }

    return NextResponse.json({
      success: true,
      message: "作成しました",
      data,
    });
  } catch (error) {
    console.error("エラー:", error);
    return NextResponse.json(
      { error: "Server error", message: "サーバーエラーが発生しました" },
      { status: 500 }
    );
  }
}
```

### レスポンス形式の統一

```typescript
// 成功
{ success: true, message: "日本語メッセージ", data: { ... } }

// エラー
{ error: "Error type", message: "日本語エラーメッセージ" }
```

### safeJsonParse ヘルパー

```typescript
// lib/api/helpers.ts
export async function safeJsonParse<T = unknown>(
  request: Request
): Promise<{ success: true; data: T } | { success: false; error: string }> {
  try {
    const data = await request.json();
    return { success: true, data: data as T };
  } catch {
    return { success: false, error: "リクエストボディのパースに失敗しました" };
  }
}
```

### 管理者API パターン

```typescript
// app/api/admin/users/route.ts
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: '認証が必要です' }, { status: 401 });

    // 管理者権限チェック
    const { isAdmin, role } = await isAdminAsync(user.email);
    if (!isAdmin) return NextResponse.json({ error: '権限がありません' }, { status: 403 });

    // Admin Client でRLSバイパス
    const supabaseAdmin = getSupabaseAdmin();
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json({ error: 'サーバーエラー' }, { status: 500 });
  }
}
```

### Admin Client の使い分け

| 操作 | Client | 理由 |
|------|--------|------|
| 一般ユーザーのCRUD | anon key（RLS有効） | ユーザー権限に基づくアクセス制御 |
| 管理者用全データ取得 | service_role key | RLSバイパスで全データ閲覧 |
| 署名付きURL生成 | service_role key | Storage Admin権限が必要 |
| BAN済みユーザー操作 | service_role key | 一般ユーザーアクセス不可テーブル |
| Cronジョブ | service_role key | 認証ユーザーなしでDB操作 |

---

## 7. 決済システム

### 決済フロー概要

```
[EC決済（オンライン）]
  ユーザー → Square Web SDK (tokenize) → /api/square/charge → Square API → payments テーブル
  ※ ユーザーが予約時に実行。ベンダーは関与しない

[現地決済（対面）]
  ベンダー → 決済記録モーダル → /api/vendor/reservations/[id]/payment → payments テーブル
  ※ ベンダーが予約詳細画面から記録。現地現金 or 現地クレカ
```

### 決済テーブル構造

```
reservations (1) ←→ (N) payments
  ├── payment_settlement: 予約全体の決済状況（トリガーで自動更新）
  └── total_amount: 合計金額

payments
  ├── payment_type: 'ec_credit' | 'onsite_cash' | 'onsite_credit'
  ├── amount: 決済金額
  ├── status: 'pending' | 'completed' | 'failed' | 'refunded'
  ├── refund_amount: 返金額（一部返金対応）
  ├── square_payment_id: Square決済ID（EC決済時のみ）
  └── note: 備考（ベンダーメモ）
```

### idempotencyKey（二重課金防止）

```typescript
// 全てのSquare API呼び出しで必須
const result = await paymentsApi.createPayment({
  idempotencyKey: crypto.randomUUID(), // 重要！
  sourceId,
  amountMoney: { amount: BigInt(amount), currency: "JPY" },
});
```

### リトライ + 指数バックオフ

```typescript
// lib/square/client.ts
const NON_RETRYABLE_ERRORS = [
  "CARD_DECLINED",
  "INSUFFICIENT_FUNDS",
  "CARD_EXPIRED",
  "CVV_FAILURE",
];

async function chargeWithRetry(
  sourceId: string,
  amount: number,
  maxRetries: number = 3
): Promise<ChargeResult> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await createPayment({ sourceId, amount });
      return result;
    } catch (error: any) {
      const errorCode = error?.errors?.[0]?.code;

      // リトライ不可能なエラーは即座にスロー
      if (NON_RETRYABLE_ERRORS.includes(errorCode)) {
        throw error;
      }

      if (attempt === maxRetries) throw error;

      // 指数バックオフ（1s → 2s → 4s）
      await new Promise((r) => setTimeout(r, 1000 * Math.pow(2, attempt - 1)));
    }
  }
  throw new Error("Unreachable");
}
```

### Square SDK 動的ロード（フロントエンド）

```typescript
// components/payment/SquarePaymentForm.tsx
useEffect(() => {
  const script = document.createElement("script");
  const isSandbox = process.env.NEXT_PUBLIC_SQUARE_APP_ID?.startsWith("sandbox-");
  script.src = isSandbox
    ? "https://sandbox.web.squarecdn.com/v1/square.js"
    : "https://web.squarecdn.com/v1/square.js";

  script.onload = async () => {
    const payments = window.Square.payments(
      process.env.NEXT_PUBLIC_SQUARE_APP_ID!,
      process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID!
    );
    const card = await payments.card();
    await card.attach("#card-container");
    cardRef.current = card;
  };

  document.head.appendChild(script);
  return () => { document.head.removeChild(script); };
}, []);
```

---

## 8. メールシステム

### 3層テンプレートアーキテクチャ

```
1. コードデフォルト（lib/email/templateDefaults.ts）
   → 常にフォールバック可能な基本テンプレート

2. DBカスタマイズ（email_templates テーブル）
   → 管理画面から件名・本文をカスタマイズ可能

3. テンプレートリゾルバー（lib/email/templateResolver.ts）
   → DB優先、失敗時はデフォルトにフォールバック
```

### Mobirio用メールテンプレート

| テンプレートキー | 説明 | 送信先 |
|----------------|------|-------|
| booking_confirmation | 予約確定通知 | ユーザー |
| booking_reminder | 予約リマインダー（前日） | ユーザー |
| booking_cancellation | 予約キャンセル通知 | ユーザー |
| payment_receipt | 決済完了領収書 | ユーザー |
| review_request | クチコミ依頼 | ユーザー |
| vendor_new_booking | 新規予約通知 | ベンダー |
| vendor_cancellation | キャンセル通知 | ベンダー |

### 変数置換パターン

```typescript
// lib/email/template.ts
export function resolveTemplate(
  template: string,
  vars: Record<string, string>
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] || "");
}

// 使用例
resolveTemplate(
  "{{riderName}} 様、{{bikeName}} のレンタルが確定しました",
  { riderName: "山田太郎", bikeName: "Honda CB400" }
);
```

### Resend統合

```typescript
// lib/email/send.ts
// 開発環境（RESEND_API_KEY未設定時）はコンソールログのみ
const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

export async function sendEmail(params: EmailParams): Promise<boolean> {
  if (!resend) {
    console.log("[メール] Resend未設定、送信スキップ:", params.subject);
    return false;
  }

  try {
    await resend.emails.send({
      from: process.env.EMAIL_FROM || "noreply@mobirio.jp",
      to: params.to,
      subject: params.subject,
      html: params.html,
    });
    return true;
  } catch (error) {
    console.error("[メール] 送信エラー:", error);
    return false; // 送信失敗は致命的ではない
  }
}
```

---

## 9. 通知システム

### アプリ内通知 + メール二重構造

| 通知タイプ | アプリ内 | メール | 判断基準 |
|-----------|---------|--------|---------|
| 予約確定 | ○ | ○ | 金銭が絡む重要アクション |
| 決済完了 | ○ | ○ | 金銭が絡む |
| キャンセル | ○ | ○ | 重要なステータス変更 |
| リマインダー | - | ○ | 期限付き通知 |
| メッセージ受信 | ○ | - | 日常的 |
| クチコミ依頼 | - | ○ | レンタル完了後 |

### 非同期副作用パターン

```typescript
// 通知送信エラーは主処理を止めない
try {
  await sendNotification({ userId: user.id, type: "booking_confirmed", ... });
  await sendEmail({ to: user.email, subject: "予約が確定しました", ... });
} catch (error) {
  console.error("通知送信エラー:", error);
  // エラーログのみ。主処理は成功として返す
}
```

### 通知統一ヘルパー

全てのアプリ内通知は統一ヘルパー経由で作成する。**直接 `supabase.from('notifications').insert()` は禁止。**

```typescript
// lib/notifications.ts

/** Mobirio用 通知タイプ一覧 */
export type NotificationType =
  | 'booking_confirmed'
  | 'booking_cancelled'
  | 'booking_reminder'
  | 'payment_completed'
  | 'payment_refunded'
  | 'new_message'
  | 'review_request'
  | 'review_received'
  | 'vendor_new_booking'
  | 'vendor_cancellation';

interface NotificationParams {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link: string;
  reservationId?: string | null;
}

/** 単一通知を作成 */
export async function createNotification(
  params: NotificationParams,
  client?: any
): Promise<boolean> {
  const supabase = client || getSupabaseAdmin();
  const { error } = await supabase.from('notifications').insert({
    user_id: params.userId,
    type: params.type,
    title: params.title,
    message: params.message,
    link: params.link,
    ...(params.reservationId ? { reservation_id: params.reservationId } : {}),
  });
  if (error) {
    console.error(`[通知] ${params.type} 作成エラー:`, error.message);
    return false;
  }
  return true;
}

/** 複数通知を一括作成 */
export async function createNotifications(
  notifications: NotificationParams[],
  client?: any
): Promise<boolean> {
  if (notifications.length === 0) return true;
  const supabase = client || getSupabaseAdmin();
  const rows = notifications.map(n => ({
    user_id: n.userId,
    type: n.type,
    title: n.title,
    message: n.message,
    link: n.link,
    ...(n.reservationId ? { reservation_id: n.reservationId } : {}),
  }));
  const { error } = await supabase.from('notifications').insert(rows);
  if (error) {
    console.error(`[通知] 一括作成エラー (${notifications.length}件):`, error.message);
    return false;
  }
  return true;
}
```

### 通知API

```typescript
// app/api/notifications/route.ts

// 一覧取得
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get('limit') || '20');
  const unreadOnly = searchParams.get('unread_only') === 'true';

  let query = supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user!.id)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (unreadOnly) query = query.eq('is_read', false);
  const { data } = await query;

  // 未読数も返す（head: true で軽量カウント）
  const { count } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user!.id)
    .eq('is_read', false);

  return NextResponse.json({ data, unreadCount: count });
}

// 既読化
export async function PATCH(request: NextRequest) {
  const { notificationId, markAllAsRead } = await request.json();

  if (markAllAsRead) {
    await supabase.from('notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('user_id', user!.id)
      .eq('is_read', false);
  } else if (notificationId) {
    await supabase.from('notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('id', notificationId)
      .eq('user_id', user!.id);
  }

  return NextResponse.json({ success: true });
}
```

---

## 10. Cronジョブ設計

### Vercel Cron 設定

```json
// vercel.json
{
  "crons": [
    {
      "path": "/api/cron/booking-reminder",
      "schedule": "0 0 * * *"
    },
    {
      "path": "/api/cron/expire-pending",
      "schedule": "0 * * * *"
    },
    {
      "path": "/api/cron/no-show",
      "schedule": "0 12 * * *"
    },
    {
      "path": "/api/cron/monthly-payout",
      "schedule": "0 6 1 * *"
    }
  ]
}
```

### Cron認証

```typescript
// lib/cron-auth.ts
export function verifyCronAuth(request: NextRequest): NextResponse | null {
  // 開発環境ではスキップ
  if (process.env.NODE_ENV !== "production") return null;

  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}
```

### 共通パターン

```typescript
// app/api/cron/booking-reminder/route.ts
export async function GET(request: NextRequest) {
  // 1. 認証チェック
  const authError = verifyCronAuth(request);
  if (authError) return authError;

  const supabaseAdmin = getSupabaseAdmin();
  let processed = 0;
  let errors = 0;

  try {
    // 2. 対象レコード取得（48時間以内の予約）
    const targetDate = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
    const { data: targets } = await supabaseAdmin
      .from("reservations")
      .select("id, user_id, bike_id, start_date")
      .eq("status", "confirmed")
      .lt("start_date", targetDate)
      .is("reminder_sent_at", null) // 重複防止
      .limit(500); // バッチサイズ制限

    if (!targets?.length) {
      return NextResponse.json({ message: "処理対象なし", processed: 0 });
    }

    // 3. 個別try-catch（1件の失敗で全体を止めない）
    for (const target of targets) {
      try {
        await sendReminderEmail(target);
        await supabaseAdmin
          .from("reservations")
          .update({ reminder_sent_at: new Date().toISOString() })
          .eq("id", target.id);
        processed++;
      } catch (error) {
        console.error(`リマインダー送信失敗 ID:${target.id}:`, error);
        errors++;
      }
    }

    return NextResponse.json({
      message: `完了: ${processed}件処理, ${errors}件エラー`,
      processed,
      errors,
    });
  } catch (error) {
    console.error("Cronジョブエラー:", error);
    return NextResponse.json({ error: "ジョブ実行失敗" }, { status: 500 });
  }
}

// 管理画面からの手動実行用
export async function POST(request: NextRequest) {
  return GET(request);
}
```

### Cronジョブチェックリスト

- [ ] `verifyCronAuth()` で認証チェック
- [ ] `GET` + `POST` の両方をエクスポート
- [ ] バッチサイズに上限（`limit(500)` 等）
- [ ] 個別レコードを `try-catch` で囲む
- [ ] 処理結果をJSONで返す（`processed`, `errors`）
- [ ] 冪等性を確保（`reminder_sent_at` 等で重複防止）

---

## 11. SEO最適化

### 動的メタデータ生成

```typescript
// app/(public)/bikes/page.tsx
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "https://mobirio.jp";

  return {
    title: "レンタルバイク一覧 | Mobirio",
    description:
      "全国のレンタルバイクを料金比較。50ccスクーターから大型バイクまで、あなたにぴったりの一台を見つけよう。",
    openGraph: {
      siteName: "Mobirio",
      locale: "ja_JP",
      type: "website",
      url: `${siteUrl}/bikes`,
      title: "レンタルバイク一覧 | Mobirio",
      description: "全国のレンタルバイクを料金比較",
      images: [{ url: `${siteUrl}/images/og-bikes.jpg`, width: 1200, height: 630 }],
    },
    twitter: { card: "summary_large_image" },
    robots: { index: true, follow: true },
    alternates: { canonical: `${siteUrl}/bikes` },
  };
}
```

### 構造化データ（JSON-LD）

```typescript
// components/StructuredData.tsx
export function MobirioStructuredData() {
  const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "https://mobirio.jp";

  const data = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${siteUrl}/#organization`,
        name: "Mobirio",
        url: siteUrl,
        logo: { "@type": "ImageObject", url: `${siteUrl}/images/logo.png` },
      },
      {
        "@type": "WebSite",
        "@id": `${siteUrl}/#website`,
        url: siteUrl,
        name: "Mobirio",
        publisher: { "@id": `${siteUrl}/#organization` },
        potentialAction: {
          "@type": "SearchAction",
          target: {
            "@type": "EntryPoint",
            urlTemplate: `${siteUrl}/bikes?q={query}`,
          },
          "query-input": "required name=query",
        },
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
```

### 動的サイトマップ

```typescript
// app/sitemap.ts
import type { MetadataRoute } from "next";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://mobirio.jp";

  // 1. 静的ページ
  const staticPages = ["/about", "/faq", "/contact", "/terms", "/privacy"].map(
    (path) => ({
      url: `${baseUrl}${path}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.5,
    })
  );

  // 2. ベンダー詳細ページ（DB取得）
  const supabase = getSupabaseAdmin();
  const { data: vendors } = await supabase
    .from("vendors")
    .select("id, slug, updated_at")
    .eq("status", "active");

  const vendorPages = (vendors || []).map((v) => ({
    url: `${baseUrl}/vendors/${v.slug || v.id}`,
    lastModified: new Date(v.updated_at),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  // 3. バイク詳細ページ（DB取得）
  const { data: bikes } = await supabase
    .from("bikes")
    .select("id, updated_at")
    .eq("status", "published");

  const bikePages = (bikes || []).map((b) => ({
    url: `${baseUrl}/bikes/${b.id}`,
    lastModified: new Date(b.updated_at),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  return [
    { url: baseUrl, lastModified: new Date(), changeFrequency: "daily", priority: 1.0 },
    ...staticPages,
    ...vendorPages,
    ...bikePages,
  ];
}
```

### robots.txt

```typescript
// app/robots.ts
import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://mobirio.jp";

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/vendor/", "/mypage/", "/dashboard/", "/api/"],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
```

---

## 12. セキュリティ

### セキュリティヘッダー

```typescript
// next.config.ts
const nextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};
```

### XSS対策

```typescript
// lib/sanitize.ts
const HTML_ESCAPE_MAP: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

export function escapeHtml(str: string): string {
  return str.replace(/[&<>"']/g, (char) => HTML_ESCAPE_MAP[char] || char);
}

// 注意: 1回のみエスケープ。二重エスケープを防ぐ
```

### CSPヘッダー（本番環境）

```typescript
// next.config.ts — 本番環境のみ CSP を追加
if (isProduction) {
  securityHeaders.push({
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' https://web.squarecdn.com https://sandbox.web.squarecdn.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: blob: https://*.supabase.co",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://pax.squareup.com",
    ].join('; '),
  });
}
```

### セキュリティチェックリスト（層別）

#### ミドルウェア層
- [ ] CSRF対策: Origin/Referer 検証（POST/PUT/DELETE /api/*）
- [ ] ドメイン正規化: www → naked リダイレクト
- [ ] セッション更新: 毎リクエストでトークンリフレッシュ

#### API層
- [ ] 認証チェック: 全API先頭で `requireAuth()` または `supabase.auth.getUser()`
- [ ] 入力バリデーション: `safeJsonParse()` + 個別フィールド検証
- [ ] 権限チェック: リソースの所有者 / 管理者権限
- [ ] エラーメッセージ: 内部情報を漏らさない（ユーザー向けメッセージのみ返す）

#### データベース層
- [ ] RLS有効化: 全テーブルで `ENABLE ROW LEVEL SECURITY`
- [ ] 所有者チェック: `user_id = auth.uid()` / `vendor_id` チェック
- [ ] Admin操作は `service_role_key` 経由

#### フロントエンド層
- [ ] XSS対策: ユーザー入力の `escapeHtml()`（1回のみ、二重エスケープ防止）
- [ ] セキュリティヘッダーが `next.config.ts` で設定済み
- [ ] `robots.txt` で管理画面・APIパスを Disallow

---

## 13. エラーハンドリング

### エラーバウンダリの階層設計

```
app/error.tsx                    ← グローバルエラー
app/(public)/error.tsx           ← 公開ページ用
app/(vendor)/vendor/error.tsx    ← ベンダーダッシュボード用
app/(user)/mypage/error.tsx      ← ユーザーマイページ用
app/(admin)/dashboard/error.tsx  ← 管理画面用
```

### エラーページ実装

```typescript
// app/error.tsx
"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  useEffect(() => {
    console.error("エラー:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-[16px]">
        <AlertTriangle className="w-[64px] h-[64px] text-yellow-500 mx-auto" />
        <h2 className="text-[20px] font-bold">エラーが発生しました</h2>
        <p className="text-[14px] text-gray-500">
          ページの読み込み中に問題が発生しました
        </p>
        <div className="flex gap-[16px] justify-center">
          <button
            onClick={reset}
            className="px-[24px] py-[10px] bg-[#2D7D6F] text-white font-medium"
          >
            もう一度試す
          </button>
          <a
            href="/"
            className="px-[24px] py-[10px] border border-gray-300 font-medium"
          >
            トップページへ
          </a>
        </div>
      </div>
    </div>
  );
}
```

### 404ページ（離脱防止）

```typescript
// app/not-found.tsx
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-[16px]">
        <p className="text-[80px] font-bold text-gray-200">404</p>
        <h1 className="text-[24px] font-bold">ページが見つかりません</h1>
        <div className="flex flex-col gap-[8px]">
          <Link href="/">トップページ</Link>
          <Link href="/bikes">バイクを探す</Link>
          <Link href="/vendors">ショップを探す</Link>
          <Link href="/contact">お問い合わせ</Link>
        </div>
      </div>
    </div>
  );
}
```

---

## 14. 環境変数管理

### 環境変数一覧

| 変数名 | 説明 | 必須 | 公開 |
|--------|------|------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase URL | ○ | ○ |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase 匿名キー | ○ | ○ |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase サービスロールキー | ○ | × |
| `NEXT_PUBLIC_SQUARE_APP_ID` | Square App ID | ○ | ○ |
| `SQUARE_ACCESS_TOKEN` | Square アクセストークン | ○ | × |
| `SQUARE_ENVIRONMENT` | Square環境（sandbox/production） | ○ | × |
| `SQUARE_LOCATION_ID` | Square Location ID | ○ | × |
| `RESEND_API_KEY` | Resend API キー | △ | × |
| `EMAIL_FROM` | メール送信元 | △ | × |
| `NEXT_PUBLIC_APP_URL` | アプリURL | ○ | ○ |
| `NEXT_PUBLIC_APP_NAME` | アプリ名 | ○ | ○ |
| `CRON_SECRET` | Cron認証シークレット | ○ | × |
| `ADMIN_EMAIL` | 管理者メール | ○ | × |
| `NEXT_PUBLIC_SANDBOX_MODE` | サンドボックスモード | △ | ○ |

### サービス別グルーピング

```typescript
// lib/env.ts
export function getRequiredEnv(key: string): string {
  const value = process.env[key];
  if (!value) throw new Error(`環境変数 ${key} が設定されていません`);
  return value;
}

export function getSupabaseEnv() {
  return {
    url: getRequiredEnv("NEXT_PUBLIC_SUPABASE_URL"),
    anonKey: getRequiredEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  };
}

export function getSquareEnv() {
  return {
    accessToken: getRequiredEnv("SQUARE_ACCESS_TOKEN"),
    appId: getRequiredEnv("NEXT_PUBLIC_SQUARE_APP_ID"),
    locationId: getRequiredEnv("SQUARE_LOCATION_ID"),
    environment: process.env.SQUARE_ENVIRONMENT || "sandbox",
  };
}

export function getEmailEnv() {
  return {
    apiKey: process.env.RESEND_API_KEY || null,
    from: process.env.EMAIL_FROM || "noreply@mobirio.jp",
    adminEmail: process.env.ADMIN_EMAIL || "admin@mobirio.jp",
  };
}
```

### サンドボックスモード

```
NEXT_PUBLIC_SANDBOX_MODE=true
# → 外部サービス（Supabase, Square, Resend）への接続を無効化
# → コンソール出力でメール内容を確認可能
# → モックデータで全機能をテスト可能
```

---

## 15. デプロイ・運用

### デプロイ前チェックリスト

#### ビルド
- [ ] `npm run build` が成功すること
- [ ] `npm run type-check` でエラーなし
- [ ] `npm run lint` でエラーなし

#### 環境変数
- [ ] 全必須環境変数が Vercel に設定済み
- [ ] `NEXT_PUBLIC_SANDBOX_MODE` が `false` または未設定
- [ ] `SQUARE_ENVIRONMENT` が `production`
- [ ] `CRON_SECRET` が設定されている

#### データベース
- [ ] Supabase マイグレーション実行済み
- [ ] 全テーブルで RLS が有効化されている
- [ ] トリガー（payment_settlement 自動更新）が動作確認済み

#### 決済
- [ ] Square 本番キーが設定済み
- [ ] Square Location ID が正しい
- [ ] テスト課金 → 返金の一連フローを確認済み

#### メール
- [ ] Resend API キーが設定済み
- [ ] メール送信元ドメインが認証済み
- [ ] テストメール送信を確認済み

#### SEO
- [ ] `robots.txt` で管理画面が Disallow
- [ ] OGP画像が配置済み（`/images/og-*.jpg`）
- [ ] `sitemap.ts` が正しくURL生成
- [ ] 主要ページに `generateMetadata` が設定済み

#### セキュリティ
- [ ] セキュリティヘッダーが `next.config.ts` に設定済み
- [ ] CSRF検証がミドルウェアで有効
- [ ] `escapeHtml` がユーザー入力の出力箇所で使用されている

### Pre-commit フック（Husky + lint-staged）

コミット時に自動で品質チェックを実行する:

```bash
# .husky/pre-commit
npx lint-staged         # ステージング済みファイルの ESLint --fix
rm -rf .next/dev/types  # 型キャッシュクリア（stale type防止）
npx tsc --noEmit        # TypeScript 型チェック
```

```json
// package.json（lint-staged 設定）
{
  "lint-staged": {
    "*.{ts,tsx,js,mjs}": "eslint --fix"
  }
}
```

**なぜ型キャッシュをクリアするか:** Next.js の開発サーバーは `.next/dev/types` に型情報をキャッシュする。古いキャッシュが残っていると `tsc --noEmit` が偽の成功を返す場合がある。

### Sentry エラー監視統合

```typescript
// sentry.client.config.ts
import * as Sentry from '@sentry/nextjs';

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    tracesSampleRate: 0.1,           // 10%のトレース記録
    replaysSessionSampleRate: 0,      // セッションリプレイ無効
    replaysOnErrorSampleRate: 1.0,    // エラー時のリプレイは100%
    environment: process.env.NODE_ENV,
  });
}
```

```typescript
// next.config.ts（Sentry統合）
import { withSentryConfig } from '@sentry/nextjs';

export default process.env.NEXT_PUBLIC_SENTRY_DSN
  ? withSentryConfig(nextConfig, {
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      silent: true,
      widenClientFileUpload: true,
      sourcemaps: { deleteSourcemapsAfterUpload: true },
      disableLogger: true,
    })
  : nextConfig;
```

### 運用監視

| 項目 | 方法 |
|------|------|
| エラー監視 | **Sentry** — エラー自動キャプチャ、アラート通知、リプレイ |
| パフォーマンス | Sentry Performance — トレース、トランザクション監視 |
| Cronジョブ | レスポンスの `processed` / `errors` カウント |
| 決済 | Square ダッシュボード + DB のステータス照合 |
| メール配信 | Resend ダッシュボード |
| Web Vitals | Vercel Analytics + Core Web Vitals |
| DB | Supabase ダッシュボード（接続数、クエリパフォーマンス） |

---

## 16. 管理画面設計

### レイアウト構成

```typescript
// app/(admin)/layout.tsx
'use client';
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/admin/check')
      .then(res => res.json())
      .then(data => {
        if (data.isAdmin) {
          setIsAuthorized(true);
          setUserRole(data.role);
        } else {
          window.location.href = '/';
        }
      });
  }, []);

  if (!isAuthorized) return <div>認証確認中...</div>;

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      <header className="fixed top-0 left-0 right-0 h-[64px] bg-gray-800 border-b border-gray-700 z-50">
        <h1>管理ダッシュボード</h1>
      </header>
      <aside className="fixed left-0 top-[64px] bottom-0 w-[240px] bg-gray-800 overflow-y-auto">
        <nav>
          {menuItems
            .filter(item => hasPermission(userRole!, item.requiredPermission))
            .map(item => (
              <Link key={item.href} href={item.href}>{item.label}</Link>
            ))}
        </nav>
      </aside>
      <main className="ml-[240px] mt-[64px] p-[32px]">
        {children}
      </main>
    </div>
  );
}
```

### デザイントークン（ダークテーマ）

```typescript
export const colors = {
  background: {
    page: 'bg-gray-900',
    card: 'bg-gray-800',
    hover: 'bg-gray-750',
    input: 'bg-gray-700',
  },
  text: {
    primary: 'text-gray-100',
    secondary: 'text-gray-400',
    muted: 'text-gray-500',
  },
  status: {
    success: 'bg-green-500/20 text-green-400 border border-green-500/30',
    warning: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
    error: 'bg-red-500/20 text-red-400 border border-red-500/30',
    info: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
  },
};
```

### CRUD一覧画面の共通パターン

```
┌─────────────────────────────────────────────┐
│  統計カード (4列グリッド)                      │
│  [総数] [アクティブ] [今月新規] [要対応]        │
├─────────────────────────────────────────────┤
│  フィルターバー                               │
│  [検索] [ステータス ▼] [+新規]                │
├─────────────────────────────────────────────┤
│  データテーブル (ソート対応)                    │
│  名前 ↕ | ステータス | 登録日 ↕ | 操作        │
└─────────────────────────────────────────────┘
```

---

## 17. UIコンポーネント設計

### 基本UIコンポーネント（label / error / helperText 3層パターン）

```typescript
// components/ui/Input.tsx
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className, id, required, ...props }, ref) => {
    const inputId = id || `input-${label?.replace(/\s/g, '-')}`;

    return (
      <div className="space-y-[4px]">
        {label && (
          <label htmlFor={inputId} className="block text-[14px] font-medium text-gray-700">
            {label}
            {required && <span className="text-red-500 ml-[4px]">*</span>}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`
            w-full px-[12px] py-[8px] border
            focus:ring-2 focus:ring-[#2D7D6F] focus:border-[#2D7D6F]
            ${error ? 'border-red-500' : 'border-gray-300'}
            ${className || ''}
          `}
          {...props}
        />
        {error && <p className="text-[12px] text-red-500">{error}</p>}
        {!error && helperText && <p className="text-[12px] text-gray-500">{helperText}</p>}
      </div>
    );
  }
);
```

### Buttonコンポーネント（Framer Motion付き）

```typescript
// components/ui/Button.tsx
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'accent' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

const variants = {
  primary: 'bg-[#2D7D6F] text-white hover:bg-[#256B5F]',
  secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300',
  accent: 'bg-accent text-white hover:opacity-90',
  outline: 'border-2 border-[#2D7D6F] text-[#2D7D6F] hover:bg-[#2D7D6F]/10',
};

const sizes = {
  sm: 'px-[12px] py-[6px] text-[14px]',
  md: 'px-[16px] py-[8px] text-[16px]',
  lg: 'px-[24px] py-[12px] text-[18px]',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', isLoading, children, disabled, ...props }, ref) => {
    return (
      <motion.button
        ref={ref}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={`
          font-medium transition-colors
          disabled:opacity-50 disabled:cursor-not-allowed
          ${variants[variant]} ${sizes[size]}
        `}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <span className="flex items-center gap-[8px]">
            <span className="animate-spin h-[16px] w-[16px] border-2 border-current border-t-transparent rounded-full" />
            処理中...
          </span>
        ) : children}
      </motion.button>
    );
  }
);
```

---

## 18. フォーム設計

### マルチステップフォームの構造

```typescript
// 型定義を別ファイルに切り出す
export interface FormData {
  // Step 1: 基本情報
  name: string;
  email: string;
  // Step 2: 詳細情報
  categories: string[];
  description: string;
  // Step 3: 画像
  avatar: File | null;
  portfolio: File[];
}

export interface FormErrors {
  [K in keyof FormData]?: string;
}
```

```typescript
// 親コンポーネント
export function RegistrationForm() {
  const [formData, setFormData] = useState<FormData>(initialState);
  const [errors, setErrors] = useState<FormErrors>({});

  const updateField = <K extends keyof FormData>(key: K, value: FormData[K]) => {
    setFormData(prev => ({ ...prev, [key]: value }));
    // フィールド更新時にエラーをクリア
    if (errors[key]) setErrors(prev => ({ ...prev, [key]: undefined }));
  };

  return (
    <form onSubmit={handleSubmit}>
      <BasicInfoSection data={formData} errors={errors} onChange={updateField} />
      <DetailSection data={formData} errors={errors} onChange={updateField} />
      <ImageSection data={formData} errors={errors} onChange={updateField} />
      <Button type="submit">登録する</Button>
    </form>
  );
}
```

### 画像アップローダー（ドラッグ&ドロップ対応）

```typescript
// components/forms/ImageUploader.tsx
export function ImageUploader({
  files, onChange, maxFiles = 5, maxSizeMB = 5,
}: ImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);

  const validateFile = (file: File): string | null => {
    if (file.size > maxSizeMB * 1024 * 1024) return `${maxSizeMB}MB以下の画像を選択してください`;
    if (!file.type.startsWith('image/')) return '画像ファイルを選択してください';
    return null;
  };

  const handleFiles = (newFiles: FileList) => {
    const validated = Array.from(newFiles)
      .filter(f => !validateFile(f))
      .slice(0, maxFiles - files.length);
    onChange([...files, ...validated]);
  };

  return (
    <div
      onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={e => { e.preventDefault(); setIsDragging(false); handleFiles(e.dataTransfer.files); }}
      className={`border-2 border-dashed p-[32px] text-center transition-colors
        ${isDragging ? 'border-[#2D7D6F] bg-[#2D7D6F]/5' : 'border-gray-300'}`}
    >
      <input type="file" multiple accept="image/*" onChange={e => handleFiles(e.target.files!)} />
      <p>ドラッグ&ドロップまたはクリックで画像を追加</p>
      <p className="text-[12px] text-gray-500">最大{maxFiles}枚、各{maxSizeMB}MBまで</p>

      {/* プレビュー + AnimatePresence */}
      <AnimatePresence>
        {files.map((file, i) => (
          <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <img src={URL.createObjectURL(file)} alt="" className="w-[96px] h-[96px] object-cover" />
            <button onClick={() => onChange(files.filter((_, j) => j !== i))}>削除</button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
```

---

## 19. 画像・ファイル管理

### Supabase Storage 活用パターン

```typescript
// アップロード
const { data, error } = await supabase.storage
  .from('bike-images')
  .upload(`${vendorId}/${bikeId}/main.jpg`, file, {
    cacheControl: '3600',
    upsert: true,
  });

// 公開URL取得
const { data: { publicUrl } } = supabase.storage
  .from('bike-images')
  .getPublicUrl(`${vendorId}/${bikeId}/main.jpg`);

// 署名付きURL（非公開ファイル — 帳票等）
const { data: { signedUrl } } = await supabaseAdmin.storage
  .from('private-files')
  .createSignedUrl('path/to/file', 3600); // 有効期限1時間
```

### 署名付きURL API（当事者チェック付き）

```typescript
// app/api/attachments/signed-url/route.ts
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '認証が必要です' }, { status: 401 });

  const { path } = await request.json();
  const vendorId = path.split('/')[0];

  // 当事者チェック（ベンダー自身のファイルのみ）
  const { data: vendor } = await supabase
    .from('vendors')
    .select('id')
    .eq('id', vendorId)
    .eq('user_id', user.id)
    .single();

  if (!vendor) {
    return NextResponse.json({ error: 'アクセス権がありません' }, { status: 403 });
  }

  const admin = getSupabaseAdmin();
  const { data } = await admin.storage
    .from('private-files')
    .createSignedUrl(path, 3600);

  return NextResponse.json({ signedUrl: data.signedUrl });
}
```

### Next.js Image 最適化

```typescript
import Image from 'next/image';

// 背景画像（fill + cover）
<div className="relative w-full h-[400px]">
  <Image
    src="/images/hero.jpg"
    alt="ヒーロー画像"
    fill
    className="object-cover"
    priority          // ファーストビュー画像は priority
    quality={80}
    sizes="100vw"
  />
</div>

// レスポンシブ画像
<Image
  src={bikeImage}
  alt="バイク画像"
  width={400}
  height={300}
  className="object-cover"
  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
/>
```

---

## 20. レスポンシブ・アニメーション

### モバイルファーストの Tailwind パターン

```html
<!-- グリッド: 1列 → 2列 → 3列 → 4列 -->
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-[24px]">

<!-- 表示切替: モバイルのみ / デスクトップのみ -->
<div class="block md:hidden">モバイルメニュー</div>
<div class="hidden md:block">デスクトップメニュー</div>

<!-- 余白の段階調整 -->
<section class="px-[16px] md:px-[32px] lg:px-[64px] py-[48px] md:py-[80px]">

<!-- コンテンツ幅制限 -->
<div class="max-w-[1200px] mx-auto">
```

### Framer Motion パターン集

```typescript
// components/animations/FadeIn.tsx
'use client';
import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';

interface FadeInProps {
  children: React.ReactNode;
  direction?: 'up' | 'down' | 'left' | 'right' | 'none';
  delay?: number;
  duration?: number;
}

const directionOffset = {
  up: { y: 30 }, down: { y: -30 },
  left: { x: 30 }, right: { x: -30 },
  none: {},
};

export function FadeIn({ children, direction = 'up', delay = 0, duration = 0.6 }: FadeInProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, ...directionOffset[direction] }}
      animate={isInView ? { opacity: 1, x: 0, y: 0 } : {}}
      transition={{ duration, delay, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  );
}
```

```typescript
// components/animations/StaggerContainer.tsx
export function StaggerContainer({
  children,
  staggerDelay = 0.1,
}: { children: React.ReactNode; staggerDelay?: number }) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: staggerDelay } },
      }}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
      }}
    >
      {children}
    </motion.div>
  );
}
```

### ヘッダーのスクロール対応

```typescript
// 半透明 + ブラー背景の固定ヘッダー
<header className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-sm border-b">
```

---

## 21. DB読込パフォーマンス最適化

### Promise.all 並列クエリ

ダッシュボード等、複数の独立したDBクエリが必要なページでは `Promise.all` で並列実行する:

```typescript
// ベンダーダッシュボードTOPの並列クエリ例
const [
  { data: todayReservations },
  { data: monthlyRevenue },
  { count: activeVehicles },
  { data: recentReviews },
] = await Promise.all([
  supabase.from('reservations')
    .select('id, user_id, bike_id, start_date, status')
    .eq('vendor_id', vendorId)
    .gte('start_date', today)
    .lte('start_date', tomorrow),
  supabase.from('payments')
    .select('amount')
    .eq('vendor_id', vendorId)
    .eq('status', 'completed')
    .gte('created_at', startOfMonth),
  supabase.from('bikes')
    .select('*', { count: 'exact', head: true })
    .eq('vendor_id', vendorId)
    .eq('status', 'published'),
  supabase.from('reviews')
    .select('id, rating, comment, created_at')
    .eq('vendor_id', vendorId)
    .order('created_at', { ascending: false })
    .limit(5),
]);
```

### 並列クエリの設計ルール

| ルール | 説明 |
|-------|------|
| **独立性の確認** | クエリ間にデータ依存がないことを確認してから並列化 |
| **個別エラーハンドリング** | 1つのクエリ失敗で全体を止めない |
| **統計はhead:true** | カウントのみ必要な場合は `{ count: 'exact', head: true }` |
| **API fetchも混在可** | DB クエリだけでなく fetch() も Promise.all に含められる |

### 軽量SELECT（必要カラムのみ指定）

```typescript
// ❌ 全カラム取得（不要なデータも転送）
const { data } = await supabase.from('bikes').select('*');

// ✅ 必要カラムのみ（転送量削減）
const { data } = await supabase.from('bikes').select('id, name, vehicle_class, price_day');
```

### 複合インデックス設計

```sql
-- ベンダー + ステータス + 日付（予約一覧の基本パターン）
CREATE INDEX idx_reservations_vendor_status_created
  ON reservations(vendor_id, status, created_at DESC)
  WHERE is_deleted = FALSE;

-- 車両の公開ページパターン
CREATE INDEX idx_bikes_published
  ON bikes(status, created_at DESC)
  WHERE status = 'published' AND is_deleted = FALSE;
```

### ページネーション

```typescript
const PAGE_SIZE = 20;
const offset = (page - 1) * PAGE_SIZE;

const { data, count } = await supabase
  .from('bikes')
  .select('*', { count: 'exact' })
  .eq('status', 'published')
  .order('created_at', { ascending: false })
  .range(offset, offset + PAGE_SIZE - 1);

const totalPages = Math.ceil((count || 0) / PAGE_SIZE);
```

---

## 22. 情報管理・ドキュメント体系

### ドキュメント一覧

| ファイル | 用途 | 更新頻度 |
|---------|------|---------|
| `MOBIRIO_PRODUCTION_GUIDE.md` | 本ガイド（制作ルール・パターン集） | 高 |
| `ROADMAP.md` | 実装ロードマップ・進捗管理 | 高 |
| `20260218_PRODUCTION_GUIDE.md` | 社内汎用ガイド（参照元） | 低 |
| `supabase/schema.sql` | 全テーブル統合SQL | 中 |
| `supabase/migrations/` | 差分SQL | 中 |
| `types/database.ts` | TypeScript テーブル型定義 | 中 |

### ドキュメント同期ルール

以下の変更を行った場合は、**関連ドキュメントを同時更新**する:

```
マイグレーションSQL作成
  ↓ 同時に
types/database.ts を更新
  ↓ 同時に
MOBIRIO_PRODUCTION_GUIDE.md の変更履歴に追記
```

- テーブルの追加・削除 → `schema.sql` + `types/database.ts` + 変更履歴
- カラムの追加・変更 → `migrations/` + `types/database.ts` + 変更履歴
- RLS ポリシーの変更 → `migrations/` + 変更履歴
- API追加・変更 → 変更履歴
- UI大規模変更 → 変更履歴

---

## 23. コード品質チェック機構

### 多層チェックによるコード破綻防止

```
1. Pre-commit フック（自動）
   ├── lint-staged → ESLint --fix
   ├── 型キャッシュクリア
   └── tsc --noEmit → TypeScript型チェック

2. デプロイ前ビルド検証（必須）
   ├── npm run build（全変更で必須）
   └── 主要フロー手動テスト（認証/決済/middleware変更時）

3. 通知INSERT統一化（コーディングルール）
   └── 全通知は lib/notifications.ts 経由
```

### デプロイ前ビルド検証

| 変更内容 | `npm run build` | 手動テスト |
|---------|:---:|:---:|
| 通常の機能追加・修正 | **必須** | — |
| 認証・ログインフロー | **必須** | **必須** |
| 決済フロー | **必須** | **必須** |
| middleware.ts のルーティングロジック | **必須** | **必須** |
| 複数ページのレイアウト構造変更 | **必須** | **必須** |
| ドキュメントのみの変更 | — | — |

### 通知INSERT統一化ルール

```typescript
// ✅ 正しい: 統一ヘルパー経由
import { createNotification } from '@/lib/notifications';

await createNotification({
  userId: targetUserId,
  type: 'booking_confirmed',
  title: '予約が確定しました',
  message: `${bikeName} のレンタルが確定しました`,
  link: `/mypage/reservations/${reservationId}`,
  reservationId,
});

// ❌ 禁止: 直接INSERT
await supabase.from('notifications').insert({
  user_id: targetUserId,
  type: 'booking_confirmed',
  // ...
});
```

**統一ヘルパーの利点:**
- 通知タイプが `NotificationType` 型で制約される（タイプミス防止）
- エラーハンドリングが統一される
- 通知のフォーマット変更が1箇所で完結する
- `getSupabaseAdmin()` の使用が保証される（RLSバイパス）

---

## 付録: 既知のトラブルシューティング

### next/font/google ハング問題

**症状**: 外部SSD上のプロジェクトでGoogle Fontsダウンロードがタイムアウト → 無限リトライ → CPU100%超
**解決策**: `<link>` タグでCDN読み込みに変更（コンパイル時ネットワーク依存を排除）

### middleware.ts パス衝突

**症状**: `/vendors` が `/vendor` の `startsWith` に一致
**解決策**: 厳密マッチ必須

```typescript
// ○ 正しい
pathname === "/vendor" || pathname.startsWith("/vendor/")

// × 誤り（/vendors も一致する）
pathname.startsWith("/vendor")
```

### useSearchParams ハング

**症状**: Next.js App Router内で `useSearchParams` を使うとSSRリクエストが発生しハングする場合あり
**解決策**: `window.location.search` + `window.history.replaceState` で代替

### @next/swc バージョン

**注意**: `next` パッケージと `@next/swc` のバージョンは完全一致が必要（現在 15.5.7）

---

> **このガイドは Mobirio プロジェクト専用の本番環境対応ガイドです。**
> リンクス社の汎用 PRODUCTION_GUIDE.md を元に、Mobirio のアーキテクチャと
> 実装状況に合わせてカスタマイズしました。

---

## 変更履歴

実装のブラッシュアップに合わせた変更を追記形式で記録する。

### 2026-02-18（初版作成）

- ガイド全15章を新規作成
- 元ガイド（20260218_PRODUCTION_GUIDE.md）から Mobirio に適用可能な内容を抽出・カスタマイズ
- 本日の実装変更を反映済み:
  - 予約詳細ページ: EC決済確定ボタン削除、現地決済記録モーダル追加
  - 予約一覧ページ: 決済カラムを多決済手段対応に刷新（PaymentType[] + PaymentSettlement）
  - DB: `payment_type`, `payment_settlement` ENUM追加、`payments.payment_type/note/refund_amount` カラム追加、`reservations.payment_settlement` カラム追加、`payment_id` 削除
  - `types/database.ts`: PaymentType, PaymentSettlement 型追加、payments/reservations テーブル型更新
  - API: `/api/square/charge` → payment_settlement チェックに変更、payment_type追加
  - API: `/api/reservations/[id]/cancel` → payment_settlement 参照に変更
  - マイグレーション: `supabase/migrations/20260218_payment_enhancement.sql` 新規作成

### 2026-02-18（任意保険料金機能追加）

- **DB**: `system_settings` テーブル新規作成（汎用キーバリュー設定ストア）
  - `insurance_rate_motorcycle`（二輪: 126cc以上）初期値 800円/日
  - `insurance_rate_moped`（原付: 125cc以下・EV）初期値 500円/日
- **DB**: `reservations.insurance_amount` カラム追加（INTEGER DEFAULT 0）
- **API**: `/api/admin/insurance-rates` 新規作成（GET/PUT、Supabase直結）
- **管理画面**: `dashboard/settings/page.tsx` に任意保険料金セクション追加（DB読み書き対応）
- **料金ロジック**: `lib/booking/pricing.ts` に `getInsuranceCategory()`, `getDefaultInsuranceRate()` 関数追加
  - ev/50 → 原付料金、125以上 → 二輪料金
- **型定義**: `types/database.ts` に `system_settings` テーブル型、`insurance_amount` フィールド追加
- **モックデータ**: 全予約に `insurance_amount` フィールド追加、`total_amount` を再計算
- **マイグレーション**: `supabase/migrations/20260218_insurance_settings.sql` 新規作成

### 2026-02-18（任意保険 拡張設定 + ロイヤリティ・EC決済手数料）

- **DB**: `system_settings` に以下のキーを追加:
  - `insurance_cost_motorcycle` / `insurance_cost_moped`（保険仕入）
  - `linkus_fee_motorcycle` / `linkus_fee_moped`（リンクス手数料）
  - `additional_one_fee_motorcycle` / `additional_one_fee_moped`（アディショナルワン手数料）
  - `royalty_bike_percent` / `royalty_moped_percent`（ロイヤリティ %）
  - `ec_payment_fee_percent`（EC決済手数料 %）
- **API**: `/api/admin/insurance-rates` を拡張（8フィールド対応）
- **API**: `/api/admin/fees` 新規作成（ロイヤリティ + EC決済手数料の GET/PUT）
- **管理画面**: 設定ページを全面改修
  - 「任意保険」セクション: 請求額 + 保険仕入 + リンクス手数料 + アディショナルワン手数料（各二輪/原付）
  - 「手数料設定（ロイヤリティ）」→「ロイヤリティ」にリネーム + EC決済手数料欄追加
  - 各セクションが独立してDB読み書き可能に
- **マイグレーション**: `supabase/migrations/20260218_insurance_extra_settings.sql` 新規作成

### 2026-02-18（事業者情報ページ新設 & 貸渡実績報告書の自動入力）

- **新規**: `lib/mock/business.ts` — 事業者情報（BusinessEntity）のインターフェース定義とモックデータ
- **新規**: `app/(vendor)/vendor/business/page.tsx` — 事業者情報ページ
  - 事業者区分（法人/個人事業主）ラジオボタン
  - 基本情報（事業者名、法人番号（法人のみ表示）、代表者名）
  - 連絡先（郵便番号、住所、電話番号、FAX、メールアドレス）
  - 担当者（担当者名、担当者電話番号）
- **修正**: `lib/constants.ts` — `VENDOR_NAV_ITEMS` にトップレベル項目「事業者情報」追加（TOPの直下、Building2アイコン）
- **修正**: `components/layout/Sidebar.tsx` — `iconMap` に `Building2` アイコン追加
- **修正**: `app/(vendor)/vendor/exports/rental-record/page.tsx` — `bizInfo` の初期値を `mockBusinessEntity` から自動入力（事業者名・住所・代表者名・電話番号・担当者名）
- **修正**: `app/(vendor)/vendor/shop/[id]/page.tsx` — 法人名フィールドに「事業者情報」ページへのリンク追加（ExternalLinkアイコン付き）

### 2026-02-19（車両編集ページ改修 & ENGINE_TYPES/LICENSE_TYPES 修正）

- **修正**: `lib/constants.ts` — ENGINE_TYPES を DB `EngineType` に準拠（inline_3, inline_4, supercharged_inline_4, flat_6 に変更）、LICENSE_TYPES を DB `LicenseType` に準拠（none, gentsuki, kogata, futsu, oogata の5値に縮小）
- **拡張**: `types/booking.ts` — `Bike` インターフェースに16フィールド追加（model_code, frame_number, display_name, color, model_year, first_registration, inspection_expiry, registration_number, insurance_status, equipment, is_long_term, is_published, youtube_url, notes_html, current_mileage, display_order, suspension_periods, created_at, updated_at）
- **修正**: `lib/mock/bikes.ts` — engine_type 値修正（twin→parallel_twin, triple→inline_3, four→inline_4/supercharged_inline_4/flat_6）、license_type 値修正（ogata→oogata）、全17件に新規フィールド追加
- **改修**: `app/(vendor)/vendor/bikes/[id]/edit/page.tsx` — ハードコードmockDataを削除し mockBikes からデータ読み込みに変更。新規セクション3つ追加:
  - 「スペック情報」セクション（engine_type select, seat_height, weight, license_type select）
  - 「紹介文」セクション（description textarea）
  - 「料金設定」セクション（vehicle_class select + 7料金入力、126cc以上で2時間プラングレーアウト）
  - 「車両属性設定」に is_featured チェックボックス・display_order 入力追加

### 2026-02-20（ベンダーダッシュボード UI/UX 改修 — おすすめ5案実装）

#### 施策2: 配色変更（ウォームニュートラル）
- **変更**: `app/globals.css` — @themeに新規CSS変数追加（--color-sub: #6B8E6B, --color-sub-light: #8BAF8B, --color-base: #FAFAF8, --color-surface: #F5F3EF）。`.vendor-theme`スコープで accent を テラコッタオレンジ（#D4763C）に変更（公開ページは元のティールグリーン維持）
- **変更**: `components/vendor/StatusBadge.tsx` — ハードコード `#2D7D6F` 6箇所を `bg-accent/10 text-accent` に置換（confirmed, published, active, insurance_active, pay_completed, paid）
- **変更**: `lib/constants.ts` — RESERVATION_STATUSES の confirmed カラーを `bg-accent/10 text-accent` に変更。LAYOUT に `iconRailWidth: 60`, `topBarHeight: 56` 追加

#### 施策1: ナビゲーション変更（コンパクトアイコンレール + スライドパネル + コマンドパレット）

- **新規**: `lib/vendor-nav.ts` — ピン留め・最近のページ localStorage ヘルパー（getRecentPages, addRecentPage, getPinnedPages, togglePinPage）
- **新規**: `components/vendor/IconRail.tsx` — 60px幅アイコンレール（左固定配置、VENDOR_NAV_ITEMSアイコン表示、ホバーでSlidePanel展開、アクティブグループに左ボーダーaccent色）
- **新規**: `components/vendor/SlidePanel.tsx` — 240px幅スライドパネル（framer-motion AnimatePresenceでスライドイン/アウト、サブメニュー表示、ピン留め星アイコンToggle）
- **新規**: `components/vendor/VendorTopBar.tsx` — 56px高トップバー（ページタイトル自動解決、StoreSelector、通知ベル、Cmd+Kコマンドパレットヒントボタン）
- **新規**: `components/vendor/CommandPalette.tsx` — コマンドパレット（Cmd+K/Ctrl+Kグローバル起動、全ナビ項目平坦化検索、矢印キーナビ+Enter遷移、最近のページセクション、framer-motionフェード）
- **新規**: `components/vendor/VendorNavigation.tsx` — 統合親コンポーネント（IconRail+SlidePanel+VendorTopBar+CommandPalette統合、VendorStoreContext export、モバイル全画面メニュー対応）
- **変更**: `app/(vendor)/vendor/layout.tsx` — 旧Sidebar（260px幅）から新ナビゲーション（60pxアイコンレール+スライドパネル+トップバー）に切り替え。mainのml変更（260px→60px）、pt-[56px]追加、bg-gray-50→bg-base
- **修正**: `components/vendor/dashboard/KpiCard.tsx` — className重複による型エラーを修正（spread構文での上書きを条件分岐に変更）
- **備考**: 旧Sidebar.tsxは他レイアウト（admin, user）で使用中のため削除せず

#### 施策3: ダッシュボードTOP全面刷新
- **新規**: `components/vendor/dashboard/GreetingBanner.tsx` — 時間帯別挨拶（おはよう/こんにちは/お疲れさま）+ date-fns ja ロケール日本語日時、accent色グラデーション背景、1分毎自動更新
- **新規**: `components/vendor/dashboard/KpiCard.tsx` — KPI個別カード（アイコン、値、前期比較↑↓→、href指定でLink化、accentColorカスタマイズ可）
- **新規**: `components/vendor/dashboard/KpiGrid.tsx` — 4列レスポンシブグリッド（1→2→4列）
- **新規**: `components/vendor/dashboard/DayTimeline.tsx` — 本日スケジュール（8:00〜20:00時間軸、出発=accent色/返却=sub色ドット、予約IDリンク付き）
- **新規**: `components/vendor/dashboard/VehicleStatusBoard.tsx` — 車両ステータスボード（利用可能=緑/貸出中=青/メンテ=黄/予約済=紫、左ボーダー色分け、車両リスト最大3件+N台表示）
- **新規**: `components/vendor/dashboard/MiniSalesChart.tsx` — CSS棒グラフ（外部ライブラリ不要、最大120px高、当月強調表示、万円単位表示）
- **新規**: `components/vendor/dashboard/NoticePanel.tsx` — お知らせパネル（NEWバッジ付き、すべて表示→リンク）
- **変更**: `app/(vendor)/vendor/page.tsx` — 全面書き換え。レイアウト: GreetingBanner → KpiGrid(4列) → DayTimeline(60%)+VehicleStatusBoard(40%) → MiniSalesChart(50%)+NoticePanel(50%)

#### 施策4: 予約一覧にカンバンビュー追加
- **新規**: `components/vendor/ViewToggle.tsx` — 汎用ビュー切替コンポーネント（アイコン+ラベル、アクティブ=accent色、施策5でも再利用）
- **新規**: `components/vendor/FilterChips.tsx` — 汎用フィルターチップUI（検索条件をチップ可視化、個別削除X ボタン、+フィルター追加ボタン）
- **新規**: `components/vendor/KanbanBoard.tsx` — カンバンボード本体（4列: 未確定=橙/確定済=緑/利用中=青/完了=灰、横スクロール対応）
- **新規**: `components/vendor/KanbanColumn.tsx` — カンバン列（border-t-[3px]色付き、bg-surface背景、件数カウント）
- **新規**: `components/vendor/KanbanCard.tsx` — 予約カード（予約番号リンク、車両名、顧客名、日時、金額、hover:shadow-md）
- **変更**: `app/(vendor)/vendor/reservations/page.tsx` — ViewToggle追加（テーブル/カンバン切替）、FilterChips追加（検索条件チップ表示）、viewMode条件分岐で既存テーブルとKanbanBoard切替

#### 施策5: 車両一覧にカード型グリッド追加
- **新規**: `components/vendor/PublishToggle.tsx` — 公開/非公開 矩形トグルスイッチ（角型スライダー、border-radius禁止準拠、公開=accent色右寄せ/非公開=gray左寄せ、アニメーション付き）
- **新規**: `components/vendor/BikeGridCard.tsx` — バイクカード（16:9画像、稼働率バッジ(80%+=緑/50-79%=黄/<50%=赤)、車両名リンク、排気量+料金クラス、PublishToggle）
- **新規**: `components/vendor/BikeGridView.tsx` — グリッド表示コンテナ（1→2→3→4列レスポンシブ）
- **変更**: `app/(vendor)/vendor/bikes/page.tsx` — ViewToggle追加（テーブル/グリッド切替）、BikeGridView表示、公開状態変更ハンドラ、稼働率モックデータ追加

#### 施策7: 車検・法定点検アラート
- **新規**: `components/vendor/dashboard/InspectionAlertPanel.tsx` — 車検期限アラートパネル（ダッシュボードTOP用、mockBikesから期限切れ/30日以内を抽出、赤=期限切れ/橙=期限間近）
- **変更**: `components/vendor/StatusBadge.tsx` — `inspection_expired`, `inspection_expiring`, `inspection_ok` ステータス3種追加（赤/橙/緑）
- **変更**: `app/(vendor)/vendor/page.tsx` — InspectionAlertPanel をKPIカード下に追加
- **変更**: `app/(vendor)/vendor/bikes/page.tsx` — BikeRowに `inspectionExpiry` フィールド追加、車検期限列をテーブルに追加、モックデータに車検期限日付追加

#### 施策8: 出発/返却チェックリスト
- **新規**: `components/vendor/ChecklistPanel.tsx` — チェックリストパネル（departure/return 2タイプ、進捗バー、required項目マーク、全完了バッジ）
- **変更**: `app/(vendor)/vendor/reservations/[id]/page.tsx` — 出発チェックリスト（5項目）と返却チェックリスト（4項目）を追加、チェック状態管理

#### 施策9: 空状態ガイド + リッチツールチップ
- **新規**: `components/vendor/EmptyState.tsx` — 汎用空状態コンポーネント（アイコン+タイトル+説明+アクションリンク）
- **新規**: `components/vendor/RichTooltip.tsx` — CSS-onlyリッチツールチップ（group/group-hover、bg-gray-800テキスト、矢印付き）
- **変更**: `components/vendor/StatusBadge.tsx` — `title` 属性をRichTooltipに変更、STATUS_DESCRIPTIONS追加
- **変更**: 予約一覧・車両一覧・アーカイブ車両・ギア一覧・レビュー一覧 — 0件時にEmptyState表示追加

#### 施策10: タブレット用ボトムナビゲーション
- **新規**: `components/vendor/BottomNav.tsx` — モバイルボトムナビ（5項目: TOP/予約/車両/店舗/その他、md:hidden、active時accent色+上部2pxボーダー）
- **変更**: `components/vendor/VendorNavigation.tsx` — BottomNav統合、ハンバーガーボタンをメニューオープン時のみ表示に変更、モバイルメニューz-index調整（z-[45]/z-[46]）
- **変更**: `app/(vendor)/vendor/layout.tsx` — main の pb を `pb-[80px]`（BottomNav分余白確保）

### 2026-02-20（TopBarスリム化 — ヘッダー重複解消）

- **変更**: `components/vendor/VendorTopBar.tsx` — ページタイトル（h1）を削除、TopBarをツールバーに特化（StoreSelector + 通知ベル + コマンドパレットのみ）。高さを56px→48pxに削減。StoreSelector をモバイルでも常時表示に変更（`hidden md:flex` → 常時表示）。`usePathname`, `VENDOR_NAV_ITEMS`, `resolvePageTitle` の不要import/関数を削除
- **変更**: `app/(vendor)/vendor/layout.tsx` — main の `pt-[56px]` → `pt-[48px]` に同期変更（TopBar高さ変更に合わせ）
- **理由**: TopBarとVendorPageHeaderでページタイトルが重複表示されていた問題を解消。VendorPageHeaderにタイトル・パンくず・アクションボタンを一元化

### 2026-02-20（クーポン管理機能フル実装）

Phase 9「キャンペーン一覧」（プレースホルダー）を「クーポン管理」に変更。ベンダーがクーポンを作成・管理でき、ユーザーが予約時にクーポンコードを入力して割引を受けられる機能。定額・定率の両方に対応。

#### Phase 1: DB + 型定義 + 共有ロジック
- **新規**: `supabase/migrations/20260220_create_coupons.sql` — `coupons` テーブル（vendor_id, code, name, discount_type, discount_value, max_discount, usage_limit等）、`coupon_usages` テーブル（使用履歴）、reservationsに`coupon_id`カラム追加、RLS、インデックス、updated_atトリガー
- **変更**: `types/database.ts` — `CouponDiscountType`型追加、`coupons`/`coupon_usages`テーブル型追加、`Coupon`/`CouponUsage` エイリアス追加
- **変更**: `types/booking.ts` — `BookingFormData`に`couponCode?: string`追加
- **新規**: `lib/booking/coupon.ts` — `validateCoupon()`（有効期間・使用回数・対象車両・最低金額チェック）、`calculateCouponDiscount()`（定額→そのまま、定率→floor計算+max_discount上限）

#### Phase 2: ベンダー管理画面
- **変更**: `lib/constants.ts` — VENDOR_NAV_ITEMS: `campaigns`→`{ href: "/vendor/coupons", label: "クーポン管理", icon: "Ticket" }`（badge削除）
- **変更**: `components/vendor/VendorNavigation.tsx` — lucide-react importに`Ticket`追加、iconMapに`Ticket`追加
- **変更**: `components/vendor/StatusBadge.tsx` — coupon_active(配布中)、coupon_scheduled(配布予定)、coupon_expired(期限切れ)、coupon_disabled(停止中)、coupon_exhausted(枚数到達) の5ステータス追加
- **新規**: `app/(vendor)/vendor/coupons/page.tsx` — クーポン一覧（VendorDataTable使用、7カラム: コード/クーポン名/割引内容/利用状況/有効期間/ステータス/操作、モック5件）
- **新規**: `app/(vendor)/vendor/coupons/new/page.tsx` — 新規作成フォーム（code/name/description/discount_type/discount_value/max_discount/min_order_amount/usage_limit/per_user_limit/valid_from/valid_until、バリデーション付き）
- **新規**: `app/(vendor)/vendor/coupons/[id]/edit/page.tsx` — 編集フォーム（新規と同フォーム+利用状況プログレスバー+is_activeトグル+削除ボタン）
- **変更**: `app/(vendor)/vendor/campaigns/page.tsx` — `/vendor/coupons`へリダイレクト

#### Phase 3: API
- **新規**: `app/api/vendor/coupons/route.ts` — GET一覧（モック5件、pagination対応）/ POST作成（バリデーション付き）
- **新規**: `app/api/vendor/coupons/[id]/route.ts` — GET詳細 / PUT更新 / DELETE削除
- **新規**: `app/api/coupons/validate/route.ts` — POST検証（validateCoupon + calculateCouponDiscount使用、一般ユーザーアクセス可）
- **変更**: `app/api/reservations/route.ts` — couponCode対応（検証→割引計算→totalAmount反映→coupon_id/coupon_code/coupon_discount保存）

#### Phase 4: 予約フロー
- **変更**: `app/(public)/book/page.tsx` — クーポンコード入力欄+「適用」ボタン追加、/api/coupons/validate検証、成功時にPrice Summaryに割引行表示、submit時にcouponCode送信
- **変更**: `app/(vendor)/vendor/reservations/[id]/page.tsx` — COUPON_OPTIONSをdiscount_type対応モックに拡充（fixed/percentage）、割引計算をdiscount_typeに応じた動的計算に修正

### 2026-02-25（社内汎用ガイド反映 — 8新規セクション + 7既存セクション強化）

`20260218_PRODUCTION_GUIDE.md`（社内汎用Next.js SaaS制作ガイド 26セクション）の更新内容をMobirio版に反映。マルチテナントURL設計（§4: サブディレクトリ方式のrewrite + TenantLink/useTenantRouter等のラッパー）は除外（Mobirioはマルチベンダー型であり、`vendor_id` ベースのRLSデータ分離で対応済み）。Creator's Bridge固有機能（コラム、Note連携、行政お知らせ、営業リード）も除外。

#### 既存セクション強化

- **§3 認証システム**: ブラウザクライアントのダブルキャッシュ（window + module変数）、DB Trigger `handle_new_user()` による自動プロフィール作成、Auth Callback ルート（ユーザータイプ別リダイレクト）を追加
- **§4 認可・権限管理**: 管理者ロール `ADMIN_ROLES` 3層（super_admin/admin/moderator）、`PERMISSION_MATRIX` 詳細定義、`isAdminAsync()` 二重チェック（環境変数+DB）、`enforceMinDelay()` タイミング攻撃防止、`checkBan()` BAN判定パターンを追加
- **§5 データベース設計**: 設計原則6項目（UUID主キー、TEXT型ステータス、TIMESTAMPTZ、RLS、論理削除、冪等性）、重複防止インデックス、軽量カウントクエリ（`head: true`）、ISR/revalidateパターンを追加
- **§6 APIルート設計**: 管理者APIパターン（`isAdminAsync` + `getSupabaseAdmin`）、Admin Client使い分け表を追加
- **§9 通知システム**: `NotificationType` 型定義、`createNotification()` / `createNotifications()` 統一ヘルパー、通知API（一覧取得+既読化）を追加
- **§12 セキュリティ**: CSPヘッダー（Square SDK/Supabase/Google Fonts許可）、層別セキュリティチェックリスト（ミドルウェア/API/DB/フロントエンド）に再構成
- **§15 デプロイ・運用**: Husky + lint-staged pre-commitフック（ESLint→型キャッシュクリア→tsc）、Sentry エラー監視統合（client/server/next.config）、運用監視表にSentry追加

#### 新規セクション追加（§16-§23）

- **§16 管理画面設計**: ダークテーマレイアウト（ヘッダー+サイドバー+権限フィルタ）、デザイントークン定義、CRUD一覧画面の共通UIパターン
- **§17 UIコンポーネント設計**: Input 3層パターン（label/error/helperText）、Button with Framer Motion（variant/size/isLoading）、ピクセルブラケット記法準拠
- **§18 フォーム設計**: マルチステップフォーム構造（型分離+updateField+エラークリア）、画像アップローダー（ドラッグ&ドロップ+AnimatePresence+バリデーション）
- **§19 画像・ファイル管理**: Supabase Storage（upload/publicUrl/signedUrl）、署名付きURL API（当事者チェック付き）、Next.js Image最適化（fill/priority/sizes）
- **§20 レスポンシブ・アニメーション**: モバイルファーストTailwindパターン、FadeIn（方向指定+useInView）、StaggerContainer/StaggerItem、ヘッダースクロール対応
- **§21 DB読込パフォーマンス最適化**: Promise.all並列クエリ（設計ルール4項目）、軽量SELECT、複合インデックス設計、ページネーション（.range()）
- **§22 情報管理・ドキュメント体系**: ドキュメント一覧表、ドキュメント同期ルール（マイグレーション→型定義→変更履歴の同時更新）
- **§23 コード品質チェック機構**: 多層チェック体系（pre-commit→ビルド検証→コーディングルール）、デプロイ前ビルド検証マトリクス、通知INSERT統一化ルール

### 2026-02-26（保険契約証明書PDF管理システム追加）

- **型定義**: `types/insurance.ts` 新規作成（ParsedVehicleRecord, InsuranceCertificateRecord, InsuranceCertificate）
- **PDF解析エンジン**: `lib/pdf/parseInsuranceCertificate.ts` 新規作成
  - pdfjs-dist によるパスワード付きPDF解析
  - 全角→半角正規化、車台番号・登録番号の正規化関数
  - 「明細番号」出現で車両ブロック分割、正規表現でフィールド抽出
- **車両マッチング**: `lib/pdf/matchVehicles.ts` 新規作成
  - アクティブ車両 + アーカイブ車両の両方で照合
  - 優先順: 車台番号完全一致 → 登録番号完全一致 → unmatched
- **モックデータ**: `lib/mock/insuranceCertificates.ts` 新規作成
  - アーカイブバイク2台（PCX 160, CBR250RR）
  - 2026年1月（17台）、2月（19台=17アクティブ+2アーカイブ）の証明書データ
- **API**: 4エンドポイント新規作成
  - `POST /api/admin/insurance-certificates/upload` — PDFアップロード＆パース（multipart/form-data、10MB上限、パスワードメモリ内処理のみ）
  - `GET /api/admin/insurance-certificates` — 証明書一覧取得（year, monthフィルタ）
  - `GET /api/admin/insurance-certificates/alert` — 当月25日以降の未アップロードアラート
  - `PATCH /api/admin/insurance-certificates/[id]/records/[recordId]` — 手動紐付け更新
- **管理画面**: `app/(admin)/dashboard/insurance/page.tsx` 新規作成
  - 年月セレクター、サマリー表示、車両テーブル（12カラム）
  - 未紐付け車両にはバイク選択ドロップダウンで手動紐付け
  - アーカイブ車両には「（解約済）」ラベル
- **モーダル**: `components/admin/InsurancePdfUploadModal.tsx` 新規作成
  - 年月選択 + PDFファイル選択 + パスワード入力
  - 同月データ既存時の上書き警告
  - アップロード結果プレビュー（台数・紐付け状況）
- **ナビゲーション**: `lib/constants.ts` の ADMIN_NAV_ITEMS に `{ href: "/dashboard/insurance", label: "保険証明書", icon: "Shield" }` 追加（レビュー管理の前）
- **ダッシュボードTOP**: `app/(admin)/dashboard/page.tsx` に保険証明書未アップロードアラート追加（25日以降 かつ 当月未アップロード時）
- **設定ページ**: `app/(admin)/dashboard/settings/page.tsx` の任意保険セクションに保険対象車両数サマリー追加（最新証明書の台数・作成日表示、詳細リンク）
- **パッケージ**: `pdfjs-dist` 追加

### 2026-02-26（ベンダー招待フロー実装 — 外部システム連携）

- **新規**: `lib/email/vendorInvitation.ts` — ベンダー招待メールテンプレート
  - `baseTemplate()` 使用、パラメータ: inviteUrl, planLabel, regType
  - 登録種別・契約プラン表示 + マジックリンクボタン
- **新規**: `app/api/admin/vendors/invite/route.ts` — 招待リンク生成+メール送信API
  - `requireAdmin` で管理者認証
  - `supabase.auth.admin.generateLink({ type: 'invite' })` で PKCE 招待リンク生成
  - `user_metadata` に plan, regType, businessId を格納
  - `sendEmail()` (Resend) でカスタム招待メール送信
- **修正**: `app/api/auth/callback/route.ts` — PKCE フロー対応
  - `code` パラメータから `exchangeCodeForSession()` でセッション確立
  - `next` クエリパラメータによるリダイレクト先指定（デフォルト: /mypage）
- **修正**: `app/(auth)/register/vendor/page.tsx` — 招待済みユーザー対応
  - `supabase.auth.getUser()` で認証状態チェック
  - 認証済みの場合: ステップ1（アカウント情報）をスキップ、プラン表示（変更不可）
  - 未認証の場合: 従来の自主登録フロー維持
  - 登録完了画面（submitSuccess 状態）追加
- **新規**: `app/api/auth/register/vendor/route.ts` — ベンダー登録処理API
  - Supabase セッションから認証ユーザー取得
  - `users` テーブル（role: vendor）+ `vendors` テーブル（is_approved: false）にレコード作成
  - 既存ユーザーの重複登録対応（23505 エラー時はロール更新）
- **修正**: `app/(admin)/dashboard/vendors/page.tsx` — モーダルのAPI接続
  - `handleSendInvite()` を `setTimeout` モックから `fetch('/api/admin/vendors/invite')` に変更
  - 成功/エラーのフィードバック表示（sendResult state）
- **修正**: `lib/email/index.ts` — `vendorInvitationEmail` をエクスポートに追加

### 2026-02-26（Phase 0: 基盤整備 — 認証・セキュリティ・通知・エラーページ）

Phase 0 として、UIモック状態だったバックエンド接続の土台を整備。ログイン→保護ページアクセス→ロール別リダイレクトが動作する状態に。

#### Step 0-1: DB handle_new_user トリガー
- **新規**: `supabase/migrations/20260226_handle_new_user.sql` — Supabase Auth 新規ユーザー作成時に `public.users` テーブルへプロフィール自動作成する関数+トリガー（`SECURITY DEFINER`、`ON CONFLICT DO NOTHING`）。Supabase ダッシュボードの SQL Editor で手動実行が必要。

#### Step 0-2: Supabase クライアント ダブルキャッシュ
- **修正**: `lib/supabase/client.ts` — ブラウザ側 `createClient()` にモジュールレベルシングルトンキャッシュ追加。HMR での重複インスタンス生成を防止。

#### Step 0-3: 認証ページ Supabase 接続
- **修正**: `app/(auth)/login/page.tsx` — `setTimeout` モック → `supabase.auth.signInWithPassword()` 実接続。エラーメッセージ表示、URL パラメータ `redirect` 対応、ロール別リダイレクト（vendor→`/vendor`, admin→`/dashboard`, customer→`/mypage`）
- **修正**: `app/(auth)/register/page.tsx` — `setTimeout` モック → `supabase.auth.signUp()` 実接続。`user_metadata` に `full_name`, `user_type: "customer"` を格納。成功時に確認メール送信完了画面を表示。メール重複エラー対応。
- **修正**: `app/(auth)/forgot-password/page.tsx` — `setTimeout` モック → `supabase.auth.resetPasswordForEmail()` 実接続。`redirectTo` に `APP_URL + '/auth/set-password'` を指定。エラーメッセージ表示追加。
- **修正**: `app/(auth)/auth/set-password/page.tsx` — `setTimeout` モック → `supabase.auth.updateUser({ password })` 実接続。エラーメッセージ表示追加。

#### Step 0-4: Auth Callback ロール別リダイレクト
- **修正**: `app/api/auth/callback/route.ts` — `next` パラメータがない場合にユーザーロール（`users` テーブル）に基づくデフォルトリダイレクト先を決定（vendor→`/vendor`, admin→`/dashboard`, customer→`/mypage`）
- **修正**: `app/(auth)/auth/callback/page.tsx` — 3秒固定リダイレクトから、実際にセッション確認+ロール取得+ロール別リダイレクトに変更。認証失敗時のエラー表示追加。

#### Step 0-5: middleware 認証チェック有効化
- **修正**: `middleware.ts` — コメントアウトされていた認証チェックを有効化。`getSession()` → `getUser()` に変更（非推奨対応）。未認証ユーザーを `/login?redirect=<元のパス>` にリダイレクト。

#### Step 0-6: セキュリティ基盤
- **修正**: `next.config.ts` — セキュリティヘッダー追加（X-Content-Type-Options: nosniff, X-Frame-Options: DENY, Referrer-Policy: strict-origin-when-cross-origin, Permissions-Policy: camera=(), microphone=(), geolocation=()）
- **修正**: `middleware.ts` — CSRF 検証追加。POST/PUT/DELETE/PATCH リクエストに対して Origin/Referer ヘッダーチェック。`/api/cron/*` と `/api/auth/callback` は除外。`isAllowedOrigin()` でサブドメインマッチング。

#### Step 0-7: 通知ヘルパー + API
- **新規**: `lib/notifications.ts` — `createNotification()` / `createNotifications()` 統一ヘルパー。`NotificationType` 型準拠、Supabase `notifications` テーブルに直接 INSERT。
- **修正**: `app/api/notifications/route.ts` — モック返却 → `requireAuth` + Supabase 実接続。GET: 自分の通知一覧取得（最新50件、未読カウント付き）。PUT: 単一ID既読化 / `markAllRead` 一括既読化。

#### Step 0-8: エラーページ
- **新規**: `app/error.tsx` — クライアントコンポーネント。500エラー表示 + 再試行ボタン + トップへ戻るリンク。`not-found.tsx` のデザインに合わせたスタイル。
- **新規**: `app/global-error.tsx` — レイアウト自体のエラー用（html/body タグ含む）。Tailwind に依存しないインラインスタイルで最小限のエラー表示。

### 2026-02-26（Phase 1: コアバックエンド — API実データ化）

全APIにsandbox/Supabaseデュアルモードを整備。ユーザー系APIを新規作成。マイページ接続はPhase 3で実施。

#### Step 1-1: requireAuth sandbox対応
- **修正**: `lib/auth/requireAuth.ts` — `isSandboxMode()` チェック追加。sandbox時はSupabase認証をバイパスし `mockUsers[0]`（user-001、田中太郎）をデフォルトユーザーとして返却。`x-sandbox-user-id` ヘッダーでユーザー切替可能。`requireVendor()` はモックベンダー（v-001）を返却。`requireAdmin()` はroleチェックのみ（sandbox/本番共通）。

#### Step 1-2: 既存API sandbox分岐
- **修正**: `app/api/notifications/route.ts` — GET: sandbox時 `mockNotifications` を未読カウント付きで返却。PUT: sandbox時ダミー成功レスポンス。
- **修正**: `app/api/reservations/route.ts` — GET: sandbox時 `mockReservations` をuser_idフィルタ・statusフィルタ・ページネーション付きで返却。POST: sandbox時バリデーション通過後にダミー予約ID生成して成功レスポンス。
- **修正**: `app/api/reservations/[id]/route.ts` — GET: sandbox時 `mockReservations.find(r => r.id === id)` + 権限チェック。PATCH: sandbox時ステータス・権限バリデーション実行後にダミー成功。
- **修正**: `app/api/reservations/[id]/cancel/route.ts` — sandbox時 `canTransition()` によるステータス遷移バリデーション実行 → ダミー成功。

#### Step 1-3: レビューAPI フル実装
- **修正**: `app/api/reviews/route.ts` — ハードコード2件のプレースホルダーをデュアルモード実装に刷新。GET: sandbox時 `mockReviews`（10件）を `bike_id`/`vendor_id`/`user_id` フィルタ+ページネーション付きで返却。Supabase時は `reviews` テーブル + ユーザー・バイク・ベンダー結合。POST: `requireAuth` 認証 + バリデーション（rating 1-5、comment必須）、sandbox/Supabase両対応。

#### Step 1-4: お問い合わせAPI フル実装
- **修正**: `app/api/contact/route.ts` — 空プレースホルダーをフル実装に刷新。POST: name/email/subject/message全て必須バリデーション。sandbox時はログ出力のみで成功レスポンス。Supabase時は `vendor_inquiries` テーブルに保存 + 管理者メール通知（Resend経由、失敗しても問い合わせは成功扱い）。

#### Step 1-5: ユーザー系API新規作成
- **新規**: `app/api/user/profile/route.ts` — GET: 自分のプロフィール取得。PATCH: `full_name`, `phone`, `avatar_url` 更新。sandbox/Supabase両対応。
- **新規**: `app/api/user/favorites/route.ts` — GET: お気に入り一覧（バイク情報結合）。POST: `bike_id` でお気に入り追加（重複チェック付き）。DELETE: `bike_id` でお気に入り削除。sandbox/Supabase両対応。
- **新規**: `lib/mock/favorites.ts` — モックお気に入りデータ3件（user-001のbike-005, bike-006, bike-009）。
- **新規**: `app/api/user/messages/route.ts` — GET: 会話一覧（`conversation_with` パラメータで個別会話フィルタ）。POST: `receiver_id`, `body`, `reservation_id?` でメッセージ送信。sandbox/Supabase両対応。
- **新規**: `lib/mock/messages.ts` — モックメッセージデータ5件（user-001/user-002 ↔ vendor-user-001 の会話）。
- **新規**: `app/api/user/password/route.ts` — PATCH: `supabase.auth.updateUser({ password })` でパスワード変更（8文字以上バリデーション）。sandbox時ダミー成功。
- **新規**: `app/api/user/account/route.ts` — DELETE: ソフトデリート（`is_banned = true`, `banned_reason = 'ユーザー退会'`）。sandbox時ダミー成功。

### 2026-02-26（Phase 2: 決済・予約フロー完結）

決済・予約ライフサイクル全APIにsandbox対応を追加。メール通知・アプリ内通知を統合。決済ページをSquarePaymentFormに接続。

#### Step 2-1: Square API sandbox分岐
- **修正**: `app/api/square/charge/route.ts` — `isSandboxMode()` チェック追加。sandbox時は `mockReservations` から予約取得→所有者/ステータス/決済状態チェック→ダミー決済成功レスポンス（`pay-sandbox-*`, `sq-sandbox-*`）。Supabase時は既存ロジック維持 + メール・通知統合（Step 2-3a参照）。
- **修正**: `app/api/square/refund/route.ts` — `isSandboxMode()` チェック追加。sandbox時は `mockReservations` から予約取得→権限チェック→ダミー返金成功レスポンス（`ref-sandbox-*`）。Supabase時は既存ロジック維持 + 返金通知（Step 2-3b参照）。
- **修正**: `app/api/square/register-card/route.ts` — スタブから本格実装へ刷新。`requireAuth` 追加。sandbox時はダミーカードID（`card-sandbox-*`）返却。Supabase時は `saveCard()` で Square API 呼び出し→カードID返却。

#### Step 2-2: チェックイン・チェックアウト sandbox分岐
- **修正**: `app/api/reservations/[id]/checkin/route.ts` — `isSandboxMode()` チェック追加。sandbox時は `mockReservations` から予約取得→ベンダー所有チェック→ `canTransition` バリデーション→ダミー成功。Supabase時は既存ロジック維持 + チェックイン通知。
- **修正**: `app/api/reservations/[id]/checkout/route.ts` — `isSandboxMode()` チェック追加。sandbox時は `mockReservations` から予約取得→ベンダー所有チェック→ `canTransition` → 超過料金計算（モックレート ¥1,000/時間）→ダミー成功。Supabase時は既存ロジック維持 + チェックアウト通知 + レビュー依頼メール。

#### Step 2-3: メール・通知統合
- **2-3a charge成功後**: ユーザーへ `paymentReceiptEmail()` + `bookingConfirmationEmail()` 送信。ベンダーへ `vendorNewBookingEmail()` 送信。双方に `createNotification()`（type: `booking_confirmed`）。select クエリに `user:users(email, full_name)`, `vendor:vendors(..., contact_email)` を追加。ベンダー通知には `vendors.user_id` を別途取得。
- **2-3b refund成功後**: ユーザーへ `createNotification()`（type: `payment_received`, 返金額表示）。
- **2-3c cancel時返金連携**: `app/api/reservations/[id]/cancel/route.ts` 修正。決済済み予約（`square_payment_id` あり・`status: completed`）の場合 `refundPayment()` で自動返金実行 + payment レコード更新。ユーザーへ `bookingCancellationEmail()` + 通知（返金ありの場合その旨記載）。ベンダーへ `vendorCancellationEmail()` + 通知。select クエリに `payment:payments(*)`, `vendor:vendors(..., user_id)` を追加。
- **2-3d checkin/checkout後**: checkin → ユーザーへ通知（type: `booking_confirmed`）。checkout → ユーザーへ通知（超過料金がある場合は金額表示） + `reviewRequestEmail()` 送信。checkout の select クエリに `user:users(email, full_name)`, `bike:bikes(name, overtime_rate_per_hour)` を追加。
- **共通**: sandbox時はメール・通知送信をスキップ。Supabase時のメール・通知送信は非同期（`.catch()` でエラーログ出力、レスポンスはブロックしない）。

#### Step 2-4: 決済ページ改修
- **修正**: `app/(public)/book/[reservationId]/pay/page.tsx` — sandbox/本番分岐に変更。
  - **sandbox** (`NEXT_PUBLIC_SANDBOX_MODE === 'true'`): カード入力フォーム削除、テスト環境説明バナー + 「テスト決済」ボタン表示。クリック時に `/api/square/charge` を `sourceId: 'sandbox-nonce'` で呼び出し。
  - **本番**: ダミーカード入力（cardNumber/expiry/cvv）を削除。`SquarePaymentForm` コンポーネントを使用（Square Web Payments SDK による安全なカードトークン化）。`onSuccess` で `/book/[id]/complete` へリダイレクト、`onError` でエラー表示。

### 2026-02-26（Phase 3: マイページAPI接続 — 全11ページ）

Phase 1で実装済みの全APIにフロントエンドを接続。マイページ10ページ + お問い合わせ1ページのモック直埋込みをAPI取得に置換。

#### Step 3-1: ダッシュボード
- **修正**: `app/(user)/mypage/page.tsx` — Server Component → Client Component に変更。ハードコード定数（STATS, UPCOMING, NOTIFICATIONS）を削除。`useEffect` で4件の並列フェッチ（`/api/user/profile`, `/api/reservations?limit=50`, `/api/notifications`, `/api/reservations?status=completed`）。ローディングスケルトン追加。ユーザー名をAPI取得、統計値（予約中・利用回数・未読通知）をリアルデータに、直近予約（pending/confirmed最新2件）と最新通知3件をAPI取得。sandbox/Supabase両レスポンス形式に対応（`bikeName || bike?.name` フォールバック）。

#### Step 3-2: 予約一覧
- **修正**: `app/(user)/mypage/reservations/page.tsx` — RESERVATIONS定数（5件ハードコード）を削除。`activeTab` 変更時に `GET /api/reservations?status=<tab>` をフェッチ。ローディングスケルトン追加。sandbox/Supabase両レスポンス対応。

#### Step 3-3: 予約詳細
- **修正**: `app/(user)/mypage/reservations/[id]/page.tsx` — Server Component → Client Component に変更。`mockReservations` 直接import → `useEffect` で `GET /api/reservations/${id}` をフェッチ。`useParams()` でルートパラメータ取得。キャンセルボタンに `POST /api/reservations/${id}/cancel` 接続（confirm確認ダイアログ付き、成功後にデータ再取得）。ローディングスケルトン・404表示追加。

#### Step 3-4: お気に入り
- **修正**: `app/(user)/mypage/favorites/page.tsx` — Server Component → Client Component に変更。FAVORITES定数（3件）を削除。`useEffect` で `GET /api/user/favorites` をフェッチ。ハートボタンに `DELETE /api/user/favorites` + `body: { bike_id }` 接続 → ローカルstate即時反映。バイク情報（名前・メーカー・料金）はAPI結合データから取得。

#### Step 3-5: 利用履歴
- **修正**: `app/(user)/mypage/history/page.tsx` — Server Component → Client Component に変更。HISTORY定数（5件）を削除。`useEffect` で `GET /api/reservations?status=completed` をフェッチ。sandbox/Supabase両レスポンス対応。

#### Step 3-6: 通知
- **修正**: `app/(user)/mypage/notifications/page.tsx` — INITIAL_NOTIFICATIONS定数（6件）を削除。`useEffect` で `GET /api/notifications` をフェッチ。「すべて既読にする」に `PUT /api/notifications` + `{ markAllRead: true }` 接続。個別クリック既読に `PUT /api/notifications` + `{ id }` 接続。`created_at`/`timestamp` を `timeAgo()` ヘルパーで相対時間に変換。sandbox(`read`)とSupabase(`is_read`)の両フィールド名に対応。

#### Step 3-7: メッセージ
- **修正**: `app/(user)/mypage/messages/page.tsx` — CONVERSATIONS定数（3件）を削除。`useEffect` で `GET /api/user/profile`（ユーザーID取得）+ `GET /api/user/messages`（会話一覧）を並列フェッチ。会話選択時に `GET /api/user/messages?conversation_with=<partnerId>` でメッセージ一覧取得。送信ボタン・Enterキーに `POST /api/user/messages` + `{ receiver_id, body }` 接続、成功後にローカルstate即時追加。`useRef` でメッセージ末尾への自動スクロール実装。

#### Step 3-8: レビュー
- **修正**: `app/(user)/mypage/reviews/page.tsx` — Server Component → Client Component に変更。REVIEWS定数（4件）を削除。`useEffect` で `GET /api/reviews` をフェッチ。sandbox(`bikeName`/`createdAt`)とSupabase(`bike?.name`/`created_at`)の両フィールド名に対応。

#### Step 3-9: カード管理
- **修正**: `app/(user)/mypage/card/page.tsx` — カード追加フォームに `POST /api/square/register-card` + `{ sourceId, cardholderName }` 接続。sandbox時はダミー `sourceId` で呼び出し → 返却された `cardId` でローカルstate追加。フォーム入力をstate管理に変更（cardNumber, expiry, cvc, cardName）。ローディング状態・エラーハンドリング追加。カード一覧はローカル管理維持（カード一覧取得APIは未実装のため）。

#### Step 3-10: 設定
- **修正**: `app/(user)/mypage/settings/page.tsx` — プロフィール: `useEffect` で `GET /api/user/profile` → 初期値取得、`PATCH /api/user/profile` + `{ full_name, phone }` で保存。メールアドレスは `disabled` に変更（APIの更新許可フィールド外のため）。パスワード: `PATCH /api/user/password` + `{ password }` で変更。退会: `DELETE /api/user/account` → 成功時に `/login` へリダイレクト。通知設定: ローカル管理維持（APIなし）。各操作にローディング状態・成功メッセージ・エラーハンドリング追加。

#### Step 3-11: お問い合わせフォーム
- **修正**: `app/(public)/contact/page.tsx` — Server Component → Client Component に変更。フォームstate管理追加（name, email, subject, message）。`POST /api/contact` + `{ name, email, subject, message }` で送信。カテゴリselect値をsubjectとして送信。成功時に送信完了画面表示（トップページ戻りリンク付き）。バリデーションエラー表示・ローディング状態追加。

### 2026-02-26（Phase 0〜2 バグチェック＆修正）

Phase 0（認証・セキュリティ・基盤）、Phase 1（API実データ化）、Phase 2（決済・予約フロー）の全ファイルを3エージェント並列でバグチェック。合計41件検出、21件修正。

#### Critical/High 修正（前半）
- **`app/api/auth/callback/route.ts`**: profileフェッチエラーのログ出力追加
- **`app/(auth)/login/page.tsx`**: ロール別リダイレクトをtry-catch保護
- **`lib/mock/reviews.ts`**: Review型に`user_id`追加、`bikeId`→`bike_id`・`vendorId`→`vendor_id`統一（snake_case）
- **`app/api/reviews/route.ts`**: user_idフィルタリング実装（sandbox）
- **`app/(admin)/dashboard/vendors/page.tsx`**: Review型変更に伴う参照修正
- **`app/(public)/vendors/[id]/page.tsx`**: 同上
- **`lib/supabase/client.ts`**: `!`による強制アクセスを排除、環境変数チェック追加
- **`lib/supabase/server.ts`**: server/admin両方に環境変数チェック追加
- **`app/(auth)/register/page.tsx`**: signUpエラー判定にstatus 422チェック追加
- **`lib/mock/notifications.ts`**: `read`→`is_read`に統一（Supabase形式）
- **`app/api/notifications/route.ts`**: unreadCount計算を`is_read`統一 + PUTにJSONパースエラーハンドリング追加
- **`app/(user)/mypage/notifications/page.tsx`**: `is_read`のみ使用に統一
- **`app/(user)/mypage/page.tsx`**: 同上
- **`app/(public)/book/[reservationId]/pay/page.tsx`**: cancelled予約をエラー表示（complete画面にリダイレクトしない）
- **`app/api/reservations/[id]/cancel/route.ts`**: 返金失敗時にレスポンスメッセージで明示 + `refundFailed`フラグ追加
- **`app/api/reservations/[id]/checkout/route.ts`**: 超過料金を`overtime_charge`フィールドとして別途記録

#### Medium/Low 修正（後半）
- **`app/(auth)/auth/callback/page.tsx`**: profileエラー処理をtry-catch保護
- **`app/(auth)/auth/set-password/page.tsx`**: パスワード長不足時の詳細エラーメッセージ追加
- **`lib/env.ts`**: `appUrl()`で本番環境のAPP_URL未設定時にconsole.warn出力
- **`app/api/reservations/route.ts`**: 32時間超のrentalDurationを`"24h"`→`"32h"`に修正
- **`app/api/auth/check/route.ts`**: モック実装→sandbox/Supabaseデュアルモード対応（実セッション検証）
- **`app/api/auth/ban-check/route.ts`**: モック実装→sandbox/Supabaseデュアルモード対応（実BAN検証）
- **`app/api/user/account/route.ts`**: ソフトデリート後にAuth`signOut()`呼び出し追加（セッション無効化）
- **`lib/mock/users.ts`**: MockUser型に`updated_at`追加、全ユーザーデータに`updated_at`追記
- **`lib/auth/requireAuth.ts`**: `updated_at: mockUser.created_at`→`mockUser.updated_at`に修正
- **`lib/booking/status.ts`**: `no_show`から`confirmed`への復帰遷移を追加

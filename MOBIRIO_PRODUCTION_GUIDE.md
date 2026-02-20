# Mobirio プロダクションガイド

**レンタルバイクプラットフォーム専用 - 本番環境対応ガイド**

**最終更新: 2026年2月18日**

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

### セキュリティチェックリスト

- [ ] 全APIの先頭で `requireAuth()` または `supabase.auth.getUser()`
- [ ] リクエストボディは `safeJsonParse()` でパース
- [ ] リソースの所有者チェック（RLS + API二重チェック）
- [ ] エラーメッセージに内部情報を漏らさない（スタックトレース等）
- [ ] 全テーブルで RLS が有効化されている
- [ ] ユーザー入力は `escapeHtml()` で1回のみエスケープ
- [ ] `CSRF検証` がミドルウェアで有効（POST/PUT/DELETE）
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

### 運用監視

| 項目 | 方法 |
|------|------|
| エラー監視 | Vercel Functions ログ + console.error |
| Cronジョブ | レスポンスの `processed` / `errors` カウント |
| 決済 | Square ダッシュボード + DB のステータス照合 |
| メール配信 | Resend ダッシュボード |
| パフォーマンス | Vercel Analytics + Core Web Vitals |
| DB | Supabase ダッシュボード（接続数、クエリパフォーマンス） |

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

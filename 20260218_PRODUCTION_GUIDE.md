# Next.js SaaS/マッチングサービス 制作ガイド

> **株式会社リンクス — 社内制作標準**
>
> Creator's Bridge の実装ノウハウを汎用化した、Next.js App Router ベースの
> ウェブサービス制作ガイドです。新規プロジェクト立ち上げ時の設計指針として使用してください。

---

## 目次

1. [技術スタック](#1-技術スタック)
2. [プロジェクト構造](#2-プロジェクト構造)
3. [ミドルウェア設計](#3-ミドルウェア設計)
4. [マルチテナント/マルチリージョン設計](#4-マルチテナントマルチリージョン設計)
5. [認証システム](#5-認証システム)
6. [認可・権限管理](#6-認可権限管理)
7. [データベース設計](#7-データベース設計)
8. [APIルート設計](#8-apiルート設計)
9. [決済システム](#9-決済システム)
10. [メールシステム](#10-メールシステム)
11. [通知システム](#11-通知システム)
12. [Cronジョブ設計](#12-cronジョブ設計)
13. [SEO最適化](#13-seo最適化)
14. [管理画面設計](#14-管理画面設計)
15. [UIコンポーネント設計](#15-uiコンポーネント設計)
16. [フォーム設計](#16-フォーム設計)
17. [画像・ファイル管理](#17-画像ファイル管理)
18. [エラーハンドリング](#18-エラーハンドリング)
19. [セキュリティ](#19-セキュリティ)
20. [レスポンシブ・アニメーション](#20-レスポンシブアニメーション)
21. [環境変数・設定管理](#21-環境変数設定管理)
22. [デプロイ・運用](#22-デプロイ運用)
23. [データベース読込パフォーマンス最適化](#23-データベース読込パフォーマンス最適化)
24. [コンテンツ管理パターン（SEOコンテンツ自動生成）](#24-コンテンツ管理パターンseoコンテンツ自動生成)
25. [情報管理・ドキュメント体系](#25-情報管理ドキュメント体系)
26. [コード品質チェック機構](#26-コード品質チェック機構)

---

## 1. 技術スタック

### 推奨構成

| カテゴリ | 技術 | バージョン | 選定理由 |
|---------|------|-----------|---------|
| **フレームワーク** | Next.js (App Router) | 16.1.2 | Server Components, ストリーミング, Route Groups |
| **ランタイム** | React | 19.2.3 | Server Actions, use() フック |
| **認証・DB** | Supabase (Auth + PostgreSQL + Storage) | @supabase/ssr 0.8+ | RLS, リアルタイム, 統合管理 |
| **決済** | Square Web Payments | SDK v43+ | PCI DSS Level 1, Card on File |
| **メール** | Resend | 6.7+ | 開発者体験, テンプレートAPI |
| **CSS** | Tailwind CSS | 4 | ユーティリティファースト, 高速開発 |
| **アニメーション** | Framer Motion | 12+ | 宣言的アニメーション, AnimatePresence |
| **アイコン** | Lucide React | 0.563+ | 軽量, ツリーシェイキング対応 |
| **エラー監視** | Sentry (@sentry/nextjs) | 10.39+ | エラートラッキング, パフォーマンス監視 |
| **AI** | Google Generative AI | 0.24+ | コンテンツ解析, リード分析 |
| **PDF生成** | @react-pdf/renderer | 4.3+ | 帳票・請求書のPDF出力 |
| **E2Eテスト** | Playwright | 1.58+ | クロスブラウザテスト |
| **ホスティング** | Vercel | — | Next.js 最適化, Edge Functions, Cron |
| **型** | TypeScript | 5+ | 型安全, エディタ補完 |
| **Git Hooks** | Husky + lint-staged | 9+ / 16+ | Pre-commit 自動チェック |

### 不要なもの（意図的に採用しない）

| 不採用技術 | 理由 |
|-----------|------|
| UIライブラリ (shadcn/ui, MUI) | Tailwind + Lucide で十分。バンドルサイズ削減 |
| 状態管理ライブラリ (Redux, Zustand) | React Context + Supabase リアルタイムで十分 |
| ORM (Prisma, Drizzle) | Supabase クライアントSDKで十分。RLSとの相性も良い |
| CSS-in-JS (styled-components) | Tailwind でカバー。ランタイムコスト不要 |

---

## 2. プロジェクト構造

### ディレクトリ構成

```
project-root/
├── app/                          # Next.js App Router
│   ├── layout.tsx                # ルートレイアウト（html, body, 全体Provider）
│   ├── page.tsx                  # トップページ
│   ├── error.tsx                 # グローバルエラーバウンダリ
│   ├── global-error.tsx          # Sentry統合グローバルエラー
│   ├── not-found.tsx             # 404ページ
│   ├── sitemap.ts                # 動的サイトマップ生成
│   ├── robots.ts                 # robots.txt 生成
│   ├── manifest.ts               # PWA マニフェスト
│   │
│   ├── (public)/                 # 公開ページ（Route Group）
│   │   ├── about/page.tsx
│   │   ├── contact/page.tsx
│   │   └── faq/page.tsx
│   │
│   ├── (dashboard)/              # ダッシュボード（認証必須エリア）
│   │   ├── layout.tsx            # サイドバー + 認証ガード
│   │   ├── error.tsx             # ダッシュボード用エラーバウンダリ
│   │   ├── user/                 # 一般ユーザー向け
│   │   │   ├── page.tsx          # ダッシュボードトップ（Promise.all並列クエリ）
│   │   │   ├── profile/page.tsx
│   │   │   ├── settings/page.tsx
│   │   │   └── messages/page.tsx
│   │   └── provider/             # サービス提供者向け
│   │       ├── page.tsx          # ダッシュボードトップ（Promise.all並列クエリ）
│   │       └── projects/page.tsx
│   │
│   ├── (admin)/                  # 管理画面（Route Group、ダークテーマ）
│   │   ├── layout.tsx            # 管理者認証 + ダークテーマレイアウト
│   │   └── dashboard/
│   │       ├── page.tsx
│   │       ├── users/page.tsx
│   │       ├── analytics/page.tsx
│   │       └── sales-leads/      # 営業リード管理
│   │           ├── page.tsx
│   │           ├── [id]/page.tsx
│   │           └── new/page.tsx
│   │
│   ├── (legal)/                  # 法務ページ（シンプルレイアウト）
│   │   ├── terms/page.tsx
│   │   ├── privacy/page.tsx
│   │   └── legal/page.tsx
│   │
│   ├── columns/                  # SEOコンテンツ（コラム記事）
│   │   ├── page.tsx              # コラム一覧
│   │   └── [id]/page.tsx         # コラム詳細（Article JSON-LD付き）
│   │
│   ├── area/                     # 地域SEOランディングページ
│   │   ├── page.tsx              # エリア選択
│   │   └── [prefecture]/
│   │       └── [municipality]/
│   │           └── [category]/page.tsx  # 地域×職種ページ
│   │
│   ├── gov/                      # 行政連携
│   │   └── guide/page.tsx
│   │
│   ├── tools/                    # ツール系ページ
│   │   └── knowledge-vault/page.tsx
│   │
│   ├── guide/                    # 利用ガイド
│   │   ├── client/page.tsx
│   │   └── creator/page.tsx
│   │
│   ├── auth/                     # 認証関連
│   │   ├── callback/route.ts     # OAuth/Magic Link コールバック
│   │   └── confirm/page.tsx      # メール確認
│   │
│   └── api/                      # API Routes
│       ├── auth/                 # 認証エンドポイント
│       ├── projects/             # リソースCRUD
│       ├── messages/             # メッセージ
│       ├── notifications/        # 通知
│       ├── admin/                # 管理者API
│       │   └── sales-leads/      # 営業リードAPI（scrape, analyze, outreach）
│       ├── cron/                 # Cronジョブ
│       ├── columns/              # コラム記事API
│       └── {payment-provider}/   # 決済API
│
├── components/                   # UIコンポーネント
│   ├── ui/                       # 汎用UI（Button, Input, Select, Textarea）
│   ├── forms/                    # フォームコンポーネント
│   ├── admin/                    # 管理画面専用コンポーネント
│   ├── animations/               # アニメーション（FadeIn, StaggerContainer）
│   ├── gov/                      # 行政連携コンポーネント
│   ├── Header.tsx                # サイトヘッダー
│   ├── Footer.tsx                # サイトフッター
│   ├── Chatbot.tsx               # サポートチャットボット
│   ├── DynamicStructuredData.tsx  # 構造化データ（JSON-LD）
│   ├── NoteArticles.tsx          # 外部Note記事連携
│   ├── PrefLink.tsx              # テナント対応Link（自動prefix付与）
│   └── TenantLink.tsx            # ↑ の汎用名
│
├── lib/                          # ビジネスロジック・ユーティリティ
│   ├── supabase/                 # Supabase 3層クライアント
│   │   ├── client.ts             # ブラウザ用（シングルトン）
│   │   ├── server.ts             # Server Component / API Route 用
│   │   ├── middleware.ts          # ミドルウェア用
│   │   ├── storage.ts            # ストレージ操作
│   │   └── helpers.ts            # 共通ヘルパー（safeJsonParse等）
│   ├── auth/                     # 認証ロジック（Server Actions）
│   │   └── actions.ts
│   ├── email/                    # メール送信（16テンプレート）
│   │   ├── template.ts           # HTML テンプレート
│   │   ├── templateDefaults.ts   # デフォルト定義
│   │   ├── templateResolver.ts   # テンプレート解決
│   │   └── *Notification.ts      # 各種通知メール（14ファイル）
│   ├── {payment-provider}/       # 決済クライアント
│   │   └── client.ts
│   ├── hooks/                    # カスタムフック
│   │   ├── useTenantRouter.ts    # useRouter のラッパー
│   │   └── useTenantPathname.ts  # usePathname のラッパー
│   ├── outreach/                 # 営業リード関連
│   │   ├── siteAnalyzer.ts       # AI サイト解析
│   │   ├── mapScraper.ts         # Googleマップスクレイパー
│   │   ├── govScraper.ts         # 行政サイトスクレイパー
│   │   └── searchKeywords.ts     # 検索キーワード定義
│   ├── notifications.ts          # 通知INSERT統一ヘルパー
│   ├── admin.ts                  # 管理者権限（RBAC）
│   ├── env.ts                    # 環境変数バリデーション
│   ├── sanitize.ts               # XSSサニタイズ
│   ├── cron-auth.ts              # Cron認証
│   ├── googleIndexing.ts         # Google Indexing API連携
│   └── constants.ts              # 定数定義
│
├── scripts/                      # CLIスクリプト（tsx実行）
│   ├── lead-scraper.ts           # Googleマップリード収集
│   ├── outreach-worker.ts        # 営業アウトリーチ実行
│   ├── bulk-analyze.ts           # リード一括AI解析
│   └── gov-contact-scraper.ts    # 行政連絡先収集
│
├── contexts/                     # React Context
│   └── NotificationContext.tsx    # リアルタイム通知
│
├── types/                        # TypeScript型定義
├── docs/                         # 設計書・マイグレーション
│   ├── DATABASE_DESIGN.md        # DB設計書
│   ├── SERVICE_SPECIFICATION.md  # サービス仕様書
│   ├── SCHEMA.md                 # 全テーブル定義（マイグレーション同期必須）
│   ├── DEPENDENCY_MAP.md         # 逆引き依存マップ
│   └── migrations/               # 差分SQL
│       └── YYYYMMDD_description.sql
│
├── sentry.client.config.ts       # Sentry クライアント設定
├── sentry.server.config.ts       # Sentry サーバー設定
├── sentry.edge.config.ts         # Sentry Edge Runtime設定
├── public/                       # 静的ファイル
│   └── images/
├── middleware.ts                  # Next.js ミドルウェア
├── next.config.ts                # Next.js 設定（Sentry統合含む）
├── vercel.json                   # Vercel設定 + Cron定義
├── .husky/pre-commit             # Git pre-commit フック
└── package.json
```

### Route Group 活用パターン

Route Group `()` はURLパスに影響を与えず、レイアウトを分離する。

| Route Group | 用途 | 独自レイアウト |
|-------------|------|-------------|
| `(public)` | 公開ページ | なし（ルートレイアウト） |
| `(dashboard)` | 認証必須エリア | サイドバー + 認証ガード |
| `(admin)` | 管理画面 | ダークテーマ + 権限チェック |
| `(legal)` | 法務ページ | シンプルレイアウト |

### `lib/` の分類ルール

| パターン | 配置 | 例 |
|---------|------|-----|
| 外部サービス統合 | `lib/{service}/` ディレクトリ | `lib/supabase/`, `lib/email/` |
| 横断ユーティリティ | `lib/` 直下のフラットファイル | `lib/sanitize.ts`, `lib/env.ts`, `lib/notifications.ts` |
| カスタムフック | `lib/hooks/` | `lib/hooks/useXxx.ts` |
| 認証ロジック | `lib/auth/` | `lib/auth/actions.ts` |
| 営業・スクレイピング | `lib/outreach/` | `lib/outreach/siteAnalyzer.ts` |

---

## 3. ミドルウェア設計

### 処理フローの設計

ミドルウェアは以下の順序でリクエストを処理する。**早期リターン**を活用し、不要な処理をスキップする。

```
リクエスト受信
  │
  ├── 1. ドメイン正規化（www → naked、旧ドメイン → 新ドメイン）
  │     → 301 永久リダイレクト
  │
  ├── 2. CSRF検証（POST/PUT/DELETE /api/* のみ）
  │     → Origin/Referer ベース。不正なら 403
  │
  ├── 3. コンテキスト抽出（マルチテナントの場合）
  │     → URLパスからテナントID抽出 → ヘッダー/Cookie に設定
  │     → 内部パスに rewrite
  │
  ├── 4. セッション更新（Supabase Auth）
  │     → Cookie のトークンリフレッシュ
  │
  └── 5. 認証ガード（管理画面等の保護ページ）
        → 未認証なら リダイレクト
```

### CSRF対策の実装

```typescript
// middleware.ts
function handleCsrf(request: NextRequest): NextResponse | null {
  const { pathname } = request.nextUrl;
  const method = request.method;

  // APIミューテーションのみチェック
  if (!pathname.startsWith('/api/') || ['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    return null;
  }

  // Cron と Auth Callback は除外
  if (pathname.startsWith('/api/cron/') || pathname.startsWith('/api/auth/callback')) {
    return null;
  }

  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');
  const checkValue = origin || (referer ? new URL(referer).origin : null);

  if (!isAllowedOrigin(checkValue)) {
    return NextResponse.json({ error: 'Forbidden: invalid origin' }, { status: 403 });
  }
  return null;
}

function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return false;
  const allowed = [
    process.env.NEXT_PUBLIC_SITE_URL,
    'http://localhost:3000', // 開発環境
  ].filter(Boolean);
  return allowed.some(a => origin === a || origin.endsWith(`.${new URL(a!).hostname}`));
}
```

### セッション更新

```typescript
// lib/supabase/middleware.ts
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // getUser() を呼ぶことでトークンが自動リフレッシュされる
  await supabase.auth.getUser();
  return response;
}
```

---

## 4. マルチテナント/マルチリージョン設計

### URL設計：サブディレクトリ方式

```
https://example.com/{tenant}/path
→ ミドルウェアで rewrite → /path（内部パス）
→ テナント情報はヘッダー/Cookie で伝搬
```

**利点:**
- ファイル移動ゼロ（`app/` 配下の構造は変更不要）
- SEO有利（ドメインパワーが集中）
- Cookie共有が容易（同一ドメイン）
- SSL証明書管理が簡単（ワイルドカード不要）

### コンテキスト伝搬の3層設計

```
ミドルウェア（URL解析）
  → x-{context} ヘッダー + Cookie に設定
    → サーバーサイド取得関数（headers/cookies から読み取り）
    → クライアントサイド取得関数（URL/cookies から読み取り）
```

#### サーバーサイド取得関数

```typescript
// lib/tenant-context.ts
import { headers, cookies } from 'next/headers';

export async function getTenantFromRequest(): Promise<string> {
  // 1. ヘッダー（ミドルウェアが設定、最も信頼できる）
  const headersList = await headers();
  const fromHeader = headersList.get('x-tenant');
  if (fromHeader && isValidTenant(fromHeader)) return fromHeader;

  // 2. Cookie（フォールバック）
  const cookieStore = await cookies();
  const fromCookie = cookieStore.get('x-tenant')?.value;
  if (fromCookie && isValidTenant(fromCookie)) return fromCookie;

  // 3. デフォルト
  return DEFAULT_TENANT;
}
```

#### クライアントサイド取得関数

```typescript
// lib/tenant-context-client.ts
export function getTenantFromClient(): string {
  if (typeof window === 'undefined') return DEFAULT_TENANT;

  // 1. URLパス（最も信頼できる）
  const firstSeg = window.location.pathname.split('/').filter(Boolean)[0];
  if (firstSeg && isValidTenant(firstSeg)) return firstSeg;

  // 2. Cookie
  const match = document.cookie.match(/x-tenant=([^;]+)/);
  if (match && isValidTenant(match[1])) return match[1];

  return DEFAULT_TENANT;
}
```

### テナント対応 Link/Router/Pathname ラッパー

テナントprefixを透過的に扱うため、Next.js標準機能をラップする。

```typescript
// components/TenantLink.tsx — <Link> のラッパー
'use client';
import Link, { type LinkProps } from 'next/link';
import { getTenantFromClient } from '@/lib/tenant-context-client';

const NO_PREFIX = ['/api/', '/dashboard/', '/admin/', '/_next/', '/auth/'];

export default function TenantLink({ href, ...props }: React.ComponentProps<typeof Link>) {
  const hrefStr = typeof href === 'string' ? href : href?.pathname;
  if (typeof href === 'string' && hrefStr?.startsWith('/') &&
      !NO_PREFIX.some(p => hrefStr.startsWith(p))) {
    const tenant = getTenantFromClient();
    return <Link href={`/${tenant}${href}`} {...props} />;
  }
  return <Link href={href} {...props} />;
}
```

```typescript
// lib/hooks/useTenantRouter.ts — useRouter のラッパー
'use client';
import { useRouter } from 'next/navigation';
import { getTenantFromClient } from '@/lib/tenant-context-client';

export function useTenantRouter() {
  const router = useRouter();
  const tenant = getTenantFromClient();

  const prefix = (path: string) =>
    path.startsWith('/') && !NO_PREFIX.some(p => path.startsWith(p))
      ? `/${tenant}${path}` : path;

  return {
    push: (path: string) => router.push(prefix(path)),
    replace: (path: string) => router.replace(prefix(path)),
    prefetch: (path: string) => router.prefetch(prefix(path)),
    back: () => router.back(),
    refresh: () => router.refresh(),
  };
}
```

```typescript
// lib/hooks/useTenantPathname.ts — usePathname のラッパー
'use client';
import { usePathname } from 'next/navigation';

export function useTenantPathname() {
  const raw = usePathname();
  const segs = raw.split('/').filter(Boolean);

  if (segs[0] && isValidTenant(segs[0])) {
    return {
      pathname: '/' + segs.slice(1).join('/') || '/',
      tenant: segs[0],
      raw,
    };
  }
  return { pathname: raw, tenant: null, raw };
}
```

### ミドルウェアでの rewrite 実装

```typescript
// middleware.ts（マルチテナント部分）
function handleTenantRewrite(request: NextRequest): NextResponse | null {
  const { pathname } = request.nextUrl;

  // prefix不要パスはスキップ
  if (NO_PREFIX_PATHS.some(p => pathname.startsWith(p))) return null;

  // パスからテナントを抽出
  const match = pathname.match(/^\/([a-z_]+)(\/.*)?$/);
  if (!match || !isValidTenant(match[1])) return null;

  const tenant = match[1];
  const rest = match[2] || '/';

  // 内部パスに rewrite
  const rewriteUrl = request.nextUrl.clone();
  rewriteUrl.pathname = rest;
  const response = NextResponse.rewrite(rewriteUrl);

  // テナント情報をヘッダーとCookieに設定
  response.headers.set('x-tenant', tenant);
  response.cookies.set('x-tenant', tenant, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax',
  });

  return response;
}
```

---

## 5. 認証システム

### Supabase Auth 3層クライアント構成

| 層 | ファイル | 用途 | 特徴 |
|---|---------|------|------|
| ブラウザ | `lib/supabase/client.ts` | クライアントコンポーネント | シングルトン（HMR対応） |
| サーバー | `lib/supabase/server.ts` | Server Component / API Route | 毎リクエスト新規生成 |
| ミドルウェア | `lib/supabase/middleware.ts` | セッション更新 | req/res Cookie ペア |

#### ブラウザクライアント（シングルトン）

```typescript
// lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr';

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

#### サーバークライアント

```typescript
// lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) => {
            try { cookieStore.set(name, value, options); } catch { /* Server Component では書き込み不可 */ }
          });
        },
      },
    }
  );
}
```

### 認証フロー（Server Actions）

```typescript
// lib/auth/actions.ts

// サインアップ
export async function signUp(formData: SignUpData) {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signUp({
    email: formData.email,
    password: formData.password,
    options: {
      data: {
        user_type: formData.userType,
        profile_data: formData.profileData, // DB Triggerで自動INSERT
      },
    },
  });

  if (error) return { error: error.message };
  return { success: true };
}

// サインイン（ユーザータイプ二重検証付き）
export async function signIn(email: string, password: string, userType: string) {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email, password,
  });
  if (error) return { error: 'メールアドレスまたはパスワードが正しくありません' };

  // ユーザータイプの二重検証（不正アクセス防止）
  const table = userType === 'provider' ? 'providers' : 'users';
  const { data: profile } = await supabase
    .from(table)
    .select('user_type')
    .eq('id', data.user.id)
    .maybeSingle();

  if (!profile || profile.user_type !== userType) {
    await supabase.auth.signOut();
    return { error: `このアカウントは${userType}として登録されていません` };
  }

  return { success: true };
}
```

### DB Trigger による自動プロフィール作成

```sql
-- メール確認完了時にプロフィールを自動作成
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    email,
    display_name,
    user_type
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'user_type', 'user')
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
  const next = searchParams.get('next') ?? '/';

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // ユーザータイプに応じたリダイレクト先を決定
      const { data: { user } } = await supabase.auth.getUser();
      const userType = user?.user_metadata?.user_type;
      const redirectTo = userType === 'provider' ? '/provider' : '/user';
      return NextResponse.redirect(new URL(redirectTo, request.url));
    }
  }

  // エラー時はトップにリダイレクト
  return NextResponse.redirect(new URL('/', request.url));
}
```

---

## 6. 認可・権限管理

### RBAC（ロールベースアクセス制御）

```typescript
// lib/admin.ts

// ロール階層
export const ADMIN_ROLES = {
  super_admin: { level: 3, label: 'スーパー管理者' },
  admin:       { level: 2, label: '管理者' },
  moderator:   { level: 1, label: 'モデレーター' },
} as const;

// 権限マトリクス
export const PERMISSION_MATRIX: Record<string, string[]> = {
  'dashboard:view':     ['super_admin', 'admin', 'moderator'],
  'users:view':         ['super_admin', 'admin', 'moderator'],
  'users:edit':         ['super_admin', 'admin'],
  'users:delete':       ['super_admin'],
  'admins:invite':      ['super_admin'],
  'settings:edit':      ['super_admin'],
  'analytics:view':     ['super_admin', 'admin'],
  'email-templates:edit': ['super_admin', 'admin'],
};

// 権限チェック関数
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

### 管理者APIのタイミング攻撃防止

```typescript
// app/api/admin/check/route.ts
const MIN_RESPONSE_TIME = 200; // ms

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      await enforceMinDelay(startTime);
      return NextResponse.json({ isAdmin: false }, { status: 200 });
    }

    const { isAdmin, role } = await isAdminAsync(user.email);
    await enforceMinDelay(startTime);
    return NextResponse.json({ isAdmin, role }, { status: 200 });
  } catch {
    await enforceMinDelay(startTime);
    return NextResponse.json({ isAdmin: false }, { status: 200 });
  }
}

// 全レスポンスパスで同一フォーマット + 同一最小処理時間
async function enforceMinDelay(startTime: number) {
  const elapsed = Date.now() - startTime;
  if (elapsed < MIN_RESPONSE_TIME) {
    await new Promise(r => setTimeout(r, MIN_RESPONSE_TIME - elapsed));
  }
}
```

### BAN判定パターン

```typescript
// 二重チェック: ユーザーID + 決済カスタマーID
export async function checkBan(userId: string, paymentCustomerId?: string) {
  const supabase = getSupabaseAdmin();

  // 1. プロフィールのBANフラグ
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_banned, ban_reason')
    .eq('id', userId)
    .maybeSingle();

  if (profile?.is_banned) return { banned: true, reason: profile.ban_reason };

  // 2. banned_users テーブル（メール/カスタマーIDで再登録防止）
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

## 7. データベース設計

### 設計原則

1. **UUID主キー**: `gen_random_uuid()` で自動生成。auth.users との FK には auth.uid() を使用
2. **TEXT型ステータス**: PostgreSQL ENUMではなくTEXTを使用（マイグレーションの容易さ）
3. **TIMESTAMPTZ**: タイムゾーン付きタイムスタンプで統一
4. **RLS有効化**: 全テーブルで Row Level Security を有効化
5. **論理削除**: 関連データがある場合は `is_deleted` + `deleted_at`。関連なしなら物理削除
6. **冪等性**: `ON CONFLICT DO NOTHING` / `ON CONFLICT DO UPDATE` でUPSERT対応

### テーブル設計パターン

```sql
-- 基本テーブル構造
CREATE TABLE resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- ビジネスカラム
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  -- → TEXT型で管理: draft | published | archived

  -- マルチテナント
  tenant TEXT NOT NULL DEFAULT 'default',

  -- メタデータ
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- 論理削除（必要な場合のみ）
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at TIMESTAMPTZ
);

-- インデックス
CREATE INDEX idx_resources_user ON resources(user_id);
CREATE INDEX idx_resources_status ON resources(status);
CREATE INDEX idx_resources_tenant ON resources(tenant);
CREATE INDEX idx_resources_created ON resources(created_at DESC);

-- 部分インデックス（高頻度クエリ向け）
CREATE INDEX idx_resources_active ON resources(status, tenant)
  WHERE is_deleted = FALSE;
```

### RLS 設計パターン

```sql
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;

-- 公開リソースは誰でも閲覧可能
CREATE POLICY "Public resources are viewable by everyone"
  ON resources FOR SELECT
  USING (status = 'published' AND is_deleted = FALSE);

-- 自分のリソースは全て閲覧可能
CREATE POLICY "Users can view own resources"
  ON resources FOR SELECT
  USING (user_id = auth.uid());

-- 作成は自分のみ
CREATE POLICY "Users can create own resources"
  ON resources FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- 更新は自分のみ
CREATE POLICY "Users can update own resources"
  ON resources FOR UPDATE
  USING (user_id = auth.uid());

-- メッセージの送信者なりすまし防止
CREATE POLICY "Users can send messages as themselves"
  ON messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM projects
      WHERE id = project_id
      AND (client_id = auth.uid() OR provider_id = auth.uid())
    )
  );
```

### 重複防止インデックス

```sql
-- 1リソースにつき1応募（同一ユーザー）
CREATE UNIQUE INDEX idx_applications_unique
  ON applications(resource_id, user_id);

-- 1リソースにつき1レビュー（同一レビュアー）
CREATE UNIQUE INDEX idx_reviews_unique
  ON reviews(resource_id, reviewer_id);

-- お気に入り重複防止
CREATE UNIQUE INDEX idx_favorites_unique
  ON favorites(user_id, target_id);
```

### 配列カラム + GINインデックス

```sql
-- PostgreSQL配列型でタグ/カテゴリを管理
categories TEXT[] DEFAULT '{}',
skills TEXT[] DEFAULT '{}',

-- GINインデックスで配列検索を高速化
CREATE INDEX idx_profiles_categories ON profiles USING GIN(categories);

-- 検索例
SELECT * FROM profiles WHERE 'design' = ANY(categories);
```

### 軽量カウントクエリ

統計表示用にデータ本体を転送せず件数だけ取得する:

```typescript
// head: true でレスポンスボディを空にし、count のみ返す
const { count } = await supabase
  .from('resources')
  .select('*', { count: 'exact', head: true })
  .eq('tenant', tenant)
  .eq('status', 'published');
```

### ISR / revalidate パターン

ページ特性に応じてキャッシュ戦略を使い分ける:

```typescript
// 静的コンテンツ（利用規約等）: 24時間キャッシュ
export const revalidate = 86400;

// 準動的コンテンツ（一覧ページ等）: 1時間キャッシュ
export const revalidate = 3600;

// 動的コンテンツ（ダッシュボード等）: 毎回再生成
export const revalidate = 0;
```

### マイグレーション戦略

| ファイル | 用途 |
|---------|------|
| `docs/SUPABASE_TABLES.sql` | 全テーブルの統合SQL（新環境セットアップ用） |
| `docs/SCHEMA.md` | 全テーブル定義のドキュメント（**マイグレーション時に必ず同期**） |
| `docs/migrations/YYYYMMDD_description.sql` | 差分SQL（既存環境用） |

```sql
-- 差分マイグレーション: 冪等性を確保
ALTER TABLE users ADD COLUMN IF NOT EXISTS tenant TEXT NOT NULL DEFAULT 'default';
CREATE INDEX IF NOT EXISTS idx_users_tenant ON users(tenant);

-- 既存データのバックフィル
UPDATE users SET tenant = 'default' WHERE tenant IS NULL;
```

---

## 8. APIルート設計

### 共通パターン

```typescript
// app/api/resources/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    // 1. 認証チェック
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    // 2. テナントコンテキスト取得
    const tenant = await getTenantFromRequest();

    // 3. クエリパラメータ取得
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '20');

    // 4. データ取得（RLSが自動適用 + テナントフィルタ）
    let query = supabase
      .from('resources')
      .select('*')
      .eq('tenant', tenant)  // ← テナントフィルタ必須
      .order('created_at', { ascending: false });
    if (status) query = query.eq('status', status);
    query = query.limit(limit);

    const { data, error } = await query;
    if (error) {
      console.error('リソース取得エラー:', error.message);
      return NextResponse.json({ error: 'データの取得に失敗しました' }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('予期しないエラー:', error);
    return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // 1. 認証チェック
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    // 2. テナントコンテキスト
    const tenant = await getTenantFromRequest();

    // 3. リクエストボディのパース
    const jsonResult = await safeJsonParse(request);
    if (!jsonResult.success) {
      return NextResponse.json({ error: jsonResult.error }, { status: 400 });
    }
    const { title, description } = jsonResult.data;

    // 4. バリデーション
    if (!title?.trim()) {
      return NextResponse.json({ error: 'タイトルは必須です' }, { status: 400 });
    }
    if (title.length > 100) {
      return NextResponse.json({ error: 'タイトルは100文字以内です' }, { status: 400 });
    }

    // 5. データ作成（テナント情報を含む）
    const { data, error } = await supabase
      .from('resources')
      .insert({
        title: title.trim(),
        description,
        user_id: user.id,
        tenant,  // ← テナント情報を必ずINSERT
      })
      .select()
      .single();

    if (error) {
      console.error('リソース作成エラー:', error.message);
      return NextResponse.json({ error: '作成に失敗しました' }, { status: 500 });
    }

    // 6. 通知（統一ヘルパー経由）
    await createNotification({
      userId: user.id,
      type: 'resource_created',
      title: 'リソースが作成されました',
      message: `「${title}」が作成されました`,
      link: `/resources/${data.id}`,
    });

    return NextResponse.json({ success: true, data, message: '作成しました' });
  } catch (error) {
    console.error('予期しないエラー:', error);
    return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 });
  }
}
```

### safeJsonParse ヘルパー

```typescript
// lib/supabase/helpers.ts
export async function safeJsonParse<T = unknown>(request: Request): Promise<
  { success: true; data: T } | { success: false; error: string }
> {
  try {
    const data = await request.json();
    return { success: true, data: data as T };
  } catch {
    return { success: false, error: 'リクエストボディのパースに失敗しました' };
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
      .from('profiles')
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

### レスポンス形式の統一

```typescript
// 成功
{ success: true, data: {...}, message: '作成しました' }

// エラー
{ error: 'エラーメッセージ（ユーザー向け、日本語）' }

// ステータスコード
// 400: バリデーションエラー
// 401: 未認証
// 403: 権限不足
// 404: リソースなし
// 500: サーバーエラー
```

---

## 9. 決済システム

### Card on File 方式（Square統合例）

PCI DSS準拠のため、カード情報はサーバーに保存せず、決済プロバイダのSDKでトークン化する。

```
[ブラウザ] Square Web Payments SDK
  → カード情報をSDKに入力
  → SDK が Square サーバーに直接送信
  → nonce（一時トークン）を取得
  → nonce をサーバーに送信

[サーバー] /api/payment/register-card
  → nonce で顧客作成 + カード登録
  → customer_id を DB に保存

[サーバー] /api/payment/charge（後日自動課金）
  → customer_id でカード課金
```

### フロントエンド（SDK動的ロード）

```typescript
// components/CardRegistration.tsx
'use client';
import { useEffect, useRef, useState } from 'react';

export function CardRegistration({ userId }: { userId: string }) {
  const cardRef = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // SDK を動的ロード（sandbox / production 自動判別）
    const script = document.createElement('script');
    const isSandbox = process.env.NEXT_PUBLIC_SQUARE_APP_ID?.startsWith('sandbox-');
    script.src = isSandbox
      ? 'https://sandbox.web.squarecdn.com/v1/square.js'
      : 'https://web.squarecdn.com/v1/square.js';

    script.onload = async () => {
      const payments = window.Square.payments(
        process.env.NEXT_PUBLIC_SQUARE_APP_ID!,
        process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID!
      );
      const card = await payments.card();
      await card.attach('#card-container');
      cardRef.current = card;
    };

    document.head.appendChild(script);
    return () => { document.head.removeChild(script); };
  }, []);

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      // SDK がカード情報を Square に送信し nonce を返す
      const result = await cardRef.current.tokenize();
      if (result.status !== 'OK') throw new Error(result.errors[0].message);

      // nonce をサーバーに送信
      const res = await fetch('/api/payment/register-card', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourceId: result.token }),
      });
      // ...
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <div id="card-container" />
      <button onClick={handleSubmit} disabled={isLoading}>
        {isLoading ? '登録中...' : 'カードを登録する'}
      </button>
    </div>
  );
}
```

### サーバーサイド課金（リトライ + 保留メカニズム）

```typescript
// リトライ付き課金関数
async function chargeWithRetry(
  customerId: string,
  amount: number,
  currency: string = 'JPY',
  maxRetries: number = 3
): Promise<ChargeResult> {
  const NON_RETRYABLE = [
    'CARD_DECLINED', 'INSUFFICIENT_FUNDS',
    'CARD_EXPIRED', 'CVV_FAILURE',
  ];

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await squareClient.paymentsApi.createPayment({
        sourceId: customerId,
        idempotencyKey: crypto.randomUUID(),
        amountMoney: { amount: BigInt(amount), currency },
      });
      return { success: true, paymentId: result.result.payment!.id! };
    } catch (error: any) {
      const errorCode = error?.errors?.[0]?.code;

      // リトライ不可のエラーは即座にthrow
      if (NON_RETRYABLE.includes(errorCode)) {
        throw error;
      }

      // 最後のリトライも失敗した場合
      if (attempt === maxRetries) throw error;

      // 指数バックオフ
      await new Promise(r => setTimeout(r, 1000 * Math.pow(2, attempt - 1)));
    }
  }
  throw new Error('Unreachable');
}
```

### 取引保留（片方失敗時の安全設計）

```typescript
// 両者課金パターン（マッチング型サービスの場合）
async function chargeBothParties(clientId: string, providerId: string, amount: number) {
  // 1. クライアント課金
  let clientPayment: ChargeResult;
  try {
    clientPayment = await chargeWithRetry(clientId, clientFee);
  } catch (error) {
    // クライアント課金失敗 → 全体キャンセル
    return { success: false, error: 'client_charge_failed' };
  }

  // 2. プロバイダー課金
  try {
    const providerPayment = await chargeWithRetry(providerId, providerFee);
    return { success: true, clientPayment, providerPayment };
  } catch (error) {
    // プロバイダー課金失敗 → 取引保留（Cronで自動返金）
    await db.update('projects', projectId, {
      status: 'payment_hold',
      payment_hold_deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      client_payment_id: clientPayment.paymentId,
    });

    // 両者に通知（統一ヘルパー経由）
    await createNotifications([
      { userId: clientId, type: 'payment_hold', title: '...', message: '...', link: '...' },
      { userId: providerId, type: 'payment_hold', title: '...', message: '...', link: '...' },
    ]);

    return { success: false, error: 'provider_charge_failed', hold: true };
  }
}
```

### idempotencyKey の重要性

```typescript
// 全ての決済API呼び出しで UUID を付与
// → ネットワークエラーで同じリクエストが再送されても二重課金されない
const result = await paymentsApi.createPayment({
  idempotencyKey: crypto.randomUUID(), // 36文字（Square上限40文字以内）
  // ...
});
```

---

## 10. メールシステム

### 3層テンプレートシステム

```
1. コードデフォルト（templateDefaults.ts）
   ↓ DBに保存があればそちらを優先
2. DBカスタマイズ（email_templates テーブル）
   ↓ DB取得失敗時はデフォルトにフォールバック
3. フォールバック（常にメールが送れる状態を保証）
```

### HTMLテンプレート

```typescript
// lib/email/template.ts
interface EmailHTMLParams {
  recipientName: string;
  subject: string;
  message: string;
  buttonUrl?: string;
  buttonText?: string;
  customContent?: string;
  siteUrl: string;
}

export function generateEmailHTML(params: EmailHTMLParams): string {
  const safeName = escapeHtml(params.recipientName);
  const safeSubject = escapeHtml(params.subject);

  return `
    <!DOCTYPE html>
    <html lang="ja">
    <head><meta charset="UTF-8"></head>
    <body style="margin:0; padding:0; font-family:'Helvetica Neue',Arial,sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px; margin:0 auto;">
        <!-- ヘッダー（グラデーション + ロゴ） -->
        <tr>
          <td style="background: linear-gradient(135deg, #2D7D6F, #3A9D8F); padding: 24px; text-align: center;">
            <h1 style="color: white; margin: 0;">サービス名</h1>
          </td>
        </tr>

        <!-- 本文 -->
        <tr>
          <td style="padding: 32px 24px;">
            <p>${safeName} 様</p>
            <p>いつもご利用いただきありがとうございます。</p>

            <!-- 件名バー -->
            <div style="background: #f0fdf4; border-left: 4px solid #2D7D6F; padding: 12px 16px;">
              <strong>${safeSubject}</strong>
            </div>

            <!-- メッセージ -->
            <div style="margin: 16px 0;">${params.message}</div>

            <!-- カスタムコンテンツ -->
            ${params.customContent || ''}

            <!-- CTAボタン -->
            ${params.buttonUrl ? `
              <div style="text-align: center; margin: 24px 0;">
                <a href="${params.buttonUrl}" style="
                  background: #2D7D6F; color: white; padding: 12px 32px;
                  border-radius: 6px; text-decoration: none; font-weight: bold;
                ">${params.buttonText || '詳細を確認する'}</a>
              </div>
            ` : ''}
          </td>
        </tr>

        <!-- 注意書き -->
        <tr>
          <td style="padding: 16px 24px; background: #fef3c7;">
            <p style="font-size: 12px; color: #92400e;">
              ※ このメールは送信専用です。返信はできません。
            </p>
          </td>
        </tr>

        <!-- フッター -->
        <tr>
          <td style="padding: 24px; background: #1f2937; color: #9ca3af; text-align: center; font-size: 12px;">
            <a href="${params.siteUrl}" style="color: #60a5fa;">サービス名</a>
            <p>&copy; ${new Date().getFullYear()} 会社名</p>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

// プレーンテキスト版も生成（HTML非対応クライアント向け）
export function generateEmailText(params: EmailHTMLParams): string {
  return `${params.recipientName} 様\n\n${params.subject}\n\n${params.message}`;
}
```

### テンプレートデフォルト定義

```typescript
// lib/email/templateDefaults.ts
interface TemplateDefault {
  key: string;
  description: string;
  category: string;
  subject: string;           // {{変数}} 使用可能
  message: string;
  buttonText?: string;
  customTexts: Record<string, string>;
  availableVariables: string[];
  previewVariables: Record<string, string>; // プレビュー用ダミーデータ
}

export const TEMPLATE_DEFAULTS: TemplateDefault[] = [
  {
    key: 'order_notification',
    description: '発注通知',
    category: 'transaction',
    subject: '{{projectTitle}} の発注を受けました',
    message: '{{clientName}} 様から発注がありました。',
    buttonText: '案件を確認する',
    customTexts: {
      next_step: '案件詳細を確認し、受注の可否をご判断ください。',
    },
    availableVariables: ['projectTitle', 'clientName', 'amount'],
    previewVariables: {
      projectTitle: 'ロゴデザイン制作',
      clientName: '山田太郎',
      amount: '100,000',
    },
  },
  // ... 他のテンプレート
];
```

### テンプレートリゾルバー

```typescript
// lib/email/templateResolver.ts
export async function getResolvedTemplate(key: string): Promise<ResolvedTemplate> {
  const defaults = TEMPLATE_DEFAULTS.find(t => t.key === key);
  if (!defaults) throw new Error(`Template not found: ${key}`);

  try {
    // DBからカスタマイズ済みテンプレートを取得
    const supabase = getSupabaseAdmin();
    const { data: dbTemplate } = await supabase
      .from('email_templates')
      .select('*')
      .eq('template_key', key)
      .maybeSingle();

    if (dbTemplate) {
      return {
        subject: dbTemplate.subject || defaults.subject,
        message: dbTemplate.message || defaults.message,
        buttonText: dbTemplate.button_text || defaults.buttonText,
        customTexts: { ...defaults.customTexts, ...dbTemplate.custom_texts },
      };
    }
  } catch {
    // DB取得失敗 → デフォルトにフォールバック（メール送信を止めない）
  }

  return defaults;
}

// {{変数}} を実際の値に置換
export function resolveTemplate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] || '');
}
```

### 通知メール送信関数の共通パターン

```typescript
// lib/email/orderNotification.ts
import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const FROM_EMAIL = 'サービス名 <noreply@mail.example.com>';

export async function sendOrderNotification(params: {
  to: string;
  recipientName: string;
  projectTitle: string;
  amount: number;
  siteUrl?: string;
}): Promise<boolean> {
  // 環境変数未設定なら送信スキップ（開発環境対策）
  if (!resend) {
    console.log('[メール] Resend未設定、送信スキップ');
    return false;
  }

  try {
    const siteUrl = params.siteUrl || await getDynamicSiteUrl();
    const tmpl = await getResolvedTemplate('order_notification');

    // ユーザー入力をエスケープ（1回のみ、二重エスケープ防止）
    const vars = {
      projectTitle: escapeHtml(params.projectTitle),
      amount: params.amount.toLocaleString(),
    };

    await resend.emails.send({
      from: FROM_EMAIL,
      to: params.to,
      subject: resolveTemplate(tmpl.subject, vars),
      html: generateEmailHTML({
        recipientName: params.recipientName,
        subject: resolveTemplate(tmpl.subject, vars),
        message: resolveTemplate(tmpl.message, vars),
        siteUrl,
      }),
    });

    return true;
  } catch (error) {
    console.error('[メール] 発注通知エラー:', error);
    return false; // 送信失敗は致命的ではない
  }
}
```

---

## 11. 通知システム

### 統一ヘルパーによる通知INSERT

全てのアプリ内通知は `lib/notifications.ts` の統一ヘルパーを経由する。
**直接 `supabase.from('notifications').insert()` を書くことは禁止。**

```typescript
// lib/notifications.ts
import { createServiceClient } from '@/lib/supabase/server';

/** 有効な通知タイプ一覧 */
export type NotificationType =
  | 'new_message'
  | 'application_received'
  | 'application_rejected'
  | 'inquiry_received'
  | 'estimate_received'
  | 'estimate_sent'
  | 'order_received'
  | 'order_withdrawn'
  | 'match_complete'
  | 'project_completed'
  | 'project_deleted'
  | 'project_edited'
  | 'project_updated'
  | 'project_cancelled'
  | 'payment_hold'
  | 'payment_hold_expired'
  | 'rank_up'
  | 'referral_earned'
  | 'review_received'
  | 'question_received'
  | 'question_answered'
  | 'estimate_updated'
  | 'application_withdrawn';

interface NotificationParams {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link: string;
  projectId?: string | null;
}

/** 単一通知を作成 */
export async function createNotification(
  params: NotificationParams,
  client?: any
): Promise<boolean> {
  const supabase = client || createServiceClient();
  const { error } = await supabase.from('notifications').insert({
    user_id: params.userId,
    type: params.type,
    title: params.title,
    message: params.message,
    link: params.link,
    ...(params.projectId ? { project_id: params.projectId } : {}),
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
  const supabase = client || createServiceClient();
  const rows = notifications.map(n => ({
    user_id: n.userId,
    type: n.type,
    title: n.title,
    message: n.message,
    link: n.link,
    ...(n.projectId ? { project_id: n.projectId } : {}),
  }));
  const { error } = await supabase.from('notifications').insert(rows);
  if (error) {
    console.error(`[通知] 一括作成エラー (${notifications.length}件):`, error.message);
    return false;
  }
  return true;
}
```

### 使用例

```typescript
// API Route 内での通知作成
import { createNotification, createNotifications } from '@/lib/notifications';

// 単一通知
await createNotification({
  userId: creatorId,
  type: 'order_received',
  title: '新しい発注がありました',
  message: `${projectTitle} の発注を受けました`,
  link: `/dashboard/creator/projects/${projectId}`,
  projectId,
});

// 複数人への一括通知
await createNotifications([
  {
    userId: clientId,
    type: 'match_complete',
    title: 'マッチングが成立しました',
    message: `${creatorName} とのマッチングが成立しました`,
    link: `/dashboard/client/projects/${projectId}`,
    projectId,
  },
  {
    userId: creatorId,
    type: 'match_complete',
    title: 'マッチングが成立しました',
    message: `${clientName} とのマッチングが成立しました`,
    link: `/dashboard/creator/projects/${projectId}`,
    projectId,
  },
]);
```

### アプリ内通知 + メール通知の二重構造

| 通知タイプ | アプリ内 | メール | 判断基準 |
|-----------|---------|--------|---------|
| 決済関連（マッチング・保留・返金） | ○ | ○ | 金銭が絡む→両方 |
| 発注・受注 | ○ | ○ | 重要なアクション→両方 |
| メッセージ受信 | - | ○ | 日常的→メールのみ |
| レビューリマインダー | - | ○ | 期限付き→メールのみ |
| ランクアップ | - | ○ | 嬉しいお知らせ→メールのみ |

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

## 12. Cronジョブ設計

### Vercel Cron 統合

```json
// vercel.json
{
  "crons": [
    {
      "path": "/api/cron/update-ranks",
      "schedule": "0 6 1 * *"
    },
    {
      "path": "/api/cron/review-reminder",
      "schedule": "0 0 * * *"
    },
    {
      "path": "/api/cron/payment-hold-refund",
      "schedule": "0 3 * * *"
    },
    {
      "path": "/api/cron/cleanup-attachments",
      "schedule": "0 4 * * *"
    }
  ]
}
```

### Cron認証

```typescript
// lib/cron-auth.ts
export function verifyCronAuth(request: NextRequest): NextResponse | null {
  // 開発環境ではスキップ
  if (process.env.NODE_ENV !== 'production') return null;

  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return null;
}
```

### Cronジョブの共通パターン

```typescript
// app/api/cron/cleanup/route.ts
export async function GET(request: NextRequest) {
  // 1. 認証チェック
  const authError = verifyCronAuth(request);
  if (authError) return authError;

  const supabaseAdmin = getSupabaseAdmin();
  let processed = 0;
  let errors = 0;

  try {
    // 2. 対象レコード取得
    const { data: targets } = await supabaseAdmin
      .from('resources')
      .select('id, file_path')
      .lt('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .not('file_path', 'is', null)
      .limit(500); // バッチサイズ制限

    if (!targets?.length) {
      return NextResponse.json({ message: '処理対象なし', processed: 0 });
    }

    // 3. 各レコードを個別にtry-catch（1件の失敗で全体を止めない）
    for (const target of targets) {
      try {
        await supabaseAdmin.storage.from('files').remove([target.file_path]);
        await supabaseAdmin.from('resources')
          .update({ file_path: null })
          .eq('id', target.id);
        processed++;
      } catch (error) {
        console.error(`処理失敗 ID:${target.id}:`, error);
        errors++;
      }
    }

    return NextResponse.json({
      message: `完了: ${processed}件処理, ${errors}件エラー`,
      processed,
      errors,
    });
  } catch (error) {
    console.error('Cronジョブエラー:', error);
    return NextResponse.json({ error: 'ジョブ実行失敗' }, { status: 500 });
  }
}

// POSTも許可（管理画面からの手動実行用）
export async function POST(request: NextRequest) {
  return GET(request);
}
```

### Cronジョブ設計のチェックリスト

- [ ] `verifyCronAuth()` で認証チェック
- [ ] `GET` + `POST` の両方をエクスポート（Vercel Cron = GET、手動実行 = POST）
- [ ] バッチサイズに上限を設ける（`limit(500)` 等）
- [ ] 個別レコードを `try-catch` で囲む（1件の失敗で全体を止めない）
- [ ] 処理結果をJSONで返す（`processed`, `errors` カウント）
- [ ] 冪等性を確保（何度実行しても安全）
- [ ] 送信制御（`reminder_sent_count`, `last_sent_at` 等で重複防止）

---

## 13. SEO最適化

### 動的メタデータ生成（全ページ必須）

```typescript
// app/resources/page.tsx
import type { Metadata } from 'next';

// ✅ 動的メタデータ（推奨）
export async function generateMetadata(): Promise<Metadata> {
  const tenant = await getTenantFromRequest();
  const tenantName = getTenantLabel(tenant);

  return {
    title: `${tenantName}のリソース一覧 | サービス名`,
    description: `${tenantName}エリアで活躍するクリエイターの一覧です。`,
    keywords: generateKeywords(tenantName),
    openGraph: {
      siteName: `サービス名 ${tenantName}`,
      locale: 'ja_JP',
      type: 'website',
      url: `${siteUrl}/resources`,
      title: `${tenantName}のリソース一覧 | サービス名`,
      description: `...`,
      images: [{ url: '/images/og.jpg', width: 1200, height: 630 }],
    },
    twitter: { card: 'summary_large_image' },
    robots: {
      index: true,
      follow: true,
      googleBot: { 'max-image-preview': 'large' },
    },
    alternates: {
      canonical: `${siteUrl}/resources`,
    },
  };
}

// ❌ 静的メタデータ（使わない）
// export const metadata: Metadata = { ... };
```

### 構造化データ（JSON-LD @graph パターン）

```typescript
// components/StructuredData.tsx
export function generateGraphData(siteUrl: string) {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      // 組織情報
      {
        '@type': 'Organization',
        '@id': `${siteUrl}/#organization`,
        name: 'サービス名',
        url: siteUrl,
        logo: { '@type': 'ImageObject', url: `${siteUrl}/images/logo.png` },
        contactPoint: { '@type': 'ContactPoint', contactType: 'customer service' },
      },
      // サイト情報
      {
        '@type': 'WebSite',
        '@id': `${siteUrl}/#website`,
        url: siteUrl,
        name: 'サービス名',
        publisher: { '@id': `${siteUrl}/#organization` },
        potentialAction: {
          '@type': 'SearchAction',
          target: { '@type': 'EntryPoint', urlTemplate: `${siteUrl}/search?q={query}` },
          'query-input': 'required name=query',
        },
      },
      // ローカルビジネス（地域サービスの場合）
      {
        '@type': 'ProfessionalService',
        '@id': `${siteUrl}/#localbusiness`,
        name: 'サービス名',
        url: siteUrl,
        areaServed: cities.map(city => ({
          '@type': 'City',
          name: city.name,
          geo: { '@type': 'GeoCoordinates', latitude: city.lat, longitude: city.lng },
        })),
      },
    ],
  };
}
```

### コラム記事の構造化データ（Article JSON-LD）

SEOコンテンツとしてのコラム記事には Article 構造化データを付与する:

```typescript
// app/columns/[id]/page.tsx

// Article JSON-LD を生成
function generateArticleJsonLd(column: ColumnData, siteUrl: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: column.title,
    author: {
      '@type': 'Person',
      name: column.profiles?.display_name || 'クリエイター',
    },
    datePublished: column.published_at,
    publisher: {
      '@type': 'Organization',
      name: 'サービス名',
      logo: { '@type': 'ImageObject', url: `${siteUrl}/images/logo.png` },
    },
  };
}
```

### 動的サイトマップ

```typescript
// app/sitemap.ts
import { MetadataRoute } from 'next';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL!;

  // 1. 静的ページ（テナント別）
  const staticPaths = ['/about', '/contact', '/faq', '/terms', '/privacy'];
  const tenants = getActiveTenants();
  const staticPages = tenants.flatMap(t =>
    staticPaths.map(path => ({
      url: `${baseUrl}/${t.id}${path}`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    }))
  );

  // 2. DB動的ページ（リソース + コラム記事）
  const supabase = getSupabaseAdmin();
  const [{ data: resources }, { data: columns }] = await Promise.all([
    supabase
      .from('resources')
      .select('id, updated_at, tenant')
      .eq('status', 'published'),
    supabase
      .from('creator_columns')
      .select('id, published_at, prefecture')
      .eq('status', 'published'),
  ]);

  const resourcePages = (resources || []).map(r => ({
    url: `${baseUrl}/${r.tenant}/resources/${r.id}`,
    lastModified: new Date(r.updated_at),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  const columnPages = (columns || []).map(c => ({
    url: `${baseUrl}/${c.prefecture}/columns/${c.id}`,
    lastModified: new Date(c.published_at),
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }));

  // 3. パラメトリックページ（地域×カテゴリ等）
  const parametricPages = tenants.flatMap(t =>
    categories.flatMap(cat =>
      getCitiesForTenant(t.id).map(city => ({
        url: `${baseUrl}/area/${t.id}/${city.id}/${cat.id}`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.6,
      }))
    )
  );

  return [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'daily', priority: 1.0 },
    ...staticPages,
    ...resourcePages,
    ...columnPages,
    ...parametricPages,
  ];
}
```

### 地域SEO ランディングページ

```typescript
// app/area/[tenant]/[city]/[category]/page.tsx

// SSG パラメータ生成
export async function generateStaticParams() {
  return getActiveTenants().flatMap(t =>
    getTopCities(t.id).flatMap(city =>
      seoCategories.map(cat => ({
        tenant: t.id,
        city: city.id,
        category: cat.id,
      }))
    )
  );
}

// 未知パラメータも受け入れ（ISR）
export const dynamicParams = true;

// メタデータ: DB件数をタイトルに反映（CTR向上）
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const count = await getResourceCount(params.city, params.category);
  return {
    title: `${cityName}の${categoryName}【料金相場・実績比較】${count}名登録中`,
  };
}
```

### SEOコンテンツ自動生成戦略

新しいURLを定期的に生成し、検索エンジンのクロール対象を増やす:

| コンテンツ種別 | URL構造 | 生成方法 |
|--------------|---------|---------|
| コラム記事 | `/{tenant}/columns/{id}` | クリエイターが専門コラムを投稿（初期は運営が作成） |
| 地域×職種ページ | `/area/{tenant}/{city}/{category}` | 各テナント×都市×カテゴリの自動生成 |
| クリエイタープロフィール | `/{tenant}/creator/{id}` | クリエイター登録時に自動生成 |
| 行政お知らせ | `/{tenant}/gov/guide` | 行政機関情報を取り込み表示 |

---

## 14. 管理画面設計

### レイアウト構成

```typescript
// app/(admin)/layout.tsx
'use client';
import { useEffect, useState } from 'react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    // 権限チェック
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
      {/* 固定ヘッダー */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-gray-800 border-b border-gray-700 z-50">
        <h1>管理ダッシュボード</h1>
      </header>

      {/* サイドバー */}
      <aside className="fixed left-0 top-16 bottom-0 w-60 bg-gray-800 overflow-y-auto">
        <nav>
          {menuItems
            .filter(item => hasPermission(userRole!, item.requiredPermission))
            .map(item => (
              <Link key={item.href} href={item.href}>{item.label}</Link>
            ))}
        </nav>
      </aside>

      {/* メインコンテンツ */}
      <main className="ml-60 mt-16 p-8">
        {children}
      </main>
    </div>
  );
}
```

### デザイントークン

```typescript
// lib/admin/designTokens.ts
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
  border: {
    default: 'border-gray-700',
    hover: 'border-gray-600',
  },
  status: {
    success: 'bg-green-500/20 text-green-400 border border-green-500/30',
    warning: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
    error: 'bg-red-500/20 text-red-400 border border-red-500/30',
    info: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
  },
};

// ステータス色・ラベルの一元管理
export function getStatusColor(status: string): string {
  const map: Record<string, string> = {
    active: colors.status.success,
    pending: colors.status.warning,
    suspended: colors.status.error,
  };
  return map[status] || colors.status.info;
}
```

### CRUD一覧画面の共通パターン

```
┌─────────────────────────────────────────────┐
│  統計カード (4列グリッド)                      │
│  [総数] [アクティブ] [今月新規] [要対応]        │
├─────────────────────────────────────────────┤
│  フィルターバー                               │
│  [🔍 検索] [ステータス ▼] [テナント ▼] [+新規] │
├─────────────────────────────────────────────┤
│  データテーブル (ソート対応)                    │
│  名前 ↕ | ステータス | 登録日 ↕ | 操作        │
│  ...                                        │
└─────────────────────────────────────────────┘
```

---

## 15. UIコンポーネント設計

### 基本UIコンポーネント（label / error / helperText 3層パターン）

```typescript
// components/ui/Input.tsx
import { forwardRef } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className, id, required, ...props }, ref) => {
    const inputId = id || `input-${label?.replace(/\s/g, '-')}`;

    return (
      <div className="space-y-1">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-gray-700">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`
            w-full px-3 py-2 border rounded-lg
            focus:ring-2 focus:ring-primary focus:border-primary
            ${error ? 'border-red-500' : 'border-gray-300'}
            ${className || ''}
          `}
          {...props}
        />
        {error && <p className="text-sm text-red-500">{error}</p>}
        {!error && helperText && <p className="text-sm text-gray-500">{helperText}</p>}
      </div>
    );
  }
);
Input.displayName = 'Input';
```

### Buttonコンポーネント（Framer Motion付き）

```typescript
// components/ui/Button.tsx
import { forwardRef } from 'react';
import { motion } from 'framer-motion';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'accent' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

const variants = {
  primary: 'bg-primary text-white hover:bg-primary-dark',
  secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300',
  accent: 'bg-accent text-white hover:bg-accent-dark',
  outline: 'border-2 border-primary text-primary hover:bg-primary/10',
};

const sizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-6 py-3 text-lg',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', isLoading, children, disabled, ...props }, ref) => {
    return (
      <motion.button
        ref={ref}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={`
          rounded-lg font-medium transition-colors
          disabled:opacity-50 disabled:cursor-not-allowed
          ${variants[variant]} ${sizes[size]}
        `}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <span className="flex items-center gap-2">
            <span className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
            処理中...
          </span>
        ) : children}
      </motion.button>
    );
  }
);
Button.displayName = 'Button';
```

---

## 16. フォーム設計

### マルチステップフォームの構造

```typescript
// 型定義を別ファイルに切り出す
// types/registrationForm.ts
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
// components/forms/RegistrationForm.tsx（親コンポーネント）
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
      className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors
        ${isDragging ? 'border-primary bg-primary/5' : 'border-gray-300'}`}
    >
      <input type="file" multiple accept="image/*" onChange={e => handleFiles(e.target.files!)} />
      <p>ドラッグ&ドロップまたはクリックで画像を追加</p>
      <p className="text-sm text-gray-500">最大{maxFiles}枚、各{maxSizeMB}MBまで</p>

      {/* プレビュー */}
      <AnimatePresence>
        {files.map((file, i) => (
          <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <img src={URL.createObjectURL(file)} alt="" className="w-24 h-24 object-cover rounded" />
            <button onClick={() => {
              URL.revokeObjectURL(URL.createObjectURL(file)); // メモリ解放
              onChange(files.filter((_, j) => j !== i));
            }}>削除</button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
```

---

## 17. 画像・ファイル管理

### Supabase Storage 活用パターン

```typescript
// アップロード
const { data, error } = await supabase.storage
  .from('avatars')
  .upload(`${userId}/avatar.jpg`, file, {
    cacheControl: '3600',
    upsert: true,
  });

// 公開URL取得
const { data: { publicUrl } } = supabase.storage
  .from('avatars')
  .getPublicUrl(`${userId}/avatar.jpg`);

// 署名付きURL（非公開ファイル）
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

  // パスからコンテキスト（プロジェクトID等）を抽出
  const contextId = path.split('/')[0];

  // 当事者チェック
  const { data: project } = await supabase
    .from('projects')
    .select('client_id, provider_id')
    .eq('id', contextId)
    .single();

  if (user.id !== project.client_id && user.id !== project.provider_id) {
    return NextResponse.json({ error: 'アクセス権がありません' }, { status: 403 });
  }

  // Admin Client で署名付きURL生成
  const admin = getSupabaseAdmin();
  const { data } = await admin.storage
    .from('attachments')
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
    quality={80}      // 画質調整
    sizes="100vw"     // ビューポート全幅
  />
</div>

// レスポンシブ画像
<Image
  src={profileImage}
  alt="プロフィール"
  width={200}
  height={200}
  className="rounded-full"
  sizes="(max-width: 768px) 100px, 200px"
/>
```

---

## 18. エラーハンドリング

### エラーバウンダリの階層設計

```
app/
├── global-error.tsx  ← Sentry統合グローバルエラー（最後の砦）
├── error.tsx         ← ルートレベルエラー
├── not-found.tsx     ← 404
├── (dashboard)/
│   └── error.tsx     ← ダッシュボード用（ログイン導線付き）
├── (admin)/
│   └── error.tsx     ← 管理画面用（管理者トップへの導線）
└── resources/
    └── error.tsx     ← リソースページ用（一覧への導線）
```

### エラーページの実装

```typescript
// app/error.tsx
'use client';
import { useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';

export default function Error({
  error, reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('エラー:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-4">
        <AlertTriangle className="w-16 h-16 text-yellow-500 mx-auto" />
        <h2 className="text-xl font-bold">エラーが発生しました</h2>
        <p className="text-gray-600">申し訳ありませんが、問題が発生しました。</p>
        <div className="flex gap-4 justify-center">
          <button onClick={reset} className="px-4 py-2 bg-primary text-white rounded">
            もう一度試す
          </button>
          <a href="/" className="px-4 py-2 border rounded">トップページへ</a>
        </div>
      </div>
    </div>
  );
}
```

### 404ページ（離脱防止設計）

```typescript
// app/not-found.tsx
export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-6">
        <p className="text-8xl font-bold text-gray-200">404</p>
        <h1 className="text-2xl font-bold">ページが見つかりません</h1>

        {/* 主要導線への復帰リンク */}
        <div className="flex flex-col gap-2">
          <a href="/">トップページ</a>
          <a href="/resources">リソース一覧</a>
          <a href="/register">無料で登録する</a>  {/* CTA（コンバージョン機会） */}
          <a href="/contact">お問い合わせ</a>
        </div>
      </div>
    </div>
  );
}
```

---

## 19. セキュリティ

### セキュリティチェックリスト

#### ミドルウェア層
- [ ] CSRF対策: Origin/Referer 検証（POST/PUT/DELETE /api/*）
- [ ] ドメイン正規化: www → naked リダイレクト
- [ ] セッション更新: 毎リクエストでトークンリフレッシュ

#### next.config.ts セキュリティヘッダー
```typescript
async headers() {
  const securityHeaders = [
    { key: 'X-Content-Type-Options', value: 'nosniff' },
    { key: 'X-Frame-Options', value: 'DENY' },
    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
    { key: 'X-DNS-Prefetch-Control', value: 'on' },
    { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  ];
  // 本番環境のみ CSP を追加
  if (isProduction) {
    securityHeaders.push({
      key: 'Content-Security-Policy',
      value: cspValue,  // connect-src に Sentry ingest エンドポイントを含む
    });
  }
  return [{ source: '/(.*)', headers: securityHeaders }];
},
```

#### API層
- [ ] 認証チェック: 全API先頭で `supabase.auth.getUser()`
- [ ] 入力バリデーション: `safeJsonParse()` + 個別フィールド検証
- [ ] 権限チェック: リソースの所有者 / 管理者権限
- [ ] エラーメッセージ: 内部情報を漏らさない（ユーザー向けメッセージのみ返す）

#### データベース層
- [ ] RLS有効化: 全テーブルで `ENABLE ROW LEVEL SECURITY`
- [ ] 送信者なりすまし防止: `sender_id = auth.uid()` チェック
- [ ] Admin操作は `service_role_key` 経由

#### フロントエンド層
- [ ] XSS対策: ユーザー入力の `escapeHtml()`
- [ ] メール送信: 1回のみエスケープ（二重エスケープ防止）

### サニタイズ関数

```typescript
// lib/sanitize.ts
const HTML_ESCAPE_MAP: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

export function escapeHtml(str: string): string {
  return str.replace(/[&<>"']/g, char => HTML_ESCAPE_MAP[char] || char);
}
```

---

## 20. レスポンシブ・アニメーション

### モバイルファーストの Tailwind パターン

```html
<!-- グリッド: 1列 → 2列 → 3列 → 4列 -->
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">

<!-- 表示切替: モバイルのみ / デスクトップのみ -->
<div class="block md:hidden">モバイルメニュー</div>
<div class="hidden md:block">デスクトップメニュー</div>

<!-- 改行制御（孤立文字防止） -->
<p>
  サービスの説明文がここに入ります。
  <br class="hidden md:block" />
  改行位置をデスクトップで調整します。
</p>

<!-- 余白の段階調整 -->
<section class="px-4 md:px-8 lg:px-16 py-12 md:py-20">

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
  up: { y: 30 },
  down: { y: -30 },
  left: { x: 30 },
  right: { x: -30 },
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
}: {
  children: React.ReactNode;
  staggerDelay?: number;
}) {
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

## 21. 環境変数・設定管理

### 環境変数のサービス別グルーピング

```typescript
// lib/env.ts

// 必須環境変数の取得（未設定ならエラー）
export function getRequiredEnv(key: string): string {
  const value = process.env[key];
  if (!value) throw new Error(`環境変数 ${key} が設定されていません`);
  return value;
}

// サービス別グルーピング
export function getSupabaseEnv() {
  return {
    url: getRequiredEnv('NEXT_PUBLIC_SUPABASE_URL'),
    anonKey: getRequiredEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
  };
}

export function getSupabaseAdminEnv() {
  return {
    ...getSupabaseEnv(),
    serviceRoleKey: getRequiredEnv('SUPABASE_SERVICE_ROLE_KEY'),
  };
}

export function getPaymentEnv() {
  return {
    accessToken: getRequiredEnv('SQUARE_ACCESS_TOKEN'),
    appId: getRequiredEnv('NEXT_PUBLIC_SQUARE_APP_ID'),
    locationId: getRequiredEnv('NEXT_PUBLIC_SQUARE_LOCATION_ID'),
    environment: process.env.SQUARE_ENVIRONMENT || 'sandbox',
  };
}

export function getEmailEnv() {
  return {
    apiKey: process.env.RESEND_API_KEY || null, // オプション（開発環境では未設定可）
    adminEmail: process.env.ADMIN_EMAIL || 'admin@example.com',
  };
}
```

### 外部APIクライアントの遅延初期化

```typescript
// lib/payment/client.ts
let clientInstance: PaymentClient | null = null;

function getClient(): PaymentClient {
  if (!clientInstance) {
    const env = getPaymentEnv();
    clientInstance = new PaymentClient({ accessToken: env.accessToken });
  }
  return clientInstance;
}

// Proxy パターン（環境変数読み込みタイミング問題の回避）
export const paymentClient = new Proxy({} as PaymentClient, {
  get(_target, prop) {
    return getClient()[prop as keyof PaymentClient];
  },
});
```

---

## 22. デプロイ・運用

### Vercel デプロイ設定

```json
// vercel.json
{
  "crons": [
    { "path": "/api/cron/update-ranks", "schedule": "0 6 1 * *" },
    { "path": "/api/cron/review-reminder", "schedule": "0 0 * * *" },
    { "path": "/api/cron/payment-hold-refund", "schedule": "0 3 * * *" },
    { "path": "/api/cron/cleanup-attachments", "schedule": "0 4 * * *" }
  ]
}
```

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

### デプロイ前チェックリスト

- [ ] `npm run build` が成功すること
- [ ] 環境変数が全て設定されていること（`lib/env.ts` の必須変数）
- [ ] Supabase マイグレーションが実行済みであること
- [ ] RLS ポリシーが正しく設定されていること
- [ ] CRON_SECRET が設定されていること
- [ ] 決済プロバイダの本番キーが設定されていること
- [ ] メール送信元ドメインが認証済みであること
- [ ] robots.txt で管理画面がDisallowされていること
- [ ] OGP画像が配置されていること
- [ ] sitemap.ts が正しくURLを生成すること
- [ ] Sentry DSN が設定されていること（`NEXT_PUBLIC_SENTRY_DSN`）

### 運用監視

| 項目 | 方法 |
|------|------|
| エラー監視 | **Sentry** — エラー自動キャプチャ、アラート通知、リプレイ |
| パフォーマンス | Sentry Performance — トレース、トランザクション監視 |
| Cronジョブ | レスポンスの `processed` / `errors` カウント |
| 決済 | Square ダッシュボード + DB のステータス照合 |
| メール配信 | Resend ダッシュボード |
| Web Vitals | Vercel Analytics + Core Web Vitals |

---

## 23. データベース読込パフォーマンス最適化

### Promise.all 並列クエリ

ダッシュボード等、複数の独立したDBクエリが必要なページでは `Promise.all` で並列実行する。

```typescript
// 実装例: サービス提供者ダッシュボード（6並列）
const [
  { data: directProjects },
  { data: applications },
  { data: monthlyProjects },
  { data: recentCompletedProjects },
  { data: completedProjects },
  { data: myReviews },
] = await Promise.all([
  supabase.from('projects')
    .select('id, title, status, budget, created_at, client:clients(company_name)')
    .eq('provider_id', user.id)
    .order('created_at', { ascending: false }),
  supabase.from('applications')
    .select('id, status, project:projects(id, title, status, budget)')
    .eq('provider_id', user.id)
    .order('created_at', { ascending: false }),
  supabase.from('projects')
    .select('final_amount')
    .eq('provider_id', user.id)
    .eq('status', 'completed')
    .gte('completed_at', startOfMonth),
  supabase.from('projects')
    .select('final_amount')
    .eq('provider_id', user.id)
    .eq('status', 'completed')
    .gte('completed_at', ninetyDaysAgo),
  supabase.from('projects')
    .select('id, title, client:clients(company_name)')
    .eq('provider_id', user.id)
    .eq('status', 'completed'),
  supabase.from('reviews')
    .select('project_id')
    .eq('reviewer_id', user.id),
]);
```

```typescript
// 実装例: ユーザーダッシュボード（最大9並列）
const [
  { count: reviewCount },
  { data: client },
  { count: refCount },
  campaignResult,
  { data: projects },
  { data: monthlyProjects },
  { data: favorites },
  { data: completedProjects },
  { data: myReviews },
] = await Promise.all([
  supabase.from('reviews')
    .select('id', { count: 'exact', head: true })
    .eq('reviewee_id', user.id),
  supabase.from('clients')
    .select('total_projects, total_spending, referral_code')
    .eq('id', user.id)
    .single(),
  supabase.from('referral_credits')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('type', 'referral_earned'),
  fetch('/api/referral/campaign-status')
    .then(r => r.json())
    .catch(() => ({ isActive: false })),
  // ... 残り5クエリ
]);
```

### 並列クエリの設計ルール

| ルール | 説明 |
|-------|------|
| **独立性の確認** | クエリ間にデータ依存がないことを確認してから並列化 |
| **個別エラーハンドリング** | 1つのクエリ失敗で全体を止めない（分割代入で個別にチェック） |
| **統計はhead:true** | カウントのみ必要な場合は `{ count: 'exact', head: true }` |
| **API fetchも混在可** | DB クエリだけでなく fetch() も Promise.all に含められる |

### 軽量SELECT（必要カラムのみ指定）

```typescript
// ❌ 全カラム取得（不要なデータも転送）
const { data } = await supabase.from('profiles').select('*');

// ✅ 必要カラムのみ（転送量削減）
const { data } = await supabase.from('profiles').select('id, display_name, avatar_url');

// ✅ 統計カウントのみ（レスポンスボディなし）
const { count } = await supabase
  .from('resources')
  .select('*', { count: 'exact', head: true })
  .eq('status', 'published');
```

### 複合インデックス設計

アクセスパターンに合わせたインデックスで読込速度を向上する:

```sql
-- テナント + ステータス + 日付（一覧ページの基本パターン）
CREATE INDEX idx_resources_tenant_status_created
  ON resources(tenant, status, created_at DESC)
  WHERE is_deleted = FALSE;

-- テナント + ユーザー（ダッシュボードの基本パターン）
CREATE INDEX idx_resources_tenant_user
  ON resources(tenant, user_id, created_at DESC);

-- ステータス + 公開フラグ（公開ページの基本パターン）
CREATE INDEX idx_resources_published
  ON resources(status, is_public, published_at DESC)
  WHERE status = 'published' AND is_public = TRUE;
```

### ページネーション

```typescript
// .range() で offset/limit ページネーション
const PAGE_SIZE = 20;
const offset = (page - 1) * PAGE_SIZE;

const { data, count } = await supabase
  .from('resources')
  .select('*', { count: 'exact' })
  .eq('tenant', tenant)
  .eq('status', 'published')
  .order('created_at', { ascending: false })
  .range(offset, offset + PAGE_SIZE - 1);

const totalPages = Math.ceil((count || 0) / PAGE_SIZE);
```

---

## 24. コンテンツ管理パターン（SEOコンテンツ自動生成）

### コラム機能

クリエイターが300-500字の専門コラムを投稿し、各テナントに独自URLを生成する。
クリエイターの投稿が集まるまでの初期コンテンツとして、運営が作成したコラムを掲載する:

```typescript
// app/columns/page.tsx（Server Component）
export default async function ColumnsPage() {
  const tenant = await getTenantFromRequest();
  const tenantName = getTenantLabel(tenant);
  const supabase = await createClient();

  const { data: columns, count } = await supabase
    .from('creator_columns')
    .select(`
      id,
      title,
      body,
      category,
      published_at,
      profiles:creator_id(display_name, avatar_url)
    `, { count: 'exact' })
    .eq('prefecture', tenant)
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .range(0, PAGE_SIZE - 1);

  return <ColumnsList columns={columns} tenantName={tenantName} />;
}
```

```typescript
// app/columns/[id]/page.tsx（詳細ページ + Article JSON-LD）
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const column = await getColumn(params.id);
  return {
    title: `${column.title} | コラム`,
    description: column.body.slice(0, 120),
  };
}

export default async function ColumnDetailPage({ params }: Props) {
  const column = await getColumn(params.id);
  const siteUrl = await getDynamicSiteUrl();

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'Article',
          headline: column.title,
          author: { '@type': 'Person', name: column.profiles?.display_name },
          datePublished: column.published_at,
          publisher: { '@type': 'Organization', name: 'サービス名' },
        })
      }} />
      <ColumnDetail column={column} />
    </>
  );
}
```

### Note記事連携

外部Note記事をRSSで取り込み、トップページに表示する:

```typescript
// components/NoteArticles.tsx
// RSS フィードから最新記事を取得し、カードレイアウトで表示
// Server Component → Client Component の分離パターン（Suspense対応）
```

### 行政お知らせ

行政機関からの補助金・イベント情報を自動取得し、各テナントページに表示する:

```typescript
// スクレイパーで行政サイトから情報収集 → DBに保存
// scripts/gov-contact-scraper.ts

// 管理画面で承認 → 公開
// app/api/admin/gov-bulletins/[id]/route.ts
```

### 共通パターン: Server + Client Component 分離

```typescript
// Server Component（データ取得）
async function ResourceList() {
  const data = await fetchResources();
  return <ResourceListClient initialData={data} />;
}

// Client Component（インタラクション）
'use client';
function ResourceListClient({ initialData }: { initialData: Resource[] }) {
  const [data, setData] = useState(initialData);
  const [filter, setFilter] = useState('all');
  // フィルタリング、ソート、ページネーション等のインタラクション
}
```

---

## 25. 情報管理・ドキュメント体系

### 3層ドキュメントシステム

| 層 | 変更頻度 | ファイル | 用途 |
|----|---------|---------|------|
| **設計層** | 低 | `DATABASE_DESIGN.md` | DB設計の意図・ER図 |
| | | `SERVICE_SPECIFICATION.md` | サービス仕様書 |
| | | `PAYMENT_SYSTEM.md` | 決済フロー設計 |
| | | `PLAN_MULTI_PREFECTURE_V2.md` | マルチテナント設計書 |
| **実装層** | 中 | `SCHEMA.md` | 全テーブル定義（**マイグレーション時に必ず同期**） |
| | | `DEPENDENCY_MAP.md` | 逆引き依存マップ |
| **運用層** | 高 | `RELEASE_CHECKLIST.md` | リリース手順書 |
| | | `OPERATION_POLICY.md` | 運用ポリシー |
| | | `20260225_PRODUCTION_GUIDE.md` | 本ガイド |

### DEPENDENCY_MAP.md のフォーマット

コード変更前に「何を確認すべきか」を即座に把握するための逆引きマップ:

```markdown
### `lib/some-file.ts`

**依存ファイル数**: N
**概要**: このファイルの役割の説明

**影響先**:

| カテゴリ | ファイル |
|---------|---------|
| **API Routes** | `app/api/xxx/route.ts`, ... |
| **Pages** | `app/xxx/page.tsx`, ... |
| **Components** | `components/xxx.tsx`, ... |

**変更時の確認事項**:
- [ ] 影響先ファイルの動作確認
- [ ] 型の整合性チェック
- [ ] 関連テストの実行
```

### SCHEMA.md の同期ルール

以下の変更を行った場合は、**必ず** `docs/SCHEMA.md` を同時更新する:

- テーブルの追加・削除
- カラムの追加・変更・削除
- FK（外部キー）の変更
- RLS ポリシーの追加・変更
- インデックスの追加・変更

```
マイグレーションSQL作成
  ↓ 同時に
SCHEMA.md を更新
  ↓ 同時に
DEPENDENCY_MAP.md に影響があれば更新
```

---

## 26. コード品質チェック機構

### 多層チェックによるコード破綻防止

```
1. Pre-commit フック（自動）
   ├── lint-staged → ESLint --fix
   ├── 型キャッシュクリア
   └── tsc --noEmit → TypeScript型チェック

2. 変更前の依存マップ確認（手動/AIツール）
   └── docs/DEPENDENCY_MAP.md を読み、影響範囲を特定

3. DBマイグレーション時のスキーマ同期（手動/AIツール）
   └── SQL作成 → docs/SCHEMA.md を同時更新

4. デプロイ前ビルド検証（必須）
   ├── npm run build（全変更で必須）
   └── npm run test:e2e（認証/決済/middleware変更時）

5. 通知INSERT統一化（コーディングルール）
   └── 全通知は lib/notifications.ts 経由
```

### Pre-commit フック詳細

```bash
# .husky/pre-commit
npx lint-staged         # 1. ESLint 自動修正
rm -rf .next/dev/types  # 2. stale型キャッシュの除去
npx tsc --noEmit        # 3. 全体の型チェック
```

**なぜ型キャッシュをクリアするか:**
Next.js の開発サーバーは `.next/dev/types` に型情報をキャッシュする。
古いキャッシュが残っていると、`tsc --noEmit` が偽の成功を返す場合がある。
pre-commit で毎回クリアすることで、正確な型チェックを保証する。

### 変更前の依存マップ確認ルール

ファイルを変更する前に、必ず以下の手順を踏む:

1. `docs/DEPENDENCY_MAP.md` を開く
2. 変更するファイルのセクションを確認
3. 影響先ファイルを**全て読む**
4. 影響範囲を把握してから変更に着手

```
例: lib/notifications.ts を変更する場合

→ DEPENDENCY_MAP.md の `lib/notifications.ts` セクションを確認
→ 影響先: 19ファイル（メッセージAPI、案件API、応募API、見積API 等）
→ NotificationType の変更は全19ファイルに影響
→ 全影響先を確認してから変更開始
```

### デプロイ前ビルド検証

| 変更内容 | `npm run build` | `npm run test:e2e` |
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
  type: 'order_received',
  title: '新しい発注がありました',
  message: `${projectTitle} の発注を受けました`,
  link: `/dashboard/projects/${projectId}`,
  projectId,
});

// ❌ 禁止: 直接INSERT
await supabase.from('notifications').insert({
  user_id: targetUserId,
  type: 'order_received',
  // ...
});
```

**統一ヘルパーの利点:**
- 通知タイプが `NotificationType` 型で制約される（タイプミス防止）
- エラーハンドリングが統一される
- 通知のフォーマット変更が1箇所で完結する
- `createServiceClient()` の使用が保証される（RLSバイパス）

---

## 付録: 新規プロジェクト立ち上げ手順

### 1. 初期セットアップ

```bash
npx create-next-app@latest my-project --typescript --tailwind --app
cd my-project
npm install @supabase/supabase-js @supabase/ssr
npm install resend square
npm install framer-motion lucide-react
npm install @sentry/nextjs
npm install -D husky lint-staged playwright
npx husky init
```

### 2. ディレクトリ構造の作成

```bash
mkdir -p lib/{supabase,auth,email,hooks,outreach}
mkdir -p components/{ui,forms,animations,admin,gov}
mkdir -p types
mkdir -p docs/migrations
mkdir -p scripts
mkdir -p contexts
mkdir -p app/{api,auth,'(dashboard)','(admin)','(legal)',columns,area,gov,tools}
```

### 3. 基盤ファイルの作成順序

1. `lib/env.ts` — 環境変数管理
2. `lib/supabase/` — 3層クライアント（client, server, middleware）
3. `middleware.ts` — CSRF + セッション更新 + テナントrewrite
4. `lib/auth/actions.ts` — 認証ロジック
5. `lib/notifications.ts` — 通知統一ヘルパー
6. `components/ui/` — 基本UIコンポーネント
7. `app/layout.tsx` — ルートレイアウト
8. `app/error.tsx` + `app/not-found.tsx` — エラーページ
9. DB テーブル定義 + RLS ポリシー
10. `docs/SCHEMA.md` + `docs/DEPENDENCY_MAP.md` — 初期ドキュメント
11. Sentry 設定（`sentry.*.config.ts` + `next.config.ts` 統合）
12. Husky pre-commit フック設定
13. APIルート（認証パターン確立後）
14. ページ実装

---

> **このガイドは Creator's Bridge の実装経験に基づく実践的なパターン集です。**
> プロジェクトの規模や要件に応じて、必要な部分を取捨選択して適用してください。
>
> 最終更新: 2026年2月25日

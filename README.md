# Miyazaki Creative Bridge - 宮崎のレンタルバイクプラットフォーム

宮崎県内の複数ベンダーが参加するレンタルバイクプラットフォーム。時間単位・日単位での予約が可能で、Square決済システムと連携しています。

## 技術スタック

- **Framework**: Next.js 16 (App Router, Turbopack)
- **Language**: TypeScript (Strict Mode)
- **Styling**: Tailwind CSS v4 (CSS-first方式)
- **Animation**: Framer Motion
- **Database/Auth**: Supabase (RLS有効)
- **Payment**: Square API

## セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. 環境変数の設定

`.env.local.example` を `.env.local` にコピーして、必要な環境変数を設定してください。

```bash
cp .env.local.example .env.local
```

必要な環境変数:
- `NEXT_PUBLIC_SUPABASE_URL`: SupabaseプロジェクトのURL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabaseの匿名キー
- `SUPABASE_SERVICE_ROLE_KEY`: Supabaseのサービスロールキー（サーバー専用）
- `NEXT_PUBLIC_SQUARE_APPLICATION_ID`: Square Application ID
- `SQUARE_APPLICATION_SECRET`: Square Application Secret（サーバー専用）
- `SQUARE_ACCESS_TOKEN`: Square Access Token（サーバー専用）

### 3. 開発サーバーの起動

```bash
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開いてください。

## プロジェクト構造

```
├── app/
│   ├── layout.tsx          # ルートレイアウト（メタデータ、構造化データ）
│   ├── page.tsx            # トップページ
│   └── globals.css         # グローバルスタイル（Tailwind v4 @theme設定）
├── components/
│   └── sections/
│       └── HeroSection.tsx # ヒーローセクション
├── lib/
│   └── supabase.ts         # Supabaseクライアント初期化
├── .cursorrules            # 開発標準ルール
└── README.md
```

## 開発ガイドライン

詳細な開発ガイドラインは `.cursorrules` ファイルを参照してください。

### 主要なルール

1. **余白設計**: セクション間は `py-[100px]` (デスクトップ) / `py-[50px]` (モバイル)
2. **タイポグラフィ**: 見出しは `font-serif` (Noto Serif JP)、本文は `font-sans`
3. **画像最適化**: `next/image` を必須使用、`width/height` を明示
4. **セキュリティ**: 機密情報に `NEXT_PUBLIC_` 接頭辞を付けない
5. **予約ロジック**: Supabase側でダブルブッキングチェックを実施

## データベース設計

主要なテーブル:
- `vendors`: ベンダー情報
- `bikes`: バイク情報
- `reservations`: 予約情報

詳細は `lib/supabase.ts` の型定義を参照してください。

## デプロイ

```bash
npm run build
npm run start
```

Vercelへのデプロイを推奨します。

## ライセンス

© 株式会社リンクス


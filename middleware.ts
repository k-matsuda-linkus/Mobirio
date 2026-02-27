import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// CSRF チェック除外パス
const CSRF_EXEMPT_PREFIXES = ['/api/cron/', '/api/auth/callback'];

// 認証不要の公開パス
const PUBLIC_PATHS = [
  '/',
  '/login',
  '/register',
  '/vendor-register',
  '/forgot-password',
  '/set-password',
  '/auth/callback',
  '/bikes',
  '/vendors',
  '/about',
  '/contact',
  '/terms',
  '/privacy',
  '/faq',
  '/help',
];

// 認証必須の保護パスプレフィックス
const PROTECTED_PREFIXES = ['/mypage', '/vendor', '/dashboard'];

function isPublicPath(pathname: string): boolean {
  // 完全一致
  if (PUBLIC_PATHS.includes(pathname)) return true;
  // プレフィックス一致（/bikes/xxx, /vendors/xxx 等）
  if (pathname.startsWith('/bikes/') || pathname.startsWith('/vendors/')) return true;
  return false;
}

function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(prefix + '/')
  );
}

function isAllowedOrigin(origin: string, requestUrl: string): boolean {
  const { hostname: requestHost } = new URL(requestUrl);
  try {
    const { hostname: originHost } = new URL(origin);
    return originHost === requestHost || originHost.endsWith('.' + requestHost);
  } catch {
    return false;
  }
}

export async function middleware(req: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: req.headers,
    },
  });

  const pathname = req.nextUrl.pathname;

  // --- CSRF 検証 (POST/PUT/DELETE) ---
  const method = req.method;
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
    const isCsrfExempt = CSRF_EXEMPT_PREFIXES.some((p) => pathname.startsWith(p));
    if (!isCsrfExempt) {
      const origin = req.headers.get('origin');
      const referer = req.headers.get('referer');
      const check = origin || referer;
      if (!check || !isAllowedOrigin(check, req.url)) {
        return new NextResponse('Forbidden', { status: 403 });
      }
    }
  }

  // --- APIルートはスルー（各API内で requireAuth 等で個別チェック済み）---
  if (pathname.startsWith('/api/')) {
    return response;
  }

  // --- Sandbox モード: 認証チェックをスキップ ---
  // SANDBOX_MODE（サーバー専用）は Edge Runtime でランタイム参照可能
  // NEXT_PUBLIC_SANDBOX_MODE はビルド時インライン化のためフォールバック
  const isSandbox =
    process.env.SANDBOX_MODE === 'true' ||
    process.env.NEXT_PUBLIC_SANDBOX_MODE === 'true' ||
    !process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (isSandbox) {
    return response;
  }

  // --- Supabase セッション更新 ---
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    return response;
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            req.cookies.set(name, value)
          );
          response = NextResponse.next({
            request: {
              headers: req.headers,
            },
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // --- 保護パスへの未認証アクセスをリダイレクト ---
  if (!user && isProtectedPath(pathname)) {
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = '/login';
    redirectUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(redirectUrl);
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};

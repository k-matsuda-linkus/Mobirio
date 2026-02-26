// import { createServerClient } from '@supabase/ssr'; // TODO: 本番リリース時に復活
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// CSRF チェック除外パス
const CSRF_EXEMPT_PREFIXES = ['/api/cron/', '/api/auth/callback'];

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
  const response = NextResponse.next({
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

  // --- セッションチェック ---
  // 開発初期: 認証リダイレクトを無効化（マイページ・ベンダー・管理画面にログインなしでアクセス可能）
  // 管理画面は AdminPinGate コンポーネントで4桁PINロック
  // TODO: 本番リリース時に認証チェックを再有効化
  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};

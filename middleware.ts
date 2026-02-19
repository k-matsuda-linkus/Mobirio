import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const response = NextResponse.next({
    request: {
      headers: req.headers,
    },
  });

  // セッションチェックが必要なパスのみSupabaseに接続
  // 注意: /vendor は保護だが /vendors は公開ページ
  const protectedPaths = ['/mypage', '/dashboard'];
  const pathname = req.nextUrl.pathname;
  const isProtectedPath =
    protectedPaths.some((path) => pathname.startsWith(path)) ||
    (pathname === '/vendor' || pathname.startsWith('/vendor/'));
  const isLoginPath = req.nextUrl.pathname.startsWith('/login');

  if (!isProtectedPath && !isLoginPath) {
    return response;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return response;
  }

  let mutableResponse = response;
  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return req.cookies.get(name)?.value;
      },
      set(name: string, value: string, options: Record<string, unknown>) {
        req.cookies.set({ name, value, ...options });
        mutableResponse = NextResponse.next({
          request: { headers: req.headers },
        });
        mutableResponse.cookies.set({ name, value, ...options });
      },
      remove(name: string, options: Record<string, unknown>) {
        req.cookies.set({ name, value: '', ...options });
        mutableResponse = NextResponse.next({
          request: { headers: req.headers },
        });
        mutableResponse.cookies.set({ name, value: '', ...options });
      },
    },
  });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  // TODO: 本番環境では認証チェックを有効化すること
  // if (isProtectedPath && !session) {
  //   const redirectUrl = req.nextUrl.clone();
  //   redirectUrl.pathname = '/login';
  //   redirectUrl.searchParams.set('redirect', req.nextUrl.pathname);
  //   return NextResponse.redirect(redirectUrl);
  // }

  if (isLoginPath && session) {
    return NextResponse.redirect(new URL('/mypage', req.url));
  }

  return mutableResponse;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};

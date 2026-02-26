import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next");
  const origin = new URL(request.url).origin;

  if (!code) {
    return NextResponse.redirect(new URL("/", origin));
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error("Auth callback error:", error);
    return NextResponse.redirect(new URL("/login?error=auth_callback_failed", origin));
  }

  // next パラメータがあればそちらへ（相対パスのみ許可）
  if (next && next.startsWith("/") && !next.startsWith("//")) {
    return NextResponse.redirect(new URL(next, origin));
  }

  // ロール別デフォルトリダイレクト
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError) {
      console.error("Auth callback: profile fetch error:", profileError);
    }

    if (profile?.role === "vendor") {
      return NextResponse.redirect(new URL("/vendor", origin));
    }
    if (profile?.role === "admin") {
      return NextResponse.redirect(new URL("/dashboard", origin));
    }
  }

  return NextResponse.redirect(new URL("/mypage", origin));
}

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/requireAuth";
import { createAdminSupabaseClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email/send";
import { vendorInvitationEmail } from "@/lib/email/vendorInvitation";
import { VENDOR_PLANS } from "@/lib/mock/vendors";
import type { VendorPlan } from "@/lib/mock/vendors";
import { env } from "@/lib/env";

export async function POST(request: NextRequest) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  let body: { email: string; plan: VendorPlan; regType: "new" | "existing"; businessId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "不正なリクエスト" }, { status: 400 });
  }

  const { email, plan, regType, businessId } = body;

  if (!email || !plan || !regType) {
    return NextResponse.json({ error: "必須パラメータが不足しています" }, { status: 400 });
  }

  if (!(plan in VENDOR_PLANS)) {
    return NextResponse.json({ error: "無効なプランです" }, { status: 400 });
  }

  if (regType === "existing" && !businessId) {
    return NextResponse.json({ error: "既存事業者の場合、businessId が必要です" }, { status: 400 });
  }

  const appUrl = env.appUrl();
  const adminSupabase = createAdminSupabaseClient();

  // Supabase admin API で招待リンクを生成
  const { data: linkData, error: linkError } = await adminSupabase.auth.admin.generateLink({
    type: "invite",
    email,
    options: {
      data: { plan, regType, businessId: businessId || null },
      redirectTo: `${appUrl}/api/auth/callback?next=/register/vendor`,
    },
  });

  if (linkError) {
    console.error("generateLink error:", linkError);
    // メール重複チェック
    if (linkError.message?.includes("already registered") || linkError.message?.includes("already been registered")) {
      return NextResponse.json({ error: "このメールアドレスは既に登録されています" }, { status: 409 });
    }
    return NextResponse.json({ error: linkError.message || "招待リンクの生成に失敗しました" }, { status: 500 });
  }

  // generateLink は hashed_token を含む action_link を返す
  const inviteUrl = linkData.properties.action_link;

  // Resend でカスタム招待メールを送信
  const planLabel = VENDOR_PLANS[plan].label;
  const template = vendorInvitationEmail({ inviteUrl, planLabel, regType });
  const emailResult = await sendEmail({ to: email, template });

  if (!emailResult.success) {
    console.error("Email send failed:", emailResult.error);
    return NextResponse.json({ error: "メールの送信に失敗しました" }, { status: 500 });
  }

  return NextResponse.json({ success: true, email });
}

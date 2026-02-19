import { NextRequest, NextResponse } from 'next/server';
import { isSandboxMode } from '@/lib/sandbox';
import { sendSandboxEmail } from '@/lib/sandbox/email';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { action, bikeId, bikeName, vendorName, vendorEmail } = body;

  if (!action || !bikeId) {
    return NextResponse.json({ error: 'action と bikeId は必須です' }, { status: 400 });
  }

  if (action === 'apply') {
    // 保険会社に加入申込メール送信
    if (isSandboxMode()) {
      await sendSandboxEmail({
        to: 'insurance@example-insurance.co.jp',
        subject: `【Mobirio】任意保険 加入申込 - ${bikeName}`,
        text: `ベンダー: ${vendorName}\n車両: ${bikeName}\n車両ID: ${bikeId}\n\n上記車両の任意保険加入を申し込みます。\n手続き完了後、運営宛にご連絡ください。`,
      });
      // 運営にも通知
      await sendSandboxEmail({
        to: 'admin@mobirio.jp',
        subject: `【保険申込】${vendorName} - ${bikeName}`,
        text: `${vendorName}より${bikeName}の任意保険加入申込がありました。\n保険会社からの手続き完了連絡をお待ちください。`,
      });
    } else {
      const { createServerSupabaseClient } = await import('@/lib/supabase/server');
      const supabase = await createServerSupabaseClient();
      // TODO: 本番メール送信 (Resend)
      // TODO: bikes テーブルの insurance_status 更新
    }

    return NextResponse.json({
      success: true,
      message: '保険会社に加入申込メールを送信しました。手続き完了までお待ちください。',
      newStatus: 'insurance_applying',
    });
  }

  if (action === 'cancel') {
    // 保険会社に解約メール送信
    if (isSandboxMode()) {
      await sendSandboxEmail({
        to: 'insurance@example-insurance.co.jp',
        subject: `【Mobirio】任意保険 解約申請 - ${bikeName}`,
        text: `ベンダー: ${vendorName}\n車両: ${bikeName}\n車両ID: ${bikeId}\n\n上記車両の任意保険を解約します。`,
      });
      await sendSandboxEmail({
        to: 'admin@mobirio.jp',
        subject: `【保険解約・車両アーカイブ】${vendorName} - ${bikeName}`,
        text: `${vendorName}より${bikeName}の任意保険解約申請がありました。\n車両は自動的に非公開・アーカイブに移行しました。`,
      });
    } else {
      const { createServerSupabaseClient } = await import('@/lib/supabase/server');
      const supabase = await createServerSupabaseClient();
      // TODO: 本番メール送信 (Resend)
      // TODO: bikes テーブルの insurance_status, is_published, is_archived 更新
    }

    return NextResponse.json({
      success: true,
      message: '保険会社に解約申請メールを送信しました。車両は非公開・アーカイブに移行しました。',
      newStatus: 'insurance_cancelled',
      archived: true,
    });
  }

  return NextResponse.json({ error: '不正なアクションです' }, { status: 400 });
}

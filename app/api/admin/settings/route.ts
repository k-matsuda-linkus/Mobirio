import { NextRequest, NextResponse } from 'next/server';
import { isSandboxMode, sandboxLog } from '@/lib/sandbox';

const mockSettings = {
  platform_fee_percent: 10,
  max_reservation_days: 30,
  cancellation_policy_hours: 48,
  auto_expire_pending_minutes: 30,
  review_reminder_days: 3,
  maintenance_mode: false,
  support_email: 'support@mobirio.jp',
  notification_email_enabled: true,
  notification_sms_enabled: false,
  min_payout_amount: 5000,
  payout_schedule: 'monthly',
  cdw_default_rate: 1000,
  noc_default_rate: 500,
};

export async function GET(_request: NextRequest) {
  if (isSandboxMode()) {
    return NextResponse.json({
      data: mockSettings,
      message: 'OK',
    });
  }

  return NextResponse.json({ data: {}, message: 'Production mode not configured' });
}

export async function PUT(request: NextRequest) {
  if (isSandboxMode()) {
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON', message: 'リクエストボディが不正です' },
        { status: 400 }
      );
    }

    const { settings } = body;

    if (!settings || typeof settings !== 'object') {
      return NextResponse.json(
        { error: 'Bad request', message: 'settings オブジェクトは必須です' },
        { status: 400 }
      );
    }

    // バリデーション: 許可されたキーのみ
    const allowedKeys = Object.keys(mockSettings);
    const invalidKeys = Object.keys(settings).filter((k) => !allowedKeys.includes(k));
    if (invalidKeys.length > 0) {
      return NextResponse.json(
        { error: 'Bad request', message: `不正な設定キー: ${invalidKeys.join(', ')}` },
        { status: 400 }
      );
    }

    sandboxLog('settings_update', JSON.stringify(settings));

    // マージした結果を返す（実際のDBには書き込まない）
    const merged = { ...mockSettings, ...settings };

    return NextResponse.json({
      success: true,
      message: 'システム設定を更新しました',
      data: merged,
    });
  }

  return NextResponse.json({ success: false, message: 'Production mode not configured' });
}

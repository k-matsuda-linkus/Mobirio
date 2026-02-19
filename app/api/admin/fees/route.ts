import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

const FEE_KEYS = [
  'royalty_bike_percent',
  'royalty_moped_percent',
  'ec_payment_fee_percent',
  'royalty_split_linkus',
  'royalty_split_system_dev',
  'royalty_split_additional_one',
] as const;

const DEFAULTS: Record<string, string> = {
  royalty_bike_percent: '12',
  royalty_moped_percent: '11',
  ec_payment_fee_percent: '3.6',
  royalty_split_linkus: '50',
  royalty_split_system_dev: '35',
  royalty_split_additional_one: '15',
};

/** ロイヤリティ・EC決済手数料・分配率の取得 */
export async function GET() {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from('system_settings')
    .select('key, value')
    .in('key', [...FEE_KEYS]);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const kv: Record<string, string> = {};
  for (const row of data ?? []) {
    kv[row.key] = row.value;
  }

  const result: Record<string, string> = {};
  for (const key of FEE_KEYS) {
    result[key] = kv[key] ?? DEFAULTS[key];
  }

  return NextResponse.json({ data: result });
}

/** ロイヤリティ・EC決済手数料・分配率の更新 */
export async function PUT(request: NextRequest) {
  let body: Record<string, number | string>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'リクエストボディが不正です' },
      { status: 400 }
    );
  }

  const supabase = await createServerSupabaseClient();
  const updates: { key: string; value: string }[] = [];

  for (const key of FEE_KEYS) {
    if (body[key] !== undefined) {
      const v = Number(body[key]);
      if (isNaN(v) || v < 0) {
        return NextResponse.json(
          { error: `${key} は0以上の数値を指定してください` },
          { status: 400 }
        );
      }
      updates.push({ key, value: String(v) });
    }
  }

  if (updates.length === 0) {
    return NextResponse.json(
      { error: '更新する値が必要です' },
      { status: 400 }
    );
  }

  for (const u of updates) {
    const { error } = await supabase
      .from('system_settings')
      .update({ value: u.value, updated_at: new Date().toISOString() })
      .eq('key', u.key);

    if (error) {
      return NextResponse.json(
        { error: `${u.key} の更新に失敗: ${error.message}` },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({
    success: true,
    message: '手数料設定を更新しました',
  });
}

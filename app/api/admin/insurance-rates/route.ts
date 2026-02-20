import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase/server';

/** 保険関連の全設定キー */
const INSURANCE_KEYS = [
  'insurance_rate_motorcycle',
  'insurance_rate_moped',
  'insurance_cost_motorcycle',
  'insurance_cost_moped',
  'linkus_fee_motorcycle',
  'linkus_fee_moped',
  'additional_one_fee_motorcycle',
  'additional_one_fee_moped',
] as const;

/** 任意保険 関連設定の取得 */
export async function GET() {
  const supabase = createAdminSupabaseClient();

  const { data, error } = await supabase
    .from('system_settings')
    .select('key, value')
    .in('key', [...INSURANCE_KEYS]);

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  const kv: Record<string, number> = {};
  for (const row of data ?? []) {
    kv[row.key] = Number(row.value) || 0;
  }

  return NextResponse.json({
    data: {
      rate_motorcycle: kv['insurance_rate_motorcycle'] ?? 0,
      rate_moped: kv['insurance_rate_moped'] ?? 0,
      cost_motorcycle: kv['insurance_cost_motorcycle'] ?? 0,
      cost_moped: kv['insurance_cost_moped'] ?? 0,
      linkus_fee_motorcycle: kv['linkus_fee_motorcycle'] ?? 0,
      linkus_fee_moped: kv['linkus_fee_moped'] ?? 0,
      additional_one_fee_motorcycle: kv['additional_one_fee_motorcycle'] ?? 0,
      additional_one_fee_moped: kv['additional_one_fee_moped'] ?? 0,
    },
  });
}

/** キー → DB キー のマッピング */
const FIELD_TO_KEY: Record<string, string> = {
  rate_motorcycle: 'insurance_rate_motorcycle',
  rate_moped: 'insurance_rate_moped',
  cost_motorcycle: 'insurance_cost_motorcycle',
  cost_moped: 'insurance_cost_moped',
  linkus_fee_motorcycle: 'linkus_fee_motorcycle',
  linkus_fee_moped: 'linkus_fee_moped',
  additional_one_fee_motorcycle: 'additional_one_fee_motorcycle',
  additional_one_fee_moped: 'additional_one_fee_moped',
};

/** 任意保険 関連設定の更新 */
export async function PUT(request: NextRequest) {
  let body: Record<string, number>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'リクエストボディが不正です' },
      { status: 400 }
    );
  }

  const supabase = createAdminSupabaseClient();
  const updates: { key: string; value: string }[] = [];

  for (const [field, dbKey] of Object.entries(FIELD_TO_KEY)) {
    if (body[field] !== undefined) {
      const v = Number(body[field]);
      if (isNaN(v) || v < 0) {
        return NextResponse.json(
          { error: `${field} は0以上の数値を指定してください` },
          { status: 400 }
        );
      }
      updates.push({ key: dbKey, value: String(v) });
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
    message: '任意保険設定を更新しました',
  });
}

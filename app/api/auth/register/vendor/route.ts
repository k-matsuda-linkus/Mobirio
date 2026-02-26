import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase/server";
import { VENDOR_PLANS } from "@/lib/mock/vendors";
import type { VendorPlan } from "@/lib/mock/vendors";

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();

  // 認証チェック
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
  }

  let body: {
    shopName: string;
    prefecture: string;
    city: string;
    address: string;
    phone: string;
    description?: string;
    name: string;
    plan: VendorPlan | null;
    regType: "new" | "existing";
    businessId?: string | null;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "不正なリクエスト" }, { status: 400 });
  }

  const { shopName, prefecture, city, address, phone, description, name, plan, regType, businessId } = body;

  if (!shopName || !prefecture || !city || !address || !phone || !name) {
    return NextResponse.json({ error: "必須項目が不足しています" }, { status: 400 });
  }

  const adminSupabase = createAdminSupabaseClient();

  // slug 生成（店舗名をローマ字化する代わりにユニークIDを使用）
  const slug = shopName
    .toLowerCase()
    .replace(/[^\w\u3040-\u309f\u30a0-\u30ff\u4e00-\u9faf]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "") || "vendor";
  const uniqueSlug = `${slug}-${Date.now().toString(36)}`;

  // プランに基づくコミッション率
  const commissionRate = plan && plan in VENDOR_PLANS
    ? VENDOR_PLANS[plan].commissionRate
    : VENDOR_PLANS.rental_bike.commissionRate;

  try {
    // 1. users テーブルにレコード作成
    const { error: userInsertError } = await adminSupabase
      .from("users")
      .insert({
        id: user.id,
        email: user.email!,
        full_name: name,
        role: "vendor",
      });

    if (userInsertError) {
      // 既に存在する場合はロールを更新
      if (userInsertError.code === "23505") {
        await adminSupabase
          .from("users")
          .update({ role: "vendor", full_name: name })
          .eq("id", user.id);
      } else {
        console.error("User insert error:", userInsertError);
        return NextResponse.json({ error: "ユーザー登録に失敗しました" }, { status: 500 });
      }
    }

    // 2. vendors テーブルにレコード作成
    const { error: vendorInsertError } = await adminSupabase
      .from("vendors")
      .insert({
        user_id: user.id,
        name: shopName,
        slug: uniqueSlug,
        description: description || null,
        address: `${prefecture}${city}${address}`,
        prefecture,
        city,
        contact_email: user.email,
        contact_phone: phone,
        commission_rate: commissionRate,
        is_active: true,
        is_approved: false,
      });

    if (vendorInsertError) {
      console.error("Vendor insert error:", vendorInsertError);
      return NextResponse.json({ error: "店舗登録に失敗しました" }, { status: 500 });
    }

    return NextResponse.json({ success: true, redirect: "/vendor" });
  } catch (err) {
    console.error("Register vendor error:", err);
    return NextResponse.json({ error: "登録処理中にエラーが発生しました" }, { status: 500 });
  }
}

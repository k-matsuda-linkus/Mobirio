import { NextRequest, NextResponse } from "next/server";
import { requireVendor } from "@/lib/auth/requireAuth";
import { isSandboxMode, sandboxLog } from "@/lib/sandbox";
import { mockVendors } from "@/lib/mock/vendors";

export async function GET(request: NextRequest) {
  const authResult = await requireVendor(request);
  if (authResult instanceof NextResponse) return authResult;
  const { vendor, supabase } = authResult;

  if (isSandboxMode()) {
    sandboxLog("GET /api/vendor/shop", `vendor=${vendor.id}`);
    const mv = mockVendors.find((v) => v.id === vendor.id) ?? mockVendors[0];
    return NextResponse.json({ data: mv, message: "OK" });
  }

  const { data, error } = await supabase
    .from("vendors")
    .select("*")
    .eq("id", vendor.id)
    .single();

  if (error) {
    return NextResponse.json(
      { error: "Database error", message: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ data, message: "OK" });
}

export async function PUT(request: NextRequest) {
  const authResult = await requireVendor(request);
  if (authResult instanceof NextResponse) return authResult;
  const { vendor, supabase } = authResult;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON", message: "リクエストボディが不正です" },
      { status: 400 }
    );
  }

  if (isSandboxMode()) {
    sandboxLog("PUT /api/vendor/shop", `vendor=${vendor.id}`);
    return NextResponse.json({ data: { ...vendor, ...body }, message: "店舗情報を更新しました" });
  }

  const { data, error } = await supabase
    .from("vendors")
    .update({ ...body, updated_at: new Date().toISOString() })
    .eq("id", vendor.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { error: "Database error", message: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ data, message: "店舗情報を更新しました" });
}

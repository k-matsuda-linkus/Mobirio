import { NextRequest, NextResponse } from "next/server";
import { requireVendor } from "@/lib/auth/requireAuth";
import { isSandboxMode, sandboxLog } from "@/lib/sandbox";
import { mockOptions } from "@/lib/mock/options";

export async function GET(request: NextRequest) {
  const authResult = await requireVendor(request);
  if (authResult instanceof NextResponse) return authResult;
  const { vendor, supabase } = authResult;

  if (isSandboxMode()) {
    sandboxLog("GET /api/vendor/options", `vendor=${vendor.id}`);
    const filtered = mockOptions.filter((o) => o.vendor_id === vendor.id);
    return NextResponse.json({ data: filtered, message: "OK" });
  }

  const { data, error } = await supabase
    .from("options")
    .select("*")
    .eq("vendor_id", vendor.id)
    .order("sort_order", { ascending: true });

  if (error) {
    return NextResponse.json(
      { error: "Database error", message: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ data, message: "OK" });
}

export async function POST(request: NextRequest) {
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

  if (!body.name || !body.category) {
    return NextResponse.json(
      { error: "Validation error", message: "name, category は必須です" },
      { status: 400 }
    );
  }

  if (isSandboxMode()) {
    sandboxLog("POST /api/vendor/options", `vendor=${vendor.id}, name=${body.name}`);
    return NextResponse.json(
      { data: { id: `opt-new-${Date.now()}`, vendor_id: vendor.id, ...body }, message: "オプションを作成しました" },
      { status: 201 }
    );
  }

  const { data, error } = await supabase
    .from("options")
    .insert({ ...body, vendor_id: vendor.id } as any)
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { error: "Database error", message: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ data, message: "オプションを作成しました" }, { status: 201 });
}

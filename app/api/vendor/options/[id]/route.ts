import { NextRequest, NextResponse } from "next/server";
import { requireVendor } from "@/lib/auth/requireAuth";
import { isSandboxMode, sandboxLog } from "@/lib/sandbox";
import { mockOptions } from "@/lib/mock/options";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  const authResult = await requireVendor(request);
  if (authResult instanceof NextResponse) return authResult;
  const { vendor, supabase } = authResult;
  const { id } = await context.params;

  if (isSandboxMode()) {
    sandboxLog("GET /api/vendor/options/[id]", `vendor=${vendor.id}, id=${id}`);
    const option = mockOptions.find((o) => o.id === id && o.vendor_id === vendor.id);
    if (!option) {
      return NextResponse.json(
        { error: "Not found", message: "オプションが見つかりません" },
        { status: 404 }
      );
    }
    return NextResponse.json({ data: option, message: "OK" });
  }

  const { data, error } = await supabase
    .from("options")
    .select("*")
    .eq("id", id)
    .eq("vendor_id", vendor.id)
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: "Not found", message: "オプションが見つかりません" },
      { status: 404 }
    );
  }

  return NextResponse.json({ data, message: "OK" });
}

export async function PUT(request: NextRequest, context: RouteContext) {
  const authResult = await requireVendor(request);
  if (authResult instanceof NextResponse) return authResult;
  const { vendor, supabase } = authResult;
  const { id } = await context.params;

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
    sandboxLog("PUT /api/vendor/options/[id]", `vendor=${vendor.id}, id=${id}`);
    const option = mockOptions.find((o) => o.id === id && o.vendor_id === vendor.id);
    if (!option) {
      return NextResponse.json(
        { error: "Not found", message: "オプションが見つかりません" },
        { status: 404 }
      );
    }
    return NextResponse.json({ data: { ...option, ...body }, message: "オプションを更新しました" });
  }

  const { data, error } = await supabase
    .from("options")
    .update(body)
    .eq("id", id)
    .eq("vendor_id", vendor.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { error: "Database error", message: error.message },
      { status: 500 }
    );
  }

  if (!data) {
    return NextResponse.json(
      { error: "Not found", message: "オプションが見つかりません" },
      { status: 404 }
    );
  }

  return NextResponse.json({ data, message: "オプションを更新しました" });
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const authResult = await requireVendor(request);
  if (authResult instanceof NextResponse) return authResult;
  const { vendor, supabase } = authResult;
  const { id } = await context.params;

  if (isSandboxMode()) {
    sandboxLog("DELETE /api/vendor/options/[id]", `vendor=${vendor.id}, id=${id}`);
    const option = mockOptions.find((o) => o.id === id && o.vendor_id === vendor.id);
    if (!option) {
      return NextResponse.json(
        { error: "Not found", message: "オプションが見つかりません" },
        { status: 404 }
      );
    }
    return NextResponse.json({ message: "オプションを削除しました" });
  }

  const { error } = await supabase
    .from("options")
    .delete()
    .eq("id", id)
    .eq("vendor_id", vendor.id);

  if (error) {
    return NextResponse.json(
      { error: "Database error", message: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ message: "オプションを削除しました" });
}

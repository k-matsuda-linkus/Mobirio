import { NextRequest, NextResponse } from "next/server";
import { requireVendor } from "@/lib/auth/requireAuth";
import { isSandboxMode, sandboxLog } from "@/lib/sandbox";
import { mockBikes } from "@/lib/mock/bikes";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  const authResult = await requireVendor(request);
  if (authResult instanceof NextResponse) return authResult;
  const { vendor, supabase } = authResult;
  const { id } = await context.params;

  if (isSandboxMode()) {
    sandboxLog("GET /api/vendor/bikes/[id]", `vendor=${vendor.id}, id=${id}`);
    const bike = mockBikes.find((b) => b.id === id && b.vendor_id === vendor.id);
    if (!bike) {
      return NextResponse.json(
        { error: "Not found", message: "車両が見つかりません" },
        { status: 404 }
      );
    }
    return NextResponse.json({ data: bike, message: "OK" });
  }

  const { data, error } = await supabase
    .from("bikes")
    .select("*")
    .eq("id", id)
    .eq("vendor_id", vendor.id)
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: "Not found", message: "車両が見つかりません" },
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
    sandboxLog("PUT /api/vendor/bikes/[id]", `vendor=${vendor.id}, id=${id}`);
    const bike = mockBikes.find((b) => b.id === id && b.vendor_id === vendor.id);
    if (!bike) {
      return NextResponse.json(
        { error: "Not found", message: "車両が見つかりません" },
        { status: 404 }
      );
    }
    return NextResponse.json({ data: { ...bike, ...body }, message: "車両を更新しました" });
  }

  const { data, error } = await supabase
    .from("bikes")
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
      { error: "Not found", message: "車両が見つかりません" },
      { status: 404 }
    );
  }

  return NextResponse.json({ data, message: "車両を更新しました" });
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const authResult = await requireVendor(request);
  if (authResult instanceof NextResponse) return authResult;
  const { vendor, supabase } = authResult;
  const { id } = await context.params;

  if (isSandboxMode()) {
    sandboxLog("DELETE /api/vendor/bikes/[id]", `vendor=${vendor.id}, id=${id}`);
    const bike = mockBikes.find((b) => b.id === id && b.vendor_id === vendor.id);
    if (!bike) {
      return NextResponse.json(
        { error: "Not found", message: "車両が見つかりません" },
        { status: 404 }
      );
    }
    return NextResponse.json({ message: "車両をアーカイブしました" });
  }

  const { error } = await supabase
    .from("bikes")
    .update({ is_available: false })
    .eq("id", id)
    .eq("vendor_id", vendor.id);

  if (error) {
    return NextResponse.json(
      { error: "Database error", message: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ message: "車両をアーカイブしました" });
}

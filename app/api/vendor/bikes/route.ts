import { NextRequest, NextResponse } from "next/server";
import { requireVendor } from "@/lib/auth/requireAuth";
import { isSandboxMode, sandboxLog } from "@/lib/sandbox";
import { mockBikes } from "@/lib/mock/bikes";

export async function GET(request: NextRequest) {
  const authResult = await requireVendor(request);
  if (authResult instanceof NextResponse) return authResult;
  const { vendor, supabase } = authResult;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const limit = searchParams.get("limit");

  if (isSandboxMode()) {
    sandboxLog("GET /api/vendor/bikes", `vendor=${vendor.id}`);
    let filtered = mockBikes.filter((b) => b.vendor_id === vendor.id);
    if (status === "archived") {
      filtered = filtered.filter((b) => !b.is_available);
    } else if (status === "published") {
      filtered = filtered.filter((b) => b.is_published && b.is_available);
    } else if (status === "unpublished") {
      filtered = filtered.filter((b) => !b.is_published && b.is_available);
    } else {
      filtered = filtered.filter((b) => b.is_available);
    }
    if (limit) {
      filtered = filtered.slice(0, Number(limit));
    }
    return NextResponse.json({ data: filtered, message: "OK" });
  }

  let query = supabase
    .from("bikes")
    .select("*")
    .eq("vendor_id", vendor.id)
    .order("display_order", { ascending: true });

  if (status === "archived") {
    query = query.eq("is_available", false);
  } else if (status === "published") {
    query = query.eq("is_available", true).eq("is_published", true);
  } else if (status === "unpublished") {
    query = query.eq("is_available", true).eq("is_published", false);
  } else {
    query = query.eq("is_available", true);
  }

  if (limit) {
    query = query.limit(Number(limit));
  }

  const { data, error } = await query;

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

  if (!body.name || !body.model || !body.manufacturer) {
    return NextResponse.json(
      { error: "Validation error", message: "name, model, manufacturer は必須です" },
      { status: 400 }
    );
  }

  if (isSandboxMode()) {
    sandboxLog("POST /api/vendor/bikes", `vendor=${vendor.id}, name=${body.name}`);
    return NextResponse.json(
      { data: { id: `bike-new-${Date.now()}`, vendor_id: vendor.id, ...body }, message: "車両を登録しました" },
      { status: 201 }
    );
  }

  const { data, error } = await supabase
    .from("bikes")
    .insert({ ...body, vendor_id: vendor.id } as any)
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { error: "Database error", message: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ data, message: "車両を登録しました" }, { status: 201 });
}

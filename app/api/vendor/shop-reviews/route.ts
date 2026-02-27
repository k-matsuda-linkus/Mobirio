import { NextRequest, NextResponse } from "next/server";
import { requireVendor } from "@/lib/auth/requireAuth";
import { isSandboxMode, sandboxLog } from "@/lib/sandbox";

const mockReviews = [
  {
    id: "rev_001", vendor_id: "v-001", reservation_id: "res_010", user_id: "user_001",
    nickname: "田中太郎", content: "とても親切な対応でした。バイクの状態も良好です。",
    reply: "ご利用ありがとうございました！", reply_by: "v-001", reply_at: "2025-01-13T09:00:00Z",
    is_published: true, posted_at: "2025-01-12T14:00:00Z",
  },
  {
    id: "rev_002", vendor_id: "v-001", reservation_id: "res_011", user_id: "user_002",
    nickname: "佐藤花子", content: "便利なロケーションでした。",
    reply: null, reply_by: null, reply_at: null,
    is_published: true, posted_at: "2025-01-10T16:00:00Z",
  },
];

export async function GET(request: NextRequest) {
  const authResult = await requireVendor(request);
  if (authResult instanceof NextResponse) return authResult;
  const { vendor, supabase } = authResult;

  const searchParams = request.nextUrl.searchParams;
  const limit = parseInt(searchParams.get("limit") || "50");
  const offset = parseInt(searchParams.get("offset") || "0");

  if (isSandboxMode()) {
    sandboxLog("GET /api/vendor/shop-reviews", `vendor=${vendor.id}`);
    const filtered = mockReviews.filter((r) => r.vendor_id === vendor.id);
    return NextResponse.json({
      data: filtered.slice(offset, offset + limit),
      summary: { total_count: filtered.length },
      pagination: { total: filtered.length, limit, offset },
      message: "OK",
    });
  }

  const { data, error, count } = await supabase
    .from("shop_reviews")
    .select("*", { count: "exact" })
    .eq("vendor_id", vendor.id)
    .order("posted_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    return NextResponse.json(
      { error: "Database error", message: error.message },
      { status: 500 }
    );
  }

  const reviews = data ?? [];

  return NextResponse.json({
    data: reviews,
    summary: { total_count: count ?? 0 },
    pagination: { total: count ?? 0, limit, offset },
    message: "OK",
  });
}

export async function POST(request: NextRequest) {
  const authResult = await requireVendor(request);
  if (authResult instanceof NextResponse) return authResult;
  const { vendor, supabase } = authResult;

  let body: { reservation_id?: string; user_id?: string; nickname?: string; content?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON", message: "リクエストボディが不正です" },
      { status: 400 }
    );
  }

  if (!body.content) {
    return NextResponse.json(
      { error: "Bad request", message: "content は必須です" },
      { status: 400 }
    );
  }

  const now = new Date().toISOString();
  const insertData = {
    vendor_id: vendor.id,
    reservation_id: body.reservation_id,
    user_id: body.user_id ?? null,
    content: body.content,
    nickname: body.nickname ?? null,
    reply: null as string | null,
    reply_by: null as string | null,
    reply_at: null as string | null,
    is_published: false,
    posted_at: now,
  };

  if (isSandboxMode()) {
    sandboxLog("POST /api/vendor/shop-reviews", `vendor=${vendor.id}`);
    return NextResponse.json(
      { data: { id: `rev_${Date.now()}`, ...insertData }, message: "レビューを作成しました" },
      { status: 201 }
    );
  }

  const { data, error } = await supabase
    .from("shop_reviews")
    .insert(insertData)
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { error: "Database error", message: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ data, message: "レビューを作成しました" }, { status: 201 });
}

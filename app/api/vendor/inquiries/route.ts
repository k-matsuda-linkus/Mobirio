import { NextRequest, NextResponse } from "next/server";
import { requireVendor } from "@/lib/auth/requireAuth";
import { isSandboxMode, sandboxLog } from "@/lib/sandbox";

const mockInquiries = [
  {
    id: "inq_001", vendor_id: "v-001", reservation_id: "res_001",
    user_id: "user-001", customer_name: "山田太郎",
    content: "返却時間を30分遅らせることは可能ですか？", reply: null,
    status: "pending", created_at: "2025-01-15T10:30:00Z", replied_at: null,
  },
  {
    id: "inq_002", vendor_id: "v-001", reservation_id: "res_002",
    user_id: "user-002", customer_name: "佐藤花子",
    content: "ヘルメットのサイズを教えてください。",
    reply: "S/M/Lサイズをご用意しております。",
    status: "replied", created_at: "2025-01-14T09:00:00Z", replied_at: "2025-01-14T12:00:00Z",
  },
];

export async function GET(request: NextRequest) {
  const authResult = await requireVendor(request);
  if (authResult instanceof NextResponse) return authResult;
  const { vendor, supabase } = authResult;

  const searchParams = request.nextUrl.searchParams;
  const status = searchParams.get("status");
  const limit = parseInt(searchParams.get("limit") || "50");
  const offset = parseInt(searchParams.get("offset") || "0");

  if (isSandboxMode()) {
    sandboxLog("GET /api/vendor/inquiries", `vendor=${vendor.id}`);
    let filtered = mockInquiries.filter((i) => i.vendor_id === vendor.id);
    if (status) filtered = filtered.filter((i) => i.status === status);
    return NextResponse.json({
      data: filtered.slice(offset, offset + limit),
      pagination: { total: filtered.length, limit, offset },
      message: "OK",
    });
  }

  let query = supabase
    .from("vendor_inquiries")
    .select("*, user:users(full_name)", { count: "exact" })
    .eq("vendor_id", vendor.id)
    .order("created_at", { ascending: false });

  if (status) query = query.eq("status", status);

  const { data, error, count } = await query.range(offset, offset + limit - 1);

  if (error) {
    return NextResponse.json(
      { error: "Database error", message: error.message },
      { status: 500 }
    );
  }

  // JOINしたuser名をcustomer_nameとしてフラット化
  const enriched = (data || []).map((row: any) => ({
    ...row,
    customer_name: row.user?.full_name || null,
  }));

  return NextResponse.json({
    data: enriched,
    pagination: { total: count ?? 0, limit, offset },
    message: "OK",
  });
}

export async function POST(request: NextRequest) {
  const authResult = await requireVendor(request);
  if (authResult instanceof NextResponse) return authResult;
  const { vendor, supabase } = authResult;

  let body: { reservation_id?: string; content?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON", message: "リクエストボディが不正です" },
      { status: 400 }
    );
  }

  if (!body.reservation_id || !body.content) {
    return NextResponse.json(
      { error: "Bad request", message: "reservation_id と content は必須です" },
      { status: 400 }
    );
  }

  const now = new Date().toISOString();
  const insertData = {
    vendor_id: vendor.id,
    reservation_id: body.reservation_id,
    content: body.content,
    reply: null,
    status: "pending",
    created_at: now,
    replied_at: null,
  };

  if (isSandboxMode()) {
    sandboxLog("POST /api/vendor/inquiries", `vendor=${vendor.id}`);
    return NextResponse.json(
      { data: { id: `inq_${Date.now()}`, ...insertData }, message: "問い合わせを作成しました" },
      { status: 201 }
    );
  }

  const { data, error } = await supabase
    .from("vendor_inquiries")
    .insert(insertData)
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { error: "Database error", message: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ data, message: "問い合わせを作成しました" }, { status: 201 });
}

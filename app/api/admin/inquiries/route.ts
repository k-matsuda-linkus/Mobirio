import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/requireAuth";
import { createAdminSupabaseClient } from "@/lib/supabase/server";
import { isSandboxMode, sandboxLog } from "@/lib/sandbox";
import { mockInquiries } from "@/lib/mock";

export async function GET(request: NextRequest) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  const searchParams = request.nextUrl.searchParams;
  const status = searchParams.get("status");
  const search = searchParams.get("search");
  const limit = parseInt(searchParams.get("limit") || "50");
  const offset = parseInt(searchParams.get("offset") || "0");

  if (isSandboxMode()) {
    let filtered = [...mockInquiries];

    if (status) {
      filtered = filtered.filter((i) => i.status === status);
    }
    if (search) {
      const s = search.toLowerCase();
      filtered = filtered.filter(
        (i) =>
          i.name.toLowerCase().includes(s) ||
          i.email.toLowerCase().includes(s) ||
          i.subject.toLowerCase().includes(s) ||
          i.content.toLowerCase().includes(s)
      );
    }

    const total = filtered.length;
    const paged = filtered.slice(offset, offset + limit);

    const summary = {
      total: mockInquiries.length,
      new: mockInquiries.filter((i) => i.status === "new").length,
      in_progress: mockInquiries.filter((i) => i.status === "in_progress").length,
      resolved: mockInquiries.filter((i) => i.status === "resolved").length,
      closed: mockInquiries.filter((i) => i.status === "closed").length,
    };

    return NextResponse.json({
      data: paged,
      summary,
      pagination: { total, limit, offset },
      message: "OK",
    });
  }

  // 本番: Supabase (contact_inquiries テーブル)
  try {
    const supabase = createAdminSupabaseClient();

    let query = supabase
      .from("contact_inquiries")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq("status", status as "new" | "in_progress" | "resolved" | "closed");
    }
    if (search) {
      query = query.or(
        `name.ilike.%${search}%,email.ilike.%${search}%,subject.ilike.%${search}%,content.ilike.%${search}%`
      );
    }

    const [inquiriesResult, summaryResult] = await Promise.all([
      query,
      supabase.from("contact_inquiries").select("status"),
    ]);

    if (inquiriesResult.error) {
      return NextResponse.json(
        { error: "Database error", message: inquiriesResult.error.message },
        { status: 500 }
      );
    }

    const allInquiries = summaryResult.data || [];
    const summary = {
      total: allInquiries.length,
      new: allInquiries.filter((i) => i.status === "new").length,
      in_progress: allInquiries.filter((i) => i.status === "in_progress").length,
      resolved: allInquiries.filter((i) => i.status === "resolved").length,
      closed: allInquiries.filter((i) => i.status === "closed").length,
    };

    return NextResponse.json({
      data: inquiriesResult.data || [],
      summary,
      pagination: { total: inquiriesResult.count || 0, limit, offset },
      message: "OK",
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Server error", message: String(error) },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON", message: "リクエストボディが不正です" },
      { status: 400 }
    );
  }

  const { inquiryId, status, reply } = body;

  if (!inquiryId || !status) {
    return NextResponse.json(
      { error: "Bad request", message: "inquiryId と status は必須です" },
      { status: 400 }
    );
  }

  const validStatuses = ["new", "in_progress", "resolved", "closed"];
  if (!validStatuses.includes(status)) {
    return NextResponse.json(
      { error: "Bad request", message: `不正なステータスです (${validStatuses.join(" / ")})` },
      { status: 400 }
    );
  }

  if (isSandboxMode()) {
    const inquiry = mockInquiries.find((i) => i.id === inquiryId);
    if (!inquiry) {
      return NextResponse.json(
        { error: "Not found", message: "お問い合わせが見つかりません" },
        { status: 404 }
      );
    }

    sandboxLog("inquiry_update", `${inquiryId} を ${status} に更新${reply ? " (返信あり)" : ""}`);

    return NextResponse.json({
      success: true,
      message: `お問い合わせ ${inquiryId} のステータスを ${status} に更新しました`,
      data: {
        inquiryId,
        status,
        reply: reply || inquiry.reply,
        replied_at: reply ? new Date().toISOString() : inquiry.replied_at,
      },
    });
  }

  // 本番: Supabase
  try {
    const supabase = createAdminSupabaseClient();

    const updateData: Record<string, unknown> = { status };
    if (reply) {
      updateData.reply = reply;
      updateData.replied_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from("contact_inquiries")
      .update(updateData)
      .eq("id", inquiryId)
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
        { error: "Not found", message: "お問い合わせが見つかりません" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `お問い合わせのステータスを ${status} に更新しました`,
      data,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Server error", message: String(error) },
      { status: 500 }
    );
  }
}

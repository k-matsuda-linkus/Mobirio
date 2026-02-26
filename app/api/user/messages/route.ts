import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/requireAuth";
import { isSandboxMode, sandboxLog } from "@/lib/sandbox";
import { mockMessages } from "@/lib/mock/messages";
import type { Message } from "@/types/database";

export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  const { user, supabase } = authResult;
  const searchParams = request.nextUrl.searchParams;
  const conversationWith = searchParams.get("conversation_with");

  // Sandbox モード
  if (isSandboxMode()) {
    sandboxLog("GET /api/user/messages", `user=${user.id}, conversation_with=${conversationWith}`);

    let filtered = mockMessages.filter(
      (m) => m.sender_id === user.id || m.receiver_id === user.id
    );

    if (conversationWith) {
      filtered = filtered.filter(
        (m) =>
          (m.sender_id === user.id && m.receiver_id === conversationWith) ||
          (m.sender_id === conversationWith && m.receiver_id === user.id)
      );
    }

    // 会話一覧の場合は最新メッセージのみ返す
    if (!conversationWith) {
      const conversationMap = new Map<string, typeof filtered[0]>();
      for (const msg of filtered) {
        const partnerId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id;
        const existing = conversationMap.get(partnerId);
        if (!existing || new Date(msg.created_at) > new Date(existing.created_at)) {
          conversationMap.set(partnerId, msg);
        }
      }
      return NextResponse.json({
        data: Array.from(conversationMap.values()),
      });
    }

    return NextResponse.json({ data: filtered });
  }

  // 本番モード: Supabase
  if (conversationWith) {
    // 個別会話
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .or(
        `and(sender_id.eq.${user.id},receiver_id.eq.${conversationWith}),and(sender_id.eq.${conversationWith},receiver_id.eq.${user.id})`
      )
      .order("created_at", { ascending: true });

    if (error) {
      return NextResponse.json(
        { error: "Database error", message: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: data || [] });
  }

  // 会話一覧: 自分が関わるメッセージから相手ごとの最新メッセージを取得
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json(
      { error: "Database error", message: error.message },
      { status: 500 }
    );
  }

  // グループ化: 相手ごとの最新メッセージ
  const messages = (data || []) as Message[];
  const conversationMap = new Map<string, Message>();
  for (const msg of messages) {
    const partnerId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id;
    if (!conversationMap.has(partnerId)) {
      conversationMap.set(partnerId, msg);
    }
  }

  return NextResponse.json({
    data: Array.from(conversationMap.values()),
  });
}

export async function POST(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  const { user, supabase } = authResult;

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON", message: "リクエストボディが不正です" },
      { status: 400 }
    );
  }

  const { receiver_id, body: messageBody, reservation_id } = body;

  if (!receiver_id || !messageBody) {
    return NextResponse.json(
      { error: "Validation error", message: "receiver_id と body は必須です" },
      { status: 400 }
    );
  }

  if (typeof messageBody !== "string" || messageBody.trim().length === 0) {
    return NextResponse.json(
      { error: "Validation error", message: "メッセージ本文は空にできません" },
      { status: 400 }
    );
  }

  // Sandbox モード
  if (isSandboxMode()) {
    sandboxLog("POST /api/user/messages", `from=${user.id}, to=${receiver_id}`);
    return NextResponse.json(
      {
        success: true,
        message: "メッセージを送信しました",
        data: {
          id: `msg-sandbox-${Date.now()}`,
          sender_id: user.id,
          receiver_id,
          reservation_id: reservation_id || null,
          body: messageBody.trim(),
          is_read: false,
          created_at: new Date().toISOString(),
        },
      },
      { status: 201 }
    );
  }

  const { data, error } = await supabase
    .from("messages")
    .insert({
      sender_id: user.id,
      receiver_id,
      reservation_id: reservation_id || null,
      body: messageBody.trim(),
      is_read: false,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { error: "Database error", message: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json(
    { success: true, message: "メッセージを送信しました", data },
    { status: 201 }
  );
}

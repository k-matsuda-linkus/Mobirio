import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/requireAuth";
import { createSignedUrl } from "@/lib/supabase/storage";
import { isSandboxMode, sandboxLog } from "@/lib/sandbox";

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) return auth;

  let body: { bucket?: string; path?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Bad Request", message: "JSON 形式で送信してください" },
      { status: 400 }
    );
  }

  const { bucket, path } = body;

  if (!bucket || !path) {
    return NextResponse.json(
      { error: "Bad Request", message: "bucket, path は必須です" },
      { status: 400 }
    );
  }

  if (bucket !== "contracts") {
    return NextResponse.json(
      {
        error: "Bad Request",
        message: "署名付きURLは contracts バケットのみ対応しています",
      },
      { status: 400 }
    );
  }

  if (isSandboxMode()) {
    sandboxLog("signedUrl", `bucket=${bucket}, path=${path}`);
    return NextResponse.json({
      success: true,
      url: `https://placeholder.supabase.co/storage/v1/object/sign/${bucket}/${path}?token=sandbox`,
    });
  }

  const url = await createSignedUrl(bucket, path, 3600);
  if (!url) {
    return NextResponse.json(
      { error: "Internal Server Error", message: "署名付きURLの生成に失敗しました" },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, url });
}

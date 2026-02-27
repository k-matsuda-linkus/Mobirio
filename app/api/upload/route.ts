import { NextRequest, NextResponse } from "next/server";
import { requireAuth, requireVendor } from "@/lib/auth/requireAuth";
import { uploadFile, deleteFile, createSignedUrl } from "@/lib/supabase/storage";
import { isSandboxMode, sandboxLog } from "@/lib/sandbox";

/** 非公開バケット一覧 — 署名付きURLで返却 */
const PRIVATE_BUCKETS = ["contracts"];

const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const VENDOR_BUCKETS = [
  "bike-images",
  "vendor-logos",
  "vendor-covers",
  "contracts",
];

export async function POST(request: NextRequest) {
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { error: "Bad Request", message: "multipart/form-data 形式で送信してください" },
      { status: 400 }
    );
  }

  const file = formData.get("file") as File | null;
  const bucket = formData.get("bucket") as string | null;
  const path = formData.get("path") as string | null;

  if (!file || !bucket || !path) {
    return NextResponse.json(
      { error: "Bad Request", message: "file, bucket, path は必須です" },
      { status: 400 }
    );
  }

  // MIME タイプ検証
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return NextResponse.json(
      {
        error: "Bad Request",
        message: "許可されていないファイル形式です（JPEG, PNG, WebP, GIF, PDF のみ）",
      },
      { status: 400 }
    );
  }

  // ファイルサイズ検証
  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: "Bad Request", message: "ファイルサイズが10MBを超えています" },
      { status: 413 }
    );
  }

  // 認証チェック
  if (VENDOR_BUCKETS.includes(bucket)) {
    const vendorAuth = await requireVendor(request);
    if (vendorAuth instanceof NextResponse) return vendorAuth;
  } else if (bucket === "user-avatars") {
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) return auth;
  } else {
    return NextResponse.json(
      { error: "Bad Request", message: "不正なバケット名です" },
      { status: 400 }
    );
  }

  // Sandbox モード
  if (isSandboxMode()) {
    sandboxLog("upload", `bucket=${bucket}, path=${path}, size=${file.size}`);
    const placeholderUrl = `https://placeholder.supabase.co/storage/v1/object/public/${bucket}/${path}`;
    return NextResponse.json({ success: true, url: placeholderUrl });
  }

  // アップロード実行
  const buffer = Buffer.from(await file.arrayBuffer());
  const publicUrl = await uploadFile(bucket, path, buffer, file.type);

  if (!publicUrl) {
    return NextResponse.json(
      { error: "Internal Server Error", message: "ファイルのアップロードに失敗しました" },
      { status: 500 }
    );
  }

  // 非公開バケットの場合は署名付きURLを返す
  if (PRIVATE_BUCKETS.includes(bucket)) {
    const signedUrl = await createSignedUrl(bucket, path, 3600);
    return NextResponse.json({
      success: true,
      url: signedUrl || publicUrl,
      storagePath: path,
    });
  }

  return NextResponse.json({ success: true, url: publicUrl });
}

export async function DELETE(request: NextRequest) {
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

  // 認証チェック
  if (VENDOR_BUCKETS.includes(bucket)) {
    const vendorAuth = await requireVendor(request);
    if (vendorAuth instanceof NextResponse) return vendorAuth;
  } else if (bucket === "user-avatars") {
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) return auth;
  } else {
    return NextResponse.json(
      { error: "Bad Request", message: "不正なバケット名です" },
      { status: 400 }
    );
  }

  if (isSandboxMode()) {
    sandboxLog("delete", `bucket=${bucket}, path=${path}`);
    return NextResponse.json({ success: true });
  }

  const success = await deleteFile(bucket, path);
  if (!success) {
    return NextResponse.json(
      { error: "Internal Server Error", message: "ファイルの削除に失敗しました" },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}

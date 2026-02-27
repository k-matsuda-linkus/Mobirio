import { createAdminSupabaseClient } from "./server";

/**
 * Supabase Storage にファイルをアップロードし、公開URLを返す
 * サーバーサイド専用（service_role で RLS バイパス）
 */
export async function uploadFile(
  bucket: string,
  path: string,
  file: File | Buffer,
  contentType?: string
): Promise<string | null> {
  const supabase = createAdminSupabaseClient();

  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    contentType,
    upsert: true,
  });

  if (error) {
    console.error("Storage upload error:", error.message);
    return null;
  }

  return getPublicUrl(bucket, path);
}

/** 単一ファイル削除 */
export async function deleteFile(
  bucket: string,
  path: string
): Promise<boolean> {
  const supabase = createAdminSupabaseClient();

  const { error } = await supabase.storage.from(bucket).remove([path]);

  if (error) {
    console.error("Storage delete error:", error.message);
    return false;
  }

  return true;
}

/** 複数ファイル一括削除 */
export async function deleteFiles(
  bucket: string,
  paths: string[]
): Promise<boolean> {
  if (paths.length === 0) return true;

  const supabase = createAdminSupabaseClient();

  const { error } = await supabase.storage.from(bucket).remove(paths);

  if (error) {
    console.error("Storage delete files error:", error.message);
    return false;
  }

  return true;
}

/** 公開バケットの URL を生成（ネットワーク不要） */
export function getPublicUrl(bucket: string, path: string): string {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) {
    return `https://placeholder.supabase.co/storage/v1/object/public/${bucket}/${path}`;
  }
  return `${supabaseUrl}/storage/v1/object/public/${bucket}/${path}`;
}

/** 非公開バケット用の署名付き URL を生成 */
export async function createSignedUrl(
  bucket: string,
  path: string,
  expiresIn = 3600
): Promise<string | null> {
  const supabase = createAdminSupabaseClient();

  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, expiresIn);

  if (error) {
    console.error("Storage signed URL error:", error.message);
    return null;
  }

  return data.signedUrl;
}

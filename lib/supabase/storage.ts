// TODO: Implement file upload/download helpers
export async function uploadFile(bucket: string, path: string, file: File): Promise<string | null> {
  return null;
}

export async function deleteFile(bucket: string, path: string): Promise<boolean> {
  return false;
}

export function getPublicUrl(bucket: string, path: string): string {
  return `https://placeholder.supabase.co/storage/v1/object/public/${bucket}/${path}`;
}

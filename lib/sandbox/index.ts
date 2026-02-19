// Mobirio Sandbox Mode — 外部サービス不要のローカル動作モード
// SANDBOX_MODE=true の場合、Supabase/Square/Resend の代わりにモックデータを使用

export function isSandboxMode(): boolean {
  return process.env.NEXT_PUBLIC_SANDBOX_MODE === 'true' || !process.env.NEXT_PUBLIC_SUPABASE_URL;
}

export function sandboxLog(action: string, detail?: string): void {
  if (isSandboxMode()) {
    console.log(`[SANDBOX] ${action}${detail ? `: ${detail}` : ''}`);
  }
}

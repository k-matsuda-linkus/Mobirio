// Sandbox Email — Resend の代わりにコンソールログ出力
import { sandboxLog } from './index';

interface EmailPayload {
  to: string;
  subject: string;
  html?: string;
  text?: string;
}

export async function sendSandboxEmail(payload: EmailPayload): Promise<{ id: string }> {
  sandboxLog('EMAIL送信', `To: ${payload.to} | Subject: ${payload.subject}`);
  return { id: `sandbox-email-${Date.now()}` };
}

import { Resend } from "resend";
import type { EmailTemplate } from "./template";

// Lazy initialization to avoid errors during build when env vars are not set
let resend: Resend | null = null;

function getResend(): Resend {
  if (!resend) {
    if (!process.env.RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY environment variable is not set");
    }
    resend = new Resend(process.env.RESEND_API_KEY);
  }
  return resend;
}

export interface SendEmailOptions {
  to: string | string[];
  template: EmailTemplate;
  replyTo?: string;
}

export interface SendEmailResult {
  success: boolean;
  id?: string;
  error?: string;
}

export async function sendEmail(options: SendEmailOptions): Promise<SendEmailResult> {
  const { to, template, replyTo } = options;

  const from = process.env.EMAIL_FROM || "Mobirio <noreply@mobirio.jp>";

  try {
    const { data, error } = await getResend().emails.send({
      from,
      to: Array.isArray(to) ? to : [to],
      subject: template.subject,
      html: template.html,
      text: template.text,
      replyTo,
    });

    if (error) {
      console.error("Email send error:", error);
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
      id: data?.id,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Email send exception:", error);
    return {
      success: false,
      error: errorMessage,
    };
  }
}

export async function sendBulkEmail(
  recipients: { to: string; template: EmailTemplate }[]
): Promise<{ sent: number; failed: number; errors: string[] }> {
  const results = await Promise.allSettled(
    recipients.map((r) => sendEmail({ to: r.to, template: r.template }))
  );

  let sent = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const result of results) {
    if (result.status === "fulfilled" && result.value.success) {
      sent++;
    } else {
      failed++;
      if (result.status === "rejected") {
        errors.push(result.reason?.message || "Unknown error");
      } else if (result.value.error) {
        errors.push(result.value.error);
      }
    }
  }

  return { sent, failed, errors };
}

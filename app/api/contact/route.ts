import { NextRequest, NextResponse } from "next/server";
import { isSandboxMode, sandboxLog } from "@/lib/sandbox";

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function POST(request: NextRequest) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON", message: "リクエストボディが不正です" },
      { status: 400 }
    );
  }

  const { name, email, subject, message } = body;

  // バリデーション
  const errors: string[] = [];
  if (!name || typeof name !== "string" || name.trim().length === 0) {
    errors.push("お名前は必須です");
  }
  if (!email || typeof email !== "string" || !email.includes("@")) {
    errors.push("有効なメールアドレスを入力してください");
  }
  if (!subject || typeof subject !== "string" || subject.trim().length === 0) {
    errors.push("件名は必須です");
  }
  if (!message || typeof message !== "string" || message.trim().length === 0) {
    errors.push("お問い合わせ内容は必須です");
  }

  if (errors.length > 0) {
    return NextResponse.json(
      { error: "Validation error", errors },
      { status: 400 }
    );
  }

  // Sandbox モード
  if (isSandboxMode()) {
    sandboxLog("POST /api/contact", `name=${name}, email=${email}, subject=${subject}`);
    return NextResponse.json(
      { success: true, message: "お問い合わせを受け付けました" },
      { status: 201 }
    );
  }

  // 本番モード: 管理者へメール通知（vendor_inquiries はベンダー紐付き専用テーブルのため不使用）
  try {
    const { sendEmail } = await import("@/lib/email/send");
    const { baseTemplate } = await import("@/lib/email/template");

    const adminEmail = process.env.ADMIN_EMAIL || "admin@mobirio.jp";
    const htmlContent = baseTemplate(
      `<h2>新しいお問い合わせ</h2>
       <p><strong>お名前:</strong> ${escapeHtml(name)}</p>
       <p><strong>メール:</strong> ${escapeHtml(email)}</p>
       <p><strong>件名:</strong> ${escapeHtml(subject)}</p>
       <p><strong>内容:</strong></p>
       <p>${escapeHtml(message).replace(/\n/g, "<br>")}</p>`,
      "新しいお問い合わせ"
    );

    const result = await sendEmail({
      to: adminEmail,
      template: {
        subject: `[Mobirio] お問い合わせ: ${subject}`,
        html: htmlContent,
        text: `お名前: ${name}\nメール: ${email}\n件名: ${subject}\n内容:\n${message}`,
      },
      replyTo: email,
    });

    if (!result.success) {
      console.error("Contact notification email failed:", result.error);
      return NextResponse.json(
        { error: "Email error", message: "送信に失敗しました。しばらくしてからお試しください" },
        { status: 500 }
      );
    }
  } catch (emailError) {
    console.error("Contact notification email error:", emailError);
    return NextResponse.json(
      { error: "Email error", message: "送信に失敗しました。しばらくしてからお試しください" },
      { status: 500 }
    );
  }

  return NextResponse.json(
    { success: true, message: "お問い合わせを受け付けました" },
    { status: 201 }
  );
}

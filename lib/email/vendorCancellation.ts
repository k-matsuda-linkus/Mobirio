import { baseTemplate, type EmailTemplate } from "./template";

interface VendorCancellationParams {
  vendorName: string;
  customerName: string;
  bikeName: string;
  reservationId: string;
}

export function vendorCancellationEmail(params: VendorCancellationParams): EmailTemplate {
  const { vendorName, customerName, bikeName, reservationId } = params;

  const content = `
    <h1>キャンセル通知</h1>
    <p>${vendorName} 様</p>
    <p>以下の予約がキャンセルされました。</p>
    <table style="width:100%;border-collapse:collapse;">
      <tr><td style="padding:8px;border-bottom:1px solid #eee;font-weight:bold;">予約ID</td><td style="padding:8px;border-bottom:1px solid #eee;">${reservationId}</td></tr>
      <tr><td style="padding:8px;border-bottom:1px solid #eee;font-weight:bold;">お客様名</td><td style="padding:8px;border-bottom:1px solid #eee;">${customerName}</td></tr>
      <tr><td style="padding:8px;border-bottom:1px solid #eee;font-weight:bold;">車両</td><td style="padding:8px;border-bottom:1px solid #eee;">${bikeName}</td></tr>
    </table>
    <p style="margin-top:20px;">管理画面で詳細をご確認ください。</p>
  `;

  return {
    subject: `【Mobirio】キャンセル通知 - ${bikeName}`,
    html: baseTemplate(content, "キャンセル通知"),
    text: `${vendorName} 様\n\n予約がキャンセルされました。\n予約ID: ${reservationId}\nお客様: ${customerName}\n車両: ${bikeName}`,
  };
}

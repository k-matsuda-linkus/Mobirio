import { baseTemplate, type EmailTemplate } from "./template";

interface VendorNewBookingParams {
  vendorName: string;
  customerName: string;
  bikeName: string;
  startDate: string;
}

export function vendorNewBookingEmail(params: VendorNewBookingParams): EmailTemplate {
  const { vendorName, customerName, bikeName, startDate } = params;

  const content = `
    <h1>新規予約通知</h1>
    <p>${vendorName} 様</p>
    <p>新しい予約が入りました。</p>
    <table style="width:100%;border-collapse:collapse;">
      <tr><td style="padding:8px;border-bottom:1px solid #eee;font-weight:bold;">お客様名</td><td style="padding:8px;border-bottom:1px solid #eee;">${customerName}</td></tr>
      <tr><td style="padding:8px;border-bottom:1px solid #eee;font-weight:bold;">車両</td><td style="padding:8px;border-bottom:1px solid #eee;">${bikeName}</td></tr>
      <tr><td style="padding:8px;border-bottom:1px solid #eee;font-weight:bold;">開始日時</td><td style="padding:8px;border-bottom:1px solid #eee;">${startDate}</td></tr>
    </table>
    <p style="margin-top:20px;">管理画面で詳細をご確認ください。</p>
  `;

  return {
    subject: `【Mobirio】新規予約 - ${bikeName}`,
    html: baseTemplate(content, "新規予約通知"),
    text: `${vendorName} 様\n\n新しい予約が入りました。\nお客様: ${customerName}\n車両: ${bikeName}\n開始日時: ${startDate}`,
  };
}

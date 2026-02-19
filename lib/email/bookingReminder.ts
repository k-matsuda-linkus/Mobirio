import { baseTemplate, type EmailTemplate } from "./template";

interface BookingReminderParams {
  userName: string;
  bikeName: string;
  vendorName: string;
  startDate: string;
}

export function bookingReminderEmail(params: BookingReminderParams): EmailTemplate {
  const { userName, bikeName, vendorName, startDate } = params;

  const content = `
    <h1>予約リマインダー</h1>
    <p>${userName} 様</p>
    <p>ご予約の開始日時が近づいております。</p>
    <table style="width:100%;border-collapse:collapse;">
      <tr><td style="padding:8px;border-bottom:1px solid #eee;font-weight:bold;">車両</td><td style="padding:8px;border-bottom:1px solid #eee;">${bikeName}</td></tr>
      <tr><td style="padding:8px;border-bottom:1px solid #eee;font-weight:bold;">店舗</td><td style="padding:8px;border-bottom:1px solid #eee;">${vendorName}</td></tr>
      <tr><td style="padding:8px;border-bottom:1px solid #eee;font-weight:bold;">開始日時</td><td style="padding:8px;border-bottom:1px solid #eee;">${startDate}</td></tr>
    </table>
    <p style="margin-top:20px;">お忘れなくお越しください。</p>
  `;

  return {
    subject: `【Mobirio】予約リマインダー - ${bikeName}`,
    html: baseTemplate(content, "予約リマインダー"),
    text: `${userName} 様\n\nご予約の開始日時が近づいております。\n車両: ${bikeName}\n店舗: ${vendorName}\n開始日時: ${startDate}`,
  };
}

import { baseTemplate, type EmailTemplate } from "./template";

interface BookingConfirmationParams {
  userName: string;
  bikeName: string;
  vendorName: string;
  startDate: string;
  endDate: string;
  totalAmount: number;
}

export function bookingConfirmationEmail(params: BookingConfirmationParams): EmailTemplate {
  const { userName, bikeName, vendorName, startDate, endDate, totalAmount } = params;

  const content = `
    <h1>予約確定のお知らせ</h1>
    <p>${userName} 様</p>
    <p>以下の内容で予約が確定しました。</p>
    <table style="width:100%;border-collapse:collapse;">
      <tr><td style="padding:8px;border-bottom:1px solid #eee;font-weight:bold;">車両</td><td style="padding:8px;border-bottom:1px solid #eee;">${bikeName}</td></tr>
      <tr><td style="padding:8px;border-bottom:1px solid #eee;font-weight:bold;">店舗</td><td style="padding:8px;border-bottom:1px solid #eee;">${vendorName}</td></tr>
      <tr><td style="padding:8px;border-bottom:1px solid #eee;font-weight:bold;">開始日時</td><td style="padding:8px;border-bottom:1px solid #eee;">${startDate}</td></tr>
      <tr><td style="padding:8px;border-bottom:1px solid #eee;font-weight:bold;">終了日時</td><td style="padding:8px;border-bottom:1px solid #eee;">${endDate}</td></tr>
      <tr><td style="padding:8px;border-bottom:1px solid #eee;font-weight:bold;">合計金額</td><td style="padding:8px;border-bottom:1px solid #eee;">¥${totalAmount.toLocaleString()}</td></tr>
    </table>
    <p style="margin-top:20px;">ご利用ありがとうございます。</p>
  `;

  return {
    subject: `【Mobirio】予約確定 - ${bikeName}`,
    html: baseTemplate(content, "予約確定のお知らせ"),
    text: `${userName} 様\n\n予約が確定しました。\n車両: ${bikeName}\n店舗: ${vendorName}\n期間: ${startDate} 〜 ${endDate}\n合計: ¥${totalAmount.toLocaleString()}`,
  };
}

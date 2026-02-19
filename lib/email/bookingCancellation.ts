import { baseTemplate, type EmailTemplate } from "./template";

interface BookingCancellationParams {
  userName: string;
  bikeName: string;
  reservationId: string;
}

export function bookingCancellationEmail(params: BookingCancellationParams): EmailTemplate {
  const { userName, bikeName, reservationId } = params;

  const content = `
    <h1>キャンセル完了のお知らせ</h1>
    <p>${userName} 様</p>
    <p>以下の予約がキャンセルされました。</p>
    <table style="width:100%;border-collapse:collapse;">
      <tr><td style="padding:8px;border-bottom:1px solid #eee;font-weight:bold;">予約ID</td><td style="padding:8px;border-bottom:1px solid #eee;">${reservationId}</td></tr>
      <tr><td style="padding:8px;border-bottom:1px solid #eee;font-weight:bold;">車両</td><td style="padding:8px;border-bottom:1px solid #eee;">${bikeName}</td></tr>
    </table>
    <p style="margin-top:20px;">またのご利用をお待ちしております。</p>
  `;

  return {
    subject: `【Mobirio】キャンセル完了 - ${bikeName}`,
    html: baseTemplate(content, "キャンセル完了のお知らせ"),
    text: `${userName} 様\n\n予約がキャンセルされました。\n予約ID: ${reservationId}\n車両: ${bikeName}`,
  };
}

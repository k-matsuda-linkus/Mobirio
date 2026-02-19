import { baseTemplate, type EmailTemplate } from "./template";

interface PaymentReceiptParams {
  userName: string;
  amount: number;
  paymentDate: string;
  reservationId: string;
}

export function paymentReceiptEmail(params: PaymentReceiptParams): EmailTemplate {
  const { userName, amount, paymentDate, reservationId } = params;

  const content = `
    <h1>領収書</h1>
    <p>${userName} 様</p>
    <p>お支払いが完了しました。</p>
    <table style="width:100%;border-collapse:collapse;">
      <tr><td style="padding:8px;border-bottom:1px solid #eee;font-weight:bold;">予約ID</td><td style="padding:8px;border-bottom:1px solid #eee;">${reservationId}</td></tr>
      <tr><td style="padding:8px;border-bottom:1px solid #eee;font-weight:bold;">お支払い金額</td><td style="padding:8px;border-bottom:1px solid #eee;">¥${amount.toLocaleString()}</td></tr>
      <tr><td style="padding:8px;border-bottom:1px solid #eee;font-weight:bold;">お支払い日</td><td style="padding:8px;border-bottom:1px solid #eee;">${paymentDate}</td></tr>
    </table>
    <p style="margin-top:20px;">ご利用ありがとうございます。</p>
  `;

  return {
    subject: `【Mobirio】領収書 - 予約ID: ${reservationId}`,
    html: baseTemplate(content, "領収書"),
    text: `${userName} 様\n\nお支払いが完了しました。\n予約ID: ${reservationId}\n金額: ¥${amount.toLocaleString()}\n日付: ${paymentDate}`,
  };
}

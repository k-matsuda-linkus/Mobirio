import { baseTemplate, type EmailTemplate } from "./template";

interface VendorInvitationParams {
  inviteUrl: string;
  planLabel: string;
  regType: "new" | "existing";
}

export function vendorInvitationEmail(params: VendorInvitationParams): EmailTemplate {
  const { inviteUrl, planLabel, regType } = params;

  const typeLabel = regType === "new" ? "新規事業者登録" : "既存事業者への店舗追加";

  const content = `
    <h1 style="font-size:20px;color:#333;">Mobirio ベンダー登録のご案内</h1>
    <p>Mobirio をご利用いただきありがとうございます。</p>
    <p>管理者より、ベンダー登録の招待が届いています。</p>
    <table style="width:100%;border-collapse:collapse;margin:20px 0;">
      <tr>
        <td style="padding:8px;border-bottom:1px solid #eee;font-weight:bold;">登録種別</td>
        <td style="padding:8px;border-bottom:1px solid #eee;">${typeLabel}</td>
      </tr>
      <tr>
        <td style="padding:8px;border-bottom:1px solid #eee;font-weight:bold;">契約プラン</td>
        <td style="padding:8px;border-bottom:1px solid #eee;">${planLabel}</td>
      </tr>
    </table>
    <p>下記のボタンをクリックして、事業者・店舗情報の登録を行ってください。</p>
    <div style="text-align:center;margin:30px 0;">
      <a href="${inviteUrl}" style="display:inline-block;background:#333;color:#fff;padding:14px 32px;text-decoration:none;font-size:14px;">登録を開始する</a>
    </div>
    <p style="font-size:12px;color:#999;">このリンクの有効期限は24時間です。期限が切れた場合は管理者にお問い合わせください。</p>
  `;

  return {
    subject: `【Mobirio】ベンダー登録のご案内（${typeLabel}）`,
    html: baseTemplate(content, "ベンダー登録のご案内"),
    text:
      `Mobirio ベンダー登録のご案内\n\n` +
      `登録種別: ${typeLabel}\n` +
      `契約プラン: ${planLabel}\n\n` +
      `以下のURLから登録を行ってください:\n${inviteUrl}\n\n` +
      `このリンクの有効期限は24時間です。`,
  };
}

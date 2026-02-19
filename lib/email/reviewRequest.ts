import { baseTemplate, type EmailTemplate } from "./template";

interface ReviewRequestParams {
  userName: string;
  bikeName: string;
  reservationId: string;
}

export function reviewRequestEmail(params: ReviewRequestParams): EmailTemplate {
  const { userName, bikeName, reservationId } = params;

  const content = `
    <h1>レビューのお願い</h1>
    <p>${userName} 様</p>
    <p>先日のご利用ありがとうございました。</p>
    <p>${bikeName} のご利用はいかがでしたか？</p>
    <p>ぜひレビューをお聞かせください。</p>
    <p style="margin-top:20px;">
      <a href="https://mobirio.jp/reviews/new?reservation=${reservationId}"
         style="background:#f97316;color:white;padding:12px 24px;text-decoration:none;border-radius:6px;display:inline-block;">
        レビューを書く
      </a>
    </p>
  `;

  return {
    subject: `【Mobirio】レビューのお願い - ${bikeName}`,
    html: baseTemplate(content, "レビューのお願い"),
    text: `${userName} 様\n\n先日のご利用ありがとうございました。\n${bikeName} のレビューをお聞かせください。\nhttps://mobirio.jp/reviews/new?reservation=${reservationId}`,
  };
}

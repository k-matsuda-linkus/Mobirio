import { Metadata } from "next";

export const metadata: Metadata = {
  title: "キャンセルポリシー | Mobirio",
  description: "Mobírioのキャンセルポリシー",
};

const CANCEL_FEES = [
  { period: "7日前まで", fee: "無料", percent: "0%", bg: "bg-accent/10 text-accent" },
  { period: "3日前まで", fee: "レンタル料金の30%", percent: "30%", bg: "bg-yellow-50 text-yellow-700" },
  { period: "前日", fee: "レンタル料金の50%", percent: "50%", bg: "bg-orange-50 text-orange-700" },
  { period: "当日・無断キャンセル", fee: "レンタル料金の100%", percent: "100%", bg: "bg-red-50 text-red-700" },
];

export default function CancellationPolicyPage() {
  return (
    <article>
      <h1 className="font-serif text-3xl font-light text-black mb-[16px]">
        キャンセルポリシー
      </h1>
      <p className="text-sm font-sans text-gray-500 mb-[40px]">最終更新日：2025年1月1日</p>

      <section className="mb-[40px]">
        <p className="text-sm font-sans text-gray-700 leading-relaxed mb-[24px]">
          Mobírioでのバイクレンタル予約のキャンセルには、以下のキャンセル料が適用されます。キャンセル料は予約開始日時を基準に算出されます。
        </p>

        {/* Fee Table */}
        <div className="border border-gray-100 overflow-hidden">
          {/* Header */}
          <div className="grid grid-cols-3 bg-gray-50 border-b border-gray-100">
            <div className="px-[20px] py-[14px] text-sm font-sans font-medium text-black">キャンセル時期</div>
            <div className="px-[20px] py-[14px] text-sm font-sans font-medium text-black">キャンセル料率</div>
            <div className="px-[20px] py-[14px] text-sm font-sans font-medium text-black">キャンセル料</div>
          </div>
          {/* Rows */}
          {CANCEL_FEES.map((item, i) => (
            <div
              key={item.period}
              className={`grid grid-cols-3 ${
                i < CANCEL_FEES.length - 1 ? "border-b border-gray-100" : ""
              }`}
            >
              <div className="px-[20px] py-[16px] text-sm font-sans text-gray-700">{item.period}</div>
              <div className="px-[20px] py-[16px]">
                <span className={`inline-block px-[10px] py-[3px] text-xs font-sans font-medium ${item.bg}`}>
                  {item.percent}
                </span>
              </div>
              <div className="px-[20px] py-[16px] text-sm font-sans text-gray-700">{item.fee}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-[40px]">
        <h2 className="font-serif text-lg font-light text-black mb-[16px]">キャンセル方法</h2>
        <div className="text-sm font-sans text-gray-700 leading-relaxed space-y-[12px]">
          <p>キャンセルはマイページの予約一覧から行うことができます。キャンセルが完了すると確認メールが送信されます。</p>
          <ol className="list-decimal list-inside space-y-[8px] pl-[8px]">
            <li>マイページにログイン</li>
            <li>「予約一覧」から該当の予約を選択</li>
            <li>「キャンセル」ボタンをクリック</li>
            <li>キャンセル理由を入力して確定</li>
          </ol>
        </div>
      </section>

      <section className="mb-[40px]">
        <h2 className="font-serif text-lg font-light text-black mb-[16px]">返金について</h2>
        <div className="text-sm font-sans text-gray-700 leading-relaxed space-y-[12px]">
          <p>キャンセルに伴う返金は、キャンセル料を差し引いた金額をご利用のクレジットカードに返金いたします。返金処理には通常5〜10営業日を要します。</p>
        </div>
      </section>

      <section className="mb-[40px]">
        <h2 className="font-serif text-lg font-light text-black mb-[16px]">例外事項</h2>
        <div className="text-sm font-sans text-gray-700 leading-relaxed space-y-[12px]">
          <p>以下の場合はキャンセル料が免除される場合があります。</p>
          <ul className="list-disc list-inside space-y-[6px] pl-[8px]">
            <li>天災、自然災害等によりレンタルが不可能な場合</li>
            <li>ベンダー側の都合によるキャンセルの場合</li>
            <li>予約車両の整備不良が判明した場合</li>
          </ul>
          <p>上記に該当する場合は、カスタマーサポートまでお問い合わせください。</p>
        </div>
      </section>

      <div className="p-[20px] bg-gray-50 border border-gray-100 mb-[40px]">
        <p className="text-sm font-sans text-gray-700">
          <span className="font-medium text-black">お問い合わせ</span><br />
          キャンセルに関するご不明点は、support@mobirio.jp または 03-0000-0000 までご連絡ください。
        </p>
      </div>

      <div className="border-t border-gray-100 pt-[24px]">
        <p className="text-xs font-sans text-gray-400">
          制定日：2025年1月1日 ／ 株式会社リンクス
        </p>
      </div>
    </article>
  );
}

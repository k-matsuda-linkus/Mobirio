import { Metadata } from "next";

export const metadata: Metadata = {
  title: "特定商取引法に基づく表記 | Mobirio",
  description: "特定商取引法に基づく表記",
};

const LEGAL_INFO = [
  { label: "事業者名", value: "株式会社リンクス" },
  { label: "代表者", value: "代表取締役 山田 太郎" },
  { label: "所在地", value: "〒880-0001 宮崎県宮崎市橘通西3丁目1番1号" },
  { label: "電話番号", value: "03-0000-0000（平日 10:00〜18:00）" },
  { label: "メールアドレス", value: "info@mobirio.jp" },
  { label: "サービスURL", value: "https://mobirio.jp" },
  { label: "サービス内容", value: "バイクレンタルのプラットフォーム運営。利用者とレンタル事業者（ベンダー）をマッチングし、予約・決済の仲介を行います。" },
  { label: "サービス料金", value: "バイクのレンタル料金はベンダーが個別に設定します。基本レンタル料に加え、車両補償料（CDW）およびNOC補償料が発生する場合があります。料金は各バイクの詳細ページに表示されます。" },
  { label: "支払方法", value: "クレジットカード（VISA、Mastercard、JCB、American Express）" },
  { label: "支払時期", value: "予約確定時に決済が行われます。" },
  { label: "サービス提供時期", value: "予約確定後、予約日時にバイクの受け渡しが行われます。" },
  { label: "キャンセル・返金", value: "キャンセルポリシーに基づき、キャンセル料が発生する場合があります。詳細はキャンセルポリシーページをご確認ください。" },
  { label: "動作環境", value: "Google Chrome、Safari、Firefox、Microsoft Edgeの最新バージョン。スマートフォンはiOS 15以上、Android 10以上を推奨。" },
];

export default function LegalNoticePage() {
  return (
    <article>
      <h1 className="font-serif text-3xl font-light text-black mb-[40px]">
        特定商取引法に基づく表記
      </h1>

      <div className="border border-gray-100">
        {LEGAL_INFO.map((item, i) => (
          <div
            key={item.label}
            className={`flex flex-col md:flex-row ${
              i < LEGAL_INFO.length - 1 ? "border-b border-gray-100" : ""
            }`}
          >
            <div className="w-full md:w-[200px] shrink-0 bg-gray-50 px-[20px] py-[16px]">
              <span className="text-sm font-sans font-medium text-black">
                {item.label}
              </span>
            </div>
            <div className="px-[20px] py-[16px]">
              <span className="text-sm font-sans text-gray-700 leading-relaxed">
                {item.value}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-gray-100 pt-[24px] mt-[40px]">
        <p className="text-xs font-sans text-gray-400">
          制定日：2025年1月1日 ／ 株式会社リンクス
        </p>
      </div>
    </article>
  );
}

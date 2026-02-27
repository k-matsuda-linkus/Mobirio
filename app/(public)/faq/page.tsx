import type { Metadata } from 'next';

export const revalidate = 86400;

export const metadata: Metadata = {
  title: 'よくある質問',
  description: 'Mobirioのレンタルバイクに関するよくある質問。予約・キャンセル・保険・支払い方法などをご案内します。',
  openGraph: {
    title: 'よくある質問 | Mobirio',
    description: 'Mobirioのレンタルバイクに関するよくある質問。',
    url: 'https://mobirio.jp/faq',
  },
};

const faqs = [
  { q: "予約のキャンセルはできますか？", a: "はい、利用開始の24時間前まで無料でキャンセルいただけます。それ以降はキャンセルポリシーに基づきキャンセル料が発生します。" },
  { q: "必要な書類は何ですか？", a: "運転免許証（バイクの排気量に対応したもの）が必要です。外国籍の方は国際運転免許証もご用意ください。" },
  { q: "保険は含まれていますか？", a: "基本料金には自賠責保険が含まれています。任意保険（CDW・NOC）はオプションでご加入いただけます。" },
  { q: "燃料はどうなりますか？", a: "満タン返しが基本です。EVバイクの場合は充電状態でのお返しをお願いしています。" },
  { q: "支払い方法は？", a: "クレジットカード（Visa, Mastercard, JCB, AMEX）でのお支払いとなります。" },
  { q: "ヘルメットは借りられますか？", a: "はい、オプションとしてヘルメットやグローブなどの装備品をご用意しています。" },
  { q: "配達サービスはありますか？", a: "一部のショップでは配達・回収サービスを行っています。各ショップの詳細ページをご確認ください。" },
  { q: "年齢制限はありますか？", a: "18歳以上で有効な運転免許証をお持ちの方がご利用いただけます。" },
];

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqs.map((faq) => ({
    '@type': 'Question',
    name: faq.q,
    acceptedAnswer: { '@type': 'Answer', text: faq.a },
  })),
};

export default function FaqPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
    <div className="py-[50px] md:py-[100px]">
      <div className="max-w-[800px] mx-auto px-[30px] md:px-[50px]">
        <h1 className="font-serif font-light text-3xl md:text-4xl mb-[30px]">よくある質問</h1>
        <div className="space-y-[1px]">
          {faqs.map((faq, i) => (
            <details key={i} className="group border border-gray-100 bg-white">
              <summary className="cursor-pointer px-[24px] py-[16px] text-sm font-medium flex items-center justify-between">
                {faq.q}
                <span className="text-gray-300 group-open:rotate-45 transition-transform text-lg">+</span>
              </summary>
              <div className="px-[24px] pb-[16px] text-sm text-gray-500 leading-relaxed">
                {faq.a}
              </div>
            </details>
          ))}
        </div>
      </div>
    </div>
    </>
  );
}

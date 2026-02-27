import type { Metadata } from 'next';

export const revalidate = 86400;

export const metadata: Metadata = {
  title: 'Mobirioについて',
  description: 'Mobirioは宮崎県を中心としたレンタルバイクのマルチベンダープラットフォームです。EVスクーターから大型バイクまで幅広く取り揃え。',
  openGraph: {
    title: 'Mobirioについて | Mobirio',
    description: 'Mobirioは宮崎県を中心としたレンタルバイクのマルチベンダープラットフォームです。',
    url: 'https://mobirio.jp/about',
  },
};

export default function AboutPage() {
  return (
    <div className="py-[50px] md:py-[100px]">
      <div className="max-w-[800px] mx-auto px-[30px] md:px-[50px]">
        <h1 className="font-serif font-light text-3xl md:text-4xl mb-[30px]">Mobirioについて</h1>
        <div className="space-y-[24px] text-sm text-gray-600 leading-relaxed">
          <p>
            Mobirioは、宮崎県を中心としたレンタルバイクのマルチベンダープラットフォームです。
            複数のバイクレンタルショップが出店し、利用者は一つのサイトから簡単にバイクを検索・予約できます。
          </p>
          <p>
            EVスクーターから大型バイクまで、幅広い車種を取り揃えています。
            観光にもビジネスにも、あなたの目的に合った一台をお選びいただけます。
          </p>
          <h2 className="font-serif text-xl pt-[16px]">サービスの特徴</h2>
          <ul className="list-disc pl-[20px] space-y-[8px]">
            <li>オンラインで24時間予約可能</li>
            <li>QRコードでスムーズな受け渡し</li>
            <li>CDW・NOC補償オプション完備</li>
            <li>複数ショップの比較が簡単</li>
            <li>宮崎の観光情報と連携</li>
          </ul>
          <h2 className="font-serif text-xl pt-[16px]">運営会社</h2>
          <table className="w-full text-sm">
            <tbody>
              <tr className="border-b border-gray-100"><td className="py-[10px] text-gray-400 w-[120px]">サービス名</td><td className="py-[10px]">Mobirio（モビリオ）</td></tr>
              <tr className="border-b border-gray-100"><td className="py-[10px] text-gray-400">所在地</td><td className="py-[10px]">宮崎県宮崎市</td></tr>
              <tr className="border-b border-gray-100"><td className="py-[10px] text-gray-400">お問い合わせ</td><td className="py-[10px]">info@mobirio.jp</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

import { Metadata } from "next";

export const metadata: Metadata = {
  title: "利用規約 | Mobirio",
  description: "Mobírioのサービス利用規約",
};

export default function TermsPage() {
  return (
    <article className="prose prose-sm max-w-none">
      <h1 className="font-serif text-3xl font-light text-black mb-[40px]">利用規約</h1>
      <p className="text-sm font-sans text-gray-500 mb-[40px]">最終更新日：2025年1月1日</p>

      <section className="mb-[40px]">
        <h2 className="font-serif text-lg font-light text-black mb-[16px]">第1条（定義）</h2>
        <div className="text-sm font-sans text-gray-700 leading-relaxed space-y-[12px]">
          <p>本規約において使用する用語の定義は以下のとおりとします。</p>
          <ol className="list-decimal list-inside space-y-[8px] pl-[8px]">
            <li>「本サービス」とは、株式会社リンクス（以下「当社」）が運営するバイクレンタルプラットフォーム「Mobirio」を通じて提供される各種サービスの総称をいいます。</li>
            <li>「利用者」とは、本規約に同意のうえ、本サービスを利用する全ての個人または法人をいいます。</li>
            <li>「ベンダー」とは、本サービスを通じてバイクのレンタルサービスを提供する事業者をいいます。</li>
            <li>「予約」とは、利用者がベンダーに対しバイクのレンタルを申し込むことをいいます。</li>
          </ol>
        </div>
      </section>

      <section className="mb-[40px]">
        <h2 className="font-serif text-lg font-light text-black mb-[16px]">第2条（サービス内容）</h2>
        <div className="text-sm font-sans text-gray-700 leading-relaxed space-y-[12px]">
          <p>当社は、利用者とベンダーの間におけるバイクレンタル取引を仲介するプラットフォームを提供します。当社はバイクレンタル契約の当事者とはならず、レンタル契約は利用者とベンダーの間で直接成立するものとします。</p>
          <p>本サービスの主な機能は以下のとおりです。</p>
          <ul className="list-disc list-inside space-y-[6px] pl-[8px]">
            <li>バイクの検索・比較</li>
            <li>予約の申込み・管理</li>
            <li>決済の仲介</li>
            <li>レビュー・評価の投稿</li>
            <li>利用者とベンダー間のメッセージ機能</li>
          </ul>
        </div>
      </section>

      <section className="mb-[40px]">
        <h2 className="font-serif text-lg font-light text-black mb-[16px]">第3条（利用登録）</h2>
        <div className="text-sm font-sans text-gray-700 leading-relaxed space-y-[12px]">
          <p>本サービスの利用を希望する者は、本規約に同意のうえ、当社所定の方法により利用登録を行うものとします。</p>
          <p>利用登録にあたり、以下の条件を満たす必要があります。</p>
          <ul className="list-disc list-inside space-y-[6px] pl-[8px]">
            <li>18歳以上であること</li>
            <li>有効な運転免許証を保有していること（バイクのレンタルを利用する場合）</li>
            <li>真実かつ正確な情報を提供すること</li>
            <li>過去に本規約に違反して利用を取り消されたことがないこと</li>
          </ul>
        </div>
      </section>

      <section className="mb-[40px]">
        <h2 className="font-serif text-lg font-light text-black mb-[16px]">第4条（料金および支払い）</h2>
        <div className="text-sm font-sans text-gray-700 leading-relaxed space-y-[12px]">
          <p>利用者は、ベンダーが設定するレンタル料金を支払うものとします。料金には基本レンタル料、車両補償料（CDW）、NOC補償料が含まれる場合があります。</p>
          <p>支払いは当社が提供する決済システムを通じて行われ、クレジットカードにて決済されます。</p>
        </div>
      </section>

      <section className="mb-[40px]">
        <h2 className="font-serif text-lg font-light text-black mb-[16px]">第5条（禁止事項）</h2>
        <div className="text-sm font-sans text-gray-700 leading-relaxed space-y-[12px]">
          <p>利用者は、本サービスの利用にあたり、以下の行為を行ってはなりません。</p>
          <ol className="list-decimal list-inside space-y-[6px] pl-[8px]">
            <li>法令または公序良俗に違反する行為</li>
            <li>犯罪行為に関連する行為</li>
            <li>虚偽の情報を登録する行為</li>
            <li>他の利用者またはベンダーに対する誹謗中傷、嫌がらせ</li>
            <li>本サービスの運営を妨害する行為</li>
            <li>飲酒運転、無免許運転その他交通法規に違反する行為</li>
            <li>レンタル車両の転貸、又貸し</li>
            <li>当社の承諾なく本サービスを商業目的で利用する行為</li>
          </ol>
        </div>
      </section>

      <section className="mb-[40px]">
        <h2 className="font-serif text-lg font-light text-black mb-[16px]">第6条（免責事項）</h2>
        <div className="text-sm font-sans text-gray-700 leading-relaxed space-y-[12px]">
          <p>当社は、本サービスの利用に関して利用者に生じた損害について、当社の故意または重過失による場合を除き、一切の責任を負わないものとします。</p>
          <p>レンタル車両の品質、安全性、適法性等については、ベンダーが責任を負うものとし、当社はこれらについて保証するものではありません。</p>
        </div>
      </section>

      <section className="mb-[40px]">
        <h2 className="font-serif text-lg font-light text-black mb-[16px]">第7条（準拠法・管轄裁判所）</h2>
        <div className="text-sm font-sans text-gray-700 leading-relaxed space-y-[12px]">
          <p>本規約は日本法に準拠し、日本法に従って解釈されるものとします。</p>
          <p>本規約に関して紛争が生じた場合は、宮崎地方裁判所を第一審の専属的合意管轄裁判所とします。</p>
        </div>
      </section>

      <div className="border-t border-gray-100 pt-[24px] mt-[40px]">
        <p className="text-xs font-sans text-gray-400">
          制定日：2025年1月1日 ／ 株式会社リンクス
        </p>
      </div>
    </article>
  );
}

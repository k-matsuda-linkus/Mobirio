import { Metadata } from "next";

export const metadata: Metadata = {
  title: "プライバシーポリシー | Mobirio",
  description: "Mobírioのプライバシーポリシー",
};

export default function PrivacyPage() {
  return (
    <article className="prose prose-sm max-w-none">
      <h1 className="font-serif text-3xl font-light text-black mb-[40px]">プライバシーポリシー</h1>
      <p className="text-sm font-sans text-gray-500 mb-[40px]">最終更新日：2025年1月1日</p>

      <p className="text-sm font-sans text-gray-700 leading-relaxed mb-[32px]">
        株式会社リンクス（以下「当社」）は、バイクレンタルプラットフォーム「Mobirio」（以下「本サービス」）をご利用いただくお客様の個人情報保護に関し、以下のとおりプライバシーポリシーを定めます。
      </p>

      <section className="mb-[40px]">
        <h2 className="font-serif text-lg font-light text-black mb-[16px]">1. 個人情報の収集</h2>
        <div className="text-sm font-sans text-gray-700 leading-relaxed space-y-[12px]">
          <p>当社は、本サービスの提供にあたり、以下の個人情報を収集する場合があります。</p>
          <ul className="list-disc list-inside space-y-[6px] pl-[8px]">
            <li>氏名、メールアドレス、電話番号</li>
            <li>住所、生年月日</li>
            <li>運転免許証情報</li>
            <li>クレジットカード情報（決済代行会社を通じて処理）</li>
            <li>予約履歴、利用履歴</li>
            <li>デバイス情報、IPアドレス、Cookie情報</li>
            <li>位置情報（お客様の同意がある場合）</li>
          </ul>
        </div>
      </section>

      <section className="mb-[40px]">
        <h2 className="font-serif text-lg font-light text-black mb-[16px]">2. 利用目的</h2>
        <div className="text-sm font-sans text-gray-700 leading-relaxed space-y-[12px]">
          <p>収集した個人情報は、以下の目的で利用します。</p>
          <ol className="list-decimal list-inside space-y-[6px] pl-[8px]">
            <li>本サービスの提供・運営・改善</li>
            <li>ユーザー認証および本人確認</li>
            <li>予約の処理・管理</li>
            <li>決済処理</li>
            <li>カスタマーサポートの提供</li>
            <li>サービスに関する通知・お知らせの送信</li>
            <li>マーケティング・プロモーション（お客様の同意がある場合）</li>
            <li>利用状況の分析・統計の作成</li>
            <li>不正利用の検知・防止</li>
          </ol>
        </div>
      </section>

      <section className="mb-[40px]">
        <h2 className="font-serif text-lg font-light text-black mb-[16px]">3. 第三者提供</h2>
        <div className="text-sm font-sans text-gray-700 leading-relaxed space-y-[12px]">
          <p>当社は、以下の場合を除き、お客様の同意なく個人情報を第三者に提供することはありません。</p>
          <ul className="list-disc list-inside space-y-[6px] pl-[8px]">
            <li>予約の成立に必要な範囲でベンダーに提供する場合</li>
            <li>法令に基づく場合</li>
            <li>人の生命・身体・財産の保護に必要な場合</li>
            <li>業務委託先に対し、業務遂行に必要な範囲で提供する場合</li>
          </ul>
        </div>
      </section>

      <section className="mb-[40px]">
        <h2 className="font-serif text-lg font-light text-black mb-[16px]">4. 安全管理措置</h2>
        <div className="text-sm font-sans text-gray-700 leading-relaxed space-y-[12px]">
          <p>当社は、個人情報の漏洩、滅失、毀損の防止その他の安全管理のために、以下の措置を講じます。</p>
          <ul className="list-disc list-inside space-y-[6px] pl-[8px]">
            <li>SSL/TLSによる通信の暗号化</li>
            <li>アクセス権限の管理・制限</li>
            <li>不正アクセス防止措置の実施</li>
            <li>従業員に対する個人情報保護教育の実施</li>
          </ul>
        </div>
      </section>

      <section className="mb-[40px]">
        <h2 className="font-serif text-lg font-light text-black mb-[16px]">5. Cookie（クッキー）について</h2>
        <div className="text-sm font-sans text-gray-700 leading-relaxed space-y-[12px]">
          <p>本サービスでは、サービスの利便性向上、利用状況の分析、広告配信の最適化のためにCookieを使用しています。</p>
          <p>お客様はブラウザの設定によりCookieの受け取りを拒否することができますが、その場合、本サービスの一部機能がご利用いただけなくなる可能性があります。</p>
          <p>当社が使用するCookieの種類：</p>
          <ul className="list-disc list-inside space-y-[6px] pl-[8px]">
            <li><span className="font-medium">必須Cookie</span> — サービスの基本機能に必要</li>
            <li><span className="font-medium">分析Cookie</span> — 利用状況の把握・改善に使用</li>
            <li><span className="font-medium">機能Cookie</span> — お客様の設定を記憶</li>
          </ul>
        </div>
      </section>

      <section className="mb-[40px]">
        <h2 className="font-serif text-lg font-light text-black mb-[16px]">6. お問い合わせ</h2>
        <div className="text-sm font-sans text-gray-700 leading-relaxed">
          <p>個人情報の取扱いに関するお問い合わせは、以下までご連絡ください。</p>
          <div className="mt-[16px] p-[20px] bg-gray-50 border border-gray-100">
            <p className="font-medium text-black">株式会社リンクス 個人情報保護担当</p>
            <p className="mt-[8px]">メール：privacy@mobirio.jp</p>
            <p>電話：03-0000-0000（平日 10:00〜18:00）</p>
          </div>
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

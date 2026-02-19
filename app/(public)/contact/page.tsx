export default function ContactPage() {
  return (
    <div className="py-[50px] md:py-[100px]">
      <div className="max-w-[600px] mx-auto px-[30px] md:px-[50px]">
        <h1 className="font-serif font-light text-3xl md:text-4xl mb-[30px]">お問い合わせ</h1>
        <form className="space-y-[20px]">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-[6px]">お名前</label>
            <input type="text" className="w-full border border-gray-200 px-[14px] py-[12px] text-sm focus:border-black focus:outline-none" placeholder="田中太郎" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-[6px]">メールアドレス</label>
            <input type="email" className="w-full border border-gray-200 px-[14px] py-[12px] text-sm focus:border-black focus:outline-none" placeholder="email@example.com" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-[6px]">カテゴリ</label>
            <select className="w-full border border-gray-200 px-[14px] py-[12px] text-sm focus:border-black focus:outline-none">
              <option value="">選択してください</option>
              <option value="general">一般的なお問い合わせ</option>
              <option value="reservation">予約について</option>
              <option value="vendor">ベンダー出店について</option>
              <option value="trouble">トラブル・苦情</option>
              <option value="other">その他</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-[6px]">お問い合わせ内容</label>
            <textarea rows={6} className="w-full border border-gray-200 px-[14px] py-[12px] text-sm focus:border-black focus:outline-none resize-none" placeholder="お問い合わせ内容をご記入ください" />
          </div>
          <button type="submit" className="w-full bg-black text-white py-[14px] text-sm font-medium hover:bg-gray-800 transition-colors">
            送信する
          </button>
        </form>
      </div>
    </div>
  );
}

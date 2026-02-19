import Link from "next/link";

export function Footer() {
  return (
    <footer className="bg-black text-white py-[40px] px-[20px] md:px-[50px]">
      <div className="max-w-[1200px] mx-auto">
        <div className="flex flex-col md:flex-row justify-between gap-[30px]">
          <div>
            <p className="font-serif text-lg tracking-wider">Mobirio</p>
            <p className="mt-[8px] text-sm text-gray-400">宮崎発のレンタルバイクプラットフォーム</p>
          </div>
          <div className="flex gap-[40px] text-sm text-gray-400">
            <div className="flex flex-col gap-[8px]">
              <Link href="/about" className="hover:text-white transition-colors">会社概要</Link>
              <Link href="/terms" className="hover:text-white transition-colors">利用規約</Link>
              <Link href="/privacy" className="hover:text-white transition-colors">プライバシー</Link>
            </div>
            <div className="flex flex-col gap-[8px]">
              <Link href="/vendors" className="hover:text-white transition-colors">ショップを探す</Link>
              <Link href="/bikes" className="hover:text-white transition-colors">バイクを探す</Link>
              <Link href="/contact" className="hover:text-white transition-colors">お問い合わせ</Link>
              <Link href="/faq" className="hover:text-white transition-colors">よくある質問</Link>
            </div>
          </div>
        </div>
        <div className="mt-[30px] pt-[20px] border-t border-gray-800 text-xs text-gray-500">
          &copy; 2026 Mobirio. All rights reserved.
        </div>
      </div>
    </footer>
  );
}

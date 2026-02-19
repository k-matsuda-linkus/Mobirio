import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-[30px]">
      <div className="text-center max-w-[480px]">
        <p className="text-[120px] font-serif font-light leading-none text-gray-200">
          404
        </p>
        <h1 className="mt-[20px] font-serif font-light text-2xl">
          ページが見つかりません
        </h1>
        <p className="mt-[12px] text-gray-500 text-sm leading-relaxed">
          お探しのページは移動または削除された可能性があります。
        </p>
        <Link
          href="/"
          className="inline-block mt-[30px] px-[32px] py-[14px] bg-black text-white text-sm font-medium hover:bg-gray-800 transition-colors"
        >
          トップへ戻る
        </Link>
      </div>
    </div>
  );
}

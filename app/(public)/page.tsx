import Link from "next/link";
import { MapPin } from "lucide-react";
import { mockBikes } from "@/lib/mock/bikes";
import { REGIONS } from "@/lib/constants";
import BikeCard from "@/components/bike/BikeCard";

export const revalidate = 3600;

export default function HomePage() {
  const featured = mockBikes.filter((b) => b.is_featured).slice(0, 4);

  return (
    <div>
      {/* Hero */}
      <section className="relative bg-black text-white py-[80px] md:py-[120px]">
        <div className="max-w-[1200px] mx-auto px-[30px] md:px-[50px]">
          <h1 className="font-serif font-light text-4xl md:text-6xl leading-tight">
            全国で、
            <br />
            バイクに乗ろう。
          </h1>
          <p className="mt-[20px] text-gray-400 max-w-[500px] text-sm md:text-base leading-relaxed">
            Mobirioは全国のレンタルバイクプラットフォーム。
            EVから大型バイクまで、あなたにぴったりの一台を見つけましょう。
          </p>
          <div className="mt-[40px] flex gap-[16px]">
            <Link href="/bikes" className="bg-white text-black px-[32px] py-[14px] text-sm font-medium hover:bg-gray-100 transition-colors">
              バイクを探す
            </Link>
            <Link href="/about" className="border border-white/30 text-white px-[32px] py-[14px] text-sm hover:bg-white/10 transition-colors">
              詳しく見る
            </Link>
          </div>
        </div>
      </section>

      {/* Featured bikes */}
      <section className="py-[50px] md:py-[100px]">
        <div className="max-w-[1200px] mx-auto px-[30px] md:px-[50px]">
          <h2 className="font-serif font-light text-3xl md:text-4xl mb-[30px]">おすすめバイク</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[20px]">
            {featured.map((bike) => (
              <BikeCard key={bike.id} bike={bike} />
            ))}
          </div>
          <div className="mt-[40px] text-center">
            <Link href="/bikes" className="text-sm text-accent hover:underline underline-offset-4">
              すべてのバイクを見る &rarr;
            </Link>
          </div>
        </div>
      </section>

      {/* Region shops */}
      <section className="py-[50px] md:py-[100px]">
        <div className="max-w-[1200px] mx-auto px-[30px] md:px-[50px]">
          <h2 className="font-serif font-light text-3xl md:text-4xl mb-[30px]">エリアからショップを探す</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-[20px]">
            {REGIONS.map((region) => (
              <Link
                key={region.id}
                href={`/vendors?region=${region.id}`}
                className="border border-gray-200 p-[24px] hover:border-gray-400 transition-colors"
              >
                <MapPin size={18} className="text-gray-400 mb-[8px]" />
                <p className="font-serif text-lg">{region.label}</p>
                <p className="text-xs text-gray-400 mt-[8px]">{region.prefectures.join("、")}</p>
              </Link>
            ))}
          </div>
          <div className="mt-[40px] text-center">
            <Link href="/vendors" className="text-sm text-accent hover:underline underline-offset-4">
              すべてのショップを見る &rarr;
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-[50px] md:py-[100px] bg-gray-50">
        <div className="max-w-[1200px] mx-auto px-[30px] md:px-[50px]">
          <h2 className="font-serif font-light text-3xl md:text-4xl mb-[50px] text-center">Mobirioの特徴</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-[30px]">
            {[
              { title: "簡単予約", desc: "オンラインで24時間いつでも予約可能。QRコードで受け取りもスムーズ。" },
              { title: "豊富な車種", desc: "EVスクーターから大型バイクまで。あなたの目的に合った一台を。" },
              { title: "安心補償", desc: "CDW・NOC補償オプション完備。万が一の時も安心してご利用いただけます。" },
            ].map((f) => (
              <div key={f.title} className="border border-gray-200 bg-white p-[30px]">
                <h3 className="font-serif text-lg mb-[12px]">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-[50px] md:py-[100px]">
        <div className="max-w-[1200px] mx-auto px-[30px] md:px-[50px] text-center">
          <h2 className="font-serif font-light text-3xl md:text-4xl mb-[16px]">さあ、始めましょう</h2>
          <p className="text-sm text-gray-500 mb-[30px]">無料で会員登録して、今すぐバイクを予約しましょう。</p>
          <Link href="/register" className="inline-block bg-black text-white px-[40px] py-[14px] text-sm font-medium hover:bg-gray-800 transition-colors">
            無料で始める
          </Link>
        </div>
      </section>
    </div>
  );
}

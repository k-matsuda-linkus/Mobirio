import { Star } from "lucide-react";

const REVIEWS = [
  {
    id: "rev-001",
    bike: "Honda PCX 160",
    vendor: "サンシャインモータース宮崎",
    date: "2025/01/12",
    rating: 4.5,
    title: "市内観光に最適",
    comment: "燃費が良く、街乗りに最適でした。車体も綺麗に整備されていて安心して乗れました。スタッフの対応も丁寧で、また利用したいと思います。",
  },
  {
    id: "rev-002",
    bike: "Kawasaki Ninja 400",
    vendor: "青島バイクレンタル",
    date: "2024/12/22",
    rating: 5.0,
    title: "最高のツーリング体験",
    comment: "日南海岸をNinja 400で走るのは最高でした！パワーも十分で高速道路も余裕がありました。返却時にツーリングルートのおすすめも教えてもらえて、次回も利用したいです。",
  },
  {
    id: "rev-003",
    bike: "Suzuki Address 125",
    vendor: "サンシャインモータース宮崎",
    date: "2024/11/16",
    rating: 4.0,
    title: "コスパが良い",
    comment: "ちょっとした移動に便利でした。料金もリーズナブルで助かりました。ヘルメットの種類がもう少しあると嬉しいです。",
  },
  {
    id: "rev-004",
    bike: "Honda CB400SF",
    vendor: "えびのモーターサイクル",
    date: "2024/10/21",
    rating: 3.5,
    title: "エンジン音が気持ちいい",
    comment: "CB400SFのエンジン音は最高です。えびの高原の道は走りやすく楽しめました。ただ、店舗の場所が少しわかりにくかったです。",
  },
];

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-[2px]">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`w-[14px] h-[14px] ${
            i <= Math.floor(rating)
              ? "text-yellow-500 fill-yellow-500"
              : i - 0.5 <= rating
              ? "text-yellow-500 fill-yellow-500/50"
              : "text-gray-200"
          }`}
        />
      ))}
      <span className="text-xs font-sans text-gray-600 ml-[4px]">{rating.toFixed(1)}</span>
    </div>
  );
}

export default function ReviewsPage() {
  return (
    <div>
      <h1 className="font-serif text-2xl font-light text-black mb-[8px]">レビュー一覧</h1>
      <p className="text-sm font-sans text-gray-500 mb-[24px]">あなたが投稿したレビュー（{REVIEWS.length}件）</p>

      {REVIEWS.length === 0 ? (
        <div className="text-center py-[80px]">
          <Star className="w-[40px] h-[40px] text-gray-200 mx-auto mb-[16px]" />
          <p className="text-sm font-sans text-gray-400">投稿したレビューはありません</p>
        </div>
      ) : (
        <div className="space-y-[16px]">
          {REVIEWS.map((review) => (
            <div key={review.id} className="bg-white border border-gray-100 p-[24px]">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-[12px] mb-[12px]">
                <div>
                  <p className="text-sm font-sans font-medium text-black">{review.bike}</p>
                  <p className="text-xs font-sans text-gray-500 mt-[2px]">{review.vendor}</p>
                </div>
                <div className="flex items-center gap-[12px]">
                  <StarRating rating={review.rating} />
                  <span className="text-xs font-sans text-gray-400">{review.date}</span>
                </div>
              </div>
              <h3 className="text-sm font-sans font-medium text-black mb-[8px]">{review.title}</h3>
              <p className="text-sm font-sans text-gray-600 leading-relaxed">{review.comment}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

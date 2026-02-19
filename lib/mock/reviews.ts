export interface Review {
  id: string;
  bikeName: string;
  bikeId: string;
  vendorName: string;
  vendorId: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export const mockReviews: Review[] = [
  { id: 'rev-001', bikeName: 'Ninja 400', bikeId: 'bike-005', vendorName: '日南モーターサイクル', vendorId: 'v-003', rating: 5, comment: '素晴らしい走行感でした。メンテナンスも行き届いており、安心して乗れました。日南海岸のツーリングに最適です。', createdAt: '2026-01-08' },
  { id: 'rev-002', bikeName: 'MT-09 SP', bikeId: 'bike-006', vendorName: 'サンシャインモータース宮崎', vendorId: 'v-001', rating: 4, comment: 'パワフルで楽しいバイクです。受け取り時の説明がやや早口でしたが、車両自体は非常に良い状態でした。', createdAt: '2026-01-22' },
  { id: 'rev-003', bikeName: 'BENLY e:', bikeId: 'bike-001', vendorName: 'サンシャインモータース宮崎', vendorId: 'v-001', rating: 4, comment: '市内観光に最適でした。燃費も良く、取り回しも楽です。次回もお願いしたいです。', createdAt: '2025-12-15' },
  { id: 'rev-004', bikeName: 'CB400SF', bikeId: 'bike-009', vendorName: '博多バイクステーション', vendorId: 'v-004', rating: 5, comment: '名車CB400SF、久しぶりに乗りましたが最高でした！博多から糸島方面へのツーリング、最高のルートでした。', createdAt: '2026-02-01' },
  { id: 'rev-005', bikeName: 'SV650', bikeId: 'bike-011', vendorName: '北九州ライダーズ', vendorId: 'v-005', rating: 4, comment: 'Vツインの鼓動が心地良い。関門海峡を渡って下関まで走りました。スタッフの対応も丁寧でした。', createdAt: '2026-01-30' },
  { id: 'rev-006', bikeName: 'V-Strom 250SX', bikeId: 'bike-012', vendorName: '桜島モーターサイクル', vendorId: 'v-006', rating: 5, comment: '桜島一周ツーリングに利用。アドベンチャーバイクなので道を選ばず走れました。景色も最高！', createdAt: '2026-02-05' },
  { id: 'rev-007', bikeName: 'YZF-R7', bikeId: 'bike-013', vendorName: '大阪モーターレンタル', vendorId: 'v-007', rating: 4, comment: 'スポーツ走行を楽しみたい方にはおすすめ。阪神高速湾岸線が気持ちよかったです。', createdAt: '2026-01-25' },
  { id: 'rev-008', bikeName: 'GB350', bikeId: 'bike-015', vendorName: '東京ライドシェア', vendorId: 'v-008', rating: 5, comment: 'クラシカルな見た目が最高。都内の撮影スポット巡りに使いました。単気筒の振動が心地よいです。', createdAt: '2026-02-10' },
  { id: 'rev-009', bikeName: 'CRF250 Rally', bikeId: 'bike-016', vendorName: '北海道ツーリングベース', vendorId: 'v-009', rating: 5, comment: '北海道の雄大な景色を満喫できました。ダート道も安心して走れるバイクです。3日間レンタルしましたが大満足。', createdAt: '2026-02-08' },
  { id: 'rev-010', bikeName: 'PCX 125', bikeId: 'bike-003', vendorName: '青島バイクレンタル', vendorId: 'v-002', rating: 4, comment: '青島神社への観光に利用。燃費が良く、小回りが利いて便利でした。', createdAt: '2026-01-18' },
];

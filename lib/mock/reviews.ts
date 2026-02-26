export interface Review {
  id: string;
  user_id: string;
  bike_id: string;
  vendor_id: string;
  bikeName: string;
  vendorName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export const mockReviews: Review[] = [
  { id: 'rev-001', user_id: 'user-001', bike_id: 'bike-005', vendor_id: 'v-003', bikeName: 'Ninja 400', vendorName: '日南モーターサイクル', rating: 5, comment: '素晴らしい走行感でした。メンテナンスも行き届いており、安心して乗れました。日南海岸のツーリングに最適です。', createdAt: '2026-01-08' },
  { id: 'rev-002', user_id: 'user-001', bike_id: 'bike-006', vendor_id: 'v-001', bikeName: 'MT-09 SP', vendorName: 'サンシャインモータース宮崎', rating: 4, comment: 'パワフルで楽しいバイクです。受け取り時の説明がやや早口でしたが、車両自体は非常に良い状態でした。', createdAt: '2026-01-22' },
  { id: 'rev-003', user_id: 'user-002', bike_id: 'bike-001', vendor_id: 'v-001', bikeName: 'BENLY e:', vendorName: 'サンシャインモータース宮崎', rating: 4, comment: '市内観光に最適でした。燃費も良く、取り回しも楽です。次回もお願いしたいです。', createdAt: '2025-12-15' },
  { id: 'rev-004', user_id: 'user-001', bike_id: 'bike-009', vendor_id: 'v-004', bikeName: 'CB400SF', vendorName: '博多バイクステーション', rating: 5, comment: '名車CB400SF、久しぶりに乗りましたが最高でした！博多から糸島方面へのツーリング、最高のルートでした。', createdAt: '2026-02-01' },
  { id: 'rev-005', user_id: 'user-002', bike_id: 'bike-011', vendor_id: 'v-005', bikeName: 'SV650', vendorName: '北九州ライダーズ', rating: 4, comment: 'Vツインの鼓動が心地良い。関門海峡を渡って下関まで走りました。スタッフの対応も丁寧でした。', createdAt: '2026-01-30' },
  { id: 'rev-006', user_id: 'user-003', bike_id: 'bike-012', vendor_id: 'v-006', bikeName: 'V-Strom 250SX', vendorName: '桜島モーターサイクル', rating: 5, comment: '桜島一周ツーリングに利用。アドベンチャーバイクなので道を選ばず走れました。景色も最高！', createdAt: '2026-02-05' },
  { id: 'rev-007', user_id: 'user-001', bike_id: 'bike-013', vendor_id: 'v-007', bikeName: 'YZF-R7', vendorName: '大阪モーターレンタル', rating: 4, comment: 'スポーツ走行を楽しみたい方にはおすすめ。阪神高速湾岸線が気持ちよかったです。', createdAt: '2026-01-25' },
  { id: 'rev-008', user_id: 'user-002', bike_id: 'bike-015', vendor_id: 'v-008', bikeName: 'GB350', vendorName: '東京ライドシェア', rating: 5, comment: 'クラシカルな見た目が最高。都内の撮影スポット巡りに使いました。単気筒の振動が心地よいです。', createdAt: '2026-02-10' },
  { id: 'rev-009', user_id: 'user-003', bike_id: 'bike-016', vendor_id: 'v-009', bikeName: 'CRF250 Rally', vendorName: '北海道ツーリングベース', rating: 5, comment: '北海道の雄大な景色を満喫できました。ダート道も安心して走れるバイクです。3日間レンタルしましたが大満足。', createdAt: '2026-02-08' },
  { id: 'rev-010', user_id: 'user-001', bike_id: 'bike-003', vendor_id: 'v-002', bikeName: 'PCX 125', vendorName: '青島バイクレンタル', rating: 4, comment: '青島神社への観光に利用。燃費が良く、小回りが利いて便利でした。', createdAt: '2026-01-18' },
];

export interface BusinessEntity {
  id: string;
  type: "corporation" | "sole_proprietor";
  name: string;
  corporateNumber?: string;
  representative: string;
  postalCode: string;
  address: string;
  phone: string;
  fax?: string;
  email: string;
  staff: string;
  staffPhone?: string;
}

export const mockBusinessEntities: BusinessEntity[] = [
  {
    id: "biz-001",
    type: "corporation",
    name: "サンシャインモータース株式会社",
    corporateNumber: "1234567890123",
    representative: "山田太郎",
    postalCode: "880-0805",
    address: "宮崎県宮崎市橘通東3-1-1",
    phone: "0985-12-3456",
    fax: "0985-12-3457",
    email: "info@sunshine-motors.jp",
    staff: "鈴木一郎",
    staffPhone: "0985-12-3458",
  },
  {
    id: "biz-002",
    type: "sole_proprietor",
    name: "青島バイクレンタル",
    representative: "佐藤花子",
    postalCode: "889-2162",
    address: "宮崎県宮崎市青島2-233",
    phone: "0985-65-7890",
    email: "info@aoshima-bike.jp",
    staff: "佐藤花子",
  },
  {
    id: "biz-003",
    type: "corporation",
    name: "日南モーターサイクル株式会社",
    corporateNumber: "9876543210987",
    representative: "田中次郎",
    postalCode: "887-0001",
    address: "宮崎県日南市岩崎3-2-1",
    phone: "0987-22-1234",
    email: "info@nichinan-mc.jp",
    staff: "田中次郎",
  },
  {
    id: "biz-004",
    type: "corporation",
    name: "九州ライダーズ株式会社",
    corporateNumber: "1111222233334",
    representative: "高橋三郎",
    postalCode: "812-0011",
    address: "福岡県福岡市博多区博多駅前2-1-1",
    phone: "092-123-4567",
    fax: "092-123-4568",
    email: "info@kyushu-riders.jp",
    staff: "伊藤四郎",
    staffPhone: "092-123-4569",
  },
  {
    id: "biz-005",
    type: "corporation",
    name: "桜島モーターサイクル株式会社",
    corporateNumber: "5555666677778",
    representative: "中村五郎",
    postalCode: "890-0053",
    address: "鹿児島県鹿児島市中央町1-1",
    phone: "099-234-5678",
    email: "info@sakurajima-mc.jp",
    staff: "中村五郎",
  },
  {
    id: "biz-006",
    type: "corporation",
    name: "大阪モーターレンタル株式会社",
    corporateNumber: "2222333344445",
    representative: "松本六郎",
    postalCode: "542-0076",
    address: "大阪府大阪市中央区難波5-1-60",
    phone: "06-1234-5678",
    email: "info@osaka-motor.jp",
    staff: "松本六郎",
  },
  {
    id: "biz-007",
    type: "corporation",
    name: "東京ライドシェア株式会社",
    corporateNumber: "3333444455556",
    representative: "渡辺七郎",
    postalCode: "150-0043",
    address: "東京都渋谷区道玄坂2-1-1",
    phone: "03-9876-5432",
    email: "info@tokyo-rideshare.jp",
    staff: "渡辺七郎",
  },
  {
    id: "biz-008",
    type: "corporation",
    name: "北海道ツーリングベース株式会社",
    corporateNumber: "4444555566667",
    representative: "小林八郎",
    postalCode: "060-0005",
    address: "北海道札幌市中央区北5条西4丁目7",
    phone: "011-345-6789",
    email: "info@hokkaido-touring.jp",
    staff: "小林八郎",
  },
];

/** 後方互換: 既存コードが単一エンティティを参照している場合 */
export const mockBusinessEntity: BusinessEntity = mockBusinessEntities[0];

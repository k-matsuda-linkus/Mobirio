export interface NavItem { href: string; label: string; icon?: string; children?: NavItem[]; badge?: string; }
export const PUBLIC_NAV_ITEMS: NavItem[] = [{ href: "/bikes", label: "バイクを探す" },{ href: "/vendors", label: "ショップを探す" },{ href: "/guide", label: "ご利用ガイド" },{ href: "/about", label: "Mobirioについて" }];

export interface Region {
  id: string;
  label: string;
  prefectures: string[];
}

export const REGIONS: Region[] = [
  { id: "hokkaido", label: "北海道", prefectures: ["北海道"] },
  { id: "tohoku", label: "東北", prefectures: ["青森県", "岩手県", "宮城県", "秋田県", "山形県", "福島県"] },
  { id: "kanto", label: "関東", prefectures: ["茨城県", "栃木県", "群馬県", "埼玉県", "千葉県", "東京都", "神奈川県"] },
  { id: "chubu", label: "中部", prefectures: ["新潟県", "富山県", "石川県", "福井県", "山梨県", "長野県", "岐阜県", "静岡県", "愛知県"] },
  { id: "kinki", label: "近畿", prefectures: ["三重県", "滋賀県", "京都府", "大阪府", "兵庫県", "奈良県", "和歌山県"] },
  { id: "chugoku", label: "中国", prefectures: ["鳥取県", "島根県", "岡山県", "広島県", "山口県"] },
  { id: "shikoku", label: "四国", prefectures: ["徳島県", "香川県", "愛媛県", "高知県"] },
  { id: "kyushu", label: "九州・沖縄", prefectures: ["福岡県", "佐賀県", "長崎県", "熊本県", "大分県", "宮崎県", "鹿児島県", "沖縄県"] },
];
export const ADMIN_NAV_ITEMS: NavItem[] = [{ href: "/dashboard", label: "ダッシュボード", icon: "LayoutDashboard" },{ href: "/dashboard/vendors", label: "ベンダー管理", icon: "Store" },{ href: "/dashboard/users", label: "ユーザー管理", icon: "Users" },{ href: "/dashboard/reservations", label: "全予約", icon: "CalendarDays" },{ href: "/dashboard/bikes", label: "全バイク", icon: "Bike" },{ href: "/dashboard/pricing", label: "料金表設定", icon: "JapaneseYen" },{ href: "/dashboard/payments", label: "決済管理", icon: "CreditCard" },{ href: "/dashboard/revenue", label: "売上計算", icon: "Calculator" },{ href: "/dashboard/reports", label: "レポート", icon: "BarChart3" },{ href: "/dashboard/reviews", label: "レビュー管理", icon: "Star" },{ href: "/dashboard/inquiries", label: "お問い合わせ", icon: "MessageSquare" },{ href: "/dashboard/analytics", label: "アクセス解析", icon: "TrendingUp" },{ href: "/dashboard/notifications", label: "通知管理", icon: "Bell" },{ href: "/dashboard/settings", label: "システム設定", icon: "Settings" }];
export const VENDOR_NAV_ITEMS: NavItem[] = [
  { href: "/vendor", label: "TOP", icon: "LayoutDashboard" },
  { href: "/vendor/business", label: "事業者情報", icon: "Building2" },
  { href: "#rental", label: "レンタル管理", icon: "CalendarDays", children: [
    { href: "/vendor/reservations", label: "予約一覧" },
    { href: "/vendor/calendar", label: "車両予約状況" },
    { href: "/vendor/inquiries", label: "お問い合わせ一覧" },
    { href: "/vendor/reservations/export", label: "予約データ抽出" },
  ]},
  { href: "#bikes", label: "車両管理", icon: "Bike", children: [
    { href: "/vendor/bikes", label: "車両一覧" },
    { href: "/vendor/bikes/archived", label: "アーカイブ車両" },
  ]},
  { href: "#gear", label: "ライダーズギア管理", icon: "HardHat", children: [
    { href: "/vendor/gear", label: "ライダーズギア一覧" },
  ]},
  { href: "#shop", label: "店舗管理", icon: "Store", children: [
    { href: "/vendor/shop", label: "店舗設定" },
    { href: "/vendor/reviews", label: "店舗クチコミ一覧" },
  ]},
  { href: "/vendor/campaigns", label: "キャンペーン一覧", icon: "Megaphone", badge: "開発中" },
  { href: "/vendor/announcements", label: "お知らせ一覧", icon: "Bell" },
  { href: "#exports", label: "データ出力管理", icon: "FileDown", children: [
    { href: "/vendor/exports/insurance", label: "任意保険請求明細書" },
    { href: "/vendor/exports/rental-record", label: "譲渡実績報告書" },
    { href: "/vendor/exports/royalty", label: "ロイヤリティ明細書" },
    { href: "/vendor/exports/logs", label: "ログ出力" },
  ]},
  { href: "#analytics", label: "分析", icon: "BarChart3", children: [
    { href: "/vendor/analytics/shop-pv", label: "店舗PV分析" },
    { href: "/vendor/analytics/bike-pv", label: "車両PV分析" },
    { href: "/vendor/analytics/shop-performance", label: "店舗予約実績分析" },
    { href: "/vendor/analytics/bike-performance", label: "車両予約実績分析" },
  ]},
  { href: "/vendor/manual", label: "マニュアル", icon: "BookOpen" },
];

// Engine Types（DB EngineType に準拠）
export const ENGINE_TYPES = [
  { value: "single", label: "単気筒" },
  { value: "parallel_twin", label: "並列二気筒" },
  { value: "v_twin", label: "V型二気筒" },
  { value: "inline_3", label: "直列三気筒" },
  { value: "inline_4", label: "直列四気筒" },
  { value: "supercharged_inline_4", label: "スーパーチャージド四気筒" },
  { value: "flat_6", label: "水平対向六気筒" },
  { value: "electric", label: "電動" },
] as const;

// License Types（DB LicenseType に準拠）
export const LICENSE_TYPES = [
  { value: "none", label: "免許不要" },
  { value: "gentsuki", label: "原付免許" },
  { value: "kogata", label: "小型限定普通二輪" },
  { value: "futsu", label: "普通二輪" },
  { value: "oogata", label: "大型二輪" },
] as const;

export const MOTORCYCLE_CLASSES = [
  { value: "50", label: "原付" },
  { value: "125", label: "小型" },
  { value: "250", label: "軽二輪" },
  { value: "400", label: "普通二輪" },
  { value: "large", label: "大型二輪" },
  { value: "ev", label: "電動バイク / EV" },
  { value: "kickboard", label: "電動キックボード" },
] as const;

export const OPTION_CATEGORIES = [
  { value: "safety", label: "安全装備（ヘルメット等）" },
  { value: "accessory", label: "アクセサリー（グローブ・バッグ・スマホホルダー等）" },
  { value: "insurance", label: "保険・補償" },
  { value: "other", label: "その他（ETC・インカム等）" },
] as const;

export const RENTAL_DURATIONS = [
  { value: "2h", label: "2時間", hours: 2 },
  { value: "4h", label: "4時間", hours: 4 },
  { value: "1day", label: "日帰り", hours: 8 },
  { value: "24h", label: "24時間", hours: 24 },
  { value: "32h", label: "1泊2日", hours: 32 },
] as const;

export const VEHICLE_CLASSES = [
  { value: "ev", label: "特定EV", displacement: "~0.6kw" },
  { value: "50", label: "50cc", displacement: "~50cc" },
  { value: "125", label: "125cc", displacement: "51~125cc" },
  { value: "250", label: "250cc", displacement: "126~250cc" },
  { value: "400", label: "400cc", displacement: "251~400cc" },
  { value: "950", label: "950cc", displacement: "401~950cc" },
  { value: "1100", label: "1100cc", displacement: "951cc~" },
  { value: "1500", label: "プレミアム", displacement: "—" },
] as const;

export const RESERVATION_STATUSES = [
  { value: "pending", label: "申請中", color: "bg-gray-200 text-gray-700" },
  { value: "confirmed", label: "確定", color: "bg-[#2D7D6F]/10 text-[#2D7D6F]" },
  { value: "in_use", label: "利用中", color: "bg-black text-white" },
  { value: "completed", label: "完了", color: "bg-gray-100 text-gray-500" },
  { value: "cancelled", label: "キャンセル", color: "bg-gray-100 text-gray-400" },
  { value: "no_show", label: "ノーショー", color: "bg-gray-300 text-gray-600" },
] as const;

export const REPORT_PERIODS = [
  { value: "daily", label: "日次" },
  { value: "weekly", label: "週次" },
  { value: "monthly", label: "月次" },
  { value: "yearly", label: "年次" },
  { value: "custom", label: "カスタム" },
] as const;

export const USER_NAV_ITEMS: NavItem[] = [
  { href: "/mypage", label: "ダッシュボード", icon: "LayoutDashboard" },
  { href: "/mypage/reservations", label: "予約一覧", icon: "CalendarCheck" },
  { href: "/mypage/history", label: "利用履歴", icon: "Clock" },
  { href: "/mypage/favorites", label: "お気に入り", icon: "Heart" },
  { href: "/mypage/reviews", label: "レビュー", icon: "Star" },
  { href: "/mypage/card", label: "カード管理", icon: "CreditCard" },
  { href: "/mypage/notifications", label: "通知", icon: "Bell" },
  { href: "/mypage/messages", label: "メッセージ", icon: "MessageSquare" },
  { href: "/mypage/settings", label: "設定", icon: "Settings" },
];

export const BIKE_SORT_OPTIONS = [
  { value: "newest", label: "新着順" },
  { value: "price_asc", label: "料金が安い順" },
  { value: "price_desc", label: "料金が高い順" },
  { value: "displacement_asc", label: "排気量が小さい順" },
  { value: "displacement_desc", label: "排気量が大きい順" },
  { value: "popular", label: "人気順" },
] as const;

export const LAYOUT = {
  headerHeight: 70,
  sidebarWidth: 260,
  sectionPadding: "py-[60px] md:py-[80px]",
  containerPadding: "px-[20px] md:px-[30px] lg:px-[50px]",
  maxWidth: "max-w-[1200px]",
} as const;

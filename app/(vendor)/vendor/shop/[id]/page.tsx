"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Plus, X, Copy, ExternalLink } from "lucide-react";
import { VendorPageHeader } from "@/components/vendor/VendorPageHeader";
import { RichTextEditor } from "@/components/ui/RichTextEditor";
import { FileUploader } from "@/components/ui/FileUploader";

const prefectures = [
  "北海道","青森県","岩手県","宮城県","秋田県","山形県","福島県",
  "茨城県","栃木県","群馬県","埼玉県","千葉県","東京都","神奈川県",
  "新潟県","富山県","石川県","福井県","山梨県","長野県",
  "岐阜県","静岡県","愛知県","三重県",
  "滋賀県","京都府","大阪府","兵庫県","奈良県","和歌山県",
  "鳥取県","島根県","岡山県","広島県","山口県",
  "徳島県","香川県","愛媛県","高知県",
  "福岡県","佐賀県","長崎県","熊本県","大分県","宮崎県","鹿児島県","沖縄県",
];

const timeSlots: string[] = [];
for (let h = 0; h < 24; h++) {
  for (let m = 0; m < 60; m += 30) {
    timeSlots.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
  }
}

const mockData = {
  corpName: "サンシャインモータース株式会社",
  branchNo: "01",
  shopNameJa: "サンシャインモータース宮崎本店",
  shopNameEn: "Sunshine Motors Miyazaki Main",
  tradeNameJa: "サンシャインモータース",
  tradeNameEn: "Sunshine Motors",
  representative: "山田太郎",
  postalCode: "880-0805",
  prefecture: "宮崎県",
  address: "宮崎市橘通東3-1-1",
  district: "宮崎市",
  accessInfo: "JR宮崎駅西口から徒歩5分。宮崎交通バス「橘通3丁目」下車すぐ。",
  phone: "0985-12-3456",
  fax: "0985-12-3457",
  email: "info@sunshine-motors.jp",
  contactEmails: ["rental@sunshine-motors.jp", "support@sunshine-motors.jp"],
  minAge: 18,
  twoHourPlan: "yes",
  requestReservation: "yes",
  requestDeadlineHours: 24,
  operationStartTime: "08:00",
  operationEndTime: "20:00",
  businessHours: "8:00〜20:00（最終受付 19:00）",
  closedDays: [false, false, true, false, false, false, false], // 日月火水木金土
  webStopDays: { daily: false, nextDay: true, substituteNextDay: false, bikeSettingNextDay: false },
  shopUrl: "https://www.sunshine-motors.jp",
  hasParking: "yes",
  parkingCount: "10",
  jafDiscount: true,
  insuranceCompany: "東京海上日動火災保険",
  insurancePhone: "0120-119-110",
  shopGuide: "<p>宮崎市中心部の好アクセスな店舗です。豊富な車種を取り揃えております。</p>",
  shopImages: ["/images/shop/miyazaki_1.jpg"],
  youtubeUrl: "",
  paymentMethods: { cash: true, credit: true },
  lineId: "@sunshine-motors",
  instagramUrl: "https://www.instagram.com/sunshine_motors/",
  facebookUrl: "https://www.facebook.com/sunshinemotors",
  googleBusinessUrl: "https://g.page/sunshine-motors-miyazaki",
  transferReportEmails: ["report@sunshine-motors.jp"],
  contractPlan: "レンタルバイクプラン",
  createdAt: "2023-01-15 09:00:00",
  createdBy: "システム管理者",
  updatedAt: "2026-02-01 15:30:00",
  updatedBy: "管理者A",
};

export default function ShopDetailPage() {
  const params = useParams();
  const shopId = params.id as string;

  const [corpName] = useState(mockData.corpName);
  const [branchNo] = useState(mockData.branchNo);
  const [shopNameJa, setShopNameJa] = useState(mockData.shopNameJa);
  const [shopNameEn, setShopNameEn] = useState(mockData.shopNameEn);
  const [tradeNameJa, setTradeNameJa] = useState(mockData.tradeNameJa);
  const [tradeNameEn, setTradeNameEn] = useState(mockData.tradeNameEn);
  const [representative, setRepresentative] = useState(mockData.representative);
  const [postalCode, setPostalCode] = useState(mockData.postalCode);
  const [prefecture, setPrefecture] = useState(mockData.prefecture);
  const [address, setAddress] = useState(mockData.address);
  const [district, setDistrict] = useState(mockData.district);
  const [accessInfo, setAccessInfo] = useState(mockData.accessInfo);
  const [phone, setPhone] = useState(mockData.phone);
  const [fax, setFax] = useState(mockData.fax);
  const [email, setEmail] = useState(mockData.email);
  const [contactEmails, setContactEmails] = useState(mockData.contactEmails);
  const [minAge, setMinAge] = useState(mockData.minAge);
  const [twoHourPlan, setTwoHourPlan] = useState(mockData.twoHourPlan);
  const [requestReservation, setRequestReservation] = useState(mockData.requestReservation);
  const [requestDeadlineHours, setRequestDeadlineHours] = useState(mockData.requestDeadlineHours);
  const [operationStartTime, setOperationStartTime] = useState(mockData.operationStartTime);
  const [operationEndTime, setOperationEndTime] = useState(mockData.operationEndTime);
  const [businessHours, setBusinessHours] = useState(mockData.businessHours);
  const [closedDays, setClosedDays] = useState(mockData.closedDays);
  const [webStopDays, setWebStopDays] = useState(mockData.webStopDays);
  const [shopUrl, setShopUrl] = useState(mockData.shopUrl);
  const [hasParking, setHasParking] = useState(mockData.hasParking);
  const [parkingCount, setParkingCount] = useState(mockData.parkingCount);
  const [jafDiscount, setJafDiscount] = useState(mockData.jafDiscount);
  const [insuranceCompany, setInsuranceCompany] = useState(mockData.insuranceCompany);
  const [insurancePhone, setInsurancePhone] = useState(mockData.insurancePhone);
  const [shopGuide, setShopGuide] = useState(mockData.shopGuide);
  const [shopImages, setShopImages] = useState(mockData.shopImages);
  const [youtubeUrl, setYoutubeUrl] = useState(mockData.youtubeUrl);
  const [paymentMethods, setPaymentMethods] = useState(mockData.paymentMethods);
  const [lineId, setLineId] = useState(mockData.lineId);
  const [instagramUrl, setInstagramUrl] = useState(mockData.instagramUrl);
  const [facebookUrl, setFacebookUrl] = useState(mockData.facebookUrl);
  const [googleBusinessUrl, setGoogleBusinessUrl] = useState(mockData.googleBusinessUrl);
  const [transferReportEmails, setTransferReportEmails] = useState(mockData.transferReportEmails);
  const [contractPlan] = useState(mockData.contractPlan);

  const dayLabels = ["日", "月", "火", "水", "木", "金", "土"];

  const addContactEmail = () => {
    setContactEmails((prev) => [...prev, ""]);
  };
  const removeContactEmail = (index: number) => {
    setContactEmails((prev) => prev.filter((_, i) => i !== index));
  };
  const updateContactEmail = (index: number, value: string) => {
    setContactEmails((prev) => prev.map((e, i) => (i === index ? value : e)));
  };

  const addTransferEmail = () => {
    setTransferReportEmails((prev) => [...prev, ""]);
  };
  const removeTransferEmail = (index: number) => {
    setTransferReportEmails((prev) => prev.filter((_, i) => i !== index));
  };
  const updateTransferEmail = (index: number, value: string) => {
    setTransferReportEmails((prev) => prev.map((e, i) => (i === index ? value : e)));
  };

  const inputClass = "w-full border border-gray-200 px-[12px] py-[10px] text-sm focus:border-accent focus:outline-none";
  const labelClass = "block text-xs font-medium text-gray-500 mb-[4px]";
  const sectionClass = "bg-white border border-gray-200 p-[24px] space-y-[16px]";
  const sectionTitle = "text-base font-medium text-gray-800 pb-[8px] border-b border-gray-100 mb-[16px]";

  return (
    <div>
      <VendorPageHeader
        title="店舗詳細"
        breadcrumbs={[
          { label: "店舗設定", href: "/vendor/shop" },
          { label: mockData.shopNameJa },
        ]}
      />

      <div className="space-y-[24px]">
        {/* 法人・店舗基本情報 */}
        <div className={sectionClass}>
          <h2 className={sectionTitle}>法人・店舗基本情報</h2>

          <div className="grid grid-cols-2 gap-[16px]">
            <div>
              <label className={labelClass}>法人名</label>
              <div className="flex items-center gap-[8px]">
                <input type="text" value={corpName} readOnly className={inputClass + " bg-gray-50 text-gray-500"} />
                <Link
                  href="/vendor/business"
                  className="flex items-center gap-[4px] text-sm text-accent hover:text-accent/80 whitespace-nowrap"
                >
                  <ExternalLink className="w-[14px] h-[14px]" />
                  事業者情報
                </Link>
              </div>
            </div>
            <div>
              <label className={labelClass}>拠点番号</label>
              <input type="text" value={branchNo} readOnly className={inputClass + " bg-gray-50 text-gray-500"} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-[16px]">
            <div>
              <label className={labelClass}>店舗名（日）</label>
              <input type="text" value={shopNameJa} onChange={(e) => setShopNameJa(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>店舗名（英）</label>
              <input type="text" value={shopNameEn} onChange={(e) => setShopNameEn(e.target.value)} className={inputClass} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-[16px]">
            <div>
              <label className={labelClass}>屋号（日）</label>
              <input type="text" value={tradeNameJa} onChange={(e) => setTradeNameJa(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>屋号（英）</label>
              <input type="text" value={tradeNameEn} onChange={(e) => setTradeNameEn(e.target.value)} className={inputClass} />
            </div>
          </div>

          <div>
            <label className={labelClass}>代表者名</label>
            <input type="text" value={representative} onChange={(e) => setRepresentative(e.target.value)} className={inputClass + " max-w-[300px]"} />
          </div>

          <div>
            <label className={labelClass}>契約プラン</label>
            <input type="text" value={contractPlan} readOnly className={inputClass + " max-w-[300px] bg-gray-50 text-gray-500"} />
            <p className="text-xs text-gray-400 mt-[4px]">
              {contractPlan === "特定小型原付プラン"
                ? "※ 原付以下の車両のみ登録可能"
                : "※ すべての車両が登録可能"}
            </p>
          </div>
        </div>

        {/* 住所・アクセス */}
        <div className={sectionClass}>
          <h2 className={sectionTitle}>住所・アクセス</h2>

          <div className="grid grid-cols-3 gap-[16px]">
            <div>
              <label className={labelClass}>郵便番号</label>
              <input type="text" value={postalCode} onChange={(e) => setPostalCode(e.target.value)} className={inputClass} placeholder="000-0000" />
            </div>
            <div>
              <label className={labelClass}>都道府県</label>
              <select value={prefecture} onChange={(e) => setPrefecture(e.target.value)} className={inputClass}>
                <option value="">選択してください</option>
                {prefectures.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>地区 / 市区町村</label>
              <input type="text" value={district} onChange={(e) => setDistrict(e.target.value)} className={inputClass} />
            </div>
          </div>

          <div>
            <label className={labelClass}>住所</label>
            <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} className={inputClass} />
          </div>

          <div>
            <label className={labelClass}>アクセス情報</label>
            <textarea value={accessInfo} onChange={(e) => setAccessInfo(e.target.value)} className={inputClass + " min-h-[80px] resize-y"} rows={3} />
          </div>
        </div>

        {/* 連絡先 */}
        <div className={sectionClass}>
          <h2 className={sectionTitle}>連絡先</h2>

          <div className="grid grid-cols-2 gap-[16px]">
            <div>
              <label className={labelClass}>電話番号</label>
              <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>FAX番号</label>
              <input type="text" value={fax} onChange={(e) => setFax(e.target.value)} className={inputClass} />
            </div>
          </div>

          <div>
            <label className={labelClass}>メールアドレス</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass + " max-w-[400px]"} />
          </div>

          <div>
            <label className={labelClass}>連絡用メールアドレス</label>
            <div className="space-y-[8px]">
              {contactEmails.map((em, i) => (
                <div key={i} className="flex items-center gap-[8px]">
                  <input
                    type="email"
                    value={em}
                    onChange={(e) => updateContactEmail(i, e.target.value)}
                    className={inputClass + " max-w-[400px]"}
                    placeholder="email@example.com"
                  />
                  <button type="button" onClick={() => removeContactEmail(i)} className="p-[6px] text-gray-400 hover:text-red-500">
                    <X className="w-[16px] h-[16px]" />
                  </button>
                </div>
              ))}
              <button type="button" onClick={addContactEmail} className="flex items-center gap-[4px] text-sm text-accent hover:text-accent/80">
                <Plus className="w-[14px] h-[14px]" />
                追加
              </button>
            </div>
          </div>
        </div>

        {/* 予約設定 */}
        <div className={sectionClass}>
          <h2 className={sectionTitle}>予約設定</h2>

          <div>
            <label className={labelClass}>貸出し可能年齢</label>
            <div className="flex items-center gap-[8px]">
              <input type="number" value={minAge} onChange={(e) => setMinAge(Number(e.target.value))} className={inputClass + " max-w-[120px]"} />
              <span className="text-sm text-gray-500">歳以上</span>
            </div>
          </div>

          <div>
            <label className={labelClass}>2時間プラン</label>
            <div className="flex gap-[24px]">
              <label className="flex items-center gap-[6px] cursor-pointer">
                <input type="radio" name="twoHourPlan" value="yes" checked={twoHourPlan === "yes"} onChange={(e) => setTwoHourPlan(e.target.value)} className="accent-accent" />
                <span className="text-sm">利用する</span>
              </label>
              <label className="flex items-center gap-[6px] cursor-pointer">
                <input type="radio" name="twoHourPlan" value="no" checked={twoHourPlan === "no"} onChange={(e) => setTwoHourPlan(e.target.value)} className="accent-accent" />
                <span className="text-sm">しない</span>
              </label>
            </div>
          </div>

          <div>
            <label className={labelClass}>リクエスト予約</label>
            <div className="flex gap-[24px]">
              <label className="flex items-center gap-[6px] cursor-pointer">
                <input type="radio" name="requestRes" value="yes" checked={requestReservation === "yes"} onChange={(e) => setRequestReservation(e.target.value)} className="accent-accent" />
                <span className="text-sm">利用する</span>
              </label>
              <label className="flex items-center gap-[6px] cursor-pointer">
                <input type="radio" name="requestRes" value="no" checked={requestReservation === "no"} onChange={(e) => setRequestReservation(e.target.value)} className="accent-accent" />
                <span className="text-sm">しない</span>
              </label>
            </div>
          </div>

          {requestReservation === "yes" && (
            <div>
              <label className={labelClass}>リクエスト予約最終受付時間</label>
              <div className="flex items-center gap-[8px]">
                <input type="number" value={requestDeadlineHours} onChange={(e) => setRequestDeadlineHours(Number(e.target.value))} className={inputClass + " max-w-[120px]"} />
                <span className="text-sm text-gray-500">時間前</span>
              </div>
            </div>
          )}
        </div>

        {/* 営業時間・定休日 */}
        <div className={sectionClass}>
          <h2 className={sectionTitle}>営業時間・定休日</h2>

          <div>
            <label className={labelClass}>レンタル運用時間</label>
            <div className="flex items-center gap-[8px]">
              <select value={operationStartTime} onChange={(e) => setOperationStartTime(e.target.value)} className={inputClass + " max-w-[140px]"}>
                {timeSlots.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              <span className="text-sm text-gray-500">〜</span>
              <select value={operationEndTime} onChange={(e) => setOperationEndTime(e.target.value)} className={inputClass + " max-w-[140px]"}>
                {timeSlots.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className={labelClass}>営業時間</label>
            <input type="text" value={businessHours} onChange={(e) => setBusinessHours(e.target.value)} className={inputClass + " max-w-[400px]"} placeholder="8:00〜20:00" />
          </div>

          <div>
            <label className={labelClass}>定休日</label>
            <div className="flex gap-[16px]">
              {dayLabels.map((day, i) => (
                <label key={day} className="flex items-center gap-[4px] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={closedDays[i]}
                    onChange={() => {
                      const next = [...closedDays];
                      next[i] = !next[i];
                      setClosedDays(next);
                    }}
                    className="accent-accent"
                  />
                  <span className="text-sm">{day}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className={labelClass}>Web予約停止日</label>
            <div className="flex flex-wrap gap-[16px]">
              {[
                { key: "daily" as const, label: "毎日" },
                { key: "nextDay" as const, label: "翌日" },
                { key: "substituteNextDay" as const, label: "振替休日翌日" },
                { key: "bikeSettingNextDay" as const, label: "バイク設定日翌日" },
              ].map((item) => (
                <label key={item.key} className="flex items-center gap-[4px] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={webStopDays[item.key]}
                    onChange={() => setWebStopDays((prev) => ({ ...prev, [item.key]: !prev[item.key] }))}
                    className="accent-accent"
                  />
                  <span className="text-sm">{item.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* 店舗HP・駐車場 */}
        <div className={sectionClass}>
          <h2 className={sectionTitle}>店舗HP・駐車場</h2>

          <div>
            <label className={labelClass}>店舗HP URL</label>
            <input type="url" value={shopUrl} onChange={(e) => setShopUrl(e.target.value)} className={inputClass + " max-w-[500px]"} placeholder="https://" />
          </div>

          <div>
            <label className={labelClass}>駐車場</label>
            <div className="flex items-center gap-[16px]">
              <div className="flex gap-[24px]">
                <label className="flex items-center gap-[6px] cursor-pointer">
                  <input type="radio" name="parking" value="yes" checked={hasParking === "yes"} onChange={(e) => setHasParking(e.target.value)} className="accent-accent" />
                  <span className="text-sm">あり</span>
                </label>
                <label className="flex items-center gap-[6px] cursor-pointer">
                  <input type="radio" name="parking" value="no" checked={hasParking === "no"} onChange={(e) => setHasParking(e.target.value)} className="accent-accent" />
                  <span className="text-sm">なし</span>
                </label>
              </div>
              {hasParking === "yes" && (
                <div className="flex items-center gap-[8px]">
                  <input type="number" value={parkingCount} onChange={(e) => setParkingCount(e.target.value)} className={inputClass + " max-w-[100px]"} />
                  <span className="text-sm text-gray-500">台</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* JAF・保険 */}
        <div className={sectionClass}>
          <h2 className={sectionTitle}>JAF・保険</h2>

          <label className="flex items-center gap-[6px] cursor-pointer">
            <input type="checkbox" checked={jafDiscount} onChange={(e) => setJafDiscount(e.target.checked)} className="accent-accent" />
            <span className="text-sm">JAF特典割引</span>
          </label>

          <div className="grid grid-cols-2 gap-[16px]">
            <div>
              <label className={labelClass}>保険会社名</label>
              <input type="text" value={insuranceCompany} onChange={(e) => setInsuranceCompany(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>保険会社電話</label>
              <input type="text" value={insurancePhone} onChange={(e) => setInsurancePhone(e.target.value)} className={inputClass} />
            </div>
          </div>
        </div>

        {/* 店舗ご案内 */}
        <div className={sectionClass}>
          <h2 className={sectionTitle}>店舗ご案内</h2>
          <RichTextEditor value={shopGuide} onChange={setShopGuide} placeholder="店舗ご案内を入力してください..." />
        </div>

        {/* 店舗画像 */}
        <div className={sectionClass}>
          <h2 className={sectionTitle}>店舗画像</h2>
          <FileUploader accept="image/*" multiple value={shopImages} onChange={setShopImages} label="画像をアップロード" maxFiles={10} />
        </div>

        {/* YouTube動画URL */}
        <div className={sectionClass}>
          <h2 className={sectionTitle}>YouTube動画URL</h2>
          <input type="text" value={youtubeUrl} onChange={(e) => setYoutubeUrl(e.target.value)} className={inputClass + " max-w-[600px]"} placeholder="https://www.youtube.com/watch?v=..." />
        </div>

        {/* 支払い方法 */}
        <div className={sectionClass}>
          <h2 className={sectionTitle}>支払い方法</h2>
          <div className="flex gap-[24px]">
            <label className="flex items-center gap-[6px] cursor-pointer">
              <input
                type="checkbox"
                checked={paymentMethods.cash}
                onChange={() => setPaymentMethods((prev) => ({ ...prev, cash: !prev.cash }))}
                className="accent-accent"
              />
              <span className="text-sm">現金</span>
            </label>
            <label className="flex items-center gap-[6px] cursor-pointer">
              <input
                type="checkbox"
                checked={paymentMethods.credit}
                onChange={() => setPaymentMethods((prev) => ({ ...prev, credit: !prev.credit }))}
                className="accent-accent"
              />
              <span className="text-sm">クレジット</span>
            </label>
          </div>
        </div>

        {/* SNS・LINE */}
        <div className={sectionClass}>
          <h2 className={sectionTitle}>SNS・LINE</h2>

          <div>
            <label className={labelClass}>LINE ID</label>
            <input type="text" value={lineId} onChange={(e) => setLineId(e.target.value)} className={inputClass + " max-w-[400px]"} placeholder="@example" />
          </div>

          <div>
            <label className={labelClass}>Instagram URL</label>
            <input type="url" value={instagramUrl} onChange={(e) => setInstagramUrl(e.target.value)} className={inputClass + " max-w-[500px]"} placeholder="https://www.instagram.com/..." />
          </div>

          <div>
            <label className={labelClass}>Facebook URL</label>
            <input type="url" value={facebookUrl} onChange={(e) => setFacebookUrl(e.target.value)} className={inputClass + " max-w-[500px]"} placeholder="https://www.facebook.com/..." />
          </div>

          <div>
            <label className={labelClass}>Googleビジネスプロフィール URL</label>
            <input type="url" value={googleBusinessUrl} onChange={(e) => setGoogleBusinessUrl(e.target.value)} className={inputClass + " max-w-[500px]"} placeholder="https://g.page/..." />
          </div>
        </div>

        {/* ご請求等受け取りメールアドレス */}
        <div className={sectionClass}>
          <h2 className={sectionTitle}>ご請求等受け取りメールアドレス</h2>
          <div className="space-y-[8px]">
            {transferReportEmails.map((em, i) => (
              <div key={i} className="flex items-center gap-[8px]">
                <input
                  type="email"
                  value={em}
                  onChange={(e) => updateTransferEmail(i, e.target.value)}
                  className={inputClass + " max-w-[400px]"}
                  placeholder="email@example.com"
                />
                <button type="button" onClick={() => removeTransferEmail(i)} className="p-[6px] text-gray-400 hover:text-red-500">
                  <X className="w-[16px] h-[16px]" />
                </button>
              </div>
            ))}
            <button type="button" onClick={addTransferEmail} className="flex items-center gap-[4px] text-sm text-accent hover:text-accent/80">
              <Plus className="w-[14px] h-[14px]" />
              追加
            </button>
          </div>
        </div>

        {/* メタ情報 */}
        <div className={sectionClass}>
          <h2 className={sectionTitle}>メタ情報</h2>
          <div className="grid grid-cols-2 gap-[16px] text-sm">
            <div>
              <span className="text-xs text-gray-400">作成日時 / 作成者</span>
              <p className="text-gray-600 mt-[2px]">{mockData.createdAt} / {mockData.createdBy}</p>
            </div>
            <div>
              <span className="text-xs text-gray-400">更新日時 / 更新者</span>
              <p className="text-gray-600 mt-[2px]">{mockData.updatedAt} / {mockData.updatedBy}</p>
            </div>
          </div>
        </div>

        {/* フッター */}
        <div className="flex items-center justify-between pt-[16px] pb-[40px]">
          <button
            type="button"
            onClick={() => alert("店舗情報をコピーしました")}
            className="flex items-center gap-[6px] text-sm border border-gray-300 px-[16px] py-[10px] hover:bg-gray-50"
          >
            <Copy className="w-[14px] h-[14px]" />
            コピー
          </button>
          <div className="flex items-center gap-[8px]">
            <Link href="/vendor/shop" className="border border-gray-300 px-[24px] py-[10px] text-sm hover:bg-gray-50">
              戻る
            </Link>
            <button
              type="button"
              onClick={() => alert("保存しました")}
              className="bg-accent text-white px-[32px] py-[10px] text-sm hover:bg-accent/90"
            >
              登録
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

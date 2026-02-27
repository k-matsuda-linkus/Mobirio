"use client";
import { useState, useEffect } from "react";

const DAYS = ["月", "火", "水", "木", "金", "土", "日"];
const inputCls = "w-full border border-gray-200 bg-white px-[12px] py-[10px] text-sm focus:border-accent focus:outline-none";
const labelCls = "block text-xs font-medium text-gray-500 mb-[4px]";

export default function VendorSettingsPage() {
  const [notifyEmail, setNotifyEmail] = useState(true);
  const [notifyNewBooking, setNotifyNewBooking] = useState(true);
  const [notifyCancellation, setNotifyCancellation] = useState(true);
  const [shopName, setShopName] = useState("");
  const [shopPhone, setShopPhone] = useState("");
  const [shopEmail, setShopEmail] = useState("");
  const [shopPostal, setShopPostal] = useState("");
  const [shopAddress, setShopAddress] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/vendor/shop")
      .then((res) => (res.ok ? res.json() : Promise.reject("API error")))
      .then((json) => {
        const d = json.data;
        if (d) {
          if (d.name) setShopName(d.name);
          if (d.contact_phone) setShopPhone(d.contact_phone);
          if (d.contact_email) setShopEmail(d.contact_email);
          if (d.postal_code) setShopPostal(d.postal_code);
          if (d.address) setShopAddress(d.address);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-[24px]">読み込み中...</div>;

  return (
    <div>
      <h1 className="font-serif text-2xl font-light mb-[30px]">設定</h1>
      <div className="space-y-[24px]">
        <div className="bg-white border border-gray-100 p-[24px]">
          <h2 className="font-serif text-lg mb-[20px]">店舗基本情報</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-[16px]">
            <div><label className={labelCls}>店舗名</label><input className={inputCls} value={shopName} onChange={(e) => setShopName(e.target.value)} /></div>
            <div><label className={labelCls}>電話番号</label><input className={inputCls} value={shopPhone} onChange={(e) => setShopPhone(e.target.value)} /></div>
            <div><label className={labelCls}>メールアドレス</label><input className={inputCls} value={shopEmail} onChange={(e) => setShopEmail(e.target.value)} /></div>
            <div><label className={labelCls}>郵便番号</label><input className={inputCls} value={shopPostal} onChange={(e) => setShopPostal(e.target.value)} /></div>
            <div className="md:col-span-2"><label className={labelCls}>住所</label><input className={inputCls} value={shopAddress} onChange={(e) => setShopAddress(e.target.value)} /></div>
          </div>
        </div>

        <div className="bg-white border border-gray-100 p-[24px]">
          <h2 className="font-serif text-lg mb-[20px]">営業時間</h2>
          <div className="space-y-[12px]">
            {DAYS.map((day) => (
              <div key={day} className="flex items-center gap-[16px]">
                <span className="w-[30px] text-sm font-medium text-gray-600">{day}</span>
                <input type="time" className={inputCls + " max-w-[140px]"} defaultValue="09:00" />
                <span className="text-gray-400">〜</span>
                <input type="time" className={inputCls + " max-w-[140px]"} defaultValue="18:00" />
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white border border-gray-100 p-[24px]">
          <h2 className="font-serif text-lg mb-[20px]">通知設定</h2>
          <div className="space-y-[16px]">
            {[
              { label: "メール通知", checked: notifyEmail, toggle: () => setNotifyEmail(!notifyEmail) },
              { label: "新規予約通知", checked: notifyNewBooking, toggle: () => setNotifyNewBooking(!notifyNewBooking) },
              { label: "キャンセル通知", checked: notifyCancellation, toggle: () => setNotifyCancellation(!notifyCancellation) },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between">
                <span className="text-sm text-gray-700">{item.label}</span>
                <button type="button" onClick={item.toggle} className={"relative inline-flex h-[24px] w-[44px] items-center transition-colors " + (item.checked ? "bg-accent" : "bg-gray-200")}>
                  <span className={"inline-block h-[20px] w-[20px] bg-white transition-transform " + (item.checked ? "translate-x-[22px]" : "translate-x-[2px]")} />
                </button>
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={() => {
            fetch("/api/vendor/shop", {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                name: shopName,
                contact_phone: shopPhone,
                contact_email: shopEmail,
                postal_code: shopPostal,
                address: shopAddress,
              }),
            })
              .then((res) => (res.ok ? res.json() : Promise.reject("API error")))
              .then(() => alert("設定を保存しました"))
              .catch(() => alert("保存に失敗しました"));
          }}
          className="bg-black px-[32px] py-[12px] text-sm font-medium text-white hover:bg-gray-800"
        >設定を保存</button>
      </div>
    </div>
  );
}

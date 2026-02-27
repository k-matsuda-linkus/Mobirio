"use client";

import { useState, useMemo, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Plus, Trash2, ChevronDown, AlertTriangle, Banknote, CreditCard, X } from "lucide-react";
import { VendorPageHeader } from "@/components/vendor/VendorPageHeader";
import { StatusBadge } from "@/components/vendor/StatusBadge";
import { ChecklistPanel } from "@/components/vendor/ChecklistPanel";
import { PAYMENT_TYPE_LABELS } from "@/lib/mock/reservations";
import type { PaymentType } from "@/lib/mock/reservations";
import type { PaymentStatus } from "@/types/database";

/* ------------------------------------------------------------------ */
/*  Mock Data                                                          */
/* ------------------------------------------------------------------ */

const MOCK_RESERVATION = {
  id: "res-001",
  reservationNo: "R-20250701-001",
  registeredAt: "2025/07/01 09:23",
  storeName: "宮崎橘通り店",
  customerName: "田中 太郎",
  memberNo: "M-10234",
  age: 32,
  nationality: "日本",
  departureDate: "2025-07-14",
  departureTime: "10:00",
  returnDate: "2025-07-16",
  returnTime: "10:00",
  departureAge: 32,
  rentalDays: 2,
  vehicleName: "PCX160",
  registrationNo: "宮崎 あ 12-34",
  chassisNo: "JF81-1001234",
  priceClass: "Aクラス",
  displacement: "160cc",
  baseAmount: 12000,
  cdwEnabled: true,
  cdwAmount: 1100,
  couponName: "",
  couponDiscount: 0,
  gearItems: [
    { id: "g1", type: "ヘルメット", size: "L", dayOnePrice: 500, dayTwoPrice: 500, qty: 1, days: 2, subtotal: 1000 },
    { id: "g2", type: "グローブ", size: "M", dayOnePrice: 300, dayTwoPrice: 300, qty: 1, days: 2, subtotal: 600 },
  ],
  otherCharges: [
    { id: "o1", name: "ETCカード", amount: 200 },
    { id: "o2", name: "スマホホルダー", amount: 500 },
  ],
  additionalCharges: [
    { id: "a1", name: "ガソリン精算", amount: 800 },
  ],
  payments: [
    {
      id: "pay-r001-a",
      payment_type: "ec_credit" as PaymentType,
      amount: 12000,
      status: "completed" as PaymentStatus,
      refund_amount: null as number | null,
      note: "事前決済（基本料金）",
      created_at: "2025-07-01T09:30:00",
    },
    {
      id: "pay-r001-b",
      payment_type: "onsite_cash" as PaymentType,
      amount: 3400,
      status: "completed" as PaymentStatus,
      refund_amount: null as number | null,
      note: "返却時精算（CDW+ギア）",
      created_at: "2025-07-16T10:15:00",
    },
    {
      id: "pay-r001-c",
      payment_type: "onsite_credit" as PaymentType,
      amount: 1900,
      status: "pending" as PaymentStatus,
      refund_amount: null as number | null,
      note: "追加精算分",
      created_at: "2025-07-16T10:20:00",
    },
  ],
  paymentSettlement: "paid" as const,
  departureMileage: 12345,
  arrivalMileage: 0,
  confirmDate: "2025/07/02 10:00",
  confirmStore: "宮崎橘通り店",
  contractOutputCount: 1,
  contractLatestDate: "2025/07/14 09:50",
  memo: "初回利用のお客様。バイクの取り扱い説明を丁寧に行うこと。",
  customerNote: "アレルギー特になし。前回のレンタルは問題なし。",
  changeHistory: [
    { date: "2025/07/01 09:23", user: "システム", action: "予約作成" },
    { date: "2025/07/02 10:00", user: "宮崎橘通り店", action: "店舗確定" },
    { date: "2025/07/10 14:30", user: "田中 太郎", action: "ライダーズギア追加" },
  ],
  status: "confirmed",
};

const COUPON_OPTIONS = [
  { value: "", label: "選択してください", discount_type: null, discount_value: 0, max_discount: null },
  { value: "cpn-001", label: "初回10%OFFクーポン", discount_type: "percentage" as const, discount_value: 10, max_discount: 2000 },
  { value: "cpn-002", label: "夏季500円OFFクーポン", discount_type: "fixed" as const, discount_value: 500, max_discount: null },
  { value: "cpn-003", label: "リピーター1000円OFF", discount_type: "fixed" as const, discount_value: 1000, max_discount: null },
];

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function VendorReservationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const reservationId = params.id as string;

  const [reservation, setReservation] = useState(MOCK_RESERVATION);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/vendor/reservations/${reservationId}`)
      .then((r) => r.ok ? r.json() : null)
      .then((json) => {
        if (json?.data) {
          const d = json.data;
          const depDate = d.start_datetime ? d.start_datetime.slice(0, 10) : "";
          const depTime = d.start_datetime ? d.start_datetime.slice(11, 16) : "";
          const retDate = d.end_datetime ? d.end_datetime.slice(0, 10) : "";
          const retTime = d.end_datetime ? d.end_datetime.slice(11, 16) : "";

          setReservation((prev) => ({
            ...prev,
            id: d.id || reservationId,
            reservationNo: d.reservation_no || d.id || prev.reservationNo,
            registeredAt: d.created_at ? new Date(d.created_at).toLocaleString("ja-JP") : prev.registeredAt,
            storeName: d.store_name ?? "",
            customerName: d.user_name ?? "",
            memberNo: d.member_no ?? "",
            age: d.age ?? prev.age,
            nationality: d.nationality ?? prev.nationality,
            departureDate: depDate || prev.departureDate,
            departureTime: depTime || prev.departureTime,
            returnDate: retDate || prev.returnDate,
            returnTime: retTime || prev.returnTime,
            departureAge: d.departure_age ?? prev.departureAge,
            vehicleName: d.bike_name ?? "",
            registrationNo: d.registration_number ?? "",
            chassisNo: d.chassis_number ?? "",
            priceClass: d.price_class ?? prev.priceClass,
            displacement: d.displacement ?? prev.displacement,
            baseAmount: d.base_amount ?? d.total_amount ?? prev.baseAmount,
            cdwEnabled: d.cdw_enabled ?? prev.cdwEnabled,
            cdwAmount: d.cdw_amount ?? prev.cdwAmount,
            gearItems: d.gear_items ?? prev.gearItems,
            otherCharges: d.other_charges ?? prev.otherCharges,
            additionalCharges: d.additional_charges ?? prev.additionalCharges,
            payments: d.payments ?? prev.payments,
            paymentSettlement: d.payment_settlement ?? prev.paymentSettlement,
            departureMileage: d.departure_mileage ?? 0,
            arrivalMileage: d.return_mileage ?? 0,
            confirmDate: d.confirm_date ?? prev.confirmDate,
            confirmStore: d.confirm_store ?? prev.confirmStore,
            contractOutputCount: d.contract_output_count ?? prev.contractOutputCount,
            contractLatestDate: d.contract_latest_date ?? prev.contractLatestDate,
            memo: d.memo ?? "",
            customerNote: d.customer_note ?? "",
            changeHistory: d.change_history ?? prev.changeHistory,
            status: d.status || prev.status,
          }));
          if (depDate) setDepartureDate(depDate);
          if (depTime) setDepartureTime(depTime);
          if (retDate) setReturnDate(retDate);
          if (retTime) setReturnTime(retTime);
          setDepartureMileage(String(d.departure_mileage ?? 0));
          setArrivalMileage(String(d.return_mileage ?? ""));
          setMemo(d.memo ?? "");
          setCustomerNote(d.customer_note ?? "");
          if (d.other_charges) setOtherCharges(d.other_charges);
          if (d.additional_charges) setAdditionalCharges(d.additional_charges);
          if (d.payments) setPayments(d.payments);
          if (d.cdw_enabled !== undefined) setCdwEnabled(d.cdw_enabled);
        }
      })
      .catch((err) => console.error("reservation detail fetch error:", err))
      .finally(() => setLoading(false));
  }, [reservationId]);

  // Editable state
  const [departureDate, setDepartureDate] = useState(reservation.departureDate);
  const [departureTime, setDepartureTime] = useState(reservation.departureTime);
  const [returnDate, setReturnDate] = useState(reservation.returnDate);
  const [returnTime, setReturnTime] = useState(reservation.returnTime);
  const [cdwEnabled, setCdwEnabled] = useState(reservation.cdwEnabled);
  const [selectedCoupon, setSelectedCoupon] = useState(reservation.couponName);
  const [otherCharges, setOtherCharges] = useState(reservation.otherCharges);
  const [additionalCharges, setAdditionalCharges] = useState(reservation.additionalCharges);
  const [departureMileage, setDepartureMileage] = useState(String(reservation.departureMileage));
  const [arrivalMileage, setArrivalMileage] = useState(String(reservation.arrivalMileage || ""));
  const [memo, setMemo] = useState(reservation.memo);
  const [customerNote, setCustomerNote] = useState(reservation.customerNote);
  const [contractLang, setContractLang] = useState("ja");
  const [historyOpen, setHistoryOpen] = useState(false);

  // チェックリスト
  const [departureChecked, setDepartureChecked] = useState<string[]>([]);
  const [returnChecked, setReturnChecked] = useState<string[]>([]);

  const DEPARTURE_ITEMS = [
    { id: "d1", label: "免許証確認", required: true },
    { id: "d2", label: "車両外観チェック", required: true },
    { id: "d3", label: "走行距離記録", required: true },
    { id: "d4", label: "操作説明", required: false },
    { id: "d5", label: "緊急連絡先案内", required: false },
  ];

  const RETURN_ITEMS = [
    { id: "r1", label: "車両外観チェック", required: true },
    { id: "r2", label: "走行距離記録", required: true },
    { id: "r3", label: "ガソリン残量確認", required: false },
    { id: "r4", label: "忘れ物確認", required: false },
  ];

  const toggleDepartureItem = (id: string) => {
    setDepartureChecked((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleReturnItem = (id: string) => {
    setReturnChecked((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  // 決済管理
  const [payments, setPayments] = useState(reservation.payments);
  const [paymentModal, setPaymentModal] = useState<{ open: boolean; type: PaymentType }>({ open: false, type: "onsite_cash" });
  const [modalAmount, setModalAmount] = useState("");
  const [modalNote, setModalNote] = useState("");

  // Calculations
  const rentalDays = useMemo(() => {
    if (!departureDate || !returnDate) return 0;
    const d1 = new Date(departureDate);
    const d2 = new Date(returnDate);
    const diff = Math.ceil((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 0;
  }, [departureDate, returnDate]);

  const baseAmount = reservation.baseAmount;
  const cdwAmount = cdwEnabled ? reservation.cdwAmount * rentalDays : 0;
  const couponDiscount = (() => {
    const coupon = COUPON_OPTIONS.find((c) => c.value === selectedCoupon);
    if (!coupon || !coupon.discount_type) return 0;
    if (coupon.discount_type === "fixed") {
      return Math.min(coupon.discount_value, baseAmount);
    }
    const raw = Math.floor(baseAmount * coupon.discount_value / 100);
    return coupon.max_discount ? Math.min(raw, coupon.max_discount) : raw;
  })();
  const gearTotal = reservation.gearItems.reduce((sum, g) => sum + g.subtotal, 0);
  const otherTotal = otherCharges.reduce((sum, c) => sum + c.amount, 0);
  const rentalTotal = baseAmount + cdwAmount - couponDiscount + gearTotal + otherTotal;

  const additionalTotal = additionalCharges.reduce((sum, c) => sum + c.amount, 0);

  // 決済種別ごとの集計
  const completedPayments = payments.filter((p) => p.status === "completed");
  const ecCreditTotal = completedPayments.filter((p) => p.payment_type === "ec_credit").reduce((sum, p) => sum + p.amount, 0);
  const onsiteCashTotal = completedPayments.filter((p) => p.payment_type === "onsite_cash").reduce((sum, p) => sum + p.amount, 0);
  const onsiteCreditTotal = completedPayments.filter((p) => p.payment_type === "onsite_credit").reduce((sum, p) => sum + p.amount, 0);
  const refundTotal = payments.reduce((sum, p) => sum + (p.refund_amount ?? 0), 0);
  const paidTotal = ecCreditTotal + onsiteCashTotal + onsiteCreditTotal - refundTotal;
  const invoiceTotal = rentalTotal + additionalTotal;
  const remainingTotal = invoiceTotal - paidTotal;

  // 決済ステータスをStatusBadge用のキーに変換
  const payStatusToBadge = (status: string) => {
    const map: Record<string, string> = {
      pending: "pay_pending",
      completed: "pay_completed",
      failed: "pay_failed",
      refunded: "pay_refunded",
      partially_refunded: "pay_partially_refunded",
    };
    return map[status] ?? status;
  };

  // 日時フォーマット
  const formatPaymentDate = (isoDate: string) => {
    const d = new Date(isoDate);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const h = String(d.getHours()).padStart(2, "0");
    const min = String(d.getMinutes()).padStart(2, "0");
    return `${y}/${m}/${day} ${h}:${min}`;
  };

  const addOtherCharge = () => {
    setOtherCharges([...otherCharges, { id: `o-${Date.now()}`, name: "", amount: 0 }]);
  };

  const removeOtherCharge = (id: string) => {
    setOtherCharges(otherCharges.filter((c) => c.id !== id));
  };

  const updateOtherCharge = (id: string, field: "name" | "amount", value: string | number) => {
    setOtherCharges(otherCharges.map((c) => (c.id === id ? { ...c, [field]: value } : c)));
  };

  const addAdditionalCharge = () => {
    setAdditionalCharges([...additionalCharges, { id: `a-${Date.now()}`, name: "", amount: 0 }]);
  };

  const removeAdditionalCharge = (id: string) => {
    setAdditionalCharges(additionalCharges.filter((c) => c.id !== id));
  };

  const updateAdditionalCharge = (id: string, field: "name" | "amount", value: string | number) => {
    setAdditionalCharges(additionalCharges.map((c) => (c.id === id ? { ...c, [field]: value } : c)));
  };

  const openPaymentModal = (type: PaymentType) => {
    setModalAmount("");
    setModalNote("");
    setPaymentModal({ open: true, type });
  };

  const closePaymentModal = () => {
    setPaymentModal({ open: false, type: "onsite_cash" });
  };

  const confirmPaymentModal = () => {
    const amount = Number(modalAmount);
    if (!amount || amount <= 0) return;
    const now = new Date().toISOString();
    setPayments([
      ...payments,
      {
        id: `pay-${Date.now()}`,
        payment_type: paymentModal.type,
        amount,
        status: "completed" as PaymentStatus,
        refund_amount: null,
        note: modalNote || (paymentModal.type === "onsite_cash" ? "現地現金" : "現地クレカ"),
        created_at: now,
      },
    ]);
    closePaymentModal();
  };

  const inputClass =
    "border border-gray-300 px-[10px] py-[6px] text-sm w-full focus:outline-none focus:border-accent";
  const sectionTitleClass = "font-serif text-lg font-light mb-[16px] pb-[8px] border-b border-gray-200";
  const labelClass = "block text-xs text-gray-500 mb-[4px]";
  const readonlyFieldClass = "text-sm text-gray-700";

  return (
    <div>
      {/* Breadcrumbs & Header */}
      <VendorPageHeader
        title="予約詳細"
        breadcrumbs={[
          { label: "予約一覧", href: "/vendor/reservations" },
          { label: reservation.reservationNo },
        ]}
        actions={
          <button
            onClick={() => router.back()}
            className="flex items-center gap-[6px] border border-gray-300 bg-white px-[14px] py-[8px] text-sm text-gray-700 hover:bg-gray-50"
          >
            <ArrowLeft className="w-[14px] h-[14px]" />
            戻る
          </button>
        }
      />

      {/* Customer Header */}
      <div className="bg-white border border-gray-200 p-[16px] mb-[20px] flex flex-wrap items-center gap-[20px]">
        <div>
          <span className="text-xs text-gray-400">予約者名</span>
          <p className="text-lg font-medium">{reservation.customerName}</p>
        </div>
        <div>
          <span className="text-xs text-gray-400">会員番号</span>
          <p className="text-sm font-mono">{reservation.memberNo}</p>
        </div>
        <div>
          <span className="text-xs text-gray-400">年齢</span>
          <p className="text-sm">{reservation.age}歳</p>
        </div>
        <div>
          <span className="text-xs text-gray-400">国籍</span>
          <p className="text-sm">{reservation.nationality}</p>
        </div>
        <div className="ml-auto">
          <StatusBadge status={reservation.status} />
        </div>
      </div>

      {/* Two-column layout */}
      <div className="flex flex-col lg:flex-row gap-[20px]">
        {/* ======== LEFT COLUMN (main) ======== */}
        <div className="lg:w-[65%] space-y-[20px]">

          {/* Section 1: レンタル内容 */}
          <div className="bg-white border border-gray-200 p-[20px]">
            <h2 className={sectionTitleClass}>レンタル内容</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[14px] mb-[16px]">
              <div>
                <span className={labelClass}>予約番号</span>
                <p className={readonlyFieldClass}>{reservation.reservationNo}</p>
              </div>
              <div>
                <span className={labelClass}>予約登録日時</span>
                <p className={readonlyFieldClass}>{reservation.registeredAt}</p>
              </div>
              <div>
                <span className={labelClass}>予約場所</span>
                <p className={readonlyFieldClass}>{reservation.storeName}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-[14px] mb-[14px]">
              <div>
                <label className={labelClass}>出発日</label>
                <input type="date" value={departureDate} onChange={(e) => setDepartureDate(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>出発時刻</label>
                <input type="time" value={departureTime} onChange={(e) => setDepartureTime(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>返却日</label>
                <input type="date" value={returnDate} onChange={(e) => setReturnDate(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>返却時刻</label>
                <input type="time" value={returnTime} onChange={(e) => setReturnTime(e.target.value)} className={inputClass} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-[14px] mb-[16px]">
              <div>
                <span className={labelClass}>出発時年齢</span>
                <p className={readonlyFieldClass}>{reservation.departureAge}歳</p>
              </div>
              <div>
                <span className={labelClass}>レンタル日数</span>
                <p className={readonlyFieldClass}>{rentalDays}日</p>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-300 p-[12px] mb-[16px] flex items-start gap-[8px]">
              <AlertTriangle className="w-[16px] h-[16px] text-yellow-600 shrink-0 mt-[2px]" />
              <p className="text-xs text-yellow-800">
                出発日、返却日を変更した場合、基本料金、免責補償、クーポン、ライダーズギアの入力内容は初期化されます。
              </p>
            </div>

            <button className="bg-accent text-white px-[20px] py-[8px] text-sm hover:bg-accent-dark">
              変更内容の確定
            </button>
          </div>

          {/* 出発チェックリスト */}
          <ChecklistPanel
            title="出発チェックリスト"
            type="departure"
            items={DEPARTURE_ITEMS}
            checkedItems={departureChecked}
            onToggle={toggleDepartureItem}
          />

          {/* Section 2: 車両 */}
          <div className="bg-white border border-gray-200 p-[20px]">
            <h2 className={sectionTitleClass}>車両</h2>
            <div className="mb-[12px]">
              <p className="text-xl font-medium mb-[8px]">{reservation.vehicleName}</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-[12px]">
                <div>
                  <span className={labelClass}>登録番号</span>
                  <p className={readonlyFieldClass}>{reservation.registrationNo}</p>
                </div>
                <div>
                  <span className={labelClass}>車台番号</span>
                  <p className={readonlyFieldClass}>{reservation.chassisNo}</p>
                </div>
                <div>
                  <span className={labelClass}>料金クラス</span>
                  <p className={readonlyFieldClass}>{reservation.priceClass}</p>
                </div>
                <div>
                  <span className={labelClass}>排気量</span>
                  <p className={readonlyFieldClass}>{reservation.displacement}</p>
                </div>
              </div>
            </div>
            <button className="border border-gray-300 text-gray-700 px-[16px] py-[8px] text-sm hover:bg-gray-50">
              車両変更
            </button>
          </div>

          {/* Section 3: 料金 */}
          <div className="bg-white border border-gray-200 p-[20px]">
            <h2 className={sectionTitleClass}>料金</h2>

            {/* Base amount (a) */}
            <div className="flex items-center justify-between py-[10px] border-b border-gray-100">
              <span className="text-sm text-gray-600">基本料金 (a)</span>
              <span className="text-sm font-medium">&yen;{baseAmount.toLocaleString()}</span>
            </div>

            {/* CDW (b) */}
            <div className="flex items-center justify-between py-[10px] border-b border-gray-100">
              <label className="flex items-center gap-[8px] text-sm text-gray-600">
                <input
                  type="checkbox"
                  checked={cdwEnabled}
                  onChange={(e) => setCdwEnabled(e.target.checked)}
                  className="accent-accent"
                />
                免責補償 (b)
              </label>
              <span className="text-sm font-medium">&yen;{cdwAmount.toLocaleString()}</span>
            </div>

            {/* Coupon */}
            <div className="flex items-center justify-between py-[10px] border-b border-gray-100">
              <div className="flex items-center gap-[8px]">
                <span className="text-sm text-gray-600">クーポン</span>
                <select
                  value={selectedCoupon}
                  onChange={(e) => setSelectedCoupon(e.target.value)}
                  className="border border-gray-300 px-[8px] py-[4px] text-xs"
                >
                  {COUPON_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <span className="text-sm font-medium text-red-600">-&yen;{couponDiscount.toLocaleString()}</span>
            </div>

            {/* Riders Gear */}
            <div className="mt-[12px]">
              <h3 className="text-sm font-medium text-gray-700 mb-[8px]">ライダーズギア</h3>
              {reservation.gearItems.length > 0 && (
                <div className="overflow-x-auto mb-[8px]">
                  <table className="w-full text-xs border border-gray-200">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="px-[8px] py-[6px] text-left">種別</th>
                        <th className="px-[8px] py-[6px] text-left">サイズ</th>
                        <th className="px-[8px] py-[6px] text-right">1日目料金</th>
                        <th className="px-[8px] py-[6px] text-right">2日目料金</th>
                        <th className="px-[8px] py-[6px] text-right">利用数</th>
                        <th className="px-[8px] py-[6px] text-right">日数</th>
                        <th className="px-[8px] py-[6px] text-right">金額</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reservation.gearItems.map((gear) => (
                        <tr key={gear.id} className="border-b border-gray-100">
                          <td className="px-[8px] py-[6px]">{gear.type}</td>
                          <td className="px-[8px] py-[6px]">{gear.size}</td>
                          <td className="px-[8px] py-[6px] text-right">&yen;{gear.dayOnePrice.toLocaleString()}</td>
                          <td className="px-[8px] py-[6px] text-right">&yen;{gear.dayTwoPrice.toLocaleString()}</td>
                          <td className="px-[8px] py-[6px] text-right">{gear.qty}</td>
                          <td className="px-[8px] py-[6px] text-right">{gear.days}</td>
                          <td className="px-[8px] py-[6px] text-right font-medium">&yen;{gear.subtotal.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <button className="border border-gray-300 text-gray-700 px-[14px] py-[6px] text-xs hover:bg-gray-50">
                ライダーズギアの選択
              </button>
            </div>

            {/* Other charges (dynamic) */}
            <div className="mt-[16px]">
              <h3 className="text-sm font-medium text-gray-700 mb-[8px]">その他</h3>
              <div className="space-y-[8px]">
                {otherCharges.map((charge) => (
                  <div key={charge.id} className="flex items-center gap-[8px]">
                    <input
                      type="text"
                      value={charge.name}
                      onChange={(e) => updateOtherCharge(charge.id, "name", e.target.value)}
                      placeholder="項目名"
                      className="border border-gray-300 px-[8px] py-[6px] text-sm flex-1"
                    />
                    <input
                      type="number"
                      value={charge.amount}
                      onChange={(e) => updateOtherCharge(charge.id, "amount", Number(e.target.value))}
                      className="border border-gray-300 px-[8px] py-[6px] text-sm w-[120px] text-right"
                    />
                    <button
                      onClick={() => removeOtherCharge(charge.id)}
                      className="text-gray-400 hover:text-red-500 p-[4px]"
                    >
                      <Trash2 className="w-[14px] h-[14px]" />
                    </button>
                  </div>
                ))}
              </div>
              <button
                onClick={addOtherCharge}
                className="flex items-center gap-[4px] text-xs text-accent hover:underline mt-[8px]"
              >
                <Plus className="w-[12px] h-[12px]" />
                行を追加
              </button>
            </div>

            {/* Total */}
            <div className="flex items-center justify-between py-[12px] mt-[16px] border-t-2 border-gray-300">
              <span className="text-sm font-medium">合計</span>
              <span className="text-lg font-medium">&yen;{rentalTotal.toLocaleString()}</span>
            </div>

            <button className="bg-accent text-white px-[20px] py-[8px] text-sm hover:bg-accent-dark mt-[8px]">
              変更内容の確定
            </button>
          </div>

          {/* 返却チェックリスト */}
          <ChecklistPanel
            title="返却チェックリスト"
            type="return"
            items={RETURN_ITEMS}
            checkedItems={returnChecked}
            onToggle={toggleReturnItem}
          />

          {/* Section 4: 返車処理・ご精算 */}
          <div className="bg-white border border-gray-200 p-[20px]">
            {/* タイトル + 決済全体ステータス */}
            <div className="flex items-center justify-between mb-[16px] pb-[8px] border-b border-gray-200">
              <h2 className="font-serif text-lg font-light">返車処理・ご精算</h2>
              <StatusBadge status={reservation.paymentSettlement} />
            </div>

            {/* 追加精算 */}
            <h3 className="text-sm font-medium text-gray-700 mb-[8px]">追加精算</h3>
            <div className="space-y-[8px] mb-[12px]">
              {additionalCharges.map((charge) => (
                <div key={charge.id} className="flex items-center gap-[8px]">
                  <input
                    type="text"
                    value={charge.name}
                    onChange={(e) => updateAdditionalCharge(charge.id, "name", e.target.value)}
                    placeholder="項目名"
                    className="border border-gray-300 px-[8px] py-[6px] text-sm flex-1"
                  />
                  <input
                    type="number"
                    value={charge.amount}
                    onChange={(e) => updateAdditionalCharge(charge.id, "amount", Number(e.target.value))}
                    className="border border-gray-300 px-[8px] py-[6px] text-sm w-[120px] text-right"
                  />
                  <button
                    onClick={() => removeAdditionalCharge(charge.id)}
                    className="text-gray-400 hover:text-red-500 p-[4px]"
                  >
                    <Trash2 className="w-[14px] h-[14px]" />
                  </button>
                </div>
              ))}
            </div>
            <button
              onClick={addAdditionalCharge}
              className="flex items-center gap-[4px] text-xs text-accent hover:underline mb-[16px]"
            >
              <Plus className="w-[12px] h-[12px]" />
              行を追加
            </button>

            {/* 精算サマリー */}
            <div className="border border-gray-200 p-[14px] space-y-[8px] mb-[16px]">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">レンタル料金合計 (a)</span>
                <span>&yen;{rentalTotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">追加精算小計 (b)</span>
                <span>&yen;{additionalTotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm font-medium pt-[8px] border-t border-gray-200">
                <span>請求合計 (a + b)</span>
                <span>&yen;{invoiceTotal.toLocaleString()}</span>
              </div>

              {/* 決済種別ごとの内訳 */}
              <div className="pt-[8px] border-t border-gray-100 space-y-[6px]">
                {ecCreditTotal > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">EC決済 合計</span>
                    <span className="text-gray-600">&minus;&yen;{ecCreditTotal.toLocaleString()}</span>
                  </div>
                )}
                {onsiteCashTotal > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">現地現金 合計</span>
                    <span className="text-gray-600">&minus;&yen;{onsiteCashTotal.toLocaleString()}</span>
                  </div>
                )}
                {onsiteCreditTotal > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">現地クレカ 合計</span>
                    <span className="text-gray-600">&minus;&yen;{onsiteCreditTotal.toLocaleString()}</span>
                  </div>
                )}
                {refundTotal > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-red-500">返金 合計</span>
                    <span className="text-red-500">&yen;{refundTotal.toLocaleString()}</span>
                  </div>
                )}
              </div>

              <div className="flex justify-between text-sm pt-[6px]">
                <span className="text-gray-600">決済済合計 (c)</span>
                <span>&minus;&yen;{paidTotal.toLocaleString()}</span>
              </div>

              <div className="flex justify-between text-sm font-medium pt-[8px] border-t-2 border-gray-300">
                <span>残額 (a + b &minus; c)</span>
                <span className={"text-lg " + (remainingTotal <= 0 ? "text-accent" : "text-orange-600")}>
                  &yen;{remainingTotal.toLocaleString()}
                </span>
              </div>
            </div>

            {/* 決済履歴テーブル */}
            <h3 className="text-sm font-medium text-gray-700 mb-[8px]">決済履歴</h3>
            <div className="overflow-x-auto mb-[12px]">
              <table className="w-full text-xs border border-gray-200">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-[8px] py-[6px] text-left">日時</th>
                    <th className="px-[8px] py-[6px] text-left">種別</th>
                    <th className="px-[8px] py-[6px] text-left">ステータス</th>
                    <th className="px-[8px] py-[6px] text-right">金額</th>
                    <th className="px-[8px] py-[6px] text-left">備考</th>
                    <th className="px-[8px] py-[6px] text-center w-[60px]"></th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p) => (
                    <tr key={p.id} className="border-b border-gray-100">
                      <td className="px-[8px] py-[6px]">{formatPaymentDate(p.created_at)}</td>
                      <td className="px-[8px] py-[6px]">{PAYMENT_TYPE_LABELS[p.payment_type]}</td>
                      <td className="px-[8px] py-[6px]">
                        <StatusBadge status={payStatusToBadge(p.status)} />
                      </td>
                      <td className="px-[8px] py-[6px] text-right">
                        {p.refund_amount ? (
                          <div>
                            <span className="line-through text-gray-400">&yen;{p.amount.toLocaleString()}</span>
                            <span className="block text-red-500">&minus;&yen;{p.refund_amount.toLocaleString()}</span>
                          </div>
                        ) : (
                          <span>&yen;{p.amount.toLocaleString()}</span>
                        )}
                      </td>
                      <td className="px-[8px] py-[6px] text-gray-500">{p.note ?? "-"}</td>
                      <td className="px-[8px] py-[6px] text-center">
                        {p.status === "completed" && (
                          <button
                            onClick={() => {
                              if (window.confirm(`この決済（¥${p.amount.toLocaleString()}）を取り消しますか？`)) {
                                setPayments((prev) => prev.filter((x) => x.id !== p.id));
                              }
                            }}
                            className="text-red-400 hover:text-red-600 text-[11px] hover:underline"
                          >
                            取消
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {payments.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-[8px] py-[12px] text-center text-gray-400">決済履歴はありません</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* 決済操作ボタン */}
            <div className="flex items-center gap-[8px] flex-wrap">
              <button
                onClick={() => openPaymentModal("onsite_cash")}
                className="flex items-center gap-[6px] border border-gray-300 text-gray-700 px-[14px] py-[8px] text-sm hover:bg-gray-50"
              >
                <Banknote className="w-[14px] h-[14px]" />
                現地現金を記録
              </button>
              <button
                onClick={() => openPaymentModal("onsite_credit")}
                className="flex items-center gap-[6px] border border-gray-300 text-gray-700 px-[14px] py-[8px] text-sm hover:bg-gray-50"
              >
                <CreditCard className="w-[14px] h-[14px]" />
                現地クレカを記録
              </button>
            </div>
          </div>

          {/* Section 5: 走行距離 */}
          <div className="bg-white border border-gray-200 p-[20px]">
            <h2 className={sectionTitleClass}>走行距離</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-[14px] mb-[12px]">
              <div>
                <label className={labelClass}>出発時距離 (km)</label>
                <input
                  type="number"
                  value={departureMileage}
                  onChange={(e) => setDepartureMileage(e.target.value)}
                  className={inputClass}
                />
                {(!departureMileage || departureMileage === "0") && (
                  <div className="flex items-center gap-[6px] mt-[6px] text-orange-600">
                    <AlertTriangle className="w-[14px] h-[14px]" />
                    <span className="text-xs">出発時の走行距離を入力しましたか？</span>
                  </div>
                )}
              </div>
              <div>
                <label className={labelClass}>到着時距離 (km)</label>
                <input
                  type="number"
                  value={arrivalMileage}
                  onChange={(e) => setArrivalMileage(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>
            <button className="bg-accent text-white px-[20px] py-[8px] text-sm hover:bg-accent-dark">
              返車
            </button>
          </div>

          {/* Section 6: 変更履歴 (accordion) */}
          <div className="bg-white border border-gray-200">
            <button
              onClick={() => setHistoryOpen(!historyOpen)}
              className="w-full flex items-center justify-between px-[20px] py-[14px] text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <span className="font-serif text-lg font-light">変更履歴</span>
              <ChevronDown className={"w-[16px] h-[16px] transition-transform " + (historyOpen ? "rotate-180" : "")} />
            </button>
            {historyOpen && (
              <div className="px-[20px] pb-[20px] border-t border-gray-100">
                <div className="space-y-[12px] pt-[12px]">
                  {reservation.changeHistory.map((h, i) => (
                    <div key={i} className="flex items-start gap-[12px] text-sm">
                      <span className="text-xs text-gray-400 whitespace-nowrap w-[140px] shrink-0">{h.date}</span>
                      <span className="text-xs text-gray-500 w-[100px] shrink-0">{h.user}</span>
                      <span className="text-gray-700">{h.action}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ======== RIGHT COLUMN (sidebar) ======== */}
        <div className="lg:w-[35%] space-y-[20px]">

          {/* 店舗予約確定 card */}
          <div className="bg-white border border-gray-200 p-[20px]">
            <h3 className="font-serif text-sm font-light text-gray-500 mb-[12px]">店舗予約確定</h3>
            <div className="space-y-[8px] mb-[12px]">
              <div>
                <span className={labelClass}>確定日時</span>
                <p className={readonlyFieldClass}>{reservation.confirmDate}</p>
              </div>
              <div>
                <span className={labelClass}>確定店舗</span>
                <p className={readonlyFieldClass}>{reservation.confirmStore}</p>
              </div>
            </div>
            <button className="w-full bg-accent text-white py-[10px] text-sm hover:bg-accent-dark">
              店舗予約確定
            </button>
          </div>

          {/* 貸渡契約書 card */}
          <div className="bg-white border border-gray-200 p-[20px]">
            <h3 className="font-serif text-sm font-light text-gray-500 mb-[12px]">貸渡契約書</h3>
            <div className="space-y-[8px] mb-[12px]">
              <div>
                <span className={labelClass}>出力回数</span>
                <p className={readonlyFieldClass}>{reservation.contractOutputCount}回</p>
              </div>
              <div>
                <span className={labelClass}>最新出力日時</span>
                <p className={readonlyFieldClass}>{reservation.contractLatestDate}</p>
              </div>
              <div>
                <label className={labelClass}>出力言語</label>
                <select
                  value={contractLang}
                  onChange={(e) => setContractLang(e.target.value)}
                  className={inputClass}
                >
                  <option value="ja">日本語</option>
                  <option value="en">English</option>
                  <option value="zh">中文</option>
                  <option value="ko">한국어</option>
                </select>
              </div>
            </div>
            <button className="w-full border border-gray-300 text-gray-700 py-[10px] text-sm hover:bg-gray-50">
              貸渡契約書出力
            </button>
          </div>

          {/* メモ card */}
          <div className="bg-white border border-gray-200 p-[20px]">
            <h3 className="font-serif text-sm font-light text-gray-500 mb-[12px]">メモ</h3>
            <textarea
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              rows={4}
              className="border border-gray-300 px-[10px] py-[8px] text-sm w-full focus:outline-none focus:border-accent resize-y"
            />
            <button className="w-full bg-accent text-white py-[8px] text-sm hover:bg-accent-dark mt-[8px]">
              登録
            </button>
          </div>

          {/* お客様情報 card */}
          <div className="bg-white border border-gray-200 p-[20px]">
            <h3 className="font-serif text-sm font-light text-gray-500 mb-[12px]">お客様情報</h3>
            <textarea
              value={customerNote}
              onChange={(e) => setCustomerNote(e.target.value)}
              rows={4}
              className="border border-gray-300 px-[10px] py-[8px] text-sm w-full focus:outline-none focus:border-accent resize-y"
            />
            <p className="text-xs text-gray-400 mt-[6px] mb-[8px]">※ 全ての店舗で閲覧できます</p>
            <button className="w-full bg-accent text-white py-[8px] text-sm hover:bg-accent-dark">
              登録
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-[24px] pt-[16px] border-t border-gray-200">
        <button className="border border-red-500 text-red-500 px-[20px] py-[10px] text-sm hover:bg-red-50">
          キャンセル
        </button>
        <button
          onClick={() => router.back()}
          className="border border-gray-300 text-gray-700 px-[20px] py-[10px] text-sm hover:bg-gray-50"
        >
          戻る
        </button>
      </div>

      {/* 現地決済記録モーダル */}
      {paymentModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={closePaymentModal} />
          <div className="relative bg-white border border-gray-200 w-full max-w-[420px] mx-[16px] p-[24px]">
            <button
              onClick={closePaymentModal}
              className="absolute top-[12px] right-[12px] text-gray-400 hover:text-gray-600"
            >
              <X className="w-[18px] h-[18px]" />
            </button>

            <h3 className="font-serif text-lg font-light mb-[20px] flex items-center gap-[8px]">
              {paymentModal.type === "onsite_cash" ? (
                <><Banknote className="w-[18px] h-[18px] text-gray-500" />現地現金を記録</>
              ) : (
                <><CreditCard className="w-[18px] h-[18px] text-gray-500" />現地クレカを記録</>
              )}
            </h3>

            <div className="space-y-[14px]">
              <div>
                <label className="block text-xs text-gray-500 mb-[4px]">金額（税込）</label>
                <div className="flex items-center gap-[6px]">
                  <span className="text-sm text-gray-500">&yen;</span>
                  <input
                    type="number"
                    value={modalAmount}
                    onChange={(e) => setModalAmount(e.target.value)}
                    placeholder="0"
                    min={1}
                    className="border border-gray-300 px-[10px] py-[8px] text-sm w-full focus:outline-none focus:border-accent text-right"
                    autoFocus
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-gray-500 mb-[4px]">備考</label>
                <input
                  type="text"
                  value={modalNote}
                  onChange={(e) => setModalNote(e.target.value)}
                  placeholder="例: 返却時追加精算"
                  className="border border-gray-300 px-[10px] py-[8px] text-sm w-full focus:outline-none focus:border-accent"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-[8px] mt-[20px]">
              <button
                onClick={closePaymentModal}
                className="border border-gray-300 text-gray-700 px-[16px] py-[8px] text-sm hover:bg-gray-50"
              >
                キャンセル
              </button>
              <button
                onClick={confirmPaymentModal}
                disabled={!modalAmount || Number(modalAmount) <= 0}
                className="bg-accent text-white px-[16px] py-[8px] text-sm hover:bg-accent-dark disabled:opacity-40 disabled:cursor-not-allowed"
              >
                記録する
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

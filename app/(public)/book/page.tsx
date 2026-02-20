'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { DateTimePicker } from '@/components/ui/DateTimePicker';
import { Textarea } from '@/components/ui/Textarea';
import { RENTAL_DURATIONS } from '@/lib/constants';
import {
  calculateRentalPrice,
  getCDWPriceForClass,
  getVehicleClassFromDisplacement,
  isTwoHourPlanAvailable,
} from '@/lib/booking/pricing';
import type { VehicleClass } from '@/types/database';

interface Bike {
  id: string;
  name: string;
  model: string;
  manufacturer: string;
  displacement: number | null;
  vehicle_class: VehicleClass;
  vendor_id: string;
  hourly_rate_2h: number;
  hourly_rate_4h: number;
  daily_rate_1day: number;
  daily_rate_24h: number;
  daily_rate_32h: number;
  overtime_rate_per_hour: number;
  additional_24h_rate: number;
  image_urls: string[];
}

interface Option {
  id: string;
  name: string;
  description: string;
  price_per_day: number | null;
  price_per_use: number | null;
  category: string;
}

function BookingPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const bikeId = searchParams.get('bikeId');

  const [bike, setBike] = useState<Bike | null>(null);
  const [options, setOptions] = useState<Option[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [startDatetime, setStartDatetime] = useState('');
  const [endDatetime, setEndDatetime] = useState('');
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [cdw, setCdw] = useState(false);
  const [notes, setNotes] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [couponApplied, setCouponApplied] = useState<{
    valid: boolean;
    discountAmount: number;
    couponName: string;
    couponId: string;
  } | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);

  useEffect(() => {
    if (!bikeId) {
      setLoading(false);
      return;
    }

    async function fetchBike() {
      try {
        const res = await fetch(`/api/bikes/${bikeId}`);
        const data = await res.json();
        if (data.data) {
          setBike(data.data);
          // Fetch options for this vendor
          try {
            const optRes = await fetch(`/api/options?vendorId=${data.data.vendor_id}`);
            if (optRes.ok) {
              const optData = await optRes.json();
              if (optData.data) {
                setOptions(optData.data);
              }
            }
          } catch {
            // オプション取得失敗は無視（オプションなしで続行）
          }
        }
      } catch (err) {
        setError('バイク情報の取得に失敗しました');
      } finally {
        setLoading(false);
      }
    }

    fetchBike();
  }, [bikeId]);

  const vehicleClass = bike
    ? bike.vehicle_class || getVehicleClassFromDisplacement(bike.displacement)
    : null;

  const twoHourAvailable = vehicleClass ? isTwoHourPlanAvailable(vehicleClass) : true;
  const cdwPerDay = vehicleClass ? getCDWPriceForClass(vehicleClass) : 1500;

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponError('クーポンコードを入力してください');
      return;
    }
    if (!bike) return;

    setCouponLoading(true);
    setCouponError(null);
    setCouponApplied(null);

    try {
      const price = calculatePriceRaw();
      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: couponCode.trim().toUpperCase(),
          vendorId: bike.vendor_id,
          bikeId: bike.id,
          baseAmount: price?.baseAmount ?? 0,
        }),
      });
      const data = await res.json();
      if (data.valid) {
        setCouponApplied({
          valid: true,
          discountAmount: data.discountAmount,
          couponName: data.couponName,
          couponId: data.couponId,
        });
      } else {
        setCouponError(data.reason || 'クーポンが無効です');
      }
    } catch {
      setCouponError('クーポンの検証に失敗しました');
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setCouponCode('');
    setCouponApplied(null);
    setCouponError(null);
  };

  const calculatePriceRaw = () => {
    if (!bike || !startDatetime || !endDatetime) return null;

    const start = new Date(startDatetime);
    const end = new Date(endDatetime);
    const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);

    if (hours <= 0) return null;

    const result = calculateRentalPrice(bike, hours);
    const days = Math.max(1, result.days || 1);

    let optionAmount = 0;
    for (const optId of selectedOptions) {
      const opt = options.find(o => o.id === optId);
      if (opt) {
        optionAmount += (opt.price_per_day || opt.price_per_use || 0) * (opt.price_per_day ? days : 1);
      }
    }

    const cdwAmount = cdw ? cdwPerDay * days : 0;
    const totalAmount = result.baseAmount + optionAmount + cdwAmount;

    return {
      baseAmount: result.baseAmount,
      optionAmount,
      cdwAmount,
      totalAmount,
      rentalDuration: result.rentalDuration,
      days,
      overtimeHours: result.overtimeHours,
    };
  };

  const calculatePrice = () => {
    const raw = calculatePriceRaw();
    if (!raw) return null;
    const couponDiscount = couponApplied?.discountAmount ?? 0;
    return {
      ...raw,
      couponDiscount,
      totalAmount: raw.totalAmount - couponDiscount,
    };
  };

  const handleSubmit = async () => {
    if (!bike || !startDatetime || !endDatetime) {
      setError('開始日時と終了日時を選択してください');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bikeId: bike.id,
          vendorId: bike.vendor_id,
          startDatetime,
          endDatetime,
          options: selectedOptions,
          cdw,
          notes,
          ...(couponApplied ? { couponCode: couponCode.trim().toUpperCase() } : {}),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || '予約の作成に失敗しました');
        return;
      }

      // Redirect to payment page
      router.push(`/book/${data.data.id}/pay`);
    } catch (err) {
      setError('予約の作成に失敗しました');
    } finally {
      setSubmitting(false);
    }
  };

  const price = calculatePrice();

  const getDurationLabel = (duration: string) => {
    const d = RENTAL_DURATIONS.find(rd => rd.value === duration);
    return d?.label ?? duration;
  };

  if (loading) {
    return (
      <div className="max-w-[800px] mx-auto px-[30px] py-[80px]">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 w-1/2"></div>
          <div className="h-64 bg-gray-200"></div>
        </div>
      </div>
    );
  }

  if (!bikeId || !bike) {
    return (
      <div className="max-w-[800px] mx-auto px-[30px] py-[80px] text-center">
        <h1 className="font-serif text-2xl mb-4">バイクを選択してください</h1>
        <p className="text-gray-500 mb-8">予約するバイクが指定されていません。</p>
        <Link href="/bikes" className="text-accent hover:underline">
          バイク一覧へ
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-[800px] mx-auto px-[30px] py-[80px]">
      <h1 className="font-serif font-light text-3xl mb-[40px]">予約</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 mb-6">
          {error}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-[40px]">
        {/* Bike Info */}
        <div>
          <div className="aspect-[4/3] bg-gray-100 flex items-center justify-center text-gray-400 mb-4">
            {bike.image_urls?.[0] ? (
              <img src={bike.image_urls[0]} alt={bike.name} className="w-full h-full object-cover" />
            ) : (
              'No Image'
            )}
          </div>
          <p className="text-xs text-gray-400 uppercase">{bike.manufacturer}</p>
          <h2 className="font-serif text-xl">{bike.name}</h2>
          <p className="text-sm text-gray-500">{bike.model}</p>
        </div>

        {/* Booking Form */}
        <div className="space-y-6">
          <DateTimePicker
            label="利用開始日時"
            value={startDatetime}
            onChange={setStartDatetime}
          />

          <DateTimePicker
            label="返却日時"
            value={endDatetime}
            onChange={setEndDatetime}
          />

          <div>
            <p className="text-xs text-gray-500 mb-2">レンタル期間目安</p>
            <div className="flex flex-wrap gap-2">
              {RENTAL_DURATIONS.filter((d) => {
                if (d.value === '2h' && !twoHourAvailable) return false;
                return true;
              }).map((d) => (
                <span key={d.value} className="border border-gray-200 px-3 py-1 text-xs">
                  {d.label}
                </span>
              ))}
            </div>
          </div>

          {/* Options */}
          {options.length > 0 && (
            <div>
              <p className="text-xs text-gray-500 mb-2">追加オプション</p>
              <div className="space-y-2">
                {options.map((opt) => (
                  <label key={opt.id} className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedOptions.includes(opt.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedOptions([...selectedOptions, opt.id]);
                        } else {
                          setSelectedOptions(selectedOptions.filter(id => id !== opt.id));
                        }
                      }}
                    />
                    {opt.name} - ¥{(opt.price_per_day || opt.price_per_use || 0).toLocaleString()}
                    {opt.price_per_day ? '/日' : ''}
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* CDW */}
          <div className="space-y-2">
            <p className="text-xs text-gray-500">補償オプション</p>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={cdw} onChange={(e) => setCdw(e.target.checked)} />
              CDW（車両免責補償） ¥{cdwPerDay.toLocaleString()}/日
            </label>
          </div>

          {/* Coupon */}
          <div className="space-y-2">
            <p className="text-xs text-gray-500">クーポンコード</p>
            {couponApplied ? (
              <div className="flex items-center justify-between bg-accent/5 border border-accent/20 px-[12px] py-[8px]">
                <div>
                  <p className="text-sm font-medium text-accent">{couponApplied.couponName}</p>
                  <p className="text-xs text-gray-500">-¥{couponApplied.discountAmount.toLocaleString()} 割引適用中</p>
                </div>
                <button
                  type="button"
                  onClick={handleRemoveCoupon}
                  className="text-xs text-gray-400 hover:text-red-500"
                >
                  取消
                </button>
              </div>
            ) : (
              <div className="flex gap-[8px]">
                <input
                  type="text"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  placeholder="例: WELCOME10"
                  className="border border-gray-300 px-[10px] py-[6px] text-sm flex-1 focus:outline-none focus:border-accent"
                />
                <button
                  type="button"
                  onClick={handleApplyCoupon}
                  disabled={couponLoading || !couponCode.trim()}
                  className="border border-accent text-accent px-[16px] py-[6px] text-sm hover:bg-accent/5 disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  {couponLoading ? '確認中...' : '適用'}
                </button>
              </div>
            )}
            {couponError && (
              <p className="text-xs text-red-500">{couponError}</p>
            )}
          </div>

          <Textarea
            label="備考"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="特別なリクエストがあればご記入ください"
          />

          {/* Price Summary */}
          {price && (
            <div className="border-t pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span>基本料金（{getDurationLabel(price.rentalDuration)}{price.overtimeHours > 0 ? ` + ${price.overtimeHours}h超過` : ''}）</span>
                <span>¥{price.baseAmount.toLocaleString()}</span>
              </div>
              {price.optionAmount > 0 && (
                <div className="flex justify-between text-sm">
                  <span>オプション</span>
                  <span>¥{price.optionAmount.toLocaleString()}</span>
                </div>
              )}
              {price.cdwAmount > 0 && (
                <div className="flex justify-between text-sm">
                  <span>CDW（{price.days}日分）</span>
                  <span>¥{price.cdwAmount.toLocaleString()}</span>
                </div>
              )}
              {price.couponDiscount > 0 && (
                <div className="flex justify-between text-sm text-red-600">
                  <span>クーポン割引</span>
                  <span>-¥{price.couponDiscount.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-medium pt-2 border-t">
                <span>合計</span>
                <span>¥{price.totalAmount.toLocaleString()}</span>
              </div>
            </div>
          )}

          <Button
            className="w-full"
            size="lg"
            onClick={handleSubmit}
            disabled={submitting || !startDatetime || !endDatetime}
          >
            {submitting ? '処理中...' : '決済へ進む'}
          </Button>
        </div>
      </div>
    </div>
  );
}

function BookingPageLoading() {
  return (
    <div className="max-w-[800px] mx-auto px-[30px] py-[80px]">
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 w-1/2"></div>
        <div className="h-64 bg-gray-200"></div>
      </div>
    </div>
  );
}

export default function BookingPage() {
  return (
    <Suspense fallback={<BookingPageLoading />}>
      <BookingPageContent />
    </Suspense>
  );
}

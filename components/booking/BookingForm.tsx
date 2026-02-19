'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { DateTimePicker } from '@/components/ui/DateTimePicker';
import { Textarea } from '@/components/ui/Textarea';
import { RENTAL_DURATIONS } from '@/lib/constants';

interface BookingFormProps {
  bikeId: string;
  vendorId: string;
  bikeName: string;
  dailyRate: number;
  hourlyRate2h?: number;
  hourlyRate4h?: number;
}

interface Option {
  id: string;
  name: string;
  description: string | null;
  price_per_day: number | null;
  price_per_use: number | null;
  category: string;
}

export function BookingForm({
  bikeId,
  vendorId,
  bikeName,
  dailyRate,
  hourlyRate2h = 0,
  hourlyRate4h = 0,
}: BookingFormProps) {
  const router = useRouter();

  const [startDatetime, setStartDatetime] = useState('');
  const [endDatetime, setEndDatetime] = useState('');
  const [cdw, setCdw] = useState(false);
  const [noc, setNoc] = useState(false);
  const [notes, setNotes] = useState('');
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [options, setOptions] = useState<Option[]>([]);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [availabilityError, setAvailabilityError] = useState<string | null>(null);

  // Fetch vendor options
  useEffect(() => {
    async function fetchOptions() {
      try {
        const res = await fetch(`/api/vendor/options?vendorId=${vendorId}`);
        const data = await res.json();
        if (data.data) {
          setOptions(data.data.filter((o: Option) => o.category !== 'insurance'));
        }
      } catch {
        // Options are optional, so we can silently fail
      }
    }

    if (vendorId) {
      fetchOptions();
    }
  }, [vendorId]);

  // Check availability when dates change
  useEffect(() => {
    if (!startDatetime || !endDatetime) {
      setAvailabilityError(null);
      return;
    }

    const checkAvailability = async () => {
      setCheckingAvailability(true);
      setAvailabilityError(null);

      try {
        const res = await fetch(
          `/api/bikes/${bikeId}/availability?checkStart=${encodeURIComponent(startDatetime)}&checkEnd=${encodeURIComponent(endDatetime)}`
        );
        const data = await res.json();

        if (!data.available) {
          setAvailabilityError(data.reason || '指定期間は予約できません');
        }
      } catch {
        // Availability check failed, but we'll catch it on submit
      } finally {
        setCheckingAvailability(false);
      }
    };

    const debounce = setTimeout(checkAvailability, 500);
    return () => clearTimeout(debounce);
  }, [bikeId, startDatetime, endDatetime]);

  const calculatePrice = () => {
    if (!startDatetime || !endDatetime) {
      return {
        basePrice: dailyRate,
        optionPrice: 0,
        cdwPrice: 0,
        nocPrice: 0,
        total: dailyRate,
        days: 1,
      };
    }

    const start = new Date(startDatetime);
    const end = new Date(endDatetime);
    const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    const days = Math.max(1, Math.ceil(hours / 24));

    let basePrice = dailyRate;
    if (hours <= 2 && hourlyRate2h > 0) {
      basePrice = hourlyRate2h;
    } else if (hours <= 4 && hourlyRate4h > 0) {
      basePrice = hourlyRate4h;
    } else if (hours > 24) {
      basePrice = dailyRate * days;
    }

    let optionPrice = 0;
    for (const optId of selectedOptions) {
      const opt = options.find((o) => o.id === optId);
      if (opt) {
        optionPrice += (opt.price_per_day || opt.price_per_use || 0) * (opt.price_per_day ? days : 1);
      }
    }

    const cdwPrice = cdw ? 1100 * days : 0;
    const nocPrice = noc ? 550 * days : 0;
    const total = basePrice + optionPrice + cdwPrice + nocPrice;

    return { basePrice, optionPrice, cdwPrice, nocPrice, total, days };
  };

  const handleSubmit = async () => {
    if (!startDatetime || !endDatetime) {
      setError('開始日時と終了日時を選択してください');
      return;
    }

    if (availabilityError) {
      setError(availabilityError);
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bikeId,
          vendorId,
          startDatetime,
          endDatetime,
          options: selectedOptions,
          cdw,
          noc,
          notes,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.errors) {
          setError(Object.values(data.errors).join(', '));
        } else {
          setError(data.message || '予約の作成に失敗しました');
        }
        return;
      }

      // Redirect to payment page
      router.push(`/book/${data.data.id}/pay`);
    } catch {
      setError('予約の作成に失敗しました');
    } finally {
      setSubmitting(false);
    }
  };

  const price = calculatePrice();

  return (
    <div className="border border-gray-100 p-[30px]">
      <h3 className="font-serif font-light text-xl mb-[24px]">予約フォーム</h3>
      <p className="text-sm text-gray-500 mb-[20px]">{bikeName}</p>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm mb-4">
          {error}
        </div>
      )}

      <div className="space-y-[20px]">
        <DateTimePicker
          label="利用開始"
          value={startDatetime}
          onChange={setStartDatetime}
        />
        <DateTimePicker
          label="返却日時"
          value={endDatetime}
          onChange={setEndDatetime}
        />

        {availabilityError && (
          <p className="text-sm text-red-600">{availabilityError}</p>
        )}

        {checkingAvailability && (
          <p className="text-sm text-gray-500">空き状況を確認中...</p>
        )}

        <div>
          <p className="text-xs text-gray-500 mb-[8px]">レンタル期間</p>
          <div className="flex flex-wrap gap-[8px]">
            {RENTAL_DURATIONS.slice(0, 6).map((d) => (
              <span
                key={d.value}
                className="border border-gray-200 px-[12px] py-[6px] text-xs"
              >
                {d.label}
              </span>
            ))}
          </div>
        </div>

        {/* Options */}
        {options.length > 0 && (
          <div className="space-y-[10px]">
            <p className="text-xs text-gray-500">追加オプション</p>
            {options.map((opt) => (
              <label
                key={opt.id}
                className="flex items-center gap-[8px] text-sm cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selectedOptions.includes(opt.id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedOptions([...selectedOptions, opt.id]);
                    } else {
                      setSelectedOptions(selectedOptions.filter((id) => id !== opt.id));
                    }
                  }}
                />
                {opt.name} ¥{(opt.price_per_day || opt.price_per_use || 0).toLocaleString()}
                {opt.price_per_day ? '/日' : ''}
              </label>
            ))}
          </div>
        )}

        <div className="space-y-[10px]">
          <p className="text-xs text-gray-500">補償オプション</p>
          <label className="flex items-center gap-[8px] text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={cdw}
              onChange={(e) => setCdw(e.target.checked)}
            />
            CDW（車両免責補償） ¥1,100/日
          </label>
          <label className="flex items-center gap-[8px] text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={noc}
              onChange={(e) => setNoc(e.target.checked)}
            />
            NOC（休車補償） ¥550/日
          </label>
        </div>

        <Textarea
          label="備考"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
        />

        <div className="border-t border-gray-100 pt-[20px] space-y-[8px]">
          <div className="flex justify-between text-sm">
            <span>基本料金 {price.days > 1 && `(${price.days}日)`}</span>
            <span>¥{price.basePrice.toLocaleString()}</span>
          </div>
          {price.optionPrice > 0 && (
            <div className="flex justify-between text-sm">
              <span>オプション</span>
              <span>¥{price.optionPrice.toLocaleString()}</span>
            </div>
          )}
          {price.cdwPrice > 0 && (
            <div className="flex justify-between text-sm">
              <span>CDW</span>
              <span>¥{price.cdwPrice.toLocaleString()}</span>
            </div>
          )}
          {price.nocPrice > 0 && (
            <div className="flex justify-between text-sm">
              <span>NOC</span>
              <span>¥{price.nocPrice.toLocaleString()}</span>
            </div>
          )}
          <div className="flex justify-between text-lg font-medium pt-[8px] border-t border-gray-100">
            <span>合計</span>
            <span>¥{price.total.toLocaleString()}</span>
          </div>
        </div>

        <Button
          className="w-full"
          size="lg"
          onClick={handleSubmit}
          disabled={submitting || checkingAvailability || !!availabilityError}
        >
          {submitting ? '処理中...' : '決済へ進む'}
        </Button>
      </div>
    </div>
  );
}

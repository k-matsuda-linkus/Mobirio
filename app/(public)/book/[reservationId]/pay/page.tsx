'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';

interface Reservation {
  id: string;
  status: string;
  start_datetime: string;
  end_datetime: string;
  base_amount: number;
  option_amount: number;
  cdw_amount: number;
  noc_amount: number;
  total_amount: number;
  bike: {
    id: string;
    name: string;
    model: string;
    manufacturer: string;
  };
  vendor: {
    id: string;
    name: string;
    address: string;
  };
}

export default function PaymentPage({ params }: { params: Promise<{ reservationId: string }> }) {
  const { reservationId } = use(params);
  const router = useRouter();

  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Card form state (for demo - in production use Square Web Payments SDK)
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');

  useEffect(() => {
    async function fetchReservation() {
      try {
        const res = await fetch(`/api/reservations/${reservationId}`);
        const data = await res.json();

        if (!res.ok) {
          setError(data.message || '予約情報の取得に失敗しました');
          return;
        }

        if (data.data.status !== 'pending') {
          // Already paid or cancelled
          router.push(`/book/${reservationId}/complete`);
          return;
        }

        setReservation(data.data);
      } catch (err) {
        setError('予約情報の取得に失敗しました');
      } finally {
        setLoading(false);
      }
    }

    fetchReservation();
  }, [reservationId, router]);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handlePayment = async () => {
    if (!cardNumber || !expiry || !cvv) {
      setError('カード情報を入力してください');
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      // In production, use Square Web Payments SDK to tokenize card
      // For demo, we'll use a mock source ID
      const sourceId = 'cnon:card-nonce-ok'; // Square sandbox test nonce

      const res = await fetch('/api/square/charge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reservationId,
          sourceId,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || '決済処理に失敗しました');
        return;
      }

      // Success - redirect to complete page
      router.push(`/book/${reservationId}/complete`);
    } catch (err) {
      setError('決済処理に失敗しました');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-[600px] mx-auto px-[30px] py-[80px]">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/2"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error && !reservation) {
    return (
      <div className="max-w-[600px] mx-auto px-[30px] py-[80px] text-center">
        <h1 className="font-serif text-2xl mb-4">エラー</h1>
        <p className="text-gray-500 mb-8">{error}</p>
        <Link href="/bikes" className="text-accent hover:underline">
          バイク一覧へ戻る
        </Link>
      </div>
    );
  }

  if (!reservation) {
    return null;
  }

  return (
    <div className="max-w-[600px] mx-auto px-[30px] py-[80px]">
      <h1 className="font-serif font-light text-3xl mb-[40px]">お支払い</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {/* Reservation Summary */}
      <div className="border border-gray-100 p-6 mb-8">
        <h2 className="font-serif text-lg mb-4">予約内容</h2>

        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">車両</span>
            <span>{reservation.bike?.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">店舗</span>
            <span>{reservation.vendor?.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">開始</span>
            <span>{formatDate(reservation.start_datetime)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">終了</span>
            <span>{formatDate(reservation.end_datetime)}</span>
          </div>
        </div>

        <div className="border-t border-gray-100 mt-4 pt-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span>基本料金</span>
            <span>¥{reservation.base_amount.toLocaleString()}</span>
          </div>
          {reservation.option_amount > 0 && (
            <div className="flex justify-between text-sm">
              <span>オプション</span>
              <span>¥{reservation.option_amount.toLocaleString()}</span>
            </div>
          )}
          {reservation.cdw_amount > 0 && (
            <div className="flex justify-between text-sm">
              <span>CDW</span>
              <span>¥{reservation.cdw_amount.toLocaleString()}</span>
            </div>
          )}
          {reservation.noc_amount > 0 && (
            <div className="flex justify-between text-sm">
              <span>NOC</span>
              <span>¥{reservation.noc_amount.toLocaleString()}</span>
            </div>
          )}
          <div className="flex justify-between text-lg font-medium pt-2 border-t border-gray-100">
            <span>合計</span>
            <span>¥{reservation.total_amount.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Payment Form */}
      <div className="border border-gray-100 p-6">
        <h2 className="font-serif text-lg mb-4">カード情報</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">カード番号</label>
            <input
              type="text"
              value={cardNumber}
              onChange={(e) => setCardNumber(e.target.value)}
              placeholder="4111 1111 1111 1111"
              className="w-full border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-gray-400"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">有効期限</label>
              <input
                type="text"
                value={expiry}
                onChange={(e) => setExpiry(e.target.value)}
                placeholder="MM/YY"
                className="w-full border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-gray-400"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">セキュリティコード</label>
              <input
                type="text"
                value={cvv}
                onChange={(e) => setCvv(e.target.value)}
                placeholder="123"
                className="w-full border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-gray-400"
              />
            </div>
          </div>

          <p className="text-xs text-gray-400">
            テスト環境では任意の値を入力してください。
          </p>

          <Button
            className="w-full"
            size="lg"
            onClick={handlePayment}
            disabled={processing}
          >
            {processing ? '処理中...' : `¥${reservation.total_amount.toLocaleString()} を支払う`}
          </Button>

          <p className="text-xs text-gray-400 text-center">
            お支払いは Square により安全に処理されます
          </p>
        </div>
      </div>

      <div className="mt-8 text-center">
        <Link href={`/book?bikeId=${reservation.bike?.id}`} className="text-sm text-gray-500 hover:text-gray-700">
          予約内容を変更する
        </Link>
      </div>
    </div>
  );
}

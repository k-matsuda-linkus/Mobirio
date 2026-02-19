'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { CheckCircle, Calendar, MapPin, Clock } from 'lucide-react';

interface Reservation {
  id: string;
  status: string;
  start_datetime: string;
  end_datetime: string;
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
    contact_phone: string;
  };
}

export default function CompletePage({ params }: { params: Promise<{ reservationId: string }> }) {
  const { reservationId } = use(params);

  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchReservation() {
      try {
        const res = await fetch(`/api/reservations/${reservationId}`);
        const data = await res.json();

        if (!res.ok) {
          setError(data.message || '予約情報の取得に失敗しました');
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
  }, [reservationId]);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="max-w-[600px] mx-auto px-[30px] py-[80px]">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/2 mx-auto"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error || !reservation) {
    return (
      <div className="max-w-[600px] mx-auto px-[30px] py-[80px] text-center">
        <h1 className="font-serif text-2xl mb-4">エラー</h1>
        <p className="text-gray-500 mb-8">{error || '予約情報が見つかりません'}</p>
        <Link href="/bikes" className="text-accent hover:underline">
          バイク一覧へ戻る
        </Link>
      </div>
    );
  }

  const isConfirmed = reservation.status === 'confirmed';

  return (
    <div className="max-w-[600px] mx-auto px-[30px] py-[80px]">
      {/* Success Header */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 mb-6">
          <CheckCircle className="w-10 h-10 text-green-600" />
        </div>
        <h1 className="font-serif font-light text-3xl mb-2">
          {isConfirmed ? '予約が確定しました' : '予約を受け付けました'}
        </h1>
        <p className="text-gray-500">
          予約ID: <span className="font-mono">{reservation.id.slice(0, 8)}</span>
        </p>
      </div>

      {/* Reservation Details */}
      <div className="border border-gray-100 mb-8">
        <div className="p-6 border-b border-gray-100">
          <h2 className="font-serif text-lg mb-1">{reservation.bike?.name}</h2>
          <p className="text-sm text-gray-500">{reservation.bike?.manufacturer} {reservation.bike?.model}</p>
        </div>

        <div className="p-6 space-y-4">
          <div className="flex items-start gap-3">
            <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
            <div>
              <p className="text-sm font-medium">利用期間</p>
              <p className="text-sm text-gray-500">{formatDate(reservation.start_datetime)}</p>
              <p className="text-sm text-gray-500">〜 {formatDate(reservation.end_datetime)}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
            <div>
              <p className="text-sm font-medium">{reservation.vendor?.name}</p>
              <p className="text-sm text-gray-500">{reservation.vendor?.address}</p>
              {reservation.vendor?.contact_phone && (
                <p className="text-sm text-gray-500">TEL: {reservation.vendor.contact_phone}</p>
              )}
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Clock className="w-5 h-5 text-gray-400 mt-0.5" />
            <div>
              <p className="text-sm font-medium">お支払い金額</p>
              <p className="text-lg font-medium">¥{reservation.total_amount.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Next Steps */}
      <div className="bg-gray-50 p-6 mb-8">
        <h3 className="font-medium mb-3">ご利用当日の流れ</h3>
        <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600">
          <li>予約時間に店舗へお越しください</li>
          <li>運転免許証をご提示ください</li>
          <li>車両の状態確認後、鍵をお渡しします</li>
          <li>返却時間までにご返却ください</li>
        </ol>
      </div>

      {/* Confirmation Email Notice */}
      <p className="text-sm text-gray-500 text-center mb-8">
        予約確認メールをお送りしました。
        ご不明な点がございましたらお問い合わせください。
      </p>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Link
          href="/mypage/reservations"
          className="flex-1 bg-accent text-white text-center py-4 text-sm font-medium hover:bg-accent/90 transition-colors"
        >
          予約一覧を見る
        </Link>
        <Link
          href="/bikes"
          className="flex-1 border border-gray-200 text-center py-4 text-sm font-medium hover:bg-gray-50 transition-colors"
        >
          他のバイクを探す
        </Link>
      </div>
    </div>
  );
}

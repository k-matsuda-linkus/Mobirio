'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/Button';

declare global {
  interface Window {
    Square?: {
      payments: (appId: string, locationId: string) => Promise<Payments>;
    };
  }
}

interface Payments {
  card: () => Promise<Card>;
}

interface Card {
  attach: (elementId: string) => Promise<void>;
  tokenize: () => Promise<TokenizeResult>;
  destroy: () => Promise<void>;
}

interface TokenizeResult {
  status: 'OK' | 'ERROR';
  token?: string;
  errors?: Array<{ message: string }>;
}

interface SquarePaymentFormProps {
  amount: number;
  reservationId: string;
  onSuccess: (paymentId: string) => void;
  onError: (error: string) => void;
}

export function SquarePaymentForm({
  amount,
  reservationId,
  onSuccess,
  onError,
}: SquarePaymentFormProps) {
  const [card, setCard] = useState<Card | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initializeCard = useCallback(async () => {
    const appId = process.env.NEXT_PUBLIC_SQUARE_APPLICATION_ID;
    const locationId = process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID;

    if (!appId || !locationId) {
      setError('Square設定が見つかりません');
      setLoading(false);
      return;
    }

    // Load Square Web Payments SDK
    if (!window.Square) {
      const script = document.createElement('script');
      script.src =
        process.env.NEXT_PUBLIC_SQUARE_ENVIRONMENT === 'production'
          ? 'https://web.squarecdn.com/v1/square.js'
          : 'https://sandbox.web.squarecdn.com/v1/square.js';
      script.async = true;

      script.onload = async () => {
        if (window.Square) {
          await initializeSquare(appId, locationId);
        }
      };

      script.onerror = () => {
        setError('Square SDKの読み込みに失敗しました');
        setLoading(false);
      };

      document.body.appendChild(script);
    } else {
      await initializeSquare(appId, locationId);
    }
  }, []);

  const initializeSquare = async (appId: string, locationId: string) => {
    try {
      if (!window.Square) {
        throw new Error('Square SDK not loaded');
      }

      const payments = await window.Square.payments(appId, locationId);
      const cardInstance = await payments.card();
      await cardInstance.attach('#card-container');
      setCard(cardInstance);
      setLoading(false);
    } catch (err) {
      setError('カード入力フォームの初期化に失敗しました');
      setLoading(false);
    }
  };

  useEffect(() => {
    initializeCard();

    return () => {
      if (card) {
        card.destroy();
      }
    };
  }, [initializeCard, card]);

  const handlePayment = async () => {
    if (!card) {
      setError('カードフォームが初期化されていません');
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      const result = await card.tokenize();

      if (result.status !== 'OK' || !result.token) {
        const errorMessage = result.errors?.[0]?.message || 'カード情報の処理に失敗しました';
        setError(errorMessage);
        onError(errorMessage);
        return;
      }

      // Send token to server
      const res = await fetch('/api/square/charge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reservationId,
          sourceId: result.token,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        const errorMessage = data.message || '決済処理に失敗しました';
        setError(errorMessage);
        onError(errorMessage);
        return;
      }

      onSuccess(data.data.paymentId);
    } catch (err) {
      const errorMessage = '決済処理中にエラーが発生しました';
      setError(errorMessage);
      onError(errorMessage);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
          {error}
        </div>
      )}

      <div className="border border-gray-200 rounded p-4 min-h-[100px]">
        {loading ? (
          <div className="flex items-center justify-center h-[80px]">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-gray-300 border-t-accent"></div>
          </div>
        ) : (
          <div id="card-container"></div>
        )}
      </div>

      <Button
        className="w-full"
        size="lg"
        onClick={handlePayment}
        disabled={loading || processing || !card}
      >
        {processing ? '処理中...' : `¥${amount.toLocaleString()} を支払う`}
      </Button>

      <p className="text-xs text-gray-400 text-center">
        お支払いは Square により安全に処理されます
      </p>
    </div>
  );
}

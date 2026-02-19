'use client';

import { QRCodeSVG } from 'qrcode.react';

interface PickupQRCodeProps {
  reservationId: string;
  size?: number;
  className?: string;
}

export function PickupQRCode({ reservationId, size = 200, className = '' }: PickupQRCodeProps) {
  // Generate QR code data - URL that vendor can scan to process checkin
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://mobirio.jp';
  const qrData = `${baseUrl}/vendor/checkin/${reservationId}`;

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
        <QRCodeSVG
          value={qrData}
          size={size}
          level="M"
          includeMargin={true}
          bgColor="#ffffff"
          fgColor="#000000"
        />
      </div>
      <p className="text-xs text-gray-500 mt-3 text-center">
        店舗でこのQRコードをスキャンしてチェックインしてください
      </p>
      <p className="text-xs text-gray-400 mt-1 font-mono">
        ID: {reservationId.slice(0, 8)}
      </p>
    </div>
  );
}

export function MiniQRCode({ reservationId }: { reservationId: string }) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://mobirio.jp';
  const qrData = `${baseUrl}/vendor/checkin/${reservationId}`;

  return (
    <div className="inline-block bg-white p-2 rounded border border-gray-100">
      <QRCodeSVG
        value={qrData}
        size={80}
        level="L"
        includeMargin={false}
        bgColor="#ffffff"
        fgColor="#000000"
      />
    </div>
  );
}

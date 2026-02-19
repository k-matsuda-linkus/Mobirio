import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'Mobirio — レンタルバイクプラットフォーム',
    template: '%s | Mobirio',
  },
  description:
    '宮崎発のレンタルバイクプラットフォーム。EV から大型バイクまで、多彩な車両をかんたん予約。マルチベンダー対応で、お近くの店舗からすぐにレンタル。',
  keywords: [
    'レンタルバイク',
    'バイクレンタル',
    'Mobirio',
    '宮崎',
    'ツーリング',
    '電動キックボード',
    'EV',
  ],
  authors: [{ name: '株式会社リンクス' }],
  creator: '株式会社リンクス',
  metadataBase: new URL('https://mobirio.jp'),
  openGraph: {
    type: 'website',
    locale: 'ja_JP',
    url: 'https://mobirio.jp',
    siteName: 'Mobirio',
    title: 'Mobirio — レンタルバイクプラットフォーム',
    description:
      '宮崎発のレンタルバイクプラットフォーム。EV から大型バイクまで多彩な車両をかんたん予約。',
  },
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Mobirio',
  url: 'https://mobirio.jp',
  description:
    '宮崎発のレンタルバイクプラットフォーム。EV から大型バイクまで多彩な車両をかんたん予約。',
  publisher: {
    '@type': 'Organization',
    name: '株式会社リンクス',
    address: {
      '@type': 'PostalAddress',
      addressLocality: '宮崎市',
      addressRegion: '宮崎県',
      addressCountry: 'JP',
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@300;400;500;700&family=Noto+Serif+JP:wght@300;400;500;700&display=swap"
          rel="stylesheet"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="font-sans antialiased text-black bg-white">
        {children}
      </body>
    </html>
  );
}

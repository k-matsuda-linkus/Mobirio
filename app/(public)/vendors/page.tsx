import type { Metadata } from 'next';
import VendorsContent from "./VendorsContent";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'ショップ一覧',
  description: '全国のレンタルバイクショップを検索。エリアから探して、お近くの店舗でバイクをレンタルしましょう。',
  openGraph: {
    title: 'ショップ一覧 | Mobirio',
    description: '全国のレンタルバイクショップを検索。エリアから探してバイクをレンタル。',
    url: 'https://mobirio.jp/vendors',
  },
};

export default function VendorsPage() {
  return <VendorsContent />;
}

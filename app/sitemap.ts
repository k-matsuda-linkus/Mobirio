import type { MetadataRoute } from "next";
import { mockBikes } from "@/lib/mock/bikes";
import { mockVendors } from "@/lib/mock/vendors";

const BASE_URL = "https://mobirio.jp";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date().toISOString();

  /* --- 静的ページ --- */
  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: now, changeFrequency: "daily", priority: 1.0 },
    { url: `${BASE_URL}/bikes`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE_URL}/vendors`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE_URL}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE_URL}/faq`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE_URL}/contact`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
  ];

  /* --- バイク詳細 --- */
  const bikePages: MetadataRoute.Sitemap = mockBikes
    .filter((b) => b.is_published)
    .map((b) => ({
      url: `${BASE_URL}/bikes/${b.id}`,
      lastModified: b.updated_at || now,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));

  /* --- ベンダー詳細 --- */
  const vendorPages: MetadataRoute.Sitemap = mockVendors
    .filter((v) => v.is_active && v.is_approved)
    .map((v) => ({
      url: `${BASE_URL}/vendors/${v.slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));

  return [...staticPages, ...bikePages, ...vendorPages];
}

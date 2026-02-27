import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/vendor/", "/dashboard/", "/mypage/", "/api/", "/book/"],
      },
    ],
    sitemap: "https://mobirio.jp/sitemap.xml",
  };
}

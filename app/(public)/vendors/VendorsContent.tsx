"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Search, Loader2 } from "lucide-react";
import { REGIONS } from "@/lib/constants";
import RegionSelector from "@/components/vendor/RegionSelector";
import PrefectureChips from "@/components/vendor/PrefectureChips";
import VendorCard from "@/components/vendor/VendorCard";

type Vendor = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  prefecture: string;
  city: string;
  logo_url: string | null;
  cover_image_url: string | null;
};

type VendorsResponse = {
  vendors: Vendor[];
  total: number;
  page: number;
  limit: number;
};

function getInitialParams() {
  if (typeof window === "undefined") return { region: null, prefecture: null, keyword: "" };
  const params = new URLSearchParams(window.location.search);
  return {
    region: params.get("region"),
    prefecture: params.get("prefecture"),
    keyword: params.get("keyword") || "",
  };
}

function syncUrl(region: string | null, prefecture: string | null, keyword: string) {
  const params = new URLSearchParams();
  if (region) params.set("region", region);
  if (prefecture) params.set("prefecture", prefecture);
  if (keyword) params.set("keyword", keyword);
  const qs = params.toString();
  window.history.replaceState(null, "", qs ? `/vendors?${qs}` : "/vendors");
}

export default function VendorsContent() {
  const initial = useRef(getInitialParams());

  const [region, setRegion] = useState<string | null>(initial.current.region);
  const [prefecture, setPrefecture] = useState<string | null>(initial.current.prefecture);
  const [submittedKeyword, setSubmittedKeyword] = useState(initial.current.keyword);
  const [keyword, setKeyword] = useState(initial.current.keyword);

  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [vendorCounts, setVendorCounts] = useState<Record<string, number>>({});

  const currentPrefectures = useMemo(() => {
    if (!region) return [];
    const r = REGIONS.find((r) => r.id === region);
    return r ? r.prefectures : [];
  }, [region]);

  const handleRegionSelect = useCallback((regionId: string | null) => {
    setRegion(regionId);
    setPrefecture(null);
  }, []);

  const handlePrefectureSelect = useCallback((pref: string | null) => {
    setPrefecture(pref);
  }, []);

  const handleKeywordSubmit = useCallback(() => {
    setSubmittedKeyword(keyword.trim());
  }, [keyword]);

  // URL同期
  useEffect(() => {
    syncUrl(region, prefecture, submittedKeyword);
  }, [region, prefecture, submittedKeyword]);

  // vendors取得
  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    setLoading(true);
    setError(null);

    const params = new URLSearchParams();
    if (region) params.set("region", region);
    if (prefecture) params.set("prefecture", prefecture);
    if (submittedKeyword) params.set("keyword", submittedKeyword);

    fetch(`/api/vendors?${params.toString()}`, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error("データの取得に失敗しました");
        return res.json();
      })
      .then((data: VendorsResponse) => {
        if (cancelled) return;
        setVendors(data.vendors);
        setTotal(data.total);
        setLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        if (err instanceof DOMException && err.name === "AbortError") return;
        setError(err instanceof Error ? err.message : "データの取得に失敗しました");
        setLoading(false);
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [region, prefecture, submittedKeyword]);

  // 都道府県別件数取得
  useEffect(() => {
    if (!region) {
      setVendorCounts({});
      return;
    }
    let cancelled = false;
    const controller = new AbortController();

    const params = new URLSearchParams();
    params.set("region", region);

    fetch(`/api/vendors?${params.toString()}`, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) return;
        return res.json();
      })
      .then((data: VendorsResponse | undefined) => {
        if (cancelled || !data) return;
        const counts: Record<string, number> = {};
        data.vendors.forEach((v) => {
          counts[v.prefecture] = (counts[v.prefecture] || 0) + 1;
        });
        setVendorCounts(counts);
      })
      .catch(() => {
        // 件数取得失敗は無視
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [region]);

  return (
    <div className="py-[50px] md:py-[100px]">
      <div className="max-w-[1200px] mx-auto px-[20px] md:px-[30px] lg:px-[50px]">
        <h1 className="font-serif font-light text-[28px] md:text-[36px] mb-[24px]">
          ショップ一覧
        </h1>

        {/* 地方タブ */}
        <div className="mb-[16px]">
          <RegionSelector
            selectedRegion={region}
            onSelect={handleRegionSelect}
          />
        </div>

        {/* 都道府県チップ */}
        {region && currentPrefectures.length > 0 && (
          <div className="mb-[16px]">
            <PrefectureChips
              prefectures={currentPrefectures}
              vendorCounts={vendorCounts}
              selectedPrefecture={prefecture}
              onSelect={handlePrefectureSelect}
            />
          </div>
        )}

        {/* キーワード検索バー */}
        <div className="mb-[24px]">
          <div className="relative">
            <Search className="absolute left-[12px] top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-gray-400" />
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleKeywordSubmit();
              }}
              onBlur={handleKeywordSubmit}
              placeholder="店名・地域で検索"
              className="w-full border border-gray-300 bg-white py-[10px] pl-[40px] pr-[16px] text-[14px] text-black placeholder-gray-400 outline-none focus:border-black transition-colors"
            />
          </div>
        </div>

        {/* ローディング */}
        {loading && (
          <div className="flex items-center justify-center py-[60px]">
            <Loader2 className="h-[24px] w-[24px] animate-spin text-gray-400" />
          </div>
        )}

        {/* エラー */}
        {!loading && error && (
          <div className="py-[40px] text-center text-[14px] text-red-500">
            {error}
          </div>
        )}

        {/* 結果0件 */}
        {!loading && !error && vendors.length === 0 && (
          <div className="py-[60px] text-center">
            <p className="text-[14px] text-gray-500">
              該当するショップが見つかりませんでした
            </p>
          </div>
        )}

        {/* VendorCardグリッド */}
        {!loading && !error && vendors.length > 0 && (
          <>
            <p className="mb-[16px] text-[13px] text-gray-500">
              {total}件のショップ
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[20px]">
              {vendors.map((vendor) => (
                <VendorCard key={vendor.id} vendor={vendor} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

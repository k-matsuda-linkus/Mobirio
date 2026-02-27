"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { AdminPageLayout } from "@/components/admin/AdminPageLayout";
import { Loader2 } from "lucide-react";

interface VendorDetail {
  id: string;
  name: string;
  slug: string;
  prefecture?: string | null;
  city?: string | null;
  address?: string | null;
  contact_email?: string | null;
  contact_phone?: string | null;
  commission_rate: number;
  is_approved: boolean;
  is_active: boolean;
}

interface VendorStats {
  total_revenue: number;
  ec_amount: number;
  onsite_amount: number;
  total_reservations: number;
  completed_reservations: number;
  bikes_count: number;
}

interface BikeRow {
  id: string;
  name: string;
  manufacturer: string;
  displacement?: number | null;
  daily_rate_1day: number;
  is_available: boolean;
}

interface ReservationRow {
  id: string;
  status: string;
  total_amount: number;
  start_datetime: string;
  end_datetime: string;
  user?: { full_name?: string } | null;
  bike?: { name?: string } | null;
}

export default function AdminVendorDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [vendor, setVendor] = useState<VendorDetail | null>(null);
  const [stats, setStats] = useState<VendorStats | null>(null);
  const [bikes, setBikes] = useState<BikeRow[]>([]);
  const [reservations, setReservations] = useState<ReservationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(`/api/admin/vendors/${id}`);
        if (!res.ok) {
          setError("ベンダー情報の取得に失敗しました");
          setLoading(false);
          return;
        }
        const json = await res.json();
        if (json.data) {
          setVendor(json.data.vendor);
          setStats(json.data.stats);
          setBikes(json.data.bikes || []);
          setReservations(json.data.reservations || []);
        }
      } catch (error) {
        console.error("Vendor detail fetch error:", error);
        setError("ベンダー情報の取得に失敗しました");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id]);

  const handleAction = async (action: "approve" | "ban" | "activate") => {
    if (!vendor) return;
    setActionLoading(true);
    try {
      const res = await fetch("/api/admin/vendors", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vendorId: vendor.id, action }),
      });
      const json = await res.json();
      if (json.success) {
        // ページ再取得
        const detailRes = await fetch(`/api/admin/vendors/${id}`);
        const detailJson = await detailRes.json();
        if (detailJson.data) {
          setVendor(detailJson.data.vendor);
          setStats(detailJson.data.stats);
        }
      }
    } catch (error) {
      console.error("Vendor action error:", error);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-[80px]">
        <Loader2 className="w-[24px] h-[24px] animate-spin text-gray-400" />
        <span className="ml-[8px] text-sm text-gray-500">読み込み中...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-[80px]">
        <span className="text-sm text-red-500">{error}</span>
      </div>
    );
  }

  if (!vendor) {
    return <div className="py-[40px] text-center text-gray-500">ベンダーが見つかりません</div>;
  }

  const statusLabel = (s: string) => {
    if (s === "confirmed") return "確認済";
    if (s === "completed") return "完了";
    if (s === "pending") return "予約済";
    if (s === "in_use") return "利用中";
    if (s === "cancelled") return "キャンセル";
    return "ノーショー";
  };

  return (
    <AdminPageLayout
      title={vendor.name}
      subtitle="ベンダー詳細"
      actions={
        <div className="flex gap-[8px]">
          {!vendor.is_approved ? (
            <button
              onClick={() => handleAction("approve")}
              disabled={actionLoading}
              className="px-[20px] py-[10px] bg-accent text-white text-sm hover:opacity-90 disabled:opacity-50"
            >
              承認する
            </button>
          ) : (
            <Link href={`/dashboard/vendors`} className="px-[20px] py-[10px] border border-gray-300 text-sm hover:bg-gray-50">
              一覧に戻る
            </Link>
          )}
          <button
            onClick={() => handleAction(vendor.is_active ? "ban" : "activate")}
            disabled={actionLoading}
            className="px-[20px] py-[10px] border border-red-500 text-red-500 text-sm hover:bg-red-50 disabled:opacity-50"
          >
            {vendor.is_active ? "停止する" : "再開する"}
          </button>
        </div>
      }
    >
      {/* 統計カード */}
      {stats && (
        <div className="grid md:grid-cols-3 gap-[16px] mb-[40px]">
          {[
            { title: "月間売上", value: `¥${stats.total_revenue.toLocaleString()}` },
            { title: "予約数", value: String(stats.total_reservations) },
            { title: "完了予約", value: String(stats.completed_reservations) },
            { title: "バイク数", value: String(stats.bikes_count) },
            { title: "EC決済額", value: `¥${stats.ec_amount.toLocaleString()}` },
            { title: "現地決済額", value: `¥${stats.onsite_amount.toLocaleString()}` },
          ].map((s) => (
            <div key={s.title} className="border border-gray-100 bg-white p-[24px]">
              <p className="text-xs text-gray-400">{s.title}</p>
              <p className="text-2xl font-light mt-[4px]">{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* 基本情報 */}
      <div className="bg-white border border-gray-100 p-[24px] mb-[30px]">
        <h2 className="font-serif font-light text-lg mb-[16px]">基本情報</h2>
        <div className="space-y-[12px]">
          {[
            ["店舗名", vendor.name],
            ["エリア", `${vendor.prefecture || ""} ${vendor.city || ""}`.trim()],
            ["住所", vendor.address],
            ["メール", vendor.contact_email],
            ["電話", vendor.contact_phone],
            ["手数料率", `${(vendor.commission_rate * 100).toFixed(0)}%`],
          ].map(([label, value]) => (
            <div key={String(label)} className="flex justify-between py-[10px] border-b border-gray-50 text-sm">
              <span className="text-gray-500">{label}</span>
              <span>{String(value || "-")}</span>
            </div>
          ))}
          <div className="flex justify-between py-[10px] text-sm">
            <span className="text-gray-500">ステータス</span>
            <Badge variant={vendor.is_approved ? "confirmed" : "pending"}>
              {vendor.is_approved ? "承認済み" : "審査中"}
            </Badge>
          </div>
        </div>
      </div>

      {/* バイク一覧 */}
      <div className="bg-white border border-gray-100 p-[24px] mb-[30px]">
        <h2 className="font-serif font-light text-lg mb-[16px]">
          登録バイク ({bikes.length}台)
        </h2>
        {bikes.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-xs text-gray-400 text-left">
                  <th className="py-[10px]">車名</th>
                  <th className="py-[10px]">メーカー</th>
                  <th className="py-[10px]">排気量</th>
                  <th className="py-[10px]">日額</th>
                  <th className="py-[10px]">状態</th>
                </tr>
              </thead>
              <tbody>
                {bikes.map((bike) => (
                  <tr key={bike.id} className="border-b border-gray-50">
                    <td className="py-[10px] font-medium">{bike.name}</td>
                    <td className="py-[10px] text-gray-500">{bike.manufacturer}</td>
                    <td className="py-[10px] text-gray-500">
                      {bike.displacement ? `${bike.displacement}cc` : "EV"}
                    </td>
                    <td className="py-[10px]">¥{bike.daily_rate_1day.toLocaleString()}</td>
                    <td className="py-[10px]">
                      <Badge variant={bike.is_available ? "confirmed" : "cancelled"}>
                        {bike.is_available ? "稼働中" : "停止中"}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-gray-400">登録バイクなし</p>
        )}
      </div>

      {/* 予約一覧 */}
      <div className="bg-white border border-gray-100 p-[24px]">
        <h2 className="font-serif font-light text-lg mb-[16px]">
          予約履歴 ({reservations.length}件)
        </h2>
        {reservations.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-xs text-gray-400 text-left">
                  <th className="py-[10px]">予約ID</th>
                  <th className="py-[10px]">バイク</th>
                  <th className="py-[10px]">期間</th>
                  <th className="py-[10px]">金額</th>
                  <th className="py-[10px]">ステータス</th>
                </tr>
              </thead>
              <tbody>
                {reservations.map((res) => (
                  <tr key={res.id} className="border-b border-gray-50">
                    <td className="py-[10px]">{res.id.slice(0, 8)}</td>
                    <td className="py-[10px]">{res.bike?.name || "—"}</td>
                    <td className="py-[10px] text-gray-500">
                      {res.start_datetime.slice(0, 10)} ~ {res.end_datetime.slice(0, 10)}
                    </td>
                    <td className="py-[10px]">¥{res.total_amount.toLocaleString()}</td>
                    <td className="py-[10px]">
                      <Badge
                        variant={
                          res.status === "confirmed" || res.status === "completed"
                            ? "confirmed"
                            : res.status === "cancelled" || res.status === "no_show"
                            ? "cancelled"
                            : "pending"
                        }
                      >
                        {statusLabel(res.status)}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-gray-400">予約データなし</p>
        )}
      </div>
    </AdminPageLayout>
  );
}

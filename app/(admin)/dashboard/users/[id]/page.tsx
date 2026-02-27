"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { AdminPageLayout } from "@/components/admin/AdminPageLayout";
import { Loader2 } from "lucide-react";

interface UserDetail {
  id: string;
  full_name: string | null;
  email: string;
  phone: string | null;
  role: string;
  is_banned: boolean;
  created_at: string;
}

interface UserStats {
  total_reservations: number;
  completed_reservations: number;
  total_spent: number;
}

interface ReservationRow {
  id: string;
  status: string;
  total_amount: number;
  start_datetime: string;
  end_datetime: string;
  bike?: { name?: string } | null;
  vendor?: { name?: string } | null;
}

export default function AdminUserDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [user, setUser] = useState<UserDetail | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [reservations, setReservations] = useState<ReservationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchData = async () => {
    try {
      const res = await fetch(`/api/admin/users/${id}`);
      if (!res.ok) {
        setError("ユーザー情報の取得に失敗しました");
        setLoading(false);
        return;
      }
      const json = await res.json();
      if (json.data) {
        setUser(json.data.user);
        setStats(json.data.stats);
        setReservations(json.data.reservations || []);
      }
    } catch (error) {
      console.error("User detail fetch error:", error);
      setError("ユーザー情報の取得に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handleAction = async (action: "ban" | "unban") => {
    if (!user) return;
    setActionLoading(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, action }),
      });
      const json = await res.json();
      if (json.success) {
        await fetchData();
      }
    } catch (error) {
      console.error("User action error:", error);
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

  if (!user) {
    return <div className="py-[40px] text-center text-gray-500">ユーザーが見つかりません</div>;
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
      title={user.full_name || "ユーザー"}
      subtitle="ユーザー詳細"
      actions={
        <div className="flex gap-[8px]">
          {user.is_banned ? (
            <button
              onClick={() => handleAction("unban")}
              disabled={actionLoading}
              className="px-[20px] py-[10px] bg-accent text-white text-sm hover:opacity-90 disabled:opacity-50"
            >
              BAN解除
            </button>
          ) : (
            <button
              onClick={() => handleAction("ban")}
              disabled={actionLoading}
              className="px-[20px] py-[10px] bg-red-600 text-white text-sm hover:opacity-90 disabled:opacity-50"
            >
              BANする
            </button>
          )}
        </div>
      }
    >
      {/* 統計カード */}
      {stats && (
        <div className="grid md:grid-cols-3 gap-[16px] mb-[40px]">
          {[
            { title: "予約数", value: String(stats.total_reservations) },
            { title: "利用金額合計", value: `¥${stats.total_spent.toLocaleString()}` },
            { title: "ロール", value: user.role === "customer" ? "ユーザー" : user.role === "vendor" ? "ベンダー" : "管理者" },
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
            ["名前", user.full_name],
            ["メール", user.email],
            ["電話", user.phone],
            ["ロール", user.role],
            ["登録日", user.created_at?.slice(0, 10)],
          ].map(([label, value]) => (
            <div key={String(label)} className="flex justify-between py-[10px] border-b border-gray-50 text-sm">
              <span className="text-gray-500">{label}</span>
              <span>{String(value || "-")}</span>
            </div>
          ))}
          <div className="flex justify-between py-[10px] text-sm">
            <span className="text-gray-500">状態</span>
            <Badge variant={user.is_banned ? "cancelled" : "confirmed"}>
              {user.is_banned ? "BAN" : "有効"}
            </Badge>
          </div>
        </div>
      </div>

      {/* 予約履歴 */}
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
                  <th className="py-[10px]">ベンダー</th>
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
                    <td className="py-[10px] text-gray-500">{res.vendor?.name || "—"}</td>
                    <td className="py-[10px] text-gray-500">
                      {res.start_datetime.slice(0, 10)} ~ {res.end_datetime.slice(0, 10)}
                    </td>
                    <td className="py-[10px]">¥{res.total_amount.toLocaleString()}</td>
                    <td className="py-[10px]">
                      <Badge
                        variant={
                          res.status === "confirmed" || res.status === "completed"
                            ? "confirmed"
                            : res.status === "cancelled"
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
          <p className="text-sm text-gray-400">予約データはまだありません</p>
        )}
      </div>
    </AdminPageLayout>
  );
}

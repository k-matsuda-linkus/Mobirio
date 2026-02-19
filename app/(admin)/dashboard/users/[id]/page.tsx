import { Badge } from "@/components/ui/Badge";
import { AdminPageLayout } from "@/components/admin/AdminPageLayout";
import { mockUsers } from "@/lib/mock/users";
import { mockReservations } from "@/lib/mock/reservations";

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = mockUsers.find((u) => u.id === id) || mockUsers[0];
  const userReservations = mockReservations.filter((r) => r.user_id === user.id);
  const totalSpent = userReservations
    .filter((r) => r.status !== "cancelled")
    .reduce((sum, r) => sum + r.total_amount, 0);

  return (
    <AdminPageLayout
      title={user.full_name || "ユーザー"}
      subtitle="ユーザー詳細"
      actions={
        <div className="flex gap-[8px]">
          {user.is_banned ? (
            <button className="px-[20px] py-[10px] bg-accent text-white text-sm hover:opacity-90">
              BAN解除
            </button>
          ) : (
            <button className="px-[20px] py-[10px] bg-red-600 text-white text-sm hover:opacity-90">
              BANする
            </button>
          )}
        </div>
      }
    >
      {/* 統計カード */}
      <div className="grid md:grid-cols-3 gap-[16px] mb-[40px]">
        {[
          { title: "予約数", value: String(userReservations.length) },
          { title: "利用金額合計", value: `¥${totalSpent.toLocaleString()}` },
          { title: "ロール", value: user.role === "customer" ? "ユーザー" : user.role === "vendor" ? "ベンダー" : "管理者" },
        ].map((s) => (
          <div key={s.title} className="border border-gray-100 bg-white p-[24px]">
            <p className="text-xs text-gray-400">{s.title}</p>
            <p className="text-2xl font-light mt-[4px]">{s.value}</p>
          </div>
        ))}
      </div>

      {/* 基本情報 */}
      <div className="bg-white border border-gray-100 p-[24px] mb-[30px]">
        <h2 className="font-serif font-light text-lg mb-[16px]">基本情報</h2>
        <div className="space-y-[12px]">
          {[
            ["名前", user.full_name],
            ["メール", user.email],
            ["電話", user.phone],
            ["ロール", user.role],
            ["登録日", user.created_at],
          ].map(([label, value]) => (
            <div
              key={String(label)}
              className="flex justify-between py-[10px] border-b border-gray-50 text-sm"
            >
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
          予約履歴 ({userReservations.length}件)
        </h2>
        {userReservations.length > 0 ? (
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
                {userReservations.map((res) => (
                  <tr key={res.id} className="border-b border-gray-50">
                    <td className="py-[10px]">{res.id}</td>
                    <td className="py-[10px]">{res.bikeName}</td>
                    <td className="py-[10px] text-gray-500">{res.vendorName}</td>
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
                        {res.status === "confirmed"
                          ? "確認済"
                          : res.status === "completed"
                          ? "完了"
                          : res.status === "pending"
                          ? "予約済"
                          : res.status === "in_use"
                          ? "利用中"
                          : res.status === "cancelled"
                          ? "キャンセル"
                          : "ノーショー"}
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

import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { AdminPageLayout } from "@/components/admin/AdminPageLayout";
import { mockVendors, VENDOR_PLANS } from "@/lib/mock/vendors";
import { mockBikes } from "@/lib/mock/bikes";
import { mockReservations, PAYMENT_TYPE_LABELS } from "@/lib/mock/reservations";
import type { PaymentType } from "@/lib/mock/reservations";
import { mockPayments } from "@/lib/mock/payments";

export default async function AdminVendorDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const vendor = mockVendors.find((v) => v.id === id) || mockVendors[0];
  const vendorBikes = mockBikes.filter((b) => b.vendor_id === vendor.id);
  const vendorRes = mockReservations.filter((r) => r.vendor_id === vendor.id);
  const revenue = vendorRes
    .filter((r) => r.status !== "cancelled")
    .reduce((sum, r) => sum + r.total_amount, 0);
  const completedCount = vendorRes.filter((r) => r.status === "completed").length;
  const vendorPayments = mockPayments.filter((p) => p.vendor_id === vendor.id);
  const ecAmount = vendorPayments
    .filter((p) => p.payment_type === "ec_credit" && p.status === "completed")
    .reduce((sum, p) => sum + p.amount, 0);
  const onsiteAmount = vendorPayments
    .filter(
      (p) =>
        (p.payment_type === "onsite_cash" || p.payment_type === "onsite_credit") &&
        p.status === "completed"
    )
    .reduce((sum, p) => sum + p.amount, 0);

  const paymentBadgeStyle: Record<PaymentType, string> = {
    ec_credit: "text-blue-600 bg-blue-50",
    onsite_cash: "text-green-600 bg-green-50",
    onsite_credit: "text-purple-600 bg-purple-50",
  };

  return (
    <AdminPageLayout
      title={vendor.name}
      subtitle="ベンダー詳細"
      actions={
        <div className="flex gap-[8px]">
          {!vendor.is_approved ? (
            <button className="px-[20px] py-[10px] bg-accent text-white text-sm hover:opacity-90">
              承認する
            </button>
          ) : (
            <button className="px-[20px] py-[10px] bg-accent text-white text-sm hover:opacity-90">
              編集
            </button>
          )}
          <button className="px-[20px] py-[10px] border border-red-500 text-red-500 text-sm hover:bg-red-50">
            {vendor.is_active ? "停止する" : "再開する"}
          </button>
        </div>
      }
    >
      {/* 統計カード */}
      <div className="grid md:grid-cols-3 gap-[16px] mb-[40px]">
        {[
          { title: "月間売上", value: `¥${revenue.toLocaleString()}` },
          { title: "予約数", value: String(vendorRes.length) },
          { title: "完了予約", value: String(completedCount) },
          { title: "バイク数", value: String(vendorBikes.length) },
          { title: "EC決済額", value: `¥${ecAmount.toLocaleString()}` },
          { title: "現地決済額", value: `¥${onsiteAmount.toLocaleString()}` },
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
            ["店舗名", vendor.name],
            ["エリア", `${vendor.prefecture} ${vendor.city}`],
            ["住所", vendor.address],
            ["メール", vendor.contact_email],
            ["電話", vendor.contact_phone],
            ["契約プラン", VENDOR_PLANS[vendor.plan].label],
            ["手数料率", `${(vendor.commission_rate * 100).toFixed(0)}%`],
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
            <span className="text-gray-500">ステータス</span>
            <Badge variant={vendor.is_approved ? "confirmed" : "pending"}>
              {vendor.is_approved ? "承認済み" : "審査中"}
            </Badge>
          </div>
        </div>
      </div>

      {/* プラン・手数料設定 */}
      <div className="bg-white border border-gray-100 p-[24px] mb-[30px]">
        <h2 className="font-serif font-light text-lg mb-[16px]">プラン・手数料設定</h2>
        <div className="grid md:grid-cols-2 gap-[16px]">
          {(Object.entries(VENDOR_PLANS) as [string, { label: string; commissionRate: number }][]).map(
            ([key, plan]) => {
              const isActive = vendor.plan === key;
              return (
                <div
                  key={key}
                  className={
                    "border p-[20px] cursor-pointer transition-colors " +
                    (isActive
                      ? "border-accent bg-accent/5"
                      : "border-gray-200 hover:border-gray-400")
                  }
                >
                  <div className="flex items-center justify-between mb-[8px]">
                    <span className="text-sm font-medium">{plan.label}</span>
                    {isActive && (
                      <span className="text-xs bg-accent text-white px-[8px] py-[2px]">
                        適用中
                      </span>
                    )}
                  </div>
                  <p className="text-2xl font-light">
                    {(plan.commissionRate * 100).toFixed(0)}
                    <span className="text-sm text-gray-500 ml-[2px]">%</span>
                  </p>
                  <p className="text-xs text-gray-400 mt-[4px]">
                    売上に対するロイヤリティ率
                  </p>
                  {!isActive && (
                    <button className="mt-[12px] text-sm text-accent hover:underline">
                      このプランに変更
                    </button>
                  )}
                </div>
              );
            }
          )}
        </div>
      </div>

      {/* バイク一覧 */}
      <div className="bg-white border border-gray-100 p-[24px] mb-[30px]">
        <h2 className="font-serif font-light text-lg mb-[16px]">
          登録バイク ({vendorBikes.length}台)
        </h2>
        {vendorBikes.length > 0 ? (
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
                {vendorBikes.map((bike) => (
                  <tr key={bike.id} className="border-b border-gray-50">
                    <td className="py-[10px] font-medium">{bike.name}</td>
                    <td className="py-[10px] text-gray-500">{bike.manufacturer}</td>
                    <td className="py-[10px] text-gray-500">
                      {bike.displacement ? `${bike.displacement}cc` : "EV"}
                    </td>
                    <td className="py-[10px]">
                      ¥{bike.daily_rate_1day.toLocaleString()}
                    </td>
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
          予約履歴 ({vendorRes.length}件)
        </h2>
        {vendorRes.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-xs text-gray-400 text-left">
                  <th className="py-[10px]">予約ID</th>
                  <th className="py-[10px]">バイク</th>
                  <th className="py-[10px]">期間</th>
                  <th className="py-[10px]">金額</th>
                  <th className="py-[10px]">ステータス</th>
                  <th className="py-[10px]">決済方法</th>
                </tr>
              </thead>
              <tbody>
                {vendorRes.map((res) => (
                  <tr key={res.id} className="border-b border-gray-50">
                    <td className="py-[10px]">
                      <Link href={`/dashboard/reservations`} className="text-accent hover:underline">
                        {res.id}
                      </Link>
                    </td>
                    <td className="py-[10px]">{res.bikeName}</td>
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
                    <td className="py-[10px]">
                      <div className="flex items-center gap-[4px]">
                        {res.payment_types.map((pt) => (
                          <span
                            key={pt}
                            className={`text-xs px-[6px] py-[1px] ${paymentBadgeStyle[pt]}`}
                          >
                            {PAYMENT_TYPE_LABELS[pt]}
                          </span>
                        ))}
                      </div>
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

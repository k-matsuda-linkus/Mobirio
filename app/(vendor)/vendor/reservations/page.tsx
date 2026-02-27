"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Download, ExternalLink, List, Columns3, CalendarDays } from "lucide-react";
import { VendorPageHeader } from "@/components/vendor/VendorPageHeader";
import { VendorSearchBar } from "@/components/vendor/VendorSearchBar";
import { VendorDataTable, VendorColumn } from "@/components/vendor/VendorDataTable";
import { StatusBadge } from "@/components/vendor/StatusBadge";
import { ViewToggle } from "@/components/vendor/ViewToggle";
import { FilterChips } from "@/components/vendor/FilterChips";
import { KanbanBoard } from "@/components/vendor/KanbanBoard";
import type { KanbanItem } from "@/components/vendor/KanbanBoard";
import { EmptyState } from "@/components/vendor/EmptyState";
import { PAYMENT_TYPE_LABELS, PAYMENT_SETTLEMENT_LABELS } from "@/lib/mock/reservations";
import type { PaymentType, PaymentSettlement } from "@/lib/mock/reservations";

interface Reservation {
  id: string;
  registeredAt: string;
  reservationNo: string;
  memberNo: string;
  customerName: string;
  storeName: string;
  vehicleName: string;
  registrationNo: string;
  chassisNo: string;
  departureAt: string;
  returnAt: string;
  baseAmount: number;
  totalAmount: number;
  paymentTypes: PaymentType[];
  paymentSettlement: PaymentSettlement;
  hasGear: boolean;
  status: string;
}

export default function VendorReservationsPage() {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<"table" | "kanban">("kanban");
  const [searchNo, setSearchNo] = useState("");
  const [searchName, setSearchName] = useState("");
  const [searchStore, setSearchStore] = useState("");
  const [searchStatus, setSearchStatus] = useState("");
  const [departureDateFrom, setDepartureDateFrom] = useState("");
  const [departureDateTo, setDepartureDateTo] = useState("");
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams();
    if (searchStatus) params.set("status", searchStatus);
    if (departureDateFrom) params.set("startDate", departureDateFrom);
    if (departureDateTo) params.set("endDate", departureDateTo);

    fetch(`/api/vendor/reservations?${params}`)
      .then((r) => r.ok ? r.json() : null)
      .then((json) => {
        if (json?.data) {
          const rsvs = Array.isArray(json.data) ? json.data : [];
          const mapped: Reservation[] = rsvs.map((r: any) => ({
            id: r.id,
            registeredAt: r.created_at ? new Date(r.created_at).toLocaleString("ja-JP", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }).replace(/\//g, "/") : "",
            reservationNo: r.reservation_no || r.id,
            memberNo: r.member_no || r.user_id?.slice(0, 8) || "",
            customerName: r.user_name || r.customerName || "顧客",
            storeName: r.store_name || r.storeName || "",
            vehicleName: r.bike_name || r.bikeName || "",
            registrationNo: r.registration_number || "",
            chassisNo: r.chassis_number || "",
            departureAt: r.start_datetime ? new Date(r.start_datetime).toLocaleString("ja-JP", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }).replace(/\//g, "/") : "",
            returnAt: r.end_datetime ? new Date(r.end_datetime).toLocaleString("ja-JP", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }).replace(/\//g, "/") : "",
            baseAmount: r.base_amount || r.total_amount || 0,
            totalAmount: r.total_amount || 0,
            paymentTypes: r.payment_types || r.paymentTypes || [],
            paymentSettlement: r.payment_settlement || r.paymentSettlement || "unpaid",
            hasGear: r.has_gear || r.hasGear || false,
            status: r.status || "unconfirmed",
          }));
          setReservations(mapped);
        }
      })
      .catch((err) => console.error("reservations fetch error:", err))
      .finally(() => setLoading(false));
  }, [searchStatus, departureDateFrom, departureDateTo]);

  const VIEW_OPTIONS = [
    { key: "table", label: "テーブル", icon: List },
    { key: "kanban", label: "カンバン", icon: Columns3 },
  ];

  const STATUS_LABEL_MAP: Record<string, string> = {
    pending: "申請中",
    confirmed: "確定済",
    unconfirmed: "未確定",
    in_use: "利用中",
    completed: "完了",
    cancelled: "キャンセル",
    no_show: "ノーショー",
  };

  const filterChips = [
    searchNo && { key: "no", label: "予約番号", value: searchNo },
    searchName && { key: "name", label: "予約者名", value: searchName },
    searchStore && { key: "store", label: "店舗", value: searchStore },
    searchStatus && { key: "status", label: "状態", value: STATUS_LABEL_MAP[searchStatus] || searchStatus },
    departureDateFrom && { key: "dateFrom", label: "出発日From", value: departureDateFrom },
    departureDateTo && { key: "dateTo", label: "出発日To", value: departureDateTo },
  ].filter(Boolean) as { key: string; label: string; value: string }[];

  const handleRemoveFilter = (key: string) => {
    switch (key) {
      case "no": setSearchNo(""); break;
      case "name": setSearchName(""); break;
      case "store": setSearchStore(""); break;
      case "status": setSearchStatus(""); break;
      case "dateFrom": setDepartureDateFrom(""); break;
      case "dateTo": setDepartureDateTo(""); break;
    }
  };

  // クライアントサイドのテキストフィルタリング
  const filteredReservations = reservations.filter((r) => {
    if (searchNo && !r.reservationNo.toLowerCase().includes(searchNo.toLowerCase())) return false;
    if (searchName && !r.customerName.includes(searchName)) return false;
    if (searchStore && !r.storeName.includes(searchStore)) return false;
    return true;
  });

  const kanbanItems: KanbanItem[] = filteredReservations.map((r) => ({
    id: r.id,
    reservationNo: r.reservationNo,
    customerName: r.customerName,
    vehicleName: r.vehicleName,
    storeName: r.storeName,
    departureAt: r.departureAt,
    returnAt: r.returnAt,
    totalAmount: r.totalAmount,
    status: r.status,
  }));

  const columns: VendorColumn<Reservation>[] = [
    {
      key: "reservationNo",
      label: "予約登録日時 / 予約番号",
      sortable: true,
      render: (item) => (
        <div>
          <p className="text-xs text-gray-400">{item.registeredAt}</p>
          <Link
            href={`/vendor/reservations/${item.id}`}
            className="text-accent hover:underline font-mono text-xs"
          >
            {item.reservationNo}
          </Link>
        </div>
      ),
    },
    {
      key: "customerName",
      label: "会員番号 / 予約者氏名",
      sortable: true,
      render: (item) => (
        <div>
          <p className="text-xs text-gray-400">{item.memberNo}</p>
          <p className="text-sm">{item.customerName}</p>
        </div>
      ),
    },
    {
      key: "vehicleName",
      label: "店舗 / 予約車両 / 登録番号 / 車台番号",
      render: (item) => (
        <div className="space-y-[2px]">
          <p className="text-xs text-gray-400">{item.storeName}</p>
          <p className="text-sm font-medium">{item.vehicleName}</p>
          <p className="text-xs text-gray-500">{item.registrationNo}</p>
          <p className="text-xs text-gray-400">{item.chassisNo}</p>
        </div>
      ),
    },
    {
      key: "departureAt",
      label: "出発日時 / 返却日時",
      sortable: true,
      render: (item) => (
        <div className="whitespace-nowrap">
          <p className="text-sm">{item.departureAt}</p>
          <p className="text-xs text-gray-400">{item.returnAt}</p>
        </div>
      ),
    },
    {
      key: "totalAmount",
      label: "基本料金 / 合計金額",
      sortable: true,
      render: (item) => (
        <div className="text-right">
          <p className="text-xs text-gray-400">&yen;{item.baseAmount.toLocaleString()}</p>
          <p className="text-sm font-medium">&yen;{item.totalAmount.toLocaleString()}</p>
        </div>
      ),
    },
    {
      key: "paymentSettlement",
      label: "決済",
      render: (item) => (
        <div className="space-y-[4px]">
          <div className="flex gap-[4px] flex-wrap">
            {item.paymentTypes.length > 0 ? (
              item.paymentTypes.map((pt) => (
                <span key={pt} className="text-[10px] bg-gray-100 text-gray-600 px-[6px] py-[2px]">
                  {PAYMENT_TYPE_LABELS[pt]}
                </span>
              ))
            ) : (
              <span className="text-[10px] text-gray-400">-</span>
            )}
          </div>
          <StatusBadge status={item.paymentSettlement} />
        </div>
      ),
    },
    {
      key: "hasGear",
      label: "ライダーズギア",
      render: (item) => (
        <span className={item.hasGear ? "text-accent text-sm" : "text-gray-400 text-sm"}>
          {item.hasGear ? "有" : "無"}
        </span>
      ),
    },
    {
      key: "status",
      label: "状態",
      render: (item) => <StatusBadge status={item.status} />,
    },
    {
      key: "detail",
      label: "",
      render: (item) => (
        <Link
          href={`/vendor/reservations/${item.id}`}
          className="inline-flex items-center gap-[4px] text-xs text-accent hover:underline whitespace-nowrap"
        >
          詳細 <ExternalLink className="w-[12px] h-[12px]" />
        </Link>
      ),
    },
  ];

  const inputClass =
    "border border-gray-300 px-[10px] py-[6px] text-sm w-full focus:outline-none focus:border-accent";

  if (loading) return <div className="p-[24px] text-sm text-gray-500">読み込み中...</div>;

  return (
    <div>
      <VendorPageHeader
        title="予約一覧"
        breadcrumbs={[{ label: "予約一覧" }]}
        actions={
          <>
            <Link
              href="/vendor/reservations/export"
              className="flex items-center gap-[6px] border border-gray-300 bg-white px-[14px] py-[8px] text-sm text-gray-700 hover:bg-gray-50"
            >
              <Download className="w-[14px] h-[14px]" />
              CSV出力
            </Link>
{/* 予約新規作成はユーザー側フローのため非表示 */}
          </>
        }
      />

      <div className="px-[16px] py-[8px]">
        <ViewToggle
          views={VIEW_OPTIONS}
          activeView={viewMode}
          onChange={(key) => setViewMode(key as "table" | "kanban")}
        />
      </div>

      <VendorSearchBar
        defaultOpen={false}
        onSearch={() => {}}
        onReset={() => {
          setSearchNo("");
          setSearchName("");
          setSearchStore("");
          setSearchStatus("");
          setDepartureDateFrom("");
          setDepartureDateTo("");
        }}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[12px]">
          <div>
            <label className="block text-xs text-gray-500 mb-[4px]">予約番号</label>
            <input
              type="text"
              value={searchNo}
              onChange={(e) => setSearchNo(e.target.value)}
              placeholder="R-XXXXXXXX-XXX"
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-[4px]">予約者名</label>
            <input
              type="text"
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              placeholder="氏名を入力"
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-[4px]">店舗</label>
            <select
              value={searchStore}
              onChange={(e) => setSearchStore(e.target.value)}
              className={inputClass}
            >
              <option value="">すべて</option>
              <option value="宮崎橘通り店">宮崎橘通り店</option>
              <option value="宮崎空港店">宮崎空港店</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-[4px]">状態</label>
            <select
              value={searchStatus}
              onChange={(e) => setSearchStatus(e.target.value)}
              className={inputClass}
            >
              <option value="">すべて</option>
              <option value="confirmed">確定済</option>
              <option value="unconfirmed">未確定</option>
              <option value="in_use">利用中</option>
              <option value="completed">完了</option>
              <option value="cancelled">キャンセル</option>
              <option value="no_show">ノーショー</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-[4px]">出発日（From）</label>
            <input
              type="date"
              value={departureDateFrom}
              onChange={(e) => setDepartureDateFrom(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-[4px]">出発日（To）</label>
            <input
              type="date"
              value={departureDateTo}
              onChange={(e) => setDepartureDateTo(e.target.value)}
              className={inputClass}
            />
          </div>
        </div>
      </VendorSearchBar>

      <FilterChips
        chips={filterChips}
        onRemove={handleRemoveFilter}
      />

      {filteredReservations.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title="予約がありません"
          description="予約が入ると、ここに一覧が表示されます。"
        />
      ) : viewMode === "table" ? (
        <VendorDataTable<Reservation>
          columns={columns}
          data={filteredReservations}
          pageSize={10}
          getId={(item) => item.id}
          onRowClick={(item) => router.push(`/vendor/reservations/${item.id}`)}
        />
      ) : (
        <KanbanBoard items={kanbanItems} />
      )}
    </div>
  );
}

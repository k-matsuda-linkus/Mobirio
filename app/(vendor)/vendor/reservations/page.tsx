"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Download, Plus, ExternalLink, List, Columns3, CalendarDays } from "lucide-react";
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

const MOCK_RESERVATIONS: Reservation[] = [
  {
    id: "res-001",
    registeredAt: "2025/07/01 09:23",
    reservationNo: "R-20250701-001",
    memberNo: "M-10234",
    customerName: "田中 太郎",
    storeName: "宮崎橘通り店",
    vehicleName: "PCX160",
    registrationNo: "宮崎 あ 12-34",
    chassisNo: "JF81-1001234",
    departureAt: "2025/07/14 10:00",
    returnAt: "2025/07/16 10:00",
    baseAmount: 12000,
    totalAmount: 15400,
    paymentTypes: ["ec_credit", "onsite_cash"],
    paymentSettlement: "paid",
    hasGear: true,
    status: "confirmed",
  },
  {
    id: "res-002",
    registeredAt: "2025/07/02 14:10",
    reservationNo: "R-20250702-003",
    memberNo: "M-10567",
    customerName: "山田 花子",
    storeName: "宮崎空港店",
    vehicleName: "ADV150",
    registrationNo: "宮崎 い 56-78",
    chassisNo: "KF38-2005678",
    departureAt: "2025/07/15 11:00",
    returnAt: "2025/07/17 17:00",
    baseAmount: 18000,
    totalAmount: 21600,
    paymentTypes: ["ec_credit"],
    paymentSettlement: "paid",
    hasGear: false,
    status: "confirmed",
  },
  {
    id: "res-003",
    registeredAt: "2025/07/03 08:45",
    reservationNo: "R-20250703-007",
    memberNo: "M-10891",
    customerName: "佐藤 一郎",
    storeName: "宮崎橘通り店",
    vehicleName: "CB250R",
    registrationNo: "宮崎 う 90-12",
    chassisNo: "MC52-3009012",
    departureAt: "2025/07/16 09:00",
    returnAt: "2025/07/18 09:00",
    baseAmount: 22000,
    totalAmount: 26400,
    paymentTypes: ["onsite_cash"],
    paymentSettlement: "unpaid",
    hasGear: true,
    status: "unconfirmed",
  },
  {
    id: "res-004",
    registeredAt: "2025/07/04 11:30",
    reservationNo: "R-20250704-002",
    memberNo: "M-10112",
    customerName: "鈴木 次郎",
    storeName: "宮崎空港店",
    vehicleName: "Rebel 250",
    registrationNo: "宮崎 え 34-56",
    chassisNo: "MC49-4003456",
    departureAt: "2025/07/17 10:00",
    returnAt: "2025/07/19 10:00",
    baseAmount: 20000,
    totalAmount: 24000,
    paymentTypes: ["ec_credit", "onsite_credit"],
    paymentSettlement: "paid",
    hasGear: false,
    status: "in_use",
  },
  {
    id: "res-005",
    registeredAt: "2025/07/05 16:20",
    reservationNo: "R-20250705-011",
    memberNo: "M-10345",
    customerName: "高橋 美咲",
    storeName: "宮崎橘通り店",
    vehicleName: "NMAX155",
    registrationNo: "宮崎 お 78-90",
    chassisNo: "SG50-5007890",
    departureAt: "2025/07/18 13:00",
    returnAt: "2025/07/20 13:00",
    baseAmount: 14000,
    totalAmount: 17800,
    paymentTypes: ["ec_credit"],
    paymentSettlement: "paid",
    hasGear: true,
    status: "confirmed",
  },
  {
    id: "res-006",
    registeredAt: "2025/07/06 10:05",
    reservationNo: "R-20250706-004",
    memberNo: "M-10678",
    customerName: "伊藤 健太",
    storeName: "宮崎空港店",
    vehicleName: "Ninja 400",
    registrationNo: "宮崎 か 12-34",
    chassisNo: "EX400-6001234",
    departureAt: "2025/07/19 09:00",
    returnAt: "2025/07/21 17:00",
    baseAmount: 28000,
    totalAmount: 33600,
    paymentTypes: ["onsite_cash", "onsite_credit"],
    paymentSettlement: "paid",
    hasGear: true,
    status: "completed",
  },
  {
    id: "res-007",
    registeredAt: "2025/07/07 13:40",
    reservationNo: "R-20250707-008",
    memberNo: "M-10901",
    customerName: "渡辺 あゆみ",
    storeName: "宮崎橘通り店",
    vehicleName: "PCX160",
    registrationNo: "宮崎 あ 12-34",
    chassisNo: "JF81-1001234",
    departureAt: "2025/07/20 10:00",
    returnAt: "2025/07/22 10:00",
    baseAmount: 12000,
    totalAmount: 15400,
    paymentTypes: ["ec_credit"],
    paymentSettlement: "refunded",
    hasGear: false,
    status: "cancelled",
  },
  {
    id: "res-008",
    registeredAt: "2025/07/08 09:15",
    reservationNo: "R-20250708-006",
    memberNo: "M-10223",
    customerName: "中村 大輔",
    storeName: "宮崎空港店",
    vehicleName: "CB250R",
    registrationNo: "宮崎 き 56-78",
    chassisNo: "MC52-7005678",
    departureAt: "2025/07/21 11:00",
    returnAt: "2025/07/23 11:00",
    baseAmount: 22000,
    totalAmount: 26400,
    paymentTypes: ["ec_credit", "onsite_cash"],
    paymentSettlement: "paid",
    hasGear: true,
    status: "confirmed",
  },
  {
    id: "res-009",
    registeredAt: "2025/07/09 15:55",
    reservationNo: "R-20250709-009",
    memberNo: "M-10445",
    customerName: "小林 さくら",
    storeName: "宮崎橘通り店",
    vehicleName: "ADV150",
    registrationNo: "宮崎 く 90-12",
    chassisNo: "KF38-8009012",
    departureAt: "2025/07/22 14:00",
    returnAt: "2025/07/24 14:00",
    baseAmount: 18000,
    totalAmount: 21600,
    paymentTypes: [],
    paymentSettlement: "unpaid",
    hasGear: false,
    status: "no_show",
  },
  {
    id: "res-010",
    registeredAt: "2025/07/10 12:00",
    reservationNo: "R-20250710-010",
    memberNo: "M-10556",
    customerName: "加藤 翔太",
    storeName: "宮崎空港店",
    vehicleName: "Rebel 250",
    registrationNo: "宮崎 け 34-56",
    chassisNo: "MC49-9003456",
    departureAt: "2025/07/23 10:00",
    returnAt: "2025/07/25 10:00",
    baseAmount: 20000,
    totalAmount: 24000,
    paymentTypes: ["ec_credit"],
    paymentSettlement: "unpaid",
    hasGear: true,
    status: "unconfirmed",
  },
];

export default function VendorReservationsPage() {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<"table" | "kanban">("kanban");
  const [searchNo, setSearchNo] = useState("");
  const [searchName, setSearchName] = useState("");
  const [searchStore, setSearchStore] = useState("");
  const [searchStatus, setSearchStatus] = useState("");
  const [departureDateFrom, setDepartureDateFrom] = useState("");
  const [departureDateTo, setDepartureDateTo] = useState("");

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

  const kanbanItems: KanbanItem[] = MOCK_RESERVATIONS.map((r) => ({
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
            <Link
              href="/vendor/reservations/new"
              className="flex items-center gap-[6px] bg-accent text-white px-[14px] py-[8px] text-sm hover:bg-accent-dark"
            >
              <Plus className="w-[14px] h-[14px]" />
              新規
            </Link>
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

      {MOCK_RESERVATIONS.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title="予約がありません"
          description="予約が入ると、ここに一覧が表示されます。"
        />
      ) : viewMode === "table" ? (
        <VendorDataTable<Reservation>
          columns={columns}
          data={MOCK_RESERVATIONS}
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

"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, Download, Plus, GripVertical, Image as ImageIcon } from "lucide-react";
import { VendorPageHeader } from "@/components/vendor/VendorPageHeader";
import { VendorDataTable, type VendorColumn } from "@/components/vendor/VendorDataTable";
import { StoreSelector } from "@/components/vendor/StoreSelector";
import { StatusBadge } from "@/components/vendor/StatusBadge";

interface BikeRow {
  id: string;
  image: string;
  storeName: string;
  vehicleName: string;
  regNumber: string;
  chassisNumber: string;
  priceClass: string;
  displacement: string;
  attributes: string[];
  insurance: string;
  publishStatus: string;
  displayOrder: number;
}

const mockStores = [
  { id: "all", name: "全店舗" },
  { id: "s-001", name: "宮崎本店" },
  { id: "s-002", name: "鹿児島支店" },
];

const mockBikes: BikeRow[] = [
  {
    id: "1",
    image: "/images/bikes/cb400sf.jpg",
    storeName: "宮崎本店",
    vehicleName: "CB400SF",
    regNumber: "宮崎 あ 1234",
    chassisNumber: "NC39-1234567",
    priceClass: "Aクラス",
    displacement: "400cc",
    attributes: ["長期レンタル"],
    insurance: "active",
    publishStatus: "published",
    displayOrder: 1,
  },
  {
    id: "2",
    image: "/images/bikes/pcx160.jpg",
    storeName: "宮崎本店",
    vehicleName: "PCX160",
    regNumber: "宮崎 い 5678",
    chassisNumber: "KF47-2345678",
    priceClass: "Bクラス",
    displacement: "160cc",
    attributes: [],
    insurance: "active",
    publishStatus: "published",
    displayOrder: 2,
  },
  {
    id: "3",
    image: "/images/bikes/ninja400.jpg",
    storeName: "宮崎本店",
    vehicleName: "Ninja 400",
    regNumber: "宮崎 う 9012",
    chassisNumber: "EX400G-3456789",
    priceClass: "Aクラス",
    displacement: "400cc",
    attributes: ["長期レンタル"],
    insurance: "active",
    publishStatus: "published",
    displayOrder: 3,
  },
  {
    id: "4",
    image: "/images/bikes/mt09.jpg",
    storeName: "鹿児島支店",
    vehicleName: "MT-09",
    regNumber: "鹿児島 え 3456",
    chassisNumber: "RN69J-4567890",
    priceClass: "Sクラス",
    displacement: "890cc",
    attributes: [],
    insurance: "active",
    publishStatus: "unpublished",
    displayOrder: 4,
  },
  {
    id: "5",
    image: "/images/bikes/rebel250.jpg",
    storeName: "宮崎本店",
    vehicleName: "Rebel 250",
    regNumber: "宮崎 お 7890",
    chassisNumber: "MC49-5678901",
    priceClass: "Bクラス",
    displacement: "250cc",
    attributes: [],
    insurance: "active",
    publishStatus: "published",
    displayOrder: 5,
  },
  {
    id: "6",
    image: "/images/bikes/gbr350s.jpg",
    storeName: "鹿児島支店",
    vehicleName: "GB350S",
    regNumber: "鹿児島 か 1234",
    chassisNumber: "NC59-6789012",
    priceClass: "Aクラス",
    displacement: "350cc",
    attributes: ["長期レンタル"],
    insurance: "active",
    publishStatus: "published",
    displayOrder: 6,
  },
  {
    id: "7",
    image: "/images/bikes/xsr900.jpg",
    storeName: "宮崎本店",
    vehicleName: "XSR900",
    regNumber: "宮崎 き 5678",
    chassisNumber: "RN80J-7890123",
    priceClass: "Sクラス",
    displacement: "900cc",
    attributes: [],
    insurance: "active",
    publishStatus: "published",
    displayOrder: 7,
  },
  {
    id: "8",
    image: "/images/bikes/address125.jpg",
    storeName: "鹿児島支店",
    vehicleName: "アドレス125",
    regNumber: "鹿児島 く 9012",
    chassisNumber: "DT11A-8901234",
    priceClass: "Cクラス",
    displacement: "125cc",
    attributes: [],
    insurance: "active",
    publishStatus: "unpublished",
    displayOrder: 8,
  },
];

const columns: VendorColumn<BikeRow>[] = [
  {
    key: "displayOrder",
    label: "表示順",
    width: "w-[60px]",
    render: (item) => (
      <div className="flex items-center gap-[4px]">
        <GripVertical className="w-[14px] h-[14px] text-gray-300 cursor-grab" />
        <span className="text-gray-500">{item.displayOrder}</span>
      </div>
    ),
  },
  {
    key: "image",
    label: "画像",
    width: "w-[70px]",
    render: (item) => (
      <div className="w-[48px] h-[36px] bg-gray-100 flex items-center justify-center overflow-hidden">
        {item.image ? (
          <img src={item.image} alt={item.vehicleName} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden'); }} />
        ) : null}
        <ImageIcon className={`w-[16px] h-[16px] text-gray-300 ${item.image ? 'hidden' : ''}`} />
      </div>
    ),
  },
  {
    key: "storeVehicle",
    label: "店舗 / 車両名",
    sortable: true,
    render: (item) => (
      <div>
        <div className="text-xs text-gray-400">{item.storeName}</div>
        <Link
          href={`/vendor/bikes/${item.id}/edit`}
          className="font-medium text-accent hover:underline"
        >
          {item.vehicleName}
        </Link>
      </div>
    ),
  },
  {
    key: "regChassis",
    label: "登録番号 / 車台番号",
    render: (item) => (
      <div className="text-xs">
        <div>{item.regNumber}</div>
        <div className="text-gray-400">{item.chassisNumber}</div>
      </div>
    ),
  },
  {
    key: "priceDisp",
    label: "料金クラス / 排気量",
    render: (item) => (
      <div className="text-xs">
        <div>{item.priceClass}</div>
        <div className="text-gray-400">{item.displacement}</div>
      </div>
    ),
  },
  {
    key: "attributes",
    label: "車両属性設定",
    render: (item) => (
      <div className="flex flex-wrap gap-[4px]">
        {item.attributes.length > 0 ? (
          item.attributes.map((attr) => (
            <span key={attr} className="text-xs bg-blue-50 text-blue-700 px-[6px] py-[1px]">
              {attr}
            </span>
          ))
        ) : (
          <span className="text-xs text-gray-300">-</span>
        )}
      </div>
    ),
  },
  {
    key: "insurance",
    label: "任意保険",
    render: (item) => <StatusBadge status={item.insurance} />,
  },
  {
    key: "publishStatus",
    label: "公開状況",
    render: (item) => <StatusBadge status={item.publishStatus} />,
  },
  {
    key: "detail",
    label: "",
    width: "w-[70px]",
    render: (item) => (
      <Link
        href={`/vendor/bikes/${item.id}/edit`}
        className="text-xs border border-gray-300 px-[12px] py-[4px] hover:bg-gray-50 whitespace-nowrap"
      >
        詳細
      </Link>
    ),
  },
];

export default function VendorBikesListPage() {
  const [selectedStore, setSelectedStore] = useState("all");

  return (
    <div>
      <VendorPageHeader
        title="車両一覧"
        breadcrumbs={[{ label: "車両一覧" }]}
        actions={
          <>
            <StoreSelector
              stores={mockStores}
              selectedId={selectedStore}
              onChange={setSelectedStore}
            />
            <button className="flex items-center gap-[6px] border border-gray-300 px-[12px] py-[8px] text-sm hover:bg-gray-50">
              <Search className="w-[14px] h-[14px]" />
              検索
            </button>
            <button className="flex items-center gap-[6px] border border-gray-300 px-[12px] py-[8px] text-sm hover:bg-gray-50">
              <Download className="w-[14px] h-[14px]" />
              CSV出力
            </button>
            <Link
              href="/vendor/bikes/new"
              className="flex items-center gap-[6px] bg-accent text-white px-[16px] py-[8px] text-sm hover:bg-accent/90"
            >
              <Plus className="w-[14px] h-[14px]" />
              新規
            </Link>
          </>
        }
      />

      <VendorDataTable columns={columns} data={mockBikes} pageSize={20} />
    </div>
  );
}

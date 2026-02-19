import { Sidebar } from "@/components/layout/Sidebar";
import { VENDOR_NAV_ITEMS } from "@/lib/constants";

export default function VendorLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <Sidebar items={VENDOR_NAV_ITEMS} title="ベンダー管理" backHref="/" backLabel="サイトに戻る" />
      <main className="md:ml-[260px] min-h-screen p-[24px] md:p-[40px] bg-gray-50">
        {children}
      </main>
    </div>
  );
}

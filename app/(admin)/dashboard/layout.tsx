import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { ADMIN_NAV_ITEMS } from "@/lib/constants";
import { AdminPinGate } from "@/components/admin/AdminPinGate";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminPinGate>
      <Header />
      <div className="min-h-screen pt-[70px] flex">
        <Sidebar items={[...ADMIN_NAV_ITEMS]} currentPath="/dashboard" title="管理画面" hasHeader />
        <main className="flex-1 p-[30px] md:p-[50px] ml-0 md:ml-[260px] bg-gray-50">
          {children}
        </main>
      </div>
    </AdminPinGate>
  );
}

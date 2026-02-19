"use client";

import { usePathname } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { USER_NAV_ITEMS } from "@/lib/constants";

export default function MypageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const sidebarItems = USER_NAV_ITEMS.map((item) => ({
    href: item.href,
    label: item.label,
    icon: item.icon || "dashboard",
  }));

  return (
    <>
      <Header />
      <Sidebar
        items={sidebarItems}
        currentPath={pathname}
        title="マイページ"
      />
      <main className="pt-[70px] md:ml-[260px]">
        <div className="p-[20px] md:p-[40px]">
          {children}
        </div>
      </main>
    </>
  );
}

import { VendorNavigation } from "@/components/vendor/VendorNavigation";

export default function VendorLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="vendor-theme min-h-screen">
      <VendorNavigation>
        <main className="pt-[48px] px-[24px] pb-[80px] md:px-[32px] md:pb-[32px] min-h-screen bg-base">
          {children}
        </main>
      </VendorNavigation>
    </div>
  );
}

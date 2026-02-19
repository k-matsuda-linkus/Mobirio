import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

export default function LegalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      <main className="pt-[70px]">
        <div className="max-w-[800px] mx-auto px-[20px] md:px-[30px] py-[50px] md:py-[100px]">
          {children}
        </div>
      </main>
      <Footer />
    </>
  );
}

import Link from "next/link";

export const metadata = {
  title: "認証 | Mobirio",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-[20px] py-[40px]">
      <div className="w-full max-w-[420px] bg-white border border-gray-100 p-[40px]">
        <div className="text-center mb-[32px]">
          <Link
            href="/"
            className="font-serif font-light text-2xl tracking-wide text-black"
          >
            Mobirio
          </Link>
        </div>
        {children}
      </div>
    </div>
  );
}

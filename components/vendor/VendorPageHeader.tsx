"use client";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

interface Breadcrumb {
  label: string;
  href?: string;
}

interface VendorPageHeaderProps {
  title: string;
  breadcrumbs?: Breadcrumb[];
  actions?: React.ReactNode;
}

export function VendorPageHeader({ title, breadcrumbs, actions }: VendorPageHeaderProps) {
  return (
    <div className="mb-[24px]">
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="flex items-center gap-[4px] text-xs text-gray-400 mb-[8px]">
          <Link href="/vendor" className="hover:text-gray-600">TOP</Link>
          {breadcrumbs.map((bc, i) => (
            <span key={i} className="flex items-center gap-[4px]">
              <ChevronRight className="w-[12px] h-[12px]" />
              {bc.href ? (
                <Link href={bc.href} className="hover:text-gray-600">{bc.label}</Link>
              ) : (
                <span className="text-gray-600">{bc.label}</span>
              )}
            </span>
          ))}
        </nav>
      )}
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-2xl font-light">{title}</h1>
        {actions && <div className="flex items-center gap-[8px]">{actions}</div>}
      </div>
    </div>
  );
}

import Link from "next/link";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav aria-label="パンくずリスト" className="text-sm font-sans text-gray-400">
      <ol className="flex items-center flex-wrap gap-[4px]">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <li key={index} className="flex items-center gap-[4px]">
              {index > 0 && (
                <span className="text-gray-300 select-none" aria-hidden="true">
                  /
                </span>
              )}
              {isLast || !item.href ? (
                <span className={isLast ? "text-black font-medium" : ""}>
                  {item.label}
                </span>
              ) : (
                <Link
                  href={item.href}
                  className="hover:text-black transition-colors"
                >
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

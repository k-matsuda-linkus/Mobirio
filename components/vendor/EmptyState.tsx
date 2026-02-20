import Link from "next/link";
import type { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
}

export function EmptyState({ icon: Icon, title, description, actionLabel, actionHref }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-[60px] px-[16px]">
      <Icon className="w-[48px] h-[48px] text-gray-300 mb-[16px]" />
      <h3 className="text-sm font-medium text-gray-600 mb-[6px]">{title}</h3>
      <p className="text-xs text-gray-400 text-center max-w-[320px] mb-[16px]">{description}</p>
      {actionLabel && actionHref && (
        <Link
          href={actionHref}
          className="text-sm text-accent hover:underline"
        >
          {actionLabel}
        </Link>
      )}
    </div>
  );
}

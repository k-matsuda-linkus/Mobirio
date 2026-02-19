type BadgeVariant = 'default' | 'pending' | 'confirmed' | 'in_use' | 'completed' | 'cancelled';

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-gray-100 text-gray-700',
  pending: 'bg-amber-50 text-amber-700',
  confirmed: 'bg-emerald-50 text-emerald-700',
  in_use: 'bg-blue-50 text-blue-700',
  completed: 'bg-gray-100 text-gray-500',
  cancelled: 'bg-red-50 text-red-700',
};

export function Badge({ variant = 'default', children, className = '' }: BadgeProps) {
  return (
    <span className={`inline-flex items-center px-[10px] py-[4px] text-xs font-medium ${variantClasses[variant]} ${className}`}>
      {children}
    </span>
  );
}

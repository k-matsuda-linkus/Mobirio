interface PriceTagProps {
  amount: number;
  size?: 'sm' | 'md' | 'lg';
  suffix?: string;
}

const sizeClasses = {
  sm: 'text-sm',
  md: 'text-lg',
  lg: 'text-2xl',
};

export function PriceTag({ amount, size = 'md', suffix = '/日' }: PriceTagProps) {
  return (
    <span className={`font-medium ${sizeClasses[size]}`}>
      <span>¥{amount.toLocaleString()}</span>
      {suffix && <span className="text-xs text-gray-400 ml-[2px]">{suffix}</span>}
    </span>
  );
}

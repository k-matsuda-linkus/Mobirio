interface PriceBreakdownItem {
  label: string;
  amount: number;
  type: 'base' | 'option' | 'insurance' | 'tax' | 'discount';
}

interface PriceBreakdownProps {
  items: PriceBreakdownItem[];
  total: number;
}

export function PriceBreakdown({ items, total }: PriceBreakdownProps) {
  return (
    <div className="space-y-[2px]">
      {items.map((item, i) => (
        <div key={i} className="flex justify-between py-[8px] border-b border-gray-50 text-sm">
          <span className={item.type === 'discount' ? 'text-accent' : ''}>{item.label}</span>
          <span className={item.type === 'discount' ? 'text-accent' : ''}>
            {item.type === 'discount' ? '-' : ''}¥{Math.abs(item.amount).toLocaleString()}
          </span>
        </div>
      ))}
      <div className="flex justify-between pt-[12px] text-lg font-medium">
        <span>合計</span>
        <span>¥{total.toLocaleString()}</span>
      </div>
    </div>
  );
}

"use client";

export interface MonthlySales {
  month: string;
  amount: number;
}

interface MiniSalesChartProps {
  data: MonthlySales[];
  currentMonth: string;
}

export function MiniSalesChart({ data, currentMonth }: MiniSalesChartProps) {
  const maxAmount = Math.max(...data.map((d) => d.amount), 1);

  return (
    <div className="bg-white border border-gray-200 p-[20px]">
      <h3 className="text-[16px] font-medium mb-[16px]">売上推移</h3>
      <div className="flex items-end gap-[8px] h-[160px]">
        {data.map((d) => {
          const barHeight = Math.round((d.amount / maxAmount) * 120);
          const isCurrent = d.month === currentMonth;
          return (
            <div
              key={d.month}
              className="flex flex-col items-center flex-1 min-w-0"
            >
              <span className="text-[10px] text-gray-500 mb-[4px]">
                {d.amount > 0
                  ? `¥${Math.round(d.amount / 10000)}万`
                  : ""}
              </span>
              <div
                className={`w-[30px] ${
                  isCurrent ? "bg-accent-dark" : "bg-accent"
                }`}
                style={{ height: `${barHeight}px` }}
              />
              <span className="text-[11px] text-gray-500 mt-[6px]">
                {d.month}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

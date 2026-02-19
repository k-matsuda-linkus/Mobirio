"use client";

interface BarData {
  label: string;
  prevYear: number;
  currentYear: number;
  prevYearPc?: number;
  prevYearSp?: number;
  currentYearPc?: number;
  currentYearSp?: number;
}

interface AnalyticsChartProps {
  data: BarData[];
  title?: string;
  showDeviceBreakdown?: boolean;
  valueLabel?: string;
}

export function AnalyticsChart({ data, title, showDeviceBreakdown = false, valueLabel = "" }: AnalyticsChartProps) {
  const maxVal = Math.max(...data.flatMap((d) => [d.prevYear, d.currentYear]), 1);

  return (
    <div className="bg-white border border-gray-200 p-[24px]">
      {title && <h3 className="text-sm font-medium text-gray-700 mb-[16px]">{title}</h3>}
      <div className="flex items-center gap-[16px] text-xs text-gray-500 mb-[12px]">
        <span className="flex items-center gap-[4px]">
          <span className="w-[12px] h-[12px] bg-gray-300 inline-block" /> 前年
        </span>
        <span className="flex items-center gap-[4px]">
          <span className="w-[12px] h-[12px] bg-accent inline-block" /> 当年
        </span>
        {showDeviceBreakdown && (
          <>
            <span className="flex items-center gap-[4px]">
              <span className="w-[12px] h-[12px] bg-blue-400 inline-block" /> PC
            </span>
            <span className="flex items-center gap-[4px]">
              <span className="w-[12px] h-[12px] bg-orange-400 inline-block" /> SP
            </span>
          </>
        )}
      </div>
      <div className="flex items-end gap-[4px]" style={{ height: 200 }}>
        {data.map((d, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-[2px]">
            <div className="flex items-end gap-[2px] w-full justify-center" style={{ height: 180 }}>
              <div className="flex flex-col items-center" style={{ width: "40%" }}>
                {showDeviceBreakdown ? (
                  <>
                    <div
                      className="w-full bg-blue-200"
                      style={{ height: `${((d.prevYearPc ?? 0) / maxVal) * 180}px` }}
                    />
                    <div
                      className="w-full bg-orange-200"
                      style={{ height: `${((d.prevYearSp ?? 0) / maxVal) * 180}px` }}
                    />
                  </>
                ) : (
                  <div
                    className="w-full bg-gray-300"
                    style={{ height: `${(d.prevYear / maxVal) * 180}px` }}
                  />
                )}
              </div>
              <div className="flex flex-col items-center" style={{ width: "40%" }}>
                {showDeviceBreakdown ? (
                  <>
                    <div
                      className="w-full bg-blue-500"
                      style={{ height: `${((d.currentYearPc ?? 0) / maxVal) * 180}px` }}
                    />
                    <div
                      className="w-full bg-orange-500"
                      style={{ height: `${((d.currentYearSp ?? 0) / maxVal) * 180}px` }}
                    />
                  </>
                ) : (
                  <div
                    className="w-full bg-accent"
                    style={{ height: `${(d.currentYear / maxVal) * 180}px` }}
                  />
                )}
              </div>
            </div>
            <span className="text-[10px] text-gray-500 mt-[4px]">{d.label}</span>
          </div>
        ))}
      </div>
      {valueLabel && (
        <div className="text-right text-xs text-gray-400 mt-[8px]">単位: {valueLabel}</div>
      )}
    </div>
  );
}

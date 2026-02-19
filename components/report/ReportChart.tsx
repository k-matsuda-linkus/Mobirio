"use client";

type DataPoint = { label: string; value: number };
type Props = {
  data: DataPoint[];
  type: "bar" | "line";
  height?: number;
};

export default function ReportChart({ data, type, height = 200 }: Props) {
  if (data.length === 0) return null;
  const max = Math.max(...data.map((d) => d.value), 1);

  if (type === "line") {
    const w = 100 / Math.max(data.length - 1, 1);
    const points = data.map((d, i) => {
      const x = i * w;
      const y = 100 - (d.value / max) * 100;
      return x + "," + y;
    }).join(" ");
    return (
      <div style={{ height }} className="w-full">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-full w-full">
          <polyline fill="none" stroke="#2D7D6F" strokeWidth="1.5" points={points} />
        </svg>
        <div className="mt-[8px] flex justify-between text-xs text-gray-400">
          {data.map((d, i) => <span key={i}>{d.label}</span>)}
        </div>
      </div>
    );
  }

  return (
    <div style={{ height }} className="flex items-end gap-[4px]">
      {data.map((d, i) => {
        const pct = (d.value / max) * 100;
        return (
          <div key={i} className="flex flex-1 flex-col items-center gap-[4px]">
            <div className="w-full bg-[#2D7D6F] transition-all" style={{ height: pct + "%" }} title={String(d.value)} />
            <span className="text-xs text-gray-400 truncate max-w-full">{d.label}</span>
          </div>
        );
      })}
    </div>
  );
}

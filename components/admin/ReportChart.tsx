"use client";

import { useState } from "react";

interface DataPoint {
  label: string;
  value: number;
}

interface DataSeries {
  name: string;
  color?: string;
  data: number[];
}

interface ReportChartProps {
  title?: string;
  data?: DataPoint[];
  series?: DataSeries[];
  labels?: string[];
  height?: number;
  type?: "bar" | "line" | "pie";
}

const defaultColors = [
  "#1a1a1a",
  "#2D7D6F",
  "#6366f1",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
];

const placeholderData: DataPoint[] = [
  { label: "1月", value: 65 },
  { label: "2月", value: 78 },
  { label: "3月", value: 52 },
  { label: "4月", value: 91 },
  { label: "5月", value: 84 },
  { label: "6月", value: 73 },
];

export function ReportChart({
  title,
  data,
  series,
  labels,
  height = 220,
  type = "bar",
}: ReportChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [hoveredSeries, setHoveredSeries] = useState<number | null>(null);

  /* --- single data mode --- */
  const chartData = data ?? placeholderData;
  const chartLabels = labels ?? chartData.map((d) => d.label);

  /* --- multi-series mode --- */
  const isSeries = !!series && series.length > 0;
  const allValues = isSeries
    ? series.flatMap((s) => s.data)
    : chartData.map((d) => d.value);
  const max = Math.max(...allValues, 1);

  /* --- pie chart (SVG) --- */
  if (type === "pie") {
    const total = chartData.reduce((sum, d) => sum + d.value, 0);
    const pieSize = height;
    const cx = pieSize / 2;
    const cy = pieSize / 2;
    const radius = pieSize / 2 - 10;
    let cumAngle = -Math.PI / 2;

    const slices = chartData.map((d, i) => {
      const sliceAngle = (d.value / Math.max(total, 1)) * Math.PI * 2;
      const startAngle = cumAngle;
      cumAngle += sliceAngle;
      const endAngle = cumAngle;
      const largeArc = sliceAngle > Math.PI ? 1 : 0;
      const x1 = cx + radius * Math.cos(startAngle);
      const y1 = cy + radius * Math.sin(startAngle);
      const x2 = cx + radius * Math.cos(endAngle);
      const y2 = cy + radius * Math.sin(endAngle);
      const pathD = `M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;
      return { d: pathD, color: defaultColors[i % defaultColors.length], label: d.label, value: d.value, pct: total > 0 ? Math.round((d.value / total) * 100) : 0 };
    });

    return (
      <div className="border border-gray-100 p-[20px]">
        {title && (
          <h3 className="mb-[16px] text-sm font-sans font-medium text-gray-700">{title}</h3>
        )}
        <div className="flex items-center gap-[30px]">
          <svg width={pieSize} height={pieSize} viewBox={`0 0 ${pieSize} ${pieSize}`}>
            {slices.map((s, i) => (
              <path
                key={i}
                d={s.d}
                fill={s.color}
                stroke="white"
                strokeWidth={2}
                opacity={hoveredIndex === i ? 1 : 0.85}
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
                className="transition-opacity duration-150 cursor-pointer"
              />
            ))}
          </svg>
          <div className="flex flex-col gap-[8px]">
            {slices.map((s, i) => (
              <div key={i} className="flex items-center gap-[8px]">
                <span className="w-[12px] h-[12px] inline-block flex-shrink-0" style={{ backgroundColor: s.color }} />
                <span className="text-xs font-sans text-gray-600">{s.label}</span>
                <span className="text-xs font-sans text-gray-400">{s.pct}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  /* --- bar chart --- */
  if (type === "bar") {
    return (
      <div className="border border-gray-100 p-[20px]">
        {title && (
          <h3 className="mb-[16px] text-sm font-sans font-medium text-gray-700">
            {title}
          </h3>
        )}

        {/* legend */}
        {isSeries && (
          <div className="flex flex-wrap gap-[16px] mb-[12px]">
            {series.map((s, si) => (
              <div key={si} className="flex items-center gap-[6px]">
                <span
                  className="w-[12px] h-[12px] inline-block"
                  style={{ backgroundColor: s.color ?? defaultColors[si % defaultColors.length] }}
                />
                <span className="text-xs font-sans text-gray-600">{s.name}</span>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-end gap-[4px]" style={{ height }}>
          {isSeries
            ? chartLabels.map((label, li) => (
                <div key={li} className="flex flex-1 flex-col items-center gap-[4px]">
                  <div className="flex items-end gap-[2px] w-full h-full">
                    {series.map((s, si) => {
                      const val = s.data[li] ?? 0;
                      const pct = (val / max) * 100;
                      const isHovered = hoveredIndex === li && hoveredSeries === si;
                      return (
                        <div
                          key={si}
                          className="relative flex-1 transition-opacity duration-150"
                          style={{
                            height: `${pct}%`,
                            minHeight: 2,
                            backgroundColor: s.color ?? defaultColors[si % defaultColors.length],
                            opacity: isHovered ? 1 : 0.8,
                          }}
                          onMouseEnter={() => { setHoveredIndex(li); setHoveredSeries(si); }}
                          onMouseLeave={() => { setHoveredIndex(null); setHoveredSeries(null); }}
                        >
                          {isHovered && (
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-[6px] bg-gray-800 text-white text-[11px] px-[8px] py-[4px] whitespace-nowrap z-10 pointer-events-none">
                              {s.name}: {val}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <span className="text-[10px] text-gray-400 truncate max-w-full">
                    {label}
                  </span>
                </div>
              ))
            : chartData.map((d, i) => {
                const pct = (d.value / max) * 100;
                const isHovered = hoveredIndex === i;
                return (
                  <div
                    key={i}
                    className="flex flex-1 flex-col items-center gap-[4px]"
                    onMouseEnter={() => setHoveredIndex(i)}
                    onMouseLeave={() => setHoveredIndex(null)}
                  >
                    <div className="relative w-full" style={{ height: `${pct}%`, minHeight: 2 }}>
                      <div
                        className="w-full h-full bg-black/80 transition-opacity duration-150"
                        style={{ opacity: isHovered ? 1 : 0.75 }}
                      />
                      {isHovered && (
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-[6px] bg-gray-800 text-white text-[11px] px-[8px] py-[4px] whitespace-nowrap z-10 pointer-events-none">
                          {d.label}: {d.value}
                        </div>
                      )}
                    </div>
                    <span className="text-[10px] text-gray-400 truncate max-w-full">
                      {d.label}
                    </span>
                  </div>
                );
              })}
        </div>
      </div>
    );
  }

  /* --- line chart (SVG) --- */
  const svgPadding = { top: 20, right: 20, bottom: 30, left: 10 };
  const svgWidth = 600;
  const svgHeight = height;
  const plotW = svgWidth - svgPadding.left - svgPadding.right;
  const plotH = svgHeight - svgPadding.top - svgPadding.bottom;

  const getX = (i: number, total: number) =>
    svgPadding.left + (total <= 1 ? plotW / 2 : (i / (total - 1)) * plotW);
  const getY = (v: number) =>
    svgPadding.top + plotH - (v / max) * plotH;

  const buildPath = (values: number[]) =>
    values.map((v, i) => `${i === 0 ? "M" : "L"}${getX(i, values.length)},${getY(v)}`).join(" ");

  const lineData = isSeries
    ? series
    : [{ name: title ?? "", color: "#1a1a1a", data: chartData.map((d) => d.value) }];

  return (
    <div className="border border-gray-100 p-[20px]">
      {title && (
        <h3 className="mb-[16px] text-sm font-sans font-medium text-gray-700">
          {title}
        </h3>
      )}

      {/* legend */}
      {lineData.length > 1 && (
        <div className="flex flex-wrap gap-[16px] mb-[12px]">
          {lineData.map((s, si) => (
            <div key={si} className="flex items-center gap-[6px]">
              <span
                className="w-[12px] h-[3px] inline-block"
                style={{ backgroundColor: s.color ?? defaultColors[si % defaultColors.length] }}
              />
              <span className="text-xs font-sans text-gray-600">{s.name}</span>
            </div>
          ))}
        </div>
      )}

      <svg
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        className="w-full"
        style={{ height }}
      >
        {/* grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio) => (
          <line
            key={ratio}
            x1={svgPadding.left}
            x2={svgPadding.left + plotW}
            y1={svgPadding.top + plotH * (1 - ratio)}
            y2={svgPadding.top + plotH * (1 - ratio)}
            stroke="#e5e7eb"
            strokeWidth={1}
          />
        ))}

        {/* lines */}
        {lineData.map((s, si) => (
          <path
            key={si}
            d={buildPath(s.data)}
            fill="none"
            stroke={s.color ?? defaultColors[si % defaultColors.length]}
            strokeWidth={2}
          />
        ))}

        {/* dots with tooltip */}
        {lineData.map((s, si) =>
          s.data.map((v, di) => {
            const cx = getX(di, s.data.length);
            const cy = getY(v);
            const isHov = hoveredIndex === di && hoveredSeries === si;
            return (
              <g
                key={`${si}-${di}`}
                onMouseEnter={() => { setHoveredIndex(di); setHoveredSeries(si); }}
                onMouseLeave={() => { setHoveredIndex(null); setHoveredSeries(null); }}
              >
                <circle cx={cx} cy={cy} r={isHov ? 5 : 3} fill={s.color ?? defaultColors[si % defaultColors.length]} />
                {isHov && (
                  <>
                    <rect
                      x={cx - 30}
                      y={cy - 28}
                      width={60}
                      height={20}
                      fill="#1f2937"
                    />
                    <text
                      x={cx}
                      y={cy - 14}
                      textAnchor="middle"
                      fill="white"
                      fontSize={11}
                    >
                      {v}
                    </text>
                  </>
                )}
              </g>
            );
          })
        )}

        {/* x labels */}
        {chartLabels.map((label, i) => (
          <text
            key={i}
            x={getX(i, chartLabels.length)}
            y={svgHeight - 6}
            textAnchor="middle"
            fill="#9ca3af"
            fontSize={10}
          >
            {label}
          </text>
        ))}
      </svg>
    </div>
  );
}

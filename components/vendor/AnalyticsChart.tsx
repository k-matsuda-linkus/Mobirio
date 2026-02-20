"use client";

import { useMemo } from "react";

// --- 型定義（既存インターフェース維持） ---
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

// --- Y軸目盛りを「きりのいい数字」で5段階計算するユーティリティ ---
function calcYAxisTicks(maxValue: number): number[] {
  if (maxValue <= 0) return [0, 1, 2, 3, 4];
  // きりのいいステップを算出（1, 2, 5, 10, 20, 50, 100, ...）
  const rawStep = maxValue / 4;
  const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));
  const residual = rawStep / magnitude;
  let niceStep: number;
  if (residual <= 1.5) niceStep = 1 * magnitude;
  else if (residual <= 3.5) niceStep = 2 * magnitude;
  else if (residual <= 7.5) niceStep = 5 * magnitude;
  else niceStep = 10 * magnitude;

  const ticks: number[] = [];
  for (let i = 0; i <= 4; i++) {
    ticks.push(niceStep * i);
  }
  return ticks;
}

// --- チャート描画高さ定数 ---
const CHART_HEIGHT = 220;

export function AnalyticsChart({
  data,
  title,
  showDeviceBreakdown = false,
  valueLabel = "",
}: AnalyticsChartProps) {
  // データ内の最大値を算出
  const rawMax = useMemo(
    () => Math.max(...data.flatMap((d) => [d.prevYear, d.currentYear]), 1),
    [data]
  );

  // Y軸目盛り（5段階）
  const yTicks = useMemo(() => calcYAxisTicks(rawMax), [rawMax]);
  // 目盛りの最大値をチャートスケール上限として使う
  const scaleMax = yTicks[yTicks.length - 1] || 1;

  // 棒の高さをpxで算出するヘルパー
  const toHeight = (value: number) =>
    scaleMax > 0 ? (value / scaleMax) * CHART_HEIGHT : 0;

  // ツールチップ用の値フォーマット
  const fmt = (v: number) => v.toLocaleString();

  return (
    <div className="bg-white border border-gray-200 p-[24px]">
      {/* --- ヘッダー: タイトル + 凡例 --- */}
      <div className="flex flex-wrap items-center justify-between gap-[8px] mb-[16px]">
        {title && (
          <h3 className="text-sm font-medium text-gray-700">{title}</h3>
        )}
        <div className="flex items-center gap-[16px] text-[11px] text-gray-500">
          <span className="flex items-center gap-[4px]">
            <span
              className="w-[12px] h-[12px] inline-block shrink-0"
              style={{
                background: "linear-gradient(to top, #d1d5db, #9ca3af)",
              }}
            />
            前年
          </span>
          <span className="flex items-center gap-[4px]">
            <span
              className="w-[12px] h-[12px] inline-block shrink-0"
              style={{
                background:
                  "linear-gradient(to top, var(--color-accent, #2D7D6F)B3, var(--color-accent, #2D7D6F))",
              }}
            />
            当年
          </span>
          {showDeviceBreakdown && (
            <>
              <span className="flex items-center gap-[4px]">
                <span className="w-[12px] h-[12px] bg-blue-400 inline-block shrink-0" />
                PC
              </span>
              <span className="flex items-center gap-[4px]">
                <span className="w-[12px] h-[12px] bg-orange-400 inline-block shrink-0" />
                SP
              </span>
            </>
          )}
        </div>
      </div>

      {/* --- チャート本体 --- */}
      <div className="flex">
        {/* Y軸ラベル */}
        <div
          className="flex flex-col justify-between items-end pr-[8px] shrink-0"
          style={{ height: CHART_HEIGHT }}
        >
          {[...yTicks].reverse().map((tick, i) => (
            <span
              key={i}
              className="text-[10px] text-gray-400 leading-none"
            >
              {tick.toLocaleString()}
            </span>
          ))}
        </div>

        {/* グラフエリア */}
        <div className="flex-1 relative" style={{ height: CHART_HEIGHT }}>
          {/* 水平グリッド線（破線） */}
          {yTicks.map((tick, i) => (
            <div
              key={i}
              className="absolute left-0 right-0 border-t border-dashed border-gray-200"
              style={{
                bottom: `${toHeight(tick)}px`,
              }}
            />
          ))}

          {/* 棒グラフ群 */}
          <div
            className="relative flex items-end h-full"
            style={{ gap: data.length > 6 ? "2px" : "8px" }}
          >
            {data.map((d, i) => (
              <div key={i} className="flex-1 flex flex-col items-center min-w-0">
                {/* 棒ペア（前年 + 当年） */}
                <div
                  className="flex items-end justify-center w-full"
                  style={{
                    height: CHART_HEIGHT,
                    gap: data.length > 8 ? "1px" : "3px",
                  }}
                >
                  {/* --- 前年バー --- */}
                  <div
                    className="relative group"
                    style={{
                      width: showDeviceBreakdown ? "38%" : "40%",
                      maxWidth: "32px",
                    }}
                  >
                    {showDeviceBreakdown ? (
                      /* スタックドバー: PC + SP 積み上げ */
                      <div
                        className="flex flex-col-reverse w-full"
                        style={{
                          height: `${toHeight(d.prevYear)}px`,
                          transition: "height 0.3s ease",
                        }}
                      >
                        {/* PC部分（下段） */}
                        <div
                          className="w-full bg-blue-200"
                          style={{
                            height:
                              d.prevYear > 0
                                ? `${((d.prevYearPc ?? 0) / d.prevYear) * 100}%`
                                : "0%",
                          }}
                        />
                        {/* SP部分（上段） */}
                        <div
                          className="w-full bg-orange-200"
                          style={{
                            height:
                              d.prevYear > 0
                                ? `${((d.prevYearSp ?? 0) / d.prevYear) * 100}%`
                                : "0%",
                          }}
                        />
                      </div>
                    ) : (
                      /* 通常バー: グラデーション */
                      <div
                        className="w-full"
                        style={{
                          height: `${toHeight(d.prevYear)}px`,
                          background:
                            "linear-gradient(to top, #d1d5db, #9ca3af)",
                          transition: "height 0.3s ease",
                        }}
                      />
                    )}
                    {/* ツールチップ（前年） */}
                    <div
                      className="absolute left-1/2 bottom-full mb-[6px] -translate-x-1/2 pointer-events-none opacity-0 group-hover:opacity-100 z-10 whitespace-nowrap bg-gray-800 text-white text-[10px] px-[8px] py-[4px]"
                      style={{ transition: "opacity 0.2s ease" }}
                    >
                      <div className="font-medium">前年: {fmt(d.prevYear)}{valueLabel && ` ${valueLabel}`}</div>
                      {showDeviceBreakdown && (
                        <div className="text-gray-300">
                          PC: {fmt(d.prevYearPc ?? 0)} / SP: {fmt(d.prevYearSp ?? 0)}
                        </div>
                      )}
                      {/* ツールチップ矢印 */}
                      <div
                        className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0"
                        style={{
                          borderLeft: "4px solid transparent",
                          borderRight: "4px solid transparent",
                          borderTop: "4px solid #1f2937",
                        }}
                      />
                    </div>
                  </div>

                  {/* --- 当年バー --- */}
                  <div
                    className="relative group"
                    style={{
                      width: showDeviceBreakdown ? "38%" : "40%",
                      maxWidth: "32px",
                    }}
                  >
                    {showDeviceBreakdown ? (
                      /* スタックドバー: PC + SP 積み上げ */
                      <div
                        className="flex flex-col-reverse w-full"
                        style={{
                          height: `${toHeight(d.currentYear)}px`,
                          transition: "height 0.3s ease",
                        }}
                      >
                        {/* PC部分（下段） */}
                        <div
                          className="w-full bg-blue-500"
                          style={{
                            height:
                              d.currentYear > 0
                                ? `${((d.currentYearPc ?? 0) / d.currentYear) * 100}%`
                                : "0%",
                          }}
                        />
                        {/* SP部分（上段） */}
                        <div
                          className="w-full bg-orange-500"
                          style={{
                            height:
                              d.currentYear > 0
                                ? `${((d.currentYearSp ?? 0) / d.currentYear) * 100}%`
                                : "0%",
                          }}
                        />
                      </div>
                    ) : (
                      /* 通常バー: アクセントカラーのグラデーション */
                      <div
                        className="w-full"
                        style={{
                          height: `${toHeight(d.currentYear)}px`,
                          background:
                            "linear-gradient(to top, var(--color-accent, #2D7D6F)B3, var(--color-accent, #2D7D6F))",
                          transition: "height 0.3s ease",
                        }}
                      />
                    )}
                    {/* ツールチップ（当年） */}
                    <div
                      className="absolute left-1/2 bottom-full mb-[6px] -translate-x-1/2 pointer-events-none opacity-0 group-hover:opacity-100 z-10 whitespace-nowrap bg-gray-800 text-white text-[10px] px-[8px] py-[4px]"
                      style={{ transition: "opacity 0.2s ease" }}
                    >
                      <div className="font-medium">当年: {fmt(d.currentYear)}{valueLabel && ` ${valueLabel}`}</div>
                      {showDeviceBreakdown && (
                        <div className="text-gray-300">
                          PC: {fmt(d.currentYearPc ?? 0)} / SP: {fmt(d.currentYearSp ?? 0)}
                        </div>
                      )}
                      {/* ツールチップ矢印 */}
                      <div
                        className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0"
                        style={{
                          borderLeft: "4px solid transparent",
                          borderRight: "4px solid transparent",
                          borderTop: "4px solid #1f2937",
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* X軸ラベル */}
                <span className="text-[10px] text-gray-500 mt-[6px] truncate max-w-full">
                  {d.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* --- 単位ラベル --- */}
      {valueLabel && (
        <div className="text-right text-[11px] text-gray-400 mt-[8px]">
          単位: {valueLabel}
        </div>
      )}
    </div>
  );
}

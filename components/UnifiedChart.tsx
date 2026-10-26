"use client";

import React, { useId, useMemo } from "react";
import { TrendingUp } from "lucide-react";
import {
  Bar,
  BarChart,
  Area,
  AreaChart,
  CartesianGrid,
  LabelList,
  XAxis,
  YAxis,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart";

// Types
export type Point = { date: string; value: number };

export type Series = {
  key: string;
  label: string;
  color: string;
  data: number[];
};

export type DonutSegment = {
  label: string;
  value: number;
  color: string;
};

export type ChartType = "bar" | "stacked-bar" | "line" | "area" | "donut";

export interface UnifiedChartProps {
  type?: ChartType;
  /** Single series data */
  data?: Point[];
  /** Multi-series data */
  series?: Series[];
  /** Date axis points for multi-series */
  dates?: string[];
  /** Donut / breakdown segments */
  segments?: DonutSegment[];

  /** Primary label for single series */
  label?: string;
  /** Primary accent color */
  color?: string;
  /** Whether to show the 3 stat pills at top (Total, Peak, Active days) */
  showStats?: boolean;
  /** Whether to hide the chart legend */
  hideLegend?: boolean;
  /** Whether to hide the bottom trend footer */
  hideFooter?: boolean;
  /** Trend footer text override */
  trendText?: string;
  /** Sub-trend footer text */
  trendSubtext?: string;
  /** Center label for donut chart */
  centerLabel?: string;
  /** Center value for donut chart */
  centerValue?: string | number;
  /** Whether to hide the Y-axis numbers/ticks (default: true) */
  hideYAxis?: boolean;
  /** Custom height for chart container */
  height?: number | string;
  /** Loading state */
  loading?: boolean;
  /** Custom container class */
  className?: string;
}

// Helpers
const fmtDay = (iso: string) => {
  if (!iso) return "";
  if (!iso.includes("-") && !iso.includes("/")) return iso;
  const d = new Date(iso.includes("T") ? iso : iso + "T00:00:00");
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
};

const fmtFullDate = (iso: string) => {
  if (!iso) return "";
  if (!iso.includes("-") && !iso.includes("/")) return iso;
  const d = new Date(iso.includes("T") ? iso : iso + "T00:00:00");
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const fmtNum = (n: number) => n.toLocaleString();

export function computeIntegerTicks(maxValue: number): { yMax: number; ticks: number[] } {
  if (maxValue <= 0) return { yMax: 4, ticks: [0, 1, 2, 3, 4] };
  const step = Math.ceil(maxValue / 4);
  const yMax = step * 4;
  return { yMax, ticks: [0, step, step * 2, step * 3, yMax] };
}

/**
 * UnifiedChart Component
 * Centralized, polymorphic chart solution for the entire application.
 * Supports: Single Bar, Stacked Bar, Area/Line, and Ring Donut charts
 * with consistent Apple HIG / Soft Pastel styling tokens.
 */
export function UnifiedChart({
  type,
  data,
  series,
  dates,
  segments,
  label = "Metric",
  color = "#4f46e5",
  showStats = false,
  hideLegend = false,
  hideFooter = true,
  trendText,
  trendSubtext,
  centerLabel = "Total",
  centerValue,
  hideYAxis = true,
  height,
  loading = false,
  className = "",
}: UnifiedChartProps) {
  const chartId = useId().replace(/:/g, "");

  // Auto-detect chart type if not explicitly set
  const effectiveType: ChartType = useMemo(() => {
    if (type) return type;
    if (segments && segments.length > 0) return "donut";
    if (series && series.length > 0) return "stacked-bar";
    return "bar";
  }, [type, segments, series]);

  // Static fallback points for single-series charts (must be declared before any conditional returns)
  const fallbackData: Point[] = useMemo(() => {
    const now = Date.now();
    const DAY = 86400000;
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(now - (6 - i) * DAY);
      return { date: d.toISOString().slice(0, 10), value: 0 };
    });
  }, []);

  // Loading skeleton
  if (loading) {
    return (
      <div className={`flex h-56 items-center justify-center ${className}`}>
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-950 border-t-transparent" />
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // 1. DONUT / RING CHART
  // ─────────────────────────────────────────────────────────────
  if (effectiveType === "donut" && segments) {
    const SIZE = 160;
    const STROKE = 18;
    const R = (SIZE - STROKE) / 2;
    const C = 2 * Math.PI * R;
    const total = segments.reduce((n, s) => n + s.value, 0);
    const displayCenterVal = centerValue !== undefined ? centerValue : total.toLocaleString();

    let offset = 0;

    return (
      <div className={`flex flex-col sm:flex-row items-center gap-6 py-2 ${className}`}>
        <div className="relative shrink-0" style={{ width: SIZE, height: SIZE }}>
          <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} className="-rotate-90">
            {/* Subtle background track */}
            <circle
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={R}
              fill="none"
              stroke="#e5e5ea"
              strokeWidth={STROKE}
            />
            {total > 0 &&
              segments
                .filter((s) => s.value > 0)
                .map((s) => {
                  const frac = s.value / total;
                  const dash = frac * C;
                  const el = (
                    <circle
                      key={s.label}
                      cx={SIZE / 2}
                      cy={SIZE / 2}
                      r={R}
                      fill="none"
                      stroke={s.color}
                      strokeWidth={STROKE}
                      strokeDasharray={`${dash} ${C - dash}`}
                      strokeDashoffset={-offset}
                      strokeLinecap="round"
                      className="transition-all duration-500 ease-out"
                    />
                  );
                  offset += dash;
                  return el;
                })}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-black tracking-tight text-slate-900 tabular-nums">
              {displayCenterVal}
            </span>
            <span className="text-xs font-semibold text-slate-400">{centerLabel}</span>
          </div>
        </div>

        <ul className="w-full space-y-2 text-xs">
          {segments.map((s) => (
            <li
              key={s.label}
              className="flex items-center justify-between rounded-xl p-1.5 transition-colors hover:bg-slate-50"
            >
              <div className="flex items-center gap-2">
                <span
                  aria-hidden
                  className="h-2.5 w-2.5 shrink-0 rounded-full shadow-2xs"
                  style={{ background: s.color }}
                />
                <span className="font-semibold text-slate-700">{s.label}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold tabular-nums text-slate-900">
                  {s.value.toLocaleString()}
                </span>
                {total > 0 && (
                  <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-500 tabular-nums">
                    {Math.round((s.value / total) * 100)}%
                  </span>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // 2. MULTI-SERIES STACKED BAR CHART
  // ─────────────────────────────────────────────────────────────
  if (effectiveType === "stacked-bar" && series) {
    const effectiveDates =
      dates && dates.length > 0
        ? dates
        : Array.from({ length: 7 }, (_, i) => {
          const d = new Date(Date.now() - (6 - i) * 86400000);
          return d.toISOString().slice(0, 10);
        });

    const chartData = effectiveDates.map((date, idx) => {
      const row: Record<string, any> = {
        date,
        day: fmtDay(date),
        fullDate: fmtFullDate(date),
      };
      series.forEach((s) => {
        row[s.key] = s.data?.[idx] ?? 0;
      });
      return row;
    });

    const chartConfig: ChartConfig = series.reduce<ChartConfig>((acc, s) => {
      acc[s.key] = { label: s.label, color: s.color };
      return acc;
    }, {});

    const totalVolume = series.reduce(
      (sum, s) => sum + s.data.reduce((a, b) => a + (b || 0), 0),
      0
    );

    return (
      <div className={`flex-1 flex flex-col justify-between w-full h-full min-h-[300px] ${className}`}>
        <ChartContainer config={chartConfig} className="w-full flex-1 min-h-[240px] max-h-none">
          <BarChart
            data={chartData}
            accessibilityLayer={false}
            margin={{ left: hideYAxis ? 4 : -16, right: 8, top: 12, bottom: 0 }}
          >
            <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis
              dataKey="day"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tick={{ fontSize: 11, fill: "#94a3b8", fontWeight: 500 }}
            />
            <YAxis
              hide={hideYAxis}
              domain={[0, (dataMax: number) => (dataMax && dataMax > 0 ? Math.ceil(dataMax * 1.15) : 4)]}
              allowDecimals={false}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  indicator="dot"
                  className="rounded-xl border border-[#e9e9ee] bg-white/95 backdrop-blur-md shadow-md p-2.5 text-xs font-semibold"
                />
              }
            />
            {!hideLegend && (
              <ChartLegend
                content={<ChartLegendContent className="hidden sm:flex text-xs font-semibold text-slate-600 gap-4 pt-2" />}
              />
            )}
            {series.map((s, index) => {
              const isTop = index === series.length - 1;
              return (
                <Bar
                  key={s.key}
                  dataKey={s.key}
                  stackId="a"
                  fill={s.color}
                  radius={isTop ? [6, 6, 0, 0] : [0, 0, 0, 0]}
                  maxBarSize={44}
                />
              );
            })}
          </BarChart>
        </ChartContainer>

        {!hideFooter && (
          <div className="flex items-center gap-2 pt-3 border-t border-[#e9e9ee] mt-auto text-xs font-medium text-slate-500">
            <TrendingUp className="h-4 w-4 text-emerald-500" />
            <span>
              {trendText || `${fmtNum(totalVolume)} total volume recorded over active period`}
            </span>
          </div>
        )}
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // 3. SINGLE SERIES (BAR / AREA)
  // ─────────────────────────────────────────────────────────────
  const activePoints = data && data.length > 0 ? data : fallbackData;

  const chartData = activePoints.map((d) => ({
    month: fmtDay(d.date),
    desktop: d.value,
    date: d.date,
    fullDate: fmtFullDate(d.date),
  }));

  const totalValue = activePoints.reduce((acc, d) => acc + (d.value || 0), 0);
  const peakValue = activePoints.length > 0 ? Math.max(...activePoints.map((d) => d.value || 0)) : 0;
  const activeDays = activePoints.filter((d) => (d.value || 0) > 0).length;

  const primaryColor = color || "#4f46e5";

  const chartConfig: ChartConfig = {
    desktop: {
      label,
      color: primaryColor,
    },
  };

  return (
    <div className={`flex-1 flex flex-col justify-between w-full h-full min-h-[300px] ${className}`}>
      {/* Optional Top Stat Pills */}
      {showStats && (
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-50 border border-[#e9e9ee] text-xs font-bold text-slate-900">
            TOTAL <span className="text-slate-950 font-black">{fmtNum(totalValue)}</span>
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-50 border border-[#e9e9ee] text-xs font-bold text-slate-900">
            Peak <span className="text-slate-950 font-black">{fmtNum(peakValue)}/day</span>
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-50 border border-[#e9e9ee] text-xs font-bold text-slate-900">
            Active <span className="text-slate-950 font-black">{activeDays}d</span>
          </span>
        </div>
      )}

      {effectiveType === "area" ? (
        <ChartContainer config={chartConfig} className="w-full flex-1 min-h-[220px] max-h-none">
          <AreaChart
            data={chartData}
            accessibilityLayer={false}
            margin={{ left: hideYAxis ? 4 : -16, right: 8, top: 12, bottom: 0 }}
          >
            <defs>
              <linearGradient id={`area-grad-${chartId}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={primaryColor} stopOpacity={0.25} />
                <stop offset="95%" stopColor={primaryColor} stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tickMargin={10}
              tick={{ fontSize: 11, fill: "#94a3b8", fontWeight: 500 }}
            />
            <YAxis
              hide={hideYAxis}
              domain={[0, (dataMax: number) => (dataMax && dataMax > 0 ? Math.ceil(dataMax * 1.15) : 4)]}
              allowDecimals={false}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  indicator="line"
                  className="rounded-xl border border-[#e9e9ee] bg-white/95 backdrop-blur-md shadow-md p-2.5 text-xs font-semibold"
                />
              }
            />
            <Area
              type="monotone"
              dataKey="desktop"
              stroke={primaryColor}
              strokeWidth={2.5}
              fillOpacity={1}
              fill={`url(#area-grad-${chartId})`}
            />
          </AreaChart>
        </ChartContainer>
      ) : (
        <ChartContainer config={chartConfig} className="w-full flex-1 min-h-[220px] max-h-none">
          <BarChart
            data={chartData}
            accessibilityLayer={false}
            margin={{ left: hideYAxis ? 4 : -16, right: 8, top: 16, bottom: 0 }}
          >
            <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis
              dataKey="month"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tick={{ fontSize: 11, fill: "#94a3b8", fontWeight: 500 }}
            />
            <YAxis
              hide={hideYAxis}
              domain={[0, (dataMax: number) => (dataMax && dataMax > 0 ? Math.ceil(dataMax * 1.25) : 4)]}
              allowDecimals={false}
            />
            <ChartTooltip
              cursor={{ fill: "rgba(0, 0, 0, 0.03)" }}
              content={
                <ChartTooltipContent
                  hideLabel
                  className="rounded-xl border border-[#e9e9ee] bg-white/95 backdrop-blur-md shadow-md p-2.5 text-xs font-semibold"
                />
              }
            />
            <Bar
              dataKey="desktop"
              fill={primaryColor}
              radius={[8, 8, 0, 0]}
              maxBarSize={44}
            >
              <LabelList
                position="top"
                offset={8}
                className="fill-slate-600 font-bold text-[10px]"
                formatter={(val: any) => (Number(val) > 0 ? fmtNum(Number(val)) : "")}
              />
            </Bar>
          </BarChart>
        </ChartContainer>
      )}

      {!hideFooter && (
        <div className="flex items-center gap-2 pt-3 border-t border-[#e9e9ee] mt-auto text-xs font-medium text-slate-500">
          <TrendingUp className="h-4 w-4 text-emerald-500" />
          <span>
            {trendText || `${fmtNum(totalValue)} total ${label.toLowerCase()} in selected window`}
          </span>
          {trendSubtext && <span className="text-slate-400 ml-auto">{trendSubtext}</span>}
        </div>
      )}
    </div>
  );
}

// Re-export common aliases for convenience and backwards compatibility
export { UnifiedChart as Chart };

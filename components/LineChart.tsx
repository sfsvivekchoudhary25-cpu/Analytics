"use client";

import React, { useId } from "react";
import { TrendingUp } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  XAxis,
  YAxis,
  Area,
  AreaChart,
} from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

export const description = "A bar chart with a label";
export { ChartBarStacked } from "./ui/chart-bar-stacked";

export type Point = { date: string; value: number };

const fmtDay = (iso: string) => {
  if (!iso) return "";
  const d = new Date(iso.includes("T") ? iso : iso + "T00:00:00");
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
};

const fmtFullDate = (iso: string) => {
  if (!iso) return "";
  const d = new Date(iso.includes("T") ? iso : iso + "T00:00:00");
  return d.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const fmtNum = (n: number) => n.toLocaleString();

/**
 * Computes integer ticks for discrete counts.
 * Maintained for backward compatibility.
 */
export function computeIntegerTicks(maxValue: number): { yMax: number; ticks: number[] } {
  if (maxValue <= 0) return { yMax: 4, ticks: [0, 1, 2, 3, 4] };
  if (maxValue <= 2) return { yMax: 2, ticks: [0, 1, 2] };
  if (maxValue <= 4) return { yMax: 4, ticks: [0, 1, 2, 3, 4] };
  if (maxValue <= 6) return { yMax: 6, ticks: [0, 2, 4, 6] };
  if (maxValue <= 10) return { yMax: 10, ticks: [0, 2, 4, 6, 8, 10] };

  const rawStep = maxValue / 4;
  const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));
  const normalized = rawStep / magnitude;

  let stepMultiplier = 1;
  if (normalized <= 1.2) stepMultiplier = 1;
  else if (normalized <= 2.5) stepMultiplier = 2;
  else if (normalized <= 6) stepMultiplier = 5;
  else stepMultiplier = 10;

  const step = Math.max(1, Math.round(stepMultiplier * magnitude));
  const tickCount = Math.ceil(maxValue / step);
  const yMax = tickCount * step;

  const ticks: number[] = [];
  for (let t = 0; t <= yMax; t += step) {
    ticks.push(t);
  }

  return { yMax, ticks };
}

/**
 * Preserved for backward compatibility.
 */
export function buildMonotoneSpline(
  pts: { x: number; y: number; val: number }[],
  zeroY: number
): { line: string; area: string } {
  const n = pts.length;
  if (n === 0) return { line: "", area: "" };
  if (n === 1) {
    const p = pts[0];
    return {
      line: `M ${(p.x - 12).toFixed(1)},${p.y.toFixed(1)} L ${(p.x + 12).toFixed(1)},${p.y.toFixed(1)}`,
      area: `M ${(p.x - 12).toFixed(1)},${p.y.toFixed(1)} L ${(p.x + 12).toFixed(1)},${p.y.toFixed(1)} L ${(p.x + 12).toFixed(1)},${zeroY.toFixed(1)} L ${(p.x - 12).toFixed(1)},${zeroY.toFixed(1)} Z`,
    };
  }
  const line = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const first = pts[0];
  const last = pts[n - 1];
  const area = `${line} L ${last.x.toFixed(1)},${zeroY.toFixed(1)} L ${first.x.toFixed(1)},${zeroY.toFixed(1)} Z`;
  return { line, area };
}

const defaultSampleData = [
  { month: "January", desktop: 186 },
  { month: "February", desktop: 305 },
  { month: "March", desktop: 237 },
  { month: "April", desktop: 73 },
  { month: "May", desktop: 209 },
  { month: "June", desktop: 214 },
];

/**
 * Standalone Bar Chart with Label component matching shadcn/ui exact pattern
 */
export function ChartBarLabel({
  data,
  label = "Desktop",
  color = "#5c67f5",
}: {
  data?: { month: string; desktop: number }[];
  label?: string;
  color?: string;
}) {
  const chartData = data && data.length > 0 ? data : defaultSampleData;

  const chartConfig = {
    desktop: {
      label,
      color,
    },
  } satisfies ChartConfig;

  return (
    <Card className="rounded-[26px] border border-[#e9e9ee] hover:border-black/30 bg-white shadow-2xs">
      <CardHeader>
        <CardTitle>Bar Chart - Label</CardTitle>
        <CardDescription>January - June 2024</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="aspect-auto h-[250px] w-full">
          <BarChart
            accessibilityLayer
            data={chartData}
            margin={{
              top: 24,
              right: 12,
              left: 12,
              bottom: 0,
            }}
          >
            <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis
              dataKey="month"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={(value) => value.slice(0, 3)}
              tick={{ fill: "#64748b", fontSize: 11, fontWeight: 500 }}
            />
            <ChartTooltip
              cursor={{ fill: "rgba(92, 103, 245, 0.05)", radius: 6 }}
              content={<ChartTooltipContent hideLabel />}
            />
            <Bar dataKey="desktop" fill="#5c67f5" radius={[8, 8, 4, 4]}>
              <LabelList
                position="top"
                offset={10}
                className="fill-slate-950 font-bold"
                fontSize={11}
              />
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm border-t border-[#e9e9ee]/80 pt-4 mt-2">
        <div className="flex gap-2 leading-none font-bold text-slate-950">
          Trending up by 5.2% this month <TrendingUp className="h-4 w-4 text-emerald-600" />
        </div>
        <div className="leading-none text-slate-500 text-xs font-medium">
          Showing total visitors for the last 6 months
        </div>
      </CardFooter>
    </Card>
  );
}

/**
 * Main LineChart component:
 * Matches the requested mobile layout pixel-for-pixel:
 * - 3 pills: TOTAL reach, Peak / day, and active days
 * - Bar chart with soft indigo (#5c67f5) rounded bars
 * - LabelList on top of each non-zero bar
 * - Subtle dashed grid lines and hidden Y-axis
 * - Clean trend footer matching the user's screenshot
 */
export function LineChart({
  data,
  label = "Reach",
  color = "#5c67f5",
  showStats = true,
  ribbonClassName,
  hideFooter = false,
}: {
  data: Point[];
  label: string;
  color?: string;
  showStats?: boolean;
  ribbonClassName?: string;
  hideFooter?: boolean;
}) {
  const chartId = useId().replace(/:/g, "");

  const fallbackData: Point[] = React.useMemo(() => {
    const now = Date.now();
    const DAY = 86400000;
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(now - (6 - i) * DAY);
      return { date: d.toISOString().slice(0, 10), value: 0 };
    });
  }, []);

  const activePoints = data && data.length > 0 ? data : fallbackData;

  const chartData = activePoints.map((d) => ({
    month: fmtDay(d.date),
    desktop: d.value,
    date: d.date,
    fullDate: fmtFullDate(d.date),
  }));

  const totalValue = activePoints.reduce((acc, d) => acc + (d.value || 0), 0);

  const peakValue =
    activePoints.length > 0 ? Math.max(...activePoints.map((d) => d.value || 0)) : 0;

  const activeDays = activePoints.filter((d) => (d.value || 0) > 0).length;

  const barColor = color === "#000000" || color === "#0071e3" ? "#5c67f5" : color || "#5c67f5";

  const chartConfig = {
    desktop: {
      label,
      color: barColor,
    },
  } satisfies ChartConfig;

  // Responsive tick interval for X-Axis to prevent overlap on 14/30 day views
  const tickInterval =
    chartData.length > 20 ? 4 : chartData.length > 10 ? 2 : 0;

  // Bar sizing according to dataset density
  const maxBarWidth =
    chartData.length > 20 ? 12 : chartData.length > 10 ? 20 : 44;

  return (
    <div className="w-full flex flex-col justify-between h-full">
      {/* ── Soft Pastel Minimal Stats Ribbon ─────────────────── */}
      {showStats && (
        <div
          className={
            ribbonClassName ||
            "mb-3 sm:mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-[#e9e9ee]/80 pb-3"
          }
        >
          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden py-0.5">
            {/* Total Metric Pill (Soft Neutral Memo) */}
            <div className="flex items-center gap-1.5 shrink-0 rounded-full bg-[#f1f3f7] px-3 py-1 border border-[#e9e9ee]/70 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">TOTAL</span>
              <span className="text-xs font-black text-slate-950 tabular-nums">{fmtNum(totalValue)}</span>
              <span className="text-xs font-medium text-slate-500">{label.toLowerCase()}</span>
            </div>

            {/* Peak Metric Pill (Soft Butter Yellow) */}
            <div className="flex items-center gap-1.5 shrink-0 rounded-full bg-[#fff9db] px-3 py-1 border border-amber-200/80 shadow-2xs">
              <span className="text-xs font-bold text-amber-900">Peak:</span>
              <span className="text-xs font-black text-slate-950 tabular-nums">{fmtNum(peakValue)}</span>
              <span className="text-xs text-amber-800 font-medium">/ day</span>
            </div>

            {/* Active Days Pill (Soft Periwinkle) */}
            {totalValue > 0 && (
              <div className="flex items-center gap-1.5 shrink-0 rounded-full bg-[#e2e2fc] px-3 py-1 text-xs font-bold text-indigo-950 shadow-2xs border border-indigo-200/60">
                <span>
                  {activeDays} {activeDays === 1 ? "day" : "days"} active
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Main View: Shadcn Bar Chart with LabelList ────────────────── */}
      <div className="w-full relative select-none">
          <ChartContainer
            config={chartConfig}
            className="aspect-auto h-[230px] sm:h-[260px] w-full"
          >
            <BarChart
              accessibilityLayer
              data={chartData}
              margin={{
                top: 24,
                right: 6,
                left: 6,
                bottom: 0,
              }}
              barCategoryGap="16%"
            >
              <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis
                dataKey="month"
                tickLine={false}
                tickMargin={10}
                axisLine={false}
                interval={chartData.length > 10 ? tickInterval : 0}
                tick={{ fill: "#64748b", fontSize: 11, fontWeight: 500 }}
              />
              <YAxis
                hide
                domain={[0, (dataMax: number) => (dataMax && dataMax > 0 ? Math.ceil(dataMax * 1.25) : 4)]}
                allowDecimals={false}
              />
              <ChartTooltip
                cursor={{ fill: "rgba(92, 103, 245, 0.05)", radius: 6 }}
                content={
                  <ChartTooltipContent
                    indicator="dot"
                    className="rounded-2xl border border-slate-200/90 bg-white/95 backdrop-blur-md shadow-xl px-3.5 py-2.5 min-w-[10rem]"
                    labelFormatter={(_, payload) => {
                      const item = payload?.[0]?.payload;
                      return (
                        <div className="text-[11px] font-semibold text-slate-500 mb-0.5">
                          {item?.fullDate || item?.month}
                        </div>
                      );
                    }}
                    formatter={(val) => (
                      <span className="font-black text-slate-950 tabular-nums text-xs">
                        {fmtNum(Number(val))}
                      </span>
                    )}
                  />
                }
              />
              <Bar
                dataKey="desktop"
                fill={barColor}
                radius={[8, 8, 4, 4]}
                maxBarSize={maxBarWidth}
              >
                <LabelList
                  position="top"
                  offset={10}
                  className="fill-slate-950 font-bold"
                  fontSize={11}
                  formatter={(val: any) => {
                    const num = Number(val);
                    if (!num || num <= 0) return "";
                    if (chartData.length > 10) {
                      return num === peakValue ? `${num}` : "";
                    }
                    return num.toLocaleString();
                  }}
                />
              </Bar>
            </BarChart>
          </ChartContainer>

          {/* Card Footer matching the user's mobile screenshot */}
          {!hideFooter && (
            <div className="flex flex-col items-start gap-1 border-t border-[#e9e9ee]/80 pt-3.5 mt-3 px-1.5 sm:px-0 text-xs">
              <div className="flex items-center gap-1.5 font-bold text-slate-950 text-sm">
                <span>
                  {totalValue > 0
                    ? `${fmtNum(totalValue)} total ${label.toLowerCase()} recorded`
                    : `Live ${label.toLowerCase()} tracking`}
                </span>
                {totalValue > 0 && <TrendingUp className="h-4 w-4 text-emerald-600" />}
              </div>
              <div className="text-slate-500 text-xs font-normal">
                Showing daily {label.toLowerCase()} for the last {activePoints.length} days
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

"use client";

import React, { useState } from "react";
import { TrendingUp } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
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
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

export const description = "A stacked bar chart with a legend";

const sampleChartData = [
  { month: "January", desktop: 186, mobile: 80 },
  { month: "February", desktop: 305, mobile: 200 },
  { month: "March", desktop: 237, mobile: 120 },
  { month: "April", desktop: 73, mobile: 190 },
  { month: "May", desktop: 209, mobile: 130 },
  { month: "June", desktop: 214, mobile: 140 },
];

const sampleChartConfig = {
  desktop: {
    label: "Desktop",
    color: "#5c67f5",
  },
  mobile: {
    label: "Mobile",
    color: "#a5b4fc",
  },
} satisfies ChartConfig;

export function ChartBarStacked({
  data,
  config,
}: {
  data?: typeof sampleChartData;
  config?: ChartConfig;
}) {
  const activeData = data || sampleChartData;
  const activeConfig = config || sampleChartConfig;

  return (
    <Card className="rounded-[26px] border border-[#e9e9ee] hover:border-black/30 bg-white shadow-2xs">
      <CardHeader>
        <CardTitle>Bar Chart - Stacked + Legend</CardTitle>
        <CardDescription>January - June 2024</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={activeConfig} className="aspect-auto h-[250px] w-full">
          <BarChart accessibilityLayer data={activeData}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis
              dataKey="month"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tick={{ fill: "#64748b", fontSize: 11, fontWeight: 500 }}
              tickFormatter={(value) => String(value).slice(0, 3)}
            />
            <ChartTooltip content={<ChartTooltipContent hideLabel />} />
            <ChartLegend content={<ChartLegendContent />} />
            <Bar
              dataKey="desktop"
              stackId="a"
              fill={activeConfig.desktop?.color || "#5c67f5"}
              radius={[0, 0, 4, 4]}
            />
            <Bar
              dataKey="mobile"
              stackId="a"
              fill={activeConfig.mobile?.color || "#a5b4fc"}
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm border-t border-[#e9e9ee] pt-4">
        <div className="flex gap-2 leading-none font-medium text-slate-900">
          Trending up by 5.2% this month <TrendingUp className="h-4 w-4 text-emerald-600" />
        </div>
        <div className="leading-none text-slate-500 text-xs">
          Showing total visitors for the last 6 months
        </div>
      </CardFooter>
    </Card>
  );
}

export type Series = {
  key: string;
  label: string;
  color: string;
  data: number[];
};

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

export function MultiLineChart({
  dates,
  series,
}: {
  dates: string[];
  series: Series[];
}) {
  const [hiddenSeries, setHiddenSeries] = useState<Record<string, boolean>>({});

  if (dates.length === 0) {
    return (
      <div className="flex h-56 items-center justify-center text-sm font-medium text-slate-400">
        No automation activity recorded for this period.
      </div>
    );
  }

  const toggleSeries = (key: string) => {
    setHiddenSeries((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Recharts formatted data for stacked bar chart
  const chartData = dates.map((date, idx) => {
    const row: Record<string, any> = {
      date,
      formattedDate: fmtDay(date),
      fullDate: fmtFullDate(date),
    };
    series.forEach((s) => {
      row[s.key] = s.data[idx] ?? 0;
    });
    return row;
  });

  const chartConfig: ChartConfig = {};
  series.forEach((s) => {
    chartConfig[s.key] = {
      label: s.label,
      color: s.color,
    };
  });

  const activeSeries = series.filter((s) => !hiddenSeries[s.key]);

  // Responsive tick interval for X-Axis to prevent overlap
  const tickInterval = chartData.length > 20 ? 4 : chartData.length > 10 ? 2 : 0;
  const maxBarWidth = chartData.length > 20 ? 12 : chartData.length > 10 ? 20 : 36;

  return (
    <div className="w-full flex flex-col justify-between h-full">
      {/* ── Metric Series Toggle Pills ────────────────────────── */}
      <div className="mb-3 sm:mb-4 flex flex-wrap items-center gap-1.5 sm:gap-2 text-xs">
        {series.map((s) => {
          const isHidden = hiddenSeries[s.key];
          const total = s.data.reduce((a, b) => a + b, 0);

          return (
            <button
              key={s.key}
              type="button"
              onClick={() => toggleSeries(s.key)}
              className={`group flex items-center gap-1.5 rounded-full px-2.5 sm:px-3 py-1 text-xs font-semibold transition-all duration-200 cursor-pointer shadow-2xs ${
                isHidden
                  ? "bg-slate-100/70 text-slate-400 line-through border border-transparent opacity-60"
                  : "bg-white text-slate-800 border border-[#e9e9ee] hover:border-black/30 hover:bg-slate-50/80"
              }`}
            >
              <span
                aria-hidden
                className="h-2 w-2 rounded-full transition-transform group-hover:scale-110"
                style={{ backgroundColor: s.color }}
              />
              <span>{s.label}</span>
              <span
                className={`ml-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums ${
                  isHidden ? "bg-slate-200 text-slate-400" : "bg-slate-100 text-slate-700"
                }`}
              >
                {fmtNum(total)}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Shadcn Stacked Bar Chart with Legend ──────────────── */}
      <div className="w-full relative select-none">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[230px] sm:h-[260px] w-full"
        >
          <BarChart
            accessibilityLayer
            data={chartData}
            margin={{ top: 16, right: 6, left: 6, bottom: 0 }}
            barCategoryGap="16%"
          >
            <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis
              dataKey="formattedDate"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              interval={chartData.length > 10 ? tickInterval : 0}
              tick={{ fill: "#64748b", fontSize: 11, fontWeight: 500 }}
            />
            <YAxis hide domain={[0, "auto"]} />
            <ChartTooltip
              cursor={{ fill: "rgba(92, 103, 245, 0.05)", radius: 6 }}
              content={
                <ChartTooltipContent
                  indicator="dot"
                  className="rounded-2xl border border-slate-200/90 bg-white/95 backdrop-blur-md shadow-xl px-3.5 py-2.5 min-w-[12rem]"
                  labelFormatter={(_, payload) => {
                    const item = payload?.[0]?.payload;
                    return (
                      <div className="text-[11px] font-semibold text-slate-500 mb-1 border-b border-slate-100 pb-1">
                        {item?.fullDate || ""}
                      </div>
                    );
                  }}
                  formatter={(value, name) => {
                    return (
                      <span className="font-bold text-slate-950 tabular-nums text-xs">
                        {fmtNum(Number(value))}
                      </span>
                    );
                  }}
                />
              }
            />
            <ChartLegend content={<ChartLegendContent />} />
            {activeSeries.map((s, idx) => {
              const isBottom = idx === 0;
              const isTop = idx === activeSeries.length - 1;
              const isOnly = activeSeries.length === 1;
              const radius: [number, number, number, number] = isOnly
                ? [6, 6, 6, 6]
                : isTop
                ? [6, 6, 0, 0]
                : isBottom
                ? [0, 0, 4, 4]
                : [0, 0, 0, 0];

              return (
                <Bar
                  key={s.key}
                  dataKey={s.key}
                  name={s.key}
                  stackId="a"
                  fill={s.color}
                  radius={radius}
                  maxBarSize={maxBarWidth}
                />
              );
            })}
          </BarChart>
        </ChartContainer>

        {/* Card Footer matching shadcn/ui exact pattern */}
        <div className="flex flex-col items-start gap-1 border-t border-[#e9e9ee]/80 pt-3.5 mt-3 text-xs px-1.5 sm:px-0">
          <div className="flex items-center gap-1.5 font-bold text-slate-950 text-sm">
            <span>Trending up by 5.2% this period</span>
            <TrendingUp className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="text-slate-500 text-xs font-normal">
            Showing total automated actions for the last {dates.length} days
          </div>
        </div>
      </div>
    </div>
  );
}

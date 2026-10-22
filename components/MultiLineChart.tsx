"use client";

import React from "react";
import { TrendingUp } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

export const description = "A stacked bar chart with a legend";

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

/**
 * Multi-Series Stacked Bar Chart with Legend
 * Matches shadcn/ui "Bar Chart - Stacked + Legend" exact visual pattern
 * Always maps real post timeline data and displays zero-baseline cleanly.
 */
export function MultiLineChart({
  dates,
  series,
  hideLegend = false,
  hideFooter = true,
}: {
  dates?: string[];
  series?: Series[];
  hideLegend?: boolean;
  hideFooter?: boolean;
}) {
  // Generate real fallback dates ending today if none provided (never fake sample months)
  const effectiveDates = React.useMemo(() => {
    if (dates && dates.length > 0) return dates;
    const now = Date.now();
    const DAY = 86400000;
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(now - (6 - i) * DAY);
      return d.toISOString().slice(0, 10);
    });
  }, [dates]);

  // Default series matching the application's real metrics if none provided
  const effectiveSeries = React.useMemo(() => {
    if (series && series.length > 0) return series;
    return [
      {
        key: "comments",
        label: "Comments",
        color: "#2563eb",
        data: new Array(effectiveDates.length).fill(0),
      },
      {
        key: "dmsSent",
        label: "DMs Delivered",
        color: "#60a5fa",
        data: new Array(effectiveDates.length).fill(0),
      },
    ];
  }, [series, effectiveDates.length]);

  // Real chart data mapped per day
  const chartData = React.useMemo(() => {
    return effectiveDates.map((date, idx) => {
      const row: Record<string, any> = {
        date,
        dateLabel: fmtDay(date),
        fullDate: fmtFullDate(date),
      };
      effectiveSeries.forEach((s) => {
        row[s.key] = s.data?.[idx] ?? 0;
      });
      return row;
    });
  }, [effectiveDates, effectiveSeries]);

  const chartConfig = React.useMemo(() => {
    return effectiveSeries.reduce((acc, s) => {
      acc[s.key] = { label: s.label, color: s.color };
      return acc;
    }, {} as ChartConfig);
  }, [effectiveSeries]);

  const activeSeriesKeys = React.useMemo(() => {
    return effectiveSeries.map((s) => s.key);
  }, [effectiveSeries]);

  // Total sum of all actions across all series
  const totalActions = React.useMemo(() => {
    return effectiveSeries.reduce((acc, s) => {
      const sum = (s.data || []).reduce((a, b) => a + (b || 0), 0);
      return acc + sum;
    }, 0);
  }, [effectiveSeries]);

  // Responsive interval to ensure clean, non-overlapping date ticks
  const tickInterval =
    chartData.length > 20 ? 4 : chartData.length > 10 ? 2 : 0;

  // Max bar width based on number of days (thinner on 30 days, thicker on 7 days)
  const maxBarWidth =
    chartData.length > 20 ? 14 : chartData.length > 10 ? 24 : 48;

  return (
    <div className="w-full flex flex-col justify-between h-full select-none">
      <div className="w-full relative">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[240px] sm:h-[270px] w-full"
        >
          <BarChart
            accessibilityLayer
            data={chartData}
            margin={{ top: 16, right: 8, left: 8, bottom: 4 }}
          >
            <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis
              dataKey="dateLabel"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              interval={chartData.length > 7 ? tickInterval : 0}
              tick={{ fill: "#64748b", fontSize: 11, fontWeight: 500 }}
            />
            <YAxis
              hide
              domain={[0, (dataMax: number) => (dataMax && dataMax > 0 ? Math.ceil(dataMax * 1.25) : 4)]}
              allowDecimals={false}
            />
            <ChartTooltip
              cursor={{ fill: "rgba(0, 0, 0, 0.04)", radius: 4 }}
              content={
                <ChartTooltipContent
                  labelFormatter={(_, payload) => {
                    const item = payload?.[0]?.payload;
                    return (
                      <div className="text-[11px] font-semibold text-slate-500 mb-0.5">
                        {item?.fullDate || item?.dateLabel || item?.date}
                      </div>
                    );
                  }}
                />
              }
            />
            {!hideLegend && <ChartLegend content={<ChartLegendContent className="pt-3" />} />}
            {activeSeriesKeys.map((key, idx) => {
              const isFirst = idx === 0;
              const isLast = idx === activeSeriesKeys.length - 1;
              const isOnly = activeSeriesKeys.length === 1;
              const radius: [number, number, number, number] = isOnly
                ? [4, 4, 4, 4]
                : isLast
                ? [4, 4, 0, 0]
                : isFirst
                ? [0, 0, 4, 4]
                : [0, 0, 0, 0];

              const fill = chartConfig[key]?.color || (idx === 0 ? "#60a5fa" : "#2563eb");

              return (
                <Bar
                  key={key}
                  dataKey={key}
                  name={(chartConfig[key]?.label as string) || key}
                  stackId="a"
                  fill={fill}
                  radius={radius}
                  maxBarSize={maxBarWidth}
                />
              );
            })}
          </BarChart>
        </ChartContainer>

        {!hideFooter && (
          <div className="flex flex-col items-start gap-1 border-t border-[#e9e9ee]/80 pt-3.5 mt-3 text-xs px-1.5 sm:px-0">
            <div className="flex items-center gap-1.5 font-bold text-slate-950 text-sm">
              <span>
                {totalActions > 0
                  ? `${fmtNum(totalActions)} total actions recorded`
                  : "Live post activity timeline"}
              </span>
              {totalActions > 0 && <TrendingUp className="h-4 w-4 text-emerald-600" />}
            </div>
            <div className="text-slate-500 text-xs font-normal">
              Showing daily activity for {chartData.length} days (
              {chartData[0]?.dateLabel} – {chartData[chartData.length - 1]?.dateLabel})
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Backward compatibility export
 */
export function ChartBarStacked({
  data,
  config,
}: {
  data?: any;
  config?: ChartConfig;
}) {
  return <MultiLineChart />;
}

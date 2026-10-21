"use client";

import React, { useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "./ui/chart";

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

  // Recharts formatted data
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

  return (
    <div className="w-full flex flex-col justify-between h-full">
      {/* ── Apple-Themed Interactive Series Toggles ────────────────────────── */}
      <div className="mb-4 flex flex-wrap items-center gap-2 text-xs">
        {series.map((s) => {
          const isHidden = hiddenSeries[s.key];
          const total = s.data.reduce((a, b) => a + b, 0);

          return (
            <button
              key={s.key}
              type="button"
              onClick={() => toggleSeries(s.key)}
              className={`group flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all duration-200 cursor-pointer shadow-2xs ${
                isHidden
                  ? "bg-slate-100/70 text-slate-400 line-through border border-transparent opacity-60"
                  : "bg-white text-slate-800 border border-[#e9e9ee] hover:border-black/30 hover:bg-slate-50/80"
              }`}
            >
              <span
                aria-hidden
                className="h-2.5 w-2.5 rounded-full transition-transform group-hover:scale-110"
                style={{ backgroundColor: s.color }}
              />
              <span>{s.label}</span>
              <span
                className={`ml-0.5 rounded-md px-1.5 py-0.5 text-[10px] font-bold tabular-nums ${
                  isHidden ? "bg-slate-200 text-slate-400" : "bg-slate-100 text-slate-700"
                }`}
              >
                {fmtNum(total)}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Shadcn Recharts Multi-Area Chart ───────────────────────────────── */}
      <div className="w-full relative select-none">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[240px] sm:h-[270px] w-full"
        >
          <AreaChart
            accessibilityLayer
            data={chartData}
            margin={{ top: 12, right: 10, left: -20, bottom: 0 }}
          >
            <defs>
              {series.map((s) => (
                <linearGradient
                  key={`apple-grad-${s.key}`}
                  id={`apple-grad-${s.key}`}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="0%" stopColor={s.color} stopOpacity={0.28} />
                  <stop offset="65%" stopColor={s.color} stopOpacity={0.06} />
                  <stop offset="100%" stopColor={s.color} stopOpacity={0.0} />
                </linearGradient>
              ))}
            </defs>

            {/* Subtle Horizontal Grid */}
            <CartesianGrid
              vertical={false}
              strokeDasharray="3 3"
              stroke="#f1f5f9"
            />

            {/* X-Axis Dates */}
            <XAxis
              dataKey="formattedDate"
              tickLine={false}
              axisLine={false}
              tickMargin={10}
              tick={{ fill: "#64748b", fontSize: 11, fontWeight: 500 }}
            />

            {/* Y-Axis Counts */}
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              allowDecimals={false}
              tick={{ fill: "#94a3b8", fontSize: 11, fontWeight: 500 }}
              tickFormatter={(val) =>
                Intl.NumberFormat(undefined, { notation: "compact" }).format(val)
              }
            />

            {/* Frosted Glass Tooltip */}
            <ChartTooltip
              cursor={{
                stroke: "#cbd5e1",
                strokeWidth: 1.25,
                strokeDasharray: "4 4",
              }}
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
                  formatter={(value, name) => (
                    <span className="font-bold text-slate-950 tabular-nums text-xs">
                      {fmtNum(Number(value))}
                    </span>
                  )}
                />
              }
            />

            {/* Active Multi-Series Areas */}
            {activeSeries.map((s) => (
              <Area
                key={s.key}
                dataKey={s.key}
                name={s.key}
                type="natural"
                fill={`url(#apple-grad-${s.key})`}
                stroke={s.color}
                strokeWidth={2.25}
                strokeLinecap="round"
                strokeLinejoin="round"
                activeDot={{
                  r: 5,
                  fill: s.color,
                  stroke: "#ffffff",
                  strokeWidth: 2,
                  className: "filter drop-shadow-sm",
                }}
              />
            ))}
          </AreaChart>
        </ChartContainer>

        {/* Micro Subtext */}
        <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400 px-1">
          <span className="font-medium text-slate-400">
            Click any metric pill above to isolate or compare trends
          </span>
          <span className="font-semibold text-slate-500">
            {activeSeries.length} active {activeSeries.length === 1 ? "metric" : "metrics"}
          </span>
        </div>
      </div>
    </div>
  );
}

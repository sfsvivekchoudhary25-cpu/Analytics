"use client";

import React from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  XAxis,
  YAxis,
} from "recharts";
import { Card, Skeleton } from "antd";
import {
  HeartOutlined,
  CommentOutlined,
  ShareAltOutlined,
  BookOutlined,
} from "@ant-design/icons";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "./ui/chart";

export type EngagementTotals = {
  likes?: number;
  comments?: number;
  shares?: number;
  saves?: number;
  reach?: number;
  total_interactions?: number;
};

interface EngagementBarChartProps {
  totals: EngagementTotals;
  days?: number;
  loading?: boolean;
}

const compact = (n: number | null | undefined) =>
  n == null
    ? "—"
    : Intl.NumberFormat(undefined, { notation: "compact", maximumFractionDigits: 1 }).format(n);

function EngagementCardSkeleton() {
  return (
    <div className="flex-1 flex flex-col justify-between space-y-3">
      <div className="space-y-2.5">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="rounded-2xl border border-slate-100 bg-slate-50/60 p-3 space-y-2"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <Skeleton.Avatar active size={28} shape="square" className="!rounded-lg" />
                <Skeleton.Input active size="small" style={{ width: 80, height: 14 }} />
              </div>
              <div className="flex items-center gap-1.5">
                <Skeleton.Input active size="small" style={{ width: 36, height: 14 }} />
                <Skeleton.Input active size="small" style={{ width: 32, height: 12 }} />
              </div>
            </div>
            <Skeleton.Button active block size="small" style={{ height: 6 }} className="!rounded-full" />
          </div>
        ))}
      </div>
      <div className="flex gap-2.5 border-t border-[#e9e9ee] pt-3">
        <Skeleton.Button active className="!flex-1 !h-16 !rounded-2xl" />
        <Skeleton.Button active className="!flex-1 !h-16 !rounded-2xl" />
      </div>
    </div>
  );
}

export function EngagementBarChart({
  totals,
  days = 7,
  loading = false,
}: EngagementBarChartProps) {
  const THEME_COLOR = "#5c67f5";

  const engagementItems = [
    {
      key: "likes",
      label: "Likes",
      value: totals.likes ?? 0,
      fill: THEME_COLOR,
      badgeBg: "bg-[#e2e2fc]/60 border-[#e2e2fc]",
      icon: <HeartOutlined className="text-sm text-[#4f46e5]" />,
    },
    {
      key: "comments",
      label: "Comments",
      value: totals.comments ?? 0,
      fill: THEME_COLOR,
      badgeBg: "bg-[#e2e2fc]/60 border-[#e2e2fc]",
      icon: <CommentOutlined className="text-sm text-[#4f46e5]" />,
    },
    {
      key: "shares",
      label: "Shares",
      value: totals.shares ?? 0,
      fill: THEME_COLOR,
      badgeBg: "bg-[#e2e2fc]/60 border-[#e2e2fc]",
      icon: <ShareAltOutlined className="text-sm text-[#4f46e5]" />,
    },
    {
      key: "saves",
      label: "Saves",
      value: totals.saves ?? 0,
      fill: THEME_COLOR,
      badgeBg: "bg-[#e2e2fc]/60 border-[#e2e2fc]",
      icon: <BookOutlined className="text-sm text-[#4f46e5]" />,
    },
  ];

  const engTotal = engagementItems.reduce((acc, curr) => acc + curr.value, 0);
  const engagementRate = totals.reach
    ? Math.round(((totals.total_interactions ?? 0) / totals.reach) * 1000) / 10
    : null;
  const saveRate = totals.reach
    ? Math.round(((totals.saves ?? 0) / totals.reach) * 1000) / 10
    : null;

  // Chart data formatting with calculated percentages
  const chartData = engagementItems.map((item) => {
    const pctNumber = engTotal > 0 ? Math.round((item.value / engTotal) * 100) : 0;
    return {
      key: item.key,
      name: item.label,
      value: item.value,
      pctNumber,
      pct: `${pctNumber}%`,
      fill: item.fill,
    };
  });

  const chartConfig = {
    value: {
      label: "Interactions",
      color: THEME_COLOR,
    },
    likes: {
      label: "Likes",
      color: THEME_COLOR,
    },
    comments: {
      label: "Comments",
      color: THEME_COLOR,
    },
    shares: {
      label: "Shares",
      color: THEME_COLOR,
    },
    saves: {
      label: "Saves",
      color: THEME_COLOR,
    },
  } satisfies ChartConfig;

  const maxVal = Math.max(1, ...chartData.map((d) => d.value));

  return (
    <Card
      className="!rounded-[26px] !border-[#e9e9ee] hover:!border-black/30 !bg-white !shadow-2xs transition-all flex flex-col h-full overflow-hidden"
      styles={{ body: { padding: "0px", flex: 1, display: "flex", flexDirection: "column" } }}
    >
      {/* ── Header ────────────────────────────────────────── */}
      <div className="px-5 sm:px-6 py-4 border-b border-[#e9e9ee] flex items-center justify-between gap-3 bg-white">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h2 className="text-sm sm:text-[15px] font-bold text-slate-950 truncate">
              Engagement Breakdown
            </h2>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-[#e2e2fc]/60 text-[#3730a3] text-[10px] font-bold uppercase tracking-wider">
              Past {days} days
            </span>
          </div>
          <p className="text-xs font-normal text-slate-500 mt-0.5 truncate">
            Total {compact(engTotal)} actions over {days} days
          </p>
        </div>
      </div>

      {/* ── Card Body (5px on mobile, 24px on desktop) ───── */}
      <div className="p-[5px] sm:p-6 flex-1 flex flex-col justify-between">
        {loading ? (
          <EngagementCardSkeleton />
        ) : (
          <div className="flex-1 flex flex-col justify-between space-y-3">
            {/* ── Chart Bars View ────────────────────────────── */}
            <div className="flex-1 flex flex-col justify-between">
              <ChartContainer
                config={chartConfig}
                className="aspect-auto h-[220px] sm:h-[240px] w-full"
              >
                <BarChart
                  accessibilityLayer
                  data={chartData}
                  margin={{ top: 22, right: 10, left: 10, bottom: 4 }}
                >
                  <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis
                    dataKey="name"
                    tickLine={false}
                    tickMargin={10}
                    axisLine={false}
                    tick={{ fill: "#334155", fontSize: 12, fontWeight: 700 }}
                  />
                  <YAxis hide domain={[0, Math.ceil(maxVal * 1.25)]} />
                  <ChartTooltip
                    cursor={{ fill: "rgba(0,0,0,0.03)" }}
                    content={
                      <ChartTooltipContent
                        indicator="dot"
                        className="rounded-2xl border border-slate-200/90 bg-white/95 backdrop-blur-md shadow-xl px-3.5 py-2.5 min-w-[9rem]"
                        labelFormatter={(_, payload) => {
                          const item = payload?.[0]?.payload;
                          return (
                            <div className="text-xs font-bold text-slate-800">
                              {item?.name}
                            </div>
                          );
                        }}
                        formatter={(val, _, item) => (
                          <div className="flex items-center justify-between gap-3 w-full">
                            <span className="font-black text-slate-950 tabular-nums text-xs">
                              {Number(val).toLocaleString()}
                            </span>
                            <span className="text-[11px] font-bold text-slate-500">
                              {item?.payload?.pct}
                            </span>
                          </div>
                        )}
                      />
                    }
                  />
                  <Bar dataKey="value" radius={[8, 8, 4, 4]} maxBarSize={48}>
                    <LabelList
                      position="top"
                      offset={8}
                      className="fill-slate-950 font-black text-xs"
                      fontSize={12}
                      formatter={(val: any) => {
                        const num = Number(val);
                        return num > 0 ? num.toLocaleString() : "0";
                      }}
                    />
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ChartContainer>
            </div>

            {/* ── Bottom Rate Accent Boxes (Soft Pastel Minimal - Borderless) ── */}
            {(engagementRate != null || saveRate != null) && (
              <div className="flex gap-2.5 border-t border-[#e9e9ee] pt-3">
                {engagementRate != null && (
                  <div
                    style={{ backgroundColor: "#e2e2fc" }}
                    className="flex-1 rounded-2xl p-3 text-center border-0 shadow-xs"
                  >
                    <div className="text-base font-black text-slate-950 tabular-nums">
                      {engagementRate}%
                    </div>
                    <div className="text-[11px] text-slate-700 font-bold mt-0.5">
                      Engagement Rate
                    </div>
                  </div>
                )}
                {saveRate != null && (
                  <div
                    style={{ backgroundColor: "#fff9db" }}
                    className="flex-1 rounded-2xl p-3 text-center border-0 shadow-xs"
                  >
                    <div className="text-base font-black text-slate-950 tabular-nums">
                      {saveRate}%
                    </div>
                    <div className="text-[11px] text-slate-700 font-bold mt-0.5">
                      Save Rate
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}

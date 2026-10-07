"use client";

import { useState } from "react";
import { computeIntegerTicks, buildMonotoneSpline } from "./LineChart";

export type Series = {
  key: string;
  label: string;
  color: string;
  data: number[];
};

const W = 760;
const H = 260;
const M = { l: 44, r: 16, t: 16, b: 28 };

const fmtDay = (iso: string) => {
  if (!iso) return "";
  const d = new Date(iso.includes("T") ? iso : iso + "T00:00:00");
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
};

const fmtNum = (n: number) => n.toLocaleString();


export function MultiLineChart({
  dates,
  series,
}: {
  dates: string[];
  series: Series[];
}) {
  const [hover, setHover] = useState<number | null>(null);
  const [hiddenSeries, setHiddenSeries] = useState<Record<string, boolean>>({});

  if (dates.length === 0) {
    return (
      <div className="flex h-56 items-center justify-center text-sm text-slate-400">
        No data available for this period.
      </div>
    );
  }

  const activeSeries = series.filter((s) => !hiddenSeries[s.key]);
  const maxValue = Math.max(0, ...activeSeries.flatMap((s) => s.data));
  const { yMax, ticks } = computeIntegerTicks(maxValue);

  const x = (i: number) =>
    M.l + (dates.length === 1 ? 0 : (i / (dates.length - 1)) * (W - M.l - M.r));
  const y = (v: number) => M.t + (1 - v / yMax) * (H - M.t - M.b);

  const xLabels = [
    0,
    Math.floor((dates.length - 1) / 2),
    dates.length - 1,
  ];

  function nearest(e: React.PointerEvent<SVGSVGElement>) {
    const box = e.currentTarget.getBoundingClientRect();
    const px = ((e.clientX - box.left) / box.width) * W;
    const i = Math.round(
      ((px - M.l) / (W - M.l - M.r)) * (dates.length - 1)
    );
    setHover(Math.min(dates.length - 1, Math.max(0, i)));
  }

  const toggleSeries = (key: string) => {
    setHiddenSeries((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div>
      {/* Legend with interactive toggles */}
      <div className="mb-4 flex flex-wrap items-center gap-2 text-xs">
        {series.map((s) => {
          const isHidden = hiddenSeries[s.key];
          return (
            <button
              key={s.key}
              type="button"
              onClick={() => toggleSeries(s.key)}
              className={`flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium transition-all ${
                isHidden
                  ? "bg-slate-100 text-slate-400 line-through opacity-60"
                  : "bg-slate-50 text-slate-700 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/60"
              }`}
            >
              <span
                aria-hidden
                className="h-2 w-2 rounded-full transition-transform"
                style={{ background: s.color }}
              />
              {s.label}
            </button>
          );
        })}
      </div>

      <div className="relative">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full touch-none overflow-visible outline-none select-none"
          role="img"
          aria-label="Messages Over Time Chart"
          onPointerMove={nearest}
          onPointerLeave={() => setHover(null)}
        >
          <defs>
            {series.map((s) => (
              <linearGradient
                key={`grad-${s.key}`}
                id={`grad-${s.key}`}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="0%" stopColor={s.color} stopOpacity="0.16" />
                <stop offset="100%" stopColor={s.color} stopOpacity="0.0" />
              </linearGradient>
            ))}
          </defs>

          {/* Grid lines and Y axis ticks */}
          {ticks.map((t) => (
            <g key={t}>
              <line
                x1={M.l}
                x2={W - M.r}
                y1={y(t)}
                y2={y(t)}
                stroke="#e2e8f0"
                strokeWidth={1}
                strokeDasharray={t === 0 ? "none" : "3 3"}
              />
              <text
                x={M.l - 10}
                y={y(t) + 4}
                textAnchor="end"
                fontSize={11}
                fill="#94a3b8"
                className="tabular-nums font-medium"
              >
                {Intl.NumberFormat(undefined, { notation: "compact" }).format(t)}
              </text>
            </g>
          ))}

          {/* X axis labels */}
          {xLabels.map((i, k) => (
            <text
              key={i}
              x={x(i)}
              y={H - 6}
              textAnchor={k === 0 ? "start" : k === 2 ? "end" : "middle"}
              fontSize={11}
              fill="#94a3b8"
              className="font-medium"
            >
              {fmtDay(dates[i])}
            </text>
          ))}

          {/* Lines & Gradients */}
          {activeSeries.map((s) => {
            const points = s.data.map((v, i) => ({ x: x(i), y: y(v), val: v }));
            const zeroY = y(0);
            const { line: linePath, area: areaPath } = buildMonotoneSpline(points, zeroY);

            return (
              <g key={s.key}>
                <path d={areaPath} fill={`url(#grad-${s.key})`} />
                <path
                  d={linePath}
                  fill="none"
                  stroke={s.color}
                  strokeWidth={2.5}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
              </g>
            );
          })}


          {/* Hover crosshair line */}
          {hover !== null && (
            <line
              x1={x(hover)}
              x2={x(hover)}
              y1={M.t}
              y2={H - M.b}
              stroke="#64748b"
              strokeWidth={1.2}
              strokeDasharray="4 4"
            />
          )}

          {/* Hover points on curves */}
          {hover !== null &&
            activeSeries.map((s) => (
              <g key={s.key}>
                <circle
                  cx={x(hover)}
                  cy={y(s.data[hover])}
                  r={5}
                  fill={s.color}
                  stroke="#ffffff"
                  strokeWidth={2}
                  className="transition-all"
                />
                <circle
                  cx={x(hover)}
                  cy={y(s.data[hover])}
                  r={8}
                  fill={s.color}
                  opacity={0.2}
                />
              </g>
            ))}
        </svg>

        {/* Ant Design styled floating glassmorphism tooltip */}
        {hover !== null && (
          <div
            className="pointer-events-none absolute top-1 z-20 min-w-44 rounded-xl border border-slate-200/80 bg-white/95 p-3 shadow-lg backdrop-blur-md transition-all duration-75"
            style={{
              left: `${(x(hover) / W) * 100}%`,
              transform: `translateX(${
                hover > dates.length * 0.6 ? "calc(-100% - 12px)" : "12px"
              })`,
            }}
          >
            <div className="mb-2 border-b border-slate-100 pb-1.5 text-xs font-semibold text-slate-800">
              {fmtDay(dates[hover])}
            </div>
            <div className="space-y-1.5">
              {activeSeries.map((s) => (
                <div
                  key={s.key}
                  className="flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <span
                      aria-hidden
                      className="h-2 w-2 rounded-full"
                      style={{ background: s.color }}
                    />
                    <span className="truncate">{s.label}</span>
                  </div>
                  <span className="font-semibold tabular-nums text-slate-900">
                    {fmtNum(s.data[hover])}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

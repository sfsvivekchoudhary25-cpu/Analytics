"use client";

import { useState, useId } from "react";
import { Segmented, Tag } from "antd";
import {
  LineChartOutlined,
  TableOutlined,
  RiseOutlined,
  ThunderboltOutlined,
} from "@ant-design/icons";

export type Point = { date: string; value: number };

const W = 640;
const H = 220;
const M = { l: 40, r: 16, t: 16, b: 30 };

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
 * Computes aesthetically pleasing integer ticks for discrete counts.
 * Guarantees that tick marks are ALWAYS whole numbers (never 0.25, 0.5, 0.75).
 */
export function computeIntegerTicks(maxValue: number): { yMax: number; ticks: number[] } {
  if (maxValue <= 0) {
    return { yMax: 4, ticks: [0, 1, 2, 3, 4] };
  }
  if (maxValue === 1) {
    // With max 1, give headroom up to 2 so the peak is at 50% height and ticks are [0, 1, 2]
    return { yMax: 2, ticks: [0, 1, 2] };
  }
  if (maxValue === 2) {
    return { yMax: 2, ticks: [0, 1, 2] };
  }
  if (maxValue <= 4) {
    return { yMax: 4, ticks: [0, 1, 2, 3, 4] };
  }
  if (maxValue <= 6) {
    return { yMax: 6, ticks: [0, 2, 4, 6] };
  }
  if (maxValue <= 10) {
    return { yMax: 10, ticks: [0, 2, 4, 6, 8, 10] };
  }

  // For larger values:
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
 * Generates a monotone cubic spline (Fritsch-Carlson) that strictly preserves monotonicity,
 * guarantees that flat baseline (val = 0) stays completely horizontal at zeroY,
 * and ensures that control points NEVER dip below zeroY (convex hull guarantee).
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

  // 1. Calculate secant slopes (delta)
  const deltas: number[] = [];
  const dxs: number[] = [];
  for (let i = 0; i < n - 1; i++) {
    const dx = pts[i + 1].x - pts[i].x;
    dxs.push(dx);
    deltas.push(dx === 0 ? 0 : (pts[i + 1].y - pts[i].y) / dx);
  }

  // 2. Initialize tangents (m)
  const m: number[] = new Array(n).fill(0);
  m[0] = deltas[0];
  m[n - 1] = deltas[n - 2];

  for (let i = 1; i < n - 1; i++) {
    const dPrev = deltas[i - 1];
    const dNext = deltas[i];
    // If either slope is 0 or slopes have opposite signs (local extremum), tangent is 0
    if (dPrev * dNext <= 0 || pts[i].val === 0) {
      m[i] = 0;
    } else {
      m[i] = (dPrev + dNext) / 2;
    }
  }

  // Tangents at endpoints must be 0 if endpoint value is 0
  if (pts[0].val === 0) m[0] = 0;
  if (pts[n - 1].val === 0) m[n - 1] = 0;

  // 3. Fritsch-Carlson monotonicity condition
  for (let i = 0; i < n - 1; i++) {
    const delta = deltas[i];
    if (Math.abs(delta) < 1e-9) {
      m[i] = 0;
      m[i + 1] = 0;
    } else {
      const alpha = m[i] / delta;
      const beta = m[i + 1] / delta;
      if (alpha < 0) m[i] = 0;
      if (beta < 0) m[i + 1] = 0;
      const dist = alpha * alpha + beta * beta;
      if (dist > 9) {
        const tau = 3 / Math.sqrt(dist);
        m[i] = tau * alpha * delta;
        m[i + 1] = tau * beta * delta;
      }
    }
  }

  // 4. Construct SVG cubic bezier path with strict baseline bounding
  let line = `M ${pts[0].x.toFixed(1)},${pts[0].y.toFixed(1)}`;

  for (let i = 0; i < n - 1; i++) {
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const dx = dxs[i];

    const cp1x = p1.x + dx / 3;
    let cp1y = p1.y + (m[i] * dx) / 3;

    const cp2x = p2.x - dx / 3;
    let cp2y = p2.y - (m[i + 1] * dx) / 3;

    // Strict baseline clamp: in SVG, zeroY is the bottom.
    // Coordinates with Y > zeroY would dip below the baseline.
    // Clamp control points so they can NEVER exceed zeroY.
    cp1y = Math.min(zeroY, cp1y);
    cp2y = Math.min(zeroY, cp2y);

    // Monotonicity clamp between p1 and p2:
    if (p1.val <= p2.val) {
      // Ascending: y decreases from zeroY to peakY (top)
      cp1y = Math.min(p1.y, Math.max(p2.y, cp1y));
      cp2y = Math.min(p1.y, Math.max(p2.y, cp2y));
    } else {
      // Descending: y increases from peakY to zeroY (bottom)
      cp1y = Math.max(p1.y, Math.min(p2.y, cp1y));
      cp2y = Math.max(p1.y, Math.min(p2.y, cp2y));
    }

    // Final safety clamp against baseline
    cp1y = Math.min(zeroY, cp1y);
    cp2y = Math.min(zeroY, cp2y);

    line += ` C ${cp1x.toFixed(1)},${cp1y.toFixed(1)} ${cp2x.toFixed(1)},${cp2y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`;
  }

  const first = pts[0];
  const last = pts[n - 1];
  const area = `${line} L ${last.x.toFixed(1)},${zeroY.toFixed(1)} L ${first.x.toFixed(1)},${zeroY.toFixed(1)} Z`;

  return { line, area };
}

function generateSmoothSpline(
  pts: { x: number; y: number; val: number }[],
  zeroY: number
) {
  return buildMonotoneSpline(pts, zeroY);
}


export function LineChart({
  data,
  label,
  color = "#2563eb",
  showStats = true,
}: {
  data: Point[];
  label: string;
  color?: string;
  showStats?: boolean;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const [mode, setMode] = useState<"chart" | "table">("chart");
  const chartId = useId().replace(/:/g, "");

  if (data.length === 0) {
    return (
      <div className="flex h-48 flex-col items-center justify-center text-center">
        <LineChartOutlined className="text-3xl text-slate-300" />
        <p className="mt-2 text-sm text-slate-400">No data recorded for this period.</p>
      </div>
    );
  }

  const totalValue = data.reduce((acc, d) => acc + d.value, 0);
  const peakValue = Math.max(...data.map((d) => d.value));
  const activeDays = data.filter((d) => d.value > 0).length;
  const avgValue = (totalValue / data.length).toFixed(totalValue % data.length === 0 ? 0 : 1);

  const { yMax, ticks } = computeIntegerTicks(peakValue);

  const x = (i: number) =>
    M.l + (data.length === 1 ? 0 : (i / (data.length - 1)) * (W - M.l - M.r));
  const y = (v: number) => M.t + (1 - v / yMax) * (H - M.t - M.b);
  const zeroY = y(0);

  const points = data.map((d, i) => ({
    x: x(i),
    y: y(d.value),
    val: d.value,
    date: d.date,
  }));

  const { line, area } = generateSmoothSpline(points, zeroY);

  // Compute balanced X-axis date indices
  const getXIndices = (len: number) => {
    if (len <= 1) return [0];
    if (len <= 7) {
      const step = Math.max(1, Math.floor((len - 1) / 3));
      const res = [0];
      for (let i = step; i < len - 1; i += step) res.push(i);
      res.push(len - 1);
      return Array.from(new Set(res));
    }
    // For 14 - 30 days: show 4 to 5 evenly spaced labels
    const step = (len - 1) / 4;
    return [
      0,
      Math.round(step),
      Math.round(step * 2),
      Math.round(step * 3),
      len - 1,
    ];
  };

  const xIndices = getXIndices(data.length);

  function nearest(e: React.PointerEvent<SVGSVGElement>) {
    const box = e.currentTarget.getBoundingClientRect();
    const px = ((e.clientX - box.left) / box.width) * W;
    const i = Math.round(((px - M.l) / (W - M.l - M.r)) * (data.length - 1));
    setHover(Math.min(data.length - 1, Math.max(0, i)));
  }

  function onKey(e: React.KeyboardEvent) {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    e.preventDefault();
    setHover((h) => {
      const next = (h ?? data.length - 1) + (e.key === "ArrowRight" ? 1 : -1);
      return Math.min(data.length - 1, Math.max(0, next));
    });
  }

  const h = hover === null ? null : data[hover];
  const hPoint = hover === null ? null : points[hover];

  const gradAreaId = `chart-area-grad-${chartId}`;
  const gradStrokeId = `chart-stroke-grad-${chartId}`;
  const filterGlowId = `chart-glow-${chartId}`;

  return (
    <div className="w-full">
      {/* ── Subheader / Control Ribbon ────────────────────────────────────── */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
        {showStats ? (
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5 rounded-lg bg-slate-50 px-2.5 py-1 border border-slate-100">
              <span className="text-slate-400">Total:</span>
              <span className="font-bold text-slate-800">{fmtNum(totalValue)}</span>
              <span className="text-slate-400 font-normal">{label.toLowerCase()}</span>
            </div>

            <div className="hidden sm:flex items-center gap-1.5 rounded-lg bg-slate-50 px-2.5 py-1 border border-slate-100">
              <RiseOutlined className="text-blue-500" />
              <span className="text-slate-400">Peak:</span>
              <span className="font-bold text-slate-800">{fmtNum(peakValue)}</span>
              <span className="text-slate-400 font-normal">/ day</span>
            </div>

            {totalValue > 0 && (
              <Tag
                variant="filled"
                className="!m-0 !rounded-full !bg-emerald-50 !text-emerald-700 !border !border-emerald-200/60 !text-[11px] !font-medium"
              >
                {activeDays} {activeDays === 1 ? "day" : "days"} active
              </Tag>
            )}
          </div>
        ) : (
          <div />
        )}

        <Segmented
          size="small"
          value={mode}
          onChange={(val) => setMode(val as "chart" | "table")}
          options={[
            {
              label: "Chart",
              value: "chart",
              icon: <LineChartOutlined />,
            },
            {
              label: "Table",
              value: "table",
              icon: <TableOutlined />,
            },
          ]}
          className="!rounded-lg !bg-slate-100 !p-0.5 text-xs"
        />
      </div>

      {mode === "table" ? (
        <div className="max-h-64 overflow-y-auto rounded-xl border border-slate-200/90 shadow-sm bg-white">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-slate-50/95 backdrop-blur-sm text-left font-medium text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-4 py-2.5">Date</th>
                <th className="px-4 py-2.5 text-right">{label}</th>
                <th className="px-4 py-2.5 text-right">% of Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 tabular-nums">
              {data.map((d) => {
                const pct = totalValue > 0 ? ((d.value / totalValue) * 100).toFixed(0) : "0";
                const isNonZero = d.value > 0;
                return (
                  <tr
                    key={d.date}
                    className={`transition-colors hover:bg-slate-50/80 ${
                      isNonZero ? "bg-blue-50/20 font-medium" : ""
                    }`}
                  >
                    <td className="px-4 py-2 text-slate-700">{fmtFullDate(d.date)}</td>
                    <td className="px-4 py-2 text-right">
                      {isNonZero ? (
                        <span className="inline-flex items-center gap-1.5 font-semibold text-blue-600">
                          <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                          {fmtNum(d.value)}
                        </span>
                      ) : (
                        <span className="text-slate-400">0</span>
                      )}
                    </td>
                    <td className="px-4 py-2 text-right text-slate-400">{pct}%</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="sticky bottom-0 bg-slate-50 font-semibold text-slate-800 border-t border-slate-200">
              <tr>
                <td className="px-4 py-2.5">Total</td>
                <td className="px-4 py-2.5 text-right text-blue-600">{fmtNum(totalValue)}</td>
                <td className="px-4 py-2.5 text-right">100%</td>
              </tr>
            </tfoot>
          </table>
        </div>
      ) : (
        <div className="relative select-none">
          <svg
            viewBox={`0 0 ${W} ${H}`}
            className="w-full touch-none outline-none overflow-visible"
            role="img"
            aria-label={`${label} timeline, from ${fmtDay(data[0].date)} to ${fmtDay(
              data[data.length - 1].date
            )}`}
            tabIndex={0}
            onPointerMove={nearest}
            onPointerLeave={() => setHover(null)}
            onBlur={() => setHover(null)}
            onKeyDown={onKey}
          >
            <defs>
              {/* Soft area gradient */}
              <linearGradient id={gradAreaId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity="0.24" />
                <stop offset="65%" stopColor={color} stopOpacity="0.05" />
                <stop offset="100%" stopColor={color} stopOpacity="0.00" />
              </linearGradient>

              {/* Luminous stroke gradient */}
              <linearGradient id={gradStrokeId} x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#3b82f6" />
                <stop offset="100%" stopColor={color} />
              </linearGradient>

              {/* Subtle line glow drop shadow */}
              <filter id={filterGlowId} x="-10%" y="-10%" width="120%" height="130%">
                <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor={color} floodOpacity="0.2" />
              </filter>
            </defs>

            {/* Horizontal Grid lines with clean dashed styling */}
            {ticks.map((t) => (
              <g key={t}>
                <line
                  x1={M.l}
                  x2={W - M.r}
                  y1={y(t)}
                  y2={y(t)}
                  stroke={t === 0 ? "#cbd5e1" : "#f1f5f9"}
                  strokeWidth={t === 0 ? 1.5 : 1}
                  strokeDasharray={t === 0 ? undefined : "4 4"}
                />
                <text
                  x={M.l - 8}
                  y={y(t) + 3.5}
                  textAnchor="end"
                  fontSize={11}
                  fontWeight={500}
                  fill="#94a3b8"
                  className="tabular-nums font-mono"
                >
                  {fmtNum(t)}
                </text>
              </g>
            ))}

            {/* X-axis date labels */}
            {xIndices.map((i, idx) => {
              const anchor = idx === 0 ? "start" : idx === xIndices.length - 1 ? "end" : "middle";
              return (
                <g key={i}>
                  {/* Subtle tick notch */}
                  <line
                    x1={x(i)}
                    x2={x(i)}
                    y1={zeroY}
                    y2={zeroY + 4}
                    stroke="#cbd5e1"
                    strokeWidth={1}
                  />
                  <text
                    x={x(i)}
                    y={H - 6}
                    textAnchor={anchor}
                    fontSize={11}
                    fontWeight={500}
                    fill="#64748b"
                  >
                    {fmtDay(data[i].date)}
                  </text>
                </g>
              );
            })}

            {/* Area Fill */}
            <path d={area} fill={`url(#${gradAreaId})`} />

            {/* Smooth Spline Curve Stroke */}
            <path
              d={line}
              fill="none"
              stroke={`url(#${gradStrokeId})`}
              strokeWidth={2.75}
              strokeLinejoin="round"
              strokeLinecap="round"
              filter={`url(#${filterGlowId})`}
            />

            {/* Highlight non-zero activity points with subtle luminous dots */}
            {points
              .filter((p) => p.val > 0)
              .map((p, idx) => (
                <g key={idx}>
                  <circle cx={p.x} cy={p.y} r={6} fill={color} fillOpacity={0.15} />
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={3.5}
                    fill={color}
                    stroke="#ffffff"
                    strokeWidth={2}
                  />
                </g>
              ))}

            {/* Interactive Cursor crosshair guideline & active point */}
            {hover !== null && hPoint && (
              <g>
                <line
                  x1={hPoint.x}
                  x2={hPoint.x}
                  y1={M.t}
                  y2={zeroY}
                  stroke="#94a3b8"
                  strokeWidth={1.5}
                  strokeDasharray="3 3"
                />
                {/* Outer pulsing ring */}
                <circle
                  cx={hPoint.x}
                  cy={hPoint.y}
                  r={8}
                  fill={color}
                  fillOpacity={0.25}
                  className="animate-pulse"
                />
                {/* Inner crisp dot */}
                <circle
                  cx={hPoint.x}
                  cy={hPoint.y}
                  r={4.5}
                  fill={color}
                  stroke="#ffffff"
                  strokeWidth={2.5}
                />
              </g>
            )}
          </svg>

          {/* Floating Glassmorphic Tooltip */}
          {hover !== null && h && hPoint && (
            <div
              className="pointer-events-none absolute z-20 rounded-xl border border-slate-200/90 bg-white/95 px-3 py-2 text-xs shadow-lg shadow-slate-900/10 backdrop-blur-md transition-all duration-75"
              style={{
                left: `${(hPoint.x / W) * 100}%`,
                top: `${Math.max(4, (hPoint.y / H) * 100 - 32)}%`,
                transform: `translateX(${
                  hover > data.length * 0.65 ? "calc(-100% - 12px)" : "12px"
                }) translateY(-50%)`,
              }}
            >
              <div className="font-medium text-slate-500">{fmtFullDate(h.date)}</div>
              <div className="mt-1 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
                <span className="text-sm font-bold tabular-nums text-slate-900">
                  {fmtNum(h.value)}
                </span>
                <span className="text-slate-500 font-medium">{label.toLowerCase()}</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

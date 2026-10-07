"use client";

export type Segment = { label: string; value: number; color: string };

const SIZE = 160;
const STROKE = 18;
const R = (SIZE - STROKE) / 2;
const C = 2 * Math.PI * R;

// A sleek ring chart with a centered total and modern status tags
export function DonutChart({
  segments,
  centerLabel,
  centerValue,
}: {
  segments: Segment[];
  centerLabel: string;
  centerValue: string | number;
}) {
  const total = segments.reduce((n, s) => n + s.value, 0);

  let offset = 0;
  return (
    <div className="flex flex-col sm:flex-row items-center gap-6 py-1">
      <div className="relative shrink-0" style={{ width: SIZE, height: SIZE }}>
        <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} className="-rotate-90">
          {/* Subtle background track */}
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={R}
            fill="none"
            stroke="#f1f5f9"
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
                    className="transition-all duration-300"
                  />
                );
                offset += dash;
                return el;
              })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold tracking-tight text-slate-900 tabular-nums">
            {centerValue}
          </span>
          <span className="text-xs font-medium text-slate-400">{centerLabel}</span>
        </div>
      </div>

      <ul className="w-full space-y-2.5 text-xs">
        {segments.map((s) => (
          <li
            key={s.label}
            className="flex items-center justify-between rounded-lg p-1.5 transition-colors hover:bg-slate-50"
          >
            <div className="flex items-center gap-2">
              <span
                aria-hidden
                className="h-2.5 w-2.5 shrink-0 rounded-full shadow-sm"
                style={{ background: s.color }}
              />
              <span className="font-medium text-slate-600">{s.label}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold tabular-nums text-slate-800">
                {s.value.toLocaleString()}
              </span>
              {total > 0 && (
                <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500 tabular-nums">
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

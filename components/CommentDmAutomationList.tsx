"use client";

import { useEffect, useMemo, useState } from "react";
import { Alert, Popconfirm, Segmented, Switch, Tooltip } from "antd";
import {
  ArrowRightOutlined,
  CheckCircleOutlined,
  CommentOutlined,
  DeleteOutlined,
  ExclamationCircleOutlined,
  LineChartOutlined,
  LinkOutlined,
  MessageOutlined,
  PlusOutlined,
  SendOutlined,
} from "@ant-design/icons";
import { api, ApiError } from "@/lib/api";
import { UnifiedChart, Point } from "./UnifiedChart";
import { LoadFailed } from "./ui/LoadFailed";

type Rule = {
  id: string;
  name: string;
  enabled: boolean;
  keywords: string;
  mediaId: string | null;
  mediaPermalink: string | null;
  mediaThumb: string | null;
  dmText: string;
  createdAt: string;
};
type Row = { rule: Rule; triggered: number; sent: number };
type Stats = {
  days: number;
  triggered: number;
  sent: number;
  failed: number;
  replied: number;
  deliveryRate: number | null;
  responseRate: number | null;
  series: Point[];
};
type Filter = "all" | "active" | "paused";
type Sort = "newest" | "sent";

// Soft Pastel Minimal palette (see AGENTS.md): coloured cards are borderless, white cards get the subtle border.
const PASTEL = { periwinkle: "#e2e2fc", butter: "#fff9db", rose: "#fceef4", peach: "#feece4", memo: "#f1f3f7" };

const compact = (n: number) =>
  Intl.NumberFormat(undefined, { notation: "compact", maximumFractionDigits: 1 }).format(n);
const pct = (n: number | null | undefined) => (n == null ? "—" : `${Math.round(n)}%`);
const dateRangeLabel = (days: number) => {
  const end = new Date();
  const start = new Date(Date.now() - (days - 1) * 86_400_000);
  const fmt = (d: Date) => d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  return `${fmt(start)} – ${fmt(end)}`;
};
const ago = (iso: string) => {
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 3600) return `${Math.max(1, Math.round(s / 60))}m ago`;
  if (s < 86_400) return `${Math.round(s / 3600)}h ago`;
  if (s < 30 * 86_400) return `${Math.round(s / 86_400)}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
};
const keywordList = (k: string) => k.split(",").map((x) => x.trim()).filter(Boolean);

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-[26px] bg-slate-100 ${className}`} />;
}

/** Small white pill with the black outline from the design system. */
function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-black/80 bg-white px-2.5 py-0.5 text-[11px] font-semibold text-slate-950 shadow-2xs">
      {children}
    </span>
  );
}

export function CommentDmAutomationList({
  onOpen,
  onOpenDashboard,
}: {
  onOpen: (id: string) => void;
  onOpenDashboard?: () => void;
}) {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [days, setDays] = useState<7 | 14 | 30>(30);
  const [filter, setFilter] = useState<Filter>("all");
  const [sort, setSort] = useState<Sort>("newest");
  const [error, setError] = useState<string | null>(null);
  const [rowsError, setRowsError] = useState<string | null>(null);
  const [statsError, setStatsError] = useState<string | null>(null);
  const [statsTick, setStatsTick] = useState(0); // bumped by "Try again"
  const [creating, setCreating] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = () =>
    api<Row[]>("/comment-dm/automations").then(
      (r) => {
        setRows(r);
        setRowsError(null);
      },
      (e: Error) => setRowsError(e.message),
    );

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    let cancelled = false;
    setStats(null);
    setStatsError(null);
    api<Stats>(`/comment-dm/stats?days=${days}`).then(
      (s) => !cancelled && setStats(s),
      (e: Error) => !cancelled && setStatsError(e.message),
    );
    return () => {
      cancelled = true;
    };
  }, [days, statsTick]);

  async function createNew() {
    setCreating(true);
    setError(null);
    try {
      const rule = await api<Rule>("/comment-dm/automations", { method: "POST" });
      onOpen(rule.id);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setCreating(false);
    }
  }

  async function remove(row: Row) {
    setBusyId(row.rule.id);
    setError(null);
    try {
      await api(`/comment-dm/automations/${row.rule.id}`, { method: "DELETE" });
      setRows((prev) => (prev ? prev.filter((r) => r.rule.id !== row.rule.id) : []));
      await load();
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        setRows((prev) => (prev ? prev.filter((r) => r.rule.id !== row.rule.id) : []));
      } else {
        setError((err as Error).message);
      }
    } finally {
      setBusyId(null);
    }
  }

  // Turn an automation on or off without opening it. The switch moves at once and snaps back if the save fails.
  async function toggle(row: Row, enabled: boolean) {
    setBusyId(row.rule.id);
    setError(null);
    setRows((prev) => prev?.map((r) => (r.rule.id === row.rule.id ? { ...r, rule: { ...r.rule, enabled } } : r)) ?? prev);
    try {
      await api(`/comment-dm/automations/${row.rule.id}`, { method: "PUT", body: JSON.stringify({ enabled }) });
    } catch (err) {
      setRows((prev) => prev?.map((r) => (r.rule.id === row.rule.id ? { ...r, rule: { ...r.rule, enabled: !enabled } } : r)) ?? prev);
      setError((err as Error).message);
    } finally {
      setBusyId(null);
    }
  }

  const counts = useMemo(() => {
    const all = rows?.length ?? 0;
    const active = rows?.filter((r) => r.rule.enabled).length ?? 0;
    return { all, active, paused: all - active };
  }, [rows]);

  const visible = useMemo(() => {
    const list = (rows ?? []).filter((r) => (filter === "all" ? true : filter === "active" ? r.rule.enabled : !r.rule.enabled));
    return [...list].sort((a, b) =>
      sort === "sent" ? b.sent - a.sent : new Date(b.rule.createdAt).getTime() - new Date(a.rule.createdAt).getTime(),
    );
  }, [rows, filter, sort]);

  return (
    <div className="flex w-full flex-col gap-8 animate-page-entrance">
      {/* ── Header: title, period switch and New automation ── */}
      <header className="flex flex-wrap items-end justify-between gap-x-4 gap-y-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight text-slate-950">Comment-to-DM</h1>
          <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-500">
            <span>What your comments turned into · {dateRangeLabel(days)}</span>
            {onOpenDashboard && (
              <button
                type="button"
                onClick={onOpenDashboard}
                className="inline-flex min-h-6 cursor-pointer items-center gap-1 font-medium text-slate-900 hover:underline"
              >
                <LineChartOutlined aria-hidden /> Full analytics
              </button>
            )}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Segmented
            options={[
              { label: "7 days", value: 7 },
              { label: "14 days", value: 14 },
              { label: "30 days", value: 30 },
            ]}
            value={days}
            onChange={(v) => setDays(v as 7 | 14 | 30)}
            className="!rounded-xl font-medium"
          />
          <button
            type="button"
            onClick={createNew}
            disabled={creating}
            className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-full bg-black px-5 text-sm font-semibold text-white shadow-xs transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60"
          >
            <PlusOutlined aria-hidden />
            {creating ? "Creating…" : "New automation"}
          </button>
        </div>
      </header>
      {error && <Alert type="error" showIcon title="Something went wrong" description={error} className="!rounded-2xl" />}

      {/* ── Funnel: what happened to the comments ───────────────── */}
      <section className="space-y-3">
        {!stats && statsError ? (
          <LoadFailed title="Couldn't load these numbers" message={statsError} onRetry={() => setStatsTick((n) => n + 1)} compact />
        ) : !stats ? (
          <Skeleton className="h-28" />
        ) : (
          <ul className="grid grid-cols-2 gap-px overflow-hidden rounded-[22px] border border-slate-200 bg-slate-200 shadow-sm lg:grid-cols-4">
            {[
              {
                bg: PASTEL.periwinkle,
                label: "Comments matched",
                value: compact(stats.triggered),
                note: `last ${stats.days} days · matched a keyword`,
                icon: <CommentOutlined />,
              },
              {
                bg: PASTEL.butter,
                label: "DMs delivered",
                value: compact(stats.sent),
                note: `${pct(stats.deliveryRate)} delivered · ${stats.triggered ? `of ${compact(stats.triggered)} matched` : "waiting for comments"}`,
                icon: <SendOutlined />,
              },
              {
                bg: PASTEL.rose,
                label: "Replies",
                value: compact(stats.replied),
                note: `${pct(stats.responseRate)} replied · ${stats.sent ? `of ${compact(stats.sent)} DMs` : "no DMs yet"}`,
                icon: <MessageOutlined />,
              },
              {
                bg: stats.failed > 0 ? PASTEL.peach : PASTEL.memo,
                label: "Failed to send",
                value: compact(stats.failed),
                note: stats.failed > 0 ? "open an automation to see why" : "nothing needs attention",
                icon: stats.failed > 0 ? <ExclamationCircleOutlined /> : <CheckCircleOutlined />,
              },
            ].map((s) => (
              <li key={s.label} className="flex items-start gap-3 bg-white p-4 sm:p-5">
                <span
                  aria-hidden="true"
                  style={{ backgroundColor: s.bg }}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-slate-950"
                >
                  {s.icon}
                </span>
                <div className="min-w-0">
                  <div className="text-sm font-medium text-slate-600">{s.label}</div>
                  <div className="mt-0.5 text-3xl font-bold tabular-nums text-slate-950">{s.value}</div>
                  <div className="mt-0.5 text-xs text-slate-500">{s.note}</div>
                </div>
              </li>
            ))}
          </ul>
        )}

        {/* Charts */}
        <div className="grid gap-3 lg:grid-cols-[1fr_22rem]">
          <div className="rounded-[24px] border border-[#e9e9ee] bg-white p-5 shadow-2xs transition-all hover:border-black/30">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-slate-950">DMs sent per day</h3>
                <p className="text-xs text-slate-500">Each bar is one day. Hover a bar for the exact count.</p>
              </div>
              {stats && (
                <div className="text-right">
                  <div className="text-2xl font-semibold tabular-nums text-slate-950">{compact(stats.sent)}</div>
                  <div className="text-xs text-slate-500">in {stats.days} days</div>
                </div>
              )}
            </div>
            {stats ? (
              stats.sent > 0 ? (
                <UnifiedChart type="bar" data={stats.series} label="DMs sent" color="#000000" height={240} />
              ) : (
                <div style={{ backgroundColor: PASTEL.memo }} className="flex h-60 flex-col items-center justify-center rounded-[20px] text-center">
                  <p className="text-sm font-semibold text-slate-950">No DMs sent in this period</p>
                  <p className="mt-1 max-w-xs text-xs text-slate-500">Once a comment matches one of your keywords, the day it was sent shows up here.</p>
                </div>
              )
            ) : statsError ? null : (
              <Skeleton className="h-60 !rounded-[20px]" />
            )}
          </div>

          <div className="rounded-[24px] border border-[#e9e9ee] bg-white p-5 shadow-2xs transition-all hover:border-black/30">
            <h3 className="text-sm font-semibold text-slate-950">Delivery</h3>
            <p className="mb-3 text-xs text-slate-500">How many matched comments got a DM.</p>
            {stats ? (
              <>
                <UnifiedChart
                  type="donut"
                  centerLabel="Matched"
                  centerValue={stats.triggered}
                  segments={[
                    { label: "Sent", value: stats.sent, color: "#000000" },
                    { label: "Failed", value: stats.failed, color: "#ef4444" },
                    { label: "Pending", value: Math.max(0, stats.triggered - stats.sent - stats.failed), color: "#d4d4d8" },
                  ]}
                />
                {stats.failed > 0 && (
                  <div style={{ backgroundColor: PASTEL.rose }} className="mt-3 rounded-2xl p-3 text-xs leading-relaxed text-slate-700">
                    <strong className="text-slate-950">{stats.failed} DM{stats.failed === 1 ? "" : "s"} didn&apos;t send.</strong>{" "}
                    Open the automation and check its activity log for the reason.
                  </div>
                )}
              </>
            ) : statsError ? null : (
              <Skeleton className="h-52 !rounded-[20px]" />
            )}
          </div>
        </div>
      </section>

      {/* ── Automations ────────────────────────────────────────── */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <h2 className="text-lg font-semibold tracking-tight text-slate-950">Your automations</h2>
            {rows && rows.length > 0 && <Pill>{counts.all}</Pill>}
          </div>
          {rows && rows.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <Segmented
                options={[
                  { label: `All ${counts.all}`, value: "all" },
                  { label: `Active ${counts.active}`, value: "active" },
                  { label: `Paused ${counts.paused}`, value: "paused" },
                ]}
                value={filter}
                onChange={(v) => setFilter(v as Filter)}
                className="!rounded-xl text-xs font-medium"
              />
              <Segmented
                options={[
                  { label: "Newest", value: "newest" },
                  { label: "Most DMs", value: "sent" },
                ]}
                value={sort}
                onChange={(v) => setSort(v as Sort)}
                className="!rounded-xl text-xs font-medium"
              />
            </div>
          )}
        </div>

        {!rows && rowsError && <LoadFailed title="Couldn't load your automations" message={rowsError} onRetry={() => void load()} />}

        {!rows && !rowsError && (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-64" />
            ))}
          </div>
        )}

        {rows?.length === 0 && (
          <div style={{ backgroundColor: PASTEL.periwinkle }} className="rounded-[28px] p-6 shadow-xs sm:p-10">
            <h3 className="text-xl font-semibold text-slate-950">Turn comments into conversations</h3>
            <p className="mt-1 max-w-xl text-sm text-slate-600">Set up your first automation in three steps:</p>
            <ol className="mt-5 grid gap-3 sm:grid-cols-3">
              {[
                ["Pick a post", "Choose one post, or watch every post."],
                ["Choose the keywords", "Comments that contain them start the DM."],
                ["Write your message", "Add text, buttons or a product card."],
              ].map(([title, body], i) => (
                <li key={title} className="rounded-2xl bg-white/70 p-4">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-black text-xs font-semibold text-white">{i + 1}</div>
                  <div className="mt-3 text-sm font-semibold text-slate-950">{title}</div>
                  <div className="mt-0.5 text-xs text-slate-600">{body}</div>
                </li>
              ))}
            </ol>
            <button
              type="button"
              onClick={createNew}
              disabled={creating}
              className="mt-6 inline-flex h-11 items-center gap-2 rounded-full bg-black px-6 text-sm font-semibold text-white transition-transform hover:scale-[1.02] disabled:opacity-60 cursor-pointer"
            >
              <PlusOutlined /> {creating ? "Creating…" : "Create your first automation"}
            </button>
          </div>
        )}

        {rows && rows.length > 0 && visible.length === 0 && (
          <div style={{ backgroundColor: PASTEL.memo }} className="rounded-[24px] p-8 text-center text-sm text-slate-600">
            No {filter} automations. <button type="button" className="font-semibold text-slate-950 underline cursor-pointer" onClick={() => setFilter("all")}>Show all</button>
          </div>
        )}

        <ul className="grid grid-cols-1 gap-4 lg:grid-cols-2 2xl:grid-cols-3">
          {visible.map((row) => {
            const kws = keywordList(row.rule.keywords);
            const busy = busyId === row.rule.id;
            const on = row.rule.enabled;
            const panelLabel = "text-[11px] font-bold uppercase tracking-wide text-slate-500";
            return (
              <li key={row.rule.id} className="min-w-0">
                {/* The title is a real button stretched over the whole card, so the card opens with mouse, touch and keyboard.
                    The switch, post link and delete button sit above it (z-10). */}
                <article
                  className={`group relative flex h-full min-w-0 flex-col gap-3.5 rounded-[22px] border p-4 shadow-sm transition-shadow hover:shadow-md has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-black has-[:focus-visible]:ring-offset-2 ${
                    on ? "border-slate-200 bg-white" : "border-dashed border-slate-300 bg-slate-50/60"
                  }`}
                >
                  {/* Header */}
                  <div className="flex items-start gap-3">
                    <div className="min-w-0 flex-1">
                      <h3 className="text-lg font-bold leading-tight text-slate-950">
                        <button
                          type="button"
                          onClick={() => onOpen(row.rule.id)}
                          title={row.rule.name}
                          className="block max-w-full cursor-pointer truncate text-left focus-visible:outline-none after:absolute after:inset-0 after:rounded-[22px] after:content-['']"
                        >
                          {row.rule.name}
                        </button>
                      </h3>
                      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-sm text-slate-500">
                        {row.rule.mediaId ? (
                          row.rule.mediaPermalink ? (
                            <a
                              href={row.rule.mediaPermalink}
                              target="_blank"
                              rel="noreferrer"
                              className="relative z-10 inline-flex min-h-6 items-center gap-1.5 hover:text-slate-900 hover:underline"
                            >
                              One post <LinkOutlined aria-hidden />
                              <span className="sr-only">(opens on Instagram)</span>
                            </a>
                          ) : (
                            <span>One post</span>
                          )
                        ) : (
                          <span>Every post</span>
                        )}
                        <span>Created {ago(row.rule.createdAt)}</span>
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-2">
                      <Switch
                        checked={on}
                        loading={busy}
                        onChange={(v) => toggle(row, v)}
                        aria-label={`${row.rule.name}: ${on ? "active" : "paused"}`}
                        className="relative z-10 [&.ant-switch-checked]:!bg-emerald-500 [&.ant-switch-checked:hover]:!bg-emerald-600"
                      />
                      <div className="flex items-center gap-2">
                        <Popconfirm
                          title="Delete this automation?"
                          description={`"${row.rule.name}" will stop matching comments. Its past results are kept.`}
                          onConfirm={() => remove(row)}
                          okText="Delete"
                          cancelText="Keep it"
                          okButtonProps={{ danger: true }}
                        >
                          <Tooltip title="Delete">
                            <button
                              type="button"
                              disabled={busy}
                              aria-label={`Delete ${row.rule.name}`}
                              className="relative z-10 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-slate-300 bg-white text-slate-500 transition-colors hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              <DeleteOutlined />
                            </button>
                          </Tooltip>
                        </Popconfirm>
                        <span
                          aria-hidden="true"
                          className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-xs text-white shadow-xs transition-transform group-hover:translate-x-0.5"
                        >
                          <ArrowRightOutlined />
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Trigger → message */}
                  <div className="grid grid-cols-1 items-stretch gap-2 border-t border-slate-200 pt-3.5 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1.2fr)]">
                    <div className="rounded-xl border border-slate-200 bg-[#eef2f8] p-3">
                      <div className={panelLabel}>{kws.length === 0 ? "Triggers on" : "Triggers when a comment contains"}</div>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {kws.length === 0 ? (
                          <span className="rounded-full bg-sky-100 px-2.5 py-1 text-xs font-medium text-slate-800">Any comment</span>
                        ) : (
                          <>
                            {kws.slice(0, 4).map((k) => (
                              <span key={k} className="rounded-full bg-sky-100 px-2.5 py-1 text-xs font-medium text-slate-800">
                                {k}
                              </span>
                            ))}
                            {kws.length > 4 && (
                              <Tooltip title={kws.slice(4).join(", ")}>
                                <span className="relative z-10 rounded-full bg-white px-2.5 py-1 text-xs font-medium text-slate-600">
                                  +{kws.length - 4} more
                                </span>
                              </Tooltip>
                            )}
                          </>
                        )}
                      </div>
                    </div>

                    <ArrowRightOutlined aria-hidden className="hidden self-center text-slate-400 sm:block" />

                    <div className="rounded-xl border border-slate-200 bg-[#eef2f8] p-3">
                      <div className={panelLabel}>Then sends this DM</div>
                      <div
                        className="mt-2 line-clamp-3 rounded-xl bg-white px-3 py-2 text-sm leading-snug text-slate-900 shadow-xs"
                        title={row.rule.dmText}
                      >
                        {row.rule.dmText || <span className="italic text-slate-500">No message written yet</span>}
                      </div>
                    </div>
                  </div>
                </article>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}

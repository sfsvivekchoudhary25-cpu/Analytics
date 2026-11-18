"use client";

import { useEffect, useMemo, useState } from "react";
import { Alert, Popconfirm, Segmented, Switch, Tooltip } from "antd";
import {
  ArrowRightOutlined,
  CheckCircleOutlined,
  CommentOutlined,
  DeleteOutlined,
  ExclamationCircleOutlined,
  InstagramOutlined,
  LineChartOutlined,
  LinkOutlined,
  MessageOutlined,
  PlusOutlined,
  SendOutlined,
} from "@ant-design/icons";
import { api, ApiError } from "@/lib/api";
import { UnifiedChart, Point } from "./UnifiedChart";

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

function FunnelCard({
  bg,
  label,
  value,
  note,
  chip,
  icon,
}: {
  bg: string;
  label: string;
  value: string;
  note: string;
  chip?: string;
  icon: React.ReactNode;
}) {
  return (
    <div style={{ backgroundColor: bg }} className="flex flex-col justify-between rounded-[26px] p-4 shadow-xs sm:p-5">
      <div className="flex items-start justify-between gap-2">
        <span className="text-sm font-semibold text-slate-950">{label}</span>
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-black/80 bg-white text-slate-950 shadow-2xs">
          {icon}
        </div>
      </div>
      <div className="mt-4 text-3xl font-semibold tabular-nums text-slate-950 sm:text-4xl">{value}</div>
      <div className="mt-2 flex min-h-7 flex-wrap items-center gap-2">
        {chip && <Pill>{chip}</Pill>}
        <span className="text-xs font-medium text-slate-600">{note}</span>
      </div>
    </div>
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
  const [creating, setCreating] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = () => api<Row[]>("/comment-dm/automations").then(setRows, (e: Error) => setError(e.message));

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    let cancelled = false;
    setStats(null);
    api<Stats>(`/comment-dm/stats?days=${days}`).then(
      (s) => !cancelled && setStats(s),
      (e: Error) => !cancelled && setError(e.message),
    );
    return () => {
      cancelled = true;
    };
  }, [days]);

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
      {/* ── Header ─────────────────────────────────────────────── */}
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-950 sm:text-[28px]">Comment-to-DM Automations</h1>
          <p className="mt-1.5 text-sm leading-relaxed text-slate-500">
            When someone comments a keyword on your post, we send them your message straight away as a private reply.
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
            className="inline-flex h-11 items-center gap-2 rounded-full bg-black px-5 text-sm font-semibold text-white shadow-xs transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 cursor-pointer"
          >
            <PlusOutlined />
            {creating ? "Creating…" : "New automation"}
          </button>
        </div>
      </header>

      {error && <Alert type="error" showIcon title="Something went wrong" description={error} className="!rounded-2xl" />}

      {/* ── Funnel: what happened to the comments ───────────────── */}
      <section className="space-y-3">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-lg font-semibold tracking-tight text-slate-950">What your comments turned into</h2>
          <div className="flex items-center gap-3 text-xs font-medium text-slate-500">
            <span>{dateRangeLabel(days)}</span>
            {onOpenDashboard && (
              <button
                type="button"
                onClick={onOpenDashboard}
                className="inline-flex items-center gap-1 text-slate-950 hover:underline cursor-pointer"
              >
                <LineChartOutlined /> Full analytics
              </button>
            )}
          </div>
        </div>

        {!stats ? (
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-36" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <FunnelCard
              bg={PASTEL.periwinkle}
              label="Comments matched"
              value={compact(stats.triggered)}
              chip={`last ${stats.days} days`}
              note="matched a keyword"
              icon={<CommentOutlined />}
            />
            <FunnelCard
              bg={PASTEL.butter}
              label="DMs delivered"
              value={compact(stats.sent)}
              chip={`${pct(stats.deliveryRate)} delivered`}
              note={stats.triggered ? `of ${compact(stats.triggered)} matched` : "waiting for comments"}
              icon={<SendOutlined />}
            />
            <FunnelCard
              bg={PASTEL.rose}
              label="Replies"
              value={compact(stats.replied)}
              chip={`${pct(stats.responseRate)} replied`}
              note={stats.sent ? `of ${compact(stats.sent)} DMs` : "no DMs yet"}
              icon={<MessageOutlined />}
            />
            <FunnelCard
              bg={stats.failed > 0 ? PASTEL.peach : PASTEL.memo}
              label="Failed to send"
              value={compact(stats.failed)}
              note={stats.failed > 0 ? "open an automation to see why" : "nothing needs attention"}
              icon={stats.failed > 0 ? <ExclamationCircleOutlined /> : <CheckCircleOutlined />}
            />
          </div>
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
            ) : (
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
            ) : (
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

        {!rows && (
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

        <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visible.map((row) => {
            const kws = keywordList(row.rule.keywords);
            const rate = row.triggered > 0 ? Math.round((row.sent / row.triggered) * 100) : null;
            const busy = busyId === row.rule.id;
            return (
              <li key={row.rule.id} className="min-w-0">
                <div
                  onClick={() => onOpen(row.rule.id)}
                  className="group flex h-full min-w-0 cursor-pointer flex-col gap-4 rounded-[24px] border border-[#e9e9ee] bg-white p-5 shadow-2xs transition-all hover:border-black/30"
                >
                  {/* Title row */}
                  <div className="flex items-start gap-3">
                    <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl" style={{ backgroundColor: PASTEL.periwinkle }}>
                      {row.rule.mediaThumb ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={row.rule.mediaThumb} alt="" referrerPolicy="no-referrer" className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-xl text-slate-950">
                          <InstagramOutlined />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate text-base font-semibold text-slate-950">{row.rule.name}</h3>
                      <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-slate-500">
                        {row.rule.mediaId ? (
                          row.rule.mediaPermalink ? (
                            <a
                              href={row.rule.mediaPermalink}
                              target="_blank"
                              rel="noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex items-center gap-1 font-medium text-slate-700 hover:text-slate-950 hover:underline"
                            >
                              One post <LinkOutlined />
                            </a>
                          ) : (
                            <span className="font-medium text-slate-700">One post</span>
                          )
                        ) : (
                          <span className="font-medium text-slate-700">Every post</span>
                        )}
                        <span>Created {ago(row.rule.createdAt)}</span>
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1" onClick={(e) => e.stopPropagation()}>
                      <Switch size="small" checked={row.rule.enabled} loading={busy} onChange={(v) => toggle(row, v)} />
                      <span className={`text-[11px] font-semibold ${row.rule.enabled ? "text-emerald-700" : "text-slate-400"}`}>
                        {row.rule.enabled ? "Active" : "Paused"}
                      </span>
                    </div>
                  </div>

                  {/* Keywords */}
                  <div>
                    <div className="mb-1.5 text-xs font-medium text-slate-500">{kws.length === 0 ? "Starts on" : "Starts when a comment contains"}</div>
                    <div className="flex flex-wrap gap-1.5">
                      {kws.length === 0 ? (
                        <span style={{ backgroundColor: PASTEL.memo }} className="rounded-lg px-2.5 py-1 text-xs font-medium text-slate-700">
                          Any comment
                        </span>
                      ) : (
                        <>
                          {kws.slice(0, 4).map((k) => (
                            <span key={k} style={{ backgroundColor: PASTEL.butter }} className="rounded-lg px-2.5 py-1 text-xs font-medium text-slate-900">
                              {k}
                            </span>
                          ))}
                          {kws.length > 4 && (
                            <Tooltip title={kws.slice(4).join(", ")}>
                              <span style={{ backgroundColor: PASTEL.memo }} className="rounded-lg px-2.5 py-1 text-xs font-medium text-slate-600">
                                +{kws.length - 4} more
                              </span>
                            </Tooltip>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  {/* DM preview */}
                  <div>
                    <div className="mb-1.5 text-xs font-medium text-slate-500">Then sends this DM</div>
                    <div
                      style={{ backgroundColor: PASTEL.memo }}
                      className="line-clamp-3 rounded-2xl rounded-tl-md px-3.5 py-2.5 text-sm leading-relaxed text-slate-800"
                      title={row.rule.dmText}
                    >
                      {row.rule.dmText || <span className="text-slate-400">No message written yet</span>}
                    </div>
                  </div>

                  {/* Results */}
                  <div className="mt-auto border-t border-[#e9e9ee] pt-3.5">
                    <div className="flex flex-wrap items-end justify-between gap-x-3 gap-y-3">
                      <div className="flex items-center gap-4 sm:gap-5">
                        <div>
                          <div className="text-lg font-semibold tabular-nums text-slate-950">{compact(row.triggered)}</div>
                          <div className="text-[11px] font-medium text-slate-500">matched</div>
                        </div>
                        <div>
                          <div className="text-lg font-semibold tabular-nums text-slate-950">{compact(row.sent)}</div>
                          <div className="text-[11px] font-medium text-slate-500">DMs sent</div>
                        </div>
                        <div>
                          <div className="text-lg font-semibold tabular-nums text-slate-950">{pct(rate)}</div>
                          <div className="text-[11px] font-medium text-slate-500">delivered</div>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-2" onClick={(e) => e.stopPropagation()}>
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
                              className="flex h-8 w-8 items-center justify-center rounded-full border border-[#e9e9ee] text-slate-500 transition-colors hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50 cursor-pointer"
                            >
                              <DeleteOutlined className="text-xs" />
                            </button>
                          </Tooltip>
                        </Popconfirm>
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-black text-white shadow-xs transition-transform group-hover:scale-110" aria-hidden>
                          <ArrowRightOutlined className="text-xs" />
                        </div>
                      </div>
                    </div>
                    {/* Delivery bar */}
                    <div className="mt-3 h-1.5 overflow-hidden rounded-full" style={{ backgroundColor: PASTEL.memo }}>
                      <div className="h-full rounded-full bg-black transition-all" style={{ width: `${rate ?? 0}%` }} />
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}

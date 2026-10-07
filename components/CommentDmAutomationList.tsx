"use client";

import { useEffect, useState } from "react";
import {
  Card,
  Button,
  Tag,
  Segmented,
  Popconfirm,
  Tooltip,
  Empty,
  Alert,
} from "antd";
import {
  PlusOutlined,
  DeleteOutlined,
  LineChartOutlined,
  CommentOutlined,
  SendOutlined,
  CheckCircleOutlined,
  MessageOutlined,
  ThunderboltOutlined,
  TagOutlined,
  InstagramOutlined,
} from "@ant-design/icons";
import { api, ApiError } from "@/lib/api";
import { LineChart, Point } from "./LineChart";
import { DonutChart } from "./DonutChart";

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

const RANGES = [7, 14, 30] as const;
const compact = (n: number) =>
  Intl.NumberFormat(undefined, { notation: "compact", maximumFractionDigits: 1 }).format(n);
const dateRangeLabel = (days: number) => {
  const end = new Date();
  const start = new Date(Date.now() - (days - 1) * 86_400_000);
  const fmt = (d: Date) => d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  return `${fmt(start)} – ${fmt(end)}`;
};

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
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = () =>
    api<Row[]>("/comment-dm/automations").then(setRows, (e: Error) => setError(e.message));

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    let cancelled = false;
    api<Stats>(`/comment-dm/stats?days=${days}`).then(
      (s) => !cancelled && setStats(s),
      (e: Error) => !cancelled && setError(e.message)
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
        // If already deleted on the server, remove from UI immediately
        setRows((prev) => (prev ? prev.filter((r) => r.rule.id !== row.rule.id) : []));
      } else {
        setError((err as Error).message);
      }
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="w-full flex flex-col gap-8 md:gap-10 animate-page-entrance">
      {/* ── Page Header ────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Comment-to-DM Automations
          </h1>
          <p className="mt-1 text-sm text-slate-500 max-w-2xl leading-relaxed">
            When someone comments a keyword, reply with a link that opens a DM — then send the real
            message once they tap it.
          </p>
        </div>
        <Button
          type="primary"
          size="large"
          icon={<PlusOutlined />}
          onClick={createNew}
          loading={creating}
          className="!rounded-xl self-start sm:self-auto !px-5"
        >
          New automation
        </Button>
      </div>

      {error && (
        <Alert
          type="error"
          showIcon
          title="Automation Error"
          description={error}
          className="!rounded-xl"
        />
      )}

      {/* ── Performance Overview Section ────────────────────────── */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold tracking-tight text-slate-900">
              Performance Overview
            </h2>
            <p className="text-xs text-slate-500">
              Consolidated analytics across all active and paused comment automations.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs font-medium text-slate-400">{dateRangeLabel(days)}</span>
            <Segmented
              options={[
                { label: "7d", value: 7 },
                { label: "14d", value: 14 },
                { label: "30d", value: 30 },
              ]}
              value={days}
              onChange={(val) => setDays(val as 7 | 14 | 30)}
              className="!rounded-xl"
            />
            {onOpenDashboard && (
              <Button
                type="text"
                size="small"
                icon={<LineChartOutlined />}
                onClick={onOpenDashboard}
                className="!text-xs !text-blue-600 hover:!text-blue-700 !font-semibold"
              >
                View in dashboard
              </Button>
            )}
          </div>
        </div>

        {stats && (
          <>
            {/* 4 Metric KPI Cards */}
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {/* Triggered */}
              <Card
                variant="outlined"
                className="!rounded-2xl !border-slate-200/80 !bg-white !shadow-sm hover:!shadow-md transition-shadow"
                styles={{ body: { padding: "20px 24px" } }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Triggered
                  </span>
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-700 border border-slate-200/70">
                    <CommentOutlined className="text-base" />
                  </div>
                </div>
                <div className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900">
                  {compact(stats.triggered)}
                </div>
                <div className="mt-1 text-xs text-slate-400">Total comments matched</div>
              </Card>

              {/* DMs Sent */}
              <Card
                variant="outlined"
                className="!rounded-2xl !border-slate-200/80 !bg-white !shadow-sm hover:!shadow-md transition-shadow"
                styles={{ body: { padding: "20px 24px" } }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    DMs Sent
                  </span>
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-700 border border-slate-200/70">
                    <SendOutlined className="text-base" />
                  </div>
                </div>
                <div className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900">
                  {compact(stats.sent)}
                </div>
                <div className="mt-1 text-xs text-slate-400">Delivered to inbox</div>
              </Card>

              {/* Tapped the link */}
              <Card
                variant="outlined"
                className="!rounded-2xl !border-slate-200/80 !bg-white !shadow-sm hover:!shadow-md transition-shadow"
                styles={{ body: { padding: "20px 24px" } }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Tapped the link
                  </span>
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-emerald-600 border border-slate-200/70">
                    <CheckCircleOutlined className="text-base" />
                  </div>
                </div>
                <div className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900">
                  {stats.deliveryRate != null ? `${stats.deliveryRate}%` : "—"}
                </div>
                <div className="mt-1 text-xs text-emerald-600 font-medium">Link conversion rate</div>
              </Card>

              {/* Replied */}
              <Card
                variant="outlined"
                className="!rounded-2xl !border-slate-200/80 !bg-white !shadow-sm hover:!shadow-md transition-shadow"
                styles={{ body: { padding: "20px 24px" } }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Replied
                  </span>
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-blue-600 border border-slate-200/70">
                    <MessageOutlined className="text-base" />
                  </div>
                </div>
                <div className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900">
                  {compact(stats.replied)}
                </div>
                <div className="mt-1 text-xs text-slate-500">
                  {stats.responseRate != null ? `${stats.responseRate}% response rate` : "No replies yet"}
                </div>
              </Card>
            </div>

            {/* Charts Row */}
            <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
              <Card
                variant="outlined"
                className="!rounded-2xl !border-slate-200/80 !bg-white !shadow-sm hover:!shadow-md transition-shadow"
                styles={{ body: { padding: "24px" } }}
              >
                <div className="mb-4">
                  <h3 className="text-base font-semibold text-slate-900">DMs sent timeline</h3>
                  <p className="text-xs text-slate-500">Automated outbound message volume over time</p>
                </div>
                <LineChart data={stats.series} label="DMs sent" />
              </Card>

              <Card
                variant="outlined"
                className="!rounded-2xl !border-slate-200/80 !bg-white !shadow-sm hover:!shadow-md transition-shadow"
                styles={{ body: { padding: "24px" } }}
              >
                <div className="mb-4">
                  <h3 className="text-base font-semibold text-slate-900">Delivery status</h3>
                  <p className="text-xs text-slate-500">Successful vs failed trigger dispatches</p>
                </div>
                <DonutChart
                  centerLabel="Total"
                  centerValue={stats.triggered}
                  segments={[
                    { label: "Sent", value: stats.sent, color: "#22c55e" },
                    { label: "Failed", value: stats.failed, color: "#ef4444" },
                  ]}
                />
              </Card>
            </div>
          </>
        )}
      </section>

      {/* ── Automations Grid Section ────────────────────────── */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <h2 className="text-lg font-bold tracking-tight text-slate-900">Automations</h2>
            {rows && rows.length > 0 && (
              <Tag className="!rounded-full !px-2.5 !py-0.2 !text-xs !bg-slate-100 !border-slate-200 !text-slate-600 !font-semibold !m-0">
                {rows.length} configured
              </Tag>
            )}
          </div>
        </div>

        {rows?.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-200 p-12 text-center bg-slate-50/50">
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                <span className="text-xs text-slate-400">
                  No automations configured yet. Create one to start turning post comments into private DM leads.
                </span>
              }
            >
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={createNew}
                loading={creating}
                className="!rounded-xl"
              >
                Create your first automation
              </Button>
            </Empty>
          </div>
        )}

        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {rows?.map((row) => (
            <li key={row.rule.id}>
              <div className="group relative flex flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm transition-all hover:border-slate-300 hover:shadow-md">
                {/* Media Thumbnail / Cover Header */}
                <div
                  onClick={() => onOpen(row.rule.id)}
                  className="relative h-36 w-full shrink-0 cursor-pointer overflow-hidden bg-slate-100"
                >
                  {row.rule.mediaThumb ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={row.rule.mediaThumb}
                      alt="Target post"
                      referrerPolicy="no-referrer"
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-slate-800 text-white">
                      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-300">
                        <InstagramOutlined className="text-base" />
                        <span>Watching every post</span>
                      </div>
                    </div>
                  )}

                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />

                  {/* Status Pill on Top-Left */}
                  <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold backdrop-blur-md shadow-xs text-white">
                    {row.rule.enabled ? (
                      <Tag
                        color="success"
                        className="!rounded-full !px-2.5 !py-0.2 !text-[11px] !font-semibold !m-0 !backdrop-blur-md !bg-emerald-600/90 !text-white !border-0"
                      >
                        ● Active
                      </Tag>
                    ) : (
                      <Tag
                        color="default"
                        className="!rounded-full !px-2.5 !py-0.2 !text-[11px] !font-semibold !m-0 !backdrop-blur-md !bg-slate-900/80 !text-slate-300 !border-0"
                      >
                        ● Paused
                      </Tag>
                    )}
                  </span>

                  {/* Delete Button on Top-Right */}
                  <div
                    className="absolute right-3 top-3"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Popconfirm
                      title="Delete automation?"
                      description={`Delete "${row.rule.name}"? Past performance data is kept, but it will stop matching comments.`}
                      onConfirm={() => remove(row)}
                      okText="Delete"
                      cancelText="Cancel"
                      okButtonProps={{ danger: true }}
                    >
                      <Tooltip title="Delete rule">
                        <button
                          disabled={busyId === row.rule.id}
                          className="flex h-7 w-7 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-md transition-all hover:bg-rose-600 cursor-pointer disabled:opacity-50"
                        >
                          <DeleteOutlined className="text-xs" />
                        </button>
                      </Tooltip>
                    </Popconfirm>
                  </div>
                </div>

                {/* Card Body */}
                <div
                  onClick={() => onOpen(row.rule.id)}
                  className="flex flex-1 flex-col justify-between p-5 cursor-pointer space-y-4"
                >
                  <div className="space-y-3.5">
                    <h3 className="text-base font-bold text-slate-900 truncate group-hover:text-blue-600 transition-colors">
                      {row.rule.name}
                    </h3>

                    {/* Trigger keywords */}
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                        <TagOutlined className="text-xs" />
                        <span>Triggers on</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {row.rule.keywords ? (
                          row.rule.keywords
                            .split(",")
                            .map((k) => k.trim())
                            .filter(Boolean)
                            .slice(0, 4)
                            .map((k) => (
                              <Tag
                                key={k}
                                className="!rounded-md !bg-slate-100 !border-slate-200 !text-slate-800 !text-xs !font-medium"
                              >
                                {k}
                              </Tag>
                            ))
                        ) : (
                          <Tag className="!rounded-md !bg-slate-100 !border-slate-200 !text-slate-500 !text-xs">
                            Any comment
                          </Tag>
                        )}
                      </div>
                    </div>

                    {/* Message Bubble Preview */}
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                        <SendOutlined className="text-xs" />
                        <span>Sends DM</span>
                      </div>
                      <div
                        className="rounded-2xl rounded-tl-xs bg-slate-50 border border-slate-200/80 p-3 text-xs text-slate-800 font-mono line-clamp-2"
                        title={row.rule.dmText}
                      >
                        &ldquo;{row.rule.dmText}&rdquo;
                      </div>
                    </div>
                  </div>

                  {/* Footer Metrics */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <span className="flex items-center gap-1.5">
                      <CommentOutlined className="text-slate-400" />
                      <strong className="text-slate-700">{row.triggered}</strong> triggered
                    </span>
                    <span className="flex items-center gap-1.5">
                      <SendOutlined className="text-slate-400" />
                      <strong className="text-slate-700">{row.sent}</strong> sent
                    </span>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

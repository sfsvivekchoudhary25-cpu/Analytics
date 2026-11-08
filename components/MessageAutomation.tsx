"use client";

import { useEffect, useState } from "react";
import {
  Card,
  Switch,
  Input,
  Button,
  Tag,
  Alert,
  Empty,
  Spin,
  Tooltip,
} from "antd";
import {
  ClockCircleOutlined,
  HistoryOutlined,
  CheckCircleOutlined,
  MinusCircleOutlined,
  CloseCircleOutlined,
  SyncOutlined,
  UserOutlined,
  CheckOutlined,
  ReloadOutlined,
  MessageOutlined,
} from "@ant-design/icons";
import { api } from "@/lib/api";
import { AutoReplyCard, type RuleTemplate } from "./AutoReplyCard";

type LogRow = {
  id: string;
  username: string | null;
  igsid: string;
  outcome: "processing" | "sent" | "skipped" | "failed";
  note: string | null;
  replyText: string | null;
  createdAt: string;
};

const TEMPLATES: RuleTemplate[] = [
  { name: "Greeting", keywords: "hi, hello, hey", replyText: "Hi {username}! Thanks for messaging us. We'll get back to you shortly." },
  { name: "Price question", keywords: "price, cost, rate, how much", replyText: "Hi {username}! Tell us which item you like and we'll share the price." },
  { name: "Order", keywords: "order, buy, purchase", replyText: "Hi {username}! To place an order, please send us the item name and your size." },
  { name: "Away message", keywords: "", replyText: "Thanks {username}! We got your message and will reply as soon as we can." },
];

const OUTCOME_CONFIG = {
  sent: {
    color: "success",
    label: "Replied",
    icon: <CheckCircleOutlined />,
    badgeClass: "!bg-emerald-50 !border-emerald-200 !text-emerald-700",
  },
  skipped: {
    color: "default",
    label: "Skipped",
    icon: <MinusCircleOutlined />,
    badgeClass: "!bg-slate-100 !border-slate-200 !text-slate-600",
  },
  failed: {
    color: "error",
    label: "Failed",
    icon: <CloseCircleOutlined />,
    badgeClass: "!bg-rose-50 !border-rose-200 !text-rose-700",
  },
  processing: {
    color: "processing",
    label: "Evaluating",
    icon: <SyncOutlined spin />,
    badgeClass: "!bg-blue-50 !border-blue-200 !text-blue-700",
  },
};

const when = (iso: string) =>
  new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

type AutoReplySettings = { ai: { enabled: boolean; fallbackEnabled: boolean; fallbackText: string } };

export function MessageAutomation() {
  const [log, setLog] = useState<LogRow[] | null>(null);
  const [ai, setAi] = useState<AutoReplySettings["ai"] | null>(null);
  const [fallbackText, setFallbackText] = useState("");
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLog = async () => {
    try {
      const l = await api<LogRow[]>("/messages/auto-reply/log");
      setLog(l);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    let cancelled = false;
    const load = () => {
      api<LogRow[]>("/messages/auto-reply/log").then(
        (l) => !cancelled && setLog(l),
        () => undefined
      );
    };
    load();
    const id = setInterval(load, 15000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    api<AutoReplySettings>("/messages/auto-reply").then(
      (s) => {
        if (cancelled) return;
        setAi(s.ai);
        setFallbackText(s.ai.fallbackText);
      },
      () => undefined
    );
    return () => {
      cancelled = true;
    };
  }, []);

  async function saveFallback(patch: { fallbackEnabled?: boolean; fallbackText?: string }) {
    setSaving(true);
    setError(null);
    try {
      const s = await api<AutoReplySettings>("/messages/auto-reply", {
        method: "PUT",
        body: JSON.stringify(patch),
      });
      setAi(s.ai);
      setFallbackText(s.ai.fallbackText);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function handleManualRefresh() {
    setRefreshing(true);
    await fetchLog();
    setRefreshing(false);
  }

  return (
    <div className="w-full flex flex-col gap-8 md:gap-10 pb-16 animate-page-entrance">
      <AutoReplyCard
        basePath="/messages/auto-reply"
        noun="messages"
        templates={TEMPLATES}
        keywordsExample="e.g. price, order, hello"
        replyExample="e.g. Hi {username}! Thanks for messaging us."
        maxReplyLength={1000}
      />

      {/* ── Holding reply fallback ── */}
      {ai?.enabled && (
        <Card
          variant="outlined"
          className="!rounded-2xl !border-slate-200/80 !bg-white !shadow-sm hover:!shadow-md transition-shadow w-full [&>.ant-card-body]:!p-4 sm:[&>.ant-card-body]:!p-6 lg:[&>.ant-card-body]:!p-7"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-5 flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-800 border border-slate-200/80">
                <ClockCircleOutlined className="text-lg" />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-semibold text-slate-900">
                    Holding reply fallback
                  </h3>
                  <Tag className="!rounded-md !px-2 !py-0.2 !text-[11px] !bg-slate-100 !border-slate-200 !text-slate-700 !font-medium">
                    When AI is silent
                  </Tag>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  The AI deliberately stays silent on sensitive topics or low confidence. Reassure the customer with this holding message so they know a human team member will follow up.
                </p>
                <div className="pt-2 flex items-center gap-2">
                  <span className="text-xs font-medium text-slate-600">
                    {ai.fallbackEnabled ? "Fallback active" : "Fallback disabled"}
                  </span>
                  <Switch
                    checked={ai.fallbackEnabled}
                    onChange={(checked) => saveFallback({ fallbackEnabled: checked })}
                    disabled={saving}
                  />
                </div>
              </div>
            </div>

            <div className="lg:col-span-7 space-y-3">
              {error && (
                <Alert
                  type="error"
                  showIcon
                  title="Failed to save holding reply"
                  description={error}
                  className="!rounded-xl"
                />
              )}
              <div className="pb-2">
                <Input.TextArea
                  value={fallbackText}
                  onChange={(e) => setFallbackText(e.target.value)}
                  disabled={!ai.fallbackEnabled}
                  maxLength={500}
                  rows={3}
                  showCount
                  placeholder="e.g. Thanks for reaching out! We've received your message and someone from our team will get back to you shortly."
                  className="!rounded-xl resize-none !border-slate-200 text-xs sm:text-sm"
                />
              </div>
              <div className="pt-3 sm:pt-2 flex justify-end">
                <Button
                  type="primary"
                  onClick={() => saveFallback({ fallbackText })}
                  disabled={saving || !ai.fallbackEnabled || fallbackText.trim() === (ai.fallbackText ?? "").trim()}
                  loading={saving}
                  icon={<CheckOutlined />}
                  className="!rounded-xl !h-10 w-full sm:w-auto sm:!px-6 font-semibold"
                >
                  Save Holding Reply
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* ── Recent Decisions Audit Log ── */}
      <Card
        variant="outlined"
        className="!rounded-2xl !border-slate-200/80 !bg-white !shadow-sm hover:!shadow-md transition-shadow w-full [&>.ant-card-body]:!p-4 sm:[&>.ant-card-body]:!p-6 lg:[&>.ant-card-body]:!p-7"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div className="flex items-start sm:items-center gap-3 sm:gap-4 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-800 border border-slate-200/80">
              <HistoryOutlined className="text-lg" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-bold text-slate-900 leading-tight">Recent Decisions</h3>
                <Tag className="!rounded-md !px-2 !py-0.5 !text-[11px] !bg-slate-100 !border-slate-200 !text-slate-600 !font-medium !m-0 shrink-0">
                  Live Audit Log
                </Tag>
              </div>
              <p className="mt-0.5 text-xs text-slate-500 leading-relaxed">
                Every incoming message evaluated by your automation engine, with details on replies and silent skips.
              </p>
            </div>
          </div>

          <Tooltip title="Refresh decision log">
            <Button
              size="middle"
              icon={<ReloadOutlined spin={refreshing} />}
              onClick={handleManualRefresh}
              className="!rounded-xl !border-slate-200 self-start sm:self-auto shrink-0 text-xs font-semibold"
            >
              Refresh Log
            </Button>
          </Tooltip>
        </div>

        <div className="mt-5 sm:mt-6">
          {!log ? (
            <div className="flex justify-center py-12">
              <Spin description="Loading activity stream…" />
            </div>
          ) : log.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center bg-slate-50/40">
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  <span className="text-xs text-slate-400">
                    No decisions recorded yet. Turn auto-reply on and incoming messages will appear here.
                  </span>
                }
              />
            </div>
          ) : (
            <div className="max-h-[440px] overflow-y-auto divide-y divide-slate-100 rounded-xl border border-slate-200/80 bg-white shadow-2xs overscroll-contain">
              {log.map((r) => {
                const conf = OUTCOME_CONFIG[r.outcome] || OUTCOME_CONFIG.skipped;
                return (
                  <div
                    key={r.id}
                    className="flex flex-col gap-2 p-3 sm:p-4 hover:bg-slate-50/70 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                        <span className="font-semibold text-xs sm:text-sm text-slate-900 flex items-center gap-1 truncate">
                          <UserOutlined className="text-slate-400 text-[10px]" />
                          {r.username ? `@${r.username}` : `User ${r.igsid.slice(-6)}`}
                        </span>
                        <span className="text-[11px] sm:text-xs text-slate-400 shrink-0">
                          • {when(r.createdAt)}
                        </span>
                      </div>

                      <Tag
                        icon={conf.icon}
                        className={`!rounded-md !px-2.5 !py-0.5 !text-[11px] sm:!text-xs !font-semibold !m-0 !shrink-0 ${conf.badgeClass}`}
                      >
                        {conf.label}
                      </Tag>
                    </div>

                    {r.replyText && r.outcome === "sent" && (
                      <div className="w-full flex items-start gap-2 rounded-lg bg-emerald-50/60 border border-emerald-100/90 p-2.5 text-xs text-emerald-950 font-mono">
                        <MessageOutlined className="text-emerald-600 mt-0.5 shrink-0 text-xs" />
                        <span className="break-words leading-relaxed">&ldquo;{r.replyText}&rdquo;</span>
                      </div>
                    )}

                    {r.note && (
                      <p className="text-xs text-slate-500 leading-relaxed break-words">
                        <span className="font-medium text-slate-600">Reason:</span> {r.note}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

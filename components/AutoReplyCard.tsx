"use client";

import { useEffect, useId, useState, type KeyboardEvent, type ReactNode } from "react";
import { Switch, InputNumber, Alert, Popconfirm, Collapse, Skeleton, Tooltip } from "antd";
import { Bot, Zap, ShieldCheck, Gauge, Plus, Trash2, Pause, Play, Sparkles, Check, Info } from "lucide-react";
import { api } from "@/lib/api";

export type RuleTemplate = { name: string; keywords: string; replyText: string };
type Rule = { id: string; keywords: string; replyText: string; enabled: boolean };
type State = {
  enabled: boolean;
  enabledAt: string | null;
  maxPerHour: number;
  dryRun?: boolean;
  ai?: { available: boolean; model: string; enabled: boolean; instructions: string; pausedUntil?: string | null };
  rules: Rule[];
};
type TryResult = { ok: boolean; reply?: string; silent?: boolean; reason?: string; model: string; seconds: number };

type Props = {
  /** API base, e.g. "/comments/auto-reply" or "/messages/auto-reply". */
  basePath: string;
  /** What is being answered, e.g. "comments" or "messages". */
  noun: string;
  templates: RuleTemplate[];
  keywordsExample: string;
  replyExample: string;
  maxReplyLength: number;
  /** When true, renders seamlessly without outer card borders, shadow, and padding */
  embedded?: boolean;
  /** Heading shown at the top of the card. */
  title?: string;
  /** Extra content rendered at the end of the AI panel (for example a fallback reply editor). */
  aiExtra?: ReactNode;
};

export type StatusType = "enabled" | "disabled" | "warning";
type TabId = "ai" | "keywords" | "safety";

const FOCUS =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2";
const INPUT =
  "w-full rounded-xl border border-slate-300 bg-white px-3.5 text-sm text-slate-900 placeholder:text-slate-500 focus-visible:border-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20";
const BTN_PRIMARY = `inline-flex h-11 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-full bg-black px-5 text-sm font-semibold text-white transition-colors hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-40 ${FOCUS}`;
const BTN_SECONDARY = `inline-flex h-10 shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-full border border-slate-300 bg-white px-3.5 text-xs font-semibold text-slate-800 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 ${FOCUS}`;

const DOT: Record<StatusType, { core: string; ping: string }> = {
  enabled: { core: "bg-emerald-500", ping: "bg-emerald-400" },
  warning: { core: "bg-amber-500", ping: "bg-amber-400" },
  disabled: { core: "bg-slate-400", ping: "" },
};

export function StatusDot({ status, pulse = true }: { status: StatusType; pulse?: boolean }) {
  const c = DOT[status];
  return (
    <span aria-hidden="true" className="relative flex h-2 w-2 shrink-0">
      {pulse && status !== "disabled" && (
        <span className={`absolute inline-flex h-full w-full rounded-full opacity-75 motion-safe:animate-ping ${c.ping}`} />
      )}
      <span className={`relative inline-flex h-2 w-2 rounded-full ${c.core}`} />
    </span>
  );
}

export function StatusBadge({
  status,
  text,
  className = "",
}: {
  status: StatusType;
  text?: string;
  className?: string;
}) {
  const styles =
    status === "enabled"
      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
      : status === "warning"
        ? "border-amber-200 bg-amber-50 text-amber-900"
        : "border-slate-200 bg-slate-100 text-slate-700";

  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border text-xs font-semibold ${
        text ? "px-2.5 py-0.5" : "px-2 py-1"
      } ${styles} ${className}`}
    >
      <StatusDot status={status} />
      {text ? <span>{text}</span> : null}
    </span>
  );
}

function TabCard({
  id,
  panelId,
  selected,
  icon,
  label,
  help,
  value,
  status,
  onSelect,
  onKeyDown,
}: {
  id: string;
  panelId: string;
  selected: boolean;
  icon: ReactNode;
  label: string;
  /** One plain sentence on what this section is for; shown from the "i" icon on hover or keyboard focus. */
  help: string;
  value: string;
  status?: StatusType;
  onSelect: () => void;
  onKeyDown: (e: KeyboardEvent<HTMLButtonElement>) => void;
}) {
  return (
    <Tooltip title={help} placement="top" trigger={["hover", "focus"]}>
      <button
        type="button"
        role="tab"
        id={id}
        aria-selected={selected}
        aria-controls={panelId}
        aria-describedby={`${id}-help`}
        tabIndex={selected ? 0 : -1}
        onClick={onSelect}
        onKeyDown={onKeyDown}
        className={`relative flex min-h-[72px] w-full cursor-pointer items-center gap-3 rounded-[18px] border p-3.5 pr-9 text-left transition-colors ${FOCUS} ${
          selected
            ? "border-black bg-[#eeeefd] shadow-xs"
            : "border-slate-200 bg-white shadow-2xs hover:border-slate-400"
        }`}
      >
        <span
          aria-hidden="true"
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
            selected ? "bg-white text-slate-950" : "bg-[#F1F3F7] text-slate-600"
          }`}
        >
          {icon}
        </span>
        <span className="min-w-0">
          <span className="block text-sm font-semibold text-slate-950">{label}</span>
          <span className="mt-0.5 flex items-center gap-1.5 text-xs font-medium text-slate-600">
            {status ? <StatusDot status={status} pulse={false} /> : null}
            <span className="truncate">{value}</span>
          </span>
        </span>
        <Info size={16} aria-hidden="true" className="absolute right-3 top-3 text-slate-500" />
        <span id={`${id}-help`} className="sr-only">
          {help}
        </span>
      </button>
    </Tooltip>
  );
}

function PanelHeader({
  title,
  description,
  status,
  badge,
  checked,
  onChange,
  disabled,
  loading,
}: {
  title: string;
  description: string;
  status: StatusType;
  badge: string;
  checked?: boolean;
  onChange?: () => void;
  disabled?: boolean;
  loading?: boolean;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-base font-semibold text-slate-950">{title}</h3>
          <StatusBadge status={status} text={badge} />
        </div>
        <p className="mt-1 max-w-xl text-sm leading-relaxed text-slate-600">{description}</p>
      </div>
      {onChange ? (
        <div className="flex shrink-0 items-center gap-2.5">
          <span className="text-sm font-medium text-slate-700" aria-hidden="true">
            {checked ? "On" : "Off"}
          </span>
          <Switch checked={checked} onChange={onChange} disabled={disabled} loading={loading} aria-label={`${title}: ${checked ? "on" : "off"}`} />
        </div>
      ) : null}
    </div>
  );
}

export function AutoReplyCard({
  basePath,
  noun,
  templates,
  keywordsExample,
  replyExample,
  maxReplyLength,
  embedded = false,
  title = "Auto-reply",
  aiExtra,
}: Props) {
  const uid = useId();
  const one = noun.replace(/s$/, "");
  const [auto, setAuto] = useState<State | null>(null);
  const [tick, setTick] = useState(0);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [newRule, setNewRule] = useState({ keywords: "", replyText: "" });
  const [tryText, setTryText] = useState("");
  const [tryResult, setTryResult] = useState<TryResult | null>(null);
  const [trying, setTrying] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>("ai");

  useEffect(() => {
    let cancelled = false;
    api<State>(basePath).then(
      (a) => {
        if (cancelled) return;
        setAuto(a);
        setError(null);
      },
      (e: Error) => !cancelled && setError(e.message)
    );
    return () => {
      cancelled = true;
    };
  }, [basePath, tick]);

  async function run(key: string, fn: () => Promise<unknown>, area: "rules" | "ai" = "rules") {
    const set = area === "ai" ? setAiError : setError;
    setBusy(key);
    set(null);
    try {
      await fn();
      setTick((n) => n + 1);
    } catch (err) {
      set((err as Error).message);
      setTick((n) => n + 1);
    } finally {
      setBusy(null);
    }
  }

  const put = (body: object) => api(basePath, { method: "PUT", body: JSON.stringify(body) });

  const toggleRules = () => {
    const next = !auto?.enabled;
    setAuto((a) => (a ? { ...a, enabled: next } : a));
    run("toggle", () => put({ enabled: next }));
  };

  const addRule = () =>
    run("add", async () => {
      await api(`${basePath}/rules`, { method: "POST", body: JSON.stringify(newRule) });
      setNewRule({ keywords: "", replyText: "" });
    });

  const pause = (r: Rule) =>
    run(`rule-${r.id}`, () =>
      api(`${basePath}/rules/${r.id}`, { method: "PUT", body: JSON.stringify({ enabled: !r.enabled }) })
    );

  const remove = (r: Rule) => run(`rule-${r.id}`, () => api(`${basePath}/rules/${r.id}`, { method: "DELETE" }));

  const toggleAi = () => {
    const next = !auto?.ai?.enabled;
    setAuto((a) => (a?.ai ? { ...a, ai: { ...a.ai, enabled: next } } : a));
    run("ai", () => put({ aiEnabled: next }), "ai");
  };

  async function tryIt() {
    if (!tryText.trim() || !auto?.ai?.available || trying) return;
    setTrying(true);
    setTryResult(null);
    setAiError(null);
    try {
      setTryResult(
        await api<TryResult>(`${basePath}/ai-test`, {
          method: "POST",
          body: JSON.stringify({ text: tryText }),
        })
      );
    } catch (err) {
      setAiError((err as Error).message);
    } finally {
      setTrying(false);
    }
  }

  const rulesOn = !!auto?.enabled;
  const aiOn = !!auto?.ai?.enabled;
  const active = rulesOn || aiOn;

  const rulesCount = auto?.rules.filter((r) => r.enabled).length ?? 0;
  const rulesViolation = rulesOn && rulesCount === 0;
  const aiIssue = aiOn && (!auto?.ai?.available || !!auto?.ai?.pausedUntil || !!aiError);
  const generalIssue = !!error || !!auto?.dryRun;
  const hasIssue = active && (rulesViolation || aiIssue || generalIssue);

  let overallStatus: StatusType = "disabled";
  let overallBadgeText = "Off";

  if (!auto) {
    overallStatus = "warning";
    overallBadgeText = error ? "Unavailable" : "Loading";
  } else if (!active) {
    overallStatus = "disabled";
    overallBadgeText = "Off";
  } else if (hasIssue) {
    overallStatus = "warning";
    if (auto.dryRun) overallBadgeText = "Simulation mode";
    else if (rulesViolation) overallBadgeText = "No keyword replies";
    else if (aiIssue && auto.ai?.pausedUntil) overallBadgeText = "AI paused";
    else if (aiIssue && !auto.ai?.available) overallBadgeText = "AI setup needed";
    else overallBadgeText = "Needs attention";
  } else {
    overallStatus = "enabled";
    overallBadgeText = "Active";
  }

  const aiStatus: StatusType = !aiOn
    ? "disabled"
    : !auto?.ai?.available || !!auto?.ai?.pausedUntil || !!aiError
      ? "warning"
      : "enabled";

  const aiBadgeText = !auto
    ? "Loading"
    : !aiOn
      ? "Off"
      : !auto?.ai?.available
        ? "Setup needed"
        : auto?.ai?.pausedUntil
          ? "Paused"
          : aiError
            ? "Issue"
            : "On";

  const rulesStatus: StatusType = !rulesOn ? "disabled" : rulesViolation || !!error ? "warning" : "enabled";

  const rulesBadgeText = !auto
    ? "Loading"
    : !rulesOn
      ? "Off"
      : rulesViolation
        ? "No keyword replies"
        : error
          ? "Issue"
          : `${rulesCount} active`;

  const tabs: TabId[] = ["ai", "keywords", "safety"];
  const tabId = (t: TabId) => `${uid}-tab-${t}`;
  const panelId = (t: TabId) => `${uid}-panel-${t}`;

  function onTabKey(e: KeyboardEvent<HTMLButtonElement>) {
    const i = tabs.indexOf(activeTab);
    let next = i;
    if (e.key === "ArrowRight") next = (i + 1) % tabs.length;
    else if (e.key === "ArrowLeft") next = (i + tabs.length - 1) % tabs.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = tabs.length - 1;
    else return;
    e.preventDefault();
    setActiveTab(tabs[next]);
    document.getElementById(tabId(tabs[next]))?.focus();
  }

  const panelSurface = `rounded-[22px] border border-[#e9e9ee] p-5 sm:p-6 ${embedded ? "bg-white" : "bg-[#fafafd]"}`;
  const pausedUntil = auto?.ai?.pausedUntil ? new Date(auto.ai.pausedUntil).toLocaleString() : null;
  const canSaveRule = busy !== "add" && newRule.replyText.trim().length > 0;

  return (
    <section
      aria-label={title}
      className={`w-full space-y-5 ${
        embedded
          ? "rounded-none border-none bg-transparent p-0 shadow-none"
          : "rounded-[26px] border border-[#e9e9ee] bg-white p-5 shadow-2xs sm:p-7"
      }`}
    >
      {/* ── Header ── */}
      <header className="flex items-start gap-3.5">
        <div
          aria-hidden="true"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#e2e2fc] text-slate-950"
        >
          <Bot size={22} />
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-bold tracking-tight text-slate-950">{title}</h2>
            <StatusBadge status={overallStatus} text={overallBadgeText} />
          </div>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-slate-600">
            Reply to Instagram {noun} automatically with AI, keyword replies, or both. Keyword replies are checked first.
          </p>
        </div>
      </header>

      {auto?.dryRun && (
        <Alert
          type="warning"
          showIcon
          title="Simulation mode is on"
          description="Replies are evaluated and logged but nothing is sent to Instagram."
          className="!rounded-2xl"
        />
      )}

      {!auto && error && (
        <Alert
          type="error"
          showIcon
          title="Could not load auto-reply settings"
          description={error}
          action={
            <button type="button" onClick={() => setTick((n) => n + 1)} className={`${BTN_SECONDARY} !h-9`}>
              Retry
            </button>
          }
          className="!rounded-2xl"
        />
      )}

      {/* ── Overview tabs ── */}
      <div role="tablist" aria-label={`${title} sections`} className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <TabCard
          id={tabId("ai")}
          panelId={panelId("ai")}
          selected={activeTab === "ai"}
          icon={<Bot size={18} />}
          label="AI replies"
          help="The AI reads each incoming message and writes a short, friendly reply for you. It stays silent when it is not sure."
          value={aiBadgeText}
          status={aiStatus}
          onSelect={() => setActiveTab("ai")}
          onKeyDown={onTabKey}
        />
        <TabCard
          id={tabId("keywords")}
          panelId={panelId("keywords")}
          selected={activeTab === "keywords"}
          icon={<Zap size={18} />}
          label="Keyword reply"
          help="You choose the words and the exact reply. When a message contains one of your keywords, that reply is sent. These are checked before the AI."
          value={rulesBadgeText}
          status={rulesStatus}
          onSelect={() => setActiveTab("keywords")}
          onKeyDown={onTabKey}
        />
        <TabCard
          id={tabId("safety")}
          panelId={panelId("safety")}
          selected={activeTab === "safety"}
          icon={<Gauge size={18} />}
          label="Hourly limit"
          help="The most automatic replies sent in one hour. When it is reached, the rest wait for the next hour. This helps protect your Instagram account."
          value={auto ? `${auto.maxPerHour} replies per hour` : "Loading"}
          onSelect={() => setActiveTab("safety")}
          onKeyDown={onTabKey}
        />
      </div>

      {!auto && !error && (
        <div className={panelSurface} aria-busy="true">
          <Skeleton active title={{ width: "30%" }} paragraph={{ rows: 4 }} />
        </div>
      )}

      {/* ── AI replies ── */}
      {auto && activeTab === "ai" && (
        <div
          role="tabpanel"
          id={panelId("ai")}
          aria-labelledby={tabId("ai")}
          tabIndex={0}
          className={`space-y-5 ${FOCUS} rounded-[22px] motion-safe:animate-in motion-safe:fade-in duration-200`}
        >
          <div className={`${panelSurface} space-y-5`}>
            <PanelHeader
              title="AI replies"
              description={`The AI reads each incoming ${one}, writes a short friendly answer, and stays silent when it is unsure.`}
              status={aiStatus}
              badge={aiBadgeText}
              checked={aiOn}
              onChange={toggleAi}
              disabled={!auto.ai?.available || busy === "ai"}
              loading={busy === "ai"}
            />

            {!auto.ai?.available && (
              <Alert
                type="warning"
                showIcon
                title="AI key missing"
                description="Add OPENROUTER_API_KEY to the backend environment and restart the service to turn on AI replies."
                className="!rounded-2xl"
              />
            )}

            {pausedUntil && (
              <Alert
                type="info"
                showIcon
                title="AI replies are paused"
                description={`Automatic AI replies resume after ${pausedUntil}.`}
                className="!rounded-2xl"
              />
            )}

            {aiError && <Alert type="error" showIcon title="AI request failed" description={aiError} className="!rounded-2xl" />}

            {/* Sandbox */}
            <div className="space-y-3 rounded-2xl border border-[#e9e9ee] bg-white p-4 sm:p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label htmlFor={`${uid}-try`} className="flex items-center gap-2 text-sm font-semibold text-slate-950">
                  <Sparkles size={15} aria-hidden="true" />
                  Try the AI
                </label>
                <span className="text-xs font-medium text-slate-600">Preview only. Nothing is sent.</span>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  id={`${uid}-try`}
                  type="text"
                  value={tryText}
                  onChange={(e) => setTryText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && tryIt()}
                  placeholder={`Example: "Loved the reel! Where can I buy this?"`}
                  className={`${INPUT} h-11`}
                />
                <button
                  type="button"
                  onClick={tryIt}
                  disabled={trying || !tryText.trim() || !auto.ai?.available}
                  className={BTN_PRIMARY}
                >
                  <Sparkles size={14} aria-hidden="true" />
                  {trying ? "Generating…" : "Test reply"}
                </button>
              </div>

              <div aria-live="polite">
                {tryResult && (
                  <div className="space-y-3 rounded-2xl bg-[#F1F3F7] p-4">
                    <div className="flex justify-end">
                      <p className="max-w-[80%] rounded-[18px] bg-black px-4 py-2 text-sm text-white">{tryText}</p>
                    </div>
                    <div className="flex max-w-[90%] items-start gap-2.5">
                      <span
                        aria-hidden="true"
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#e2e2fc] text-xs font-bold text-slate-950"
                      >
                        AI
                      </span>
                      <div className="min-w-0 space-y-1.5">
                        {tryResult.silent ? (
                          <p className="rounded-[18px] border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                            <span className="font-semibold">The AI chose to stay silent: </span>
                            {tryResult.reason || "safety rule or low confidence"}
                          </p>
                        ) : (
                          <p className="rounded-[18px] border border-[#e9e9ee] bg-white p-3.5 text-sm leading-relaxed text-slate-900">
                            {tryResult.reply}
                          </p>
                        )}
                        <p className="flex flex-wrap items-center gap-2 text-xs font-medium text-slate-600">
                          <span className="rounded-md bg-white px-2 py-0.5">{tryResult.model}</span>
                          <span className="inline-flex items-center gap-1">
                            <Zap size={12} aria-hidden="true" />
                            {tryResult.seconds}s
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <Collapse
              ghost
              items={[
                {
                  key: "guardrails",
                  label: (
                    <span className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                      <ShieldCheck size={15} aria-hidden="true" />
                      How the AI stays safe
                    </span>
                  ),
                  children: (
                    <ul className="grid grid-cols-1 gap-2.5 text-sm text-slate-700 sm:grid-cols-2">
                      {[
                        "Never shares prices, stock, delivery dates or payment details.",
                        "Stays silent when unsure or when someone complains.",
                        "Never sends the same answer to the same person twice in a day.",
                        "Ignores prompt injection and adversarial input.",
                      ].map((t) => (
                        <li key={t} className="flex items-start gap-2 rounded-2xl border border-[#e9e9ee] bg-[#F1F3F7] p-3">
                          <Check size={14} aria-hidden="true" className="mt-0.5 shrink-0 text-emerald-700" />
                          <span>{t}</span>
                        </li>
                      ))}
                    </ul>
                  ),
                },
              ]}
            />
          </div>

          {aiExtra}
        </div>
      )}

      {/* ── Keyword reply ── */}
      {auto && activeTab === "keywords" && (
        <div
          role="tabpanel"
          id={panelId("keywords")}
          aria-labelledby={tabId("keywords")}
          tabIndex={0}
          className={`${panelSurface} space-y-5 ${FOCUS} motion-safe:animate-in motion-safe:fade-in duration-200`}
        >
          <PanelHeader
            title="Keyword reply"
            description={`Send an exact reply when a ${one} contains certain words. A keyword reply with no keywords answers any other ${one}.`}
            status={rulesStatus}
            badge={rulesBadgeText}
            checked={rulesOn}
            onChange={toggleRules}
            disabled={busy === "toggle"}
            loading={busy === "toggle"}
          />

          {error && <Alert type="error" showIcon title="Something went wrong" description={error} className="!rounded-2xl" />}

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-5">
            {/* Rule list */}
            <div className="lg:col-span-3">
              {auto.rules.length === 0 ? (
                <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center">
                  <span
                    aria-hidden="true"
                    className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e2e2fc] text-slate-950"
                  >
                    <Zap size={18} />
                  </span>
                  <p className="text-sm font-semibold text-slate-900">No keyword replies yet</p>
                  <p className="max-w-xs text-sm text-slate-600">Create your first keyword reply, or start from a template on the right.</p>
                </div>
              ) : (
                <ul className="space-y-3">
                  {auto.rules.map((r) => {
                    const kws = r.keywords.trim()
                      ? r.keywords.split(",").map((k) => k.trim()).filter(Boolean)
                      : [`any other ${one}`];
                    const rowBusy = busy === `rule-${r.id}`;
                    return (
                      <li
                        key={r.id}
                        className={`rounded-2xl border border-[#e9e9ee] p-4 ${r.enabled ? "bg-white" : "bg-slate-50"}`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1 space-y-2.5">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="text-xs font-semibold text-slate-600">
                                {r.keywords.trim() ? `When a ${one} contains` : "Applies to"}
                              </span>
                              {kws.map((k, i) => (
                                <span
                                  key={`${k}-${i}`}
                                  className="rounded-full border border-[#e9e9ee] bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-900"
                                >
                                  {k}
                                </span>
                              ))}
                              {!r.enabled && (
                                <span className="rounded-full bg-slate-200 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
                                  Paused
                                </span>
                              )}
                            </div>
                            <p className="break-words rounded-xl bg-[#F1F3F7] px-3 py-2.5 text-sm leading-relaxed text-slate-800">
                              {r.replyText}
                            </p>
                          </div>

                          <div className="flex shrink-0 items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => pause(r)}
                              disabled={rowBusy}
                              aria-label={`${r.enabled ? "Pause" : "Resume"} rule for ${kws.join(", ")}`}
                              className={BTN_SECONDARY}
                            >
                              {r.enabled ? <Pause size={13} aria-hidden="true" /> : <Play size={13} aria-hidden="true" />}
                              <span className="hidden sm:inline">{r.enabled ? "Pause" : "Resume"}</span>
                            </button>
                            <Popconfirm
                              title="Delete this rule?"
                              description="This cannot be undone."
                              onConfirm={() => remove(r)}
                              okText="Delete"
                              cancelText="Cancel"
                              okButtonProps={{ danger: true }}
                            >
                              <button
                                type="button"
                                disabled={rowBusy}
                                aria-label={`Delete rule for ${kws.join(", ")}`}
                                className={`flex h-10 w-10 cursor-pointer items-center justify-center rounded-full text-slate-600 transition-colors hover:bg-rose-50 hover:text-rose-700 disabled:opacity-40 ${FOCUS}`}
                              >
                                <Trash2 size={15} aria-hidden="true" />
                              </button>
                            </Popconfirm>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            {/* Composer */}
            <form
              className="space-y-4 rounded-2xl border border-[#e9e9ee] bg-white p-4 sm:p-5 lg:col-span-2"
              onSubmit={(e) => {
                e.preventDefault();
                if (canSaveRule) addRule();
              }}
            >
              <h4 className="flex items-center gap-2 text-sm font-semibold text-slate-950">
                <Plus size={15} aria-hidden="true" />
                New keyword reply
              </h4>

              {templates.length > 0 && (
                <div>
                  <p className="mb-1.5 text-xs font-semibold text-slate-600">Start from a template</p>
                  <div className="flex flex-wrap gap-1.5">
                    {templates.map((t) => (
                      <button
                        key={t.name}
                        type="button"
                        onClick={() => setNewRule({ keywords: t.keywords, replyText: t.replyText })}
                        className={`min-h-9 cursor-pointer rounded-full border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-800 transition-colors hover:bg-slate-100 ${FOCUS}`}
                      >
                        {t.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label htmlFor={`${uid}-kw`} className="mb-1 block text-sm font-semibold text-slate-800">
                  Keywords
                </label>
                <input
                  id={`${uid}-kw`}
                  type="text"
                  value={newRule.keywords}
                  onChange={(e) => setNewRule({ ...newRule, keywords: e.target.value })}
                  placeholder={keywordsExample}
                  aria-describedby={`${uid}-kw-help`}
                  className={`${INPUT} h-11`}
                />
                <p id={`${uid}-kw-help`} className="mt-1 text-xs text-slate-600">
                  Separate with commas. Leave empty to answer any other {one}.
                </p>
              </div>

              <div>
                <div className="mb-1 flex items-center justify-between gap-2">
                  <label htmlFor={`${uid}-reply`} className="text-sm font-semibold text-slate-800">
                    Reply
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setNewRule((r) => ({
                        ...r,
                        replyText: (r.replyText.trim() ? r.replyText + " " : "") + "{username}",
                      }))
                    }
                    className={`min-h-9 cursor-pointer rounded-lg px-2 text-xs font-semibold text-slate-900 underline-offset-2 hover:underline ${FOCUS}`}
                  >
                    Insert {"{username}"}
                  </button>
                </div>
                <textarea
                  id={`${uid}-reply`}
                  rows={4}
                  value={newRule.replyText}
                  maxLength={maxReplyLength}
                  onChange={(e) => setNewRule({ ...newRule, replyText: e.target.value })}
                  placeholder={replyExample}
                  aria-describedby={`${uid}-reply-count`}
                  className={`${INPUT} resize-none py-2.5 leading-relaxed`}
                />
                <p id={`${uid}-reply-count`} className="mt-1 text-right text-xs tabular-nums text-slate-600">
                  {newRule.replyText.length}/{maxReplyLength}
                </p>
              </div>

              <button type="submit" disabled={!canSaveRule} className={`${BTN_PRIMARY} w-full`}>
                <Plus size={15} aria-hidden="true" />
                {busy === "add" ? "Saving…" : "Save keyword reply"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── Hourly limit ── */}
      {auto && activeTab === "safety" && (
        <div
          role="tabpanel"
          id={panelId("safety")}
          aria-labelledby={tabId("safety")}
          tabIndex={0}
          className={`${panelSurface} space-y-5 ${FOCUS} motion-safe:animate-in motion-safe:fade-in duration-200`}
        >
          <PanelHeader
            title="Hourly limit"
            description="Caps how many automatic replies are sent each hour, which helps protect your Instagram account standing."
            status="enabled"
            badge={`${auto.maxPerHour} per hour`}
          />

          {error && <Alert type="error" showIcon title="Could not save the limit" description={error} className="!rounded-2xl" />}

          <div className="flex flex-col gap-3 rounded-2xl border border-[#e9e9ee] bg-white p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
            <div>
              <label htmlFor={`${uid}-cap`} className="text-sm font-semibold text-slate-800">
                Maximum replies per hour
              </label>
              <p className="mt-0.5 text-xs text-slate-600">
                Between 1 and 200. When the limit is reached, remaining messages wait for the next hour.
              </p>
            </div>
            <div className="flex items-center gap-2.5">
              <InputNumber
                id={`${uid}-cap`}
                min={1}
                max={200}
                size="large"
                defaultValue={auto.maxPerHour}
                key={auto.maxPerHour}
                onBlur={(e) => {
                  const n = Number(e.target.value);
                  if (Number.isInteger(n) && n >= 1 && n <= 200 && n !== auto.maxPerHour) {
                    run("maxPerHour", () => put({ maxPerHour: n }));
                  }
                }}
                className="!w-24"
              />
              <span className="text-sm font-medium text-slate-700" aria-live="polite">
                {busy === "maxPerHour" ? "Saving…" : "per hour"}
              </span>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

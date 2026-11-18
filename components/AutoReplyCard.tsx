"use client";

import { useEffect, useState } from "react";
import {
  Switch,
  Input,
  InputNumber,
  Button,
  Tag,
  Alert,
  Empty,
  Tooltip,
  Popconfirm,
  Collapse,
  Space,
} from "antd";
import {
  Bot,
  Zap,
  ShieldCheck,
  Send,
  Eye,
  Plus,
  Trash2,
  Pause,
  Play,
  Sparkles,
  Check,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Lightbulb,
} from "lucide-react";
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
};

export type StatusType = "enabled" | "disabled" | "warning";

export function StatusDot({
  status,
  pulse = true,
}: {
  status: StatusType;
  pulse?: boolean;
}) {
  if (status === "enabled") {
    return (
      <span className="relative flex h-2 w-2 shrink-0">
        {pulse && (
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
        )}
        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
      </span>
    );
  }
  if (status === "warning") {
    return (
      <span className="relative flex h-2 w-2 shrink-0">
        {pulse && (
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
        )}
        <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
      </span>
    );
  }
  return (
    <span className="relative flex h-2 w-2 shrink-0">
      <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500" />
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
      ? "border-amber-200 bg-amber-50 text-amber-800"
      : "border-rose-200 bg-rose-50 text-rose-800";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full ${
        text ? "px-2.5 py-0.5" : "px-2 py-1"
      } text-[11px] font-bold border shrink-0 ${styles} ${className}`}
    >
      <StatusDot status={status} />
      {text ? <span>{text}</span> : null}
    </span>
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
}: Props) {
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
  const [activeTab, setActiveTab] = useState<"ai" | "keywords" | "safety">("ai");

  useEffect(() => {
    let cancelled = false;
    api<State>(basePath).then(
      (a) => !cancelled && setAuto(a),
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

  const remove = (r: Rule) =>
    run(`rule-${r.id}`, () => api(`${basePath}/rules/${r.id}`, { method: "DELETE" }));

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
  let overallBadgeText = "Disabled";

  if (!auto) {
    overallStatus = "warning";
    overallBadgeText = "Loading…";
  } else if (!active) {
    overallStatus = "disabled";
    overallBadgeText = "Disabled";
  } else if (hasIssue) {
    overallStatus = "warning";
    if (auto.dryRun) overallBadgeText = "Simulation Mode";
    else if (rulesViolation) overallBadgeText = "No Rules Active";
    else if (aiIssue && auto.ai?.pausedUntil) overallBadgeText = "AI Paused";
    else if (aiIssue && !auto.ai?.available) overallBadgeText = "AI Setup Needed";
    else if (aiError || error) overallBadgeText = "Issue Detected";
    else overallBadgeText = "Warning";
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
    ? "Loading…"
    : !aiOn
    ? "Off"
    : !auto?.ai?.available
    ? "Setup Needed"
    : auto?.ai?.pausedUntil
    ? "Paused"
    : aiError
    ? "Issue"
    : "Enabled";

  const rulesStatus: StatusType = !rulesOn
    ? "disabled"
    : rulesViolation || !!error
    ? "warning"
    : "enabled";

  const rulesBadgeText = !rulesOn
    ? "Off"
    : rulesViolation
    ? "0 Active"
    : !!error
    ? "Issue"
    : `${rulesCount} Active`;

  return (
    <div
      className={`w-full space-y-6 ${
        embedded
          ? "border-none shadow-none p-0 bg-transparent rounded-none"
          : "rounded-[26px] border border-[#e9e9ee] bg-white p-5 sm:p-7 shadow-2xs"
      }`}
    >
      {/* ── 1. UNIFIED EXECUTIVE HEADER & METRICS BAR ── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-[#e9e9ee]/70">
        <div className="flex items-center gap-3.5">
          <div
            style={{ backgroundColor: "#e2e2fc" }}
            className="w-12 h-12 rounded-2xl text-slate-950 flex items-center justify-center shrink-0 shadow-2xs font-bold"
          >
            <Bot size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-slate-950 tracking-tight">Auto-Reply Control Suite</h2>
              <StatusBadge status={overallStatus} text={overallBadgeText} />
            </div>
            <p className="text-xs font-medium text-slate-500 mt-0.5">
              Intelligent generative AI responses & instant keyword routing for Instagram {noun}.
            </p>
          </div>
        </div>

        {/* Status Pills */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-50 border border-[#e9e9ee] text-xs">
            <Bot size={13} className="text-slate-500" />
            <span className="font-semibold text-slate-500">AI:</span>
            <span className="font-bold text-slate-900">{aiBadgeText}</span>
          </div>

          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-50 border border-[#e9e9ee] text-xs">
            <Zap size={13} className="text-slate-500" />
            <span className="font-semibold text-slate-500">Keywords:</span>
            <span className="font-bold text-slate-900">{rulesBadgeText}</span>
          </div>

          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-50 border border-[#e9e9ee] text-xs">
            <ShieldCheck size={13} className="text-slate-500" />
            <span className="font-semibold text-slate-500">Cap:</span>
            <span className="font-bold text-slate-900">{auto ? `${auto.maxPerHour}/hr` : "…"}</span>
          </div>
        </div>
      </div>

      {/* ── 2. SUB-TABS: AI REPLIES / KEYWORD RULES / SAFETY LIMITS ── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          type="button"
          onClick={() => setActiveTab("ai")}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "ai"
              ? "bg-black text-white shadow-xs"
              : "bg-white hover:bg-slate-50 text-slate-700 border border-[#e9e9ee] hover:border-black/30 shadow-2xs"
          }`}
        >
          <Bot size={14} />
          <span>AI Smart Replies</span>
          <StatusDot status={aiStatus} pulse={false} />
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("keywords")}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "keywords"
              ? "bg-black text-white shadow-xs"
              : "bg-white hover:bg-slate-50 text-slate-700 border border-[#e9e9ee] hover:border-black/30 shadow-2xs"
          }`}
        >
          <Zap size={14} />
          <span>Keyword Rules</span>
          <span className="px-1.5 py-0.2 rounded-full bg-slate-200/80 text-[10px] text-slate-800">
            {rulesCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("safety")}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "safety"
              ? "bg-black text-white shadow-xs"
              : "bg-white hover:bg-slate-50 text-slate-700 border border-[#e9e9ee] hover:border-black/30 shadow-2xs"
          }`}
        >
          <ShieldCheck size={14} />
          <span>Safety & Rate Limits</span>
        </button>
      </div>

      {/* ── 3. TAB 1: AI SMART REPLIES ── */}
      {activeTab === "ai" && (
        <div className="space-y-5 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-50 border border-[#e9e9ee]">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-950">Generative AI Auto-Responder</span>
                <StatusBadge status={aiStatus} text={aiBadgeText} />
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                AI reads incoming {noun}, recognizes sentiment, and composes short, friendly responses without manual rules.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <span className="text-xs font-bold text-slate-700">{aiOn ? "Enabled" : "Disabled"}</span>
              <Switch
                checked={aiOn}
                onChange={toggleAi}
                disabled={!auto?.ai?.available || busy === "ai"}
                loading={busy === "ai" || !auto}
              />
            </div>
          </div>

          {auto && !auto.ai?.available && (
            <Alert
              type="warning"
              showIcon
              title="AI Engine Key Missing"
              description="To enable AI responses, add OPENROUTER_API_KEY in backend/.env and restart the service."
              className="!rounded-2xl"
            />
          )}

          {/* Interactive Live Sandbox */}
          <div className="rounded-[22px] border border-[#e9e9ee] bg-gradient-to-b from-[#fafafd] to-white p-5 space-y-4 shadow-2xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles size={15} className="text-purple-600" />
                <span className="text-xs font-bold text-slate-950">Live Response Sandbox</span>
              </div>
              <span className="text-[10px] font-semibold text-slate-400">Simulation • Zero messages sent</span>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={tryText}
                onChange={(e) => setTryText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && tryIt()}
                placeholder={`Type a mock ${one}: e.g. "Loved the reel! Where can I buy this?"`}
                className="flex-1 px-4 py-2.5 rounded-full border border-[#e9e9ee] focus:border-black text-xs sm:text-sm font-medium focus:outline-none bg-white shadow-2xs"
              />
              <button
                type="button"
                onClick={tryIt}
                disabled={trying || !tryText.trim() || !auto?.ai?.available}
                className="px-5 py-2.5 rounded-full bg-black hover:bg-neutral-800 text-white text-xs font-bold shadow-xs cursor-pointer disabled:opacity-40 transition-all shrink-0 flex items-center gap-1.5"
              >
                <Sparkles size={13} />
                <span>{trying ? "Generating..." : "Test AI"}</span>
              </button>
            </div>

            {tryResult && (
              <div className="rounded-2xl border border-slate-200/90 bg-white p-4 space-y-3 animate-in fade-in duration-200">
                <div className="flex justify-end">
                  <div className="max-w-[75%] rounded-[18px] bg-black px-4 py-2 text-xs font-medium text-white shadow-2xs">
                    {tryText}
                  </div>
                </div>

                <div className="flex items-start gap-2.5 max-w-[85%]">
                  <div className="w-7 h-7 rounded-xl bg-[#e2e2fc] text-slate-950 flex items-center justify-center text-xs font-bold shrink-0">
                    AI
                  </div>
                  <div className="space-y-1.5 flex-1">
                    {tryResult.silent ? (
                      <div className="rounded-[18px] bg-amber-50 border border-amber-200 p-3 text-xs text-amber-900">
                        <span className="font-bold">AI chooses to stay silent: </span>
                        <span>{tryResult.reason || "Safety boundary or low confidence threshold"}</span>
                      </div>
                    ) : (
                      <div className="rounded-[18px] bg-[#f8f9fc] border border-slate-200/70 p-3.5 text-xs text-slate-900 leading-relaxed font-medium">
                        {tryResult.reply}
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-[10px] font-semibold text-slate-400">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">{tryResult.model}</span>
                      <span>⚡ {tryResult.seconds}s response latency</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Core Guardrails */}
          <Collapse
            ghost
            items={[
              {
                key: "guardrails",
                label: (
                  <span className="text-xs font-bold text-slate-700 hover:text-black flex items-center gap-2 cursor-pointer">
                    <ShieldCheck size={14} className="text-slate-900" />
                    <span>View 7 Safety Guardrails & Principles</span>
                  </span>
                ),
                children: (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1 text-xs text-slate-600">
                    <div className="p-3 rounded-2xl bg-slate-50 border border-[#e9e9ee] flex items-start gap-2">
                      <Check size={13} className="text-emerald-600 shrink-0 mt-0.5" />
                      <span>Never discloses prices, stock, delivery dates, or payment details.</span>
                    </div>
                    <div className="p-3 rounded-2xl bg-slate-50 border border-[#e9e9ee] flex items-start gap-2">
                      <Check size={13} className="text-emerald-600 shrink-0 mt-0.5" />
                      <span>Stays completely silent when uncertain or encountering complaints.</span>
                    </div>
                    <div className="p-3 rounded-2xl bg-slate-50 border border-[#e9e9ee] flex items-start gap-2">
                      <Check size={13} className="text-emerald-600 shrink-0 mt-0.5" />
                      <span>Never sends the same response twice to the same user in a day.</span>
                    </div>
                    <div className="p-3 rounded-2xl bg-slate-50 border border-[#e9e9ee] flex items-start gap-2">
                      <Check size={13} className="text-emerald-600 shrink-0 mt-0.5" />
                      <span>Ignores prompt injections and adversarial inputs automatically.</span>
                    </div>
                  </div>
                ),
              },
            ]}
          />
        </div>
      )}

      {/* ── 4. TAB 2: KEYWORD RULES ── */}
      {activeTab === "keywords" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-50 border border-[#e9e9ee]">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-950">Keyword Automation Rules</span>
                <StatusBadge status={rulesStatus} text={rulesBadgeText} />
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                Exact responses matched first whenever a comment contains specific keywords.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <span className="text-xs font-bold text-slate-700">{rulesOn ? "Enabled" : "Disabled"}</span>
              <Switch
                checked={rulesOn}
                onChange={toggleRules}
                disabled={!auto || busy === "toggle"}
                loading={busy === "toggle"}
              />
            </div>
          </div>

          {/* Active Rules List */}
          <div className="space-y-3">
            {auto?.rules.map((r) => (
              <div
                key={r.id}
                className="p-4 rounded-[22px] border border-[#e9e9ee] bg-white shadow-2xs hover:border-black/30 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-2 min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs font-bold text-slate-400">If contains:</span>
                    {(r.keywords.trim()
                      ? r.keywords.split(",").map((k) => k.trim()).filter(Boolean)
                      : [`Any other ${one}`]
                    ).map((k) => (
                      <span
                        key={k}
                        className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-900 text-xs font-bold border border-slate-200"
                      >
                        {k}
                      </span>
                    ))}
                  </div>
                  <p className="text-xs font-medium text-slate-800 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    &ldquo;{r.replyText}&rdquo;
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  <button
                    type="button"
                    onClick={() => pause(r)}
                    disabled={busy === `rule-${r.id}`}
                    className="px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    {r.enabled ? <Pause size={12} /> : <Play size={12} />}
                    <span>{r.enabled ? "Pause" : "Resume"}</span>
                  </button>

                  <Popconfirm
                    title="Delete this rule?"
                    description="Are you sure you want to delete this auto-reply rule?"
                    onConfirm={() => remove(r)}
                    okText="Delete"
                    cancelText="Cancel"
                    okButtonProps={{ danger: true }}
                  >
                    <button
                      type="button"
                      disabled={busy === `rule-${r.id}`}
                      className="w-8 h-8 rounded-full hover:bg-rose-50 text-slate-400 hover:text-rose-600 flex items-center justify-center transition-colors cursor-pointer"
                    >
                      <Trash2 size={13} />
                    </button>
                  </Popconfirm>
                </div>
              </div>
            ))}

            {auto?.rules.length === 0 && (
              <div className="rounded-[22px] border border-dashed border-[#e9e9ee] p-8 text-center text-slate-400 text-xs font-medium">
                No keyword rules configured yet. Create one below or select a template.
              </div>
            )}
          </div>

          {/* Add New Rule Form */}
          <div className="rounded-[24px] border border-[#e9e9ee] bg-[#fafafd] p-5 space-y-4 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-950 flex items-center gap-1.5">
                <Plus size={14} />
                <span>Create New Keyword Trigger</span>
              </span>

              {/* Template chips */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                <span className="text-[10px] font-bold text-slate-400">Templates:</span>
                {templates.map((t) => (
                  <button
                    key={t.name}
                    type="button"
                    onClick={() => setNewRule({ keywords: t.keywords, replyText: t.replyText })}
                    className="px-2.5 py-1 rounded-full bg-white hover:bg-slate-100 text-slate-800 text-[11px] font-semibold border border-[#e9e9ee] transition-all cursor-pointer whitespace-nowrap"
                  >
                    {t.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Trigger Keywords (comma separated)</label>
                <input
                  type="text"
                  value={newRule.keywords}
                  onChange={(e) => setNewRule({ ...newRule, keywords: e.target.value })}
                  placeholder={keywordsExample}
                  className="w-full px-3.5 py-2 text-xs rounded-xl bg-white border border-[#e9e9ee] focus:border-black focus:outline-none"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-bold text-slate-600">Reply Message</label>
                  <button
                    type="button"
                    onClick={() =>
                      setNewRule((r) => ({
                        ...r,
                        replyText: (r.replyText.trim() ? r.replyText + " " : "") + "{username}",
                      }))
                    }
                    className="text-[10px] font-bold text-blue-600 hover:underline cursor-pointer"
                  >
                    + Insert {"{username}"}
                  </button>
                </div>
                <input
                  type="text"
                  value={newRule.replyText}
                  onChange={(e) => setNewRule({ ...newRule, replyText: e.target.value })}
                  placeholder={replyExample}
                  className="w-full px-3.5 py-2 text-xs rounded-xl bg-white border border-[#e9e9ee] focus:border-black focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={addRule}
                disabled={busy === "add" || !newRule.replyText.trim()}
                className="px-5 py-2 rounded-full bg-black hover:bg-neutral-800 text-white text-xs font-bold shadow-xs cursor-pointer disabled:opacity-40 transition-all flex items-center gap-1.5"
              >
                <Plus size={13} />
                <span>Save Rule</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 5. TAB 3: SAFETY & RATE LIMITS ── */}
      {activeTab === "safety" && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-[22px] bg-slate-50 border border-[#e9e9ee]">
            <div>
              <h3 className="text-sm font-bold text-slate-950">Hourly Rate Limiting</h3>
              <p className="text-xs text-slate-600 mt-0.5">
                Caps the maximum number of automated responses dispatched per hour to protect your Instagram account standing.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <InputNumber
                min={1}
                max={200}
                defaultValue={auto?.maxPerHour ?? 35}
                key={auto?.maxPerHour}
                onBlur={(e) => {
                  const n = Number(e.target.value);
                  if (Number.isInteger(n) && n >= 1 && n <= 200 && n !== auto?.maxPerHour) {
                    run("maxPerHour", () => put({ maxPerHour: n }));
                  }
                }}
                className="!w-20 text-center"
              />
              <span className="text-xs font-bold text-slate-700">replies / hr</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
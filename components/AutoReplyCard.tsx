"use client";

import { useEffect, useState } from "react";
import {
  Card,
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
  RobotOutlined,
  ThunderboltOutlined,
  SafetyCertificateOutlined,
  PlusOutlined,
  DeleteOutlined,
  PauseCircleOutlined,
  PlayCircleOutlined,
  MessageOutlined,
  SendOutlined,
  TagOutlined,
  ExperimentOutlined,
  EyeOutlined,
  BulbOutlined,
  CheckOutlined,
} from "@ant-design/icons";
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
};

const time = (iso: string) => new Date(iso).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });

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
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : status === "warning"
      ? "border-amber-200 bg-amber-50 text-amber-700"
      : "border-rose-200 bg-rose-50 text-rose-700";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full ${
        text ? "px-2.5 py-0.5" : "px-2 py-1"
      } text-[11px] sm:text-xs font-semibold border shrink-0 ${styles} ${className}`}
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

  useEffect(() => {
    let cancelled = false;
    api<State>(basePath).then(
      (a) => !cancelled && setAuto(a),
      (e: Error) => !cancelled && setError(e.message),
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
    } finally {
      setBusy(null);
    }
  }

  const put = (body: object) => api(basePath, { method: "PUT", body: JSON.stringify(body) });
  const toggleRules = () => run("toggle", () => put({ enabled: !auto?.enabled }));
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

  const toggleAi = () => run("ai", () => put({ aiEnabled: !auto?.ai?.enabled }), "ai");

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

  // Diagnostics & Status detection
  const rulesCount = auto?.rules.filter((r) => r.enabled).length ?? 0;
  const rulesViolation = rulesOn && rulesCount === 0;
  const aiIssue = aiOn && (!auto?.ai?.available || !!auto?.ai?.pausedUntil || !!aiError);
  const generalIssue = !!error || !!auto?.dryRun;
  const hasIssue = active && (rulesViolation || aiIssue || generalIssue);

  // Overall status resolution
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

  // AI individual status
  const aiStatus: StatusType = !aiOn
    ? "disabled"
    : !auto?.ai?.available || !!auto?.ai?.pausedUntil || !!aiError
    ? "warning"
    : "enabled";

  const aiBadgeText = !aiOn
    ? "Disabled"
    : !auto?.ai?.available
    ? "Setup Needed"
    : auto?.ai?.pausedUntil
    ? "Paused"
    : aiError
    ? "Issue"
    : "Active";

  // Rules individual status
  const rulesStatus: StatusType = !rulesOn
    ? "disabled"
    : rulesViolation || !!error
    ? "warning"
    : "enabled";

  const rulesBadgeText = !rulesOn
    ? "Disabled"
    : rulesViolation
    ? "0 Rules"
    : !!error
    ? "Issue"
    : "Active";

  // Dynamic naming, icon, and status badge reflecting exact active behavior
  const behaviorConfig = !auto
    ? {
        title: "Auto-reply",
        icon: <ThunderboltOutlined className="text-lg" />,
        badgeText: "Loading…",
      }
    : rulesOn && aiOn
    ? {
        title: "AI & Keyword",
        icon: <RobotOutlined className="text-lg" />,
        badgeText: overallBadgeText,
      }
    : aiOn
    ? {
        title: "AI Auto-responder",
        icon: <RobotOutlined className="text-lg" />,
        badgeText: overallBadgeText,
      }
    : rulesOn
    ? {
        title: "Keyword Auto-reply",
        icon: <ThunderboltOutlined className="text-lg" />,
        badgeText: overallBadgeText,
      }
    : {
        title: "Auto-reply (Inactive)",
        icon: <PauseCircleOutlined className="text-lg" />,
        badgeText: "Disabled",
      };

  return (
    <div className="w-full flex flex-col gap-8 md:gap-10">
      {/* ── Top Header Card (Minimalist Monochromatic with Subtle Accents) ── */}
      <Card
        variant="outlined"
        className="!rounded-2xl !border-slate-200/80 !bg-white !shadow-sm w-full [&>.ant-card-body]:!p-4 sm:[&>.ant-card-body]:!p-6 lg:[&>.ant-card-body]:!p-7"
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 sm:gap-5">
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            <div className="flex h-10 w-10 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white shadow-2xs">
              {behaviorConfig.icon}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap sm:flex-nowrap">
                <h2 className="text-base sm:text-lg font-bold tracking-tight text-slate-900 leading-tight">
                  {behaviorConfig.title}
                </h2>
                <StatusBadge status={overallStatus} text={behaviorConfig.badgeText} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 w-full lg:w-auto lg:flex lg:items-center lg:gap-2.5 shrink-0 pt-3 border-t border-slate-100 lg:border-t-0 lg:pt-0">
            <div className="flex flex-col lg:flex-row items-center justify-center lg:justify-start gap-1 lg:gap-2 rounded-xl lg:rounded-lg bg-slate-50 border border-slate-200/80 px-2 py-2 lg:px-3 lg:py-1.5 text-center lg:text-left">
              <span className="text-[10px] lg:text-xs text-slate-400 font-medium uppercase lg:normal-case tracking-wider lg:tracking-normal truncate">
                AI Replies
              </span>
              <div className="flex items-center gap-1.5">
                <StatusDot status={aiStatus} pulse={false} />
                <span
                  className={`text-xs font-bold lg:font-semibold ${
                    aiStatus === "enabled"
                      ? "text-slate-900"
                      : aiStatus === "warning"
                      ? "text-amber-800"
                      : "text-slate-500"
                  }`}
                >
                  {aiOn ? (aiStatus === "warning" ? "Attention" : "Enabled") : "Off"}
                </span>
              </div>
            </div>
            <div className="flex flex-col lg:flex-row items-center justify-center lg:justify-start gap-1 lg:gap-2 rounded-xl lg:rounded-lg bg-slate-50 border border-slate-200/80 px-2 py-2 lg:px-3 lg:py-1.5 text-center lg:text-left">
              <span className="text-[10px] lg:text-xs text-slate-400 font-medium uppercase lg:normal-case tracking-wider lg:tracking-normal truncate">
                Trigger Rules
              </span>
              <div className="flex items-center gap-1.5">
                <StatusDot status={rulesStatus} pulse={false} />
                <span
                  className={`text-xs font-bold lg:font-semibold ${
                    rulesStatus === "enabled"
                      ? "text-slate-900"
                      : rulesStatus === "warning"
                      ? "text-amber-800"
                      : "text-slate-500"
                  }`}
                >
                  {rulesOn ? `${rulesCount} active` : "Off"}
                </span>
              </div>
            </div>
            <div className="flex flex-col lg:flex-row items-center justify-center lg:justify-start gap-1 lg:gap-2 rounded-xl lg:rounded-lg bg-slate-50 border border-slate-200/80 px-2 py-2 lg:px-3 lg:py-1.5 text-center lg:text-left">
              <span className="text-[10px] lg:text-xs text-slate-400 font-medium uppercase lg:normal-case tracking-wider lg:tracking-normal truncate">
                Hourly Cap
              </span>
              <span className="text-xs font-bold lg:font-semibold text-slate-900">
                {auto?.maxPerHour ?? 35} / hr
              </span>
            </div>
          </div>
        </div>

        {auto?.dryRun && (
          <Alert
            type="warning"
            showIcon
            title="Dry-run Mode Active"
            description="Automatic replies are running in simulation mode. Generated replies will only be logged in your server console and won't be sent out to real users."
            className="!mt-5 !rounded-xl"
          />
        )}
      </Card>

      {/* ── AI Replies Card ── */}
      <Card
        variant="outlined"
        className="!rounded-2xl !border-slate-200/80 !bg-white !shadow-sm hover:!shadow-md transition-shadow w-full [&>.ant-card-body]:!p-4 sm:[&>.ant-card-body]:!p-6 lg:[&>.ant-card-body]:!p-7"
      >
        {/* Header row: Icon + Title + Switch */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-800 border border-slate-200/80">
              <RobotOutlined className="text-lg" />
            </div>
            <div className="flex items-center gap-2 flex-wrap min-w-0">
              <h3 className="text-base font-bold text-slate-900 leading-tight">AI replies</h3>
              <StatusBadge status={aiStatus} text={aiBadgeText} />
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs font-medium text-slate-500 hidden sm:inline">
              {aiOn ? "Enabled" : "Disabled"}
            </span>
            <Switch
              checked={aiOn}
              onChange={toggleAi}
              disabled={!auto?.ai?.available || busy === "ai"}
              loading={busy === "ai"}
            />
          </div>
        </div>

        {/* Description text full-width */}
        <p className="mt-2.5 text-xs text-slate-500 leading-relaxed max-w-3xl">
          Works on its own: no rules needed. The AI reads each new {one} and writes a short, friendly reply. It
          knows nothing about your prices, stock or delivery, so it never states them: those questions are left for
          you. It also stays silent whenever it is not sure.
        </p>

        {auto && !auto.ai?.available && (
          <Alert
            type="warning"
            showIcon
            title="AI Engine Not Configured"
            description={
              <span>
                To enable AI responses, add <code>OPENROUTER_API_KEY</code> to <code>backend/.env</code> and restart the backend.
              </span>
            }
            className="!mt-5 !rounded-xl"
          />
        )}

        {auto?.ai?.pausedUntil && (
          <Alert
            type="warning"
            showIcon
            title="AI Service Temporarily Paused"
            description={`The AI service encountered repeated errors, so AI replies are paused until ${time(
              auto.ai.pausedUntil
            )}. Waiting ${noun} will be answered afterwards.`}
            className="!mt-5 !rounded-xl"
          />
        )}

        {aiError && (
          <Alert
            type="error"
            showIcon
            title="AI Error"
            description={aiError}
            className="!mt-5 !rounded-xl"
          />
        )}

        {/* ── Try It - Neutral Sleek Sandbox ── */}
        <div className="mt-5 sm:mt-6 rounded-xl border border-slate-200/80 bg-slate-50/60 p-3.5 sm:p-5 space-y-3 sm:space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-2">
            <div className="flex items-center gap-2">
              <ExperimentOutlined className="text-slate-600 text-xs sm:text-sm" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Try it (Live Sandbox)
              </span>
            </div>
            <span className="text-[11px] text-slate-400">
              Draft sandbox preview • No message is sent
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Input
              size="middle"
              value={tryText}
              onChange={(e) => setTryText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && tryText.trim() && auto?.ai?.available && !trying) {
                  tryIt();
                }
              }}
              placeholder={`Type a message to test AI reply…`}
              prefix={<MessageOutlined className="text-slate-400 mr-1 text-xs" />}
              maxLength={500}
              className="!rounded-xl flex-1 !border-slate-200 text-xs sm:text-sm !h-10"
              disabled={!auto?.ai?.available}
            />
            <Button
              type="primary"
              size="middle"
              onClick={tryIt}
              loading={trying}
              disabled={trying || !tryText.trim() || !auto?.ai?.available}
              icon={<SendOutlined />}
              className="!rounded-xl !px-4 sm:!px-6 shrink-0 !h-10 text-xs sm:text-sm font-semibold"
            >
              {trying ? "…" : "Try"}
            </Button>
          </div>

          {tryResult && (
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs space-y-3 animate-page-entrance">
              {/* Simulated Customer Message */}
              <div className="flex justify-end">
                <div className="max-w-[75%] rounded-2xl rounded-tr-xs bg-slate-900 px-4 py-2.5 text-sm text-white shadow-2xs">
                  {tryText}
                </div>
              </div>

              {/* Simulated AI Response */}
              <div className="flex items-start gap-2.5 max-w-[85%]">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200">
                  AI
                </div>
                <div className="space-y-1.5 flex-1">
                  {tryResult.silent ? (
                    <div className="rounded-2xl rounded-tl-xs bg-amber-50/80 border border-amber-200/90 px-4 py-2.5 text-sm text-amber-900 shadow-2xs">
                      <div className="font-semibold text-xs text-amber-800 mb-0.5">
                        The AI would stay silent:
                      </div>
                      <span className="text-amber-700 text-xs">{tryResult.reason || "Confidence threshold or safety boundary not met"}</span>
                    </div>
                  ) : (
                    <div className="rounded-2xl rounded-tl-xs bg-slate-50 border border-slate-200 px-4 py-2.5 text-sm text-slate-800 shadow-2xs whitespace-pre-wrap break-words leading-relaxed">
                      {tryResult.reply}
                    </div>
                  )}
                  <div className="flex flex-wrap items-center gap-2 pt-0.5 text-[11px] text-slate-400">
                    <Tag className="!m-0 !text-[10px] !bg-slate-100 !border-slate-200 !text-slate-600">
                      {tryResult.model}
                    </Tag>
                    <span>⚡ {tryResult.seconds}s response</span>
                    <span>• Draft only, nothing was sent</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── AI Guardrails Accordion (Minimalist Neutral Palette) ── */}
        <div className="mt-5">
          <Collapse
            ghost
            items={[
              {
                key: "guardrails",
                label: (
                  <span className="text-xs font-medium text-slate-600 hover:text-slate-900 flex items-center gap-2">
                    <SafetyCertificateOutlined className="text-slate-600" />
                    <span>What the AI never does (7 Core Guardrails)</span>
                  </span>
                ),
                children: (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1 text-xs text-slate-600">
                    <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-200/70 flex items-start gap-2.5">
                      <CheckOutlined className="text-slate-400 text-xs mt-0.5 shrink-0" />
                      <span>Never sees {noun} about refunds, complaints, legal matters, card numbers, OTPs, or passwords.</span>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-200/70 flex items-start gap-2.5">
                      <CheckOutlined className="text-slate-400 text-xs mt-0.5 shrink-0" />
                      <span>Never states prices, stock, delivery, links, phone numbers, or emails.</span>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-200/70 flex items-start gap-2.5">
                      <CheckOutlined className="text-slate-400 text-xs mt-0.5 shrink-0" />
                      <span>Never promises delivery dates, discounts, or &ldquo;we will check&rdquo;.</span>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-200/70 flex items-start gap-2.5">
                      <CheckOutlined className="text-slate-400 text-xs mt-0.5 shrink-0" />
                      <span>Stays silent when unsure, and ignores prompt injections hidden in user messages.</span>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-200/70 flex items-start gap-2.5">
                      <CheckOutlined className="text-slate-400 text-xs mt-0.5 shrink-0" />
                      <span>Does not reply if an admin or teammate recently replied in the conversation.</span>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-200/70 flex items-start gap-2.5">
                      <CheckOutlined className="text-slate-400 text-xs mt-0.5 shrink-0" />
                      <span>Automatically pauses for 5 minutes if API encounters repeated failures.</span>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-200/70 flex items-start gap-2.5 sm:col-span-2">
                      <CheckOutlined className="text-slate-400 text-xs mt-0.5 shrink-0" />
                      <span>Never sends the same reply to the same person twice in a day, and adheres strictly to hourly limits.</span>
                    </div>
                  </div>
                ),
              },
            ]}
          />
        </div>
      </Card>

      {/* ── Keyword Rules Card ── */}
      <Card
        variant="outlined"
        className="!rounded-2xl !border-slate-200/80 !bg-white !shadow-sm hover:!shadow-md transition-shadow w-full [&>.ant-card-body]:!p-4 sm:[&>.ant-card-body]:!p-6 lg:[&>.ant-card-body]:!p-7"
      >
        {/* Header row: Icon + Title + Switch */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-800 border border-slate-200/80">
              <ThunderboltOutlined className="text-lg" />
            </div>
            <div className="flex items-center gap-2 flex-wrap min-w-0">
              <h3 className="text-base font-bold text-slate-900 leading-tight">Keyword</h3>
              <StatusBadge status={rulesStatus} text={rulesBadgeText} />
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs font-medium text-slate-500 hidden sm:inline">
              {rulesOn ? "Enabled" : "Disabled"}
            </span>
            <Switch
              checked={rulesOn}
              onChange={toggleRules}
              disabled={!auto || busy === "toggle"}
              loading={busy === "toggle"}
            />
          </div>
        </div>

        {/* Description text full-width */}
        <p className="mt-2.5 text-xs text-slate-500 leading-relaxed max-w-3xl">
          Your exact wording, used first when a {one} contains one of the keywords. When rules are off, they are
          ignored and the AI (if on) answers everything.
        </p>

        {error && (
          <Alert
            type="error"
            showIcon
            title="Rule Error"
            description={error}
            className="!mt-5 !rounded-xl"
          />
        )}

        {rulesOn && auto && auto.rules.filter((r) => r.enabled).length === 0 && (
          <Alert
            type="warning"
            showIcon
            title="Rules Enabled but None Active"
            description="Rules are turned on, but no active rule is configured. Add a rule below, or turn rules off to let the AI answer."
            className="!mt-5 !rounded-xl"
          />
        )}

        {/* ── Active Rules List ── */}
        <div className="mt-6 space-y-3 max-h-[440px] overflow-y-auto pr-1">
          {auto?.rules.map((r) => (
            <div
              key={r.id}
              className={`flex items-start justify-between gap-4 rounded-xl border p-4.5 transition-all ${
                r.enabled && rulesOn
                  ? "border-slate-200/90 bg-white shadow-2xs hover:border-slate-300"
                  : "border-slate-200/60 bg-slate-50/70 opacity-60"
              }`}
            >
              <div className="min-w-0 flex-1 space-y-2">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-xs font-medium text-slate-500">
                    {r.keywords.trim() ? "Contains:" : "Applies to:"}
                  </span>
                  {(r.keywords.trim()
                    ? r.keywords.split(",").map((k) => k.trim()).filter(Boolean)
                    : [`Any other ${one}`]
                  ).map((k) => (
                    <Tag
                      key={k}
                      className="!rounded-md !bg-slate-100 !border-slate-200 !text-slate-800 !text-xs !font-medium"
                    >
                      {k}
                    </Tag>
                  ))}
                  {r.enabled && rulesOn ? (
                    <StatusBadge status="enabled" text="Active" className="!ml-auto" />
                  ) : r.enabled && !rulesOn ? (
                    <StatusBadge status="warning" text="Rules Inactive" className="!ml-auto" />
                  ) : (
                    <StatusBadge status="disabled" text="Paused" className="!ml-auto" />
                  )}
                </div>

                <div className="rounded-lg bg-slate-50 border border-slate-200/60 p-3 text-xs text-slate-800 font-mono whitespace-pre-wrap break-words leading-relaxed">
                  &ldquo;{r.replyText}&rdquo;
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-2 pt-1">
                <Tooltip title={r.enabled ? "Pause this rule" : "Resume this rule"}>
                  <Button
                    size="small"
                    icon={r.enabled ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
                    onClick={() => pause(r)}
                    disabled={busy === `rule-${r.id}`}
                    className="!text-xs"
                  >
                    {r.enabled ? "Pause" : "Resume"}
                  </Button>
                </Tooltip>

                <Popconfirm
                  title="Delete this rule?"
                  description="Are you sure you want to delete this auto-reply rule?"
                  onConfirm={() => remove(r)}
                  okText="Delete"
                  cancelText="Cancel"
                  okButtonProps={{ danger: true }}
                >
                  <Tooltip title="Delete rule">
                    <Button
                      size="small"
                      danger
                      icon={<DeleteOutlined />}
                      disabled={busy === `rule-${r.id}`}
                      className="!text-xs"
                    />
                  </Tooltip>
                </Popconfirm>
              </div>
            </div>
          ))}

          {auto?.rules.length === 0 && (
            <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center bg-slate-50/40">
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  <span className="text-xs text-slate-400">
                    No rules yet. Add one below, or start from a pre-built template.
                  </span>
                }
              />
            </div>
          )}
        </div>

        {/* ── Add Rule Form ── */}
        <div className="mt-6 rounded-xl border border-slate-200/80 bg-slate-50/50 p-5 space-y-4">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="font-semibold text-slate-700 flex items-center gap-1.5 mr-1">
              <BulbOutlined className="text-slate-500" />
              <span>Start from template:</span>
            </span>
            {templates.map((t) => (
              <button
                key={t.name}
                type="button"
                onClick={() => setNewRule({ keywords: t.keywords, replyText: t.replyText })}
                className="cursor-pointer rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-2xs hover:border-slate-400 hover:bg-slate-50 transition-colors active:scale-95"
              >
                {t.name}
              </button>
            ))}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (newRule.replyText.trim()) addRule();
            }}
          >
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
              {/* Left Column: Inputs */}
              <div className="lg:col-span-7 space-y-3.5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-slate-700">
                      If the {one} contains{" "}
                      <span className="font-normal text-slate-400">(optional, separate with commas)</span>
                    </label>
                    <span className="text-[11px] text-slate-400">Leave blank to answer any {one}</span>
                  </div>
                  <Input
                    size="large"
                    value={newRule.keywords}
                    onChange={(e) => setNewRule({ ...newRule, keywords: e.target.value })}
                    placeholder={keywordsExample}
                    prefix={<TagOutlined className="text-slate-400 mr-1" />}
                    maxLength={500}
                    className="!rounded-xl !border-slate-200"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-slate-700">Reply with</label>
                    <Button
                      size="small"
                      type="link"
                      onClick={() =>
                        setNewRule((r) => ({
                          ...r,
                          replyText: (r.replyText.trim() ? r.replyText + " " : "") + "{username}",
                        }))
                      }
                      className="!text-xs !p-0 !h-auto !text-blue-600"
                    >
                      + Insert {"{username}"}
                    </Button>
                  </div>
                  <Input.TextArea
                    value={newRule.replyText}
                    onChange={(e) => setNewRule({ ...newRule, replyText: e.target.value })}
                    placeholder={replyExample}
                    rows={3}
                    maxLength={maxReplyLength}
                    showCount
                    className="!rounded-xl resize-none !border-slate-200"
                  />
                </div>
              </div>

              {/* Right Column: Live Follower Preview Box */}
              <div className="lg:col-span-5 flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-2xs space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500">
                    <div className="flex items-center gap-1.5">
                      <EyeOutlined className="text-slate-500" />
                      <span>Live Follower Preview</span>
                    </div>
                    <span className="text-slate-400 font-normal">Customer view</span>
                  </div>
                  <div className="rounded-lg bg-slate-50 border border-slate-200/60 p-3 min-h-[90px] flex items-center">
                    <p className="text-xs text-slate-800 whitespace-pre-wrap break-words leading-relaxed font-mono">
                      {newRule.replyText.trim()
                        ? newRule.replyText.replaceAll("{username}", "riya.styles")
                        : "Type a reply message on the left to see customer preview…"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-100">
                  <span className="text-[11px] text-slate-400">
                    <code>{"{username}"}</code> is personalized
                  </span>
                  <Button
                    type="primary"
                    size="large"
                    htmlType="submit"
                    loading={busy === "add"}
                    disabled={busy === "add" || !newRule.replyText.trim()}
                    icon={<PlusOutlined />}
                    className="!rounded-xl !px-5"
                  >
                    Add Rule
                  </Button>
                </div>
              </div>
            </div>
          </form>
        </div>
      </Card>

      {/* ── Safety Limits Card ── */}
      <Card
        variant="outlined"
        className="!rounded-2xl !border-slate-200/80 !bg-white !shadow-sm hover:!shadow-md transition-shadow w-full [&>.ant-card-body]:!p-4 sm:[&>.ant-card-body]:!p-6 lg:[&>.ant-card-body]:!p-7"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-800 border border-slate-200/80">
              <SafetyCertificateOutlined className="text-lg" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900">Safety limits</h3>
              <p className="mt-0.5 text-xs text-slate-500">
                Guards your account against Instagram rate limits by capping total automated replies per hour.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-medium text-slate-600">Never more than</span>
            <Space.Compact size="middle">
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
              <span className="inline-flex items-center rounded-r-lg border border-l-0 border-slate-200 bg-slate-50 px-3 text-xs text-slate-600">
                replies / hour
              </span>
            </Space.Compact>
          </div>
        </div>
      </Card>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { Switch, Alert } from "antd";
import { Check } from "lucide-react";
import { api } from "@/lib/api";
import { AutoReplyCard, StatusBadge, type RuleTemplate } from "./AutoReplyCard";

const TEMPLATES: RuleTemplate[] = [
  { name: "Greeting", keywords: "hi, hello, hey", replyText: "Hi {username}! Thanks for messaging us. We'll get back to you shortly." },
  { name: "Price question", keywords: "price, cost, rate, how much", replyText: "Hi {username}! Tell us which item you like and we'll share the price." },
  { name: "Order", keywords: "order, buy, purchase", replyText: "Hi {username}! To place an order, please send us the item name and your size." },
  { name: "Away message", keywords: "", replyText: "Thanks {username}! We got your message and will reply as soon as we can." },
];

const FALLBACK_MAX = 500;

type AutoReplySettings = { ai: { enabled: boolean; fallbackEnabled: boolean; fallbackText: string } };

export function MessageAutomation() {
  const [ai, setAi] = useState<AutoReplySettings["ai"] | null>(null);
  const [fallbackText, setFallbackText] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const dirty = !!ai && fallbackText.trim() !== (ai.fallbackText ?? "").trim();

  const fallback = ai?.enabled ? (
    <div className="space-y-4 rounded-[22px] border border-[#e9e9ee] bg-white p-5 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-semibold text-slate-950">Holding reply</h3>
            <StatusBadge status={ai.fallbackEnabled ? "enabled" : "disabled"} text={ai.fallbackEnabled ? "On" : "Off"} />
          </div>
          <p className="mt-1 max-w-xl text-sm leading-relaxed text-slate-600">
            The AI stays silent on sensitive topics or when it is unsure. Send this short message instead, so the customer
            knows a person will follow up.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2.5">
          <span className="text-sm font-medium text-slate-700" aria-hidden="true">
            {ai.fallbackEnabled ? "On" : "Off"}
          </span>
          <Switch
            checked={ai.fallbackEnabled}
            onChange={(checked) => saveFallback({ fallbackEnabled: checked })}
            disabled={saving}
            aria-label={`Holding reply: ${ai.fallbackEnabled ? "on" : "off"}`}
          />
        </div>
      </div>

      {error && <Alert type="error" showIcon title="Could not save the holding reply" description={error} className="!rounded-2xl" />}

      <div>
        <label htmlFor="holding-reply" className="mb-1 block text-sm font-semibold text-slate-800">
          Message
        </label>
        <textarea
          id="holding-reply"
          rows={3}
          value={fallbackText}
          maxLength={FALLBACK_MAX}
          disabled={!ai.fallbackEnabled}
          onChange={(e) => setFallbackText(e.target.value)}
          placeholder="Thanks for reaching out! We've received your message and someone from our team will get back to you shortly."
          className="w-full resize-none rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm leading-relaxed text-slate-900 placeholder:text-slate-500 focus-visible:border-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20 disabled:bg-slate-50 disabled:text-slate-500"
        />
        <p className="mt-1 text-right text-xs tabular-nums text-slate-600">
          {fallbackText.length}/{FALLBACK_MAX}
        </p>
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => saveFallback({ fallbackText })}
          disabled={saving || !ai.fallbackEnabled || !dirty}
          className="inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-full bg-black px-5 text-sm font-semibold text-white transition-colors hover:bg-neutral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Check size={15} aria-hidden="true" />
          {saving ? "Saving…" : "Save holding reply"}
        </button>
      </div>
    </div>
  ) : null;

  return (
    <div className="mx-auto w-full max-w-5xl pb-16 animate-page-entrance">
      <AutoReplyCard
        embedded
        title="Auto-reply"
        basePath="/messages/auto-reply"
        noun="messages"
        templates={TEMPLATES}
        keywordsExample="e.g. price, order, hello"
        replyExample="e.g. Hi {username}! Thanks for messaging us."
        maxReplyLength={1000}
        aiExtra={fallback}
      />
    </div>
  );
}

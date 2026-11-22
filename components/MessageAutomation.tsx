"use client";

import { useEffect, useState } from "react";
import { Card, Switch, Input, Button, Tag, Alert } from "antd";
import { ClockCircleOutlined, CheckOutlined } from "@ant-design/icons";
import { api } from "@/lib/api";
import { AutoReplyCard, type RuleTemplate } from "./AutoReplyCard";

const TEMPLATES: RuleTemplate[] = [
  { name: "Greeting", keywords: "hi, hello, hey", replyText: "Hi {username}! Thanks for messaging us. We'll get back to you shortly." },
  { name: "Price question", keywords: "price, cost, rate, how much", replyText: "Hi {username}! Tell us which item you like and we'll share the price." },
  { name: "Order", keywords: "order, buy, purchase", replyText: "Hi {username}! To place an order, please send us the item name and your size." },
  { name: "Away message", keywords: "", replyText: "Thanks {username}! We got your message and will reply as soon as we can." },
];

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
          className="!rounded-[22px] !border-[#e9e9ee] !bg-white !shadow-2xs hover:!shadow-2xs transition-shadow w-full [&>.ant-card-body]:!p-4 sm:[&>.ant-card-body]:!p-6 lg:[&>.ant-card-body]:!p-7"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-5 flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-800 border border-[#e9e9ee]">
                <ClockCircleOutlined className="text-lg" />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-semibold text-slate-900">
                    Holding reply fallback
                  </h3>
                  <Tag className="!rounded-md !px-2 !py-0.2 !text-[11px] !bg-slate-100 !border-[#e9e9ee] !text-slate-700 !font-medium">
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
                  className="!rounded-xl resize-none !border-[#e9e9ee] text-xs sm:text-sm"
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

    </div>
  );
}

"use client";

import React, { useEffect, useState } from "react";
import { Alert, App, Button, Modal, Segmented, Select, Tag } from "antd";
import { SettingOutlined } from "@ant-design/icons";
import { api } from "@/lib/api";

export interface OpenRouterHealth {
  status: string;
  healthy: boolean;
  latencyMs: number;
  model: string;
  provider: string;
  remainingRequests: number;
  totalLimit: number;
}

// The AI model that writes automatic replies and captions: one row in the Settings list (check the connection, change the model).
export function OpenRouterCard() {
  const { message } = App.useApp();

  const [openRouterHealth, setOpenRouterHealth] = useState<OpenRouterHealth | null>(null);
  const [openRouterLoading, setOpenRouterLoading] = useState(false);
  const [openRouterModalOpen, setOpenRouterModalOpen] = useState(false);
  const [openRouterModelInput, setOpenRouterModelInput] = useState("nvidia/nemotron-3-ultra");
  const [modelCatalog, setModelCatalog] = useState<{ id: string; name: string; free: boolean }[]>([]);
  const [freeTierOnly, setFreeTierOnly] = useState<boolean | null>(null);
  const [catalogError, setCatalogError] = useState(false);
  const [modelFilter, setModelFilter] = useState<"all" | "free" | "paid">("all");
  const [savingOpenRouter, setSavingOpenRouter] = useState(false);

  // Ping OpenRouter AI Gateway
  const pingOpenRouter = async () => {
    setOpenRouterLoading(true);
    try {
      const data: any = await api("/ai/ping", { method: "POST", body: JSON.stringify({}) }).catch(async () => {
        const res = await fetch("/api/integrations/openrouter");
        return res.json();
      });
      setOpenRouterHealth(data);
      if (data.model) setOpenRouterModelInput(data.model);
      return data as OpenRouterHealth;
    } catch {
      const fallback: OpenRouterHealth = {
        status: "error",
        healthy: false,
        latencyMs: 0,
        model: "nvidia/nemotron-3-ultra",
        provider: "OpenRouter",
        remainingRequests: 0,
        totalLimit: 50,
      };
      setOpenRouterHealth(fallback);
      return fallback;
    } finally {
      setOpenRouterLoading(false);
    }
  };

  const fetchOpenRouterConfig = async () => {
    try {
      const data: any = await api("/ai/config").catch(() => null);
      if (data) {
        if (data.model) setOpenRouterModelInput(data.model);
      }
    } catch {}
  };

  useEffect(() => {
    fetchOpenRouterConfig();
    pingOpenRouter();
  }, []);

  // Full OpenRouter catalog (free + paid) and whether this account can only use free models.
  useEffect(() => {
    if (!openRouterModalOpen || modelCatalog.length) return;
    api("/ai/models")
      .then((d: any) => {
        setModelCatalog(d.models);
        setFreeTierOnly(d.freeTierOnly);
        setCatalogError(false);
      })
      .catch(() => setCatalogError(true));
  }, [openRouterModalOpen, modelCatalog.length]);

  const selectedModel = modelCatalog.find((m) => m.id === openRouterModelInput);
  const selectedPaid = selectedModel ? !selectedModel.free : false;

  const handleSaveOpenRouter = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingOpenRouter(true);
    try {
      const data: any = await api("/ai/config", {
        method: "POST",
        body: JSON.stringify({ model: openRouterModelInput }),
      });
      message.success(`AI model changed to ${data.model}`);
      setOpenRouterModalOpen(false);
      await pingOpenRouter();
    } catch (err: any) {
      message.error(err.message || "Failed to save the AI model");
    } finally {
      setSavingOpenRouter(false);
    }
  };

  const activeModel = openRouterHealth?.model || openRouterModelInput;
  const healthText = !openRouterHealth
    ? "checking…"
    : openRouterHealth.healthy || openRouterHealth.status === "operational"
      ? `responding${openRouterHealth.latencyMs ? ` in ${openRouterHealth.latencyMs}ms` : ""}`
      : "not responding";

  return (
    <>
      <div className="flex items-center justify-between gap-6 py-4 border-b border-[#e9e9ee]">
        <div className="min-w-0">
          <div className="text-sm font-medium text-slate-900">AI model</div>
          <p className="mt-0.5 text-xs leading-relaxed text-slate-500">
            Writes your automatic replies and captions. Using{" "}
            <span className="break-all font-mono text-slate-700">{activeModel}</span> · {healthText}.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => pingOpenRouter()}
            disabled={openRouterLoading}
            className="inline-flex h-8 items-center rounded-lg border border-[#e9e9ee] bg-white px-3 text-xs font-medium text-slate-800 transition-colors hover:bg-[#F1F3F7] disabled:opacity-60"
          >
            {openRouterLoading ? "Checking…" : "Check"}
          </button>
          <button
            type="button"
            onClick={() => setOpenRouterModalOpen(true)}
            className="inline-flex h-8 items-center rounded-lg border border-[#e9e9ee] bg-white px-3 text-xs font-medium text-slate-800 transition-colors hover:bg-[#F1F3F7]"
          >
            Change
          </button>
        </div>
      </div>

      {/* Model picker */}
      <Modal
        title={
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-black text-white shadow-2xs">
              <SettingOutlined className="text-base" />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-900">Choose Your AI Model</div>
              <div className="text-[11px] text-slate-400 font-normal">Runs on the platform&apos;s AI connection</div>
            </div>
          </div>
        }
        open={openRouterModalOpen}
        onCancel={() => setOpenRouterModalOpen(false)}
        footer={null}
        width={540}
        className="!rounded-[22px]"
      >
        <form onSubmit={handleSaveOpenRouter} className="space-y-4 pt-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Active Architecture / Model</label>
            <div className="flex items-center justify-between gap-2 mb-2">
              <Segmented
                size="small"
                value={modelFilter}
                onChange={(v) => setModelFilter(v as "all" | "free" | "paid")}
                options={[
                  { label: `All (${modelCatalog.length})`, value: "all" },
                  { label: `Free (${modelCatalog.filter((m) => m.free).length})`, value: "free" },
                  { label: `Paid (${modelCatalog.filter((m) => !m.free).length})`, value: "paid" },
                ]}
              />
              {freeTierOnly !== null && (
                <Tag color={freeTierOnly ? "green" : "gold"} className="!mr-0 text-[10px] font-semibold">
                  {freeTierOnly ? "Account: free models only" : "Account: credits available"}
                </Tag>
              )}
            </div>
            <Select
              showSearch
              value={openRouterModelInput}
              onChange={setOpenRouterModelInput}
              className="w-full !rounded-xl"
              loading={!modelCatalog.length && !catalogError}
              placeholder="Search models…"
              filterOption={(input, opt) => `${opt?.value} ${opt?.name}`.toLowerCase().includes(input.toLowerCase())}
              optionRender={(o) => (
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate">
                    {o.data.name} <span className="text-slate-400 text-[11px]">{o.data.value}</span>
                  </span>
                  <Tag color={o.data.free ? "green" : "gold"} className="!mr-0 text-[10px] font-semibold shrink-0">
                    {o.data.free ? "Free" : "Paid"}
                  </Tag>
                </div>
              )}
              options={modelCatalog
                .filter((m) => modelFilter === "all" || (modelFilter === "free") === m.free)
                .map((m) => ({ value: m.id, label: m.id, name: m.name, free: m.free }))}
            />
            {catalogError && (
              <p className="text-[11px] text-rose-500 mt-1">Could not load the model list. Close and reopen this window to retry.</p>
            )}
            {selectedPaid && (
              <Alert
                className="!mt-2 !rounded-xl"
                showIcon
                type={freeTierOnly ? "error" : "warning"}
                title={
                  freeTierOnly === true
                    ? "Your account can only use free models. Pick a free model, or add credits on OpenRouter (openrouter.ai/settings/credits) first."
                    : freeTierOnly === false
                      ? "This is a paid model: every reply is billed to your OpenRouter credits."
                      : "This is a paid model. We could not check your account, so it may fail if you have no credits."
                }
              />
            )}
            <p className="text-[11px] text-slate-400 mt-1">Pick the AI model that writes your replies and captions.</p>
          </div>

          <div className="pt-2 flex items-center justify-end border-t border-slate-100">
            <div className="flex items-center gap-2">
              <Button onClick={() => setOpenRouterModalOpen(false)} className="!rounded-xl">
                Cancel
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={savingOpenRouter}
                disabled={selectedPaid && freeTierOnly === true}
                className="!rounded-xl !bg-black hover:!bg-slate-800 font-semibold"
              >
                Save Model
              </Button>
            </div>
          </div>
        </form>
      </Modal>
    </>
  );
}
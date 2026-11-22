"use client";

import React, { useEffect, useState } from "react";
import { App, Button, Input, Modal, Popconfirm, Switch } from "antd";
import { CloudUploadOutlined } from "@ant-design/icons";

export interface CloudinaryConfig {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
  autoOptimize: boolean;
  connected: boolean;
  isCustom: boolean;
}

export interface CloudinaryHealth {
  status: "operational" | "degraded" | "error" | "not_configured";
  healthy: boolean;
  latencyMs: number;
  cloudName: string;
  cdnUrl: string;
  apiVerified: boolean;
  edgeDelivery: boolean;
  message: string;
  features: string[];
  timestamp?: string;
}

const STORAGE_KEY = "ighub_cloudinary_config";

// Where customer photos are hosted before Instagram publishes them: one row in the Settings list
// (check the connection, change the Cloudinary account, reset to the demo CDN).
export function CloudinaryCard() {
  const { message } = App.useApp();

  const [cloudinaryConfig, setCloudinaryConfig] = useState<CloudinaryConfig>({
    cloudName: "hrnqhbaa",
    apiKey: "641864532532992",
    apiSecret: "",
    autoOptimize: true,
    connected: true,
    isCustom: true,
  });
  const [cloudinaryHealth, setCloudinaryHealth] = useState<CloudinaryHealth | null>(null);
  const [cloudinaryLoading, setCloudinaryLoading] = useState(false);
  const [cloudinaryModalOpen, setCloudinaryModalOpen] = useState(false);
  const [cloudNameInput, setCloudNameInput] = useState("hrnqhbaa");
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [apiSecretInput, setApiSecretInput] = useState("");
  const [autoOptimizeInput, setAutoOptimizeInput] = useState(true);
  const [savingCloudinary, setSavingCloudinary] = useState(false);

  // Ping Cloudinary Edge CDN and Admin API
  const pingCloudinary = async (customCloudName?: string, customKey?: string, customSecret?: string) => {
    setCloudinaryLoading(true);
    try {
      const cName = customCloudName ?? cloudinaryConfig.cloudName ?? "demo";
      const params = new URLSearchParams({ cloudName: cName });
      if (customKey) params.append("apiKey", customKey);
      if (customSecret) params.append("apiSecret", customSecret);
      const res = await fetch(`/api/integrations/cloudinary?${params.toString()}`);
      const data = await res.json();
      setCloudinaryHealth(data);
      return data as CloudinaryHealth;
    } catch (err: any) {
      const fallback: CloudinaryHealth = {
        status: "error",
        healthy: false,
        latencyMs: 0,
        cloudName: customCloudName || "demo",
        cdnUrl: `https://res.cloudinary.com/${customCloudName || "demo"}`,
        apiVerified: false,
        edgeDelivery: false,
        message: err.message || "Failed to reach CDN",
        features: [],
      };
      setCloudinaryHealth(fallback);
      return fallback;
    } finally {
      setCloudinaryLoading(false);
    }
  };

  // Re-check the Cloudinary connection
  const handleCheckCloudinary = async () => {
    const cRes = await pingCloudinary(cloudinaryConfig.cloudName, cloudinaryConfig.apiKey, cloudinaryConfig.apiSecret);
    message.success(`Cloudinary checked (${cRes?.latencyMs ?? 150}ms)`);
  };

  // Save Cloudinary Configuration
  const handleSaveCloudinary = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cloudNameInput.trim()) {
      message.warning("Please enter your Cloudinary Cloud Name");
      return;
    }
    setSavingCloudinary(true);
    try {
      const res = await fetch("/api/integrations/cloudinary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cloudName: cloudNameInput.trim(),
          apiKey: apiKeyInput.trim(),
          apiSecret: apiSecretInput.trim(),
          autoOptimize: autoOptimizeInput,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to connect Cloudinary");
      }
      const newConfig: CloudinaryConfig = {
        cloudName: cloudNameInput.trim(),
        apiKey: apiKeyInput.trim(),
        apiSecret: apiSecretInput.trim(),
        autoOptimize: autoOptimizeInput,
        connected: true,
        isCustom: cloudNameInput.trim().toLowerCase() !== "demo",
      };
      setCloudinaryConfig(newConfig);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newConfig));
      setCloudinaryModalOpen(false);
      message.success(`Connected to Cloudinary account: ${cloudNameInput.trim()}!`);
      await pingCloudinary(newConfig.cloudName, newConfig.apiKey, newConfig.apiSecret);
    } catch (err: any) {
      message.error(err.message || "Failed to verify Cloudinary credentials");
    } finally {
      setSavingCloudinary(false);
    }
  };

  const handleLoadDemoCloudinary = () => {
    setCloudNameInput("demo");
    setApiKeyInput("");
    setApiSecretInput("");
    setAutoOptimizeInput(true);
    message.info("Populated Cloudinary Demo CDN configuration");
  };

  const handleDisconnectCloudinary = () => {
    const resetConfig: CloudinaryConfig = {
      cloudName: "demo",
      apiKey: "",
      apiSecret: "",
      autoOptimize: true,
      connected: false,
      isCustom: false,
    };
    setCloudinaryConfig(resetConfig);
    setCloudNameInput("demo");
    setApiKeyInput("");
    setApiSecretInput("");
    localStorage.removeItem(STORAGE_KEY);
    message.info("Cloudinary custom credentials removed. Restored demo CDN fallback.");
    pingCloudinary("demo");
  };

  // Load the saved Cloudinary account and check it
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setCloudinaryConfig(parsed);
        setCloudNameInput(parsed.cloudName || "hrnqhbaa");
        setApiKeyInput(parsed.apiKey || "");
        setAutoOptimizeInput(parsed.autoOptimize ?? true);
        pingCloudinary(parsed.cloudName, parsed.apiKey, parsed.apiSecret);
      } else {
        pingCloudinary("hrnqhbaa");
      }
    } catch {
      pingCloudinary("hrnqhbaa");
    }
  }, []);

  const healthText = !cloudinaryHealth
    ? "checking…"
    : cloudinaryHealth.healthy
      ? `responding${cloudinaryHealth.latencyMs ? ` in ${cloudinaryHealth.latencyMs}ms` : ""}`
      : "not responding";

  return (
    <>
      <div className="flex items-center justify-between gap-6 py-4 border-b border-[#e9e9ee]">
        <div className="min-w-0">
          <div className="text-sm font-medium text-slate-900">Media CDN (Cloudinary)</div>
          <p className="mt-0.5 text-xs leading-relaxed text-slate-500">
            Hosts the customer photos before they are published to Instagram. Cloud{" "}
            <span className="break-all font-mono text-slate-700">@{cloudinaryConfig.cloudName || "hrnqhbaa"}</span> (
            {cloudinaryConfig.isCustom ? "your account" : "demo, for testing"}) · {healthText}.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={handleCheckCloudinary}
            disabled={cloudinaryLoading}
            className="inline-flex h-8 items-center rounded-lg border border-[#e9e9ee] bg-white px-3 text-xs font-medium text-slate-800 transition-colors hover:bg-[#F1F3F7] disabled:opacity-60"
          >
            {cloudinaryLoading ? "Checking…" : "Check"}
          </button>
          <button
            type="button"
            onClick={() => setCloudinaryModalOpen(true)}
            className="inline-flex h-8 items-center rounded-lg border border-[#e9e9ee] bg-white px-3 text-xs font-medium text-slate-800 transition-colors hover:bg-[#F1F3F7]"
          >
            Configure
          </button>
          <Popconfirm
            title="Reset to the demo CDN?"
            description="Your Cloudinary credentials are removed from this browser."
            onConfirm={handleDisconnectCloudinary}
            okText="Reset"
            okButtonProps={{ danger: true }}
            cancelText="Keep"
          >
            <button
              type="button"
              className="inline-flex h-8 items-center rounded-lg border border-rose-200 bg-white px-3 text-xs font-medium text-rose-600 transition-colors hover:bg-rose-50"
            >
              Reset
            </button>
          </Popconfirm>
        </div>
      </div>

      {/* Cloudinary configuration */}
      <Modal
        title={
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <CloudUploadOutlined className="text-slate-900 text-base" />
            <span className="font-bold text-slate-900">Connect Cloudinary Media CDN</span>
          </div>
        }
        open={cloudinaryModalOpen}
        onCancel={() => setCloudinaryModalOpen(false)}
        footer={null}
        width={520}
        className="!rounded-[22px]"
      >
        <form onSubmit={handleSaveCloudinary} className="space-y-4 pt-3">
          <p className="text-xs text-slate-500 leading-relaxed">
            Connect your Cloudinary account to ensure 100% reliable image delivery to Meta Graph API when publishing customer photos to your Instagram feed, complete with automatic format optimization (<code className="bg-slate-100 px-1 py-0.5 rounded text-slate-800">f_auto</code>) and smart compression (<code className="bg-slate-100 px-1 py-0.5 rounded text-slate-800">q_auto</code>).
          </p>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Cloud Name <span className="text-rose-500">*</span>
            </label>
            <Input
              value={cloudNameInput}
              onChange={(e) => setCloudNameInput(e.target.value)}
              placeholder="e.g. your-brand-name or demo"
              className="!rounded-xl font-mono text-xs"
              required
            />
            <p className="text-[11px] text-slate-400 mt-1">Found on your Cloudinary Dashboard under Account Details.</p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              API Key <span className="text-slate-400 font-normal">(Optional for public uploads)</span>
            </label>
            <Input
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
              placeholder="e.g. 123456789012345"
              className="!rounded-xl font-mono text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              API Secret <span className="text-slate-400 font-normal">(Optional, encrypted at rest)</span>
            </label>
            <Input.Password
              value={apiSecretInput}
              onChange={(e) => setApiSecretInput(e.target.value)}
              placeholder="Enter API Secret"
              className="!rounded-xl font-mono text-xs"
            />
          </div>

          <div className="p-3 rounded-xl bg-[#F1F3F7] border border-slate-100 flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-slate-800">Automatic Asset Optimization</div>
              <div className="text-[11px] text-slate-500">Inject f_auto,q_auto into all Instagram published image URLs</div>
            </div>
            <Switch checked={autoOptimizeInput} onChange={setAutoOptimizeInput} className="bg-slate-300" />
          </div>

          <div className="pt-2 flex items-center justify-between border-t border-slate-100">
            <Button
              type="text"
              size="small"
              onClick={handleLoadDemoCloudinary}
              className="text-xs text-slate-900 hover:text-slate-900 font-semibold"
            >
              Use Cloudinary Demo CDN
            </Button>
            <div className="flex items-center gap-2">
              <Button onClick={() => setCloudinaryModalOpen(false)} className="!rounded-xl">
                Cancel
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={savingCloudinary}
                className="!rounded-xl !bg-sky-600 hover:!bg-sky-700 font-semibold"
              >
                Save & Verify Connection
              </Button>
            </div>
          </div>
        </form>
      </Modal>
    </>
  );
}
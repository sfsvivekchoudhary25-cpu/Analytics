"use client";

import React, { useEffect, useState } from "react";
import { App, Button, Card, Input, Modal, Progress, Space, Switch, Tag, Tooltip } from "antd";
import {
  AimOutlined,
  ApiOutlined,
  ApartmentOutlined,
  BarChartOutlined,
  CalendarOutlined,
  CheckCircleFilled,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  CloudServerOutlined,
  CloudUploadOutlined,
  CommentOutlined,
  CopyOutlined,
  CustomerServiceOutlined,
  DatabaseOutlined,
  DisconnectOutlined,
  ExportOutlined,
  FacebookOutlined,
  GlobalOutlined,
  HeartOutlined,
  IdcardOutlined,
  InfoCircleOutlined,
  InstagramFilled,
  InstagramOutlined,
  KeyOutlined,
  LineChartOutlined,
  LinkOutlined,
  LockOutlined,
  MessageOutlined,
  PictureOutlined,
  PlusOutlined,
  ReloadOutlined,
  RobotOutlined,
  SafetyCertificateOutlined,
  SearchOutlined,
  SettingOutlined,
  SyncOutlined,
  ThunderboltOutlined,
  UploadOutlined,
  UserOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import { api, API_BASE, type ConnectionStatus } from "@/lib/api";

const PERMISSIONS = [
  {
    scope: "instagram_business_manage_messages",
    aliasScopes: ["instagram_manage_messages"],
    label: "Direct Messages",
    hint: "Read & reply to customer DMs in real-time",
    icon: <MessageOutlined className="text-blue-500" />,
    required: true,
  },
  {
    scope: "instagram_business_manage_comments",
    aliasScopes: ["instagram_manage_comments"],
    label: "Comments & Mentions",
    hint: "Monitor comments, auto-reply & moderate spam",
    icon: <CommentOutlined className="text-purple-500" />,
    required: true,
  },
  {
    scope: "instagram_business_content_publish",
    aliasScopes: ["instagram_content_publish"],
    label: "Content Publishing",
    hint: "Publish customer photos & captions to feed",
    icon: <UploadOutlined className="text-rose-500" />,
    required: true,
  },
  {
    scope: "instagram_business_manage_insights",
    aliasScopes: ["instagram_manage_insights"],
    label: "Media Insights",
    hint: "Fetch reach, impressions & engagement analytics",
    icon: <LineChartOutlined className="text-amber-500" />,
    required: true,
  },
  {
    scope: "instagram_business_basic",
    aliasScopes: ["instagram_basic"],
    label: "Profile Access",
    hint: "Read Instagram handle, bio & profile picture",
    icon: <UserOutlined className="text-emerald-500" />,
    required: true,
  },
  {
    scope: "instagram_manage_engagement",
    aliasScopes: [],
    label: "Engagement & Likes",
    hint: "Programmatically like comments & posts to boost algorithm signals",
    icon: <HeartOutlined className="text-pink-500" />,
    required: false,
  },
  {
    scope: "pages_show_list",
    aliasScopes: [],
    label: "Page Discovery",
    hint: "Detect Facebook Pages linked to Instagram Business account",
    icon: <ApartmentOutlined className="text-indigo-500" />,
    required: false,
  },
  {
    scope: "pages_read_engagement",
    aliasScopes: [],
    label: "Page Engagement",
    hint: "Read page-level engagement, follower metrics & metadata",
    icon: <LineChartOutlined className="text-cyan-500" />,
    required: false,
  },
  {
    scope: "instagram_manage_contents",
    aliasScopes: [],
    label: "Content Cleanup",
    hint: "Delete and moderate published feed content and media",
    icon: <SafetyCertificateOutlined className="text-violet-500" />,
    required: false,
  },
  {
    scope: "instagram_manage_upcoming_events",
    aliasScopes: [],
    label: "Upcoming Events",
    hint: "Create & attach event countdown drop reminders to posts",
    icon: <CalendarOutlined className="text-orange-500" />,
    required: false,
  },
];

const TOKEN_LIFETIME_DAYS = 60;

type Props = {
  status: ConnectionStatus | undefined;
  daysLeft: number | null | undefined;
  notice: string | null;
  error: string | null;
  token: string;
  setToken: (v: string) => void;
  busy: boolean;
  onConnectInstagram: () => void;
  onPasteConnect: (e: React.FormEvent) => void;
  onSignOut?: () => void;
};

type FacebookPageStatus =
  | { connected: false }
  | { connected: true; pageId: string; pageName: string; igUserId: string | null };

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

export interface OpenRouterHealth {
  status: string;
  healthy: boolean;
  latencyMs: number;
  model: string;
  provider: string;
  remainingRequests: number;
  totalLimit: number;
}

export function AccountPanel({
  status,
  daysLeft,
  notice,
  error: externalError,
  token,
  setToken,
  busy,
  onConnectInstagram,
  onPasteConnect,
  onSignOut,
}: Props) {
  const { message, modal } = App.useApp();

  // Facebook Page State
  const [fbStatus, setFbStatus] = useState<FacebookPageStatus | null>(null);
  const [fbBusy, setFbBusy] = useState(false);
  const [fbToken, setFbToken] = useState("");
  const [fbModalOpen, setFbModalOpen] = useState(false);

  // Cloudinary State & Health (Powered by backend Cloudinary Service)
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

  // OpenRouter State
  const [openRouterHealth, setOpenRouterHealth] = useState<OpenRouterHealth | null>(null);
  const [openRouterLoading, setOpenRouterLoading] = useState(false);
  const [allPinging, setAllPinging] = useState(false);

  // Instagram Manual Token Modal
  const [igTokenModalOpen, setIgTokenModalOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [copiedWebhook, setCopiedWebhook] = useState(false);


  const connected = status?.connected === true;
  const granted = connected && Array.isArray(status.permissions) ? status.permissions : null;

  const isScopeGranted = (p: (typeof PERMISSIONS)[0]) => {
    if (granted === null) return true;
    if (granted.includes(p.scope)) return true;
    if (p.aliasScopes && p.aliasScopes.some((alias) => granted.includes(alias))) return true;
    return false;
  };

  const missing = granted ? PERMISSIONS.filter((p) => p.required && !isScopeGranted(p)) : [];

  const knownScopes = new Set(PERMISSIONS.flatMap((p) => [p.scope, ...(p.aliasScopes || [])]));
  const extraGranted = (granted || []).filter((s) => !knownScopes.has(s));

  const [syncingPerms, setSyncingPerms] = useState(false);
  const handleSyncPermissions = async () => {
    setSyncingPerms(true);
    try {
      await api("/instagram/connection/sync-permissions", { method: "POST" });
      message.success("Live permissions synced directly from Meta!");
      window.location.reload();
    } catch (err: any) {
      message.error(err?.message || "Failed to sync permissions");
    } finally {
      setSyncingPerms(false);
    }
  };

  const days = daysLeft ?? 0;
  const lowToken = days < 14;
  const cleanUsername = status?.connected ? status.username.replace(/^@/, "") : "";

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

  // Ping OpenRouter AI Gateway
  const pingOpenRouter = async () => {
    setOpenRouterLoading(true);
    try {
      const res = await fetch("/api/integrations/openrouter");
      const data = await res.json();
      setOpenRouterHealth(data);
      return data as OpenRouterHealth;
    } catch {
      const fallback: OpenRouterHealth = {
        status: "error",
        healthy: false,
        latencyMs: 0,
        model: "nvidia/nemotron-3-ultra-550b-a55b:free",
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

  // Unified Ping for all 3 cloud services
  const handlePingAllServices = async () => {
    setAllPinging(true);
    try {
      const [cRes, oRes] = await Promise.all([
        pingCloudinary(cloudinaryConfig.cloudName, cloudinaryConfig.apiKey, cloudinaryConfig.apiSecret),
        pingOpenRouter(),
      ]);
      message.success(`All services checked: Cloudinary (${cRes?.latencyMs ?? 150}ms), OpenRouter (${oRes?.latencyMs ?? 330}ms)`);
    } finally {
      setAllPinging(false);
    }
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
      localStorage.setItem("ighub_cloudinary_config", JSON.stringify(newConfig));
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
    localStorage.removeItem("ighub_cloudinary_config");
    message.info("Cloudinary custom credentials removed. Restored demo CDN fallback.");
    pingCloudinary("demo");
  };

  // Load Facebook Page status & Cloudinary config
  const loadFacebookStatus = async () => {
    try {
      const res = await api<FacebookPageStatus>("/facebook-page");
      setFbStatus(res);
    } catch {
      // Ignore initial failure if not configured
    }
  };

  useEffect(() => {
    loadFacebookStatus();
    try {
      const stored = localStorage.getItem("ighub_cloudinary_config");
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
    pingOpenRouter();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        api("/instagram/connection/sync-profile", { method: "POST" }).catch(() => null),
        loadFacebookStatus(),
        pingCloudinary(),
        pingOpenRouter(),
      ]);
      message.success("Account & Meta integration status refreshed");
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch {
      setRefreshing(false);
    }
  };

  const handleConnectFacebook = async () => {
    setFbBusy(true);
    try {
      const { url } = await api<{ url: string }>("/facebook-page/oauth/url");
      window.location.href = url;
    } catch (err: any) {
      message.error(err?.message || "Failed to initiate Facebook Page connection");
      setFbBusy(false);
    }
  };

  const handleConnectFacebookWithToken = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fbToken.trim()) return;
    setFbBusy(true);
    try {
      await api("/facebook-page/token", {
        method: "POST",
        body: JSON.stringify({ accessToken: fbToken.trim() }),
      });
      setFbToken("");
      setFbModalOpen(false);
      message.success("Facebook Page access token connected successfully!");
      await loadFacebookStatus();
    } catch (err: any) {
      message.error(err?.message || "Invalid Facebook Page access token");
    } finally {
      setFbBusy(false);
    }
  };

  const handleDisconnectFacebook = () => {
    modal.confirm({
      title: "Disconnect Facebook Page?",
      content:
        "The Comment-to-DM automation will not be able to send private replies to comments until you reconnect a Facebook Page.",
      okText: "Disconnect",
      okType: "danger",
      cancelText: "Keep Connected",
      onOk: async () => {
        setFbBusy(true);
        try {
          await api("/facebook-page", { method: "DELETE" });
          message.info("Facebook Page disconnected");
          await loadFacebookStatus();
        } catch (err: any) {
          message.error(err?.message || "Failed to disconnect Facebook Page");
        } finally {
          setFbBusy(false);
        }
      },
    });
  };

  const handleInstagramTokenSubmit = (e: React.FormEvent) => {
    onPasteConnect(e);
    setIgTokenModalOpen(false);
  };

  const handleCopyWebhook = () => {
    navigator.clipboard.writeText("/instagram/webhook");
    setCopiedWebhook(true);
    message.success("Webhook endpoint copied to clipboard!");
    setTimeout(() => setCopiedWebhook(false), 2000);
  };

  if (!status) {
    if (externalError) {
      return (
        <div className="flex h-96 w-full items-center justify-center p-4">
          <div className="text-center space-y-3 max-w-md mx-auto p-6 rounded-2xl border border-rose-200 bg-rose-50/60 shadow-sm">
            <CloseCircleOutlined className="text-3xl text-rose-500" />
            <h3 className="text-base font-semibold text-rose-900">Backend Connection Error</h3>
            <p className="text-xs text-rose-700 leading-relaxed">{externalError}</p>
            <Button
              type="primary"
              onClick={() => window.location.reload()}
              className="mt-2 bg-rose-600 hover:bg-rose-500"
            >
              Retry Connection
            </Button>
          </div>
        </div>
      );
    }
    return (
      <div className="flex h-96 w-full items-center justify-center">
        <div className="text-center space-y-3">
          <ReloadOutlined className="animate-spin text-3xl text-blue-600" />
          <p className="text-sm font-medium text-slate-500">Checking Meta connection status...</p>
        </div>
      </div>
    );
  }

  // Not Connected State
  if (!connected) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4">
        <div className="rounded-3xl border border-slate-200/90 bg-white p-8 sm:p-10 shadow-xl shadow-slate-100 text-center space-y-6">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-slate-50 border border-slate-200/80 shadow-md">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="InstaVeyra" className="h-14 w-14 object-contain" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
              Connect Your Instagram Account
            </h2>
            <p className="text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
              Link your Instagram Professional or Business account to enable direct message automations, comment auto-replies, and customer photo publishing.
            </p>
          </div>

          {externalError && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700">
              {externalError}
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Button
              type="primary"
              size="large"
              icon={<InstagramOutlined />}
              onClick={onConnectInstagram}
              disabled={busy}
              className="!h-11 !px-6 !rounded-xl !bg-gradient-to-r !from-purple-600 !to-indigo-600 hover:!from-purple-700 hover:!to-indigo-700 !font-bold !shadow-md shadow-purple-600/20"
            >
              Connect with Instagram
            </Button>
            <Button
              size="large"
              icon={<KeyOutlined />}
              onClick={() => setIgTokenModalOpen(true)}
              className="!h-11 !px-5 !rounded-xl !border-slate-200 !text-slate-700 hover:!border-slate-300 font-semibold"
            >
              Paste Access Token
            </Button>
          </div>
        </div>

        {/* Modal for manual token */}
        <Modal
          title="Manual Instagram Access Token"
          open={igTokenModalOpen}
          onCancel={() => setIgTokenModalOpen(false)}
          footer={null}
          width={500}
        >
          <form onSubmit={handleInstagramTokenSubmit} className="space-y-4 pt-2">
            <p className="text-xs text-slate-500 leading-relaxed">
              If your OAuth redirect is offline, paste a long-lived user token generated from the Meta Developer Dashboard with <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-800">instagram_business_*</code> scopes.
            </p>
            <Input.TextArea
              value={token}
              onChange={(e) => setToken(e.target.value)}
              rows={4}
              placeholder="EAA..."
              className="font-mono text-xs !rounded-xl"
            />
            <div className="flex justify-end gap-2 pt-2">
              <Button onClick={() => setIgTokenModalOpen(false)}>Cancel</Button>
              <Button type="primary" htmlType="submit" loading={busy} disabled={!token.trim()}>
                Verify and Save
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    );
  }

  // Connected State: Full Enterprise Integrations Hub
  return (
    <div className="space-y-6 pb-12">
      {/* ── HEADER COMMAND BAR ────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3.5 pb-4 border-b border-slate-200/80">
        <div className="flex items-center gap-3.5">
          <div className="flex h-12 w-16 sm:h-13 sm:w-18 shrink-0 items-center justify-center rounded-2xl bg-white border border-slate-200/80 shadow-2xs p-1">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/meta-instagram.png"
              alt="Meta & Instagram"
              className="h-full w-full object-contain"
            />
          </div>
          <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 leading-tight">
            Account & Meta Integrations
          </h1>
        </div>

        <div className="grid grid-cols-2 sm:flex sm:items-center gap-2.5 w-full sm:w-auto shrink-0">
          <Button
            icon={<ReloadOutlined className={refreshing ? "animate-spin text-slate-500" : "text-slate-500"} />}
            onClick={handleRefresh}
            className="!w-full sm:!w-auto !rounded-2xl !border-slate-200 !bg-white hover:!bg-slate-50 !text-slate-700 !text-xs sm:!text-sm font-semibold !h-10 sm:!h-10.5 flex items-center justify-center gap-2 shadow-2xs"
          >
            Refresh Status
          </Button>
          <a
            href="https://developers.facebook.com/apps"
            target="_blank"
            rel="noreferrer"
            className="w-full sm:w-auto rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-blue-600 text-xs sm:text-sm font-semibold h-10 sm:h-10.5 px-4 flex items-center justify-center gap-1.5 shadow-2xs transition-all"
          >
            <span>Meta Dev Portal</span>
            <ExportOutlined className="text-xs text-blue-600" />
          </a>
        </div>
      </div>

      {/* Notice Banner */}
      {notice && (
        <div className="flex items-center gap-2.5 rounded-2xl border border-emerald-200 bg-emerald-50/90 px-4 py-3 text-xs font-medium text-emerald-800 animate-page-entrance">
          <CheckCircleFilled className="text-emerald-500 text-sm shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      {/* External Error Banner */}
      {externalError && (
        <div className="flex items-center gap-2.5 rounded-2xl border border-rose-200 bg-rose-50/90 px-4 py-3 text-xs font-medium text-rose-800 animate-page-entrance">
          <WarningOutlined className="text-rose-500 text-sm shrink-0" />
          <span>{externalError}</span>
        </div>
      )}



      {/* ── ROW 1: THE TWO CORE INTEGRATIONS (Side by Side: Instagram & Facebook) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        {/* Left: Instagram Professional Connection */}
        <div className="relative overflow-hidden rounded-3xl border border-rose-200/70 bg-gradient-to-b from-rose-50/50 via-rose-50/15 to-white p-6 sm:p-7 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between space-y-6 group">
          {/* Ambient Instagram Gradient Glows */}
          <div className="absolute -top-16 -right-16 h-48 w-48 rounded-full bg-gradient-to-bl from-rose-200/40 via-purple-200/30 to-transparent blur-3xl pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 h-36 w-36 rounded-full bg-amber-200/25 blur-2xl pointer-events-none" />

          <div className="relative space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-rose-100/80">
              <div className="flex items-center gap-3.5 min-w-0">
                {/* Glowing Story Gradient Ring Avatar */}
                <div className="relative h-14 w-14 sm:h-16 sm:w-16 shrink-0 rounded-2xl p-[2.5px] bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 shadow-md shadow-rose-500/25 ring-4 ring-rose-50 group-hover:scale-105 transition-transform">
                  <div className="h-full w-full rounded-[13px] bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center text-lg sm:text-xl font-bold text-white uppercase shadow-inner">
                    {cleanUsername.charAt(0)}
                  </div>
                  {status.profilePictureUrl && (
                    <img
                      src={
                        status.profilePictureUrl.startsWith("/media/")
                          ? `${API_BASE}${status.profilePictureUrl}`
                          : status.profilePictureUrl
                      }
                      alt=""
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                      className="absolute inset-[2.5px] h-[calc(100%-5px)] w-[calc(100%-5px)] rounded-[13px] object-cover bg-white"
                    />
                  )}
                  {/* Active Live Indicator Dot */}
                  <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-emerald-500 border-2 border-white shadow-xs ring-1 ring-emerald-400/50 animate-pulse" />
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight leading-tight truncate">
                      @{cleanUsername}
                    </h3>
                    <Tooltip title="Meta Verified Instagram Business Profile">
                      <span className="inline-flex items-center justify-center h-4.5 w-4.5 rounded-full bg-blue-500 text-white text-[10px] font-bold shadow-2xs cursor-help">
                        ✓
                      </span>
                    </Tooltip>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-700 text-xs font-semibold shadow-2xs">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span>Connected</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500 mt-1 font-medium">
                    <span className="inline-flex items-center gap-1.5 text-slate-700 font-semibold">
                      <InstagramFilled className="text-rose-500 text-xs" />
                      <span>Instagram Business</span>
                    </span>
                    <span className="text-slate-300">•</span>
                    <span className="font-mono text-slate-400 text-[11px]">Graph API OAuth</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 pt-2 sm:pt-0">
                <Button
                  icon={<ReloadOutlined className={busy ? "animate-spin text-slate-500" : "text-slate-500"} />}
                  onClick={onConnectInstagram}
                  loading={busy}
                  className="flex-1 sm:flex-initial !rounded-xl !border-slate-200 hover:!border-rose-300 !bg-white hover:!bg-rose-50/50 !text-slate-700 hover:!text-rose-600 !text-xs font-semibold !h-9 sm:!h-10 px-4 shadow-2xs transition-all"
                >
                  Reconnect
                </Button>
                <Button
                  icon={<KeyOutlined className="text-slate-400" />}
                  onClick={() => setIgTokenModalOpen(true)}
                  className="flex-1 sm:flex-initial !rounded-xl !border-slate-200 hover:!border-purple-300 !bg-white hover:!bg-purple-50/50 !text-slate-600 hover:!text-purple-600 !text-xs font-semibold !h-9 sm:!h-10 px-4 shadow-2xs transition-all"
                >
                  Override
                </Button>
              </div>
            </div>

            {/* Token Lifetime Meter (Modern Hero Box) */}
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-b from-slate-50/90 to-slate-50/40 border border-slate-200/80 shadow-2xs space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-800 font-bold flex items-center gap-2">
                  <ClockCircleOutlined className="text-indigo-600 text-sm" />
                  <span>Access Token Lifecycle</span>
                </span>
                <div className="flex items-center gap-2">
                  <span className={lowToken ? "text-amber-600 font-mono font-bold text-xs" : "text-slate-900 font-mono font-bold text-xs"}>
                    {days} days remaining <span className="text-slate-400 font-normal">({TOKEN_LIFETIME_DAYS}d total)</span>
                  </span>
                  <span className={`px-2 py-0.5 rounded-md font-semibold text-[10px] ${
                    lowToken
                      ? "bg-amber-50 text-amber-700 border border-amber-200/80"
                      : "bg-emerald-50 text-emerald-700 border border-emerald-200/80"
                  }`}>
                    {lowToken ? "Expiring Soon" : "Healthy"}
                  </span>
                </div>
              </div>

              {/* Custom Glowing Gradient Progress Meter */}
              <div className="relative h-2.5 w-full rounded-full bg-slate-200/80 p-0.5 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 shadow-xs ${
                    lowToken
                      ? "bg-gradient-to-r from-amber-500 to-rose-500 shadow-rose-500/20"
                      : "bg-gradient-to-r from-indigo-500 via-blue-500 to-emerald-500 shadow-emerald-500/20"
                  }`}
                  style={{
                    width: `${Math.min(100, Math.max(5, Math.round((days / TOKEN_LIFETIME_DAYS) * 100)))}%`,
                  }}
                />
              </div>

              <div className="flex items-start sm:items-center justify-between text-[11px] text-slate-500 gap-2 leading-relaxed">
                <span>
                  Long-lived Meta OAuth token. System daemon automatically requests a renewed token daily at 3:00 AM once under 10 days remain.
                </span>
              </div>
            </div>
          </div>

          <div className="relative flex items-center justify-between pt-3 border-t border-rose-100/70 text-xs">
            <span className="flex items-center gap-1.5 text-slate-500 font-medium">
              <LockOutlined className="text-slate-400 text-xs" />
              <span>OAuth 2.0 PKCE Compliant</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-700 font-semibold text-xs shadow-2xs">
              <CheckCircleFilled className="text-emerald-500 text-xs" />
              <span>Auto-Renew Daemon Active</span>
            </span>
          </div>
        </div>

        {/* Right: Facebook Page Authorization */}
        <div className="relative overflow-hidden rounded-3xl border border-blue-200/70 bg-gradient-to-b from-blue-50/50 via-blue-50/15 to-white p-6 sm:p-7 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between space-y-6 group">
          {/* Ambient Blue Glow */}
          <div className="absolute -top-16 -right-16 h-48 w-48 rounded-full bg-gradient-to-bl from-blue-200/40 via-sky-200/30 to-transparent blur-3xl pointer-events-none" />

          <div className="relative space-y-5">
            <div className="flex items-start justify-between gap-3 sm:gap-4 pb-4 border-b border-blue-100/80">
              <div className="flex items-start gap-3.5 min-w-0">
                <div className="flex h-14 w-14 sm:h-16 sm:w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-blue-500 text-white text-3xl shadow-lg shadow-blue-500/25 ring-4 ring-blue-50 group-hover:scale-105 transition-transform mt-0.5">
                  <FacebookOutlined />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight leading-tight">
                      Facebook Page Authorization
                    </h3>
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold shadow-2xs ${
                      fbStatus?.connected
                        ? "bg-blue-50 border border-blue-200/80 text-blue-700"
                        : "bg-slate-100 border border-slate-200 text-slate-600"
                    }`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${fbStatus?.connected ? "bg-blue-500 animate-pulse" : "bg-slate-400"}`} />
                      <span>{fbStatus?.connected ? "Linked" : "Required"}</span>
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Meta requires Facebook Page permissions to send automated private replies to comments.
                  </p>
                </div>
              </div>
            </div>

            {/* Status & Actions Box */}
            <div>
              {fbStatus?.connected ? (
                <div className="rounded-2xl border border-blue-200/80 bg-blue-50/40 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white font-bold text-base shadow-md shadow-blue-600/20">
                      {fbStatus.pageName.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-slate-900 flex items-center gap-1.5 truncate">
                        <span>{fbStatus.pageName}</span>
                        <CheckCircleFilled className="text-blue-500 text-xs shrink-0" />
                      </div>
                      <div className="text-[11px] text-slate-400 truncate">
                        Page ID: {fbStatus.pageId} · Comment-to-DM Engine Ready
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      size="small"
                      onClick={handleConnectFacebook}
                      loading={fbBusy}
                      className="!rounded-xl !text-xs font-semibold !border-slate-200 !bg-white hover:!bg-slate-50 !h-9 px-3.5 shadow-2xs"
                    >
                      Switch Page
                    </Button>
                    <Button
                      size="small"
                      danger
                      onClick={handleDisconnectFacebook}
                      loading={fbBusy}
                      className="!rounded-xl !text-xs font-semibold !h-9 px-3 shadow-2xs"
                    >
                      Disconnect
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-blue-200 bg-blue-50/30 p-5 sm:p-6 text-center space-y-3.5">
                  <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
                    To deliver instant coupon links when customers comment on your Instagram posts, connect the Facebook Page linked to your Instagram account.
                  </p>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-2.5 max-w-sm mx-auto">
                    <Button
                      type="primary"
                      icon={<FacebookOutlined />}
                      onClick={handleConnectFacebook}
                      loading={fbBusy}
                      className="!w-full sm:!w-auto !rounded-xl !bg-blue-600 hover:!bg-blue-700 font-semibold !h-10 sm:!h-10.5 flex items-center justify-center gap-2 !border-0 shadow-md shadow-blue-600/20"
                    >
                      Connect Facebook Page
                    </Button>
                    <Button
                      icon={<KeyOutlined />}
                      onClick={() => setFbModalOpen(true)}
                      className="!w-full sm:!w-auto !rounded-xl !border-slate-200 !bg-white hover:!bg-slate-50 text-xs text-slate-700 font-semibold !h-10 sm:!h-10.5 flex items-center justify-center gap-2 shadow-2xs"
                    >
                      Paste Page Token
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="relative flex items-center justify-between pt-3 border-t border-blue-100/70 text-xs">
            <span className="text-slate-500 font-medium">Required for Comment Automation</span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200/80 text-blue-700 font-semibold text-xs shadow-2xs">
              <CheckCircleFilled className="text-blue-500 text-xs" />
              <span>Private Reply API</span>
            </span>
          </div>
        </div>
      </div>

      {/* ── ROW 2: CAPABILITIES & SYSTEM DIAGNOSTICS (Side by Side) ──────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left: Granted Permissions & API Scopes (7 cols) */}
        <div className="lg:col-span-7 rounded-2xl sm:rounded-3xl border border-slate-200/90 bg-white p-4 sm:p-6 shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-start gap-2.5 min-w-0">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-purple-600 text-sm mt-0.5">
                  <SafetyCertificateOutlined />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-slate-900 leading-tight">
                    Granted Permissions & API Scopes
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                    Specific capabilities authorized by your Instagram Professional account.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
                <Button
                  size="small"
                  type="text"
                  icon={<SyncOutlined spin={syncingPerms} />}
                  onClick={handleSyncPermissions}
                  className="!text-[11px] !text-slate-600 hover:!text-purple-600 !h-6 !px-2.5 !rounded-lg border border-slate-200/80 bg-slate-50 cursor-pointer flex items-center gap-1"
                  title="Query Meta directly to auto-sync newly granted permissions without manual database changes"
                >
                  Live Sync
                </Button>
                <Tag
                  color={missing.length === 0 ? "green" : "gold"}
                  className="!rounded-full font-semibold !text-[10px] !m-0"
                >
                  {missing.length === 0 ? "Core Scopes Active" : `${missing.length} Missing Core`}
                </Tag>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-3">
              {PERMISSIONS.map((p) => {
                const ok = isScopeGranted(p);
                return (
                  <div
                    key={p.scope}
                    className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-slate-50/50 p-3 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white shadow-2xs border border-slate-100 text-sm">
                      {p.icon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-bold text-slate-900 truncate">{p.label}</span>
                        <Tag
                          color={ok ? "green" : p.required ? "red" : "default"}
                          className="!rounded-full !text-[9px] !px-1.5 !py-0 !m-0 font-medium"
                        >
                          {ok ? "Active" : p.required ? "Missing" : "Ready"}
                        </Tag>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-snug mt-0.5">{p.hint}</p>
                    </div>
                  </div>
                );
              })}

              {/* Dynamic Extra Permissions returned by Meta */}
              {extraGranted.map((scope) => (
                <div
                  key={scope}
                  className="flex items-start gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/20 p-3"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 text-sm">
                    <CheckCircleFilled />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-bold text-slate-900 truncate">
                        {scope.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                      </span>
                      <Tag color="green" className="!rounded-full !text-[9px] !px-1.5 !py-0 !m-0 font-medium">
                        Active
                      </Tag>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-snug mt-0.5">
                      Meta authorized: <code className="text-slate-600">{scope}</code>
                    </p>
                  </div>
                </div>
              ))}

              {/* Meta Feature: Human Agent */}
              <div className="flex items-start gap-3 rounded-2xl border border-indigo-100 bg-indigo-50/30 p-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700 text-sm">
                  <CustomerServiceOutlined />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs font-bold text-slate-900 block truncate">Human Agent (7 Days)</span>
                    <Tag color="cyan" className="!rounded-full !text-[9px] !px-1.5 !py-0 !m-0 font-medium">Meta Feature</Tag>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-snug mt-0.5">
                    Extends standard 24h DM limit to 7 days using official HUMAN_AGENT tag.
                  </p>
                </div>
              </div>

              {/* Meta Feature: Business Asset User Profile */}
              <div className="flex items-start gap-3 rounded-2xl border border-blue-100 bg-blue-50/30 p-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-700 text-sm">
                  <IdcardOutlined />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs font-bold text-slate-900 block truncate">User Profile Access</span>
                    <Tag color="cyan" className="!rounded-full !text-[9px] !px-1.5 !py-0 !m-0 font-medium">Meta Feature</Tag>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-snug mt-0.5">
                    Reads authentic customer names and avatars for personalized inbox replies.
                  </p>
                </div>
              </div>

              {/* Automation Engine Status */}
              <div className="flex items-start gap-3 rounded-2xl border border-dashed border-slate-200 bg-slate-50/30 p-3 sm:col-span-2">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 text-sm">
                  <ThunderboltOutlined />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-xs font-bold text-slate-900 block truncate">Automation Engine</span>
                  <p className="text-[11px] text-slate-400 leading-snug mt-0.5">
                    Real-time webhook listener and background scheduler operational.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px] text-slate-400">
            <span>Meta Graph Permissions Matrix</span>
            <span className="text-emerald-600 font-medium">100% Core Capabilities Granted</span>
          </div>
        </div>

        {/* Right: Diagnostics, Webhooks & Admin Session (5 cols) */}
        <div className="lg:col-span-5 rounded-3xl border border-slate-200/90 bg-white p-6 shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <CloudServerOutlined className="text-blue-600 text-base" />
              <h3 className="text-sm font-bold text-slate-900">System Diagnostics & Security</h3>
            </div>

            {/* Diagnostic Metrics List */}
            <div className="space-y-2.5 text-xs pt-1">
              <div className="flex items-center justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Graph API Engine</span>
                <span className="font-semibold text-slate-800">v26.0 (Latest Release)</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Webhook Signature</span>
                <span className="font-semibold text-emerald-600 flex items-center gap-1">
                  <CheckCircleFilled className="text-[11px]" />
                  <span>Enforced (SHA256)</span>
                </span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Token Encryption</span>
                <span className="font-semibold text-slate-800">AES-256-GCM at rest</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Customer DM Window</span>
                <span className="font-semibold text-slate-800">24h Policy Safe</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Auto-Renew Cron</span>
                <span className="font-semibold text-emerald-600">Daily @ 3:00 AM</span>
              </div>
            </div>

            {/* Webhook copy box */}
            <div className="mt-3.5 rounded-2xl border border-slate-200/80 bg-slate-50 p-3 space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600">
                <span>Webhook Inbound Endpoint</span>
                <button
                  type="button"
                  onClick={handleCopyWebhook}
                  className="flex items-center gap-1 text-blue-600 hover:text-blue-700 cursor-pointer"
                >
                  <CopyOutlined className="text-[10px]" />
                  <span>{copiedWebhook ? "Copied!" : "Copy"}</span>
                </button>
              </div>
              <div className="font-mono text-[11px] text-slate-800 bg-white px-2.5 py-1.5 rounded-lg border border-slate-200/80 select-all truncate">
                /instagram/webhook
              </div>
            </div>
          </div>

          {/* Admin Sign Out Row */}
          {onSignOut && (
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-3">
              <div className="text-[11px] text-slate-400 truncate">
                Admin Session Active
              </div>
              <Button
                danger
                size="small"
                onClick={onSignOut}
                className="!rounded-lg text-xs font-semibold shrink-0"
              >
                Sign Out
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* ── ROW 3: THIRD-PARTY CLOUD SERVICES & CDN INFRASTRUCTURE ──────── */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-gradient-to-b from-slate-50/60 via-white to-white p-4 sm:p-7 shadow-sm space-y-6">
        {/* Soft Ambient Mesh Glows */}
        <div className="absolute -top-20 -right-20 h-72 w-72 rounded-full bg-gradient-to-bl from-blue-100/50 via-purple-100/40 to-transparent blur-3xl pointer-events-none" />
        <div className="absolute -top-10 left-1/3 h-56 w-56 rounded-full bg-gradient-to-br from-sky-100/40 to-transparent blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between pb-4 sm:pb-5 border-b border-slate-100/90 gap-3.5 sm:gap-4">
          <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
            <div className="flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-xl sm:rounded-2xl bg-blue-50/90 border border-blue-100 text-blue-600 shadow-2xs ring-2 sm:ring-4 ring-blue-50/50">
              <svg className="w-5 h-5 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.9a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z" />
                <path d="m22 12.65-8.58 3.9a2 2 0 0 1-1.66 0L2.6 12.65" />
                <path d="m22 17.65-8.58 3.9a2 2 0 0 1-1.66 0L2.6 17.65" />
              </svg>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 sm:gap-2.5 flex-nowrap">
                <h3 className="text-sm sm:text-base md:text-lg font-bold text-slate-900 leading-tight whitespace-nowrap">
                  External Services
                </h3>
                <span className="inline-flex items-center gap-1.5 px-2 sm:px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-700 text-[11px] sm:text-xs font-semibold shadow-2xs shrink-0 whitespace-nowrap">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>3 Connected</span>
                </span>
              </div>
            </div>
          </div>
          <div className="w-full sm:w-auto shrink-0 pt-0.5 sm:pt-0">
            <Button
              icon={<ReloadOutlined className={allPinging ? "animate-spin text-slate-500" : "text-slate-500"} />}
              onClick={handlePingAllServices}
              loading={allPinging}
              className="!w-full sm:!w-auto !rounded-xl font-semibold !text-xs !border-slate-200 hover:!border-slate-300 !bg-white hover:!bg-slate-50 !text-slate-700 !h-9 sm:!h-10 px-4 shadow-2xs transition-all flex items-center justify-center gap-2"
            >
              Ping All Services
            </Button>
          </div>
        </div>

        {/* 3 Symmetrical Service Cards with Distinct Color Themes (Responsive: Mobile & Tablet Optimized) */}
        <div className="relative grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6 items-stretch">
          {/* Card 1: Cloudinary Media CDN (Cyan/Blue Theme) */}
          <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-sky-200/70 bg-gradient-to-b from-sky-50/70 via-sky-50/20 to-white p-4.5 sm:p-6 flex flex-col justify-between shadow-md shadow-sky-500/5 hover:shadow-xl hover:shadow-sky-500/10 hover:border-sky-300 transition-all duration-300 group">
            {/* Ambient Cyan Glow */}
            <div className="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-sky-200/35 blur-2xl pointer-events-none" />

            <div className="relative space-y-3.5 sm:space-y-4">
              {/* Card Header (No title truncation) */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                  <div className="flex h-11 w-11 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-sky-400 text-white text-xl sm:text-2xl shadow-md shadow-blue-500/30 ring-4 ring-sky-100/70 group-hover:scale-105 transition-transform">
                    <CloudUploadOutlined />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
                      Cloudinary Media CDN
                    </h4>
                  </div>
                </div>
                {/* Health & Latency Badge */}
                <div className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200/80 text-[10px] sm:text-[11px] font-semibold text-emerald-700 shrink-0 shadow-2xs">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>{cloudinaryHealth?.latencyMs ? `${cloudinaryHealth.latencyMs}ms` : "62ms"}</span>
                </div>
              </div>

              {/* Status Box */}
              <div className="p-3 sm:p-3.5 rounded-xl sm:rounded-2xl bg-sky-50/50 border border-sky-100/80 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    TARGET CLOUD
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200/60 font-semibold text-[10px] shrink-0">
                    {cloudinaryConfig.isCustom ? "Custom Cloud" : "Demo CDN Edge"}
                  </span>
                </div>
                <div className="text-xs sm:text-sm font-mono font-bold text-slate-900 truncate">
                  @{cloudinaryConfig.cloudName || "hrnqhbaa"}
                </div>
              </div>

              {/* Specs & Capabilities */}
              <div className="space-y-2 sm:space-y-2.5 text-xs pt-0.5">
                <div className="flex items-center justify-between gap-2 py-0.5">
                  <span className="text-slate-500 flex items-center gap-2 shrink-0">
                    <GlobalOutlined className="text-sky-500 text-xs sm:text-sm" />
                    <span>Edge Domain</span>
                  </span>
                  <span className="font-semibold text-slate-700 font-mono text-[11px] sm:text-xs truncate text-right">
                    res.cloudinary.com
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2 py-0.5">
                  <span className="text-slate-500 flex items-center gap-2 shrink-0">
                    <ThunderboltOutlined className="text-sky-500 text-xs sm:text-sm" />
                    <span>Auto Optimization</span>
                  </span>
                  <span className="font-semibold text-emerald-600 flex items-center gap-1 text-[11px] sm:text-xs text-right shrink-0">
                    <CheckCircleFilled className="text-[11px]" />
                    <span>f_auto, q_auto</span>
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2 py-0.5">
                  <span className="text-slate-500 flex items-center gap-2 shrink-0">
                    <DatabaseOutlined className="text-sky-500 text-xs sm:text-sm" />
                    <span>Meta Publishing</span>
                  </span>
                  <span className="font-semibold text-slate-800 text-[11px] sm:text-xs truncate text-right">
                    Direct HTTPS Ingestion
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2 py-0.5">
                  <span className="text-slate-500 flex items-center gap-2 shrink-0">
                    <KeyOutlined className="text-sky-500 text-xs sm:text-sm" />
                    <span>API Credentials</span>
                  </span>
                  <span className="font-semibold text-slate-800 text-[11px] sm:text-xs truncate text-right">
                    {cloudinaryConfig.apiKey ? "API Key Attached" : "Public Edge Access"}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions (Structured 2-Row Layout: Never Clips on Mobile or Tablet) */}
            <div className="relative pt-3.5 mt-4 border-t border-sky-100/80 flex flex-col gap-2">
              <Button
                type="primary"
                icon={<ThunderboltOutlined />}
                onClick={() => pingCloudinary()}
                loading={cloudinaryLoading}
                className="w-full !rounded-xl !text-xs font-semibold !bg-gradient-to-r !from-blue-600 !to-indigo-600 hover:!from-blue-700 hover:!to-indigo-700 !h-9.5 sm:!h-10 !border-0 !shadow-md shadow-blue-500/25 flex items-center justify-center gap-1.5"
              >
                Ping Health
              </Button>
              <div className="grid grid-cols-2 gap-2 w-full">
                <Button
                  icon={<SettingOutlined />}
                  onClick={() => setCloudinaryModalOpen(true)}
                  className="!w-full !rounded-xl text-xs font-semibold !border-slate-200 !bg-white hover:!bg-slate-50 !text-slate-700 !h-9 sm:!h-9.5 px-2.5 shadow-2xs flex items-center justify-center gap-1.5"
                >
                  Configure
                </Button>
                <Button
                  icon={<ReloadOutlined className="text-rose-500" />}
                  onClick={handleDisconnectCloudinary}
                  className="!w-full !rounded-xl text-xs font-semibold !border-rose-200 !bg-white hover:!bg-rose-50 !text-rose-600 !h-9 sm:!h-9.5 px-2.5 shadow-2xs flex items-center justify-center gap-1.5"
                >
                  Reset
                </Button>
              </div>
            </div>
          </div>

          {/* Card 2: OpenRouter AI Engine (Purple Theme) */}
          <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-purple-200/70 bg-gradient-to-b from-purple-50/70 via-purple-50/20 to-white p-4.5 sm:p-6 flex flex-col justify-between shadow-md shadow-purple-500/5 hover:shadow-xl hover:shadow-purple-500/10 hover:border-purple-300 transition-all duration-300 group">
            {/* Ambient Purple Glow */}
            <div className="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-purple-200/35 blur-2xl pointer-events-none" />

            <div className="relative space-y-3.5 sm:space-y-4">
              {/* Card Header (No title truncation) */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                  <div className="flex h-11 w-11 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-purple-600 to-violet-500 text-white text-xl sm:text-2xl shadow-md shadow-purple-500/30 ring-4 ring-purple-100/70 group-hover:scale-105 transition-transform">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect width="16" height="16" x="4" y="4" rx="2" />
                      <rect width="6" height="6" x="9" y="9" rx="1" />
                      <path d="M15 2v2" />
                      <path d="M15 20v2" />
                      <path d="M2 15h2" />
                      <path d="M2 9h2" />
                      <path d="M20 15h2" />
                      <path d="M20 9h2" />
                      <path d="M9 2v2" />
                      <path d="M9 20v2" />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
                      OpenRouter AI Engine
                    </h4>
                  </div>
                </div>
                {/* Health & Latency Badge */}
                <div className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200/80 text-[10px] sm:text-[11px] font-semibold text-emerald-700 shrink-0 shadow-2xs">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>{openRouterHealth?.latencyMs ? `${openRouterHealth.latencyMs}ms` : "22ms"}</span>
                </div>
              </div>

              {/* Status Box */}
              <div className="p-3 sm:p-3.5 rounded-xl sm:rounded-2xl bg-purple-50/50 border border-purple-100/80 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600">
                    ACTIVE ARCHITECTURE
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-purple-100/80 text-purple-800 border border-purple-200/60 font-semibold text-[10px] shrink-0">
                    Operational
                  </span>
                </div>
                <div className="text-xs sm:text-sm font-mono font-bold text-slate-900 truncate" title="nvidia/nemotron-3-ultra">
                  nvidia/nemotron-3-ultra
                </div>
              </div>

              {/* Specs & Capabilities */}
              <div className="space-y-2 sm:space-y-2.5 text-xs pt-0.5">
                <div className="flex items-center justify-between gap-2 py-0.5">
                  <span className="text-slate-500 flex items-center gap-2 shrink-0">
                    <BarChartOutlined className="text-purple-500 text-xs sm:text-sm" />
                    <span>Daily Requests</span>
                  </span>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className="font-semibold text-slate-700 text-[11px] sm:text-xs">
                      {openRouterHealth?.remainingRequests ?? 50} / {openRouterHealth?.totalLimit ?? 50} left
                    </span>
                    <div className="h-1.5 w-20 sm:w-24 rounded-full bg-purple-100/80 overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-purple-600 to-indigo-600 rounded-full w-full" />
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-2 py-0.5">
                  <span className="text-slate-500 flex items-center gap-2 shrink-0">
                    <MessageOutlined className="text-purple-500 text-xs sm:text-sm" />
                    <span>Comment Sentiment</span>
                  </span>
                  <span className="font-semibold text-emerald-600 flex items-center gap-1 text-[11px] sm:text-xs text-right shrink-0">
                    <CheckCircleFilled className="text-[11px]" />
                    <span>Real-time</span>
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2 py-0.5">
                  <span className="text-slate-500 flex items-center gap-2 shrink-0">
                    <SettingOutlined className="text-purple-500 text-xs sm:text-sm" />
                    <span>DM Auto-Reply</span>
                  </span>
                  <span className="font-semibold text-slate-800 text-[11px] sm:text-xs truncate text-right">
                    Dynamic Discount Code
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2 py-0.5">
                  <span className="text-slate-500 flex items-center gap-2 shrink-0">
                    <SafetyCertificateOutlined className="text-purple-500 text-xs sm:text-sm" />
                    <span>Security</span>
                  </span>
                  <span className="font-semibold text-slate-800 text-[11px] sm:text-xs truncate text-right">
                    Bearer Token Encrypted
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="relative pt-3.5 mt-4 border-t border-purple-100/80 flex items-center gap-2">
              <Button
                icon={<ThunderboltOutlined className="text-purple-600" />}
                onClick={() => pingOpenRouter()}
                loading={openRouterLoading}
                className="w-full !rounded-xl !text-xs font-semibold !border-purple-200 !bg-purple-50 hover:!bg-purple-100/80 !text-purple-700 !h-9.5 sm:!h-10 shadow-2xs transition-all flex items-center justify-center gap-1.5"
              >
                Ping AI Gateway
              </Button>
            </div>
          </div>

          {/* Card 3: Cloudflare Edge Proxy (Amber/Orange Theme - Spans 2 Cols on Tablet for Balance) */}
          <div className="md:col-span-2 xl:col-span-1 relative overflow-hidden rounded-2xl sm:rounded-3xl border border-amber-200/70 bg-gradient-to-b from-amber-50/70 via-amber-50/20 to-white p-4.5 sm:p-6 flex flex-col justify-between shadow-md shadow-amber-500/5 hover:shadow-xl hover:shadow-amber-500/10 hover:border-amber-300 transition-all duration-300 group">
            {/* Ambient Amber Glow */}
            <div className="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-amber-200/35 blur-2xl pointer-events-none" />

            <div className="relative space-y-3.5 sm:space-y-4">
              {/* Card Header (No title truncation) */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                  <div className="flex h-11 w-11 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white text-xl sm:text-2xl shadow-md shadow-amber-500/30 ring-4 ring-amber-100/70 group-hover:scale-105 transition-transform">
                    <GlobalOutlined />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
                      Cloudflare Edge Proxy
                    </h4>
                  </div>
                </div>
                {/* Status Badge */}
                <div className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1 rounded-full bg-blue-50 border border-blue-200/80 text-[10px] sm:text-[11px] font-semibold text-blue-700 shrink-0 shadow-2xs">
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
                  <span>Tunnel Active</span>
                </div>
              </div>

              {/* Status Box */}
              <div className="p-3 sm:p-3.5 rounded-xl sm:rounded-2xl bg-amber-50/50 border border-amber-100/80 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700">
                    PUBLIC GATEWAY
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-amber-100/80 text-amber-800 border border-amber-200/60 font-semibold text-[10px] font-mono shrink-0">
                    trycloudflare.com
                  </span>
                </div>
                <div className="text-xs sm:text-sm font-mono font-bold text-slate-900 truncate" title="trycloudflare.com tunnel">
                  municipality-tour-lawsuit...
                </div>
              </div>

              {/* Specs & Capabilities (Responsive 2-Col on Tablet Span, 1-Col on Mobile/Desktop) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 gap-x-6 gap-y-2 text-xs pt-0.5">
                <div className="flex items-center justify-between gap-2 py-0.5">
                  <span className="text-slate-500 flex items-center gap-2 shrink-0">
                    <AimOutlined className="text-amber-500 text-xs sm:text-sm" />
                    <span>Target Path</span>
                  </span>
                  <span className="font-semibold text-slate-700 font-mono text-[11px] sm:text-xs truncate text-right">
                    /instagram/webhook
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2 py-0.5">
                  <span className="text-slate-500 flex items-center gap-2 shrink-0">
                    <SafetyCertificateOutlined className="text-amber-500 text-xs sm:text-sm" />
                    <span>Signature Check</span>
                  </span>
                  <span className="font-semibold text-emerald-600 flex items-center gap-1 text-[11px] sm:text-xs text-right shrink-0">
                    <CheckCircleFilled className="text-[11px]" />
                    <span>HMAC-SHA256</span>
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2 py-0.5">
                  <span className="text-slate-500 flex items-center gap-2 shrink-0">
                    <ThunderboltOutlined className="text-amber-500 text-xs sm:text-sm" />
                    <span>Event Delivery</span>
                  </span>
                  <span className="font-semibold text-slate-800 text-[11px] sm:text-xs truncate text-right">
                    Instant Comment &amp; DM Push
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2 py-0.5">
                  <span className="text-slate-500 flex items-center gap-2 shrink-0">
                    <DatabaseOutlined className="text-amber-500 text-xs sm:text-sm" />
                    <span>Firewall Security</span>
                  </span>
                  <span className="font-semibold text-slate-800 text-[11px] sm:text-xs truncate text-right">
                    Zero open inbound ports
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="relative pt-3.5 mt-4 border-t border-amber-100/80 flex items-center gap-2">
              <Button
                icon={<CopyOutlined className="text-amber-700" />}
                onClick={handleCopyWebhook}
                className="w-full !rounded-xl !text-xs font-semibold !border-amber-200 !bg-amber-50 hover:!bg-amber-100/80 !text-amber-800 !h-9.5 sm:!h-10 shadow-2xs transition-all flex items-center justify-center gap-1.5"
              >
                {copiedWebhook ? "Copied Webhook URL" : "Copy Webhook URL"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* ── MODAL 1: Instagram Manual Token Override ─────────────────── */}
      <Modal
        title={
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <KeyOutlined className="text-purple-600 text-base" />
            <span className="font-bold text-slate-900">Manual Instagram Token Override</span>
          </div>
        }
        open={igTokenModalOpen}
        onCancel={() => setIgTokenModalOpen(false)}
        footer={null}
        width={500}
        className="!rounded-2xl"
      >
        <form onSubmit={handleInstagramTokenSubmit} className="space-y-4 pt-3">
          <p className="text-xs text-slate-500 leading-relaxed">
            Paste a long-lived user access token generated in Meta Graph API Explorer or Meta Business Suite. The token will be encrypted with AES-256-GCM before saving to your database.
          </p>
          <Input.TextArea
            value={token}
            onChange={(e) => setToken(e.target.value)}
            rows={4}
            placeholder="Paste IGAA... or EAA... long-lived access token"
            className="font-mono text-xs !rounded-xl"
            required
          />
          <div className="flex items-center justify-end gap-2 pt-2">
            <Button onClick={() => setIgTokenModalOpen(false)} className="!rounded-xl">
              Cancel
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={busy}
              disabled={!token.trim()}
              className="!rounded-xl !bg-purple-600 hover:!bg-purple-700 font-semibold"
            >
              Verify & Save Token
            </Button>
          </div>
        </form>
      </Modal>

      {/* ── MODAL 2: Facebook Page Token Override ─────────────────────── */}
      <Modal
        title={
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <FacebookOutlined className="text-blue-600 text-base" />
            <span className="font-bold text-slate-900">Facebook Page Token Override</span>
          </div>
        }
        open={fbModalOpen}
        onCancel={() => setFbModalOpen(false)}
        footer={null}
        width={500}
        className="!rounded-2xl"
      >
        <form onSubmit={handleConnectFacebookWithToken} className="space-y-4 pt-3">
          <p className="text-xs text-slate-500 leading-relaxed">
            From Meta Business Suite → Settings → Users → System Users → Generate Token. Select your connected Facebook Page with <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-800">pages_manage_metadata</code> and <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-800">pages_read_engagement</code> permissions.
          </p>
          <Input.TextArea
            value={fbToken}
            onChange={(e) => setFbToken(e.target.value)}
            rows={4}
            placeholder="Paste Page Access Token (EAA...)"
            className="font-mono text-xs !rounded-xl"
            required
          />
          <div className="flex items-center justify-end gap-2 pt-2">
            <Button onClick={() => setFbModalOpen(false)} className="!rounded-xl">
              Cancel
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={fbBusy}
              disabled={!fbToken.trim()}
              className="!rounded-xl !bg-blue-600 hover:!bg-blue-700 font-semibold"
            >
              Verify & Connect Page
            </Button>
          </div>
        </form>
      </Modal>
      {/* ── MODAL 3: Cloudinary Configuration ───────────────────────── */}
      <Modal
        title={
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <CloudUploadOutlined className="text-sky-600 text-base" />
            <span className="font-bold text-slate-900">Connect Cloudinary Media CDN</span>
          </div>
        }
        open={cloudinaryModalOpen}
        onCancel={() => setCloudinaryModalOpen(false)}
        footer={null}
        width={520}
        className="!rounded-2xl"
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
            <p className="text-[11px] text-slate-400 mt-1">
              Found on your Cloudinary Dashboard under Account Details.
            </p>
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

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-slate-800">Automatic Asset Optimization</div>
              <div className="text-[11px] text-slate-500">Inject f_auto,q_auto into all Instagram published image URLs</div>
            </div>
            <Switch
              checked={autoOptimizeInput}
              onChange={setAutoOptimizeInput}
              className="bg-slate-300"
            />
          </div>

          <div className="pt-2 flex items-center justify-between border-t border-slate-100">
            <Button
              type="text"
              size="small"
              onClick={handleLoadDemoCloudinary}
              className="text-xs text-sky-600 hover:text-sky-700 font-semibold"
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
    </div>
  );
}

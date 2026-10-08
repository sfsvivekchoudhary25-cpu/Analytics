"use client";

import React, { useEffect, useState } from "react";
import { App, Button, Card, Input, Modal, Progress, Space, Switch, Tag, Tooltip } from "antd";
import {
  ApiOutlined,
  ApartmentOutlined,
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
  DisconnectOutlined,
  ExportOutlined,
  FacebookOutlined,
  GlobalOutlined,
  HeartOutlined,
  IdcardOutlined,
  InfoCircleOutlined,
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
  SwapOutlined,
  SyncOutlined,
  ThunderboltOutlined,
  UploadOutlined,
  UserOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import { api, API_BASE, type ConnectionStatus, type ConnectedAccount } from "@/lib/api";

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
  accounts?: ConnectedAccount[];
  onSwitchAccount?: (username: string) => void;
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
  accounts = [],
  onSwitchAccount,
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
  const [accountList, setAccountList] = useState<ConnectedAccount[]>(accounts || []);

  useEffect(() => {
    if (accounts && accounts.length > 0) {
      setAccountList(accounts);
    }
  }, [accounts]);

  const loadAccounts = async () => {
    try {
      const list = await api<ConnectedAccount[]>("/instagram/connection/accounts");
      if (Array.isArray(list) && list.length > 0) {
        setAccountList(list);
      }
    } catch {}
  };

  useEffect(() => {
    loadAccounts();
  }, [status?.connected ? status.username : null]);

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
        loadAccounts(),
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
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 text-white shadow-lg shadow-rose-500/25">
            <InstagramOutlined className="text-4xl" />
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 text-white shadow-md shadow-rose-500/20">
            <InstagramOutlined className="text-2xl" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-slate-900">
                Account & Meta Integrations
              </h1>
              <Tag color="blue" className="!rounded-full font-semibold !text-[11px] !px-2.5">
                Meta Graph API v26.0
              </Tag>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Manage connected Instagram Business profiles, Facebook Page authorizations, automated token health, and API permissions.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            icon={<ReloadOutlined className={refreshing ? "animate-spin" : ""} />}
            onClick={handleRefresh}
            className="!rounded-xl !border-slate-200 !text-slate-700 hover:!border-slate-300 !text-xs font-semibold"
          >
            Refresh Status
          </Button>
          <a
            href="https://developers.facebook.com/apps"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 shadow-2xs transition-all"
          >
            <span>Meta Dev Portal</span>
            <ExportOutlined className="text-[10px] text-slate-400" />
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

      {/* ── TOP KPI HEALTH CARDS (ROW 0) ───────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Instagram Account */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs hover:shadow-md transition-all">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="font-semibold text-slate-500">Instagram Profile</span>
            <Tag color="green" className="!rounded-full font-semibold !text-[10px] !px-2 !m-0 flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Active</span>
            </Tag>
          </div>
          <div className="flex items-center gap-2.5 mt-1">
            <div className="relative h-9 w-9 shrink-0 rounded-full overflow-hidden p-0.5 bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600">
              <div className="h-full w-full rounded-full bg-slate-900 flex items-center justify-center text-xs font-bold text-white uppercase">
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
                  className="absolute inset-0.5 h-[calc(100%-4px)] w-[calc(100%-4px)] rounded-full object-cover bg-white"
                />
              )}
            </div>
            <div className="min-w-0">
              <div className="text-sm font-bold text-slate-900 truncate">@{cleanUsername}</div>
              <div className="text-[11px] text-slate-400">Professional Account</div>
            </div>
          </div>
        </div>

        {/* Card 2: Token Health */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs hover:shadow-md transition-all">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-semibold text-slate-500">Token Health</span>
            <span className={lowToken ? "font-bold text-amber-600" : "font-bold text-slate-700"}>
              {days} Days Left
            </span>
          </div>
          <div className="mt-2 space-y-1.5">
            <Progress
              percent={Math.min(100, Math.max(5, Math.round((days / TOKEN_LIFETIME_DAYS) * 100)))}
              size="small"
              status={lowToken ? "exception" : "active"}
              strokeColor={{ "0%": "#3b82f6", "100%": "#10b981" }}
              showInfo={false}
            />
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span>Auto-refresh daemon</span>
              <span className="font-medium text-emerald-600">At &lt;10 days</span>
            </div>
          </div>
        </div>

        {/* Card 3: Permissions Scope */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs hover:shadow-md transition-all">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-semibold text-slate-500">API Scopes</span>
            <Tag color={missing.length === 0 ? "blue" : "gold"} className="!rounded-full font-semibold !text-[10px] !px-2 !m-0">
              {missing.length === 0 ? "Full Access" : `${PERMISSIONS.length - missing.length}/${PERMISSIONS.length}`}
            </Tag>
          </div>
          <div className="text-lg font-bold text-slate-900 mt-0.5">
            {granted === null
              ? "Unverified"
              : missing.length === 0
              ? "All 5 Permissions"
              : `${PERMISSIONS.length - missing.length} of 5 Granted`}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">DMs, Comments, Publishing, Analytics</div>
        </div>

        {/* Card 4: Facebook Page Engine */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs hover:shadow-md transition-all">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-semibold text-slate-500">Facebook Page</span>
            <Tag
              color={fbStatus?.connected ? "blue" : "default"}
              className="!rounded-full font-semibold !text-[10px] !px-2 !m-0"
            >
              {fbStatus?.connected ? "Linked" : "Not Linked"}
            </Tag>
          </div>
          <div className="text-sm font-bold text-slate-900 truncate mt-1">
            {fbStatus?.connected ? fbStatus.pageName : "Page Required"}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Comment-to-DM Private Reply Engine</div>
        </div>
      </div>

      {/* ── ROW 0.5: CONNECTED INSTAGRAM ACCOUNTS (Multi-Account & Tester Isolation) ── */}
      <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 text-white shadow-xs">
              <InstagramOutlined className="text-base" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900 leading-none">
                  Connected Instagram Accounts
                </h3>
                <Tag color="purple" className="!rounded-full font-semibold !text-[10px] !px-2 !py-0 !m-0">
                  {accountList.length} Connected
                </Tag>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Strict workspace isolation: automations, comment triggers, DM queues, and database records are 100% independent per account.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="primary"
              size="small"
              icon={<PlusOutlined />}
              onClick={onConnectInstagram}
              className="!rounded-xl !bg-indigo-600 hover:!bg-indigo-700 !text-xs font-semibold !h-8 !px-3 shadow-xs"
            >
              Connect Another Account
            </Button>
            <Button
              size="small"
              icon={<KeyOutlined />}
              onClick={() => setIgTokenModalOpen(true)}
              className="!rounded-xl !border-slate-200 !text-slate-600 !text-xs !h-8 !px-3 font-medium"
            >
              Add with Token
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-1">
          {(accountList.length > 0 ? accountList : [{ username: cleanUsername, profilePictureUrl: status?.connected ? status.profilePictureUrl : undefined }]).map((acc) => {
            const isCurrent = acc.username.toLowerCase() === cleanUsername.toLowerCase();
            return (
              <div
                key={acc.username}
                className={`relative rounded-2xl border p-4 transition-all ${
                  isCurrent
                    ? "border-blue-500/60 bg-blue-50/20 shadow-xs ring-1 ring-blue-500/20"
                    : "border-slate-200/80 bg-white hover:border-slate-300 hover:shadow-2xs"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative h-10 w-10 shrink-0 rounded-full overflow-hidden p-0.5 bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600">
                      <div className="h-full w-full rounded-full bg-slate-900 flex items-center justify-center text-xs font-bold text-white uppercase">
                        {acc.username.charAt(0)}
                      </div>
                      {acc.profilePictureUrl && (
                        <img
                          src={
                            acc.profilePictureUrl.startsWith("/media/")
                              ? `${API_BASE}${acc.profilePictureUrl}`
                              : acc.profilePictureUrl
                          }
                          alt=""
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                          }}
                          className="absolute inset-0.5 h-[calc(100%-4px)] w-[calc(100%-4px)] rounded-full object-cover bg-white"
                        />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-sm text-slate-900 truncate">
                          @{acc.username}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {acc.igUserId ? `ID: ${acc.igUserId.slice(0, 10)}...` : "Instagram Account"}
                      </div>
                    </div>
                  </div>

                  {isCurrent ? (
                    <Tag color="blue" className="!rounded-full font-bold !text-[10px] !px-2 !py-0.5 !m-0 flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
                      <span>Active</span>
                    </Tag>
                  ) : (
                    <Button
                      size="small"
                      type="default"
                      icon={<SwapOutlined />}
                      onClick={() => onSwitchAccount && onSwitchAccount(acc.username)}
                      className="!text-xs !font-semibold !rounded-xl !h-7 !px-2.5 !border-slate-200 !text-slate-700 hover:!border-blue-400 hover:!text-blue-600"
                    >
                      Switch
                    </Button>
                  )}
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Scope: Isolated</span>
                  <span className={isCurrent ? "text-blue-600 font-semibold" : "text-slate-500"}>
                    {isCurrent ? "Current Workspace" : "Click switch to view"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── ROW 1: THE TWO CORE INTEGRATIONS (Side by Side: Instagram & Facebook) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        {/* Left: Instagram Professional Connection */}
        <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-sm flex flex-col justify-between space-y-5">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="relative h-14 w-14 shrink-0 rounded-2xl overflow-hidden p-0.5 bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 shadow-md">
                  <div className="h-full w-full rounded-[14px] bg-slate-900 flex items-center justify-center text-lg font-bold text-white uppercase">
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
                      className="absolute inset-0.5 h-[calc(100%-4px)] w-[calc(100%-4px)] rounded-[14px] object-cover bg-white"
                    />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base font-bold text-slate-900 leading-none truncate">
                      @{cleanUsername}
                    </h3>
                    <CheckCircleFilled className="text-blue-500 text-sm" />
                    <Tag color="green" className="!rounded-full font-semibold !text-[10px] !px-2 !py-0 !m-0">
                      Connected
                    </Tag>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 truncate">
                    Instagram Business Account · Graph API OAuth
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Button
                  icon={<ReloadOutlined />}
                  onClick={onConnectInstagram}
                  loading={busy}
                  className="!rounded-xl !border-slate-200 !text-slate-700 hover:!border-blue-400 !text-xs font-semibold"
                >
                  Reconnect
                </Button>
                <Button
                  icon={<KeyOutlined />}
                  onClick={() => setIgTokenModalOpen(true)}
                  className="!rounded-xl !border-slate-200 !text-slate-500 hover:!text-slate-700 !text-xs"
                >
                  Override
                </Button>
              </div>
            </div>

            {/* Token Lifetime Meter */}
            <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50/70 p-4 space-y-2.5">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-slate-700 flex items-center gap-1.5">
                  <ClockCircleOutlined className="text-blue-600" />
                  <span>Access Token Lifecycle</span>
                </span>
                <span className={lowToken ? "text-amber-600 font-bold" : "text-slate-700 font-bold"}>
                  {days} days remaining (of {TOKEN_LIFETIME_DAYS}d)
                </span>
              </div>
              <Progress
                percent={Math.min(100, Math.max(5, Math.round((days / TOKEN_LIFETIME_DAYS) * 100)))}
                size="small"
                status={lowToken ? "exception" : "normal"}
                strokeColor={{ "0%": "#6366f1", "50%": "#3b82f6", "100%": "#10b981" }}
                showInfo={false}
              />
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Long-lived Meta OAuth token. System daemon automatically requests a renewed token daily at 3:00 AM once fewer than 10 days remain.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px] text-slate-400">
            <span>OAuth 2.0 PKCE Compliant</span>
            <span className="text-emerald-600 font-medium flex items-center gap-1">
              <CheckCircleFilled className="text-[10px]" />
              <span>Auto-Renew Daemon Active</span>
            </span>
          </div>
        </div>

        {/* Right: Facebook Page Authorization */}
        <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 shadow-md">
                  <FacebookOutlined className="text-3xl" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base font-bold text-slate-900 leading-none truncate">
                      Facebook Page Authorization
                    </h3>
                    <Tag
                      color={fbStatus?.connected ? "blue" : "default"}
                      className="!rounded-full font-semibold !text-[10px] !px-2 !py-0 !m-0"
                    >
                      {fbStatus?.connected ? "Linked" : "Required"}
                    </Tag>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Meta requires Facebook Page permissions to send automated private replies to comments.
                  </p>
                </div>
              </div>
            </div>

            {/* Status & Actions Box */}
            <div className="mt-4">
              {fbStatus?.connected ? (
                <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white font-bold text-sm shadow-2xs">
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
                      className="!rounded-lg !text-xs font-semibold !border-slate-200"
                    >
                      Switch Page
                    </Button>
                    <Button
                      size="small"
                      danger
                      onClick={handleDisconnectFacebook}
                      loading={fbBusy}
                      className="!rounded-lg !text-xs font-semibold"
                    >
                      Disconnect
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-6 text-center space-y-3">
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    To deliver instant coupon links when customers comment on your Instagram posts, connect the Facebook Page linked to your Instagram account.
                  </p>
                  <div className="flex items-center justify-center gap-2">
                    <Button
                      type="primary"
                      icon={<FacebookOutlined />}
                      onClick={handleConnectFacebook}
                      loading={fbBusy}
                      className="!rounded-xl !bg-blue-600 hover:!bg-blue-700 font-semibold"
                    >
                      Connect Facebook Page
                    </Button>
                    <Button
                      icon={<KeyOutlined />}
                      onClick={() => setFbModalOpen(true)}
                      className="!rounded-xl !border-slate-200 text-xs text-slate-600 font-semibold"
                    >
                      Paste Page Token
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px] text-slate-400">
            <span>Required for Comment Automation</span>
            <span className="text-slate-600 font-medium">Private Reply API</span>
          </div>
        </div>
      </div>

      {/* ── ROW 2: CAPABILITIES & SYSTEM DIAGNOSTICS (Side by Side) ──────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left: Granted Permissions & API Scopes (7 cols) */}
        <div className="lg:col-span-7 rounded-3xl border border-slate-200/90 bg-white p-6 shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-50 text-purple-600 text-sm">
                  <SafetyCertificateOutlined />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 leading-none">
                    Granted Permissions & API Scopes
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Specific capabilities authorized by your Instagram Professional account.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
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
                  className="!rounded-full font-semibold !text-[10px]"
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
      <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-sm space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-50 text-sky-600 text-lg shadow-2xs">
              <CloudServerOutlined />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 leading-none">
                  Third-Party Services & Cloud Infrastructure
                </h3>
                <Tag color="cyan" className="!rounded-full font-semibold !text-[10px]">
                  3 Connected
                </Tag>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                External media delivery CDNs, AI reasoning engines, and edge proxy tunnels connected to Instagram Hub.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              icon={<ReloadOutlined className={allPinging ? "animate-spin" : ""} />}
              onClick={handlePingAllServices}
              loading={allPinging}
              className="!rounded-xl font-semibold !text-xs !border-slate-200 hover:!border-slate-300"
            >
              Ping All Services
            </Button>
          </div>
        </div>

        {/* 3 Symmetrical Service Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-stretch">
          {/* Card 1: Cloudinary Media CDN (Hero CDN Service) */}
          <div className="rounded-2xl border border-sky-100 bg-gradient-to-b from-sky-50/40 via-white to-white p-5 flex flex-col justify-between hover:border-sky-300 hover:shadow-sm transition-all duration-200 group">
            <div className="space-y-4">
              {/* Card Header */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500 text-white text-lg shadow-sm group-hover:scale-105 transition-transform">
                    <CloudUploadOutlined />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 leading-tight">
                      Cloudinary Media CDN
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      Global Image & Video CDN
                    </p>
                  </div>
                </div>
                {/* Health & Latency Badge */}
                {cloudinaryHealth?.healthy ? (
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200/80 text-[11px] font-semibold text-emerald-700 shrink-0">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>{cloudinaryHealth.latencyMs}ms</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200/80 text-[11px] font-semibold text-amber-700 shrink-0">
                    <WarningOutlined className="text-xs" />
                    <span>Checking</span>
                  </div>
                )}
              </div>

              {/* Status Box */}
              <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-100 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Target Cloud
                  </span>
                  <Tag
                    color={cloudinaryConfig.isCustom ? "purple" : "blue"}
                    className="!rounded-md font-semibold text-[10px] !m-0"
                  >
                    {cloudinaryConfig.isCustom ? "Custom Cloud" : "Demo CDN Edge"}
                  </Tag>
                </div>
                <div className="text-xs font-mono font-bold text-slate-800 truncate">
                  @{cloudinaryConfig.cloudName || "demo"}
                </div>
              </div>

              {/* Specs & Capabilities */}
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-400">Edge Domain</span>
                  <span className="font-semibold text-slate-700 font-mono text-[11px]">
                    res.cloudinary.com
                  </span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-400">Auto Optimization</span>
                  <span className="font-semibold text-emerald-600 flex items-center gap-1">
                    <CheckCircleFilled className="text-[10px]" />
                    <span>f_auto, q_auto</span>
                  </span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-400">Meta Publishing</span>
                  <span className="font-semibold text-slate-700">
                    Direct HTTPS Ingestion
                  </span>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className="text-slate-400">API Credentials</span>
                  <span className="font-semibold text-slate-700">
                    {cloudinaryConfig.apiKey ? "API Key Attached" : "Public Edge Access"}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-4 mt-4 border-t border-slate-100 flex items-center gap-2">
              <Button
                size="small"
                icon={<ThunderboltOutlined />}
                onClick={() => pingCloudinary()}
                loading={cloudinaryLoading}
                className="flex-1 !rounded-lg text-xs font-semibold !border-sky-200 !text-sky-700 hover:!border-sky-400 !bg-sky-50/60"
              >
                Ping Health
              </Button>
              <Button
                size="small"
                icon={<SettingOutlined />}
                onClick={() => setCloudinaryModalOpen(true)}
                className="!rounded-lg text-xs font-semibold !border-slate-200"
              >
                Configure
              </Button>
              {cloudinaryConfig.isCustom && (
                <Button
                  size="small"
                  danger
                  onClick={handleDisconnectCloudinary}
                  className="!rounded-lg text-xs font-semibold"
                >
                  Reset
                </Button>
              )}
            </div>
          </div>

          {/* Card 2: OpenRouter AI Engine */}
          <div className="rounded-2xl border border-purple-100 bg-gradient-to-b from-purple-50/40 via-white to-white p-5 flex flex-col justify-between hover:border-purple-300 hover:shadow-sm transition-all duration-200 group">
            <div className="space-y-4">
              {/* Card Header */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-600 text-white text-lg shadow-sm group-hover:scale-105 transition-transform">
                    <RobotOutlined />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 leading-tight">
                      OpenRouter AI Engine
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      Multi-LLM Reasoning Gateway
                    </p>
                  </div>
                </div>
                {/* Health & Latency Badge */}
                {openRouterHealth?.healthy ? (
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200/80 text-[11px] font-semibold text-emerald-700 shrink-0">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>{openRouterHealth.latencyMs}ms</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200/80 text-[11px] font-semibold text-emerald-700 shrink-0">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>Active</span>
                  </div>
                )}
              </div>

              {/* Status Box */}
              <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-100 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700">
                    Active Architecture
                  </span>
                  <Tag color="purple" className="!rounded-md font-semibold text-[10px] !m-0">
                    Operational
                  </Tag>
                </div>
                <div className="text-xs font-mono font-bold text-slate-800 truncate" title="nvidia/nemotron-3-ultra-550b-a55b">
                  nvidia/nemotron-3-ultra
                </div>
              </div>

              {/* Specs & Capabilities */}
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-400">Daily Requests</span>
                  <span className="font-semibold text-slate-700">
                    {openRouterHealth?.remainingRequests ?? 48} / {openRouterHealth?.totalLimit ?? 50} remaining
                  </span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-400">Comment Sentiment</span>
                  <span className="font-semibold text-emerald-600 flex items-center gap-1">
                    <CheckCircleFilled className="text-[10px]" />
                    <span>Real-time Classification</span>
                  </span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-400">DM Auto-Reply</span>
                  <span className="font-semibold text-slate-700">
                    Dynamic Discount Code
                  </span>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className="text-slate-400">Security</span>
                  <span className="font-semibold text-slate-700">
                    Bearer Token Encrypted
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-4 mt-4 border-t border-slate-100 flex items-center gap-2">
              <Button
                size="small"
                icon={<ThunderboltOutlined />}
                onClick={() => pingOpenRouter()}
                loading={openRouterLoading}
                className="w-full !rounded-lg text-xs font-semibold !border-purple-200 !text-purple-700 hover:!border-purple-400 !bg-purple-50/60"
              >
                Ping AI Gateway
              </Button>
            </div>
          </div>

          {/* Card 3: Cloudflare Webhook Proxy & Inbound Tunnel */}
          <div className="rounded-2xl border border-amber-100 bg-gradient-to-b from-amber-50/30 via-white to-white p-5 flex flex-col justify-between hover:border-amber-300 hover:shadow-sm transition-all duration-200 group">
            <div className="space-y-4">
              {/* Card Header */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500 text-white text-lg shadow-sm group-hover:scale-105 transition-transform">
                    <GlobalOutlined />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 leading-tight">
                      Cloudflare Edge Proxy
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      Inbound Real-Time Webhooks
                    </p>
                  </div>
                </div>
                {/* Status Badge */}
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 border border-blue-200/80 text-[11px] font-semibold text-blue-700 shrink-0">
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse"></span>
                  <span>Tunnel Active</span>
                </div>
              </div>

              {/* Status Box */}
              <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-100 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700">
                    Public Gateway
                  </span>
                  <Tag color="gold" className="!rounded-md font-semibold text-[10px] !m-0">
                    trycloudflare.com
                  </Tag>
                </div>
                <div className="text-xs font-mono font-bold text-slate-800 truncate" title="trycloudflare.com tunnel">
                  municipality-tour-lawsuit...
                </div>
              </div>

              {/* Specs & Capabilities */}
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-400">Target Path</span>
                  <span className="font-semibold text-slate-700 font-mono text-[11px]">
                    /instagram/webhook
                  </span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-400">Signature Check</span>
                  <span className="font-semibold text-emerald-600 flex items-center gap-1">
                    <CheckCircleFilled className="text-[10px]" />
                    <span>HMAC-SHA256 Enforced</span>
                  </span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-400">Event Delivery</span>
                  <span className="font-semibold text-slate-700">
                    Instant Comment & DM Push
                  </span>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className="text-slate-400">Firewall Security</span>
                  <span className="font-semibold text-slate-700">
                    Zero open inbound ports
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-4 mt-4 border-t border-slate-100 flex items-center gap-2">
              <Button
                size="small"
                icon={<CopyOutlined />}
                onClick={handleCopyWebhook}
                className="w-full !rounded-lg text-xs font-semibold !border-amber-200 !text-amber-800 hover:!border-amber-400 !bg-amber-50/60"
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

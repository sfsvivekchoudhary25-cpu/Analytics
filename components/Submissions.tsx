"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Card,
  Button,
  Tag,
  Input,
  Segmented,
  Modal,
  Tooltip,
  Popconfirm,
  Skeleton,
  Space,
  App,
} from "antd";
import {
  PictureOutlined,
  UploadOutlined,
  ReloadOutlined,
  InstagramOutlined,
  CheckCircleOutlined,
  CheckCircleFilled,
  ClockCircleOutlined,
  CloseCircleOutlined,
  EyeOutlined,
  DeleteOutlined,
  EditOutlined,
  RobotOutlined,
  RiseOutlined,
  SendOutlined,
  SearchOutlined,
  PlusOutlined,
  CodeOutlined,
  AppstoreOutlined,
  BarsOutlined,
  ThunderboltOutlined,
  CameraOutlined,
  LinkOutlined,
  CopyOutlined,
  CheckOutlined,
  ExclamationCircleOutlined,
  UserOutlined,
  MobileOutlined,
  HeartOutlined,
  MessageOutlined,
} from "@ant-design/icons";
import { api, API_BASE, type ConnectionStatus } from "@/lib/api";
import { MobilePreview } from "./MobilePreview";

type Submission = {
  id: string;
  igUsername: string;
  imageFile: string;
  caption: string | null;
  status: "pending" | "publishing" | "published" | "failed";
  permalink: string | null;
  error: string | null;
  note: string | null;
  dmStatus: "waiting" | "sent" | "failed";
  createdAt: string;
  publishedAt?: string | null;
  chatUrl: string | null;
};

// Deterministic pastel avatar gradient based on username
const AVATAR_GRADIENTS = [
  "from-fuchsia-500 to-rose-400",
  "from-blue-500 to-indigo-500",
  "from-emerald-500 to-teal-400",
  "from-amber-500 to-orange-400",
  "from-violet-500 to-purple-400",
  "from-cyan-500 to-blue-400",
];

function getAvatarGradient(username: string) {
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = (hash * 31 + username.charCodeAt(i)) >>> 0;
  }
  return AVATAR_GRADIENTS[hash % AVATAR_GRADIENTS.length];
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function Submissions() {
  const { message } = App.useApp();
  const [items, setItems] = useState<Submission[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  // Filter & Search state
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "published" | "failed">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Modals state
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [apiModalOpen, setApiModalOpen] = useState(false);
  const [previewItem, setPreviewItem] = useState<Submission | null>(null);
  const [modalPreviewMode, setModalPreviewMode] = useState<"standard" | "mobile">("mobile");
  // Pre-publish caption review modal (Option 3)
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewSubmission, setReviewSubmission] = useState<Submission | null>(null);
  const [reviewCaption, setReviewCaption] = useState("");
  const [publishingLive, setPublishingLive] = useState(false);
  const [aiGeneratingCaption, setAiGeneratingCaption] = useState(false);
  const [aiCaptionSuggestions, setAiCaptionSuggestions] = useState<{
    model: string;
    leadMagnet: string;
    viralExplore: string;
    communitySpark: string;
  } | null>(null);
  const [activeAiAngle, setActiveAiAngle] = useState<"leadMagnet" | "viralExplore" | "communitySpark">("leadMagnet");
  const [brandProfile, setBrandProfile] = useState<{
    username: string;
    profilePictureUrl?: string | null;
  }>({
    username: "fabroniee",
    profilePictureUrl: "/brand-avatar.jpg",
  });
  const [brandAvatarError, setBrandAvatarError] = useState(false);

  useEffect(() => {
    api<ConnectionStatus>("/instagram/connection")
      .then((res) => {
        if (res && res.connected) {
          setBrandProfile({
            username: res.username,
            profilePictureUrl: res.profilePictureUrl || "/brand-avatar.jpg",
          });
        }
      })
      .catch(() => {});
  }, []);

  // Manual Upload Form State
  const [usernameInput, setUsernameInput] = useState("");
  const [captionInput, setCaptionInput] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  interface UserSuggestionItem {
    username: string;
    displayName?: string;
    profilePictureUrl?: string | null;
    source: string;
    category?: string;
    count?: number;
    isKnownCustomer: boolean;
    verifiedBadge?: boolean;
    profileUrl?: string;
  }

  // User search & verification state
  const [userSuggestions, setUserSuggestions] = useState<UserSuggestionItem[]>([]);
  const [selectedProfileData, setSelectedProfileData] = useState<UserSuggestionItem | null>(null);
  const [isSearchingUsers, setIsSearchingUsers] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [knownUsersCache, setKnownUsersCache] = useState<UserSuggestionItem[]>([]);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Close suggestions dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Fetch known customer commenters on initial mount
  useEffect(() => {
    let cancelled = false;
    api<Array<{ username: string }>>("/comments?filter=all")
      .then((comments) => {
        if (cancelled || !Array.isArray(comments)) return;
        const counts = new Map<string, number>();
        for (const c of comments) {
          if (c.username) {
            const u = c.username.toLowerCase();
            counts.set(u, (counts.get(u) || 0) + 1);
          }
        }
        const list: UserSuggestionItem[] = Array.from(counts.entries()).map(([username, count]) => ({
          username,
          displayName: username,
          source: "Commenter on your posts",
          category: "Verified Customer",
          count,
          isKnownCustomer: true,
          verifiedBadge: true,
          profileUrl: `https://instagram.com/${username}`,
        }));
        setKnownUsersCache(list);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  // Real Instagram search when typing (debounced)
  useEffect(() => {
    const q = usernameInput.trim().replace(/^@/, "").toLowerCase();
    if (!q) {
      setUserSuggestions(knownUsersCache);
      setIsSearchingUsers(false);
      return;
    }

    let active = true;
    setIsSearchingUsers(true);

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/instagram/search?q=${encodeURIComponent(q)}`);
        const realProfiles: UserSuggestionItem[] = res.ok ? await res.json() : [];

        if (!active) return;

        // Local known customer matches
        const localMatches = knownUsersCache.filter((u) => u.username.includes(q));

        const merged: UserSuggestionItem[] = [...localMatches];
        for (const item of realProfiles) {
          if (!merged.some((m) => m.username === item.username)) {
            merged.push(item);
          }
        }

        setUserSuggestions(merged);
      } catch {
        if (!active) return;
        const localMatches = knownUsersCache.filter((u) => u.username.includes(q));
        setUserSuggestions(localMatches);
      } finally {
        if (active) setIsSearchingUsers(false);
      }
    }, 200);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [usernameInput, knownUsersCache]);

  const cleanUsername = useMemo(() => {
    return usernameInput.trim().replace(/^@/, "").toLowerCase();
  }, [usernameInput]);

  const isUsernameValidFormat = useMemo(() => {
    if (!cleanUsername) return false;
    if (cleanUsername.length > 30) return false;
    if (!/^[a-z0-9._]+$/.test(cleanUsername)) return false;
    if (cleanUsername.startsWith(".") || cleanUsername.endsWith(".")) return false;
    if (cleanUsername.includes("..")) return false;
    return true;
  }, [cleanUsername]);

  const isSelectedUserKnown = useMemo(() => {
    return (
      knownUsersCache.some((u) => u.username === cleanUsername) ||
      userSuggestions.some((u) => u.username === cleanUsername && u.isKnownCustomer)
    );
  }, [cleanUsername, knownUsersCache, userSuggestions]);

  // API Setup snippet tab
  const [apiSnippetLang, setApiSnippetLang] = useState<"js" | "curl" | "html">("js");
  const [copiedSnippet, setCopiedSnippet] = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const list = await api<Submission[]>("/submissions");
      setItems(list);
    } catch (e: unknown) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Clean up file preview URL on unmount or file change
  useEffect(() => {
    return () => {
      if (filePreview) URL.revokeObjectURL(filePreview);
    };
  }, [filePreview]);

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] || null;
    setSelectedFile(file);
    if (file) {
      if (filePreview) URL.revokeObjectURL(filePreview);
      setFilePreview(URL.createObjectURL(file));
    } else {
      setFilePreview(null);
    }
  }

  function resetUploadForm() {
    setUsernameInput("");
    setSelectedProfileData(null);
    setCaptionInput("");
    setSelectedFile(null);
    if (filePreview) URL.revokeObjectURL(filePreview);
    setFilePreview(null);
    setShowSuggestions(false);
    setUserSuggestions([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleManualSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedFile) {
      message.error("Please select a photo file.");
      return;
    }
    const cleanUser = usernameInput.trim().replace(/^@/, "");
    if (!cleanUser) {
      message.error("Please enter a valid Instagram username.");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("username", cleanUser);
      formData.append("image", selectedFile);
      if (captionInput.trim()) {
        formData.append("caption", captionInput.trim());
      }

      await api("/submissions", { method: "POST", body: formData });
      message.success(`Photo from @${cleanUser} added to approval queue!`);
      resetUploadForm();
      setUploadModalOpen(false);
      await load(true);
    } catch (err: unknown) {
      message.error((err as Error).message || "Failed to submit photo.");
    } finally {
      setUploading(false);
    }
  }

  async function generateAiCaptions() {
    if (!reviewSubmission) return;
    setAiGeneratingCaption(true);
    try {
      const res = await api<any>("/ai/optimize-caption", {
        method: "POST",
        body: JSON.stringify({
          caption: reviewCaption,
          username: reviewSubmission.igUsername,
          mediaType: "IMAGE",
        }),
      });
      setAiCaptionSuggestions(res);
      message.success("Generated 3 AI growth caption angles!");
    } catch (err: any) {
      message.error(err.message || "Failed to generate AI captions.");
    } finally {
      setAiGeneratingCaption(false);
    }
  }

  const growthAudit = useMemo(() => {
    if (!reviewSubmission) return { score: 65, hasUserTag: false, hasCta: false, hasSave: false, isGoodLength: false, length: 0 };
    const text = reviewCaption.toLowerCase();
    const cleanUser = reviewSubmission.igUsername.toLowerCase();
    const hasUserTag = text.includes(`@${cleanUser}`);
    const hasCta = /\b(link|dm|comment|shop|order|message|drop|tap|buy)\b/i.test(text);
    const hasSave = /\b(save|bookmark|📌|keep|later|reference)\b/i.test(text);
    const len = reviewCaption.trim().length;
    const isGoodLength = len >= 80 && len <= 450;

    let score = 55;
    if (hasUserTag) score += 15;
    if (hasCta) score += 15;
    if (hasSave) score += 10;
    if (isGoodLength) score += 5;
    score = Math.min(100, Math.max(40, score));

    return {
      score,
      hasUserTag,
      hasCta,
      hasSave,
      isGoodLength,
      length: len,
    };
  }, [reviewCaption, reviewSubmission]);
  function openPublishReview(s: Submission) {
    setPreviewItem(null); // Dismiss detail preview to prevent double modal
    setReviewSubmission(s);
    const defaultShoutout = `Thank you @${s.igUsername} for sharing this with us! 💛`;
    const initial = s.caption && s.caption.trim() ? s.caption.trim() : defaultShoutout;
    setReviewCaption(initial);
    setAiCaptionSuggestions(null);
    setReviewModalOpen(true);
  }

  async function confirmPublish() {
    if (!reviewSubmission) return;
    setPublishingLive(true);
    setBusyId(reviewSubmission.id);
    try {
      await api(`/submissions/${reviewSubmission.id}/publish`, {
        method: "POST",
        body: JSON.stringify({ caption: reviewCaption.trim() }),
      });
      message.success(`Published live to Instagram feed and tagged @${reviewSubmission.igUsername}!`);
      setReviewModalOpen(false);
      setReviewSubmission(null);
      if (previewItem?.id === reviewSubmission.id) {
        setPreviewItem(null);
      }
      await load(true);
    } catch (err: unknown) {
      message.error((err as Error).message || "Failed to publish photo.");
    } finally {
      setPublishingLive(false);
      setBusyId(null);
    }
  }
  async function publish(s: Submission) {
    setBusyId(s.id);
    try {
      await api(`/submissions/${s.id}/publish`, { method: "POST" });
      message.success(`Published to feed and tagged @${s.igUsername}!`);
      await load(true);
    } catch (err: unknown) {
      message.error((err as Error).message || "Failed to publish photo.");
    } finally {
      setBusyId(null);
    }
  }

  async function remove(s: Submission) {
    setBusyId(s.id);
    try {
      await api(`/submissions/${s.id}`, { method: "DELETE" });
      message.success(`Submission from @${s.igUsername} deleted.`);
      await load(true);
    } catch (err: unknown) {
      message.error((err as Error).message || "Failed to delete submission.");
    } finally {
      setBusyId(null);
    }
  }

  // Metrics computation
  const metrics = useMemo(() => {
    if (!items) {
      return { total: 0, pending: 0, published: 0, failed: 0, dmSent: 0, dmWaiting: 0 };
    }
    return {
      total: items.length,
      pending: items.filter((i) => i.status === "pending").length,
      published: items.filter((i) => i.status === "published").length,
      failed: items.filter((i) => i.status === "failed").length,
      dmSent: items.filter((i) => i.dmStatus === "sent").length,
      dmWaiting: items.filter((i) => i.dmStatus === "waiting").length,
    };
  }, [items]);

  // Filtered submissions
  const filteredItems = useMemo(() => {
    if (!items) return [];
    return items.filter((item) => {
      // Status filter
      if (statusFilter !== "all" && item.status !== statusFilter) return false;
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesUser = item.igUsername.toLowerCase().includes(q);
        const matchesCaption = item.caption ? item.caption.toLowerCase().includes(q) : false;
        return matchesUser || matchesCaption;
      }
      return true;
    });
  }, [items, statusFilter, searchQuery]);

  function copySnippet(text: string) {
    navigator.clipboard.writeText(text);
    setCopiedSnippet(true);
    message.success("Code snippet copied to clipboard!");
    setTimeout(() => setCopiedSnippet(false), 2000);
  }

  return (
    <div className="w-full space-y-6 animate-page-entrance">
      {/* ── Top Header Toolbar ─────────────────────────────────────────── */}
      <div className="-mx-4 -mt-4 sm:-mx-6 sm:-mt-6 lg:-mx-8 lg:-mt-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 bg-white px-6 py-4.5 shadow-2xs">
        <div className="flex items-center gap-3.5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 border border-blue-100 text-blue-600 shadow-2xs">
            <PictureOutlined className="text-xl" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-lg font-bold text-slate-900 tracking-tight">Customer Photos & UGC Hub</h1>
              <Tag className="!rounded-full !bg-blue-50 !text-blue-700 !border-blue-200/80 !font-semibold !px-2.5 !m-0">
                Live Intake Queue
              </Tag>
              {metrics.pending > 0 && (
                <Tag className="!rounded-full !bg-amber-50 !text-amber-700 !border-amber-200/80 !font-semibold !px-2.5 !m-0 flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                  <span>{metrics.pending} Needs Review</span>
                </Tag>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Review customer photos from your website, curate content, and publish directly to Instagram with auto-tagging.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            icon={<ReloadOutlined className={refreshing ? "animate-spin text-blue-600" : "text-slate-600"} />}
            onClick={() => load(true)}
            disabled={loading || refreshing}
            className="!flex !items-center !gap-1.5 !h-9 !rounded-xl !border-slate-200 hover:!border-blue-400 hover:!text-blue-600 transition-all text-xs font-medium text-slate-700 shadow-2xs"
          >
            Refresh
          </Button>

          <Button
            icon={<CodeOutlined className="text-slate-600" />}
            onClick={() => setApiModalOpen(true)}
            className="!flex !items-center !gap-1.5 !h-9 !rounded-xl !border-slate-200 hover:!border-blue-400 hover:!text-blue-600 transition-all text-xs font-medium text-slate-700 shadow-2xs"
          >
            Website API Setup
          </Button>

          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setUploadModalOpen(true)}
            className="!flex !items-center !gap-1.5 !h-9 !rounded-xl !bg-blue-600 hover:!bg-blue-700 !border-blue-600 font-semibold text-xs shadow-xs transition-all cursor-pointer"
          >
            Upload Customer Photo
          </Button>
        </div>
      </div>

      {/* ── 4 Top KPI Metric Summary Cards ─────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Pending Approval */}
        <Card
          className="!rounded-2xl !border-slate-200/80 !bg-white !shadow-xs hover:!border-amber-300 hover:!shadow-md transition-all group"
          styles={{ body: { padding: "16px 18px" } }}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-600">Pending Review</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 text-amber-600 group-hover:scale-105 transition-transform">
              <ClockCircleOutlined className="text-sm" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 tabular-nums">
              {loading ? "--" : metrics.pending.toLocaleString()}
            </span>
            {metrics.pending > 0 && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200/60">
                Action required
              </span>
            )}
          </div>
          <div className="mt-1.5 flex items-center gap-1.5 text-xs text-slate-500">
            <span>Awaiting one-click publish & tag</span>
          </div>
        </Card>

        {/* Metric 2: Published to Feed */}
        <Card
          className="!rounded-2xl !border-slate-200/80 !bg-white !shadow-xs hover:!border-emerald-300 hover:!shadow-md transition-all group"
          styles={{ body: { padding: "16px 18px" } }}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-600">Published to Feed</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 group-hover:scale-105 transition-transform">
              <CheckCircleOutlined className="text-sm" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 tabular-nums">
              {loading ? "--" : metrics.published.toLocaleString()}
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
              Live on feed
            </span>
          </div>
          <div className="mt-1.5 flex items-center gap-1.5 text-xs text-slate-500">
            <span>Customer tagged & credited</span>
          </div>
        </Card>

        {/* Metric 3: Total Submissions */}
        <Card
          className="!rounded-2xl !border-slate-200/80 !bg-white !shadow-xs hover:!border-blue-300 hover:!shadow-md transition-all group"
          styles={{ body: { padding: "16px 18px" } }}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-600">Total Submissions</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-blue-600 group-hover:scale-105 transition-transform">
              <PictureOutlined className="text-sm" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 tabular-nums">
              {loading ? "--" : metrics.total.toLocaleString()}
            </span>
            <span className="text-xs text-slate-400 font-normal">photos</span>
          </div>
          <div className="mt-1.5 flex items-center gap-1.5 text-xs text-slate-500">
            <span>Website intake + manual entries</span>
          </div>
        </Card>

        {/* Metric 4: Customer DM Outreach */}
        <Card
          className="!rounded-2xl !border-slate-200/80 !bg-white !shadow-xs hover:!border-indigo-300 hover:!shadow-md transition-all group"
          styles={{ body: { padding: "16px 18px" } }}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-600">Thank-You DM Loop</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 group-hover:scale-105 transition-transform">
              <SendOutlined className="text-sm" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 tabular-nums">
              {loading ? "--" : metrics.dmSent.toLocaleString()}
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200/60">
              {metrics.dmWaiting} in queue
            </span>
          </div>
          <div className="mt-1.5 flex items-center gap-1.5 text-xs text-slate-500">
            <span>Automated customer gratitude CRM</span>
          </div>
        </Card>
      </div>

      {/* ── Filter, Search & View Controls Bar ─────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs">
        {/* Segmented Filter */}
        <div className="flex-1 min-w-[280px]">
          <Segmented
            value={statusFilter}
            onChange={(val) => setStatusFilter(val as any)}
            options={[
              {
                label: (
                  <span className="flex items-center gap-1.5 px-1 py-0.5">
                    <span>All Photos</span>
                    <span className="text-[11px] px-1.5 py-0.2 rounded-full bg-slate-200/70 font-bold tabular-nums">
                      {metrics.total}
                    </span>
                  </span>
                ),
                value: "all",
              },
              {
                label: (
                  <span className="flex items-center gap-1.5 px-1 py-0.5">
                    <ClockCircleOutlined className="text-amber-500 text-xs" />
                    <span>Pending Review</span>
                    {metrics.pending > 0 && (
                      <span className="text-[11px] px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-700 font-bold tabular-nums">
                        {metrics.pending}
                      </span>
                    )}
                  </span>
                ),
                value: "pending",
              },
              {
                label: (
                  <span className="flex items-center gap-1.5 px-1 py-0.5">
                    <CheckCircleOutlined className="text-emerald-500 text-xs" />
                    <span>Published</span>
                    <span className="text-[11px] px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-700 font-bold tabular-nums">
                      {metrics.published}
                    </span>
                  </span>
                ),
                value: "published",
              },
              ...(metrics.failed > 0
                ? [
                    {
                      label: (
                        <span className="flex items-center gap-1.5 px-1 py-0.5">
                          <CloseCircleOutlined className="text-rose-500 text-xs" />
                          <span>Failed</span>
                          <span className="text-[11px] px-1.5 py-0.2 rounded-full bg-rose-100 text-rose-700 font-bold tabular-nums">
                            {metrics.failed}
                          </span>
                        </span>
                      ),
                      value: "failed",
                    },
                  ]
                : []),
            ]}
            className="!rounded-xl !bg-slate-100/80 !p-1 text-xs"
          />
        </div>

        {/* Search & Layout toggle */}
        <div className="flex items-center gap-2.5">
          <Input
            placeholder="Search by @username or caption..."
            prefix={<SearchOutlined className="text-slate-400 text-xs" />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            allowClear
            className="!h-9 !w-full sm:!w-64 !rounded-xl !border-slate-200 text-xs"
          />

          <div className="flex items-center border border-slate-200 rounded-xl p-0.5 bg-slate-50 shrink-0">
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                viewMode === "grid"
                  ? "bg-white text-blue-600 shadow-2xs font-bold"
                  : "text-slate-400 hover:text-slate-700"
              }`}
              title="Grid View"
            >
              <AppstoreOutlined />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                viewMode === "list"
                  ? "bg-white text-blue-600 shadow-2xs font-bold"
                  : "text-slate-400 hover:text-slate-700"
              }`}
              title="List View"
            >
              <BarsOutlined />
            </button>
          </div>
        </div>
      </div>

      {/* ── Content Section: Loading Skeletons ─────────────────────────── */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-2xl border border-slate-200/80 bg-white overflow-hidden shadow-xs">
              <div className="aspect-square bg-slate-100 skeleton-pulse" />
              <div className="p-4 space-y-3">
                <Skeleton.Input active size="small" style={{ width: 120 }} />
                <Skeleton active paragraph={{ rows: 2 }} title={false} />
                <div className="pt-2 flex gap-2">
                  <Skeleton.Button active size="small" style={{ width: "100%" }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Empty State: When no items exist in DB ─────────────────────── */}
      {!loading && items && items.length === 0 && (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-gradient-to-b from-slate-50/70 to-white p-12 text-center shadow-xs">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 border border-blue-100 text-blue-600 shadow-xs mb-4">
            <CameraOutlined className="text-3xl" />
          </div>
          <h3 className="text-base font-bold text-slate-900">No Customer Photos Yet</h3>
          <p className="mx-auto mt-1.5 max-w-md text-xs text-slate-500 leading-relaxed">
            Photos sent from your website customer intake form will appear here for review and one-click publishing to Instagram. You can also upload test photos manually.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setUploadModalOpen(true)}
              className="!h-9.5 !rounded-xl !bg-blue-600 hover:!bg-blue-700 !px-5 font-semibold text-xs shadow-xs"
            >
              Upload First Photo Manually
            </Button>
            <Button
              icon={<CodeOutlined />}
              onClick={() => setApiModalOpen(true)}
              className="!h-9.5 !rounded-xl !border-slate-200 hover:!border-blue-400 !px-4 text-xs font-medium text-slate-700"
            >
              View Website API Setup
            </Button>
          </div>
        </div>
      )}

      {/* ── Empty Filter State: Filter / Search returned 0 ─────────────── */}
      {!loading && items && items.length > 0 && filteredItems.length === 0 && (
        <div className="rounded-2xl border border-slate-200/80 bg-white p-10 text-center shadow-xs">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-400 mb-3">
            <SearchOutlined className="text-xl" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">No matching submissions</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            No submissions matched your current filter &quot;{statusFilter}&quot;
            {searchQuery ? ` and search query "${searchQuery}"` : ""}.
          </p>
          <Button
            onClick={() => {
              setStatusFilter("all");
              setSearchQuery("");
            }}
            className="!mt-4 !rounded-xl !text-xs !border-slate-200 text-slate-700"
          >
            Clear Filters
          </Button>
        </div>
      )}

      {/* ── GRID / GALLERY VIEW ────────────────────────────────────────── */}
      {!loading && viewMode === "grid" && filteredItems.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredItems.map((s) => (
            <Card
              key={s.id}
              className="!rounded-2xl !border-slate-200/80 !bg-white !shadow-xs hover:!shadow-md hover:!border-blue-200 transition-all flex flex-col overflow-hidden group"
              styles={{ body: { padding: "0", flex: 1, display: "flex", flexDirection: "column" } }}
            >
              {/* Photo Media Container */}
              <div className="relative aspect-square w-full bg-slate-950 overflow-hidden cursor-pointer">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`${API_BASE}/media/${s.imageFile}`}
                  alt={`Photo from @${s.igUsername}`}
                  className="h-full w-full object-cover group-hover:scale-103 transition-transform duration-500"
                  onClick={() => setPreviewItem(s)}
                />

                {/* Overlaid Status Badge (Top Left) */}
                <div className="absolute top-3 left-3 z-10">
                  {s.status === "pending" && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/90 text-white backdrop-blur-md shadow-xs">
                      <ClockCircleOutlined className="text-xs" />
                      <span>Pending Review</span>
                    </span>
                  )}
                  {s.status === "published" && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/90 text-white backdrop-blur-md shadow-xs">
                      <CheckCircleOutlined className="text-xs" />
                      <span>Live on Feed</span>
                    </span>
                  )}
                  {s.status === "publishing" && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-500/90 text-white backdrop-blur-md shadow-xs animate-pulse">
                      <ReloadOutlined className="text-xs animate-spin" />
                      <span>Publishing...</span>
                    </span>
                  )}
                  {s.status === "failed" && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-500/90 text-white backdrop-blur-md shadow-xs">
                      <CloseCircleOutlined className="text-xs" />
                      <span>Publish Failed</span>
                    </span>
                  )}
                </div>

                {/* Overlaid Username Pill (Top Right) */}
                <div className="absolute top-3 right-3 z-10">
                  <a
                    href={`https://instagram.com/${s.igUsername}`}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="group/tag inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold !text-white bg-slate-900/85 hover:bg-black backdrop-blur-md border border-white/25 shadow-md transition-all duration-150 hover:scale-105"
                  >
                    <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-gradient-to-tr from-amber-400 via-rose-500 to-purple-600 text-white shadow-2xs shrink-0">
                      <InstagramOutlined className="!text-white text-[9px]" />
                    </span>
                    <span className="!text-white font-medium tracking-tight">@{s.igUsername}</span>
                  </a>
                </div>

                {/* Overlaid Quick Zoom icon (Bottom Right) */}
                <button
                  type="button"
                  onClick={() => setPreviewItem(s)}
                  className="absolute bottom-3 right-3 z-10 flex h-8 w-8 items-center justify-center rounded-xl bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-md hover:bg-black/70 cursor-pointer"
                  title="Expand Photo"
                >
                  <EyeOutlined className="text-sm" />
                </button>
              </div>

              {/* Card Body */}
              <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                <div className="space-y-2">
                  {/* User row */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${getAvatarGradient(
                          s.igUsername
                        )} text-[11px] font-bold text-white shadow-2xs`}
                      >
                        {s.igUsername.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-xs font-bold text-slate-900 truncate">
                        @{s.igUsername}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400 shrink-0">
                      {formatDate(s.createdAt)}
                    </span>
                  </div>

                  {/* Caption quote */}
                  {s.caption ? (
                    <div className="rounded-xl bg-slate-50 border border-slate-100 p-2.5">
                      <p className="text-xs text-slate-700 line-clamp-2 italic leading-relaxed">
                        &ldquo;{s.caption}&rdquo;
                      </p>
                    </div>
                  ) : (
                    <div className="rounded-xl bg-slate-50/50 border border-dashed border-slate-200/80 p-2">
                      <p className="text-[11px] text-slate-400 italic">
                        No custom caption (standard brand shoutout will be used).
                      </p>
                    </div>
                  )}

                  {/* Status Notes & Live Links */}
                  {s.status === "published" && (
                    <div className="space-y-1.5 pt-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500 font-medium flex items-center gap-1">
                          <SendOutlined className="text-indigo-500 text-[11px]" />
                          <span>DM Status:</span>
                        </span>
                        {s.dmStatus === "sent" ? (
                          <span className="font-semibold text-emerald-600 flex items-center gap-1">
                            <CheckCircleOutlined className="text-xs" /> Thank-you sent
                          </span>
                        ) : s.dmStatus === "waiting" ? (
                          <span className="font-semibold text-amber-600 flex items-center gap-1">
                            <ClockCircleOutlined className="text-xs" /> Waiting for reply
                          </span>
                        ) : (
                          <span className="font-semibold text-rose-600">Failed</span>
                        )}
                      </div>

                      {s.permalink && (
                        <a
                          href={s.permalink}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center justify-center gap-1.5 w-full py-1.5 rounded-lg bg-pink-50/60 border border-pink-100 text-pink-700 hover:bg-pink-100/70 text-xs font-semibold transition-colors"
                        >
                          <InstagramOutlined className="text-pink-600" />
                          <span>View Live Post on Instagram ↗</span>
                        </a>
                      )}
                    </div>
                  )}

                  {s.error && (
                    <div className="rounded-xl bg-rose-50 border border-rose-100 p-2.5 text-xs text-rose-700 flex items-start gap-1.5">
                      <ExclamationCircleOutlined className="text-rose-500 mt-0.5 shrink-0" />
                      <span className="line-clamp-2 leading-tight">{s.error}</span>
                    </div>
                  )}

                  {s.note && (
                    <div className="rounded-xl bg-amber-50 border border-amber-100 p-2 text-xs text-amber-800">
                      {s.note}
                    </div>
                  )}
                </div>

                {/* Card Action Buttons */}
                <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
                  {(s.status === "pending" || s.status === "failed") && (
                    <Button
                      type="primary"
                      icon={<InstagramOutlined className="text-white" />}
                      loading={busyId === s.id}
                      onClick={() => openPublishReview(s)}
                      className="!flex-1 !h-8.5 !rounded-xl !bg-gradient-to-r !from-pink-600 !to-purple-600 hover:!opacity-95 font-semibold text-xs cursor-pointer !text-white shadow-2xs"
                    >
                      {busyId === s.id
                        ? "Publishing..."
                        : s.status === "failed"
                        ? "Retry / Review & Publish"
                        : "Review & Publish"}
                    </Button>
                  )}

                  {s.status === "published" && s.permalink && (
                    <Button
                      icon={<InstagramOutlined className="text-pink-600" />}
                      href={s.permalink}
                      target="_blank"
                      className="!flex-1 !h-8.5 !rounded-xl text-xs font-medium border-slate-200"
                    >
                      Open Post
                    </Button>
                  )}

                  {s.status !== "publishing" && (
                    <Popconfirm
                      title="Delete Customer Photo"
                      description={`Delete this submission from @${s.igUsername}? (Does not delete already published Instagram posts).`}
                      onConfirm={() => remove(s)}
                      okText="Delete"
                      okType="danger"
                      cancelText="Cancel"
                      disabled={busyId === s.id}
                    >
                      <Button
                        danger
                        icon={<DeleteOutlined />}
                        disabled={busyId === s.id}
                        className="!h-8.5 !w-8.5 !rounded-xl !border-slate-200 hover:!border-rose-300 text-xs shrink-0 cursor-pointer"
                        title="Delete submission"
                      />
                    </Popconfirm>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* ── LIST / TABLE VIEW ──────────────────────────────────────────── */}
      {!loading && viewMode === "list" && filteredItems.length > 0 && (
        <div className="rounded-2xl border border-slate-200/80 bg-white overflow-hidden shadow-xs divide-y divide-slate-100">
          {filteredItems.map((s) => (
            <div
              key={s.id}
              className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors"
            >
              {/* Left: Thumbnail & Info */}
              <div className="flex items-center gap-3.5 min-w-0">
                <div
                  className="relative h-18 w-18 shrink-0 rounded-xl overflow-hidden bg-slate-900 border border-slate-200 cursor-pointer group"
                  onClick={() => setPreviewItem(s)}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`${API_BASE}/media/${s.imageFile}`}
                    alt={`Photo from @${s.igUsername}`}
                    className="h-full w-full object-cover group-hover:scale-105 transition-transform"
                  />
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                    <EyeOutlined className="text-xs" />
                  </div>
                </div>

                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <a
                      href={`https://instagram.com/${s.igUsername}`}
                      target="_blank"
                      rel="noreferrer"
                      className="font-bold text-sm text-slate-900 hover:text-blue-600 transition-colors flex items-center gap-1"
                    >
                      <InstagramOutlined className="text-pink-500" />
                      <span>@{s.igUsername}</span>
                    </a>
                    {s.status === "pending" && (
                      <Tag color="gold" className="!rounded-full !text-[11px] font-semibold">
                        Pending Review
                      </Tag>
                    )}
                    {s.status === "published" && (
                      <Tag color="green" className="!rounded-full !text-[11px] font-semibold">
                        Live on Feed
                      </Tag>
                    )}
                    {s.status === "publishing" && (
                      <Tag color="blue" className="!rounded-full !text-[11px] font-semibold animate-pulse">
                        Publishing...
                      </Tag>
                    )}
                    {s.status === "failed" && (
                      <Tag color="red" className="!rounded-full !text-[11px] font-semibold">
                        Failed
                      </Tag>
                    )}
                    <span className="text-xs text-slate-400">
                      {formatDate(s.createdAt)}
                    </span>
                  </div>

                  {s.caption ? (
                    <p className="text-xs text-slate-600 line-clamp-1 italic max-w-xl">
                      &ldquo;{s.caption}&rdquo;
                    </p>
                  ) : (
                    <p className="text-xs text-slate-400 italic">No custom caption</p>
                  )}

                  {s.status === "published" && s.permalink && (
                    <div className="flex items-center gap-3 text-xs">
                      <a
                        href={s.permalink}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 hover:underline font-medium flex items-center gap-1"
                      >
                        <InstagramOutlined className="text-xs" />
                        <span>View post</span>
                      </a>
                      <span className="text-slate-300">·</span>
                      <span className="text-slate-500 font-medium">
                        DM Status:{" "}
                        <strong className={s.dmStatus === "sent" ? "text-emerald-600" : "text-amber-600"}>
                          {s.dmStatus === "sent" ? "Thank-you sent" : "Waiting for DM"}
                        </strong>
                      </span>
                    </div>
                  )}

                  {s.error && <p className="text-xs text-rose-600">{s.error}</p>}
                </div>
              </div>

              {/* Right: Actions */}
              <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                {(s.status === "pending" || s.status === "failed") && (
                  <Button
                    type="primary"
                    icon={<InstagramOutlined />}
                    loading={busyId === s.id}
                    onClick={() => openPublishReview(s)}
                    className="!h-8.5 !rounded-xl !bg-gradient-to-r !from-pink-600 !to-purple-600 hover:!opacity-95 font-semibold text-xs !text-white shadow-2xs"
                  >
                    {s.status === "failed" ? "Retry / Review" : "Review & Publish"}
                  </Button>
                )}

                {s.status !== "publishing" && (
                  <Popconfirm
                    title="Delete Submission"
                    description="Are you sure you want to delete this customer submission?"
                    onConfirm={() => remove(s)}
                    okText="Delete"
                    okType="danger"
                    cancelText="Cancel"
                    disabled={busyId === s.id}
                  >
                    <Button
                      danger
                      icon={<DeleteOutlined />}
                      disabled={busyId === s.id}
                      className="!h-8.5 !rounded-xl text-xs"
                    >
                      Delete
                    </Button>
                  </Popconfirm>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── MODAL 1: Upload Customer Photo Manually ────────────────────── */}
      <Modal
        title={
          <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <UploadOutlined className="text-base" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 leading-none">Upload Customer Photo</h3>
              <p className="text-xs text-slate-500 mt-1 font-normal">
                Add user-generated content to the review queue for one-click publishing and customer tagging.
              </p>
            </div>
          </div>
        }
        open={uploadModalOpen}
        onCancel={() => {
          if (!uploading) {
            resetUploadForm();
            setUploadModalOpen(false);
          }
        }}
        footer={null}
        width={540}
        className="!rounded-2xl"
      >
        <form onSubmit={handleManualSubmit} className="space-y-4 pt-3">
          {/* Instagram Handle & Verified Profile Search */}
          <div ref={suggestionsRef} className="relative">
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-700">
                Customer Instagram Username <span className="text-rose-500">*</span>
              </label>
              {cleanUsername && (
                <span className="text-[11px] font-medium text-slate-400 tabular-nums">
                  {cleanUsername.length} / 30 chars
                </span>
              )}
            </div>

            <Space.Compact block className="w-full">
              <Button disabled className="!bg-slate-100 !text-slate-600 !border-slate-200 !font-bold !cursor-default select-none !rounded-l-xl">
                @
              </Button>
              <Input
                placeholder="Type handle or search verified customer (e.g. vivek)..."
                value={usernameInput}
                onChange={(e) => {
                  const val = e.target.value.toLowerCase().replace(/[^a-z0-9._]/g, "");
                  setUsernameInput(val);
                  setShowSuggestions(true);
                }}
                onFocus={() => {
                  if (cleanUsername) setShowSuggestions(true);
                }}
                required
                className="!rounded-r-xl"
              />
            </Space.Compact>

            {/* Live Profile Suggestions Dropdown */}
            {showSuggestions && cleanUsername && (
              <div className="absolute top-[68px] left-0 right-0 z-50 rounded-2xl border border-slate-200 bg-white shadow-xl overflow-hidden divide-y divide-slate-100 animate-page-entrance">
                <div className="px-3 py-2 bg-slate-50 text-[11px] font-semibold text-slate-500 flex items-center justify-between">
                  <span>Instagram Profile Matches</span>
                  {isSearchingUsers ? (
                    <span className="text-blue-600 animate-pulse flex items-center gap-1">
                      <ReloadOutlined className="animate-spin text-[10px]" />
                      <span>Searching...</span>
                    </span>
                  ) : (
                    <span>{userSuggestions.length} found</span>
                  )}
                </div>

                <div className="max-h-64 overflow-y-auto divide-y divide-slate-50">
                  {userSuggestions.map((user) => (
                    <button
                      key={user.username}
                      type="button"
                      onClick={() => {
                        setUsernameInput(user.username);
                        setSelectedProfileData(user);
                        setShowSuggestions(false);
                      }}
                      className="w-full px-3 py-2.5 flex items-center justify-between hover:bg-blue-50/70 transition-colors text-left cursor-pointer group"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="relative h-8 w-8 shrink-0 rounded-full overflow-hidden ring-1 ring-slate-200/80 shadow-2xs">
                          <div
                            className={`absolute inset-0 flex items-center justify-center bg-gradient-to-br ${getAvatarGradient(
                              user.username
                            )} text-xs font-bold text-white`}
                          >
                            {user.username.charAt(0).toUpperCase()}
                          </div>
                          {user.profilePictureUrl && (
                            <img
                              src={user.profilePictureUrl}
                              alt={user.username}
                              referrerPolicy="no-referrer"
                              className="relative h-full w-full object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = "none";
                              }}
                            />
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs font-bold text-slate-900 group-hover:text-blue-600 truncate">
                              {user.displayName || `@${user.username}`}
                            </span>
                            {user.isKnownCustomer ? (
                              <Tag color="green" className="!rounded-full !text-[10px] !px-1.5 !py-0 !m-0 font-medium">
                                Verified Customer
                              </Tag>
                            ) : (
                              <Tag color="purple" className="!rounded-full !text-[10px] !px-1.5 !py-0 !m-0 font-medium flex items-center gap-1">
                                <InstagramOutlined className="text-[10px]" />
                                <span>Real Profile</span>
                              </Tag>
                            )}
                          </div>
                          <div className="flex items-center gap-1 text-[10px] text-slate-400 truncate">
                            <span className="font-semibold text-slate-600">@{user.username}</span>
                            <span>·</span>
                            <span>
                              {user.isKnownCustomer
                                ? `${user.source} (${user.count || 1} interaction${(user.count || 1) > 1 ? "s" : ""})`
                                : "Live Instagram Result"}
                            </span>
                          </div>
                        </div>
                      </div>
                      <span className="text-[11px] font-semibold text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                        Select Profile →
                      </span>
                    </button>
                  ))}

                  {/* Option to confirm typed handle */}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedProfileData(null);
                      setShowSuggestions(false);
                    }}
                    className="w-full px-3 py-2 flex items-center justify-between hover:bg-slate-50 transition-colors text-left cursor-pointer text-xs"
                  >
                    <div className="flex items-center gap-2 text-slate-700 font-medium">
                      <InstagramOutlined className="text-pink-500 text-sm" />
                      <span>
                        Use <strong className="text-slate-900 font-bold">@{cleanUsername}</strong>
                      </span>
                      <span className="text-[11px] text-slate-400 font-normal">(Exact handle)</span>
                    </div>
                    <span className="text-[11px] font-medium text-slate-500">Confirm</span>
                  </button>
                </div>
              </div>
            )}

            {/* Verified Profile Card / Confirmation Box */}
            {cleanUsername && (
              <div className="mt-2.5 rounded-xl border border-slate-200/80 bg-slate-50/80 p-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="relative h-9 w-9 shrink-0 rounded-full overflow-hidden ring-2 ring-blue-500/20 shadow-xs">
                      <div
                        className={`absolute inset-0 flex items-center justify-center bg-gradient-to-br ${getAvatarGradient(
                          cleanUsername
                        )} text-xs font-bold text-white`}
                      >
                        {cleanUsername.charAt(0).toUpperCase()}
                      </div>
                      {selectedProfileData?.profilePictureUrl && selectedProfileData.username === cleanUsername && (
                        <img
                          src={selectedProfileData.profilePictureUrl}
                          alt={cleanUsername}
                          referrerPolicy="no-referrer"
                          className="relative h-full w-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                          }}
                        />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-bold text-slate-900 truncate">
                          {selectedProfileData && selectedProfileData.username === cleanUsername && selectedProfileData.displayName
                            ? selectedProfileData.displayName
                            : `@${cleanUsername}`}
                        </span>
                        <span className="text-[11px] font-medium text-slate-500">
                          (@{cleanUsername})
                        </span>
                        {isSelectedUserKnown ? (
                          <Tag color="green" className="!rounded-full font-semibold !text-[10px] !px-2 !m-0 flex items-center gap-1">
                            <CheckCircleFilled className="text-xs" />
                            <span>Verified Customer</span>
                          </Tag>
                        ) : isUsernameValidFormat ? (
                          <Tag color="purple" className="!rounded-full font-semibold !text-[10px] !px-2 !m-0 flex items-center gap-1">
                            <InstagramOutlined className="text-xs" />
                            <span>Real Instagram Profile</span>
                          </Tag>
                        ) : (
                          <Tag color="red" className="!rounded-full font-semibold !text-[10px] !px-2 !m-0">
                            Invalid Handle Format
                          </Tag>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {isSelectedUserKnown
                          ? "Customer confirmed in your interaction history. Tagging will credit their profile."
                          : isUsernameValidFormat
                          ? "Real profile confirmed on Instagram. Ready to tag on photo upon publishing."
                          : "Instagram usernames cannot end with a period or exceed 30 characters."}
                      </p>
                    </div>
                  </div>

                  {/* Direct Instagram Profile Link button */}
                  {isUsernameValidFormat && (
                    <a
                      href={`https://instagram.com/${cleanUsername}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-700 bg-white hover:bg-blue-50 px-2.5 py-1.5 rounded-lg border border-slate-200 hover:border-blue-300 shadow-2xs transition-all shrink-0 cursor-pointer"
                      title="Open and verify their Instagram profile in a new tab"
                    >
                      <EyeOutlined className="text-xs" />
                      <span>Verify on Instagram ↗</span>
                    </a>
                  )}
                </div>
              </div>
            )}

            {!cleanUsername && (
              <p className="text-[11px] text-slate-400 mt-1">
                The customer will be tagged on the Instagram photo and credited in the caption.
              </p>
            )}
          </div>

          {/* Photo Dropzone / Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Photo File <span className="text-rose-500">*</span>
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              required
              onChange={handleFileSelect}
              className="hidden"
              id="submission-photo-input"
            />

            {!filePreview ? (
              <label
                htmlFor="submission-photo-input"
                className="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-2xl p-6 bg-slate-50/70 hover:bg-blue-50/30 transition-all cursor-pointer text-center group"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-slate-400 group-hover:text-blue-600 shadow-xs mb-2 transition-colors">
                  <CameraOutlined className="text-2xl" />
                </div>
                <span className="text-xs font-bold text-slate-800">
                  Click to choose image or drag & drop here
                </span>
                <span className="text-[11px] text-slate-400 mt-1">
                  JPEG, PNG, WebP up to 8MB. Automatically scaled to Instagram feed aspect ratio.
                </span>
              </label>
            ) : (
              <div className="relative rounded-2xl border border-slate-200 overflow-hidden bg-slate-900 group">
                <div className="aspect-[4/3] w-full flex items-center justify-center bg-slate-950">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={filePreview}
                    alt="Preview"
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
                <div className="absolute top-2 right-2 flex items-center gap-1.5">
                  <label
                    htmlFor="submission-photo-input"
                    className="px-2.5 py-1 rounded-lg bg-black/60 hover:bg-black/80 text-white text-xs font-medium backdrop-blur-md cursor-pointer transition-colors"
                  >
                    Change Image
                  </label>
                </div>
                <div className="p-2.5 bg-slate-900 text-white text-[11px] flex items-center justify-between">
                  <span className="truncate max-w-[280px]">{selectedFile?.name}</span>
                  <span className="text-slate-400">
                    {selectedFile ? `${(selectedFile.size / 1024).toFixed(0)} KB` : ""}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Optional Caption */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-700">
                Customer Caption / Testimonial (Optional)
              </label>
              <span className="text-[11px] text-slate-400 tabular-nums">
                {captionInput.length} / 1500
              </span>
            </div>
            <Input.TextArea
              rows={3}
              placeholder="e.g. Absolutely loving my new handcrafted mug! Best coffee experience ever ☕"
              value={captionInput}
              onChange={(e) => setCaptionInput(e.target.value)}
              maxLength={1500}
              className="!rounded-xl text-xs"
            />
            <div className="mt-2 rounded-xl bg-slate-50 border border-slate-200/70 p-2.5 text-[11px] text-slate-500 leading-relaxed">
              <span className="font-semibold text-slate-700">Post Caption Preview: </span>
              {captionInput.trim() ? `"${captionInput.trim()}" ` : ""}
              <span className="text-blue-600 font-medium">
                Thank you @{usernameInput.trim() || "username"} for sharing this with us! 💛
              </span>
            </div>
          </div>

          {/* Modal Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <Button
              onClick={() => {
                resetUploadForm();
                setUploadModalOpen(false);
              }}
              disabled={uploading}
              className="!rounded-xl text-xs"
            >
              Cancel
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              icon={<UploadOutlined />}
              loading={uploading}
              disabled={!selectedFile || !usernameInput.trim()}
              className={`!rounded-xl font-semibold text-xs ${
                !selectedFile || !usernameInput.trim()
                  ? "!bg-slate-100 !text-slate-400 !border-slate-200 !cursor-not-allowed"
                  : "!bg-blue-600 !text-white hover:!bg-blue-700 !border-blue-600"
              }`}
            >
              {uploading ? "Uploading..." : "Add to Review Queue"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ── MODAL 2: Website Intake API Setup Guide ─────────────────────── */}
      <Modal
        title={
          <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <CodeOutlined className="text-base" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 leading-none">Website Intake API Integration</h3>
              <p className="text-xs text-slate-500 mt-1 font-normal">
                How to send customer photos directly from your website or store into this review queue.
              </p>
            </div>
          </div>
        }
        open={apiModalOpen}
        onCancel={() => setApiModalOpen(false)}
        footer={[
          <Button key="close" type="primary" onClick={() => setApiModalOpen(false)} className="!rounded-xl !bg-blue-600 text-xs">
            Done
          </Button>,
        ]}
        width={620}
        className="!rounded-2xl"
      >
        <div className="space-y-4 pt-3 text-xs text-slate-600 leading-relaxed">
          <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-3 flex items-start gap-2">
            <ThunderboltOutlined className="text-blue-600 mt-0.5 shrink-0" />
            <p>
              Your public website calls this endpoint when a customer submits their photo via your store or landing page. It is authenticated with your secret <code>SUBMISSIONS_API_KEY</code>.
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800">Endpoint & Authentication:</span>
              <span className="text-[11px] font-mono bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md">
                POST /public/submissions
              </span>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-900 text-slate-200 p-3 font-mono text-[11px] space-y-1">
              <div><span className="text-amber-400">Endpoint:</span> {API_BASE}/public/submissions</div>
              <div><span className="text-amber-400">Header:</span> x-api-key: &lt;YOUR_SUBMISSIONS_API_KEY&gt;</div>
              <div><span className="text-amber-400">Body:</span> multipart/form-data (image, username, caption)</div>
            </div>
          </div>

          {/* Snippet selector tabs */}
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800">Ready-to-Use Code Snippet:</span>
              <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg">
                <button
                  type="button"
                  onClick={() => setApiSnippetLang("js")}
                  className={`px-2 py-0.5 rounded-md text-[11px] font-semibold transition-colors cursor-pointer ${
                    apiSnippetLang === "js" ? "bg-white text-blue-600 shadow-2xs" : "text-slate-500"
                  }`}
                >
                  JavaScript (Fetch)
                </button>
                <button
                  type="button"
                  onClick={() => setApiSnippetLang("curl")}
                  className={`px-2 py-0.5 rounded-md text-[11px] font-semibold transition-colors cursor-pointer ${
                    apiSnippetLang === "curl" ? "bg-white text-blue-600 shadow-2xs" : "text-slate-500"
                  }`}
                >
                  cURL
                </button>
                <button
                  type="button"
                  onClick={() => setApiSnippetLang("html")}
                  className={`px-2 py-0.5 rounded-md text-[11px] font-semibold transition-colors cursor-pointer ${
                    apiSnippetLang === "html" ? "bg-white text-blue-600 shadow-2xs" : "text-slate-500"
                  }`}
                >
                  HTML Form
                </button>
              </div>
            </div>

            <div className="relative rounded-xl border border-slate-200 bg-slate-950 p-3 text-slate-200 font-mono text-[11px] overflow-x-auto">
              <button
                type="button"
                onClick={() => {
                  const snippets: Record<string, string> = {
                    js: `// Frontend or Backend submission from your website
const formData = new FormData();
formData.append("username", "customer_ig_handle");
formData.append("image", fileInput.files[0]);
formData.append("caption", "Loved the product!");

const response = await fetch("${API_BASE}/public/submissions", {
  method: "POST",
  headers: {
    "x-api-key": "YOUR_SUBMISSIONS_API_KEY",
  },
  body: formData,
});
const data = await response.json();
console.log("Customer photo submitted:", data);`,
                    curl: `curl -X POST "${API_BASE}/public/submissions" \\
  -H "x-api-key: YOUR_SUBMISSIONS_API_KEY" \\
  -F "username=customer_ig_handle" \\
  -F "image=@/path/to/customer_photo.jpg" \\
  -F "caption=Loved the product!"`,
                    html: `<!-- Simple customer intake form on your website -->
<form action="${API_BASE}/public/submissions" method="POST" enctype="multipart/form-data">
  <input type="text" name="username" placeholder="@your_instagram" required />
  <input type="file" name="image" accept="image/*" required />
  <textarea name="caption" placeholder="Tell us what you thought!"></textarea>
  <button type="submit">Submit Photo</button>
</form>`,
                  };
                  copySnippet(snippets[apiSnippetLang]);
                }}
                className="absolute top-2.5 right-2.5 flex items-center gap-1 px-2 py-1 rounded-md bg-white/10 hover:bg-white/20 text-white text-[10px] font-sans font-semibold transition-colors cursor-pointer"
              >
                {copiedSnippet ? <CheckOutlined className="text-emerald-400" /> : <CopyOutlined />}
                <span>{copiedSnippet ? "Copied" : "Copy"}</span>
              </button>

              <pre className="text-slate-300 leading-relaxed overflow-x-auto pr-16">
                {apiSnippetLang === "js" &&
                  `// Frontend or Backend submission from your website
const formData = new FormData();
formData.append("username", "customer_ig_handle");
formData.append("image", fileInput.files[0]);
formData.append("caption", "Loved the product!");

const response = await fetch("${API_BASE}/public/submissions", {
  method: "POST",
  headers: {
    "x-api-key": "YOUR_SUBMISSIONS_API_KEY",
  },
  body: formData,
});
const data = await response.json();
console.log("Customer photo submitted:", data);`}
                {apiSnippetLang === "curl" &&
                  `curl -X POST "${API_BASE}/public/submissions" \\
  -H "x-api-key: YOUR_SUBMISSIONS_API_KEY" \\
  -F "username=customer_ig_handle" \\
  -F "image=@/path/to/customer_photo.jpg" \\
  -F "caption=Loved the product!"`}
                {apiSnippetLang === "html" &&
                  `<!-- Simple customer intake form on your website -->
<form action="${API_BASE}/public/submissions" method="POST" enctype="multipart/form-data">
  <input type="text" name="username" placeholder="@your_instagram" required />
  <input type="file" name="image" accept="image/*" required />
  <textarea name="caption" placeholder="Tell us what you thought!"></textarea>
  <button type="submit">Submit Photo</button>
</form>`}
              </pre>
            </div>
          </div>
        </div>
      </Modal>

      <Modal
        open={Boolean(previewItem)}
        onCancel={() => setPreviewItem(null)}
        footer={null}
        width={modalPreviewMode === "mobile" ? 580 : 700}
        className="!rounded-2xl"
        centered
      >
        {previewItem && (
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between gap-3 pr-7">
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${getAvatarGradient(
                    previewItem.igUsername
                  )} text-xs font-bold text-white shadow-2xs`}
                >
                  {previewItem.igUsername.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <a
                    href={`https://instagram.com/${previewItem.igUsername}`}
                    target="_blank"
                    rel="noreferrer"
                    className="font-bold text-slate-900 hover:text-blue-600 flex items-center gap-1 text-sm truncate"
                  >
                    <InstagramOutlined className="text-pink-500 shrink-0" />
                    <span className="truncate">@{previewItem.igUsername}</span>
                  </a>
                  <span className="text-[11px] text-slate-400 whitespace-nowrap block">
                    Submitted on {formatDate(previewItem.createdAt)}
                  </span>
                </div>
              </div>

              {/* View Mode Switcher */}
              <div className="flex items-center gap-2 shrink-0">
                <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200/80">
                  <button
                    type="button"
                    onClick={() => setModalPreviewMode("mobile")}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      modalPreviewMode === "mobile"
                        ? "bg-white text-blue-600 shadow-2xs"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    <MobileOutlined />
                    <span>Mobile</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setModalPreviewMode("standard")}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      modalPreviewMode === "standard"
                        ? "bg-white text-blue-600 shadow-2xs"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    <PictureOutlined />
                    <span>Photo</span>
                  </button>
                </div>

                <Tag
                  color={
                    previewItem.status === "published"
                      ? "green"
                      : previewItem.status === "pending"
                      ? "gold"
                      : "red"
                  }
                  className="!rounded-full font-semibold text-xs capitalize !m-0"
                >
                  {previewItem.status}
                </Tag>
              </div>
            </div>

            {/* Display Viewport */}
            {modalPreviewMode === "mobile" ? (
              <div className="flex justify-center py-1">
                <MobilePreview width={340} title="Feed Mockup" showToolbar={true}>
                  <div className="bg-white flex flex-col text-slate-900">
                    {/* IG Post Header with Real Brand Profile */}
                    <div className="flex items-center justify-between p-2.5 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full p-[1.5px] bg-gradient-to-tr from-amber-400 via-rose-500 to-purple-600 shrink-0">
                          <div className="h-full w-full rounded-full overflow-hidden bg-white flex items-center justify-center relative">
                            {!brandAvatarError ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={
                                  brandProfile.profilePictureUrl?.startsWith("/media/")
                                    ? `${API_BASE}${brandProfile.profilePictureUrl}`
                                    : brandProfile.profilePictureUrl || "/brand-avatar.jpg"
                                }
                                alt=""
                                referrerPolicy="no-referrer"
                                onError={(e) => {
                                  const img = e.currentTarget;
                                  if (!img.src.includes("brand-avatar.jpg")) {
                                    img.src = "/brand-avatar.jpg";
                                  } else {
                                    setBrandAvatarError(true);
                                  }
                                }}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="h-full w-full bg-gradient-to-tr from-amber-500 to-rose-500 flex items-center justify-center text-white text-[11px] font-bold">
                                {brandProfile.username.charAt(0).toUpperCase()}
                              </div>
                            )}
                          </div>
                        </div>
                        <div>
                          <div className="flex items-center gap-1">
                            <span className="font-bold text-xs text-slate-900 leading-tight">
                              {brandProfile.username}
                            </span>
                            {/* Instagram Verified Badge */}
                            <svg className="w-3 h-3 text-blue-500 fill-current inline-block shrink-0" viewBox="0 0 24 24">
                              <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm-1.8 14.5l-4-4 1.4-1.4 2.6 2.6 6.6-6.6 1.4 1.4-8 8z" />
                            </svg>
                          </div>
                          <div className="text-[10px] text-slate-500 leading-tight">
                            Fabroniee Men&apos;s Fashion
                          </div>
                        </div>
                      </div>
                      <span className="text-slate-400 text-xs font-bold leading-none cursor-pointer">•••</span>
                    </div>

                    {/* Photo Container with Customer Tag Badge */}
                    <div className="relative aspect-square w-full bg-black overflow-hidden flex items-center justify-center">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={`${API_BASE}/media/${previewItem.imageFile}`}
                        alt={`Photo featuring @${previewItem.igUsername}`}
                        className="w-full h-full object-cover"
                      />

                      {/* Customer Photo Tag Badge */}
                      <div className="absolute bottom-2.5 left-2.5 flex items-center gap-1 px-2 py-1 rounded-md bg-black/75 backdrop-blur-md text-white text-[10px] font-semibold shadow-md pointer-events-none">
                        <UserOutlined className="text-[9px]" />
                        <span>@{previewItem.igUsername}</span>
                      </div>
                    </div>

                    {/* IG Engagement Action Bar */}
                    <div className="p-2.5 space-y-1.5">
                      <div className="flex items-center justify-between text-base text-slate-800">
                        <div className="flex items-center gap-3.5">
                          <HeartOutlined className="hover:text-rose-500 cursor-pointer transition-colors" />
                          <MessageOutlined className="hover:text-blue-500 cursor-pointer transition-colors" />
                          <SendOutlined className="hover:text-indigo-500 cursor-pointer transition-colors" />
                        </div>
                        {/* Bookmark SVG */}
                        <svg className="w-4 h-4 text-slate-700 hover:text-slate-900 cursor-pointer" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                        </svg>
                      </div>

                      {/* Real Social Proof Likes */}
                      <div className="text-[11px] text-slate-900 font-semibold flex items-center gap-1">
                        <span>Liked by</span>
                        <span className="font-bold text-slate-900 hover:underline cursor-pointer">
                          {previewItem.igUsername}
                        </span>
                        <span>and</span>
                        <span className="font-bold text-slate-900 hover:underline cursor-pointer">
                          others
                        </span>
                      </div>

                      {/* Real IG Caption */}
                      <div className="text-[11px] text-slate-800 leading-snug space-y-1">
                        <div>
                          <span className="font-bold text-slate-900 mr-1.5">{brandProfile.username}</span>
                          <span>
                            Thank you <span className="font-semibold text-blue-600">@{previewItem.igUsername}</span> for sharing this with us! 💛
                          </span>
                        </div>

                        {previewItem.caption && (
                          <div className="text-slate-600 italic text-[10.5px] pl-2 border-l-2 border-slate-200">
                            &ldquo;{previewItem.caption}&rdquo;
                          </div>
                        )}

                        <div className="text-[10px] text-slate-400">
                          Photo credit: <span className="font-medium text-slate-600">@{previewItem.igUsername}</span>
                        </div>
                      </div>

                      <div className="text-[10px] text-slate-400 font-medium cursor-pointer hover:text-slate-600 pt-0.5">
                        View all comments
                      </div>

                      <div className="text-[9px] text-slate-400 uppercase tracking-wider pt-0.5">
                        {previewItem.publishedAt
                          ? formatDate(previewItem.publishedAt)
                          : formatDate(previewItem.createdAt)}
                      </div>
                    </div>
                  </div>
                </MobilePreview>
              </div>
            ) : (
              <div className="rounded-2xl overflow-hidden bg-slate-950 flex items-center justify-center max-h-[70vh]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`${API_BASE}/media/${previewItem.imageFile}`}
                  alt={`Photo from @${previewItem.igUsername}`}
                  className="max-h-[70vh] w-auto object-contain"
                />
              </div>
            )}

            {previewItem.caption && (
              <div className="rounded-xl bg-slate-50 border border-slate-100 p-3">
                <p className="text-xs text-slate-700 italic">
                  &ldquo;{previewItem.caption}&rdquo;
                </p>
              </div>
            )}

            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <div className="text-xs text-slate-500">
                {previewItem.status === "published" && previewItem.permalink ? (
                  <a
                    href={previewItem.permalink}
                    target="_blank"
                    rel="noreferrer"
                    className="text-pink-600 hover:underline font-semibold flex items-center gap-1"
                  >
                    <InstagramOutlined /> View Live Post on Instagram ↗
                  </a>
                ) : (
                  <span>Ready to publish to Instagram</span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {(previewItem.status === "pending" || previewItem.status === "failed") && (
                  <Button
                    type="primary"
                    icon={<InstagramOutlined />}
                    loading={busyId === previewItem.id}
                    onClick={() => openPublishReview(previewItem)}
                    className="!rounded-xl !bg-gradient-to-r !from-pink-600 !to-purple-600 font-semibold text-xs !text-white shadow-2xs"
                  >
                    Review & Publish Live
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Pre-Publish Instagram Split Publishing Studio Modal */}
      <Modal
        open={reviewModalOpen}
        onCancel={() => {
          if (!publishingLive) {
            setReviewModalOpen(false);
            setReviewSubmission(null);
            setAiCaptionSuggestions(null);
          }
        }}
        footer={null}
        width={920}
        centered
        className="!p-0 overflow-hidden"
      >
        {reviewSubmission && (
          <div className="p-5 sm:p-6 space-y-4">
            {/* Studio Header Bar */}
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-white shadow-xs">
                  <InstagramOutlined className="text-base text-pink-400" />
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-tight">
                      Instagram Publishing Studio
                    </h3>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
                      <RobotOutlined className="text-[10px]" /> AI Growth Copilot
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Live Instagram feed simulation & growth copy engine
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono font-semibold px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100">
                  {growthAudit.score}% Growth Ready
                </span>
              </div>
            </div>

            {/* 2-Column Studio Grid: Left Live Preview + Right Growth Composer */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">

              {/* LEFT COLUMN (5 Cols): Live Instagram Feed Post Mockup */}
              <div className="lg:col-span-5 rounded-2xl border border-slate-200/80 bg-slate-50/70 p-3.5 shadow-2xs space-y-3">
                <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-slate-400 px-1">
                  <span>Live Feed Simulation</span>
                  <span className="text-slate-400 font-normal">Real-time</span>
                </div>

                {/* Instagram Native Feed Post Card Mockup */}
                <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-xs">
                  {/* Post Header */}
                  <div className="p-3 flex items-center justify-between border-b border-slate-50">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="h-7 w-7 rounded-full overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={brandProfile.profilePictureUrl || "/brand-avatar.jpg"}
                          alt="Brand avatar"
                          className="h-full w-full object-cover"
                          onError={(e) => { (e.target as HTMLImageElement).src = "/brand-avatar.jpg"; }}
                        />
                      </div>
                      <div className="min-w-0 leading-tight">
                        <span className="text-xs font-bold text-slate-900 block truncate">
                          {brandProfile.username || "fabroniee"}
                        </span>
                        <span className="text-[10px] text-slate-400 block truncate">
                          Customer Spotlight • Original Audio
                        </span>
                      </div>
                    </div>
                    <span className="text-slate-400 text-xs px-1">•••</span>
                  </div>

                  {/* Post Image Container with Customer Tag Chip */}
                  <div className="relative aspect-[4/5] bg-slate-950 overflow-hidden flex items-center justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`${API_BASE}/media/${reviewSubmission.imageFile}`}
                      alt="Live post preview"
                      className="w-full h-full object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).src = "/brand-avatar.jpg"; }}
                    />
                    {/* Customer Tag Floating Pill */}
                    <div className="absolute bottom-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900/80 backdrop-blur-md text-white text-[11px] font-semibold shadow-md border border-white/10">
                      <span>👤</span>
                      <span>@{reviewSubmission.igUsername}</span>
                    </div>
                  </div>

                  {/* Interaction Bar */}
                  <div className="p-3 space-y-2">
                    <div className="flex items-center justify-between text-slate-700">
                      <div className="flex items-center gap-3.5 text-base">
                        <HeartOutlined className="hover:text-red-500 cursor-pointer transition-colors" />
                        <MessageOutlined className="hover:text-slate-900 cursor-pointer transition-colors" />
                        <SendOutlined className="hover:text-slate-900 cursor-pointer transition-colors -rotate-45 -mt-1" />
                      </div>
                      <span className="text-xs font-mono text-slate-400">Save</span>
                    </div>

                    {/* Live Caption Text */}
                    <div className="text-[11px] leading-relaxed text-slate-800 space-y-1">
                      <p className="line-clamp-4">
                        <span className="font-bold mr-1.5 text-slate-900">
                          {brandProfile.username || "fabroniee"}
                        </span>
                        <span className="whitespace-pre-line text-slate-700">
                          {reviewCaption || "No caption yet..."}
                        </span>
                      </p>
                      <span className="text-[10px] text-slate-400 block pt-0.5">
                        Just now • Live Instagram Sync
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN (7 Cols): Studio Controls, AI Angles & Composer */}
              <div className="lg:col-span-7 space-y-3.5">

                {/* AI Growth Copilot Switcher */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-800">
                        AI Copy Angles
                      </span>
                      {aiCaptionSuggestions && (
                        <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-100">
                          Ready
                        </span>
                      )}
                    </div>
                    <Button
                      type="text"
                      size="small"
                      loading={aiGeneratingCaption}
                      onClick={generateAiCaptions}
                      icon={<ThunderboltOutlined className="text-indigo-600 text-xs" />}
                      className="!text-xs !font-semibold !text-indigo-600 hover:!text-indigo-700 !h-6 !px-1.5 cursor-pointer"
                    >
                      {aiCaptionSuggestions ? "Regenerate AI" : "Generate 3 AI Angles"}
                    </Button>
                  </div>

                  {aiCaptionSuggestions ? (
                    <Segmented
                      block
                      value={activeAiAngle}
                      onChange={(val) => {
                        const key = val as "leadMagnet" | "viralExplore" | "communitySpark";
                        setActiveAiAngle(key);
                        if (aiCaptionSuggestions?.[key]) {
                          setReviewCaption(aiCaptionSuggestions[key]);
                        }
                      }}
                      options={[
                        {
                          label: (
                            <div className="flex items-center justify-center gap-1.5 py-0.5 text-xs font-semibold">
                              <span>🎯 Lead Engine</span>
                            </div>
                          ),
                          value: "leadMagnet",
                        },
                        {
                          label: (
                            <div className="flex items-center justify-center gap-1.5 py-0.5 text-xs font-semibold">
                              <span>🚀 Viral Explore</span>
                            </div>
                          ),
                          value: "viralExplore",
                        },
                        {
                          label: (
                            <div className="flex items-center justify-center gap-1.5 py-0.5 text-xs font-semibold">
                              <span>💛 Social Proof</span>
                            </div>
                          ),
                          value: "communitySpark",
                        },
                      ]}
                      className="!bg-slate-100 !p-1 !rounded-xl"
                    />
                  ) : (
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70 flex items-center justify-between text-[11px] text-slate-500">
                      <span>⚡ Generate tailored hooks for comment-to-DM triggers and Explore saves.</span>
                      <button
                        type="button"
                        onClick={generateAiCaptions}
                        disabled={aiGeneratingCaption}
                        className="text-indigo-600 hover:text-indigo-700 font-semibold cursor-pointer shrink-0 ml-2"
                      >
                        Generate →
                      </button>
                    </div>
                  )}
                </div>

                {/* Unified Modern Caption Composer Card */}
                <div className="rounded-xl border border-slate-200 bg-white shadow-2xs overflow-hidden focus-within:border-slate-400 transition-colors">
                  <div className="flex items-center justify-between px-3.5 py-2 border-b border-slate-100 bg-slate-50/50">
                    <span className="text-xs font-bold text-slate-700">
                      Post Caption
                    </span>
                    <span className={`text-[11px] font-mono ${
                      growthAudit.length > 2200 ? "text-rose-600 font-bold" : "text-slate-400"
                    }`}>
                      {growthAudit.length} / 2,200
                    </span>
                  </div>

                  <Input.TextArea
                    value={reviewCaption}
                    onChange={(e) => setReviewCaption(e.target.value)}
                    rows={6}
                    placeholder="Write or refine your caption..."
                    className="!border-0 !shadow-none !p-3.5 !text-xs sm:!text-[13px] text-slate-800 leading-relaxed font-normal focus:!ring-0 resize-none"
                  />

                  {/* Levers & Quick Actions Toolbar */}
                  <div className="px-3.5 py-2 border-t border-slate-100 bg-slate-50/40 flex flex-wrap items-center justify-between gap-1.5">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          const trigger = '\n\n👇 Comment "LINK" below for direct shopping details in your DMs!';
                          if (!reviewCaption.includes("LINK")) {
                            setReviewCaption((prev) => (prev ? `${prev.trim()}${trigger}` : trigger.trim()));
                          }
                        }}
                        className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 transition-colors cursor-pointer"
                      >
                        + "LINK" Trigger
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          const save = '\n\n📌 Save this fit inspiration for your next event!';
                          if (!reviewCaption.includes("Save this")) {
                            setReviewCaption((prev) => (prev ? `${prev.trim()}${save}` : save.trim()));
                          }
                        }}
                        className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 transition-colors cursor-pointer"
                      >
                        + Save Hook
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          const ask = '\n\nWhat do you think of this look? Drop your thoughts below 👇';
                          if (!reviewCaption.includes("thoughts below")) {
                            setReviewCaption((prev) => (prev ? `${prev.trim()}${ask}` : ask.trim()));
                          }
                        }}
                        className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 transition-colors cursor-pointer"
                      >
                        + Question
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          const shoutout = `Thank you @${reviewSubmission.igUsername} for sharing this with us! 💛`;
                          setReviewCaption(shoutout);
                        }}
                        className="text-[11px] font-medium px-1.5 py-0.5 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                      >
                        Reset
                      </button>
                    </div>
                  </div>
                </div>

                {/* Live Real Analysis Checklist */}
                <div className="flex items-center justify-between text-[11px] text-slate-500 px-1 pt-0.5">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <span className={`h-1.5 w-1.5 rounded-full ${growthAudit.hasUserTag ? "bg-emerald-500" : "bg-slate-300"}`} />
                      <span className="font-medium text-slate-600">Creator Tag</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <span className={`h-1.5 w-1.5 rounded-full ${growthAudit.hasCta ? "bg-emerald-500" : "bg-slate-300"}`} />
                      <span className="font-medium text-slate-600">DM Trigger</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <span className={`h-1.5 w-1.5 rounded-full ${growthAudit.hasSave ? "bg-emerald-500" : "bg-slate-300"}`} />
                      <span className="font-medium text-slate-600">Save Hook</span>
                    </span>
                  </div>
                  <span className="text-slate-400 text-[10px]">Meta Content API</span>
                </div>

                {/* Actions Footer */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                  <span className="text-[11px] text-slate-400 truncate">
                    Post publishes live to connected Instagram account.
                  </span>

                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      disabled={publishingLive}
                      onClick={() => {
                        setReviewModalOpen(false);
                        setReviewSubmission(null);
                        setAiCaptionSuggestions(null);
                      }}
                      className="!rounded-xl !h-8.5 text-xs !border-slate-200 text-slate-600 hover:text-slate-900 cursor-pointer"
                    >
                      Cancel
                    </Button>

                    <Button
                      type="primary"
                      loading={publishingLive}
                      disabled={growthAudit.length > 2200}
                      onClick={confirmPublish}
                      icon={<InstagramOutlined />}
                      className="!rounded-xl !h-8.5 !px-4.5 !bg-slate-900 hover:!bg-slate-800 !text-white text-xs font-semibold cursor-pointer shadow-xs"
                    >
                      {publishingLive ? "Publishing..." : "Publish Live to Instagram"}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

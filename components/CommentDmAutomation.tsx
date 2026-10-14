"use client";

import { useEffect, useState, useCallback } from "react";
import { Modal, Tooltip } from "antd";
import { api } from "@/lib/api";
import {
  ArrowLeftIcon,
  BoltIcon,
  GearIcon,
  InstagramIcon,
  SendIcon,
  TrashIcon,
  InfoIcon,
  PhotoIcon,
  MessageTextIcon,
  MessageButtonsIcon,
  ShoppingBagIcon,
  FileDownloadIcon,
  MediaCardIcon,
  GlobeIcon,
  TagIcon,
  LinkIcon,
  CameraIcon,
  MicrophoneIcon,
  PhoneIcon,
  VideoCameraIcon,
  SparklesIcon,
  UserIcon,
  MessageSquareIcon,
  CheckCircleIcon,
  HeartIcon,
  CommentIcon,
  RefreshIcon,
  PlayIcon,
  ExternalLinkIcon,
} from "./icons";
import { MobilePreview, SupportedDevice } from "./MobilePreview";
import { CloudinaryImageUploader } from "./CloudinaryImageUploader";

export type MessageButton = {
  type: "web_url" | "postback";
  title: string;
  url?: string;
  payload?: string;
};

type Rule = {
  id: string;
  name: string;
  enabled: boolean;
  keywords: string;
  mediaId: string | null;
  mediaPermalink: string | null;
  mediaThumb: string | null;
  dmText: string;
  requireFollow: boolean;
  followGateText: string;
  templateType?: "text" | "button" | "product" | "file" | "card";
  cardTitle?: string | null;
  cardSubtitle?: string | null;
  cardImageUrl?: string | null;
  cardFileUrl?: string | null;
  cardButtons?: MessageButton[] | null;
  enabledAt: string | null;
  createdAt: string;
};
type Post = { mediaId: string; permalink: string | null; thumb: string | null; caption: string; postedAt: string };

type LogEntry = {
  id: string;
  commentId: string;
  username: string;
  commentText: string | null;
  mediaThumb: string | null;
  mediaPermalink: string | null;
  matchedKeyword: string | null;
  triggeredAt: string;
  dmText: string | null;
  status: "sent" | "failed" | "invited" | "follow_gate" | "follow_verified";
  note: string | null;
  dmSentAt: string | null;
  followGateSentAt: string | null;
  pendingFollowGate: boolean;
  repliedAt: string | null;
};

const when = (iso: string) =>
  new Date(iso).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

function StatusBadge({ status }: { status: LogEntry["status"] }) {
  if (status === "sent" || status === "follow_verified")
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-500/20 dark:text-emerald-300">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
        DM Sent
      </span>
    );
  if (status === "follow_gate")
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[11px] font-semibold text-amber-700 ring-1 ring-inset ring-amber-500/20 dark:text-amber-300">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
        Follow Gate
      </span>
    );
  if (status === "invited")
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-2 py-0.5 text-[11px] font-semibold text-blue-700 ring-1 ring-inset ring-blue-500/20 dark:text-blue-300">
        <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
        Invited
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 px-2 py-0.5 text-[11px] font-semibold text-red-700 ring-1 ring-inset ring-red-500/20 dark:text-red-300">
      <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
      Failed
    </span>
  );
}

const card = "rounded-2xl border border-[var(--viz-border)] bg-[var(--viz-surface)] p-3.5 sm:p-5 shadow-sm w-full min-w-0";

type Props = { ruleId: string; onBack: () => void; onDeleted: () => void };

export function CommentDmAutomation({ ruleId, onBack, onDeleted }: Props) {
  const [rule, setRule] = useState<Rule | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedNote, setSavedNote] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Activity log
  const [logs, setLogs] = useState<LogEntry[] | null>(null);
  const [logsError, setLogsError] = useState<string | null>(null);
  const [logsLoading, setLogsLoading] = useState(false);

  // Draft fields, edited locally and pushed together by "Save Changes".
  const [name, setName] = useState("");
  const [editingName, setEditingName] = useState(false);
  const [keywordDraft, setKeywordDraft] = useState("");
  const [dmText, setDmText] = useState("");
  const [requireFollow, setRequireFollow] = useState(false);
  const [followGateText, setFollowGateText] = useState("");
  const [templateType, setTemplateType] = useState<"text" | "button" | "product" | "file" | "card">("text");
  const [cardTitle, setCardTitle] = useState("");
  const [cardSubtitle, setCardSubtitle] = useState("");
  const [cardImageUrl, setCardImageUrl] = useState("");
  const [cardFileUrl, setCardFileUrl] = useState("");
  const [cardButtons, setCardButtons] = useState<MessageButton[]>([]);
  const [previewDevice, setPreviewDevice] = useState<SupportedDevice>("iPhone 17");
  const [dirty, setDirty] = useState(false);

  const [keywordInput, setKeywordInput] = useState("");
  const [triggerMode, setTriggerMode] = useState<"any" | "keywords">("keywords");

  const [posts, setPosts] = useState<Post[] | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [postsError, setPostsError] = useState<string | null>(null);

  const basePath = `/comment-dm/automations/${ruleId}`;

  useEffect(() => {
    api<Rule>(basePath).then(
      (r) => {
        setRule(r);
        setName(r.name);
        setKeywordDraft(r.keywords);
        setTriggerMode(r.keywords && r.keywords.trim() ? "keywords" : "any");
        setDmText(r.dmText);
        setRequireFollow(r.requireFollow ?? false);
        setFollowGateText(r.followGateText ?? "");
        const inferredTemplate =
          r.templateType && r.templateType !== "text"
            ? r.templateType
            : r.cardTitle && r.cardButtons?.some((b) => b.title.toLowerCase().includes("shop") || b.title.includes("🛍️"))
              ? "product"
              : r.cardFileUrl || (r.cardButtons && r.cardButtons.some((b) => b.title.toLowerCase().includes("download") || b.title.includes("📥")))
                ? "file"
                : r.cardButtons && r.cardButtons.length > 0
                  ? "button"
                  : r.templateType || "text";
        setTemplateType(inferredTemplate);
        setCardTitle(r.cardTitle ?? "");
        setCardSubtitle(r.cardSubtitle ?? "");
        setCardImageUrl(r.cardImageUrl ?? "");
        setCardFileUrl(r.cardFileUrl ?? "");
        setCardButtons(r.cardButtons ?? []);
        if (r.mediaId) {
          api<Post[]>("/comment-dm/posts").then(setPosts).catch(() => {});
        }
      },
      (e: any) => {
        setError(e.message);
        if (e?.status === 404 || e?.message?.includes("404") || e?.message?.toLowerCase().includes("not found")) {
          onDeleted();
        }
      }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ruleId, onDeleted]);

  function addButton(preset?: Partial<MessageButton>) {
    if (cardButtons.length >= 3) return;
    setCardButtons((prev) => [
      ...prev,
      {
        type: preset?.type || "web_url",
        title: (preset?.title || "Click Here").slice(0, 20),
        url: preset?.url || "https://instagram.com",
        payload: preset?.payload || "ACTION",
      },
    ]);
    setDirty(true);
  }

  function updateButton(index: number, patch: Partial<MessageButton>) {
    setCardButtons((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], ...patch };
      if (copy[index].title.length > 20) {
        copy[index].title = copy[index].title.slice(0, 20);
      }
      return copy;
    });
    setDirty(true);
  }

  function removeButton(index: number) {
    setCardButtons((prev) => prev.filter((_, i) => i !== index));
    setDirty(true);
  }

  function selectTemplate(type: "text" | "button" | "product" | "file" | "card") {
    setTemplateType(type);
    setDirty(true);
    if (type === "product") {
      if (!cardTitle) setCardTitle("Featured Product");
      if (!cardSubtitle) setCardSubtitle("$29.99 • Special Offer");
      if (cardButtons.length === 0) {
        setCardButtons([{ type: "web_url", title: "Shop Now", url: cardFileUrl || "https://instagram.com" }]);
      }
    } else if (type === "file") {
      if (!cardTitle) setCardTitle("Free Resource Guide");
      if (!cardSubtitle) setCardSubtitle("Instant PDF Download");
      if (cardButtons.length === 0) {
        setCardButtons([{ type: "web_url", title: "Download PDF", url: cardFileUrl || "https://instagram.com" }]);
      }
    } else if (type === "button") {
      if (cardButtons.length === 0) {
        setCardButtons([{ type: "web_url", title: "Visit Website", url: "https://instagram.com" }]);
      }
    } else if (type === "card") {
      if (!cardTitle) setCardTitle("Special Offer");
      if (!cardSubtitle) setCardSubtitle("Tap below to learn more");
      if (cardButtons.length === 0) {
        setCardButtons([{ type: "web_url", title: "Learn More", url: "https://instagram.com" }]);
      }
    }
  }

  const refreshLogs = useCallback(async () => {
    setLogsLoading(true);
    setLogsError(null);
    try {
      const data = await api<LogEntry[]>(`${basePath}/logs`);
      setLogs(data);
    } catch (e: any) {
      if (e?.status === 404 || e?.message?.includes("404") || e?.message?.toLowerCase().includes("not found")) {
        onDeleted();
        return;
      }
      setLogsError((e as Error).message);
    } finally {
      setLogsLoading(false);
    }
  }, [basePath, onDeleted]);

  // Load logs once rule is ready; auto-refresh every 15 s.
  useEffect(() => {
    if (!rule) return;
    refreshLogs();
    const timer = setInterval(refreshLogs, 15_000);
    return () => clearInterval(timer);
  }, [rule, refreshLogs]);

  // Close post picker modal on Escape key
  useEffect(() => {
    if (!pickerOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPickerOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [pickerOpen]);

  const keywords = keywordDraft.split(",").map((k) => k.trim()).filter(Boolean);
  const removeKeyword = (k: string) => {
    setKeywordDraft(keywords.filter((x) => x !== k).join(", "));
    setDirty(true);
  };
  const addKeyword = (raw: string) => {
    const k = raw.trim();
    if (!k || keywords.includes(k)) return;
    setKeywordDraft([...keywords, k].join(", "));
    setDirty(true);
  };

  async function save() {
    if (!rule) return;
    setSaving(true);
    setError(null);
    const cleanedButtons = cardButtons.map((b) => {
      let url = (b.url || "").trim();
      if (b.type === "web_url") {
        if (!url || url === "https://" || url === "http://") {
          url = "https://instagram.com";
        } else if (!url.startsWith("http://") && !url.startsWith("https://")) {
          url = "https://" + url;
        }
      }
      return {
        ...b,
        title: (b.title || "Click Here").trim().slice(0, 20),
        url,
      };
    });

    try {
      const updated = await api<Rule>(basePath, {
        method: "PUT",
        body: JSON.stringify({
          name: name.trim() || rule.name,
          keywords: keywordDraft,
          dmText,
          requireFollow,
          followGateText,
          templateType,
          cardTitle: templateType === "text" || templateType === "button" ? null : (cardTitle.trim() || null),
          cardSubtitle: templateType === "text" || templateType === "button" ? null : (cardSubtitle.trim() || null),
          cardImageUrl: templateType === "text" || templateType === "button" ? null : (cardImageUrl.trim() || null),
          cardFileUrl: templateType === "text" || templateType === "button" ? null : (cardFileUrl.trim() || null),
          cardButtons: templateType === "text" ? [] : cleanedButtons,
        }),
      });
      setRule(updated);
      setDirty(false);
      setEditingName(false);
      setSavedNote("Saved");
      setTimeout(() => setSavedNote(null), 2000);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive() {
    if (!rule) return;
    setError(null);
    try {
      const updated = await api<Rule>(basePath, { method: "PUT", body: JSON.stringify({ enabled: !rule.enabled }) });
      setRule(updated);
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function openPicker() {
    setPickerOpen(true);
    if (posts) return;
    try {
      setPosts(await api<Post[]>("/comment-dm/posts"));
    } catch (err) {
      setPostsError((err as Error).message);
    }
  }

  async function choosePost(p: Post) {
    if (!rule) return;
    setError(null);
    try {
      const updated = await api<Rule>(basePath, {
        method: "PUT",
        body: JSON.stringify({ mediaId: p.mediaId, mediaPermalink: p.permalink, mediaThumb: p.thumb }),
      });
      setRule(updated);
      setPickerOpen(false);
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function clearPost() {
    if (!rule) return;
    try {
      setRule(await api<Rule>(basePath, { method: "PUT", body: JSON.stringify({ mediaId: null, mediaPermalink: null, mediaThumb: null }) }));
      setPickerOpen(false);
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function removeAutomation() {
    if (!rule || !confirm(`Delete "${rule.name}"? Its past performance history is kept, but it will stop matching new comments.`)) return;
    setDeleting(true);
    setError(null);
    try {
      await api(basePath, { method: "DELETE" });
      onDeleted();
    } catch (err) {
      setError((err as Error).message);
      setDeleting(false);
    }
  }

  if (!rule) return <p className="text-sm opacity-70">{error ?? "Loading…"}</p>;

  const previewText = dmText.replaceAll("{username}", "there") || "Your message will appear here.";
  const gatePreviewText = followGateText.replaceAll("{username}", "there") || "Oh no! It seems you're not following me 👀\nVisit my profile and hit that follow button 😁.\nOnce you do, I'll send you what you asked for!";

  return (
    <div className="w-full max-w-full min-w-0 space-y-5 sm:space-y-6">
      {/* Top Navigation Row */}
      <div className="flex items-center justify-between gap-2">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 rounded-lg px-1 sm:px-2 py-1 text-xs sm:text-sm font-medium text-[var(--viz-ink-2)] hover:text-[var(--viz-ink)] hover:bg-black/[0.04] dark:hover:bg-white/[0.04] transition-colors"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          <span>All automations</span>
        </button>

        {/* Desktop Save & Actions (hidden on mobile) */}
        <div className="hidden sm:flex items-center gap-2">
          {savedNote && <span className="text-xs text-green-600 dark:text-green-400 font-medium">{savedNote}</span>}
          <button
            onClick={removeAutomation}
            disabled={deleting}
            title="Delete this automation"
            aria-label="Delete this automation"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--viz-border)] text-[var(--viz-ink-2)] transition-colors hover:bg-red-500/10 hover:text-red-600 hover:border-red-500/30 disabled:opacity-50"
          >
            <TrashIcon className="h-4 w-4" />
          </button>
          <button
            onClick={save}
            disabled={saving || !dirty}
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition-all shadow-xs ${
              dirty
                ? "bg-foreground text-background hover:opacity-90 active:scale-95"
                : "bg-black/[0.06] dark:bg-white/10 text-[var(--viz-muted)] cursor-not-allowed"
            }`}
          >
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </div>

      {error && <p role="alert" className="rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-xs sm:text-sm text-red-600">{error}</p>}

      {/* Header Card: Icon, editable name, status pill, mobile action bar */}
      <div className="rounded-2xl border border-[var(--viz-border)] bg-[var(--viz-surface)] p-3.5 sm:p-5 shadow-2xs">
        <div className="flex items-start gap-3 sm:gap-4">
          <span className="flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-xl bg-foreground text-background shadow-xs">
            <BoltIcon className="h-5 w-5 sm:h-6 sm:w-6" />
          </span>

          <div className="flex-1 min-w-0">
            {/* Top row: Title and Status Badge */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-1.5 flex-wrap min-w-0 flex-1">
                {editingName ? (
                  <input
                    autoFocus
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      setDirty(true);
                    }}
                    onBlur={() => setEditingName(false)}
                    onKeyDown={(e) => e.key === "Enter" && setEditingName(false)}
                    maxLength={100}
                    className="w-full sm:w-auto rounded-lg border border-[var(--viz-border)] bg-transparent px-2 py-0.5 text-base sm:text-xl font-bold text-[var(--viz-ink)] outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                  />
                ) : (
                  <h1 className="text-base sm:text-xl font-bold tracking-tight text-[var(--viz-ink)] truncate max-w-full">
                    {name}
                  </h1>
                )}
                {!editingName && (
                  <button
                    onClick={() => setEditingName(true)}
                    aria-label="Rename automation"
                    title="Rename automation"
                    className="p-1 rounded-md text-[var(--viz-muted)] hover:text-[var(--viz-ink)] hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-colors"
                  >
                    <GearIcon className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {/* Status Toggle Badge */}
              <button
                onClick={toggleActive}
                className={`shrink-0 inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold transition-all shadow-2xs active:scale-95 ${
                  rule.enabled
                    ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30"
                    : "bg-black/[0.06] text-[var(--viz-ink-2)] dark:bg-white/10 border border-black/5 dark:border-white/10"
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    rule.enabled ? "bg-emerald-500 animate-pulse" : "bg-neutral-400"
                  }`}
                />
                {rule.enabled ? "Active" : "Paused"}
              </button>
            </div>

            {/* Description Subtitle */}
            <p className="mt-1 text-xs sm:text-sm text-[var(--viz-muted)] leading-relaxed">
              When someone comments a keyword, reply with a link that opens a DM — then send the real message once they tap it.
            </p>

            {/* Mobile-Only Action Buttons: Balanced, full-width thumb-friendly buttons */}
            <div className="flex sm:hidden items-center gap-2 pt-3 mt-3 border-t border-[var(--viz-border)]/60">
              <button
                onClick={save}
                disabled={saving || !dirty}
                className={`flex-1 flex items-center justify-center gap-1.5 h-10 rounded-xl px-4 text-xs font-bold transition-all shadow-xs ${
                  dirty
                    ? "bg-foreground text-background active:scale-98"
                    : "bg-black/[0.06] dark:bg-white/10 text-[var(--viz-muted)] cursor-not-allowed"
                }`}
              >
                {saving ? "Saving…" : dirty ? "Save Changes" : "Saved"}
              </button>

              <button
                onClick={removeAutomation}
                disabled={deleting}
                title="Delete this automation"
                aria-label="Delete this automation"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[var(--viz-border)] text-[var(--viz-ink-2)] hover:bg-red-500/10 hover:text-red-600 hover:border-red-500/30 active:scale-95 transition-all"
              >
                <TrashIcon className="h-4 w-4" />
              </button>
            </div>

            {savedNote && (
              <div className="sm:hidden mt-2 flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                <span>✓</span>
                <span>{savedNote}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Steps 1 & 2: Trigger Keywords & Target Post ────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5 w-full min-w-0">
        {/* Step 1: Trigger Condition */}
        <div className="rounded-2xl border border-[var(--viz-border)] bg-[var(--viz-surface)] p-3.5 sm:p-5 shadow-2xs flex flex-col justify-between space-y-3.5 transition-all w-full min-w-0">
          <div className="space-y-3">
            {/* Header: Icon + Title + Info Tooltip */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-black/[0.04] dark:bg-white/[0.06] text-[var(--viz-ink)] border border-[var(--viz-border)] shadow-2xs">
                  <BoltIcon className="h-4 w-4" />
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-bold text-[var(--viz-ink)]">1. Trigger Condition</span>
                  <Tooltip
                    title={
                      triggerMode === "any"
                        ? "Replies automatically whenever any follower or user leaves a comment on your post."
                        : "Only triggers an automated reply when a user's comment includes at least one of your specified keywords."
                    }
                  >
                    <button
                      type="button"
                      aria-label="Trigger condition info"
                      className="text-[var(--viz-muted)] hover:text-[var(--viz-ink)] transition-colors p-0.5 rounded cursor-pointer"
                    >
                      <InfoIcon className="h-3.5 w-3.5" />
                    </button>
                  </Tooltip>
                </div>
              </div>
            </div>

            {/* Segmented Mode Selector: Full-width 2-column grid to ensure perfect symmetry and zero clipping */}
            <div className="grid grid-cols-2 w-full rounded-xl border border-[var(--viz-border)] bg-black/[0.03] p-1 dark:bg-white/[0.04] shadow-2xs">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setTriggerMode("keywords");
                  if (keywords.length === 0) {
                    setKeywordDraft("NICE, PERFECT");
                    setDirty(true);
                  }
                }}
                className={`rounded-lg py-1.5 px-2 text-xs font-semibold text-center transition-all select-none cursor-pointer truncate ${
                  triggerMode === "keywords"
                    ? "bg-background text-[var(--viz-ink)] shadow-xs"
                    : "text-[var(--viz-muted)] hover:text-[var(--viz-ink)]"
                }`}
              >
                <span>Keywords</span>
                {keywords.length > 0 && <span className="ml-1 opacity-70">({keywords.length})</span>}
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setTriggerMode("any");
                  setKeywordDraft("");
                  setDirty(true);
                }}
                className={`rounded-lg py-1.5 px-2 text-xs font-semibold text-center transition-all select-none cursor-pointer truncate ${
                  triggerMode === "any"
                    ? "bg-background text-[var(--viz-ink)] shadow-xs"
                    : "text-[var(--viz-muted)] hover:text-[var(--viz-ink)]"
                }`}
              >
                Any Comment
              </button>
            </div>

            {/* Keyword Input Box or Any Comment State */}
            <div className="min-h-[110px] flex flex-col justify-center">
            {triggerMode === "keywords" ? (
              <div className="space-y-2.5">
                <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-[var(--viz-border)] bg-background p-2.5 transition-all focus-within:border-[var(--viz-ink)] focus-within:ring-2 focus-within:ring-black/5 dark:focus-within:ring-white/10 min-h-[3.25rem]">
                  {keywords.map((k) => (
                    <span
                      key={k}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-black/[0.04] dark:bg-white/[0.08] px-2.5 py-1 text-xs font-semibold text-[var(--viz-ink)] border border-[var(--viz-border)] shadow-2xs transition-all"
                    >
                      <span className="font-mono text-[11px] tracking-wide">{k.toUpperCase()}</span>
                      <button
                        type="button"
                        onClick={() => removeKeyword(k)}
                        aria-label={`Remove keyword ${k}`}
                        className="flex h-3.5 w-3.5 items-center justify-center rounded text-[var(--viz-muted)] hover:text-red-500 hover:bg-red-500/10 transition-colors"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                  <input
                    value={keywordInput}
                    onChange={(e) => setKeywordInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === ",") {
                        e.preventDefault();
                        if (keywordInput.trim()) {
                          addKeyword(keywordInput);
                          setKeywordInput("");
                        }
                      } else if (e.key === "Backspace" && !keywordInput && keywords.length > 0) {
                        removeKeyword(keywords[keywords.length - 1]);
                      }
                    }}
                    placeholder={
                      keywords.length === 0
                        ? "Type keyword and press Enter..."
                        : "Add keyword…"
                    }
                    className="min-w-[120px] flex-1 bg-transparent text-xs text-[var(--viz-ink)] outline-none placeholder:text-[var(--viz-muted)]"
                  />
                  {keywordInput.trim() && (
                    <button
                      type="button"
                      onClick={() => {
                        addKeyword(keywordInput);
                        setKeywordInput("");
                      }}
                      className="rounded-lg bg-foreground px-2.5 py-1 text-[11px] font-semibold text-background shadow-2xs hover:opacity-90 active:scale-95 transition-all"
                    >
                      + Add
                    </button>
                  )}
                </div>

                {/* Suggestions Pills */}
                <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                  <div className="flex items-center gap-1 text-[10px] font-medium text-[var(--viz-muted)] mr-0.5">
                    <span>Suggestions</span>
                    <Tooltip title="Tap any suggested keyword to quickly add it to your automation triggers.">
                      <span className="cursor-pointer hover:text-[var(--viz-ink)]">
                        <InfoIcon className="h-3 w-3" />
                      </span>
                    </Tooltip>
                  </div>
                  {["PRICE", "LINK", "SHOP", "INFO", "GUIDE", "DETAILS"].map((preset) => {
                    const exists = keywords.some((k) => k.toUpperCase() === preset);
                    if (exists) return null;
                    return (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => addKeyword(preset)}
                        className="rounded-full border border-[var(--viz-border)] bg-black/[0.015] dark:bg-white/[0.02] px-2.5 py-0.5 text-[10px] font-medium text-[var(--viz-ink-2)] hover:bg-black/5 dark:hover:bg-white/5 active:scale-95 transition-all select-none focus:outline-none"
                      >
                        + {preset}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-3 rounded-xl border border-[var(--viz-border)] bg-black/[0.015] dark:bg-white/[0.02] p-3.5 text-xs">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-foreground text-background text-xs font-bold shadow-2xs">
                    ✓
                  </span>
                  <div>
                    <p className="font-semibold text-[var(--viz-ink)]">All comments will trigger automated DMs</p>
                    <p className="text-[11px] text-[var(--viz-muted)] mt-0.5">No keyword filter required.</p>
                  </div>
                </div>
                <Tooltip title="Every follower or user who comments on the target post will automatically receive this DM response.">
                  <span className="text-[var(--viz-muted)] hover:text-[var(--viz-ink)] cursor-pointer p-1">
                    <InfoIcon className="h-3.5 w-3.5" />
                  </span>
                </Tooltip>
              </div>
            )}
            </div>
          </div>
        </div>

        {/* Step 2: Target Post */}
        <div className="rounded-2xl border border-[var(--viz-border)] bg-[var(--viz-surface)] p-3.5 sm:p-5 shadow-2xs flex flex-col justify-between space-y-3.5 transition-all w-full min-w-0">
          <div className="space-y-3">
            {/* Header: Icon + Title + Info Tooltip + Status/Switch Link */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-black/[0.04] dark:bg-white/[0.06] text-[var(--viz-ink)] border border-[var(--viz-border)] shadow-2xs">
                  <InstagramIcon className="h-4 w-4" />
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-bold text-[var(--viz-ink)]">2. Target Post</span>
                  <Tooltip
                    title={
                      rule.mediaId
                        ? "Replies only when someone comments on this specific post or reel."
                        : "Runs across every post and reel published on your Instagram account."
                    }
                  >
                    <button
                      type="button"
                      aria-label="Target post info"
                      className="text-[var(--viz-muted)] hover:text-[var(--viz-ink)] transition-colors p-0.5 rounded cursor-pointer"
                    >
                      <InfoIcon className="h-3.5 w-3.5" />
                    </button>
                  </Tooltip>
                </div>
              </div>

            </div>

            {/* Target Display Card */}
            {rule.mediaId ? (
              (() => {
                const linkedPost = posts?.find((p) => p.mediaId === rule.mediaId);
                const isReel =
                  rule.mediaPermalink?.includes("/reel/") ||
                  linkedPost?.permalink?.includes("/reel/");

                return (
                  <div className="group relative rounded-2xl border border-[var(--viz-border)] bg-[var(--viz-surface)] p-3.5 sm:p-4 shadow-2xs hover:border-[var(--viz-ink)]/25 transition-all">
                    <div className="flex items-start gap-3.5">
                      {/* Post / Reel Thumbnail */}
                      <div className="relative h-16 w-16 sm:h-20 sm:w-20 shrink-0 overflow-hidden rounded-xl border border-[var(--viz-border)] bg-black/5 dark:bg-white/5 shadow-2xs">
                        {rule.mediaThumb ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={rule.mediaThumb}
                            alt="Selected post thumbnail"
                            referrerPolicy="no-referrer"
                            className="h-full w-full object-cover transition-transform group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-tr from-[#f9ed32]/10 via-[#ee2a7b]/10 to-[#002aff]/10 text-[var(--viz-muted)]">
                            <InstagramIcon className="h-6 w-6 opacity-60" />
                          </div>
                        )}
                        {isReel && (
                          <span className="absolute bottom-1 left-1 flex items-center gap-0.5 rounded-md bg-black/75 px-1.5 py-0.5 text-[9px] font-semibold text-white backdrop-blur-xs">
                            <PlayIcon className="h-2 w-2 fill-white" />
                            <span>Reel</span>
                          </span>
                        )}
                      </div>

                      {/* Post Info & Metadata (NO ID DISPLAYED) */}
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex flex-wrap items-center justify-between gap-1.5">
                          <div className="flex items-center gap-1.5">
                            <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                            </span>
                            <span className="text-xs font-bold text-[var(--viz-ink)]">
                              {isReel ? "Specific Reel Linked" : "Specific Post Linked"}
                            </span>
                            <span className="rounded-md bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-semibold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                              Active
                            </span>
                          </div>

                          {rule.mediaPermalink && (
                            <a
                              href={rule.mediaPermalink}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-[11px] font-medium text-[#0095f6] hover:text-[#0077c5] hover:underline transition-colors"
                              title="Open on Instagram"
                            >
                              <span>View on Instagram</span>
                              <ExternalLinkIcon className="h-3 w-3" />
                            </a>
                          )}
                        </div>

                        {/* Caption / Contextual description instead of technical ID */}
                        {linkedPost?.caption ? (
                          <p className="line-clamp-2 text-xs text-[var(--viz-ink-2)] font-normal leading-relaxed pt-0.5">
                            &ldquo;{linkedPost.caption}&rdquo;
                          </p>
                        ) : (
                          <p className="text-xs text-[var(--viz-muted)] font-normal leading-relaxed pt-0.5">
                            Replies exclusively to comments placed on this selected {isReel ? "reel" : "post"}.
                          </p>
                        )}

                        {linkedPost?.postedAt && (
                          <p className="text-[10px] text-[var(--viz-muted)] font-medium">
                            Published {new Date(linkedPost.postedAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Action buttons bar */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-3 mt-3 border-t border-[var(--viz-border)]/60">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={openPicker}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--viz-border)] bg-[var(--viz-surface)] px-3 py-1.5 text-xs font-semibold text-[var(--viz-ink)] shadow-2xs hover:bg-black/5 dark:hover:bg-white/5 active:scale-95 transition-all cursor-pointer"
                        >
                          <RefreshIcon className="h-3 w-3 text-[var(--viz-muted)]" />
                          <span>Change Post</span>
                        </button>
                        <button
                          type="button"
                          onClick={clearPost}
                          className="inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-medium text-[var(--viz-muted)] hover:text-red-500 hover:bg-red-500/10 active:scale-95 transition-all cursor-pointer"
                        >
                          <TrashIcon className="h-3 w-3" />
                          <span>Reset to All Posts</span>
                        </button>
                      </div>

                      <span className="text-[10px] text-[var(--viz-muted)] font-medium">
                        1 specific target
                      </span>
                    </div>
                  </div>
                );
              })()
            ) : (
              <div className="flex items-center justify-between gap-2.5 rounded-2xl border border-[var(--viz-border)] bg-[var(--viz-surface)] p-3.5 transition-all w-full min-w-0">
                <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-black/[0.04] dark:bg-white/[0.06] text-[var(--viz-ink)] border border-[var(--viz-border)] shadow-2xs">
                    <InstagramIcon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-[var(--viz-ink)] truncate">All Posts &amp; Reels</p>
                    <p className="text-[11px] text-[var(--viz-muted)] truncate">Runs on every post and reel published on your account</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={openPicker}
                  className="shrink-0 rounded-xl bg-foreground px-3 sm:px-3.5 py-2 text-xs font-bold text-background shadow-xs hover:opacity-90 active:scale-95 transition-all cursor-pointer whitespace-nowrap"
                >
                  Choose Post
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Step 3: Send this message & Custom Templates ───────────── */}
      <div className={card}>
        <div className="mb-4">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-black/[0.04] dark:bg-white/[0.06] text-[var(--viz-ink)] border border-[var(--viz-border)] shadow-2xs">
              <SendIcon className="h-4 w-4" />
            </span>
            <div className="flex items-center gap-1.5 flex-1 min-w-0">
              <h2 className="text-sm font-bold text-[var(--viz-ink)]">3. Response &amp; DM Template</h2>
              <Tooltip title="Sent as a private Instagram DM to commenters. Customize with interactive buttons, product showcases, or downloadable lead magnets.">
                <button
                  type="button"
                  aria-label="Template info"
                  className="text-[var(--viz-muted)] hover:text-[var(--viz-ink)] transition-colors p-0.5 rounded cursor-pointer"
                >
                  <InfoIcon className="h-3.5 w-3.5" />
                </button>
              </Tooltip>
            </div>
          </div>

          {/* Modern Template Format Tiles */}
          <div className="mt-4 grid grid-cols-2 gap-2 sm:gap-2.5 sm:grid-cols-3 lg:grid-cols-5 w-full min-w-0">
            {[
              {
                id: "text",
                icon: MessageTextIcon,
                label: "Simple Text",
                desc: "Clean text message",
                badge: "Direct DM",
                accent: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
              },
              {
                id: "button",
                icon: MessageButtonsIcon,
                label: "Text + Buttons",
                desc: "Message with clickable links",
                badge: "Up to 3 links",
                accent: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
              },
              {
                id: "product",
                icon: ShoppingBagIcon,
                label: "Product Card",
                desc: "Photo, price & buy CTA",
                badge: "eCommerce",
                accent: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
              },
              {
                id: "file",
                icon: FileDownloadIcon,
                label: "Downloadable File",
                desc: "PDF or lead magnet",
                badge: "Lead Magnet",
                accent: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
              },
              {
                id: "card",
                icon: MediaCardIcon,
                label: "Custom Media Card",
                desc: "Header image & buttons",
                badge: "Rich Media",
                accent: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
              },
            ].map((tab, idx) => {
              const active = templateType === tab.id;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => selectTemplate(tab.id as any)}
                  className={`group relative flex flex-col justify-between rounded-2xl p-2.5 sm:p-3.5 text-left transition-all duration-200 border cursor-pointer select-none min-h-[110px] sm:min-h-[118px] min-w-0 ${
                    idx === 4 ? "col-span-2 sm:col-span-1" : ""
                  } ${
                    active
                      ? "border-neutral-900 bg-neutral-900 text-white shadow-lg shadow-neutral-900/15 dark:border-white dark:bg-white dark:text-neutral-900 dark:shadow-white/10 ring-1 ring-neutral-900/10 dark:ring-white/20"
                      : "border-[var(--viz-border)] bg-[var(--viz-surface)] text-[var(--viz-ink)] hover:-translate-y-0.5 hover:border-[var(--viz-ink)]/30 hover:shadow-xs"
                  }`}
                >
                  <div className="flex w-full items-center justify-between gap-2">
                    <span
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl transition-colors ${
                        active
                          ? "bg-white/20 text-white dark:bg-black/20 dark:text-neutral-900"
                          : `border ${tab.accent} shadow-2xs`
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    {active ? (
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/20 dark:bg-black/20 text-[10px] font-bold">
                        ✓
                      </span>
                    ) : (
                      <span className="rounded-full bg-black/[0.04] dark:bg-white/[0.06] px-2 py-0.5 text-[9px] font-medium text-[var(--viz-muted)]">
                        {tab.badge}
                      </span>
                    )}
                  </div>
                  <div className="mt-3">
                    <span className="block text-xs font-bold leading-tight tracking-tight">{tab.label}</span>
                    <span
                      className={`mt-1 block text-[10px] leading-tight ${
                        active ? "text-white/70 dark:text-black/70" : "text-[var(--viz-muted)]"
                      }`}
                    >
                      {tab.desc}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2-Column Modern Studio: Editor Form + Sticky iPhone Mockup */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start w-full min-w-0">
          {/* Left Column: Form Controls */}
          <div className="space-y-4 lg:col-span-7 w-full min-w-0">
            {/* Primary message caption card */}
            <div className="rounded-2xl border border-[var(--viz-border)] bg-[var(--viz-surface)] p-3.5 sm:p-5 shadow-2xs space-y-3.5">
              {/* Header: Title, Subtitle, & Monospace Character Counter */}
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <label className="text-xs font-bold text-[var(--viz-ink)] tracking-tight">
                      Message Text / Caption
                    </label>
                    <span className="inline-flex items-center rounded-md bg-blue-500/10 px-2 py-0.5 text-[10px] font-semibold text-blue-600 dark:text-blue-400 border border-blue-500/20">
                      Primary DM
                    </span>
                  </div>
                  <p className="text-[11px] text-[var(--viz-muted)] leading-relaxed">
                    Sent directly to the commenter&apos;s Instagram DM inbox.
                  </p>
                </div>
                <div className="shrink-0 pt-0.5">
                  <span
                    className={`inline-flex items-center gap-1 font-mono text-[10px] font-semibold tracking-tight whitespace-nowrap px-2.5 py-1 rounded-full border transition-colors ${
                      dmText.length > 900
                        ? "text-red-500 bg-red-500/10 border-red-500/25"
                        : dmText.length > 700
                        ? "text-amber-600 bg-amber-500/10 border-amber-500/25"
                        : "text-[var(--viz-muted)] bg-black/[0.03] dark:bg-white/[0.05] border-[var(--viz-border)]/70"
                    }`}
                  >
                    <span>{dmText.length}</span>
                    <span className="opacity-40">/</span>
                    <span>1000</span>
                  </span>
                </div>
              </div>

              {/* Textarea Composer */}
              <div className="group rounded-xl border border-[var(--viz-border)] bg-background transition-all focus-within:border-[var(--viz-ink)] focus-within:ring-2 focus-within:ring-black/5 dark:focus-within:ring-white/10 shadow-2xs">
                <textarea
                  value={dmText}
                  onChange={(e) => {
                    setDmText(e.target.value);
                    setDirty(true);
                  }}
                  maxLength={1000}
                  rows={3}
                  placeholder="Hey! 👋 Thanks for your comment. Here is the link you requested:"
                  className="w-full bg-transparent p-3.5 text-xs text-[var(--viz-ink)] placeholder:text-[var(--viz-muted)] outline-none resize-none leading-relaxed min-h-[5.5rem]"
                />
              </div>

              {/* Quick Insert Variables: Symmetric 3-Column Grid */}
              <div className="space-y-1.5 pt-0.5">
                <div className="flex items-center justify-between px-0.5">
                  <span className="text-[10px] font-bold tracking-wider text-[var(--viz-muted)] uppercase">
                    Quick Insert
                  </span>
                  <span className="text-[10px] text-[var(--viz-muted)] opacity-75">
                    Tap to append
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setDmText((t) => (t.endsWith(" ") || !t ? `${t}{username} ` : `${t} {username} `));
                      setDirty(true);
                    }}
                    className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-purple-500/25 bg-purple-500/8 px-2 py-2 text-[11px] font-semibold text-purple-700 dark:text-purple-300 hover:bg-purple-500/15 hover:border-purple-500/40 active:scale-[0.98] transition-all cursor-pointer shadow-2xs"
                  >
                    <span className="font-mono text-[10px] opacity-75">@</span>
                    <span className="truncate">username</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDmText((t) => (t ? `Hey {username}! 👋\n\n${t}` : "Hey {username}! 👋"));
                      setDirty(true);
                    }}
                    className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-emerald-500/25 bg-emerald-500/8 px-2 py-2 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/15 hover:border-emerald-500/40 active:scale-[0.98] transition-all cursor-pointer shadow-2xs"
                  >
                    <span>👋</span>
                    <span className="truncate">Greeting</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDmText((t) => (t ? `${t}\n\nTap below to check it out! 👇` : "Tap below to check it out! 👇"));
                      setDirty(true);
                    }}
                    className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-amber-500/25 bg-amber-500/8 px-2 py-2 text-[11px] font-semibold text-amber-700 dark:text-amber-300 hover:bg-amber-500/15 hover:border-amber-500/40 active:scale-[0.98] transition-all cursor-pointer shadow-2xs"
                  >
                    <span>👇</span>
                    <span className="truncate sm:hidden">CTA</span>
                    <span className="truncate hidden sm:inline">Call to Action</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Product Card Details */}
            {templateType === "product" && (
              <div className="rounded-2xl border border-[var(--viz-border)] bg-[var(--viz-surface)] p-4 shadow-2xs space-y-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                      <ShoppingBagIcon className="h-3.5 w-3.5" />
                    </span>
                    <p className="text-xs font-bold text-[var(--viz-ink)]">Product Showcase Settings</p>
                  </div>
                  <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[9px] font-semibold text-emerald-600 dark:text-emerald-400">
                    Instagram Direct Card
                  </span>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="text-[11px] font-medium text-[var(--viz-ink-2)]">Product Name / Title</label>
                    <input
                      value={cardTitle}
                      onChange={(e) => { setCardTitle(e.target.value.slice(0, 80)); setDirty(true); }}
                      placeholder="e.g. Premium Oversized Hoodie"
                      className="mt-1 w-full rounded-xl border border-[var(--viz-border)] bg-black/[0.015] dark:bg-white/[0.02] px-3 py-2 text-xs outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15 font-medium transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-medium text-[var(--viz-ink-2)]">Price & Badge Highlights</label>
                    <input
                      value={cardSubtitle}
                      onChange={(e) => { setCardSubtitle(e.target.value.slice(0, 80)); setDirty(true); }}
                      placeholder="e.g. $49.99 • Special 20% Off"
                      className="mt-1 w-full rounded-xl border border-[var(--viz-border)] bg-black/[0.015] dark:bg-white/[0.02] px-3 py-2 text-xs outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15 transition-all"
                    />
                  </div>
                </div>

                {/* Product Image Upload with Cloudinary CDN */}
                <CloudinaryImageUploader
                  label="Product Image"
                  value={cardImageUrl}
                  onChange={(url) => {
                    setCardImageUrl(url);
                    setDirty(true);
                  }}
                  accentColor="emerald"
                  helperText="Instagram Direct displays this photo prominently at the top of the product card."
                />

                <div>
                  <label className="text-[11px] font-medium text-[var(--viz-ink-2)]">Store Product Link</label>
                  <input
                    value={cardFileUrl}
                    onChange={(e) => {
                      setCardFileUrl(e.target.value);
                      setDirty(true);
                      if (cardButtons.length > 0 && cardButtons[0].type === "web_url") {
                        updateButton(0, { url: e.target.value });
                      }
                    }}
                    placeholder="https://yourstore.com/products/oversized-hoodie"
                    className="mt-1 w-full rounded-xl border border-[var(--viz-border)] bg-black/[0.015] dark:bg-white/[0.02] px-3 py-2 text-xs outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15 font-mono text-[11px] transition-all"
                  />
                </div>
              </div>
            )}

            {/* Downloadable File Details */}
            {templateType === "file" && (
              <div className="rounded-2xl border border-[var(--viz-border)] bg-[var(--viz-surface)] p-4 shadow-2xs space-y-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                      <FileDownloadIcon className="h-3.5 w-3.5" />
                    </span>
                    <p className="text-xs font-bold text-[var(--viz-ink)]">Lead Magnet / File Resource Settings</p>
                  </div>
                  <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[9px] font-semibold text-amber-600 dark:text-amber-400">
                    PDF Guide
                  </span>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="text-[11px] font-medium text-[var(--viz-ink-2)]">Resource Title</label>
                    <input
                      value={cardTitle}
                      onChange={(e) => { setCardTitle(e.target.value.slice(0, 80)); setDirty(true); }}
                      placeholder="e.g. Free 2026 Growth Blueprint"
                      className="mt-1 w-full rounded-xl border border-[var(--viz-border)] bg-black/[0.015] dark:bg-white/[0.02] px-3 py-2 text-xs outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/15 font-medium transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-medium text-[var(--viz-ink-2)]">Format & File Details</label>
                    <input
                      value={cardSubtitle}
                      onChange={(e) => { setCardSubtitle(e.target.value.slice(0, 80)); setDirty(true); }}
                      placeholder="e.g. 15-Page PDF Guide • Instant Download"
                      className="mt-1 w-full rounded-xl border border-[var(--viz-border)] bg-black/[0.015] dark:bg-white/[0.02] px-3 py-2 text-xs outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/15 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-medium text-[var(--viz-ink-2)]">Download / PDF Link</label>
                  <input
                    value={cardFileUrl}
                    onChange={(e) => {
                      setCardFileUrl(e.target.value);
                      setDirty(true);
                      if (cardButtons.length > 0 && cardButtons[0].type === "web_url") {
                        updateButton(0, { url: e.target.value });
                      }
                    }}
                    placeholder="https://drive.google.com/... or https://yourdomain.com/blueprint.pdf"
                    className="mt-1 w-full rounded-xl border border-[var(--viz-border)] bg-black/[0.015] dark:bg-white/[0.02] px-3 py-2 text-xs outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/15 font-mono text-[11px] transition-all"
                  />
                </div>

                {/* Cover Image Upload with Cloudinary CDN */}
                <CloudinaryImageUploader
                  label="Cover Artwork"
                  value={cardImageUrl}
                  onChange={(url) => {
                    setCardImageUrl(url);
                    setDirty(true);
                  }}
                  accentColor="amber"
                  helperText="Optional cover artwork shown above the resource title in Instagram DM."
                />
              </div>
            )}

            {/* Custom Media Card Details */}
            {templateType === "card" && (
              <div className="rounded-2xl border border-[var(--viz-border)] bg-[var(--viz-surface)] p-4 shadow-2xs space-y-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400">
                      <MediaCardIcon className="h-3.5 w-3.5" />
                    </span>
                    <p className="text-xs font-bold text-[var(--viz-ink)]">Custom Media Card Settings</p>
                  </div>
                  <span className="rounded-full bg-rose-500/10 px-2 py-0.5 text-[9px] font-semibold text-rose-600 dark:text-rose-400">
                    Full Media
                  </span>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="text-[11px] font-medium text-[var(--viz-ink-2)]">Card Title</label>
                    <input
                      value={cardTitle}
                      onChange={(e) => { setCardTitle(e.target.value.slice(0, 80)); setDirty(true); }}
                      placeholder="e.g. VIP Member Access"
                      className="mt-1 w-full rounded-xl border border-[var(--viz-border)] bg-black/[0.015] dark:bg-white/[0.02] px-3 py-2 text-xs outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/15 font-medium transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-medium text-[var(--viz-ink-2)]">Card Subtitle / Description</label>
                    <input
                      value={cardSubtitle}
                      onChange={(e) => { setCardSubtitle(e.target.value.slice(0, 80)); setDirty(true); }}
                      placeholder="e.g. Tap below to claim your spot"
                      className="mt-1 w-full rounded-xl border border-[var(--viz-border)] bg-black/[0.015] dark:bg-white/[0.02] px-3 py-2 text-xs outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/15 transition-all"
                    />
                  </div>
                </div>

                {/* Header Image Upload with Cloudinary CDN */}
                <CloudinaryImageUploader
                  label="Header Image"
                  value={cardImageUrl}
                  onChange={(url) => {
                    setCardImageUrl(url);
                    setDirty(true);
                  }}
                  accentColor="rose"
                  helperText="High-impact 1.91:1 banner image displayed at the top of the media card."
                />
              </div>
            )}

            {/* Interactive Action Buttons Builder */}
            {templateType !== "text" && (
              <div className="rounded-2xl border border-[var(--viz-border)] bg-[var(--viz-surface)]/90 backdrop-blur-xs p-4 sm:p-5 shadow-2xs space-y-3.5">
                {/* Header: Title, Inline Counter Badge & Add Button */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/15 via-indigo-500/15 to-purple-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/25 shadow-2xs">
                        <MessageButtonsIcon className="h-4 w-4" />
                      </span>
                      <div className="flex items-center gap-2 min-w-0">
                        <h4 className="text-xs sm:text-sm font-bold text-[var(--viz-ink)] tracking-tight">
                          <span className="sm:hidden">Action Buttons</span>
                          <span className="hidden sm:inline">Interactive Action Buttons</span>
                        </h4>
                        <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-2 py-0.5 font-mono text-[10px] font-bold text-blue-600 dark:text-blue-400 border border-blue-500/20 shrink-0 shadow-2xs">
                          {cardButtons.length}/3
                        </span>
                      </div>
                    </div>

                    {cardButtons.length < 3 && (
                      <button
                        type="button"
                        onClick={() => addButton()}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-100 text-white dark:text-neutral-900 px-3 py-1.5 text-xs font-bold shadow-2xs active:scale-95 transition-all shrink-0 cursor-pointer"
                      >
                        <span className="text-sm leading-none">+</span>
                        <span className="whitespace-nowrap">Add Button</span>
                      </button>
                    )}
                  </div>
                  <p className="text-[11px] text-[var(--viz-muted)] leading-relaxed">
                    Instagram supports up to 3 clickable buttons (max 20 characters per button title).
                  </p>
                </div>

                {/* Quick Presets: Responsive Wrapping Chips */}
                {cardButtons.length < 3 && (
                  <div className="space-y-1.5 pt-2 border-t border-[var(--viz-border)]/60">
                    <div className="flex items-center justify-between text-[10px] text-[var(--viz-muted)] px-0.5">
                      <span className="font-bold tracking-wider uppercase text-[9px] text-[var(--viz-ink-2)]">QUICK PRESETS</span>
                      <span className="text-[10px] text-[var(--viz-muted)]">Tap to add</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {[
                        { title: "Shop Now", icon: "🛍️", url: cardFileUrl || "https://instagram.com" },
                        { title: "Download PDF", icon: "📥", url: cardFileUrl || "https://instagram.com" },
                        { title: "Visit Website", icon: "🌐", url: "https://instagram.com" },
                        { title: "Claim Offer", icon: "🎁", url: "https://instagram.com" },
                      ].map((preset, pIdx) => (
                        <button
                          key={pIdx}
                          type="button"
                          onClick={() => addButton({ title: preset.title, url: preset.url })}
                          className="inline-flex items-center gap-1.5 rounded-full border border-[var(--viz-border)] bg-background hover:bg-[var(--viz-surface)] hover:border-blue-500/40 px-3 py-1.5 text-xs font-semibold text-[var(--viz-ink)] shadow-2xs active:scale-95 transition-all cursor-pointer whitespace-nowrap"
                        >
                          <span className="text-xs">{preset.icon}</span>
                          <span>+ {preset.title}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Buttons List */}
                {cardButtons.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-[var(--viz-border)] p-6 text-center bg-background/50">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 mx-auto border border-blue-500/20">
                      <MessageButtonsIcon className="h-5 w-5" />
                    </div>
                    <p className="text-xs font-bold text-[var(--viz-ink)] mt-2.5">No buttons attached</p>
                    <p className="text-[11px] text-[var(--viz-muted)] mt-0.5 max-w-xs mx-auto">
                      Click &quot;+ Add Button&quot; or tap a preset above to attach clickable CTAs to your Instagram DM.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3 pt-1">
                    {cardButtons.map((btn, idx) => (
                      <div
                        key={idx}
                        className="group relative rounded-2xl border border-[var(--viz-border)] bg-background p-3.5 sm:p-4 text-xs space-y-3.5 transition-all hover:border-[var(--viz-ink)]/25 shadow-2xs"
                      >
                        {/* Top Header Row: Badge, Title & Remove Button */}
                        <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-[var(--viz-border)]/60">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-[var(--viz-ink)] text-background font-mono font-bold text-xs shadow-2xs">
                              {idx + 1}
                            </span>
                            <span className="font-bold text-xs sm:text-sm text-[var(--viz-ink)] truncate">
                              {btn.title ? btn.title : `Button #${idx + 1}`}
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => removeButton(idx)}
                            className="flex h-7 w-7 items-center justify-center rounded-lg text-[var(--viz-muted)] hover:text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
                            title="Remove button"
                          >
                            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M18 6L6 18M6 6l12 12" />
                            </svg>
                          </button>
                        </div>

                        {/* Full-Width 2-Tab Segmented Control */}
                        <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-black/[0.04] dark:bg-white/[0.05] border border-[var(--viz-border)]/60">
                          <button
                            type="button"
                            onClick={() => updateButton(idx, { type: "web_url" })}
                            className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                              btn.type === "web_url"
                                ? "bg-background text-[var(--viz-ink)] shadow-2xs border border-[var(--viz-border)]/60"
                                : "text-[var(--viz-muted)] hover:text-[var(--viz-ink)]"
                            }`}
                          >
                            <LinkIcon className="h-3.5 w-3.5 text-blue-500" />
                            <span>Web Link</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => updateButton(idx, { type: "postback" })}
                            className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                              btn.type === "postback"
                                ? "bg-background text-[var(--viz-ink)] shadow-2xs border border-[var(--viz-border)]/60"
                                : "text-[var(--viz-muted)] hover:text-[var(--viz-ink)]"
                            }`}
                          >
                            <BoltIcon className="h-3.5 w-3.5 text-amber-500" />
                            <span>Action Reply</span>
                          </button>
                        </div>

                        {/* Form Fields: Button Label & Destination URL */}
                        <div className="space-y-3">
                          <div>
                            <div className="flex justify-between items-center text-[11px] mb-1.5">
                              <span className="font-semibold text-[var(--viz-ink)]">Button Label</span>
                              <span className={`font-mono text-[10px] font-medium ${btn.title.length >= 20 ? 'text-red-500' : btn.title.length >= 17 ? 'text-amber-500' : 'text-[var(--viz-muted)]'}`}>
                                {btn.title.length}/20
                              </span>
                            </div>
                            <input
                              value={btn.title}
                              maxLength={20}
                              onChange={(e) => updateButton(idx, { title: e.target.value })}
                              placeholder="e.g. Shop Now"
                              className="w-full rounded-xl border border-[var(--viz-border)] bg-[var(--viz-surface)]/70 px-3.5 py-2 text-xs font-semibold text-[var(--viz-ink)] outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 transition-all shadow-2xs"
                            />
                          </div>

                          <div>
                            <div className="flex justify-between items-center text-[11px] mb-1.5">
                              <span className="font-semibold text-[var(--viz-ink)]">
                                {btn.type === "web_url" ? "Destination URL" : "Action Identifier"}
                              </span>
                              {btn.type === "web_url" ? (
                                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono font-medium">
                                  https://
                                </span>
                              ) : (
                                <span className="text-[10px] text-amber-600 dark:text-amber-400 font-mono font-medium">
                                  TRIGGER_ID
                                </span>
                              )}
                            </div>
                            {btn.type === "web_url" ? (
                              <div className="relative flex items-center">
                                <LinkIcon className="absolute left-3.5 h-3.5 w-3.5 text-blue-500 pointer-events-none" />
                                <input
                                  value={btn.url || ""}
                                  onChange={(e) => updateButton(idx, { url: e.target.value })}
                                  placeholder="https://instagram.com"
                                  className="w-full rounded-xl border border-[var(--viz-border)] bg-[var(--viz-surface)]/70 pl-9 pr-3.5 py-2 text-xs font-mono text-[11px] outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 transition-all shadow-2xs"
                                />
                              </div>
                            ) : (
                              <div className="relative flex items-center">
                                <BoltIcon className="absolute left-3.5 h-3.5 w-3.5 text-amber-500 pointer-events-none" />
                                <input
                                  value={btn.payload || ""}
                                  onChange={(e) => updateButton(idx, { payload: e.target.value })}
                                  placeholder="ACTION_KEYWORD"
                                  className="w-full rounded-xl border border-[var(--viz-border)] bg-[var(--viz-surface)]/70 pl-9 pr-3.5 py-2 text-xs font-mono text-[11px] outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 transition-all shadow-2xs"
                                />
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Native Instagram Direct DM Preview Box */}
                        <div className="pt-0.5">
                          <div className="flex items-center justify-between text-[10px] text-[var(--viz-muted)] mb-1 px-0.5">
                            <span className="font-medium text-[9px] uppercase tracking-wider">Preview in Instagram DM</span>
                            <span className="text-[9px] opacity-75">Tap action</span>
                          </div>
                          <div className="w-full rounded-xl border border-blue-500/25 bg-blue-500/[0.04] hover:bg-blue-500/[0.07] py-2.5 px-3 text-center transition-all shadow-2xs">
                            <span className="text-xs font-bold text-blue-600 dark:text-blue-400 flex items-center justify-center gap-1.5">
                              <span>{btn.title || "Button Label"}</span>
                              {btn.type === "web_url" ? (
                                <svg className="h-3 w-3 opacity-70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                  <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
                                  <polyline points="15 3 21 3 21 9" />
                                  <line x1="10" y1="14" x2="21" y2="3" />
                                </svg>
                              ) : (
                                <BoltIcon className="h-3 w-3 opacity-70" />
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Column: Authentic Flagship Device Mockup */}
          <div className="lg:col-span-5 flex flex-col items-center sticky top-6 self-start w-full min-w-0 overflow-hidden">
            <div className="w-full max-w-[320px] mb-2.5 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-[var(--viz-ink)] tracking-tight">Instagram Direct</span>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[9px] font-semibold text-emerald-600 dark:text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live
                </span>
              </div>

              {/* Hardware Device Switcher */}
              <div className="flex items-center gap-0.5 rounded-lg bg-black/[0.05] p-0.5 dark:bg-white/10 text-[10px] font-medium">
                {(["iPhone 17", "Galaxy S25", "Pixel 10"] as SupportedDevice[]).map((dev) => (
                  <button
                    key={dev}
                    type="button"
                    onClick={() => setPreviewDevice(dev)}
                    className={`rounded-md px-2 py-0.5 transition-all ${
                      previewDevice === dev
                        ? "bg-white font-semibold text-black shadow-xs dark:bg-[#202020] dark:text-white"
                        : "text-black/60 hover:text-black dark:text-white/60 dark:hover:text-white"
                    }`}
                  >
                    {dev.replace(" 17", "").replace(" S25", "").replace(" 10", "")}
                  </button>
                ))}
              </div>
            </div>

            {/* Proper Hardware Device UI using react-mockframe via MobilePreview */}
            <MobilePreview
              width={320}
              height={650}
              device={previewDevice}
              showToolbar={false}
              className="drop-shadow-2xl"
            >
              <div className="flex flex-col h-full bg-[#f8f9fa] dark:bg-[#121212] justify-between">
                {/* Instagram Direct Header */}
                <div className="flex items-center justify-between border-b border-black/10 bg-white px-3.5 py-2.5 dark:border-white/10 dark:bg-[#181818] shrink-0 sticky top-0 z-10">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-xl text-black dark:text-white font-normal leading-none select-none cursor-pointer">‹</span>
                    <div className="relative">
                      <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-[#f9ed32] via-[#ee2a7b] to-[#002aff] p-[1.5px] shadow-xs">
                        <div className="h-full w-full rounded-full bg-white dark:bg-black flex items-center justify-center font-bold text-xs text-black dark:text-white">
                          {rule.name ? rule.name.charAt(0).toUpperCase() : "F"}
                        </div>
                      </div>
                      <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full border border-white dark:border-black bg-emerald-500" />
                    </div>
                    <div className="truncate min-w-0">
                      <p className="text-xs font-bold text-black dark:text-white truncate flex items-center gap-1 leading-tight">
                        <span>fabroniee</span>
                        <span className="text-[10px] text-[#0095f6]">✓</span>
                      </p>
                      <p className="text-[10px] text-black/50 dark:text-white/50 leading-tight">Active now</p>
                    </div>
                  </div>

                  {/* Header icons: Phone, Video */}
                  <div className="flex items-center gap-2 text-black/70 dark:text-white/70">
                    <span className="p-1 rounded-full hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer transition-colors" title="Audio Call">
                      <PhoneIcon className="h-3.5 w-3.5" />
                    </span>
                    <span className="p-1 rounded-full hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer transition-colors" title="Video Call">
                      <VideoCameraIcon className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </div>

                {/* DM Chat Thread */}
                <div className="flex-1 overflow-y-auto p-3 space-y-3 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                  {/* Authentic Instagram Profile Info Banner */}
                  <div className="flex flex-col items-center justify-center pt-3 pb-2 text-center select-none border-b border-black/5 dark:border-white/5 mb-2">
                    <div className="h-14 w-14 rounded-full bg-gradient-to-tr from-[#f9ed32] via-[#ee2a7b] to-[#002aff] p-[2px] shadow-sm mb-1.5">
                      <div className="h-full w-full rounded-full bg-white dark:bg-[#1a1a1a] flex items-center justify-center font-black text-lg text-black dark:text-white">
                        {rule.name ? rule.name.charAt(0).toUpperCase() : "F"}
                      </div>
                    </div>
                    <p className="text-xs font-bold text-black dark:text-white flex items-center gap-1">
                      <span>fabroniee</span>
                      <span className="text-[10px] text-[#0095f6]">✓</span>
                    </p>
                    <p className="text-[9px] text-black/50 dark:text-white/50 mt-0.5">
                      Instagram · 14.8K followers · 82 posts
                    </p>
                    <p className="text-[9px] text-black/40 dark:text-white/40 mt-0.5">
                      You follow each other on Instagram
                    </p>
                    <div className="mt-2 inline-block rounded-md bg-black/5 dark:bg-white/10 px-3 py-1 text-[10px] font-semibold text-black dark:text-white">
                      View Profile
                    </div>
                  </div>

                  {/* Timestamp separator */}
                  <div className="flex justify-center my-1.5">
                    <span className="text-[9px] font-medium text-black/40 dark:text-white/40 bg-black/[0.04] dark:bg-white/[0.06] px-2.5 py-0.5 rounded-full">
                      Today 9:41 AM
                    </span>
                  </div>

                  {/* User's comment trigger */}
                  <div className="flex justify-start">
                    <div className="max-w-[85%] rounded-2xl rounded-tl-xs bg-black/[0.06] dark:bg-white/[0.08] px-3 py-2 shadow-2xs border border-black/5 dark:border-white/5">
                      <p className="text-[8px] font-bold uppercase tracking-wider text-[var(--viz-muted)]">
                        User commented on post
                      </p>
                      <p className="text-xs font-semibold text-black dark:text-white mt-0.5">
                        &quot;{keywords.length > 0 ? keywords[0] : "Nice"}&quot;
                      </p>
                    </div>
                  </div>

                  {/* Outgoing automated response strictly adhering to templateType */}
                  <div className="flex justify-end">
                    {templateType === "product" ? (
                      /* Product Card */
                      <div className="max-w-[94%] overflow-hidden rounded-2xl rounded-tr-xs border border-black/10 bg-white shadow-md dark:border-white/10 dark:bg-[#222222]">
                        {cardImageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={cardImageUrl} alt="Product preview" className="aspect-[1.91/1] w-full object-cover" />
                        ) : (
                          <div className="flex aspect-[1.91/1] w-full flex-col items-center justify-center bg-black/5 dark:bg-white/5 p-2 text-center">
                            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-black/[0.04] dark:bg-white/[0.08] text-[var(--viz-ink)] shadow-2xs">
                              <ShoppingBagIcon className="h-5 w-5" />
                            </span>
                            <span className="text-xs font-bold text-black dark:text-white mt-1.5">Product Showcase</span>
                            <span className="text-[9px] text-[var(--viz-muted)]">Image URL preview</span>
                          </div>
                        )}
                        <div className="p-3 space-y-1">
                          <div className="flex items-center justify-between gap-1">
                            <p className="text-xs font-bold text-black dark:text-white truncate">
                              {cardTitle || "Featured Product"}
                            </p>
                            {cardSubtitle && (
                              <span className="shrink-0 rounded-md bg-emerald-500/10 px-1.5 py-0.5 font-bold text-[10px] text-emerald-600 dark:text-emerald-400">
                                {cardSubtitle}
                              </span>
                            )}
                          </div>
                          {dmText && (
                            <p className="text-xs text-black/75 dark:text-white/75 leading-tight whitespace-pre-line pt-1 border-t border-black/5 dark:border-white/5">
                              {previewText}
                            </p>
                          )}
                        </div>
                        {cardButtons.length > 0 && (
                          <div className="border-t border-black/10 dark:border-white/10 divide-y divide-black/10 dark:divide-white/10">
                            {cardButtons.map((btn, idx) => (
                              <div
                                key={idx}
                                className="py-2.5 text-center text-xs font-bold text-[#0095f6] hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer transition-colors"
                              >
                                {btn.title || "Shop Now"}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : templateType === "file" ? (
                      /* Downloadable File / Lead Magnet Card */
                      <div className="max-w-[94%] overflow-hidden rounded-2xl rounded-tr-xs border border-black/10 bg-white shadow-md dark:border-white/10 dark:bg-[#222222]">
                        {cardImageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={cardImageUrl} alt="Resource cover" className="aspect-[1.91/1] w-full object-cover" />
                        ) : (
                          <div className="flex aspect-[1.91/1] w-full items-center gap-3 bg-gradient-to-r from-red-500/10 via-amber-500/10 to-orange-500/10 p-3">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-red-500 text-white font-black text-xs shadow-sm">
                              PDF
                            </div>
                            <div className="min-w-0">
                              <span className="rounded bg-red-500/20 px-1.5 py-0.5 text-[9px] font-bold text-red-600 dark:text-red-400">
                                Instant Resource
                              </span>
                              <p className="text-xs font-bold text-black dark:text-white truncate mt-0.5">
                                {cardTitle || "Free Resource Guide"}
                              </p>
                              <p className="text-[10px] text-[var(--viz-muted)] truncate">
                                {cardSubtitle || "Direct PDF Download"}
                              </p>
                            </div>
                          </div>
                        )}
                        <div className="p-3 space-y-1">
                          <p className="text-xs font-bold text-black dark:text-white">
                            {cardTitle || "Free Resource Guide"}
                          </p>
                          <p className="text-[10px] text-black/60 dark:text-white/60">
                            {cardSubtitle || "Instant PDF Download"}
                          </p>
                          {dmText && (
                            <p className="text-xs text-black/75 dark:text-white/75 leading-tight whitespace-pre-line pt-1 border-t border-black/5 dark:border-white/5">
                              {previewText}
                            </p>
                          )}
                        </div>
                        {cardButtons.length > 0 && (
                          <div className="border-t border-black/10 dark:border-white/10 divide-y divide-black/10 dark:divide-white/10">
                            {cardButtons.map((btn, idx) => (
                              <div
                                key={idx}
                                className="py-2.5 text-center text-xs font-bold text-[#0095f6] hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer transition-colors"
                              >
                                {btn.title || "Download PDF"}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : templateType === "card" ? (
                      /* Custom Media Card */
                      <div className="max-w-[94%] overflow-hidden rounded-2xl rounded-tr-xs border border-black/10 bg-white shadow-md dark:border-white/10 dark:bg-[#222222]">
                        {cardImageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={cardImageUrl} alt="Card preview" className="aspect-[1.91/1] w-full object-cover" />
                        ) : (
                          <div className="flex aspect-[1.91/1] w-full flex-col items-center justify-center bg-black/5 dark:bg-white/5 p-2 text-center">
                            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-black/[0.04] dark:bg-white/[0.08] text-[var(--viz-ink)] shadow-2xs">
                              <MediaCardIcon className="h-5 w-5" />
                            </span>
                            <span className="text-xs font-bold text-black dark:text-white mt-1.5">Header Image</span>
                            <span className="text-[9px] text-[var(--viz-muted)]">Image URL preview</span>
                          </div>
                        )}
                        <div className="p-3 space-y-1">
                          {cardTitle && (
                            <p className="text-xs font-bold text-black dark:text-white leading-tight">
                              {cardTitle.replaceAll("{username}", "there")}
                            </p>
                          )}
                          {cardSubtitle && (
                            <p className="text-[10px] text-black/60 dark:text-white/60 leading-tight">
                              {cardSubtitle.replaceAll("{username}", "there")}
                            </p>
                          )}
                          {dmText && (
                            <p className="text-xs text-black/80 dark:text-white/80 pt-1 leading-tight whitespace-pre-line border-t border-black/5 dark:border-white/5">
                              {previewText}
                            </p>
                          )}
                        </div>
                        {cardButtons.length > 0 && (
                          <div className="border-t border-black/10 dark:border-white/10 divide-y divide-black/10 dark:divide-white/10">
                            {cardButtons.map((btn, idx) => (
                              <div
                                key={idx}
                                className="py-2.5 text-center text-xs font-bold text-[#0095f6] hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer transition-colors"
                              >
                                {btn.title || "Button"}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : templateType === "button" ? (
                      /* Text + Buttons: Official Instagram Direct button template */
                      <div className="max-w-[90%] overflow-hidden rounded-2xl rounded-tr-xs border border-black/10 bg-white shadow-md dark:border-white/10 dark:bg-[#222222]">
                        <div className="p-3">
                          <p className="text-xs leading-relaxed text-black dark:text-white whitespace-pre-line">
                            {previewText}
                          </p>
                        </div>
                        {cardButtons.length > 0 ? (
                          <div className="border-t border-black/10 dark:border-white/10 divide-y divide-black/10 dark:divide-white/10 bg-black/[0.01] dark:bg-white/[0.02]">
                            {cardButtons.map((btn, idx) => (
                              <div
                                key={idx}
                                className="py-2.5 text-center text-xs font-bold text-[#0095f6] hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer transition-colors"
                              >
                                {btn.title || `Button #${idx + 1}`}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="border-t border-black/10 dark:border-white/10 p-2 text-center text-[10px] text-[var(--viz-muted)] italic">
                            No buttons added
                          </div>
                        )}
                      </div>
                    ) : (
                      /* Simple Text Bubble: Clean Instagram Direct message */
                      <div className="max-w-[85%] rounded-2xl rounded-tr-xs bg-[#0095f6] px-3.5 py-2.5 text-white shadow-sm">
                        <p className="text-xs leading-relaxed whitespace-pre-line">{previewText}</p>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end pr-1">
                    <span className="text-[9px] text-black/40 dark:text-white/40">Sent • Just now</span>
                  </div>
                </div>

                {/* Instagram Direct bottom chat bar */}
                <div className="border-t border-black/10 bg-white px-3 py-2 dark:border-white/10 dark:bg-[#181818] flex items-center gap-2 shrink-0">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#0095f6] text-white cursor-pointer shadow-xs">
                    <CameraIcon className="h-3.5 w-3.5" />
                  </div>
                  <div className="flex-1 rounded-full bg-black/5 dark:bg-white/10 px-3.5 py-1.5 flex items-center justify-between">
                    <span className="text-xs text-black/40 dark:text-white/40">Message...</span>
                    <div className="flex items-center gap-2 text-black/60 dark:text-white/60">
                      <span className="cursor-pointer hover:text-black dark:hover:text-white transition-colors" title="Voice memo">
                        <MicrophoneIcon className="h-3.5 w-3.5" />
                      </span>
                      <span className="cursor-pointer hover:text-black dark:hover:text-white transition-colors" title="Gallery image">
                        <PhotoIcon className="h-3.5 w-3.5" />
                      </span>
                    </div>
                  </div>
                  <span className="text-red-500 cursor-pointer hover:scale-110 transition-transform p-0.5" title="Like">
                    <HeartIcon className="h-4 w-4 fill-red-500 text-red-500" />
                  </span>
                </div>
              </div>
            </MobilePreview>
            <p className="mt-2 text-center text-[10px] text-[var(--viz-muted)]">
              Interactive Instagram Direct mockup
            </p>
          </div>
        </div>

        {/* Step 3 Footer / Quick Save */}
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--viz-border)] pt-4">
          <div className="flex items-center gap-2 text-xs text-[var(--viz-muted)]">
            <span className={`inline-block h-2 w-2 rounded-full ${dirty ? "bg-amber-500 animate-pulse" : "bg-emerald-500"}`} />
            <span>{dirty ? "Unsaved changes in message template" : "Template saved to automation"}</span>
          </div>
          <button
            type="button"
            onClick={save}
            disabled={saving || !dirty}
            className="flex items-center gap-2 rounded-lg bg-foreground px-4 py-2 text-xs font-semibold text-background shadow hover:opacity-90 disabled:opacity-40 transition-all"
          >
            {saving ? "Saving…" : "Save Template Changes"}
          </button>
        </div>
      </div>

      {/* ── Follow Gate Step ─────────────────────────────────────── */}
      <div className={card}>
        <div className="mb-4 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-black/[0.06] text-[var(--viz-ink)] dark:bg-white/10">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="9" cy="7" r="4" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <div>
              <p className="text-sm font-medium text-[var(--viz-ink)]">4. Require Follow</p>
              <p className="text-xs text-[var(--viz-muted)] mt-0.5">Check if the commenter follows you before sending the DM. If not, send a follow-gate message first.</p>
            </div>
          </div>
          {/* Toggle */}
          <button
            id="require-follow-toggle"
            role="switch"
            aria-checked={requireFollow}
            onClick={() => { setRequireFollow((v) => !v); setDirty(true); }}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${
              requireFollow ? "bg-green-500" : "bg-black/20 dark:bg-white/20"
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                requireFollow ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>

        {requireFollow && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start w-full min-w-0">
            {/* Left Column: Editor & Workflow Explanation (7 cols) */}
            <div className="lg:col-span-7 space-y-5 w-full min-w-0">
              {/* Message Editor Card */}
              <div className="rounded-2xl border border-[var(--viz-border)] bg-[var(--viz-surface)] p-3.5 sm:p-5 shadow-2xs space-y-3.5">
                {/* Header: Title, Subtitle, & Character Counter */}
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                        <MessageSquareIcon className="h-3.5 w-3.5" />
                      </span>
                      <p className="text-xs font-bold text-[var(--viz-ink)]">Follow-Gate Private Message</p>
                    </div>
                    <p className="text-[11px] text-[var(--viz-muted)] leading-relaxed">
                      Sent automatically to commenters who do not follow your account yet.
                    </p>
                  </div>
                  <div className="shrink-0 pt-0.5">
                    <span
                      className={`inline-flex items-center gap-1 font-mono text-[10px] font-semibold tracking-tight whitespace-nowrap px-2.5 py-1 rounded-full border transition-colors ${
                        followGateText.length > 900
                          ? "text-red-500 bg-red-500/10 border-red-500/25"
                          : followGateText.length > 700
                          ? "text-amber-600 bg-amber-500/10 border-amber-500/25"
                          : "text-[var(--viz-muted)] bg-black/[0.03] dark:bg-white/[0.05] border-[var(--viz-border)]/70"
                      }`}
                    >
                      <span>{followGateText.length}</span>
                      <span className="opacity-40">/</span>
                      <span>1000</span>
                    </span>
                  </div>
                </div>

                {/* Textarea */}
                <div className="group rounded-xl border border-[var(--viz-border)] bg-background transition-all focus-within:border-[var(--viz-ink)] focus-within:ring-2 focus-within:ring-black/5 dark:focus-within:ring-white/10 shadow-2xs">
                  <textarea
                    value={followGateText}
                    onChange={(e) => { setFollowGateText(e.target.value.slice(0, 1000)); setDirty(true); }}
                    rows={4}
                    placeholder={"Oh no! It seems you're not following me 🙈\nVisit my profile and hit that follow button 🤩.\nOnce you do, I'll send you what you asked for!"}
                    className="w-full bg-transparent p-3.5 text-xs text-[var(--viz-ink)] placeholder:text-[var(--viz-muted)] outline-none resize-none leading-relaxed min-h-[6rem]"
                  />
                </div>

                {/* Quick Insert Variables: Symmetric 3-Column Grid */}
                <div className="space-y-1.5 pt-0.5">
                  <div className="flex items-center justify-between px-0.5">
                    <span className="text-[10px] font-bold tracking-wider text-[var(--viz-muted)] uppercase">
                      Quick Insert
                    </span>
                    <span className="text-[10px] text-[var(--viz-muted)] opacity-75">
                      Tap to append
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setFollowGateText((t) => (t.endsWith(" ") || !t ? `${t}{username} ` : `${t} {username} `));
                        setDirty(true);
                      }}
                      className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-purple-500/25 bg-purple-500/8 px-2 py-2 text-[11px] font-semibold text-purple-700 dark:text-purple-300 hover:bg-purple-500/15 hover:border-purple-500/40 active:scale-[0.98] transition-all cursor-pointer shadow-2xs"
                    >
                      <span className="font-mono text-[10px] opacity-75">@</span>
                      <span className="truncate">username</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setFollowGateText((t) => (t ? `Hey {username}! 👋\n\n${t}` : "Hey {username}! 👋"));
                        setDirty(true);
                      }}
                      className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-emerald-500/25 bg-emerald-500/8 px-2 py-2 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/15 hover:border-emerald-500/40 active:scale-[0.98] transition-all cursor-pointer shadow-2xs"
                    >
                      <span>👋</span>
                      <span className="truncate">Greeting</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setFollowGateText((t) => (t ? `${t}\n\nHit follow on my profile to unlock! 👇` : "Hit follow on my profile to unlock! 👇"));
                        setDirty(true);
                      }}
                      className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-blue-500/25 bg-blue-500/8 px-2 py-2 text-[11px] font-semibold text-blue-700 dark:text-blue-300 hover:bg-blue-500/15 hover:border-blue-500/40 active:scale-[0.98] transition-all cursor-pointer shadow-2xs"
                    >
                      <span>👇</span>
                      <span className="truncate sm:hidden">Follow CTA</span>
                      <span className="truncate hidden sm:inline">Hit Follow CTA</span>
                    </button>
                  </div>
                </div>

                {/* Preset Templates */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-[var(--viz-border)]">
                  <span className="text-[10px] font-medium text-[var(--viz-muted)]">Presets:</span>
                  <button
                    type="button"
                    onClick={() => {
                      setFollowGateText("Oh no! It seems you're not following me 🙈\n\nVisit my profile and hit that follow button 🤩.\nOnce you do, I'll send you what you asked for!");
                      setDirty(true);
                    }}
                    className="rounded-lg border border-black/10 dark:border-white/10 px-2 py-0.5 text-[10px] text-black/70 dark:text-white/70 hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
                  >
                    Gentle & Friendly
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFollowGateText("Hey {username}! 🎁 This download is exclusive to our Instagram community.\n\nHit follow on our profile, then tap 'I\\'m following' below to unlock your instant access!");
                      setDirty(true);
                    }}
                    className="rounded-lg border border-black/10 dark:border-white/10 px-2 py-0.5 text-[10px] text-black/70 dark:text-white/70 hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
                  >
                    VIP Community
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFollowGateText("Almost there! ✨ Follow our page first, then I\\'ll instantly send your link over!");
                      setDirty(true);
                    }}
                    className="rounded-lg border border-black/10 dark:border-white/10 px-2 py-0.5 text-[10px] text-black/70 dark:text-white/70 hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
                  >
                    Short & Crisp
                  </button>
                </div>
              </div>

              {/* How it Works Workflow Card */}
              <div className="rounded-2xl border border-[var(--viz-border)] bg-[var(--viz-surface)] p-5 shadow-2xs space-y-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                      <BoltIcon className="h-3.5 w-3.5" />
                    </span>
                    <p className="text-xs font-bold text-[var(--viz-ink)]">How Follow-Gate Automation Works</p>
                  </div>
                  <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[9px] font-semibold text-emerald-600 dark:text-emerald-400">
                    Live Webhook Flow
                  </span>
                </div>

                <div className="grid gap-2.5 sm:grid-cols-2 pt-1">
                  <div className="rounded-xl border border-black/5 dark:border-white/5 bg-black/[0.02] dark:bg-white/[0.02] p-3 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-500 text-[10px] font-bold text-white">1</span>
                      <span className="text-xs font-semibold text-[var(--viz-ink)]">Comment Trigger</span>
                    </div>
                    <p className="text-[11px] text-[var(--viz-muted)] leading-relaxed pl-7">
                      User writes your trigger keyword. Instagram webhooks instantly check follow status.
                    </p>
                  </div>

                  <div className="rounded-xl border border-black/5 dark:border-white/5 bg-black/[0.02] dark:bg-white/[0.02] p-3 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold text-white">2</span>
                      <span className="text-xs font-semibold text-[var(--viz-ink)]">Already Following?</span>
                    </div>
                    <p className="text-[11px] text-[var(--viz-muted)] leading-relaxed pl-7">
                      If commenter already follows you, your full template DM is delivered immediately!
                    </p>
                  </div>

                  <div className="rounded-xl border border-black/5 dark:border-white/5 bg-black/[0.02] dark:bg-white/[0.02] p-3 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-purple-500 text-[10px] font-bold text-white">3</span>
                      <span className="text-xs font-semibold text-[var(--viz-ink)]">Gate Message Sent</span>
                    </div>
                    <p className="text-[11px] text-[var(--viz-muted)] leading-relaxed pl-7">
                      If not following, this follow-gate DM is sent with direct profile and confirmation buttons.
                    </p>
                  </div>

                  <div className="rounded-xl border border-black/5 dark:border-white/5 bg-black/[0.02] dark:bg-white/[0.02] p-3 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-pink-500 text-[10px] font-bold text-white">4</span>
                      <span className="text-xs font-semibold text-[var(--viz-ink)]">Instant Delivery</span>
                    </div>
                    <p className="text-[11px] text-[var(--viz-muted)] leading-relaxed pl-7">
                      Once they follow and reply or tap confirmation, the reward is unlocked and sent!
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Authentic Flagship Device Mockup (5 cols) */}
            <div className="lg:col-span-5 flex flex-col items-center sticky top-6 self-start w-full min-w-0 overflow-hidden">
              <div className="w-full max-w-[320px] mb-2.5 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-[var(--viz-ink)] tracking-tight">Follow-Gate Direct</span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-2 py-0.5 text-[9px] font-semibold text-blue-600 dark:text-blue-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
                    Active
                  </span>
                </div>

                {/* Hardware Device Switcher */}
                <div className="flex items-center gap-0.5 rounded-lg bg-black/[0.05] p-0.5 dark:bg-white/10 text-[10px] font-medium">
                  {(["iPhone 17", "Galaxy S25", "Pixel 10"] as SupportedDevice[]).map((dev) => (
                    <button
                      key={dev}
                      type="button"
                      onClick={() => setPreviewDevice(dev)}
                      className={`rounded-md px-2 py-0.5 transition-all cursor-pointer ${
                        previewDevice === dev
                          ? "bg-white font-semibold text-black shadow-xs dark:bg-[#202020] dark:text-white"
                          : "text-black/60 hover:text-black dark:text-white/60 dark:hover:text-white"
                      }`}
                    >
                      {dev.replace(" 17", "").replace(" S25", "").replace(" 10", "")}
                    </button>
                  ))}
                </div>
              </div>

              {/* Proper Hardware Device UI using react-mockframe via MobilePreview */}
              <MobilePreview
                width={320}
                height={650}
                device={previewDevice}
                showToolbar={false}
                className="drop-shadow-2xl"
              >
                <div className="flex flex-col h-full bg-[#f8f9fa] dark:bg-[#121212] justify-between">
                  {/* Instagram Direct Header */}
                  <div className="flex items-center justify-between border-b border-black/10 bg-white px-3.5 py-2.5 dark:border-white/10 dark:bg-[#181818] shrink-0 sticky top-0 z-10">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-xl text-black dark:text-white font-normal leading-none select-none cursor-pointer">‹</span>
                      <div className="relative">
                        <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-[#f9ed32] via-[#ee2a7b] to-[#002aff] p-[1.5px] shadow-xs">
                          <div className="h-full w-full rounded-full bg-white dark:bg-black flex items-center justify-center font-bold text-xs text-black dark:text-white">
                            {rule?.name ? rule.name.charAt(0).toUpperCase() : "F"}
                          </div>
                        </div>
                        <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full border border-white dark:border-black bg-emerald-500" />
                      </div>
                      <div className="truncate min-w-0">
                        <p className="text-xs font-bold text-black dark:text-white truncate flex items-center gap-1 leading-tight">
                          <span>fabroniee</span>
                          <span className="text-[10px] text-[#0095f6]">✓</span>
                        </p>
                        <p className="text-[10px] text-black/50 dark:text-white/50 leading-tight">Active now</p>
                      </div>
                    </div>

                    {/* Header icons: Phone, Video */}
                    <div className="flex items-center gap-2 text-black/70 dark:text-white/70">
                      <span className="p-1 rounded-full hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer transition-colors" title="Audio Call">
                        <PhoneIcon className="h-3.5 w-3.5" />
                      </span>
                      <span className="p-1 rounded-full hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer transition-colors" title="Video Call">
                        <VideoCameraIcon className="h-3.5 w-3.5" />
                      </span>
                    </div>
                  </div>

                  {/* DM Chat Thread */}
                  <div className="flex-1 overflow-y-auto p-3 space-y-3.5 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                    {/* Timestamp separator */}
                    <div className="flex justify-center my-1">
                      <span className="text-[9px] font-medium text-black/40 dark:text-white/40 bg-black/[0.04] dark:bg-white/[0.06] px-2.5 py-0.5 rounded-full">
                        Today 9:41 AM
                      </span>
                    </div>

                    {/* 1. Gate Message (sent by your account to commenter who does NOT follow yet) */}
                    <div className="space-y-1">
                      <div className="flex justify-end">
                        <div className="max-w-[88%] rounded-2xl rounded-tr-xs bg-[#0095f6] p-3 text-white shadow-sm space-y-2.5">
                          <p className="text-xs leading-relaxed whitespace-pre-line font-normal">{gatePreviewText}</p>
                          <div className="space-y-1.5 pt-1 border-t border-white/20">
                            <div className="rounded-xl border border-white/40 bg-white/15 px-3 py-1.5 text-center text-xs font-semibold text-white cursor-pointer hover:bg-white/25 transition-colors flex items-center justify-center gap-1.5">
                              <UserIcon className="h-3.5 w-3.5" />
                              <span>Visit Profile</span>
                            </div>
                            <div className="rounded-xl border border-white/40 bg-white/15 px-3 py-1.5 text-center text-xs font-semibold text-white cursor-pointer hover:bg-white/25 transition-colors flex items-center justify-center gap-1.5">
                              <CheckCircleIcon className="h-3.5 w-3.5" />
                              <span>I&apos;m following</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex justify-end pr-1">
                        <span className="text-[9px] text-black/40 dark:text-white/40">Sent • 9:41 AM</span>
                      </div>
                    </div>

                    {/* 2. User's reply after following (commenter replies on the left) */}
                    <div className="space-y-1">
                      <div className="flex justify-start">
                        <div className="max-w-[75%] rounded-2xl rounded-tl-xs bg-black/[0.07] dark:bg-white/[0.09] px-3.5 py-2.5 shadow-2xs border border-black/5 dark:border-white/5">
                          <p className="text-xs text-black dark:text-white leading-relaxed">Done, I&apos;m following you now :)</p>
                        </div>
                      </div>
                      <div className="flex justify-start pl-1">
                        <span className="text-[9px] text-black/40 dark:text-white/40">9:42 AM</span>
                      </div>
                    </div>

                    {/* Follow Verified Notice / Indicator */}
                    <div className="flex justify-center my-1">
                      <span className="inline-flex items-center gap-1 text-[9px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                        <span>✓</span> Follow verified via Instagram API
                      </span>
                    </div>

                    {/* 3. Real DM automatically delivered as the reward */}
                    <div className="space-y-1">
                      <div className="flex justify-end">
                        {templateType === "product" ? (
                          /* Product Card */
                          <div className="max-w-[94%] overflow-hidden rounded-2xl rounded-tr-xs border border-black/10 bg-white shadow-md dark:border-white/10 dark:bg-[#222222]">
                            {cardImageUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={cardImageUrl} alt="Product preview" className="aspect-[1.91/1] w-full object-cover" />
                            ) : (
                              <div className="flex aspect-[1.91/1] w-full flex-col items-center justify-center bg-gradient-to-br from-indigo-500/15 via-purple-500/15 to-pink-500/15 p-2 text-center">
                                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/80 dark:bg-black/40 text-emerald-600 dark:text-emerald-400 shadow-xs">
                                  <ShoppingBagIcon className="h-5 w-5" />
                                </span>
                                <span className="text-xs font-bold text-black dark:text-white mt-1">Product Showcase</span>
                                <span className="text-[9px] text-[var(--viz-muted)]">Image URL preview</span>
                              </div>
                            )}
                            <div className="p-3 space-y-1">
                              <div className="flex items-center justify-between gap-1">
                                <p className="text-xs font-bold text-black dark:text-white truncate">
                                  {cardTitle || "Featured Product"}
                                </p>
                                {cardSubtitle && (
                                  <span className="shrink-0 rounded-md bg-emerald-500/10 px-1.5 py-0.5 font-bold text-[10px] text-emerald-600 dark:text-emerald-400">
                                    {cardSubtitle}
                                  </span>
                                )}
                              </div>
                              {dmText && (
                                <p className="text-xs text-black/75 dark:text-white/75 leading-tight whitespace-pre-line pt-1 border-t border-black/5 dark:border-white/5">
                                  {previewText}
                                </p>
                              )}
                            </div>
                            {cardButtons.length > 0 && (
                              <div className="border-t border-black/10 dark:border-white/10 divide-y divide-black/10 dark:divide-white/10">
                                {cardButtons.map((btn, idx) => (
                                  <div
                                    key={idx}
                                    className="py-2.5 text-center text-xs font-bold text-[#0095f6] hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer transition-colors"
                                  >
                                    {btn.title || "Shop Now"}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ) : templateType === "file" ? (
                          /* Downloadable File / Lead Magnet Card */
                          <div className="max-w-[94%] overflow-hidden rounded-2xl rounded-tr-xs border border-black/10 bg-white shadow-md dark:border-white/10 dark:bg-[#222222]">
                            {cardImageUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={cardImageUrl} alt="Resource cover" className="aspect-[1.91/1] w-full object-cover" />
                            ) : (
                              <div className="flex aspect-[1.91/1] w-full items-center gap-3 bg-gradient-to-r from-red-500/10 via-amber-500/10 to-orange-500/10 p-3">
                                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-red-500 text-white font-black text-xs shadow-sm">
                                  PDF
                                </div>
                                <div className="min-w-0">
                                  <span className="rounded bg-red-500/20 px-1.5 py-0.5 text-[9px] font-bold text-red-600 dark:text-red-400">
                                    Instant Resource
                                  </span>
                                  <p className="text-xs font-bold text-black dark:text-white truncate mt-0.5">
                                    {cardTitle || "Free Resource Guide"}
                                  </p>
                                  <p className="text-[10px] text-[var(--viz-muted)] truncate">
                                    {cardSubtitle || "Direct PDF Download"}
                                  </p>
                                </div>
                              </div>
                            )}
                            <div className="p-3 space-y-1">
                              <p className="text-xs font-bold text-black dark:text-white">
                                {cardTitle || "Free Resource Guide"}
                              </p>
                              <p className="text-[10px] text-black/60 dark:text-white/60">
                                {cardSubtitle || "Instant PDF Download"}
                              </p>
                              {dmText && (
                                <p className="text-xs text-black/75 dark:text-white/75 leading-tight whitespace-pre-line pt-1 border-t border-black/5 dark:border-white/5">
                                  {previewText}
                                </p>
                              )}
                            </div>
                            {cardButtons.length > 0 && (
                              <div className="border-t border-black/10 dark:border-white/10 divide-y divide-black/10 dark:divide-white/10">
                                {cardButtons.map((btn, idx) => (
                                  <div
                                    key={idx}
                                    className="py-2.5 text-center text-xs font-bold text-[#0095f6] hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer transition-colors"
                                  >
                                    {btn.title || "Download PDF"}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ) : templateType === "card" ? (
                          /* Custom Media Card */
                          <div className="max-w-[94%] overflow-hidden rounded-2xl rounded-tr-xs border border-black/10 bg-white shadow-md dark:border-white/10 dark:bg-[#222222]">
                            {cardImageUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={cardImageUrl} alt="Card preview" className="aspect-[1.91/1] w-full object-cover" />
                            ) : (
                              <div className="flex aspect-[1.91/1] w-full flex-col items-center justify-center bg-gradient-to-br from-indigo-500/20 via-purple-500/20 to-pink-500/20 p-2 text-center">
                                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/80 dark:bg-black/40 text-indigo-600 dark:text-indigo-400 shadow-xs">
                                  <MediaCardIcon className="h-5 w-5" />
                                </span>
                                <span className="text-xs font-bold text-black dark:text-white mt-1">Header Image</span>
                                <span className="text-[9px] text-[var(--viz-muted)]">Image URL preview</span>
                              </div>
                            )}
                            <div className="p-3 space-y-1">
                              {cardTitle && (
                                <p className="text-xs font-bold text-black dark:text-white leading-tight">
                                  {cardTitle.replaceAll("{username}", "there")}
                                </p>
                              )}
                              {cardSubtitle && (
                                <p className="text-[10px] text-black/60 dark:text-white/60 leading-tight">
                                  {cardSubtitle.replaceAll("{username}", "there")}
                                </p>
                              )}
                              {dmText && (
                                <p className="text-xs text-black/80 dark:text-white/80 pt-1 leading-tight whitespace-pre-line border-t border-black/5 dark:border-white/5">
                                  {previewText}
                                </p>
                              )}
                            </div>
                            {cardButtons.length > 0 && (
                              <div className="border-t border-black/10 dark:border-white/10 divide-y divide-black/10 dark:divide-white/10">
                                {cardButtons.map((btn, idx) => (
                                  <div
                                    key={idx}
                                    className="py-2.5 text-center text-xs font-bold text-[#0095f6] hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer transition-colors"
                                  >
                                    {btn.title || "Button"}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ) : templateType === "button" ? (
                          /* Text + Buttons: Official Instagram Direct button template */
                          <div className="max-w-[90%] overflow-hidden rounded-2xl rounded-tr-xs border border-black/10 bg-white shadow-md dark:border-white/10 dark:bg-[#222222]">
                            <div className="p-3">
                              <p className="text-xs leading-relaxed text-black dark:text-white whitespace-pre-line">
                                {previewText}
                              </p>
                            </div>
                            {cardButtons.length > 0 ? (
                              <div className="border-t border-black/10 dark:border-white/10 divide-y divide-black/10 dark:divide-white/10 bg-black/[0.01] dark:bg-white/[0.02]">
                                {cardButtons.map((btn, idx) => (
                                  <div
                                    key={idx}
                                    className="py-2.5 text-center text-xs font-bold text-[#0095f6] hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer transition-colors"
                                  >
                                    {btn.title || `Button #${idx + 1}`}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="border-t border-black/10 dark:border-white/10 p-2 text-center text-[10px] text-[var(--viz-muted)] italic">
                                No buttons added
                              </div>
                            )}
                          </div>
                        ) : (
                          /* Simple Text Bubble: Clean Instagram Direct message */
                          <div className="max-w-[85%] rounded-2xl rounded-tr-xs bg-[#0095f6] px-3.5 py-2.5 text-white shadow-sm">
                            <p className="text-xs leading-relaxed whitespace-pre-line">{previewText}</p>
                          </div>
                        )}
                      </div>

                      <div className="flex justify-end pr-1">
                        <span className="text-[9px] text-black/40 dark:text-white/40">Sent • Just now</span>
                      </div>
                    </div>
                  </div>

                  {/* Instagram Direct bottom chat bar */}
                  <div className="border-t border-black/10 bg-white px-3 py-2 dark:border-white/10 dark:bg-[#181818] flex items-center gap-2 shrink-0">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#0095f6] text-white cursor-pointer shadow-xs">
                      <CameraIcon className="h-3.5 w-3.5" />
                    </div>
                    <div className="flex-1 rounded-full bg-black/5 dark:bg-white/10 px-3.5 py-1.5 flex items-center justify-between">
                      <span className="text-xs text-black/40 dark:text-white/40">Message...</span>
                      <div className="flex items-center gap-2 text-black/60 dark:text-white/60">
                        <span className="cursor-pointer hover:text-black dark:hover:text-white transition-colors" title="Voice memo">
                          <MicrophoneIcon className="h-3.5 w-3.5" />
                        </span>
                        <span className="cursor-pointer hover:text-black dark:hover:text-white transition-colors" title="Gallery image">
                          <PhotoIcon className="h-3.5 w-3.5" />
                        </span>
                      </div>
                    </div>
                    <span className="text-red-500 cursor-pointer hover:scale-110 transition-transform p-0.5" title="Like">
                      <HeartIcon className="h-4 w-4 fill-red-500 text-red-500" />
                    </span>
                  </div>
                </div>
              </MobilePreview>
              <p className="mt-2 text-center text-[10px] text-[var(--viz-muted)]">
                Follow-gate conversation preview
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ── Overlay Modal: Choose Target Post ────────────────────── */}
      <Modal
        open={pickerOpen}
        onCancel={() => setPickerOpen(false)}
        footer={null}
        closable={false}
        width={760}
        centered
        className="!p-0 overflow-hidden"
        styles={{
          body: { padding: 0 },
        }}
      >
        <div className="flex flex-col max-h-[80vh] bg-[var(--viz-surface)] text-[var(--viz-ink)]">
          {/* Modal Header */}
          <div className="flex items-center justify-between px-6 py-4.5 border-b border-[var(--viz-border)] bg-black/[0.02] dark:bg-white/[0.02]">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-pink-500/15 via-purple-500/15 to-indigo-500/15 text-pink-600 dark:text-pink-400 border border-pink-500/20 shadow-2xs">
                <InstagramIcon className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[var(--viz-ink)]">Select Instagram Post or Reel</h3>
                <p className="text-xs text-[var(--viz-muted)]">
                  Choose which specific post will trigger this automation.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setPickerOpen(false)}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--viz-muted)] hover:bg-black/5 hover:text-[var(--viz-ink)] dark:hover:bg-white/5 transition-colors cursor-pointer"
              title="Close modal"
              aria-label="Close"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Modal Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {/* Error Alert */}
            {postsError && (
              <div className="flex items-center justify-between rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-600">
                <span>{postsError}</span>
                <button
                  type="button"
                  onClick={() => {
                    setPosts(null);
                    openPicker();
                  }}
                  className="font-semibold underline hover:no-underline ml-2"
                >
                  Retry
                </button>
              </div>
            )}

            {/* Loading Skeletons */}
            {!posts && !postsError && (
              <div className="space-y-2.5">
                <p className="text-xs text-[var(--viz-muted)] animate-pulse">Loading recent posts from Instagram…</p>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                    <div key={i} className="aspect-square rounded-xl bg-black/5 dark:bg-white/5 animate-pulse" />
                  ))}
                </div>
              </div>
            )}

            {/* Empty State */}
            {posts && posts.length === 0 && (
              <div className="py-10 text-center text-xs text-[var(--viz-muted)]">
                No published feed posts found on your connected Instagram account.
              </div>
            )}

            {/* Post Grid */}
            {posts && posts.length > 0 && (
              <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-4">
                {posts.map((p) => {
                  const isSelected = rule.mediaId === p.mediaId;
                  return (
                    <div
                      key={p.mediaId}
                      onClick={() => choosePost(p)}
                      className={`group relative flex flex-col overflow-hidden rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? "border-pink-500 ring-2 ring-pink-500/40 shadow-sm bg-pink-500/5"
                          : "border-[var(--viz-border)] hover:border-[var(--viz-ink)]/50 hover:shadow-md bg-background"
                      }`}
                    >
                      <div className="relative aspect-square w-full overflow-hidden bg-black/5 dark:bg-white/5">
                        {p.thumb ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={p.thumb}
                            alt={p.caption || "Post"}
                            referrerPolicy="no-referrer"
                            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-xs text-[var(--viz-muted)]">
                            No image
                          </div>
                        )}

                        {isSelected && (
                          <div className="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-pink-600 text-white text-[11px] font-bold shadow-md">
                            ✓
                          </div>
                        )}

                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <span className="rounded-lg bg-white/95 px-2.5 py-1 text-xs font-bold text-slate-900 shadow-xs backdrop-blur-xs">
                            {isSelected ? "Selected" : "Select Post"}
                          </span>
                        </div>
                      </div>

                      {p.caption && (
                        <div className="p-2">
                          <p className="text-[11px] text-[var(--viz-ink-2)] line-clamp-2 leading-snug">
                            {p.caption}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="flex items-center justify-between px-6 py-3 border-t border-[var(--viz-border)] bg-black/[0.02] dark:bg-white/[0.02]">
            <span className="text-[11px] text-[var(--viz-muted)]">
              {posts ? `${posts.length} post${posts.length === 1 ? "" : "s"} available` : ""}
            </span>
            <button
              type="button"
              onClick={() => setPickerOpen(false)}
              className="rounded-lg border border-[var(--viz-border)] bg-background px-3.5 py-1.5 text-xs font-medium text-[var(--viz-ink)] hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>

      {/* ── Activity Log ──────────────────────────────────────── */}
      <div className={`${card} space-y-4`}>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-[var(--viz-ink)]">Activity Log</h2>
            <p className="text-xs text-[var(--viz-muted)]">
              Every comment that triggered this automation — what they wrote, why it matched, and what was sent
            </p>
          </div>
          <button
            onClick={refreshLogs}
            disabled={logsLoading}
            className="flex items-center gap-1.5 rounded-lg border border-[var(--viz-border)] px-3 py-1.5 text-xs font-medium text-[var(--viz-ink-2)] transition-colors hover:bg-black/[0.04] disabled:opacity-50 dark:hover:bg-white/[0.06]"
          >
            <svg className={`h-3 w-3 ${logsLoading ? "animate-spin" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Refresh
          </button>
        </div>

        {logsError && (
          <p className="rounded-md border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-600">{logsError}</p>
        )}

        {/* Skeleton */}
        {logs === null && !logsError && (
          <div className="space-y-3 py-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-20 animate-pulse rounded-xl bg-black/[0.04] dark:bg-white/[0.06]" />
            ))}
          </div>
        )}

        {/* Empty state */}
        {logs?.length === 0 && (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-[var(--viz-border)] py-12 text-center">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--viz-accent)]/10 text-[var(--viz-accent)]">
              <BoltIcon className="h-5 w-5" />
            </span>
            <p className="max-w-xs text-sm text-[var(--viz-muted)]">
              No activity yet. Once comments match this automation&apos;s keywords, each trigger will appear here.
            </p>
          </div>
        )}

        {/* Entries */}
        {logs && logs.length > 0 && (
          <ol className="space-y-3">
            {logs.map((log) => {
              const highlightComment = () => {
                if (!log.commentText) return <span className="italic text-[var(--viz-muted)]">Comment text not available</span>;
                if (!log.matchedKeyword) return <>{log.commentText}</>;
                const lower = log.commentText.toLowerCase();
                const kw = log.matchedKeyword.toLowerCase();
                const idx = lower.indexOf(kw);
                if (idx === -1) return <>{log.commentText}</>;
                return (
                  <>
                    {log.commentText.slice(0, idx)}
                    <mark className="rounded bg-amber-200 px-0.5 text-amber-900 dark:bg-amber-400/30 dark:text-amber-200">
                      {log.commentText.slice(idx, idx + log.matchedKeyword.length)}
                    </mark>
                    {log.commentText.slice(idx + log.matchedKeyword.length)}
                  </>
                );
              };
              return (
                <li key={log.id} className="relative flex gap-4 rounded-2xl border border-[var(--viz-border)] bg-gradient-to-b from-transparent to-black/[0.01] p-4 transition-shadow hover:shadow-sm dark:to-white/[0.01]">
                  {/* Post thumbnail */}
                  <div className="shrink-0">
                    {log.mediaThumb ? (
                      log.mediaPermalink ? (
                        <a href={log.mediaPermalink} target="_blank" rel="noreferrer">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={log.mediaThumb} alt="Post" referrerPolicy="no-referrer" className="h-14 w-14 rounded-xl object-cover ring-1 ring-black/10 hover:opacity-80 dark:ring-white/10" />
                        </a>
                      ) : (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={log.mediaThumb} alt="Post" referrerPolicy="no-referrer" className="h-14 w-14 rounded-xl object-cover ring-1 ring-black/10 dark:ring-white/10" />
                      )
                    ) : (
                      <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-slate-100 text-slate-400 dark:bg-white/10">
                        <InstagramIcon className="h-5 w-5 opacity-50" />
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="min-w-0 flex-1 space-y-2.5">
                    {/* Header row */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold text-[var(--viz-ink)]">@{log.username || "unknown"}</span>
                      <span className="text-[var(--viz-muted)]">·</span>
                      <span className="text-xs text-[var(--viz-muted)]">{when(log.triggeredAt)}</span>
                      <StatusBadge status={log.status} />
                      {log.repliedAt && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-violet-500/10 px-2 py-0.5 text-[11px] font-semibold text-violet-700 ring-1 ring-inset ring-violet-500/20 dark:text-violet-300">
                          ↩ Replied back
                        </span>
                      )}
                    </div>

                    {/* Comment bubble */}
                    <div className="space-y-1">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--viz-muted)] flex items-center gap-1.5">
                        <CommentIcon className="h-3 w-3" />
                        <span>Their comment</span>
                      </p>
                      <div className="inline-flex max-w-full rounded-2xl rounded-tl-sm bg-slate-100 px-3.5 py-2 dark:bg-white/10">
                        <p className="break-words text-sm text-[var(--viz-ink)]">{highlightComment()}</p>
                      </div>
                    </div>

                    {/* Why triggered */}
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--viz-muted)] flex items-center gap-1.5">
                        <BoltIcon className="h-3 w-3 text-amber-500" />
                        <span>Triggered because</span>
                      </p>
                      {log.matchedKeyword ? (
                        <span className="rounded-md bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800 dark:bg-amber-400/20 dark:text-amber-200">
                          keyword matched: &ldquo;{log.matchedKeyword}&rdquo;
                        </span>
                      ) : (
                        <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-500 dark:bg-white/10">
                          any comment (no keyword filter)
                        </span>
                      )}
                    </div>

                    {/* DM content */}
                    {log.dmText && (
                      <div className="space-y-1">
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--viz-muted)] flex items-center gap-1.5">
                          {log.status === "sent" || log.status === "follow_verified" ? (
                            <>
                              <SendIcon className="h-3 w-3 text-emerald-500" />
                              <span>DM sent</span>
                            </>
                          ) : log.status === "follow_gate" ? (
                            <>
                              <BoltIcon className="h-3 w-3 text-amber-500" />
                              <span>Follow gate sent</span>
                            </>
                          ) : log.status === "invited" ? (
                            <>
                              <LinkIcon className="h-3 w-3 text-blue-500" />
                              <span>Invite sent</span>
                            </>
                          ) : (
                            <>
                              <span className="text-red-500 font-bold">✕</span>
                              <span>DM failed</span>
                            </>
                          )}
                        </p>
                        {log.status === "failed" ? (
                          <p className="text-xs text-red-600 dark:text-red-400">{log.note ?? "DM could not be delivered."}</p>
                        ) : log.status === "follow_gate" && log.pendingFollowGate ? (
                          <div className="inline-flex max-w-full rounded-2xl rounded-tr-sm bg-amber-50 px-3.5 py-2 dark:bg-amber-400/10">
                            <p className="break-words text-sm text-amber-800 dark:text-amber-200">⏳ Waiting for user to follow and confirm…</p>
                          </div>
                        ) : (
                          <div className="inline-flex max-w-full rounded-2xl rounded-tr-sm bg-[var(--viz-accent)]/10 px-3.5 py-2">
                            <p className="break-words text-sm text-[var(--viz-ink)]">{log.dmText.replaceAll("{username}", log.username || "there")}</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Timestamps */}
                    {log.dmSentAt && (
                      <p className="text-[11px] text-[var(--viz-muted)]">
                        DM delivered {when(log.dmSentAt)}
                        {log.repliedAt && <> · Customer replied {when(log.repliedAt)}</>}
                      </p>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </div>

      {/* Floating Unsaved Changes Bar */}
      {dirty && (
        <div className="fixed bottom-4 sm:bottom-6 left-1/2 z-50 flex max-w-[calc(100vw-1.5rem)] -translate-x-1/2 items-center gap-2 sm:gap-3 rounded-full border border-[var(--viz-border)] bg-background/95 px-3.5 sm:px-5 py-2 sm:py-2.5 shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-3 duration-200">
          <span className="flex h-2 sm:h-2.5 w-2 sm:w-2.5 shrink-0 rounded-full bg-amber-500 animate-pulse" />
          <span className="text-[11px] sm:text-xs font-semibold text-[var(--viz-ink)] truncate">Unsaved changes</span>
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="shrink-0 flex items-center gap-1.5 rounded-full bg-foreground px-3 sm:px-4 py-1.5 text-[11px] sm:text-xs font-semibold text-background shadow hover:opacity-90 disabled:opacity-50 transition-all"
          >
            {saving ? "Saving…" : "Save Changes"}
          </button>
          <button
            type="button"
            onClick={() => {
              if (!rule) return;
              setName(rule.name);
              setKeywordDraft(rule.keywords);
              setDmText(rule.dmText);
              setRequireFollow(rule.requireFollow ?? false);
              setFollowGateText(rule.followGateText ?? "");
              setTemplateType(rule.templateType || "text");
              setCardTitle(rule.cardTitle ?? "");
              setCardSubtitle(rule.cardSubtitle ?? "");
              setCardImageUrl(rule.cardImageUrl ?? "");
              setCardFileUrl(rule.cardFileUrl ?? "");
              setCardButtons(rule.cardButtons ?? []);
              setDirty(false);
            }}
            className="rounded-full px-2.5 py-1 text-xs text-[var(--viz-muted)] hover:text-[var(--viz-ink)] transition-colors"
          >
            Discard
          </button>
        </div>
      )}
    </div>
  );
}

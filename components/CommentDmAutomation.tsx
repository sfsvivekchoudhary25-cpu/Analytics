"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Modal, Tooltip } from "antd";
import { api } from "@/lib/api";
import {
  ArrowLeftIcon,
  BoltIcon,
  GearIcon,
  PencilIcon,
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
import { CommentDmFlowPhone, type FlowStep } from "./CommentDmFlowPhone";

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
  recoveryEnabled?: boolean;
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

const card = "rounded-2xl border border-[var(--viz-border)] bg-[var(--viz-surface)] p-3.5 sm:p-5 shadow-sm w-full min-w-0 [overflow-anchor:none]";

/**
 * Captures current scroll position and locks it across consecutive
 * animation frames so asynchronous React reconciliation or browser layout
 * shifts cannot automatically scroll the page down.
 */
function preserveScroll<T>(action: () => T): T {
  const scrollY = typeof window !== "undefined" ? window.scrollY : 0;
  const result = action();
  if (typeof window !== "undefined") {
    window.scrollTo({ top: scrollY, behavior: "instant" });
    requestAnimationFrame(() => {
      window.scrollTo({ top: scrollY, behavior: "instant" });
      requestAnimationFrame(() => {
        window.scrollTo({ top: scrollY, behavior: "instant" });
      });
    });
  }
  return result;
}

/**
 * Universal click wrapper for buttons:
 * 1. Stops default browser navigation/jump
 * 2. Stops event bubbling
 * 3. Immediately blurs the button so browser focus engine does not scroll it into view
 * 4. Preserves scroll position across React state transitions
 */
function handleButtonClick(e: React.MouseEvent<any>, action: () => void) {
  e.preventDefault();
  e.stopPropagation();
  if (e.currentTarget && typeof (e.currentTarget as HTMLElement).blur === "function") {
    (e.currentTarget as HTMLElement).blur();
  }
  preserveScroll(action);
}

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
  const [recoveryEnabled, setRecoveryEnabled] = useState(false);
  const [followGateText, setFollowGateText] = useState("");
  const [templateType, setTemplateType] = useState<"text" | "button" | "product" | "file" | "card">("text");
  const [cardTitle, setCardTitle] = useState("");
  const [cardSubtitle, setCardSubtitle] = useState("");
  const [cardImageUrl, setCardImageUrl] = useState("");
  const [cardFileUrl, setCardFileUrl] = useState("");
  const [cardButtons, setCardButtons] = useState<MessageButton[]>([]);
  const [previewDevice, setPreviewDevice] = useState<SupportedDevice>("iPhone 17");
  // The one shared phone: which step it follows, whether the small-screen preview is open, and how tall it can be.
  const [activeStep, setActiveStep] = useState<FlowStep>("target");
  const [phoneOpen, setPhoneOpen] = useState(false);
  const [phoneHeight, setPhoneHeight] = useState(650);
  const stepsRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const fit = () => setPhoneHeight(Math.max(520, Math.min(650, window.innerHeight - 170)));
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, []);
  // The phone shows the step being edited: the last step whose top has passed the upper part of the screen, or the
  // one you click or type into.
  useEffect(() => {
    const root = stepsRef.current;
    if (!root) return;
    let frame = 0;
    const order: FlowStep[] = ["target", "trigger", "follow", "message", "reminder"];
    const update = () => {
      frame = 0;
      let current: FlowStep = order[0];
      for (const step of order) {
        const el = root.querySelector<HTMLElement>('[data-step="' + step + '"]');
        if (el && el.getBoundingClientRect().top <= window.innerHeight * 0.4) current = step;
      }
      setActiveStep(current);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    const onFocus = (e: FocusEvent) => {
      const step = (e.target as HTMLElement | null)?.closest?.("[data-step]")?.getAttribute("data-step") as FlowStep | null;
      if (step) setActiveStep(step);
    };
    document.addEventListener("scroll", onScroll, true);
    root.addEventListener("focusin", onFocus);
    update();
    return () => {
      document.removeEventListener("scroll", onScroll, true);
      root.removeEventListener("focusin", onFocus);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [!!rule]);
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
        setRecoveryEnabled(r.recoveryEnabled ?? false);
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
        setCardButtons((r.cardButtons ?? []).map((b) => (b.type === "web_url" ? b : { type: "web_url" as const, title: b.title, url: "https://instagram.com" })));
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

  // Always reset scroll to top when mounting or switching automation rules
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "instant" });
    }
  }, [ruleId]);

  function addButton(preset?: Partial<MessageButton>) {
    preserveScroll(() => {
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
    });
  }

  function updateButton(index: number, patch: Partial<MessageButton>) {
    preserveScroll(() => {
      setCardButtons((prev) => {
        const copy = [...prev];
        copy[index] = { ...copy[index], ...patch };
        if (copy[index].title.length > 20) {
          copy[index].title = copy[index].title.slice(0, 20);
        }
        return copy;
      });
      setDirty(true);
    });
  }

  function removeButton(index: number) {
    preserveScroll(() => {
      setCardButtons((prev) => prev.filter((_, i) => i !== index));
      setDirty(true);
    });
  }

  function selectTemplate(type: "text" | "button" | "product" | "file" | "card") {
    preserveScroll(() => {
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
    });
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
    preserveScroll(() => {
      setKeywordDraft(keywords.filter((x) => x !== k).join(", "));
      setDirty(true);
    });
  };
  const addKeyword = (raw: string) => {
    const k = raw.trim();
    if (!k || keywords.includes(k)) return;
    preserveScroll(() => {
      setKeywordDraft([...keywords, k].join(", "));
      setDirty(true);
    });
  };

  async function save() {
    if (!rule) return;
    const scrollY = typeof window !== "undefined" ? window.scrollY : 0;
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
          recoveryEnabled,
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
      if (typeof window !== "undefined") {
        requestAnimationFrame(() => {
          window.scrollTo({ top: scrollY, behavior: "instant" });
        });
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive() {
    if (!rule) return;
    const scrollY = typeof window !== "undefined" ? window.scrollY : 0;
    setError(null);
    try {
      const updated = await api<Rule>(basePath, { method: "PUT", body: JSON.stringify({ enabled: !rule.enabled }) });
      setRule(updated);
      if (typeof window !== "undefined") {
        requestAnimationFrame(() => {
          window.scrollTo({ top: scrollY, behavior: "instant" });
        });
      }
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

  const phoneProps = {
    activeStep,
    device: previewDevice,
    onDeviceChange: setPreviewDevice,
    ruleName: name || rule.name,
    keywords,
    templateType,
    dmText,
    previewText,
    gatePreviewText,
    cardImageUrl,
    cardTitle,
    cardSubtitle,
    cardButtons,
    requireFollow,
    recoveryEnabled,
  };

  return (
    <div className="w-full max-w-full min-w-0 space-y-5 sm:space-y-6 [overflow-anchor:none]">
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
            type="button"
            onClick={(e) => handleButtonClick(e, save)}
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

      {/* Header Card: icon, editable name, live/paused switch, what it does, key settings at a glance */}
      <div className="rounded-3xl border border-[var(--viz-border)] bg-[var(--viz-surface)] shadow-2xs [overflow-anchor:none]">
        <div className="p-4 sm:p-6">
          <div className="flex items-start gap-3.5 sm:gap-4">
            <span className="flex h-11 w-11 sm:h-14 sm:w-14 shrink-0 items-center justify-center rounded-2xl bg-foreground text-background shadow-xs ring-4 ring-black/[0.04] dark:ring-white/[0.06]">
              <BoltIcon className="h-5 w-5 sm:h-6 sm:w-6" />
            </span>

            <div className="min-w-0 flex-1">
              <div className="flex flex-col items-start gap-2.5 sm:flex-row sm:justify-between sm:gap-3">
                <div className="min-w-0 w-full flex-1">
                  <p className="text-[11px] font-medium uppercase tracking-wider text-[var(--viz-muted)]">Comment-to-DM</p>
                  <div className="mt-0.5">
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
                                        type="button"
                                        onClick={(e) => handleButtonClick(e, () => setEditingName(true))}
                                        aria-label="Rename automation"
                                        title="Rename automation"
                                        className="p-1 rounded-md text-[var(--viz-muted)] hover:text-[var(--viz-ink)] hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-colors"
                                      >
                                        <PencilIcon className="h-3.5 w-3.5" />
                                      </button>
                                    )}
                                  </div>
                  </div>
                </div>

                {/* Live / Paused switch */}
                <button
                  type="button"
                  role="switch"
                  aria-checked={rule.enabled}
                  aria-label={rule.enabled ? "Pause this automation" : "Turn this automation on"}
                  onClick={(e) => handleButtonClick(e, toggleActive)}
                  className={`group shrink-0 inline-flex items-center gap-2 rounded-full border py-1 pl-3 pr-1 text-xs font-medium transition-colors active:scale-95 ${
                    rule.enabled
                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                      : "border-[var(--viz-border)] bg-black/[0.03] text-[var(--viz-ink-2)] dark:bg-white/[0.05]"
                  }`}
                >
                  <span>{rule.enabled ? "Live" : "Paused"}</span>
                  <span
                    className={`relative h-5 w-9 rounded-full transition-colors ${rule.enabled ? "bg-emerald-500" : "bg-neutral-300 dark:bg-neutral-600"}`}
                  >
                    <span
                      className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-all ${rule.enabled ? "left-[18px]" : "left-0.5"}`}
                    />
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* Mobile-Only Action Buttons: Balanced, full-width thumb-friendly buttons */}
          <div className="flex sm:hidden items-center gap-2 pt-3 mt-3 border-t border-[var(--viz-border)]/60">
            <button
              type="button"
              onClick={(e) => handleButtonClick(e, save)}
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
              type="button"
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

      {/* Two columns on tablets and up: every step scrolls on the left, ONE phone stays on the right */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_340px] xl:grid-cols-[minmax(0,1fr)_380px] lg:gap-6 items-start w-full min-w-0">
      <div ref={stepsRef} className="min-w-0 w-full space-y-5 sm:space-y-6">
      {/* ── Steps 1 & 2: Trigger Keywords & Target Post ────────── */}
      <div id="step-trigger-target" className="grid grid-cols-1 2xl:grid-cols-2 gap-4 sm:gap-5 w-full min-w-0">
        {/* Step 1: Target Post */}
        <div data-step="target" className="rounded-2xl border border-[var(--viz-border)] bg-[var(--viz-surface)] p-3.5 sm:p-5 shadow-2xs flex flex-col justify-between space-y-3.5 transition-all w-full min-w-0 [overflow-anchor:none]">
          <div className="space-y-3">
            {/* Header: Icon + Title + Info Tooltip + Status/Switch Link */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-black/[0.04] dark:bg-white/[0.06] text-[var(--viz-ink)] border border-[var(--viz-border)] shadow-2xs">
                  <InstagramIcon className="h-4 w-4" />
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-bold text-[var(--viz-ink)]">1. Target Post</span>
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
                          onClick={(e) => handleButtonClick(e, openPicker)}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--viz-border)] bg-[var(--viz-surface)] px-3 py-1.5 text-xs font-semibold text-[var(--viz-ink)] shadow-2xs hover:bg-black/5 dark:hover:bg-white/5 active:scale-95 transition-all cursor-pointer"
                        >
                          <RefreshIcon className="h-3 w-3 text-[var(--viz-muted)]" />
                          <span>Change Post</span>
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleButtonClick(e, clearPost)}
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
                  onClick={(e) => handleButtonClick(e, openPicker)}
                  className="shrink-0 rounded-xl bg-foreground px-3 sm:px-3.5 py-2 text-xs font-bold text-background shadow-xs hover:opacity-90 active:scale-95 transition-all cursor-pointer whitespace-nowrap"
                >
                  Choose Post
                </button>
              </div>
            )}
          </div>
        </div>
        {/* Step 2: Trigger Condition */}
        <div data-step="trigger" className="rounded-2xl border border-[var(--viz-border)] bg-[var(--viz-surface)] p-3.5 sm:p-5 shadow-2xs flex flex-col justify-between space-y-3.5 transition-all w-full min-w-0 [overflow-anchor:none]">
          <div className="space-y-3">
            {/* Header: Icon + Title + Info Tooltip */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-black/[0.04] dark:bg-white/[0.06] text-[var(--viz-ink)] border border-[var(--viz-border)] shadow-2xs">
                  <BoltIcon className="h-4 w-4" />
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-bold text-[var(--viz-ink)]">2. Trigger Condition</span>
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
                onClick={(e) =>
                  handleButtonClick(e, () => {
                    setTriggerMode("keywords");
                    if (keywords.length === 0) {
                      setKeywordDraft("NICE, PERFECT");
                      setDirty(true);
                    }
                  })
                }
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
                onClick={(e) =>
                  handleButtonClick(e, () => {
                    setTriggerMode("any");
                    setKeywordDraft("");
                    setDirty(true);
                  })
                }
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
                        onClick={(e) => handleButtonClick(e, () => removeKeyword(k))}
                        aria-label={`Remove keyword ${k}`}
                        className="flex h-3.5 w-3.5 items-center justify-center rounded text-[var(--viz-muted)] hover:text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
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
                      onClick={(e) =>
                        handleButtonClick(e, () => {
                          addKeyword(keywordInput);
                          setKeywordInput("");
                        })
                      }
                      className="rounded-lg bg-foreground px-2.5 py-1 text-[11px] font-semibold text-background shadow-2xs hover:opacity-90 active:scale-95 transition-all cursor-pointer"
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
                        onClick={(e) => handleButtonClick(e, () => addKeyword(preset))}
                        className="rounded-full border border-[var(--viz-border)] bg-black/[0.015] dark:bg-white/[0.02] px-2.5 py-0.5 text-[10px] font-medium text-[var(--viz-ink-2)] hover:bg-black/5 dark:hover:bg-white/5 active:scale-95 transition-all select-none focus:outline-none cursor-pointer"
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

      </div>

      {/* ── Step 3: Follow Gate ─────────────────────────────────────── */}
      <div data-step="follow" className={card}>
        <div className={`flex items-start justify-between gap-4 ${requireFollow ? "mb-4" : ""}`}>
          <div className="flex items-start gap-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-black/[0.06] text-[var(--viz-ink)] dark:bg-white/10">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="9" cy="7" r="4" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <div>
              <p className="text-sm font-medium text-[var(--viz-ink)]">3. Require Follow</p>
              <p className="text-xs text-[var(--viz-muted)] mt-0.5">Check if the commenter follows you before sending the DM. If not, send a follow-gate message first.</p>
            </div>
          </div>
          {/* Toggle */}
          <button
            id="require-follow-toggle"
            role="switch"
            aria-checked={requireFollow}
            onClick={(e) =>
              handleButtonClick(e, () => {
                setRequireFollow((v) => !v);
                setDirty(true);
              })
            }
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
          <div className="rounded-xl border border-[var(--viz-border)] bg-background transition-all focus-within:border-[var(--viz-ink)] focus-within:ring-2 focus-within:ring-black/5 dark:focus-within:ring-white/10">
            <textarea
              value={followGateText}
              onChange={(e) => {
                setFollowGateText(e.target.value.slice(0, 1000));
                setDirty(true);
              }}
              rows={4}
              aria-label="Follow-gate message"
              placeholder={"Oh no! It seems you're not following me 🙈\nVisit my profile and hit that follow button 🤩.\nOnce you do, I'll send you what you asked for!"}
              className="w-full min-h-[6rem] resize-none bg-transparent p-3.5 text-xs leading-relaxed text-[var(--viz-ink)] outline-none placeholder:text-[var(--viz-muted)]"
            />
            {followGateText.length > 800 && (
              <p className="px-3.5 pb-2 text-right text-[10px] text-amber-600">{followGateText.length} / 1000</p>
            )}
          </div>
        )}
      </div>

      {/* ── Step 4: Send this message & Custom Templates ───────────── */}
      <div data-step="message" className={card}>
        <div className="mb-4">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-black/[0.04] dark:bg-white/[0.06] text-[var(--viz-ink)] border border-[var(--viz-border)] shadow-2xs">
              <SendIcon className="h-4 w-4" />
            </span>
            <div className="flex items-center gap-1.5 flex-1 min-w-0">
              <h2 className="text-sm font-bold text-[var(--viz-ink)]">4. Response &amp; DM Template</h2>
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
          <div className="mt-4 grid grid-cols-2 gap-2 sm:gap-2.5 sm:grid-cols-3 lg:grid-cols-5 w-full min-w-0 [overflow-anchor:none]">
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
                  onClick={(e) => handleButtonClick(e, () => selectTemplate(tab.id as any))}
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
        <div className="grid grid-cols-1 gap-6 items-start w-full min-w-0 [overflow-anchor:none]">
          {/* Left Column: Form Controls */}
          <div className="space-y-4 w-full min-w-0 [overflow-anchor:none]">
            {/* Message text: label with quick inserts on the same row, one box */}
            <div className="space-y-2.5 [overflow-anchor:none]">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <label className="text-xs font-semibold text-[var(--viz-ink)] tracking-tight">Message Text / Caption</label>
                  <span className="inline-flex items-center rounded-md bg-blue-500/10 px-2 py-0.5 text-[10px] font-medium text-blue-600 dark:text-blue-400 border border-blue-500/20">
                    Primary DM
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={(e) =>
                    handleButtonClick(e, () => {
                      setDmText((t) => (t.endsWith(" ") || !t ? `${t}{username} ` : `${t} {username} `));
                      setDirty(true);
                    })
                  }
                  className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-purple-500/25 bg-purple-500/8 text-purple-700 dark:text-purple-300 hover:bg-purple-500/15 px-3 py-1.5 text-[11px] font-medium transition-colors cursor-pointer"
                >
                  <span className="font-mono text-[10px] opacity-75">@</span>
                  <span>username</span>
                </button>
                <button
                  type="button"
                  onClick={(e) =>
                    handleButtonClick(e, () => {
                      setDmText((t) => (t ? `Hey {username}! 👋\n\n${t}` : "Hey {username}! 👋"));
                      setDirty(true);
                    })
                  }
                  className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-emerald-500/25 bg-emerald-500/8 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/15 px-3 py-1.5 text-[11px] font-medium transition-colors cursor-pointer"
                >
                  <span>👋</span>
                  <span>Greeting</span>
                </button>
                <button
                  type="button"
                  onClick={(e) =>
                    handleButtonClick(e, () => {
                      setDmText((t) => (t ? `${t}\n\nTap below to check it out! 👇` : "Tap below to check it out! 👇"));
                      setDirty(true);
                    })
                  }
                  className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-amber-500/25 bg-amber-500/8 text-amber-700 dark:text-amber-300 hover:bg-amber-500/15 px-3 py-1.5 text-[11px] font-medium transition-colors cursor-pointer"
                >
                  <span>👇</span>
                  <span>Call to Action</span>
                </button>
                </div>
              </div>

              <div className="rounded-xl border border-[var(--viz-border)] bg-background transition-all focus-within:border-[var(--viz-ink)] focus-within:ring-2 focus-within:ring-black/5 dark:focus-within:ring-white/10">
                <textarea
                  value={dmText}
                  onChange={(e) => {
                    setDmText(e.target.value);
                    setDirty(true);
                  }}
                  maxLength={1000}
                  rows={3}
                  aria-label="Message text"
                  placeholder="Hey! 👋 Thanks for your comment. Here is the link you requested:"
                  className="w-full min-h-[5.5rem] resize-none bg-transparent p-3.5 text-xs leading-relaxed text-[var(--viz-ink)] outline-none placeholder:text-[var(--viz-muted)]"
                />
                {dmText.length > 800 && <p className="px-3.5 pb-2 text-right text-[10px] text-amber-600">{dmText.length} / 1000</p>}
              </div>
            </div>

            {/* Product Card Details */}
            {templateType === "product" && (
              <div className="space-y-3.5 pt-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                      <ShoppingBagIcon className="h-3.5 w-3.5" />
                    </span>
                    <p className="text-xs font-bold text-[var(--viz-ink)]">Product Showcase Settings</p>
                  </div>
                </div>

                <div className="grid items-start gap-4 sm:grid-cols-2">
                  <div className="space-y-3">
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
                  <div>
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
                  </div>
                </div>

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
              <div className="space-y-3.5 pt-4">
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
              <div className="space-y-3.5 pt-4">
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
              <div className="space-y-3.5 pt-4">
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
                        onClick={(e) => handleButtonClick(e, () => addButton())}
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

                {/* Buttons List */}
                {cardButtons.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-[var(--viz-border)] p-6 text-center bg-background/50">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 mx-auto border border-blue-500/20">
                      <MessageButtonsIcon className="h-5 w-5" />
                    </div>
                    <p className="text-xs font-bold text-[var(--viz-ink)] mt-2.5">No buttons attached</p>
                    <p className="text-[11px] text-[var(--viz-muted)] mt-0.5 max-w-xs mx-auto">
                      Click &quot;+ Add Button&quot; to attach clickable links to your Instagram DM.
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-4 pt-1 sm:grid-cols-2 2xl:grid-cols-3">
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
                            onClick={(e) => handleButtonClick(e, () => removeButton(idx))}
                            className="flex h-7 w-7 items-center justify-center rounded-lg text-[var(--viz-muted)] hover:text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
                            title="Remove button"
                          >
                            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M18 6L6 18M6 6l12 12" />
                            </svg>
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
                                Destination URL
                              </span>
                              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono font-medium">
                                  https://
                                </span>
                            </div>
                            <div className="relative flex items-center">
                                <LinkIcon className="absolute left-3.5 h-3.5 w-3.5 text-blue-500 pointer-events-none" />
                                <input
                                  value={btn.url || ""}
                                  onChange={(e) => updateButton(idx, { type: "web_url", url: e.target.value })}
                                  placeholder="https://instagram.com"
                                  className="w-full rounded-xl border border-[var(--viz-border)] bg-[var(--viz-surface)]/70 pl-9 pr-3.5 py-2 text-xs font-mono text-[11px] outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 transition-all shadow-2xs"
                                />
                              </div>
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
                              <svg className="h-3 w-3 opacity-70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                  <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
                                  <polyline points="15 3 21 3 21 9" />
                                  <line x1="10" y1="14" x2="21" y2="3" />
                                </svg>
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

        </div>

        {/* Step 4 Footer / Quick Save */}
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--viz-border)] pt-4">
          <div className="flex items-center gap-2 text-xs text-[var(--viz-muted)]">
            <span className={`inline-block h-2 w-2 rounded-full ${dirty ? "bg-amber-500 animate-pulse" : "bg-emerald-500"}`} />
            <span>{dirty ? "Unsaved changes in message template" : "Template saved to automation"}</span>
          </div>
          <button
            type="button"
            onClick={(e) => handleButtonClick(e, save)}
            disabled={saving || !dirty}
            className="flex items-center gap-2 rounded-lg bg-foreground px-4 py-2 text-xs font-semibold text-background shadow hover:opacity-90 disabled:opacity-40 transition-all cursor-pointer"
          >
            {saving ? "Saving…" : "Save Template Changes"}
          </button>
        </div>
      </div>

      {/* ── Check-in Reminder ─────────────────────────────────────── */}
      <div data-step="reminder" className={card}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-[var(--viz-ink)]">5. Check-in Reminder</p>
            <p className="text-xs text-[var(--viz-muted)] mt-0.5">
              About 20 hours after your DM, if the customer has not replied, send one short &quot;just checking in&quot; message with two buttons. Off by default.
            </p>
          </div>
          <button
            id="recovery-toggle"
            role="switch"
            aria-checked={recoveryEnabled}
            onClick={(e) =>
              handleButtonClick(e, () => {
                setRecoveryEnabled((v) => !v);
                setDirty(true);
              })
            }
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${
              recoveryEnabled ? "bg-green-500" : "bg-black/20 dark:bg-white/20"
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                recoveryEnabled ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>
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
            type="button"
            onClick={(e) => handleButtonClick(e, refreshLogs)}
            disabled={logsLoading}
            className="flex items-center gap-1.5 rounded-lg border border-[var(--viz-border)] px-3 py-1.5 text-xs font-medium text-[var(--viz-ink-2)] transition-colors hover:bg-black/[0.04] disabled:opacity-50 dark:hover:bg-white/[0.06] cursor-pointer"
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

      </div>

      {/* The one phone: stays in view while the steps scroll */}
      <aside className="hidden lg:block sticky top-4 self-start">
        <CommentDmFlowPhone {...phoneProps} height={phoneHeight} />
      </aside>
      </div>

      {/* Small screens: the same phone opens from a bar at the bottom */}
      <div className="lg:hidden">
        <button
          type="button"
          onClick={() => setPhoneOpen(true)}
          className="fixed bottom-4 right-4 z-40 inline-flex items-center gap-2 rounded-full bg-foreground px-4 py-2.5 text-xs font-medium text-background shadow-xl active:scale-95"
        >
          <PhoneIcon className="h-4 w-4" />
          Preview
        </button>
        <Modal open={phoneOpen} onCancel={() => setPhoneOpen(false)} footer={null} centered width={380} title="Live preview" destroyOnHidden>
          <CommentDmFlowPhone {...phoneProps} height={Math.min(620, phoneHeight + 40)} />
        </Modal>
      </div>

      {/* Floating Unsaved Changes Bar */}
      {dirty && (
        <div className="fixed bottom-4 sm:bottom-6 left-1/2 z-50 flex max-w-[calc(100vw-1.5rem)] -translate-x-1/2 items-center gap-2 sm:gap-3 rounded-full border border-[var(--viz-border)] bg-background/95 px-3.5 sm:px-5 py-2 sm:py-2.5 shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-3 duration-200 [overflow-anchor:none]">
          <span className="flex h-2 sm:h-2.5 w-2 sm:w-2.5 shrink-0 rounded-full bg-amber-500 animate-pulse" />
          <span className="text-[11px] sm:text-xs font-semibold text-[var(--viz-ink)] truncate">Unsaved changes</span>
          <button
            type="button"
            onClick={(e) => handleButtonClick(e, save)}
            disabled={saving}
            className="shrink-0 flex items-center gap-1.5 rounded-full bg-foreground px-3 sm:px-4 py-1.5 text-[11px] sm:text-xs font-semibold text-background shadow hover:opacity-90 disabled:opacity-50 transition-all cursor-pointer"
          >
            {saving ? "Saving…" : "Save Changes"}
          </button>
          <button
            type="button"
            onClick={(e) =>
              handleButtonClick(e, () => {
                if (!rule) return;
                setName(rule.name);
                setKeywordDraft(rule.keywords);
                setDmText(rule.dmText);
                setRequireFollow(rule.requireFollow ?? false);
                setRecoveryEnabled(rule.recoveryEnabled ?? false);
                setFollowGateText(rule.followGateText ?? "");
                setTemplateType(rule.templateType || "text");
                setCardTitle(rule.cardTitle ?? "");
                setCardSubtitle(rule.cardSubtitle ?? "");
                setCardImageUrl(rule.cardImageUrl ?? "");
                setCardFileUrl(rule.cardFileUrl ?? "");
                setCardButtons((rule.cardButtons ?? []).map((b) => (b.type === "web_url" ? b : { type: "web_url" as const, title: b.title, url: "https://instagram.com" })));
                setDirty(false);
              })
            }
            className="rounded-full px-2.5 py-1 text-xs text-[var(--viz-muted)] hover:text-[var(--viz-ink)] transition-colors cursor-pointer"
          >
            Discard
          </button>
        </div>
      )}
    </div>
  );
}

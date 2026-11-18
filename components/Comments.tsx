"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { api } from "@/lib/api";
import { AutoReplyCard, type RuleTemplate } from "./AutoReplyCard";
import {
  MessageSquare,
  MessageCircle,
  Sparkles,
  Clock,
  CheckCircle2,
  AlertCircle,
  Send,
  Eye,
  EyeOff,
  RefreshCw,
  Search,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Zap,
  X,
  Plus,
  CornerDownRight,
  Filter,
  Check,
} from "lucide-react";
import { InstagramIcon } from "./icons";

type Comment = {
  id: string;
  mediaPermalink: string | null;
  mediaThumb: string | null;
  username: string;
  text: string;
  commentedAt: string;
  hidden: boolean;
  myReply: string | null;
  repliedAt: string | null;
  replyKind: "manual" | "auto" | "external" | null;
  autoState: "new" | "processing" | "done" | "skipped" | "failed";
  autoNote: string | null;
  isOwn: boolean;
};

type PostWithComments = {
  mediaId: string;
  permalink: string | null;
  thumb: string | null;
  caption: string;
  postedAt: string;
  reported: number;
  visible: number;
};

type CommentsPage = { items: Comment[]; nextCursor: string | null; counts: { all: number; unreplied: number; replied: number } };
type PostsPage = { items: PostWithComments[]; total: number; nextOffset: number | null };
const COMMENTS_PAGE = 6;
const POSTS_PAGE = 6;

function formatRelativeTime(iso: string) {
  try {
    const diff = (Date.now() - new Date(iso).getTime()) / 1000;
    if (diff < 60) return "just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
    return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
  } catch {
    return iso;
  }
}

const RULE_TEMPLATES: RuleTemplate[] = [
  { name: "Price question", keywords: "price, cost, rate, how much", replyText: "Hi @{username}! For prices, please send us a DM and we'll share the details." },
  { name: "Size or stock", keywords: "size, available, stock", replyText: "Hi @{username}! Send us a DM with your size and we'll confirm availability." },
  { name: "Say thanks", keywords: "", replyText: "Thank you @{username}! 💛" },
];

const DEFAULT_QUICK_REPLIES = [
  "Thank you @{username}! 💛",
  "So glad you like it, @{username} 😊",
  "Sent you a DM with details, @{username}!",
  "Check your inbox, @{username} 📩",
];

const CUSTOM_TEMPLATES_KEY = "ig-hub:comment-quick-replies";

function loadCustomTemplates(): string[] {
  try {
    const saved = JSON.parse(localStorage.getItem(CUSTOM_TEMPLATES_KEY) ?? "[]");
    return Array.isArray(saved) ? saved.filter((t) => typeof t === "string") : [];
  } catch {
    return [];
  }
}

const AVATAR_GRADIENTS = [
  "from-violet-500 to-indigo-600",
  "from-pink-500 to-rose-600",
  "from-amber-400 to-orange-500",
  "from-emerald-400 to-teal-600",
  "from-cyan-400 to-blue-600",
  "from-fuchsia-500 to-purple-600",
];

function avatarGradient(username: string) {
  let hash = 0;
  for (let i = 0; i < username.length; i++) hash = (hash * 31 + username.charCodeAt(i)) >>> 0;
  return AVATAR_GRADIENTS[hash % AVATAR_GRADIENTS.length];
}

export function Comments() {
  const [items, setItems] = useState<Comment[] | null>(null);
  const [posts, setPosts] = useState<PostWithComments[] | null>(null);
  const [tab, setTab] = useState<"unreplied" | "replied" | "all">("unreplied");
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [tick, setTick] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [counts, setCounts] = useState({ all: 0, unreplied: 0, replied: 0 });
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [postsTotal, setPostsTotal] = useState(0);
  const [postsLoadingMore, setPostsLoadingMore] = useState(false);
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const itemsRef = useRef<Comment[] | null>(null);
  const cursorRef = useRef<string | null>(null);
  const postsRef = useRef<PostWithComments[] | null>(null);
  itemsRef.current = items;
  cursorRef.current = nextCursor;
  postsRef.current = posts;
  const [showAutoReplySettings, setShowAutoReplySettings] = useState(false);
  const [quickRepliesFor, setQuickRepliesFor] = useState<string | null>(null);
  const [customTemplates, setCustomTemplates] = useState<string[]>([]);
  const [addingTemplate, setAddingTemplate] = useState(false);
  const [newTemplate, setNewTemplate] = useState("");

  const templates = useMemo(() => [...DEFAULT_QUICK_REPLIES, ...customTemplates], [customTemplates]);

  useEffect(() => {
    setCustomTemplates(loadCustomTemplates());
  }, []);

  function addTemplate() {
    const text = newTemplate.trim();
    if (!text) return;
    const next = [...customTemplates, text];
    setCustomTemplates(next);
    localStorage.setItem(CUSTOM_TEMPLATES_KEY, JSON.stringify(next));
    setNewTemplate("");
    setAddingTemplate(false);
  }

  function removeTemplate(text: string) {
    const next = customTemplates.filter((t) => t !== text);
    setCustomTemplates(next);
    localStorage.setItem(CUSTOM_TEMPLATES_KEY, JSON.stringify(next));
  }

  // Wait for a pause in typing before searching on the server.
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchQuery.trim()), 350);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const pageQuery = () =>
    `tab=${tab}&limit=${COMMENTS_PAGE}` +
    (selectedPostId ? `&post=${encodeURIComponent(selectedPostId)}` : "") +
    (debouncedSearch ? `&q=${encodeURIComponent(debouncedSearch)}` : "");

  // A different tab, post or search starts again from the first page.
  useEffect(() => {
    setItems(null);
    setNextCursor(null);
  }, [tab, selectedPostId, debouncedSearch]);

  // Comments: the first page now, then a fresh look every 15 seconds. Pages you already opened with "Load more" are kept.
  useEffect(() => {
    let cancelled = false;
    const load = (fresh: boolean) =>
      api<CommentsPage>(`/comments/page?${pageQuery()}`).then(
        (r) => {
          if (cancelled) return;
          setCounts(r.counts);
          const prev = itemsRef.current;
          if (fresh || !prev || prev.length <= r.items.length) {
            setItems(r.items);
            setNextCursor(r.nextCursor);
          } else {
            const firstIds = new Set(r.items.map((c) => c.id));
            const lastTime = r.items.length ? r.items[r.items.length - 1].commentedAt : "";
            setItems([...r.items, ...prev.filter((c) => !firstIds.has(c.id) && c.commentedAt < lastTime)]);
          }
        },
        (e: Error) => !cancelled && setError(e.message),
      );
    load(true);
    const id = setInterval(() => load(false), 15000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick, tab, selectedPostId, debouncedSearch]);

  // Posts with comments: six at first; the posts you have opened are refreshed together.
  useEffect(() => {
    let cancelled = false;
    const load = () => {
      const n = Math.max(POSTS_PAGE, postsRef.current?.length ?? 0);
      return api<PostsPage>(`/comments/posts?limit=${n}&offset=0`).then(
        (r) => {
          if (cancelled) return;
          setPosts(r.items);
          setPostsTotal(r.total);
        },
        () => {},
      );
    };
    load();
    const id = setInterval(load, 15000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [tick]);

  async function loadMoreComments() {
    const cursor = cursorRef.current;
    if (!cursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const r = await api<CommentsPage>(`/comments/page?${pageQuery()}&cursor=${encodeURIComponent(cursor)}`);
      setItems((prev) => {
        const seen = new Set((prev ?? []).map((c) => c.id));
        return [...(prev ?? []), ...r.items.filter((c) => !seen.has(c.id))];
      });
      setNextCursor(r.nextCursor);
      setCounts(r.counts);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoadingMore(false);
    }
  }

  async function loadMorePosts() {
    const have = postsRef.current?.length ?? 0;
    if (postsLoadingMore) return;
    setPostsLoadingMore(true);
    try {
      const r = await api<PostsPage>(`/comments/posts?limit=${POSTS_PAGE}&offset=${have}`);
      setPosts((prev) => {
        const seen = new Set((prev ?? []).map((x) => x.mediaId));
        return [...(prev ?? []), ...r.items.filter((x) => !seen.has(x.mediaId))];
      });
      setPostsTotal(r.total);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setPostsLoadingMore(false);
    }
  }

  const reload = () => setTick((n) => n + 1);

  async function run(key: string, fn: () => Promise<unknown>) {
    setBusy(key);
    setError(null);
    try {
      await fn();
      reload();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(null);
    }
  }

  const refresh = () => run("refresh", () => api("/comments/sync", { method: "POST" }));

  const reply = (c: Comment) =>
    run(`reply-${c.id}`, async () => {
      const text = (drafts[c.id] ?? "").trim();
      if (!text) return;
      await api(`/comments/${c.id}/reply`, { method: "POST", body: JSON.stringify({ text }) });
      setDrafts((d) => ({ ...d, [c.id]: "" }));
    });

  const hide = (c: Comment) =>
    run(`hide-${c.id}`, () => api(`/comments/${c.id}/hide`, { method: "POST", body: JSON.stringify({ hidden: !c.hidden }) }));

  const useTemplate = (c: Comment, template: string) => {
    setDrafts((d) => ({ ...d, [c.id]: template.replaceAll("{username}", c.username || "there") }));
    setQuickRepliesFor(null);
  };

  const sendTemplate = (c: Comment, template: string) =>
    run(`reply-${c.id}`, async () => {
      const text = template.replaceAll("{username}", c.username || "there");
      await api(`/comments/${c.id}/reply`, { method: "POST", body: JSON.stringify({ text }) });
      setQuickRepliesFor(null);
    });

  // The server already filtered by tab, post and search; these are the comments loaded so far.
  const displayedComments = items ?? [];
  const tabTotal = tab === "unreplied" ? counts.unreplied : tab === "replied" ? counts.replied : counts.all;
  const canLoadMore = !!nextCursor;
  const remaining = !selectedPostId && !debouncedSearch ? Math.max(0, tabTotal - displayedComments.length) : 0;

  return (
    <div className="space-y-6 pb-12">
      {error && (
        <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
          <AlertCircle size={15} className="shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* ── 1. SOFT PASTEL MINIMAL KPI BENTO GRID ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Comments Card (Soft Periwinkle) */}
        <div
          style={{ backgroundColor: "#e2e2fc" }}
          className="rounded-[26px] p-5 flex flex-col justify-between shadow-xs border-0"
        >
          <div className="flex items-start justify-between">
            <span className="text-3xl sm:text-4xl font-black text-slate-950 tabular-nums">
              {counts.all}
            </span>
            <div className="w-9 h-9 rounded-xl bg-white border border-black/80 text-slate-950 shadow-2xs flex items-center justify-center shrink-0">
              <MessageSquare size={17} />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-sm font-bold text-slate-950">Total Comments</div>
            <div className="text-xs font-semibold text-slate-600 mt-0.5">Synced from Instagram</div>
          </div>
        </div>

        {/* Needs Reply (Soft Butter Yellow) */}
        <div
          style={{ backgroundColor: "#fff9db" }}
          className="rounded-[26px] p-5 flex flex-col justify-between shadow-xs border-0"
        >
          <div className="flex items-start justify-between">
            <span className="text-3xl sm:text-4xl font-black text-slate-950 tabular-nums">
              {counts.unreplied}
            </span>
            <div className="w-9 h-9 rounded-xl bg-white border border-black/80 text-slate-950 shadow-2xs flex items-center justify-center shrink-0">
              <Clock size={17} className="text-amber-700" />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between">
            <div>
              <div className="text-sm font-bold text-slate-950">Needs Reply</div>
              <div className="text-xs font-semibold text-amber-800/80 mt-0.5">Unanswered audience</div>
            </div>
            {counts.unreplied > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-amber-200/60 text-amber-900 text-[10px] font-bold">
                Action needed
              </span>
            )}
          </div>
        </div>

        {/* Replied / Handled (Soft Rose Pink) */}
        <div
          style={{ backgroundColor: "#fceef4" }}
          className="rounded-[26px] p-5 flex flex-col justify-between shadow-xs border-0"
        >
          <div className="flex items-start justify-between">
            <span className="text-3xl sm:text-4xl font-black text-slate-950 tabular-nums">
              {counts.replied}
            </span>
            <div className="w-9 h-9 rounded-xl bg-white border border-black/80 text-slate-950 shadow-2xs flex items-center justify-center shrink-0">
              <CheckCircle2 size={17} className="text-rose-600" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-sm font-bold text-slate-950">Replied & Handled</div>
            <div className="text-xs font-semibold text-slate-600 mt-0.5">Manual & automated replies</div>
          </div>
        </div>
      </div>

      {/* ── 2. COLLAPSIBLE AI & KEYWORD AUTO-REPLY SETTINGS ── */}
      <div className="rounded-[24px] border border-[#e9e9ee] bg-white overflow-hidden shadow-2xs transition-all hover:border-black/30">
        <button
          type="button"
          onClick={() => setShowAutoReplySettings(!showAutoReplySettings)}
          className="w-full p-4 sm:p-5 flex items-center justify-between hover:bg-slate-50/80 transition-colors text-left cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div
              style={{ backgroundColor: "#feece4" }}
              className="w-10 h-10 rounded-2xl text-slate-950 flex items-center justify-center shrink-0 shadow-2xs font-bold"
            >
              <Zap size={18} className="text-orange-600" />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-950 flex items-center gap-2">
                <span>AI & Keyword Auto-Reply Engine</span>
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80 font-bold">
                  Rule Engine
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Configure instant keyword triggers, auto-responses, and AI comment resolution.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
            <span>{showAutoReplySettings ? "Hide Rules" : "Manage Rules"}</span>
            {showAutoReplySettings ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </div>
        </button>

        {showAutoReplySettings && (
          <div className="p-5 border-none bg-white">
            <AutoReplyCard
              embedded={true}
              basePath="/comments/auto-reply"
              noun="comments"
              templates={RULE_TEMPLATES}
              keywordsExample="e.g. price, cost, size"
              replyExample="e.g. Hi @{username}! Send us a DM and we'll help."
              maxReplyLength={2200}
            />
          </div>
        )}
      </div>

      {/* ── 3. POSTS WITH COMMENTS FILTER CAROUSEL / BENTO ── */}
      {posts && posts.length > 0 && (
        <div className="rounded-[24px] border border-[#e9e9ee] bg-white p-5 shadow-2xs hover:border-black/30 transition-all space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-[#f1f3f7]">
            <div className="flex items-center gap-2.5">
              <div
                style={{ backgroundColor: "#e2e2fc" }}
                className="w-8 h-8 rounded-xl text-slate-950 flex items-center justify-center shrink-0 shadow-2xs font-bold"
              >
                <InstagramIcon className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-950">Posts with Comments</h3>
                <p className="text-xs text-slate-500">{postsTotal || posts.length} posts actively discussed</p>
              </div>
            </div>

            {selectedPostId && (
              <button
                type="button"
                onClick={() => setSelectedPostId(null)}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer"
              >
                <X size={12} />
                <span>Clear Post Filter</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {posts.map((p) => {
              const isSelected = selectedPostId && p.permalink?.includes(selectedPostId);
              return (
                <div
                  key={p.mediaId}
                  onClick={() => {
                    const match = p.permalink?.match(/p\/([^/]+)/);
                    const id = match ? match[1] : p.mediaId;
                    setSelectedPostId(isSelected ? null : id);
                  }}
                  className={`group relative flex items-start gap-3 p-3 rounded-[20px] border transition-all cursor-pointer ${
                    isSelected
                      ? "border-black bg-slate-50 shadow-xs"
                      : "border-[#e9e9ee] bg-white hover:border-black/40 hover:bg-slate-50/50"
                  }`}
                >
                  {p.thumb ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={p.thumb}
                      alt="Post"
                      referrerPolicy="no-referrer"
                      className="w-14 h-14 rounded-2xl object-cover shrink-0 border border-black/5 shadow-2xs group-hover:scale-105 transition-transform"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center shrink-0 text-slate-400">
                      <InstagramIcon className="w-6 h-6" />
                    </div>
                  )}

                  <div className="min-w-0 flex-1 flex flex-col justify-between h-full py-0.5">
                    <p className="text-xs font-bold text-slate-900 line-clamp-2 leading-snug">
                      {p.caption || "(No caption provided)"}
                    </p>
                    <div className="flex items-center justify-between gap-1 mt-2 text-[11px] font-semibold text-slate-500">
                      <span className="inline-flex items-center gap-1 font-bold text-slate-700">
                        <MessageSquare size={11} className="text-slate-500" />
                        {p.visible} comments
                      </span>
                      {p.permalink && (
                        <a
                          href={p.permalink}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-slate-400 hover:text-black transition-colors"
                          title="Open post on Instagram"
                        >
                          <ExternalLink size={12} />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {(posts.length < postsTotal || posts.length > POSTS_PAGE) && (
            <div className="flex items-center justify-center gap-5 pt-2">
              {posts.length < postsTotal && (
                <button
                  type="button"
                  onClick={loadMorePosts}
                  disabled={postsLoadingMore}
                  className="text-xs font-bold text-slate-700 hover:text-black underline underline-offset-4 cursor-pointer disabled:opacity-50"
                >
                  {postsLoadingMore ? "Loading…" : `Load more posts (${postsTotal - posts.length} left)`}
                </button>
              )}
              {posts.length > POSTS_PAGE && (
                <button
                  type="button"
                  onClick={() => setPosts((prev) => (prev ? prev.slice(0, POSTS_PAGE) : prev))}
                  className="text-xs font-medium text-slate-500 hover:text-black cursor-pointer"
                >
                  Show fewer
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── 4. COMMENTS INBOX TOOLBAR (SEARCH + TABS + SYNC) ── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
        {/* Category Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            type="button"
            onClick={() => setTab("unreplied")}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              tab === "unreplied"
                ? "bg-black text-white shadow-xs"
                : "bg-white hover:bg-slate-50 text-slate-800 border border-[#e9e9ee] hover:border-black/30 shadow-2xs"
            }`}
          >
            <span>Needs Reply</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                tab === "unreplied" ? "bg-white/20 text-white" : "bg-[#fff9db] text-amber-900"
              }`}
            >
              {counts.unreplied}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setTab("replied")}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              tab === "replied"
                ? "bg-black text-white shadow-xs"
                : "bg-white hover:bg-slate-50 text-slate-800 border border-[#e9e9ee] hover:border-black/30 shadow-2xs"
            }`}
          >
            <span>Replied</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                tab === "replied" ? "bg-white/20 text-white" : "bg-[#e2e2fc] text-slate-900"
              }`}
            >
              {counts.replied}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setTab("all")}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              tab === "all"
                ? "bg-black text-white shadow-xs"
                : "bg-white hover:bg-slate-50 text-slate-800 border border-[#e9e9ee] hover:border-black/30 shadow-2xs"
            }`}
          >
            <span>All Comments</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                tab === "all" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-700"
              }`}
            >
              {counts.all}
            </span>
          </button>
        </div>

        {/* Search & Refresh */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-64">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by @user or words..."
              className="w-full pl-9 pr-4 py-2 rounded-full bg-white border border-[#e9e9ee] hover:border-black/30 focus:border-black text-xs font-bold text-slate-950 placeholder:text-slate-400 focus:outline-none shadow-2xs transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-black cursor-pointer"
              >
                <X size={12} />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={refresh}
            disabled={busy === "refresh"}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white hover:bg-slate-50 text-slate-900 border border-[#e9e9ee] hover:border-black/30 text-xs font-bold shadow-2xs cursor-pointer disabled:opacity-50 transition-all shrink-0"
          >
            <RefreshCw size={13} className={busy === "refresh" ? "animate-spin text-slate-950" : "text-slate-600"} />
            <span>{busy === "refresh" ? "Syncing..." : "Sync"}</span>
          </button>
        </div>
      </div>

      {/* ── 5. COMPACT BENTO GRID COMMENTS STREAM ── */}
      {items === null ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5" aria-busy="true">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-40 animate-pulse rounded-[22px] border border-[#e9e9ee] bg-slate-50" />
          ))}
        </div>
      ) : displayedComments.length === 0 ? (
        <div className="rounded-[24px] border border-[#e9e9ee] bg-white p-12 text-center shadow-2xs space-y-3">
          <div
            style={{ backgroundColor: "#e2e2fc" }}
            className="w-12 h-12 rounded-2xl mx-auto flex items-center justify-center text-slate-950 shadow-2xs font-bold"
          >
            <MessageSquare size={20} />
          </div>
          <h3 className="text-sm font-bold text-slate-950">
            {tab === "unreplied" ? "All Caught Up!" : "No Comments Found"}
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
            {tab === "unreplied"
              ? "Zero comments currently awaiting response. New comments from Instagram stream in live via webhooks."
              : "No comments match your active filters or search query."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
          {displayedComments.map((c) => {
            const hasReply = !!c.myReply || !!c.repliedAt;
            return (
              <div
                key={c.id}
                className="rounded-[22px] border border-[#e9e9ee] hover:border-black/40 bg-white p-4 shadow-2xs transition-all flex flex-col justify-between gap-3 group"
              >
                {/* Header: Author + Post Link + Status Pill */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    {c.mediaThumb ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={c.mediaThumb}
                        alt="Author post"
                        referrerPolicy="no-referrer"
                        className="w-8 h-8 rounded-full object-cover ring-1 ring-black/10 shrink-0 shadow-2xs"
                      />
                    ) : (
                      <div
                        className={`w-8 h-8 rounded-full bg-gradient-to-br ${avatarGradient(
                          c.username || "creator"
                        )} flex items-center justify-center text-white font-extrabold text-[11px] shrink-0 shadow-2xs`}
                      >
                        {(c.username || "U")[0]?.toUpperCase()}
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="text-xs font-black text-slate-950 truncate">
                          @{c.username || "user"}
                        </span>
                        <span className="text-[10px] font-semibold text-slate-400 shrink-0">
                          {formatRelativeTime(c.commentedAt)}
                        </span>
                      </div>
                      {c.mediaPermalink && (
                        <a
                          href={c.mediaPermalink}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-500 hover:text-black transition-colors truncate"
                        >
                          <InstagramIcon className="w-2.5 h-2.5 text-pink-500 shrink-0" />
                          <span className="truncate">View post</span>
                          <ExternalLink size={9} className="shrink-0" />
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className="shrink-0">
                    {c.hidden ? (
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold border border-slate-200">
                        Hidden
                      </span>
                    ) : c.replyKind === "auto" ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-800 border border-rose-200 text-[10px] font-bold">
                        <Sparkles size={10} className="text-rose-600" />
                        <span>Auto</span>
                      </span>
                    ) : hasReply ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold">
                        <Check size={10} className="text-emerald-600" />
                        <span>Replied</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-900 border border-amber-200 text-[10px] font-bold">
                        <Clock size={10} className="text-amber-700" />
                        <span>Needs Reply</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Comment Content Bubble */}
                <div className="flex-1 space-y-2">
                  <div className="inline-block w-fit max-w-full bg-slate-100/90 text-slate-950 px-3.5 py-2 rounded-[16px] rounded-tl-xs text-xs font-semibold leading-relaxed border border-slate-200/50 shadow-2xs">
                    <p className="whitespace-pre-wrap break-words">{c.text}</p>
                  </div>

                  {/* Nested Response if any */}
                  {c.myReply && (
                    <div className="ml-3 pl-2.5 border-l-2 border-slate-900 space-y-0.5">
                      <div className="flex items-center gap-1 text-[10px] font-bold text-slate-500">
                        <span>You</span>
                        {c.repliedAt && <span>• {formatRelativeTime(c.repliedAt)}</span>}
                      </div>
                      <p className="text-[11px] font-medium text-slate-800 bg-[#e2e2fc]/30 px-2.5 py-1.5 rounded-[12px] whitespace-pre-wrap break-words">
                        {c.myReply}
                      </p>
                    </div>
                  )}
                </div>

                {/* Quick Action Chips & Fast Reply Bar */}
                {!c.isOwn && (
                  <div className="pt-2 border-t border-[#f1f3f7] space-y-2">
                    {/* 2 quick suggestion pills */}
                    <div className="flex items-center gap-1 overflow-x-auto pb-0.5 scrollbar-none">
                      {templates.slice(0, 2).map((tpl) => (
                        <button
                          key={tpl}
                          type="button"
                          onClick={() => useTemplate(c, tpl)}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-slate-50 hover:bg-slate-100 text-slate-700 border border-[#e9e9ee] hover:border-black/30 text-[10px] font-semibold whitespace-nowrap transition-all cursor-pointer truncate max-w-[140px]"
                        >
                          <span className="truncate">{tpl.replaceAll("{username}", c.username || "there")}</span>
                        </button>
                      ))}
                    </div>

                    {/* Compact Input Pill */}
                    <div className="relative flex items-center gap-1.5 p-1 rounded-full border border-[#e9e9ee] bg-white shadow-2xs focus-within:border-black/80 transition-all">
                      <button
                        type="button"
                        onClick={() => setQuickRepliesFor(quickRepliesFor === c.id ? null : c.id)}
                        title="Quick reply templates"
                        className={`w-7 h-7 rounded-full flex items-center justify-center transition-all cursor-pointer shrink-0 ${
                          quickRepliesFor === c.id
                            ? "bg-black text-white"
                            : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                        }`}
                      >
                        <Zap size={12} />
                      </button>

                      {quickRepliesFor === c.id && (
                        <>
                          <div
                            className="fixed inset-0 z-40"
                            onClick={() => {
                              setQuickRepliesFor(null);
                              setAddingTemplate(false);
                            }}
                          />
                          <div className="absolute bottom-full left-0 z-50 mb-2 w-72 rounded-[20px] border border-[#e9e9ee] bg-white p-3 shadow-lg animate-in fade-in zoom-in-95 duration-150">
                            <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
                              <span className="text-[11px] font-bold text-slate-950">Quick Reply Templates</span>
                              <span className="text-[9px] text-slate-400 font-semibold">Click to insert</span>
                            </div>

                            <div className="max-h-48 overflow-y-auto space-y-1 py-1.5">
                              {templates.map((tpl) => {
                                const isCustom = customTemplates.includes(tpl);
                                return (
                                  <div
                                    key={tpl}
                                    className="flex items-center justify-between gap-1.5 p-1.5 rounded-lg hover:bg-slate-50 transition-colors group"
                                  >
                                    <button
                                      type="button"
                                      onClick={() => useTemplate(c, tpl)}
                                      className="text-[11px] font-semibold text-slate-800 text-left truncate flex-1 cursor-pointer"
                                    >
                                      {tpl.replaceAll("{username}", c.username || "there")}
                                    </button>

                                    <div className="flex items-center gap-1 shrink-0">
                                      <button
                                        type="button"
                                        onClick={() => sendTemplate(c, tpl)}
                                        title="Send immediately"
                                        className="w-5 h-5 rounded-full bg-slate-100 hover:bg-black hover:text-white flex items-center justify-center text-slate-600 transition-colors cursor-pointer"
                                      >
                                        <Send size={9} />
                                      </button>
                                      {isCustom && (
                                        <button
                                          type="button"
                                          onClick={() => removeTemplate(tpl)}
                                          title="Delete template"
                                          className="w-5 h-5 rounded-full hover:bg-rose-50 hover:text-rose-600 flex items-center justify-center text-slate-400 transition-colors cursor-pointer"
                                        >
                                          <X size={10} />
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </>
                      )}

                      <button
                        type="button"
                        onClick={() => hide(c)}
                        disabled={busy === `hide-${c.id}`}
                        title={c.hidden ? "Unhide comment" : "Hide comment"}
                        className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
                          c.hidden
                            ? "bg-rose-100 text-rose-700"
                            : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                        }`}
                      >
                        {c.hidden ? <EyeOff size={12} /> : <Eye size={12} />}
                      </button>

                      <input
                        type="text"
                        value={drafts[c.id] ?? ""}
                        onChange={(e) => setDrafts((d) => ({ ...d, [c.id]: e.target.value }))}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && (drafts[c.id] ?? "").trim()) {
                            reply(c);
                          }
                        }}
                        placeholder={hasReply ? "Reply again..." : `Reply to @${c.username}...`}
                        className="flex-1 px-2 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none bg-transparent min-w-0"
                      />

                      <button
                        type="button"
                        onClick={() => reply(c)}
                        disabled={busy === `reply-${c.id}` || !(drafts[c.id] ?? "").trim()}
                        className="w-7 h-7 rounded-full bg-black hover:bg-neutral-800 text-white flex items-center justify-center shadow-xs disabled:opacity-40 transition-all cursor-pointer group shrink-0"
                      >
                        <Send size={11} className="group-hover:scale-110 transition-transform" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {canLoadMore && displayedComments.length > 0 && (
        <div className="pt-1 text-center">
          <button
            type="button"
            onClick={loadMoreComments}
            disabled={loadingMore}
            className="inline-flex items-center gap-2 rounded-full border border-[#e9e9ee] bg-white px-6 py-2.5 text-xs font-bold text-slate-900 shadow-2xs transition-all hover:border-black/40 disabled:opacity-60 cursor-pointer"
          >
            {loadingMore ? <RefreshCw size={12} className="animate-spin" /> : null}
            <span>{loadingMore ? "Loading…" : remaining > 0 ? `Load more (${remaining} left)` : "Load more"}</span>
          </button>
        </div>
      )}
    </div>
  );
}
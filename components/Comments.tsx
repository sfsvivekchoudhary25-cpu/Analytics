"use client";

import { useEffect, useState } from "react";
import { Segmented } from "antd";
import { api } from "@/lib/api";
import { AutoReplyCard, type RuleTemplate } from "./AutoReplyCard";
import { BoltIcon, CheckCircleIcon, CommentIcon, EyeIcon, InstagramIcon, RefreshIcon, SendIcon, XCircleIcon } from "./icons";

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

const card = "rounded-2xl border border-[var(--viz-border)] bg-[var(--viz-surface)] p-5 shadow-sm transition-shadow";
const when = (iso: string) =>
  new Date(iso).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
const RULE_TEMPLATES: RuleTemplate[] = [
  { name: "Price question", keywords: "price, cost, rate, how much", replyText: "Hi @{username}! For prices, please send us a DM and we'll share the details." },
  { name: "Size or stock", keywords: "size, available, stock", replyText: "Hi @{username}! Send us a DM with your size and we'll confirm availability." },
  { name: "Say thanks", keywords: "", replyText: "Thank you @{username}! 💛" },
];
const REPLY_LABEL = { manual: "You replied", auto: "Auto-reply sent", external: "Replied on Instagram" };

// Built-in canned replies for the composer's quick-reply menu — {username} is swapped in per comment.
// Anything the user adds themselves is saved alongside these in localStorage (see loadCustomTemplates below).
const DEFAULT_QUICK_REPLIES = [
  "Thank you @{username}",
  "So glad you like it, @{username} 😊",
  "Send us a DM and we'll help, @{username}!",
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

// A soft, deterministic gradient per username so avatars without a photo still feel distinct, not generic grey circles.
const AVATAR_GRADIENTS = [
  "from-fuchsia-500 to-orange-400",
  "from-violet-500 to-sky-400",
  "from-emerald-500 to-teal-400",
  "from-amber-500 to-rose-400",
  "from-sky-500 to-indigo-400",
  "from-rose-500 to-fuchsia-400",
];
function avatarGradient(username: string) {
  let hash = 0;
  for (let i = 0; i < username.length; i++) hash = (hash * 31 + username.charCodeAt(i)) >>> 0;
  return AVATAR_GRADIENTS[hash % AVATAR_GRADIENTS.length];
}

function SectionHeading({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle?: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--viz-accent)]/12 text-[var(--viz-accent)]">
        {icon}
      </span>
      <div className="min-w-0">
        <h2 className="font-semibold text-[var(--viz-ink)]">{title}</h2>
        {subtitle && <p className="text-xs text-[var(--viz-muted)]">{subtitle}</p>}
      </div>
    </div>
  );
}

const POSTS_COLLAPSED_COUNT = 6;

export function Comments() {
  const [items, setItems] = useState<Comment[] | null>(null);
  const [posts, setPosts] = useState<PostWithComments[] | null>(null);
  // Fetch everything once and split into tabs on the client, so switching tabs is instant (no refetch/flash),
  // and a comment moves itself to "Replied" the moment its status changes without needing a new request.
  const [tab, setTab] = useState<"unreplied" | "replied">("unreplied");
  const [tick, setTick] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [postsExpanded, setPostsExpanded] = useState(false);
  const [quickRepliesFor, setQuickRepliesFor] = useState<string | null>(null);
  const [customTemplates, setCustomTemplates] = useState<string[]>([]);
  const [addingTemplate, setAddingTemplate] = useState(false);
  const [newTemplate, setNewTemplate] = useState("");
  const templates = [...DEFAULT_QUICK_REPLIES, ...customTemplates];

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

  // Load now, then every 15s (new comments arrive through the webhook and a 2-minute poll on the server).
  useEffect(() => {
    let cancelled = false;
    const load = () =>
      Promise.all([api<Comment[]>("/comments?filter=all"), api<PostWithComments[]>("/comments/posts").catch(() => null)]).then(
        ([c, p]) => {
          if (cancelled) return;
          setItems(c);
          if (p) setPosts(p);
        },
        (e: Error) => !cancelled && setError(e.message),
      );
    load();
    const id = setInterval(load, 15000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [tick]);

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
      await api(`/comments/${c.id}/reply`, { method: "POST", body: JSON.stringify({ text: drafts[c.id] }) });
      setDrafts((d) => ({ ...d, [c.id]: "" }));
    });
  const hide = (c: Comment) =>
    run(`hide-${c.id}`, () => api(`/comments/${c.id}/hide`, { method: "POST", body: JSON.stringify({ hidden: !c.hidden }) }));
  // Clicking a template loads it into the reply box so it can still be tweaked before sending; the small
  // send icon on each template sends it immediately, unedited.
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

  return (
    <div className="space-y-6">
      {error && <p role="alert" className="rounded-md border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-600">{error}</p>}

      <AutoReplyCard
        basePath="/comments/auto-reply"
        noun="comments"
        templates={RULE_TEMPLATES}
        keywordsExample="e.g. price, cost, size"
        replyExample="e.g. Hi @{username}! Send us a DM and we'll help."
        maxReplyLength={2200}
      />

      {posts && posts.length > 0 && (() => {
        const totalReported = posts.reduce((n, p) => n + p.reported, 0);
        const totalVisible = posts.reduce((n, p) => n + p.visible, 0);
        const allShared = totalVisible >= totalReported;
        const visiblePosts = postsExpanded ? posts : posts.slice(0, POSTS_COLLAPSED_COUNT);
        const hiddenCount = posts.length - visiblePosts.length;
        return (
          <section className={card + " space-y-4"}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <SectionHeading
                icon={<InstagramIcon className="h-[18px] w-[18px]" />}
                title="Posts with comments"
                subtitle={`${posts.length} post${posts.length === 1 ? "" : "s"} have comments on Instagram`}
              />
              <span
                className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${
                  allShared
                    ? "bg-green-500/10 text-green-700 ring-green-500/25 dark:text-green-300"
                    : "bg-amber-500/10 text-amber-700 ring-amber-500/25 dark:text-amber-300"
                }`}
                title="Comments Instagram doesn't share can only be read and answered in the Instagram app."
              >
                {totalVisible} / {totalReported} shared here
              </span>
            </div>

            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {visiblePosts.map((p) => {
                const partial = p.visible < p.reported;
                return (
                  <li
                    key={p.mediaId}
                    className="group relative flex flex-col gap-2.5 overflow-hidden rounded-xl border border-[var(--viz-border)] bg-gradient-to-b from-transparent to-black/[0.015] p-3 transition-all hover:-translate-y-0.5 hover:border-[var(--viz-accent)]/50 hover:shadow-md dark:to-white/[0.02]"
                  >
                    <div className="flex items-start gap-3">
                      {p.thumb ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={p.thumb}
                          alt="Post"
                          referrerPolicy="no-referrer"
                          className="h-14 w-14 shrink-0 rounded-lg object-cover ring-1 ring-black/5 dark:ring-white/10"
                        />
                      ) : (
                        <div className="h-14 w-14 shrink-0 rounded-lg bg-gradient-to-br from-black/5 to-black/10 dark:from-white/10 dark:to-white/5" />
                      )}
                      <div className="min-w-0 flex-1 pt-0.5">
                        <div className="line-clamp-2 text-sm text-[var(--viz-ink)]">{p.caption || "(no caption)"}</div>
                        <div className="mt-1 text-xs text-[var(--viz-muted)]">{when(p.postedAt)}</div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-2 border-t border-[var(--viz-border)] pt-2 text-xs">
                      <span className={partial ? "font-medium text-amber-700 dark:text-amber-300" : "text-[var(--viz-ink-2)]"}>
                        {p.visible} of {p.reported} comment{p.reported === 1 ? "" : "s"} shown{partial ? " · rest on Instagram" : ""}
                      </span>
                      {p.permalink && (
                        <a
                          href={p.permalink}
                          target="_blank"
                          rel="noreferrer"
                          className="shrink-0 rounded-md px-1.5 py-0.5 font-medium text-[var(--viz-accent)] transition-colors hover:bg-[var(--viz-accent)]/10"
                        >
                          Open ↗
                        </a>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>

            {posts.length > POSTS_COLLAPSED_COUNT && (
              <button
                onClick={() => setPostsExpanded((v) => !v)}
                className="text-xs font-semibold text-[var(--viz-accent)] underline decoration-dotted underline-offset-2 hover:decoration-solid"
              >
                {postsExpanded ? "Show fewer" : `Show all ${posts.length} posts (${hiddenCount} more)`}
              </button>
            )}
          </section>
        );
      })()}

      {(() => {
        // Our own replies are already shown nested ("You: …") under the comment they answered — listing them
        // again as their own top-level card just duplicates the same text and doubles the visual noise.
        const all = items?.filter((c) => !c.isOwn) ?? null;
        const needsReply = all?.filter((c) => !c.repliedAt) ?? null;
        const replied = all?.filter((c) => c.repliedAt) ?? null;
        const visible = tab === "unreplied" ? needsReply : replied;
        return (
      <section className={card + " relative isolate space-y-4"}>
        {/* Soft decorative wash behind the (semi-transparent, blurred) comment cards — clipped to its own
            layer, not the section, so it doesn't cut off the quick-reply menu when a card is short. */}
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden rounded-[inherit]">
          <div className="absolute -left-20 -top-24 h-72 w-72 rounded-full bg-gradient-to-br from-violet-400/35 to-sky-300/25 blur-3xl" />
          <div className="absolute -bottom-28 -right-16 h-80 w-80 rounded-full bg-gradient-to-br from-amber-300/30 to-rose-300/25 blur-3xl" />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <SectionHeading
            icon={<CommentIcon className="h-[18px] w-[18px]" />}
            title="Comments on your posts"
            subtitle={all ? `${all.length} comment${all.length === 1 ? "" : "s"} on your posts` : undefined}
          />
          <div className="flex items-center gap-2">
            <Segmented
              value={tab}
              onChange={(t) => setTab(t as "unreplied" | "replied")}
              options={[
                {
                  value: "unreplied",
                  label: (
                    <span className="flex items-center gap-1.5">
                      <span>Needs reply</span>
                      {needsReply?.length !== undefined && (
                        <span className="rounded-full bg-slate-200/80 px-1.5 py-0.2 text-[10px] font-semibold text-slate-700">
                          {needsReply.length}
                        </span>
                      )}
                    </span>
                  ),
                },
                {
                  value: "replied",
                  label: (
                    <span className="flex items-center gap-1.5">
                      <span>Replied</span>
                      {replied?.length !== undefined && (
                        <span className="rounded-full bg-slate-200/80 px-1.5 py-0.2 text-[10px] font-semibold text-slate-700">
                          {replied.length}
                        </span>
                      )}
                    </span>
                  ),
                },
              ]}
              className="!rounded-xl"
            />
            <button
              onClick={refresh}
              disabled={busy === "refresh"}
              className="flex items-center gap-1.5 rounded-full border border-[var(--viz-border)] px-3 py-1.5 text-sm text-[var(--viz-ink-2)] transition-colors hover:bg-black/5 disabled:opacity-50 dark:hover:bg-white/10"
            >
              <RefreshIcon className={`h-3.5 w-3.5 ${busy === "refresh" ? "animate-spin" : ""}`} />
              {busy === "refresh" ? "Checking…" : "Refresh"}
            </button>
          </div>
        </div>

        {!visible && (
          <ul className="space-y-3">
            {[0, 1, 2].map((i) => (
              <li key={i} className="flex gap-3 rounded-xl border border-[var(--viz-border)] p-3">
                <div className="h-14 w-14 shrink-0 animate-pulse rounded-lg bg-black/5 dark:bg-white/10" />
                <div className="flex-1 space-y-2 py-1">
                  <div className="h-3 w-32 animate-pulse rounded bg-black/5 dark:bg-white/10" />
                  <div className="h-3 w-full max-w-md animate-pulse rounded bg-black/5 dark:bg-white/10" />
                </div>
              </li>
            ))}
          </ul>
        )}
        {visible?.length === 0 && (
          <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-[var(--viz-border)] py-10 text-center">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--viz-accent)]/10 text-[var(--viz-accent)]">
              <CommentIcon className="h-5 w-5" />
            </span>
            <p className="max-w-sm text-sm text-[var(--viz-muted)]">
              {tab === "unreplied"
                ? "Nothing needs a reply right now. New comments appear here within a couple of minutes. While your Meta app is in Development mode, Instagram only shares comments from accounts that have a role on the app."
                : "No replied comments yet — once you (or an automation) reply, they'll show up here."}
            </p>
          </div>
        )}

        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {visible?.map((c) => {
            const accent = c.autoState === "failed" ? "border-l-red-500" : c.replyKind ? "border-l-green-500" : "border-l-transparent";
            return (
              <li
                key={c.id}
                className={`relative flex flex-col gap-3 rounded-3xl border border-white/40 border-l-[3px] bg-[var(--viz-surface)]/55 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.5),0_2px_10px_rgba(0,0,0,0.05)] backdrop-blur-xl transition-all hover:-translate-y-0.5 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.5),0_10px_28px_rgba(0,0,0,0.1)] dark:border-white/10 dark:bg-white/[0.06] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_2px_10px_rgba(0,0,0,0.2)] ${accent}`}
              >
                <div className="flex items-start gap-2.5">
                  {c.mediaThumb && c.mediaPermalink ? (
                    <a href={c.mediaPermalink} target="_blank" rel="noreferrer" className="shrink-0" title="Open the post">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={c.mediaThumb}
                        alt="Post"
                        referrerPolicy="no-referrer"
                        className="h-11 w-11 rounded-full object-cover ring-2 ring-black/10 dark:ring-white/15"
                      />
                    </a>
                  ) : (
                    <div
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${avatarGradient(c.username || "?")} text-sm font-semibold text-white ring-2 ring-black/10 dark:ring-white/15`}
                    >
                      {(c.username || "?")[0]?.toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0 flex-1 pt-1">
                    <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
                      <strong className="truncate text-[15px] font-semibold text-[var(--viz-ink)]">@{c.username || "unknown"}</strong>
                      <span className="text-[var(--viz-muted)]">·</span>
                      <span className="shrink-0 text-sm text-[var(--viz-muted)]">{when(c.commentedAt)}</span>
                    </div>
                    {(c.hidden || c.replyKind || c.autoState === "failed") && (
                      <div className="mt-1 flex flex-wrap items-center gap-1">
                        {c.hidden && <span className="rounded-full bg-black/10 px-2 py-0.5 text-xs dark:bg-white/15">hidden</span>}
                        {c.replyKind && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-green-500/10 px-2 py-0.5 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-500/20 dark:text-green-300">
                            <CheckCircleIcon className="h-3 w-3" />
                            {REPLY_LABEL[c.replyKind]}
                          </span>
                        )}
                        {c.autoState === "failed" && (
                          <span
                            className="inline-flex items-center gap-1 rounded-full bg-red-500/10 px-2 py-0.5 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-500/20 dark:text-red-300"
                            title={c.autoNote ?? ""}
                          >
                            <XCircleIcon className="h-3 w-3" />
                            auto-reply failed
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <p className="inline-block w-fit max-w-full whitespace-pre-wrap break-words rounded-2xl bg-black/[0.045] px-4 py-2.5 text-[15px] text-[var(--viz-ink)] dark:bg-white/[0.06]">
                  {c.text}
                </p>
                {c.myReply && (
                  <p className="ml-4 inline-block w-fit max-w-full whitespace-pre-wrap break-words self-end rounded-2xl bg-[var(--viz-accent)]/10 px-3.5 py-2 text-xs text-[var(--viz-ink-2)]">
                    <span className="font-semibold text-[var(--viz-accent)]">You </span>
                    {c.myReply}
                  </p>
                )}
                {c.autoState === "failed" && c.autoNote && <p className="text-xs text-red-600">{c.autoNote}</p>}

                {!c.isOwn && (
                  <div className="relative mt-auto flex items-center gap-1 rounded-full border border-black/10 bg-black/[0.04] py-1 pl-1 pr-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.5)] backdrop-blur-md transition-shadow focus-within:ring-2 focus-within:ring-black/10 dark:border-white/10 dark:bg-white/[0.06] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] dark:focus-within:ring-white/15">
                    {quickRepliesFor === c.id && (
                      <>
                        <div
                          className="fixed inset-0 z-40"
                          onClick={() => {
                            setQuickRepliesFor(null);
                            setAddingTemplate(false);
                          }}
                        />
                        <div className="absolute bottom-full left-0 z-50 mb-2 w-72 space-y-0.5 rounded-2xl border border-black/10 bg-[var(--viz-surface)] p-1.5 shadow-lg backdrop-blur-xl dark:border-white/10">
                          <p className="px-2 pb-1 pt-0.5 text-xs font-medium text-[var(--viz-muted)]">
                            Quick reply <span className="opacity-70">— click to edit, or send as-is</span>
                          </p>
                          <div className="max-h-56 space-y-0.5 overflow-y-auto">
                            {templates.map((t) => {
                              const isCustom = customTemplates.includes(t);
                              return (
                                <div key={t} className="group flex items-center gap-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/10">
                                  <button
                                    onClick={() => useTemplate(c, t)}
                                    className="min-w-0 flex-1 truncate px-2 py-1.5 text-left text-sm text-[var(--viz-ink)]"
                                    title="Load into the reply box to edit"
                                  >
                                    {t.replaceAll("{username}", c.username || "there")}
                                  </button>
                                  <button
                                    onClick={() => sendTemplate(c, t)}
                                    disabled={busy === `reply-${c.id}`}
                                    title="Send as-is"
                                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[var(--viz-ink-2)] opacity-0 transition-opacity group-hover:opacity-100 hover:bg-black/10 disabled:opacity-30 dark:hover:bg-white/15"
                                  >
                                    <SendIcon className="h-3 w-3" />
                                  </button>
                                  {isCustom && (
                                    <button
                                      onClick={() => removeTemplate(t)}
                                      title="Remove this template"
                                      className="mr-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[var(--viz-ink-2)] opacity-0 transition-opacity group-hover:opacity-100 hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400"
                                    >
                                      <XCircleIcon className="h-3.5 w-3.5" />
                                    </button>
                                  )}
                                </div>
                              );
                            })}
                          </div>

                          <div className="mt-1 border-t border-black/10 pt-1 dark:border-white/10">
                            {addingTemplate ? (
                              <div className="flex items-center gap-1 px-1 py-0.5">
                                <input
                                  autoFocus
                                  value={newTemplate}
                                  onChange={(e) => setNewTemplate(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") addTemplate();
                                    if (e.key === "Escape") setAddingTemplate(false);
                                  }}
                                  placeholder="New template… use {username} for the name"
                                  maxLength={500}
                                  className="min-w-0 flex-1 rounded-lg border border-[var(--viz-border)] bg-transparent px-2 py-1 text-sm outline-none focus:border-[var(--viz-accent)]"
                                />
                                <button
                                  onClick={addTemplate}
                                  disabled={!newTemplate.trim()}
                                  className="rounded-lg bg-[var(--viz-accent)] px-2 py-1 text-xs font-medium text-white disabled:opacity-40"
                                >
                                  Save
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setAddingTemplate(true)}
                                className="flex w-full items-center gap-1.5 rounded-lg px-2 py-1.5 text-left text-sm font-medium text-[var(--viz-accent)] hover:bg-black/5 dark:hover:bg-white/10"
                              >
                                + Add your own template
                              </button>
                            )}
                          </div>
                        </div>
                      </>
                    )}
                    <button
                      onClick={() => setQuickRepliesFor((id) => (id === c.id ? null : c.id))}
                      title="Quick replies"
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors ${
                        quickRepliesFor === c.id
                          ? "bg-[var(--viz-accent)]/15 text-[var(--viz-accent)]"
                          : "text-[var(--viz-ink-2)] hover:bg-black/5 dark:hover:bg-white/10"
                      }`}
                    >
                      <BoltIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => hide(c)}
                      disabled={busy === `hide-${c.id}`}
                      title={c.hidden ? "Unhide" : "Hide"}
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors disabled:opacity-50 ${
                        c.hidden ? "text-[var(--viz-accent)]" : "text-[var(--viz-ink-2)] hover:bg-black/5 dark:hover:bg-white/10"
                      }`}
                    >
                      <EyeIcon className="h-4 w-4" />
                    </button>
                    <input
                      value={drafts[c.id] ?? ""}
                      onChange={(e) => setDrafts((d) => ({ ...d, [c.id]: e.target.value }))}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && (drafts[c.id] ?? "").trim()) reply(c);
                      }}
                      placeholder={c.repliedAt ? "Send another reply…" : "Add a reply…"}
                      maxLength={2200}
                      className="min-w-0 flex-1 bg-transparent py-1 text-sm outline-none placeholder:text-[var(--viz-muted)]"
                    />
                    <button
                      onClick={() => reply(c)}
                      disabled={busy === `reply-${c.id}` || !(drafts[c.id] ?? "").trim()}
                      title="Send reply"
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--viz-ink-2)]/80 text-[var(--viz-surface)] shadow-sm transition-opacity hover:opacity-90 disabled:opacity-40 dark:bg-white/25 dark:text-white"
                    >
                      <SendIcon className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </section>
        );
      })()}
    </div>
  );
}

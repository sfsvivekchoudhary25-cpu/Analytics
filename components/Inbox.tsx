"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Tooltip, Dropdown, Skeleton } from "antd";
import {
  SearchOutlined,
  TeamOutlined,
  SettingOutlined,
  BellOutlined,
  DownOutlined,
  PlusOutlined,
  AudioOutlined,
  VideoCameraOutlined,
  EllipsisOutlined,
  SmileOutlined,
  FileTextOutlined,
  GiftOutlined,
  SendOutlined,
  ReloadOutlined,
  LinkOutlined,
  DeleteOutlined,
  ArrowLeftOutlined,
} from "@ant-design/icons";
import { api } from "@/lib/api";

type Conversation = {
  igsid: string;
  username: string | null;
  profilePic?: string | null;
  lastText: string;
  lastMessageAt: string;
  unread: number;
  canReply: boolean;
  replyUntil: string | null;
};

type Message = {
  id: string;
  direction: "in" | "out";
  text: string;
  attachmentType: string | null;
  attachmentUrl: string | null;
  createdAt: string;
};

type Thread = { conversation: Conversation; messages: Message[] };

const time = (iso: string) =>
  new Date(iso).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });

const dayKey = (iso: string) => new Date(iso).toDateString();

function dayLabel(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString(undefined, { day: "numeric", month: "long" });
}

function cleanUsername(c?: { username: string | null; igsid: string } | null) {
  if (!c) return "User";
  return c.username ? c.username.replace(/^@/, "") : `user_${c.igsid.slice(-4)}`;
}

const AVATAR_PALETTES = [
  "bg-slate-700 text-slate-100",
  "bg-zinc-800 text-zinc-100",
  "bg-stone-700 text-stone-100",
  "bg-indigo-900/90 text-indigo-100",
  "bg-slate-800 text-slate-200",
  "bg-neutral-800 text-neutral-100",
  "bg-blue-900/80 text-blue-100",
];

function ContactAvatar({
  id,
  src,
  size = "h-8 w-8",
}: {
  id: string;
  src?: string | null;
  size?: string;
}) {
  const [failed, setFailed] = useState(false);
  const char = id.replace("@", "")[0]?.toUpperCase() ?? "?";

  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  const colorClass = AVATAR_PALETTES[hash % AVATAR_PALETTES.length];

  if (!failed && src) {
    return (
      <img
        src={src}
        alt={id}
        referrerPolicy="no-referrer"
        crossOrigin={src.startsWith("data:") ? undefined : "anonymous"}
        onError={() => setFailed(true)}
        className={`${size} shrink-0 rounded-full object-cover ring-1 ring-slate-200 select-none`}
      />
    );
  }

  return (
    <div
      className={`${size} shrink-0 flex items-center justify-center rounded-full ${colorClass} text-xs font-semibold select-none shadow-2xs`}
    >
      {char}
    </div>
  );
}

export function Inbox({
  username,
  ownAvatar,
  onOpenAutomations,
  targetUsername,
  initialMessageText,
}: {
  username?: string;
  ownAvatar?: string | null;
  onOpenAutomations?: () => void;
  targetUsername?: string | null;
  initialMessageText?: string | null;
}) {
  // Real Conversations & Active Thread
  const [list, setList] = useState<Conversation[] | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [thread, setThread] = useState<Thread | null>(null);
  // Mobile responsive view toggle: "list" for conversation sidebar, "chat" for active thread
  const [mobileView, setMobileView] = useState<"list" | "chat">("list");
  const targetAppliedRef = useRef<string | null>(null);
  const initialTextAppliedRef = useRef(false);

  useEffect(() => {
    if (initialMessageText && !initialTextAppliedRef.current) {
      setInputText(initialMessageText);
      initialTextAppliedRef.current = true;
    }
  }, [initialMessageText]);

  // Smart Channel Filters: "all" | "unread" | "active24" | "replied"
  const [activeChannel, setActiveChannel] = useState<string>("all");

  // Input & Status states
  const [inputText, setInputText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [syncNote, setSyncNote] = useState<string | null>(null);
  const [autoReply, setAutoReply] = useState<{
    enabled: boolean;
    ai?: { enabled: boolean; available: boolean; pausedUntil?: string | null };
    rules: { id: string; enabled: boolean }[];
  } | null>(null);

  // Search filter
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Fetch auto-reply status
  useEffect(() => {
    let cancelled = false;
    const fetchAutoReply = () => {
      api<{
        enabled: boolean;
        ai?: { enabled: boolean; available: boolean; pausedUntil?: string | null };
        rules: { id: string; enabled: boolean }[];
      }>("/messages/auto-reply").then(
        (data) => !cancelled && setAutoReply(data),
        () => undefined
      );
    };
    fetchAutoReply();
    const id = setInterval(fetchAutoReply, 10000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  // Polling every 3s for live messages
  useEffect(() => {
    let cancelled = false;
    const load = () =>
      Promise.all([
        api<Conversation[]>("/messages/conversations"),
        selected
          ? api<Thread>(`/messages/conversations/${selected}`)
          : Promise.resolve(null),
      ]).then(
        ([l, t]) => {
          if (cancelled) return;
          setList(l);
          if (t) setThread(t);
          // Prioritize targetUsername if specified
          if (targetUsername && l && l.length > 0 && targetAppliedRef.current !== targetUsername) {
            const cleanTarget = targetUsername.toLowerCase().replace(/^@/, "").trim();
            const matched =
              l.find((c) => (c.username || "").toLowerCase().replace(/^@/, "").trim() === cleanTarget) ||
              l.find((c) => (c.username || "").toLowerCase().replace(/^@/, "").trim().includes(cleanTarget));

            if (matched) {
              targetAppliedRef.current = targetUsername;
              setSelected(matched.igsid);
              setMobileView("chat");
              setError(null);
              return;
            }
          }

          // Auto select first real conversation if none is selected
          if (!selected && l && l.length > 0) {
            setSelected(l[0].igsid);
          }
          setError(null);
        },
        (e: Error) => !cancelled && setError(e.message)
      );

    load();
    const id = setInterval(load, 3000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [selected]);

  // Scroll only the message container to the bottom
  const msgCount = thread?.messages.length;
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
      const timer = setTimeout(() => {
        if (messagesContainerRef.current) {
          messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
        }
      }, 60);
      return () => clearTimeout(timer);
    }
  }, [msgCount, selected]);

  // Sync from Instagram
  async function syncNow() {
    setSyncing(true);
    setSyncError(null);
    setError(null);
    try {
      const r = await api<{ conversations: number; newMessages: number }>("/messages/sync", {
        method: "POST",
      });
      setSyncNote(
        r.newMessages ? `Imported ${r.newMessages} new messages` : "Inbox up to date"
      );
      setTimeout(() => setSyncNote(null), 3500);
      const l = await api<Conversation[]>("/messages/conversations");
      setList(l);
      if (selected) {
        const t = await api<Thread>(`/messages/conversations/${selected}`);
        setThread(t);
      } else if (l.length > 0) {
        setSelected(l[0].igsid);
      }
    } catch (err) {
      const msg = (err as Error).message;
      setSyncError(msg);
      setError(msg);
    } finally {
      setSyncing(false);
    }
  }

  // Delete conversation from dashboard
  async function removeConversation(igsid: string) {
    if (
      !confirm(
        "Delete this conversation from this dashboard? (It will not be deleted from Instagram)"
      )
    )
      return;
    try {
      await api(`/messages/conversations/${igsid}`, { method: "DELETE" });
      setSelected(null);
      setThread(null);
      const l = await api<Conversation[]>("/messages/conversations");
      setList(l);
      if (l.length > 0) setSelected(l[0].igsid);
    } catch (err) {
      setError((err as Error).message);
    }
  }

  // Send reply
  async function handleSend(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!selected || !inputText.trim() || sending) return;

    const textToSend = inputText.trim();
    setInputText("");
    setSending(true);
    setError(null);

    // Optimistically show message right away
    const optimisticMsg: Message = {
      id: "temp-" + Date.now(),
      direction: "out",
      text: textToSend,
      attachmentType: null,
      attachmentUrl: null,
      createdAt: new Date().toISOString(),
    };
    setThread((prev) => (prev ? { ...prev, messages: [...prev.messages, optimisticMsg] } : prev));
    setList((prev) =>
      prev
        ? prev.map((c) =>
            c.igsid === selected
              ? { ...c, lastText: textToSend, lastMessageAt: new Date().toISOString() }
              : c
          )
        : prev
    );

    try {
      try {
        await api(`/messages/conversations/${selected}/reply`, {
          method: "POST",
          body: JSON.stringify({ text: textToSend }),
        });
      } catch (err) {
        if ((err as Error).message.includes("404")) {
          await api(`/messages/conversations/${selected}/send`, {
            method: "POST",
            body: JSON.stringify({ text: textToSend }),
          });
        } else {
          throw err;
        }
      }

      const t = await api<Thread>(`/messages/conversations/${selected}`);
      setThread(t);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSending(false);
    }
  }

  // Real filtered conversation list
  const filteredList = useMemo(() => {
    if (!list) return null;
    let result = list;

    // Never show the currently connected user's own account in the DM list
    const ownHandle = (username || "").replace(/^@/, "").toLowerCase().trim();
    if (ownHandle) {
      result = result.filter(
        (c) => cleanUsername(c).toLowerCase() !== ownHandle
      );
    }

    // Apply Channel category filter
    if (activeChannel === "unread") {
      result = result.filter((c) => c.unread > 0);
    } else if (activeChannel === "active24") {
      result = result.filter((c) => c.canReply);
    }

    // Apply Search query
    const q = searchQuery.toLowerCase().trim();
    if (q) {
      result = result.filter(
        (c) =>
          cleanUsername(c).toLowerCase().includes(q) ||
          c.lastText.toLowerCase().includes(q)
      );
    }

    return result;
  }, [list, activeChannel, searchQuery, username]);

  const cleanOwnUsername = username ? username.replace(/^@/, "") : "instagram_user";
  const unreadTotal = list ? list.reduce((acc, c) => acc + c.unread, 0) : 0;
  const active24Total = list ? list.filter((c) => c.canReply).length : 0;

  // Status indicator for Auto-reply (Green = active, Yellow = warning/paused, Red = disabled)
  const autoReplyIndicator = useMemo(() => {
    if (!autoReply) {
      return {
        color: "bg-slate-300 ring-2 ring-slate-200",
        tooltip: "Checking auto-reply status…",
      };
    }
    const rulesOn = !!autoReply.enabled;
    const activeRulesCount = autoReply.rules?.filter((r) => r.enabled).length ?? 0;
    const aiOn = !!autoReply.ai?.enabled;
    const aiAvailable = !!autoReply.ai?.available;
    const aiPaused = !!autoReply.ai?.pausedUntil && new Date(autoReply.ai.pausedUntil) > new Date();

    if (aiPaused) {
      return {
        color: "bg-amber-400 ring-2 ring-amber-400/20",
        tooltip: "Auto-reply warning: AI temporarily paused",
      };
    }
    if (rulesOn && activeRulesCount === 0 && !aiOn) {
      return {
        color: "bg-amber-400 ring-2 ring-amber-400/20",
        tooltip: "Auto-reply warning: Rules enabled but none active",
      };
    }
    if ((aiOn && aiAvailable) || (rulesOn && activeRulesCount > 0)) {
      return {
        color: "bg-emerald-500 ring-2 ring-emerald-500/25",
        tooltip:
          rulesOn && aiOn
            ? "Auto-reply active (AI & rules enabled)"
            : aiOn
            ? "Auto-reply active (AI enabled)"
            : "Auto-reply active (Rules enabled)",
      };
    }
    return {
      color: "bg-rose-500 ring-2 ring-rose-500/20",
      tooltip: "Auto-reply disabled",
    };
  }, [autoReply]);

  // Status indicator for Sync (Green = up to date, Yellow = syncing, Red = error)
  const syncIndicator = useMemo(() => {
    if (syncing) {
      return {
        isPulsing: true,
        color: "bg-amber-500 ring-2 ring-amber-500/25",
        tooltip: "Syncing with Instagram in progress…",
      };
    }
    if (syncError) {
      return {
        isPulsing: false,
        color: "bg-rose-500 ring-2 ring-rose-500/20",
        tooltip: `Sync error: ${syncError} (click to retry)`,
      };
    }
    return {
      isPulsing: false,
      color: "bg-emerald-500 ring-2 ring-emerald-500/25",
      tooltip: "Synced with Instagram (up to date)",
    };
  }, [syncing, syncError]);

  return (
    <div className="flex h-full w-full overflow-hidden bg-white select-none">
      {/* ---------------- LEFT SIDEBAR (CHANNELS & REAL INSTAGRAM DMs) ---------------- */}
      <aside className={`h-full shrink-0 flex-col border-r border-slate-200/80 bg-[#f9fafc] ${
        mobileView === "list" ? "flex w-full" : "hidden"
      } md:flex md:w-64 lg:w-72`}>
        {/* Workspace / Account Header */}
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-slate-200/70 px-4">
          <div className="flex items-center gap-2.5 min-w-0">
            <ContactAvatar id={cleanOwnUsername} src={ownAvatar} size="h-7 w-7" />
            <span className="truncate text-sm font-bold tracking-tight text-slate-900">
              @{cleanOwnUsername}
            </span>
          </div>
          <Dropdown
            menu={{
              items: [
                {
                  key: "sync",
                  label: (
                    <div className="flex items-center justify-between gap-4">
                      <span>Sync Instagram Messages</span>
                      <span className={`h-2 w-2 rounded-full ${syncIndicator.color}`} />
                    </div>
                  ),
                  icon: <ReloadOutlined spin={syncing} />,
                  onClick: syncNow,
                },
                {
                  key: "rules",
                  label: (
                    <div className="flex items-center justify-between gap-4">
                      <span>Auto-reply Rules</span>
                      <span className={`h-2 w-2 rounded-full ${autoReplyIndicator.color}`} />
                    </div>
                  ),
                  icon: <SettingOutlined />,
                  onClick: onOpenAutomations,
                },
              ],
            }}
            trigger={["click"]}
          >
            <button className="text-slate-400 hover:text-slate-700 transition-colors p-1">
              <DownOutlined className="text-xs" />
            </button>
          </Dropdown>
        </div>

        {/* Scrollable Navigation */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-5">
          {/* OPTIONS */}
          <div>
            <div className="px-2 pb-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Options
            </div>
            <ul className="space-y-0.5 text-xs font-medium text-slate-700">
              <li>
                <button
                  onClick={() => setSearchOpen((v) => !v)}
                  className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 hover:bg-slate-200/50 transition-colors text-left"
                >
                  <SearchOutlined className="text-slate-400 text-sm" />
                  <span>Search</span>
                </button>
              </li>
              {searchOpen && (
                <li className="px-2 py-1">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search direct messages..."
                    className="w-full rounded-md border border-slate-300 bg-white px-2 py-1 text-xs text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none"
                    autoFocus
                  />
                </li>
              )}
              <li>
                <button
                  onClick={onOpenAutomations}
                  className="flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 hover:bg-slate-200/50 transition-colors text-left group"
                >
                  <div className="flex items-center gap-2.5">
                    <SettingOutlined className="text-slate-400 text-sm group-hover:text-slate-600 transition-colors" />
                    <span>Auto-reply Rules</span>
                  </div>
                  <Tooltip title={autoReplyIndicator.tooltip} placement="right">
                    <span className="flex h-3 w-3 items-center justify-center">
                      <span className={`h-2 w-2 rounded-full ${autoReplyIndicator.color}`} />
                    </span>
                  </Tooltip>
                </button>
              </li>
              <li>
                <button
                  onClick={syncNow}
                  className="flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 hover:bg-slate-200/50 transition-colors text-left group"
                >
                  <div className="flex items-center gap-2.5">
                    <BellOutlined
                      className={`text-sm ${
                        syncing ? "animate-spin text-blue-600" : "text-slate-400 group-hover:text-slate-600 transition-colors"
                      }`}
                    />
                    <span>Sync with Instagram</span>
                  </div>
                  <Tooltip title={syncIndicator.tooltip} placement="right">
                    <span className="flex h-3 w-3 items-center justify-center">
                      {syncIndicator.isPulsing ? (
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                        </span>
                      ) : (
                        <span className={`h-2 w-2 rounded-full ${syncIndicator.color}`} />
                      )}
                    </span>
                  </Tooltip>
                </button>
              </li>
            </ul>
          </div>

          {/* CHANNELS / SMART FILTERS */}
          <div>
            <div className="flex items-center justify-between px-2 pb-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Channels
              </span>
              <Tooltip title="Sync Instagram">
                <button
                  onClick={syncNow}
                  className="text-slate-400 hover:text-slate-700 p-0.5"
                >
                  <PlusOutlined className="text-[11px]" />
                </button>
              </Tooltip>
            </div>
            <ul className="space-y-1 text-sm font-medium">
              {/* Channel: # All-Messages */}
              <li>
                <button
                  onClick={() => setActiveChannel("all")}
                  className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left transition-colors ${
                    activeChannel === "all"
                      ? "bg-blue-600 text-white font-semibold shadow-xs"
                      : "text-slate-700 hover:bg-slate-200/50"
                  }`}
                >
                  <span className="truncate"># All-Messages</span>
                  {list && list.length > 0 && (
                    <span
                      className={`flex h-4 min-w-4 items-center justify-center rounded-full px-1.5 text-[10px] font-bold ${
                        activeChannel === "all"
                          ? "bg-blue-700 text-white"
                          : "bg-slate-200 text-slate-600"
                      }`}
                    >
                      {list.length}
                    </span>
                  )}
                </button>
              </li>

              {/* Channel: # Unread-DMs */}
              <li>
                <button
                  onClick={() => setActiveChannel("unread")}
                  className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left transition-colors ${
                    activeChannel === "unread"
                      ? "bg-blue-600 text-white font-semibold shadow-xs"
                      : "text-slate-700 hover:bg-slate-200/50"
                  }`}
                >
                  <span className="truncate"># Unread-DMs</span>
                  {unreadTotal > 0 && (
                    <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-[#ee4e4e] px-1.5 text-[10px] font-bold text-white">
                      {unreadTotal}
                    </span>
                  )}
                </button>
              </li>

              {/* Channel: # Active-24h */}
              <li>
                <button
                  onClick={() => setActiveChannel("active24")}
                  className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left transition-colors ${
                    activeChannel === "active24"
                      ? "bg-blue-600 text-white font-semibold shadow-xs"
                      : "text-slate-700 hover:bg-slate-200/50"
                  }`}
                >
                  <span className="truncate"># Active-24h</span>
                  {active24Total > 0 && (
                    <span
                      className={`flex h-4 min-w-4 items-center justify-center rounded-full px-1.5 text-[10px] font-bold ${
                        activeChannel === "active24"
                          ? "bg-blue-700 text-white"
                          : "bg-emerald-100 text-emerald-700"
                      }`}
                    >
                      {active24Total}
                    </span>
                  )}
                </button>
              </li>
            </ul>
          </div>

          {/* REAL DIRECT MESSAGES */}
          <div>
            <div className="flex items-center justify-between px-2 pb-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Direct Message
              </span>
              <Tooltip title="Refresh from Instagram">
                <button
                  onClick={syncNow}
                  className="text-slate-400 hover:text-slate-700 p-0.5"
                >
                  <PlusOutlined className="text-[11px]" />
                </button>
              </Tooltip>
            </div>

            {/* Skeleton Loading */}
            {!list && (
              <div className="space-y-2 p-2">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Skeleton.Avatar active size={24} />
                    <Skeleton.Input active size="small" style={{ width: 120, height: 16 }} />
                  </div>
                ))}
              </div>
            )}

            {/* Empty list */}
            {filteredList && filteredList.length === 0 && (
              <div className="py-6 px-2 text-center text-xs text-slate-400">
                No direct messages found.
              </div>
            )}

            {/* Real Instagram Conversations */}
            <ul className="space-y-1 text-sm font-medium">
              {filteredList?.map((c) => {
                const isSelected = selected === c.igsid;
                const name = cleanUsername(c);

                return (
                  <li key={c.igsid}>
                    <button
                      onClick={() => {
                        setSelected(c.igsid);
                        setThread(null);
                        setMobileView("chat");
                      }}
                      className={`flex w-full items-center justify-between rounded-xl px-2.5 py-2 text-left transition-colors cursor-pointer ${
                        isSelected
                          ? "bg-blue-50 text-blue-700 font-semibold ring-1 ring-blue-500/20"
                          : "text-slate-700 hover:bg-slate-200/50"
                      }`}
                    >
                      <div className="flex min-w-0 items-center gap-2.5 flex-1">
                        <ContactAvatar id={name} src={c.profilePic} size="h-8 w-8 sm:h-7 sm:w-7" />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-1">
                            <span className="truncate text-xs font-bold text-slate-900">
                              @{name}
                            </span>
                            {c.lastMessageAt && (
                              <span className="text-[10px] text-slate-400 shrink-0 font-normal">
                                {time(c.lastMessageAt)}
                              </span>
                            )}
                          </div>
                          {c.lastText && (
                            <p className="text-[11px] text-slate-400 truncate mt-0.5 font-normal">
                              {c.lastText}
                            </p>
                          )}
                        </div>
                      </div>
                      {c.unread > 0 && (
                        <span className="ml-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#ee4e4e] px-1.5 text-[10px] font-bold text-white shrink-0">
                          {c.unread}
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        {/* Sync notification note */}
        {syncNote && (
          <div className="border-t border-slate-200 bg-blue-50 px-4 py-2 text-center text-xs font-semibold text-blue-600">
            {syncNote}
          </div>
        )}
      </aside>

      {/* ---------------- RIGHT CHAT AREA (REAL INSTAGRAM THREAD) ---------------- */}
      <section className={`flex-col h-full min-h-0 bg-white ${
        mobileView === "chat" ? "flex w-full flex-1" : "hidden"
      } md:flex md:flex-1`}>
        {/* Top Header Bar */}
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-slate-200/80 px-3 sm:px-6 bg-white gap-2">
          {/* Left Title & Status + Mobile Back Button */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            <button
              type="button"
              onClick={() => setMobileView("list")}
              className="flex md:hidden h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 active:scale-95 transition-all cursor-pointer"
              aria-label="Back to conversations"
            >
              <ArrowLeftOutlined className="text-xs" />
            </button>
            <div className="min-w-0 flex-1">
              <h1 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight truncate">
                {thread?.conversation
                  ? `@${cleanUsername(thread.conversation)}`
                  : selected
                  ? `@${selected}`
                  : "# Direct Messages"}
              </h1>
              <div className="flex items-center gap-1.5 sm:gap-2 mt-0.5 min-w-0">
                {thread?.conversation && (
                  <div className="flex -space-x-1.5 shrink-0">
                    <ContactAvatar id={cleanUsername(thread.conversation)} src={thread.conversation.profilePic} size="h-4 w-4" />
                    <ContactAvatar id={cleanOwnUsername} src={ownAvatar} size="h-4 w-4" />
                  </div>
                )}
                <span className="text-[11px] sm:text-xs text-slate-500 font-normal truncate">
                  {thread?.conversation?.canReply ? (
                    <span className="font-medium text-emerald-600">
                      • Online (Reply window open)
                    </span>
                  ) : (
                    <span className="font-medium text-slate-400">
                      • 24h window closed
                    </span>
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Right Action Icons: Profile Link, Sync, More */}
          <div className="flex items-center gap-1 sm:gap-2 text-slate-400 shrink-0">
            {thread?.conversation?.username && (
              <Tooltip title="View Instagram Profile">
                <a
                  href={`https://instagram.com/${thread.conversation.username}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-slate-100 hover:text-slate-700 transition-colors"
                >
                  <LinkOutlined className="text-sm sm:text-base" />
                </a>
              </Tooltip>
            )}
            <Tooltip title="Sync conversation">
              <button
                onClick={syncNow}
                className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-slate-100 hover:text-slate-700 transition-colors"
              >
                <ReloadOutlined className={`text-sm sm:text-base ${syncing ? "animate-spin text-blue-600" : ""}`} />
              </button>
            </Tooltip>
            {thread?.conversation && (
              <Dropdown
                menu={{
                  items: [
                    {
                      key: "del",
                      label: "Delete conversation",
                      icon: <DeleteOutlined />,
                      danger: true,
                      onClick: () => removeConversation(thread.conversation.igsid),
                    },
                  ],
                }}
                placement="bottomRight"
                trigger={["click"]}
              >
                <button className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-slate-100 hover:text-slate-700 transition-colors">
                  <EllipsisOutlined className="text-sm sm:text-base" />
                </button>
              </Dropdown>
            )}
          </div>
        </header>

        {/* Real Message Stream (Slack Timeline format) */}
        <div
          ref={messagesContainerRef}
          className="flex-1 min-h-0 overflow-y-auto px-3 sm:px-6 md:px-8 py-3 sm:py-5 space-y-3 sm:space-y-3.5"
        >
          {/* Skeleton while thread loading */}
          {selected && !thread && (
            <div className="space-y-4">
              {[0, 1, 2].map((i) => (
                <div key={i} className="flex items-start gap-3">
                  <Skeleton.Avatar active size={36} />
                  <div className="space-y-2 flex-1">
                    <Skeleton.Input active size="small" style={{ width: 140, height: 16 }} />
                    <Skeleton.Input active size="small" style={{ width: 320, height: 36 }} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* When thread is loaded with real messages */}
          {thread?.messages?.map((m, idx) => {
            const prev = thread.messages[idx - 1];
            const showDivider = !prev || dayKey(prev.createdAt) !== dayKey(m.createdAt);
            const isOut = m.direction === "out";

            const senderName = isOut
              ? `@${cleanOwnUsername}`
              : `@${cleanUsername(thread.conversation)}`;

            const senderAvatarId = isOut
              ? cleanOwnUsername
              : cleanUsername(thread.conversation);

            const senderAvatarSrc = isOut
              ? ownAvatar
              : thread.conversation.profilePic;

            // Group consecutive messages from the same sender within 2 minutes
            const isFollowUp =
              !showDivider &&
              prev &&
              prev.direction === m.direction &&
              Math.abs(new Date(m.createdAt).getTime() - new Date(prev.createdAt).getTime()) < 120_000;

            return (
              <div key={m.id}>
                {/* Date Divider between days */}
                {showDivider && (
                  <div className="relative my-4 sm:my-5 flex items-center justify-center">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-slate-100" />
                    </div>
                    <span className="relative bg-white px-3 text-xs font-medium text-slate-400">
                      {dayLabel(m.createdAt)}
                    </span>
                  </div>
                )}

                {isFollowUp ? (
                  /* Compact follow-up message row (Slack/Discord style) */
                  <div className="group pl-9 sm:pl-[46px] -mt-1 hover:bg-slate-50/60 -mx-2 sm:-mx-4 px-2 sm:px-4 py-0.5 rounded-lg transition-colors">
                    <div className="flex items-baseline justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        {m.text ? (
                          <p className="text-xs sm:text-sm text-slate-700 leading-relaxed break-words">
                            {m.text}
                          </p>
                        ) : m.attachmentUrl && m.attachmentType === "image" ? null : (
                          <p className="text-xs text-slate-400 italic">
                            {m.attachmentType ? `[${m.attachmentType}]` : "Instagram direct interaction"}
                          </p>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 font-normal shrink-0 opacity-70 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                        {time(m.createdAt)}
                      </span>
                    </div>

                    {/* Image attachment if any */}
                    {m.attachmentUrl && m.attachmentType === "image" && (
                      <div className="mt-2 overflow-hidden rounded-xl border border-slate-200 max-w-[240px] sm:max-w-sm">
                        <img
                          src={m.attachmentUrl}
                          alt="Attachment"
                          referrerPolicy="no-referrer"
                          className="max-h-52 sm:max-h-64 object-cover"
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  /* Standard message row with Avatar, Name and Time */
                  <div className="group flex items-start gap-2.5 sm:gap-3.5 hover:bg-slate-50/60 -mx-2 sm:-mx-4 px-2 sm:px-4 py-1.5 rounded-lg transition-colors">
                    <ContactAvatar id={senderAvatarId} src={senderAvatarSrc} size="h-8 w-8 sm:h-9 sm:w-9" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-baseline gap-2">
                          <span className="text-xs sm:text-sm font-bold text-slate-900">
                            {senderName}
                          </span>
                          <span className="text-[10px] sm:text-xs text-slate-400 font-normal">
                            {time(m.createdAt)}
                          </span>
                        </div>
                        <span className="opacity-0 group-hover:opacity-100 text-[11px] sm:text-xs text-slate-400 transition-opacity hidden sm:inline">
                          {isOut ? "Sent via app" : "Direct Message"}
                        </span>
                      </div>

                      {/* Text message */}
                      {m.text ? (
                        <p className="mt-0.5 text-xs sm:text-sm text-slate-700 leading-relaxed break-words">
                          {m.text}
                        </p>
                      ) : m.attachmentUrl && m.attachmentType === "image" ? null : (
                        <p className="mt-0.5 text-xs text-slate-400 italic">
                          {m.attachmentType ? `[${m.attachmentType}]` : "Instagram direct interaction"}
                        </p>
                      )}

                      {/* Image attachment if any */}
                      {m.attachmentUrl && m.attachmentType === "image" && (
                        <div className="mt-2 overflow-hidden rounded-xl border border-slate-200 max-w-[240px] sm:max-w-sm">
                          <img
                            src={m.attachmentUrl}
                            alt="Attachment"
                            referrerPolicy="no-referrer"
                            className="max-h-52 sm:max-h-64 object-cover"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* Empty thread */}
          {thread && thread.messages.length === 0 && (
            <div className="py-24 text-center text-xs text-slate-400">
              No messages in this conversation yet. Send a direct message below!
            </div>
          )}

          {/* No conversation selected */}
          {!selected && list && list.length === 0 && (
            <div className="py-24 text-center text-xs text-slate-400">
              No Instagram conversations found. Click &quot;Sync with Instagram&quot; in the sidebar.
            </div>
          )}
        </div>

        {/* Floating Card Composer (Fixed at Bottom with shrink-0) */}
        <div className="shrink-0 px-2.5 sm:px-6 pb-2.5 sm:pb-4 pt-1 bg-white border-t border-slate-100 sm:border-t-0">
          <form
            onSubmit={handleSend}
            className="rounded-xl sm:rounded-2xl border border-slate-200/90 bg-white p-2.5 sm:p-3 shadow-xs focus-within:border-slate-300 focus-within:shadow-sm transition-all"
          >
            {error && (
              <p role="alert" className="mb-2 text-xs font-medium text-rose-500">
                {error}
              </p>
            )}

            {/* 24-hour reply window limit notice */}
            {thread && !thread.conversation.canReply && (
              <div className="mb-2 rounded-lg bg-amber-50 border border-amber-200/60 p-2 text-[11px] sm:text-xs text-amber-800">
                More than 24 hours have passed since their last message: Instagram limits replies until the customer messages again.
              </div>
            )}

            {/* Input field */}
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              disabled={sending || (thread ? !thread.conversation.canReply : !selected)}
              placeholder={
                thread?.conversation
                  ? `Message @${cleanUsername(thread.conversation)}`
                  : "Select a conversation to reply..."
              }
              className="w-full border-0 bg-transparent px-1.5 py-1 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-0 disabled:opacity-50"
            />

            {/* Bottom Action Bar */}
            <div className="mt-2 sm:mt-3 flex items-center justify-between pt-1 gap-1">
              <div className="flex items-center gap-0.5 sm:gap-1 text-slate-400 overflow-x-auto no-scrollbar py-0.5">
                <button
                  type="button"
                  onClick={() => {}}
                  className="flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-lg hover:bg-slate-100 hover:text-slate-700 transition-colors"
                >
                  <PlusOutlined className="text-xs sm:text-sm" />
                </button>
                <button
                  type="button"
                  onClick={() => setInputText((t) => t + " 😊")}
                  className="flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-lg hover:bg-slate-100 hover:text-slate-700 transition-colors"
                >
                  <SmileOutlined className="text-xs sm:text-sm" />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setInputText(
                      (t) =>
                        t +
                        (thread?.conversation
                          ? ` @${cleanUsername(thread.conversation)} `
                          : " @")
                    )
                  }
                  className="flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-lg hover:bg-slate-100 hover:text-slate-700 transition-colors"
                >
                  <span className="font-semibold text-xs">@</span>
                </button>
                <button
                  type="button"
                  onClick={() => {}}
                  className="flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-lg hover:bg-slate-100 hover:text-slate-700 transition-colors"
                >
                  <FileTextOutlined className="text-xs sm:text-sm" />
                </button>
                <button
                  type="button"
                  onClick={onOpenAutomations}
                  title="Auto-reply templates"
                  className="flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-lg hover:bg-slate-100 hover:text-slate-700 transition-colors"
                >
                  <GiftOutlined className="text-xs sm:text-sm" />
                </button>
              </div>

              {/* Blue Circular Send Button */}
              <button
                type="submit"
                disabled={
                  sending ||
                  !inputText.trim() ||
                  (thread ? !thread.conversation.canReply : !selected)
                }
                className="flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white shadow-xs hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <SendOutlined className="text-xs sm:text-sm" />
              </button>
            </div>
          </form>
        </div>
      </section>
    </div>
  );
}

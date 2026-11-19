"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { activeAccount, api, ApiError, auth, ConnectionStatus, onboarding } from "@/lib/api";
import { Dashboard as DashboardOverview } from "@/components/Dashboard";
import { Submissions } from "@/components/Submissions";
import { MessagesTab } from "@/components/MessagesTab";
import { Stories } from "@/components/Stories";
import { CommentsHub } from "@/components/CommentsHub";
import { AccountPanel } from "@/components/AccountPanel";
import { SettingsPanel } from "@/components/SettingsPanel";
import { Sidebar, type Section, type SectionId } from "@/components/Sidebar";
import { ChatIcon, CommentIcon, GearIcon, GridIcon, HashtagIcon, PhotoIcon, StoriesIcon } from "@/components/icons";
import { HashtagSearch } from "@/components/HashtagSearch";
import { VoiceNotesDashboard } from "@/components/voice-notes/VoiceNotesDashboard";
import { VoiceNoteGlobalButton } from "@/components/voice-notes/VoiceNoteGlobalButton";
import { ReelsDownloader } from "@/components/reels/ReelsDownloader";
import { AudioOutlined } from "@ant-design/icons";
import { Film } from "lucide-react";

export const SECTIONS: Section[] = [
  { id: "dashboard", label: "Dashboard", icon: <GridIcon /> },
  { id: "messages", label: "Conversations", icon: <ChatIcon /> },
  { id: "comments", label: "Comments", icon: <CommentIcon /> },
  { id: "photos", label: "Customer photos", icon: <PhotoIcon /> },
  { id: "stories", label: "Stories", icon: <StoriesIcon /> },
  { id: "hashtags", label: "Hashtag Search", icon: <HashtagIcon /> },
  { id: "reels", label: "Reels Downloader", icon: <Film size={18} /> },
  { id: "voice-notes", label: "Voice Notes", icon: <AudioOutlined /> },
  { id: "settings", label: "Settings", icon: <GearIcon /> },
  { id: "account", label: "Account", icon: <GearIcon /> },
];

// Pages whose data comes from the connected Instagram account. Without one they show a "connect" prompt.
const INSTAGRAM_SECTIONS: SectionId[] = ["dashboard", "messages", "comments", "photos", "stories", "hashtags"];

export type View = { status: ConnectionStatus; daysLeft: number | null };

export async function fetchView(): Promise<View> {
  let status = await api<ConnectionStatus>("/instagram/connection");
  // If not connected and an active account was cached in local storage, try clearing stale account and re-fetching once
  if (!status.connected && activeAccount.get()) {
    activeAccount.clear();
    try {
      status = await api<ConnectionStatus>("/instagram/connection");
    } catch {}
  }
  if (status.connected && status.username) {
    activeAccount.set(status.username);
  }
  const daysLeft = status.connected
    ? Math.max(0, Math.round((new Date(status.expiresAt).getTime() - Date.now()) / 86_400_000))
    : null;
  return { status, daysLeft };
}

export default function AppDashboard({
  initialTab,
  initialCommentsTab,
}: {
  initialTab?: SectionId;
  initialCommentsTab?: "inbox" | "automation";
} = {}) {
  const router = useRouter();
  const [view, setView] = useState<View | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [tab, setTabState] = useState<SectionId>(initialTab || "dashboard");
  const [pendingPhotos, setPendingPhotos] = useState(0);
  const [commentsTab, setCommentsTab] = useState<"inbox" | "automation">(initialCommentsTab || "inbox");
  const [messagesTargetUser, setMessagesTargetUser] = useState<string | null>(null);
  const [messagesInitialText, setMessagesInitialText] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleCommentsTabChange = useCallback((nextSubTab: "inbox" | "automation") => {
    setCommentsTab(nextSubTab);
    if (typeof window !== "undefined") {
      if (nextSubTab === "automation") {
        if (window.location.pathname !== "/automations") {
          window.history.pushState(null, "", "/automations");
        }
      } else {
        if (window.location.pathname !== "/comments" || window.location.search) {
          window.history.pushState(null, "", "/comments");
        }
      }
    }
  }, []);

  const setTab = useCallback((newTab: SectionId) => {
    setTabState(newTab);
    if (typeof window !== "undefined") {
      let targetPath = `/${newTab}`;
      if (newTab === "comments") {
        targetPath = commentsTab === "automation" ? "/automations" : "/comments";
      }
      if (window.location.pathname !== targetPath || (newTab === "dashboard" && window.location.search)) {
        window.history.pushState(null, "", targetPath);
        window.dispatchEvent(new PopStateEvent("popstate"));
      }
    }
  }, [commentsTab]);

  const openMessagesWithUser = useCallback((user?: string, text?: string) => {
    if (user) setMessagesTargetUser(user);
    if (text) setMessagesInitialText(text);
    setTab("messages");
  }, [setTab]);

  const openAutomations = useCallback(() => {
    setCommentsTab("automation");
    setTabState("comments");
    if (typeof window !== "undefined") {
      window.history.pushState(null, "", "/automations");
    }
  }, []);

  const handleLoadError = useCallback(
    (err: unknown) => {
      if (err instanceof ApiError && err.status === 401) {
        auth.clear();
        router.replace("/login");
      } else {
        setError(err instanceof Error ? err.message : "Could not reach the server");
      }
    },
    [router],
  );

  useEffect(() => {
    if (typeof window !== "undefined") {
      const path = window.location.pathname.replace(/^\//, "").split("/")[0];
      const q = new URLSearchParams(window.location.search);

      // Detect sub-tab for comments/automations
      if (path === "automations" || q.get("tab") === "automation") {
        setCommentsTab("automation");
        setTabState("comments");
      } else if (path === "comments") {
        setTabState("comments");
        if (q.get("tab") !== "automation") {
          setCommentsTab("inbox");
        }
      } else if (SECTIONS.some((s) => s.id === path)) {
        setTabState(path as SectionId);
      } else if (!path && !initialTab) {
        setTabState("dashboard");
      }

      if (q.get("user")) {
        setMessagesTargetUser(q.get("user"));
      }
    }

    const handlePopState = () => {
      const path = window.location.pathname.replace(/^\//, "").split("/")[0];
      const q = new URLSearchParams(window.location.search);
      if (path === "automations") {
        setTabState("comments");
        setCommentsTab("automation");
      } else if (path === "comments") {
        setTabState("comments");
        setCommentsTab(q.get("tab") === "automation" ? "automation" : "inbox");
      } else if (SECTIONS.some((s) => s.id === path)) {
        setTabState(path as SectionId);
      } else if (!path) {
        setTabState("dashboard");
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [initialTab]);

  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const authToken = q.get("auth_token");
    if (authToken) {
      auth.set(authToken);
    }


    if (!auth.get()) {
      router.replace("/login");
      return;
    }
    fetchView().then((v) => {
      setView(v);
      const q = new URLSearchParams(window.location.search);
      if (q.get("error")) setError(q.get("error"));
      if (q.get("connected")) setNotice(`Connected @${q.get("connected")}.`);
      if (q.get("fbPageConnected")) setNotice(`Facebook Page "${q.get("fbPageConnected")}" connected.`);
      const isOAuthRedirect =
        q.has("connected") ||
        q.has("fbPageConnected") ||
        q.has("error") ||
        q.has("code") ||
        q.has("state");
      if (isOAuthRedirect) {
        setTab("account");
        window.history.replaceState(null, "", "/account");
      }
    }, handleLoadError);
  }, [router, handleLoadError, setTab]);

  useEffect(() => {
    // Send a brand-new user to setup once. After they finish or skip it they stay here and see the Account page
    // (with the connect buttons) instead of being bounced back to onboarding in a loop.
    if (view && !view.status.connected && !onboarding.isDone()) {
      router.replace("/onboarding");
    }
  }, [view, router]);

  useEffect(() => {
    if (!view?.status.connected) return;
    let cancelled = false;
    const load = () =>
      api<{ status: string }[]>("/submissions").then((rows) => {
        if (!cancelled) setPendingPhotos(rows.filter((r) => r.status === "pending").length);
      }, () => { });
    load();
    const id = setInterval(load, 30_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [view?.status.connected, view?.status.connected ? view.status.username : undefined]);

  async function connectWithInstagram() {
    setError(null);
    try {
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const { url } = await api<{ url: string }>(`/instagram/oauth/url?origin=${encodeURIComponent(origin)}`);
      window.location.href = url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start Instagram login");
    }
  }

  function logout() {
    auth.clear();
    activeAccount.clear();
    router.replace("/login");
  }

  const status = view?.status;
  const daysLeft = view?.daysLeft;
  const connected = status?.connected === true;
  // Someone who finished or skipped setup without connecting Instagram still gets the full app. Pages that need an
  // Instagram account show a "connect" prompt; the rest (saved reels, voice notes, account) work as normal.
  const guest = !connected && onboarding.isDone();
  const active: SectionId = connected || guest ? tab : "account";
  const needsInstagram = guest && INSTAGRAM_SECTIONS.includes(active);

  const accountPanel = (
    <AccountPanel
      status={status}
      daysLeft={daysLeft}
      notice={notice}
      error={error}
      busy={busy}
      onConnectInstagram={connectWithInstagram}
      onSignOut={logout}
    />
  );

  if (!view && !error) {
    return (
      <div className="flex min-h-screen w-full flex-col items-center justify-center bg-[#F1F3F7] p-4">
        <div className="flex flex-col items-center space-y-4">
          <div className="relative flex h-16 w-16 items-center justify-center rounded-[22px] bg-white border border-[#e9e9ee] shadow-2xs">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="Fabroniee" className="h-10 w-10 object-contain" />
            <div className="absolute -inset-1 rounded-[22px] border-2 border-[#e13181]/20 animate-pulse pointer-events-none" />
          </div>
          <div className="text-center space-y-1">
            <h2 className="text-base font-bold text-slate-900 tracking-tight font-sans">Fabroniee</h2>
            <p className="text-xs text-slate-400 font-medium">Checking connection status...</p>
          </div>
          <div className="flex items-center gap-1.5 pt-1">
            <div className="h-2 w-2 rounded-full bg-[#e13181] animate-bounce [animation-delay:-0.3s]" />
            <div className="h-2 w-2 rounded-full bg-[#e13181] animate-bounce [animation-delay:-0.15s]" />
            <div className="h-2 w-2 rounded-full bg-[#e13181] animate-bounce" />
          </div>
        </div>
      </div>
    );
  }

  // Not connected AND hasn't done setup yet: the effect above is sending them to /onboarding.
  if (!connected && !guest) {
    return (
      <div className="flex min-h-screen w-full flex-col items-center justify-center bg-[#F1F3F7] p-4">
        <div className="flex flex-col items-center space-y-4">
          <div className="relative flex h-16 w-16 items-center justify-center rounded-[22px] bg-white border border-[#e9e9ee] shadow-2xs">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="Fabroniee" className="h-10 w-10 object-contain" />
            <div className="absolute -inset-1 rounded-[22px] border-2 border-[#e13181]/20 animate-pulse pointer-events-none" />
          </div>
          <div className="text-center space-y-1">
            <h2 className="text-base font-bold text-slate-900 tracking-tight font-sans">Fabroniee</h2>
            <p className="text-xs text-slate-500 font-medium">Redirecting to creator setup...</p>
          </div>
          <div className="flex items-center gap-1.5 pt-1">
            <div className="h-2 w-2 rounded-full bg-[#e13181] animate-bounce [animation-delay:-0.3s]" />
            <div className="h-2 w-2 rounded-full bg-[#e13181] animate-bounce [animation-delay:-0.15s]" />
            <div className="h-2 w-2 rounded-full bg-[#e13181] animate-bounce" />
          </div>
        </div>
      </div>
    );
  }

  // Empty when no Instagram account is connected (guest). Everything below uses these instead of status.username.
  const uname = status?.connected ? status.username.replace(/^@/, "") : "";
  const ownAvatar = status?.connected ? status.profilePictureUrl : undefined;

  return (
    <div className={`flex ${active === "messages" ? "h-screen overflow-hidden" : "min-h-screen"} bg-[#F1F3F7]`}>
      <Sidebar
        sections={SECTIONS}
        active={active}
        onSelect={(id) => {
          setTab(id);
          setMobileMenuOpen(false);
        }}
        username={uname}
        daysLeft={daysLeft ?? null}
        onSignOut={logout}
        pendingPhotos={pendingPhotos}
        mobileOpen={mobileMenuOpen}
        onMobileClose={() => setMobileMenuOpen(false)}
      />

      <main
        className={`min-w-0 flex-1 flex flex-col [overflow-anchor:none] ${active === "messages"
            ? "h-full overflow-hidden"
            : "min-h-screen pb-8 sm:pb-6"
          }`}
      >
        {/* Unified Tablet & Mobile Top Header Bar (< 1024px) */}
        <header className="sticky top-0 z-30 flex h-[72px] w-full shrink-0 items-center justify-between border-b border-slate-100 bg-white px-4 sm:px-6 lg:hidden shadow-xs">
          {/* Left: Hamburger Button + Brand */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open navigation menu"
              className="flex h-11 w-11 items-center justify-center rounded-[22px] border border-[#e9e9ee] bg-[#F1F3F7] text-slate-700 shadow-2xs hover:bg-slate-100 hover:text-slate-900 active:scale-95 transition-all cursor-pointer"
            >
              <svg className="w-5 h-5 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            <div className="flex items-center gap-2.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo.png"
                alt="Fabroniee"
                className="h-10 w-10 sm:h-11 sm:w-11 object-contain shrink-0 rounded-xl"
              />
              <span className="text-lg sm:text-xl font-black tracking-tight text-slate-950">
                Fabroniee
              </span>
            </div>
          </div>

        </header>

        {/* Main Section Content */}
        <div
          key={`${active}-${uname}`}
          className={
            active === "messages"
              ? "flex h-full w-full flex-1 flex-col min-h-0 overflow-hidden"
              : active === "hashtags"
                ? "animate-page-entrance w-full space-y-6 p-3 sm:p-6"
                : "animate-page-entrance mx-auto w-full max-w-[100rem] min-w-0 space-y-6 p-3 sm:p-6 pb-0 sm:pb-8"
          }
        >
          {guest && !needsInstagram && active !== "account" && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-[22px] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              <span>Instagram isn&apos;t connected yet. This page works without it; connect to unlock comments, messages and automations.</span>
              <button type="button" onClick={() => setTab("account")} className="rounded-xl bg-black px-3 py-1.5 text-xs font-semibold text-white cursor-pointer">
                Connect Instagram
              </button>
            </div>
          )}
          {needsInstagram && (
            <ConnectInstagramPrompt
              section={SECTIONS.find((s) => s.id === active)?.label ?? "This page"}
              onConnect={connectWithInstagram}
              onMore={() => setTab("account")}
            />
          )}
          {!needsInstagram && active === "dashboard" && (
            <DashboardOverview
              onOpenAutomations={openAutomations}
              pendingPhotos={pendingPhotos}
              onOpenPhotos={() => setTab("photos")}
              username={uname}
              onOpenAccount={() => setTab("account")}
              onOpenMessages={openMessagesWithUser}
            />
          )}
          {!needsInstagram && active === "photos" && <Submissions />}
          {!needsInstagram && active === "messages" && (
            <MessagesTab
              username={uname}
              ownAvatar={ownAvatar}
              targetUsername={messagesTargetUser}
              initialMessageText={messagesInitialText}
            />
          )}
          {!needsInstagram && active === "comments" && (
            <CommentsHub
              tab={commentsTab}
              onTabChange={handleCommentsTabChange}
              onOpenDashboard={() => setTab("dashboard")}
            />
          )}
          {!needsInstagram && active === "stories" && (
            <Stories username={uname} ownAvatar={ownAvatar} />
          )}
          {!needsInstagram && active === "hashtags" && <HashtagSearch />}
          {active === "reels" && <ReelsDownloader />}
          {active === "voice-notes" && <VoiceNotesDashboard />}
          {active === "settings" && <SettingsPanel status={status} />}
          {active === "account" && accountPanel}
        </div>

        {/* Global Quick Voice Note Launcher */}
        <VoiceNoteGlobalButton />
      </main>
    </div>
  );
}

// Shown instead of a page that needs Instagram, for a user who skipped connecting.
function ConnectInstagramPrompt({ section, onConnect, onMore }: { section: string; onConnect: () => void; onMore: () => void }) {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center gap-4 rounded-[24px] border border-[#e9e9ee] bg-white p-8 text-center shadow-2xs">
      <h2 className="text-lg font-bold text-slate-950">{section} needs your Instagram account</h2>
      <p className="text-sm text-slate-500">
        Connect your Instagram Professional or Business account to see your {section.toLowerCase()}. Voice notes, saved reels and the account page work without it.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <button type="button" onClick={onConnect} className="rounded-[22px] bg-black px-5 py-2.5 text-sm font-semibold text-white cursor-pointer">
          Connect with Instagram
        </button>
        <button type="button" onClick={onMore} className="rounded-[22px] border border-[#e9e9ee] bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 cursor-pointer hover:border-black/30">
          More ways to connect
        </button>
      </div>
    </div>
  );
}

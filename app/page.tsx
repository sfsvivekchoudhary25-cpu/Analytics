"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { activeAccount, api, ApiError, auth, ConnectionStatus, devBypassLogin, isLocalDev } from "@/lib/api";
import { Dashboard as DashboardOverview } from "@/components/Dashboard";
import { Submissions } from "@/components/Submissions";
import { MessagesTab } from "@/components/MessagesTab";
import { Stories } from "@/components/Stories";
import { CommentsHub } from "@/components/CommentsHub";
import { AccountPanel } from "@/components/AccountPanel";
import { FacebookPageCard } from "@/components/FacebookPageCard";
import { Sidebar, type Section, type SectionId } from "@/components/Sidebar";
import { NotificationBell, AccountAvatar } from "@/components/HeaderControls";
import { ChatIcon, CommentIcon, GearIcon, GridIcon, HashtagIcon, PhotoIcon, StoriesIcon } from "@/components/icons";
import { HashtagSearch } from "@/components/HashtagSearch";
import {
  AppstoreOutlined,
  CommentOutlined,
  InstagramOutlined,
  MenuOutlined,
  MessageOutlined,
  PictureOutlined,
} from "@ant-design/icons";

const SECTIONS: Section[] = [
  { id: "dashboard", label: "Dashboard", icon: <GridIcon /> },
  { id: "messages", label: "Conversations", icon: <ChatIcon /> },
  { id: "comments", label: "Comments", icon: <CommentIcon /> },
  { id: "photos", label: "Customer photos", icon: <PhotoIcon /> },
  { id: "stories", label: "Stories", icon: <StoriesIcon /> },
  { id: "hashtags", label: "Hashtag Search", icon: <HashtagIcon /> },
  { id: "account", label: "Account", icon: <GearIcon /> },
];

type View = { status: ConnectionStatus; daysLeft: number | null };

async function fetchView(): Promise<View> {
  const status = await api<ConnectionStatus>("/instagram/connection");
  if (status.connected && status.username) {
    activeAccount.set(status.username);
  }
  const daysLeft = status.connected
    ? Math.max(0, Math.round((new Date(status.expiresAt).getTime() - Date.now()) / 86_400_000))
    : null;
  return { status, daysLeft };
}

export default function Dashboard() {
  const router = useRouter();
  const [view, setView] = useState<View | null>(null);
  const [token, setToken] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [tab, setTab] = useState<SectionId>("dashboard");
  const [pendingPhotos, setPendingPhotos] = useState(0);
  const [commentsTab, setCommentsTab] = useState<"inbox" | "automation">("inbox");
  const [messagesTargetUser, setMessagesTargetUser] = useState<string | null>(null);
  const [messagesInitialText, setMessagesInitialText] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const openMessagesWithUser = useCallback((user?: string, text?: string) => {
    if (user) setMessagesTargetUser(user);
    if (text) setMessagesInitialText(text);
    setTab("messages");
  }, []);

  // Jump straight into the Comments page's "DM Automation" tab, used by the Dashboard's and the automation
  // page's own "Open Automations"/"View analytics" style buttons.
  const openAutomations = useCallback(() => {
    setCommentsTab("automation");
    setTab("comments");
  }, []);

  const handleLoadError = useCallback(
    (err: unknown) => {
      if (err instanceof ApiError && err.status === 401) {
        if (!isLocalDev()) {
          auth.clear();
          router.replace("/login");
        } else {
          devBypassLogin();
          setError("Dev session re-armed with dev-bypass-token.");
        }
      } else {
        setError(err instanceof Error ? err.message : "Could not reach the server");
      }
    },
    [router],
  );

  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const authToken = q.get("auth_token");
    if (authToken) {
      auth.set(authToken);
    }

    // Auto-bypass login on localhost / local test environments
    if (isLocalDev() && !auth.get()) {
      console.log("[Dev Bypass] Auto-authenticating local session with dev-bypass-token");
      devBypassLogin();
    }

    if (!auth.get()) {
      router.replace("/login");
      return;
    }
    fetchView().then((v) => {
      setView(v);
      // Instagram/Facebook send the browser back here with ?connected=<user>, ?fbPageConnected=<page>, or ?error=<why>.
      const q = new URLSearchParams(window.location.search);
      if (q.get("error")) setError(q.get("error"));
      if (q.get("connected")) setNotice(`Connected @${q.get("connected")}.`);
      if (q.get("fbPageConnected")) setNotice(`Facebook Page "${q.get("fbPageConnected")}" connected.`);
      if (q.size) {
        setTab("account"); // that's where the result message is shown
        window.history.replaceState(null, "", "/");
      }
    }, handleLoadError);
  }, [router, handleLoadError]);

  // Real notification count: customer photos waiting for approval.
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
      const { url } = await api<{ url: string }>("/instagram/oauth/url");
      window.location.href = url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start Instagram login");
    }
  }

  async function connect(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api("/instagram/connection", {
        method: "POST",
        body: JSON.stringify({ accessToken: token.trim() }),
      });
      setToken("");
      setView(await fetchView());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Connection failed");
    } finally {
      setBusy(false);
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
  // Until an account is connected there is nothing to show except the connect screen.
  const active: SectionId = connected ? tab : "account";
  const activeLabel = SECTIONS.find((s) => s.id === active)?.label ?? "";

  const accountPanel = (
    <AccountPanel
      status={status}
      daysLeft={daysLeft}
      notice={notice}
      error={error}
      token={token}
      setToken={setToken}
      busy={busy}
      onConnectInstagram={connectWithInstagram}
      onPasteConnect={connect}
      onSignOut={logout}
    />
  );

  if (!connected) {
    return (
      <main className="flex min-h-screen flex-col">
        <header className="flex items-center justify-between border-b border-[var(--viz-border)] px-6 py-4">
          <span className="text-lg font-semibold tracking-tight text-[var(--viz-ink)]">Instagram Hub.</span>
          <button onClick={logout} className="text-sm text-[var(--viz-ink-2)] underline decoration-dotted underline-offset-4">
            Sign out
          </button>
        </header>
        <div className="flex flex-1 items-center justify-center p-6">{accountPanel}</div>
      </main>
    );
  }

  return (
    <div className={`flex ${active === "messages" ? "h-screen overflow-hidden" : "min-h-screen"} bg-slate-50/50`}>
      <Sidebar
        sections={SECTIONS}
        active={active}
        onSelect={(id) => {
          setTab(id);
          setMobileMenuOpen(false);
        }}
        username={status.username.replace(/^@/, "")}
        daysLeft={daysLeft ?? null}
        onSignOut={logout}
        pendingPhotos={pendingPhotos}
        mobileOpen={mobileMenuOpen}
        onMobileClose={() => setMobileMenuOpen(false)}
      />

      <main
        className={`min-w-0 flex-1 flex flex-col ${
          active === "messages"
            ? "h-full overflow-hidden"
            : "min-h-screen overflow-y-auto pb-20 sm:pb-6"
        }`}
      >
        {/* Unified Tablet & Mobile Top Header Bar (< 1024px) */}
        <header className="sticky top-0 z-30 flex h-15 w-full shrink-0 items-center justify-between border-b border-slate-200/80 bg-white/95 px-4 backdrop-blur-md sm:px-6 lg:hidden shadow-2xs">
          {/* Left: Hamburger Button + Brand */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open navigation menu"
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-slate-50/80 text-slate-700 shadow-2xs hover:bg-slate-100 hover:text-slate-900 active:scale-95 transition-all cursor-pointer"
            >
              <MenuOutlined className="text-base" />
            </button>

            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 text-white shadow-2xs text-sm">
                <InstagramOutlined />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5 leading-none">
                  <span className="text-sm font-bold tracking-tight text-slate-900">Instagram Hub</span>
                  <span className="rounded bg-blue-50 px-1 py-0.5 text-[9px] font-bold text-blue-600 ring-1 ring-inset ring-blue-500/20">
                    PRO
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 capitalize mt-0.5">{activeLabel}</span>
              </div>
            </div>
          </div>

          {/* Right: Notification Bell & Account Avatar */}
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100/80 border border-slate-200/60 text-xs text-slate-700 font-medium">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="truncate max-w-[120px]">@{status.username.replace(/^@/, "")}</span>
            </div>
            <NotificationBell
              pendingPhotos={pendingPhotos}
              onClick={() => setTab("photos")}
            />
            <AccountAvatar
              username={status.username}
              onClick={() => setTab("account")}
            />
          </div>
        </header>

        {/* Main Section Content */}
        <div
          key={`${active}-${status.username}`}
          className={
            active === "messages"
              ? "flex h-full w-full flex-1 flex-col min-h-0 overflow-hidden"
              : active === "hashtags"
              ? "animate-page-entrance w-full space-y-6 p-4 sm:p-6"
              : "animate-page-entrance mx-auto w-full max-w-[100rem] space-y-6 p-4 sm:p-6"
          }
        >
          {active === "dashboard" && (
            <DashboardOverview
              onOpenAutomations={openAutomations}
              pendingPhotos={pendingPhotos}
              onOpenPhotos={() => setTab("photos")}
              username={status.username}
              onOpenAccount={() => setTab("account")}
              onOpenMessages={openMessagesWithUser}
            />
          )}
          {active === "photos" && <Submissions />}
          {active === "messages" && (
            <MessagesTab
              username={status.username}
              ownAvatar={status.profilePictureUrl}
              targetUsername={messagesTargetUser}
              initialMessageText={messagesInitialText}
            />
          )}
          {active === "comments" && (
            <CommentsHub tab={commentsTab} onTabChange={setCommentsTab} onOpenDashboard={() => setTab("dashboard")} />
          )}
          {active === "stories" && (
            <Stories username={status.username} ownAvatar={status.profilePictureUrl} />
          )}
          {active === "hashtags" && <HashtagSearch />}
          {active === "account" && accountPanel}
        </div>

        {/* Sleek Native Mobile Bottom Navigation Bar (Phones only, < 640px) */}
        <nav
          className="fixed bottom-0 inset-x-0 z-40 flex h-16 items-center justify-around border-t border-slate-200/90 bg-white/95 px-2 backdrop-blur-lg shadow-[0_-4px_12px_rgba(0,0,0,0.04)] sm:hidden"
          aria-label="Mobile Navigation"
        >
          {/* 1. Dashboard */}
          <button
            type="button"
            onClick={() => setTab("dashboard")}
            className={`flex flex-col items-center justify-center gap-0.5 flex-1 py-1 transition-all cursor-pointer ${
              active === "dashboard" ? "text-blue-600 font-semibold" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <div className={`flex items-center justify-center h-7 w-7 rounded-lg ${active === "dashboard" ? "bg-blue-50 text-blue-600" : ""}`}>
              <AppstoreOutlined className="text-base" />
            </div>
            <span className="text-[10px] leading-tight">Dashboard</span>
          </button>

          {/* 2. Comments */}
          <button
            type="button"
            onClick={() => setTab("comments")}
            className={`flex flex-col items-center justify-center gap-0.5 flex-1 py-1 transition-all cursor-pointer ${
              active === "comments" ? "text-blue-600 font-semibold" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <div className={`flex items-center justify-center h-7 w-7 rounded-lg ${active === "comments" ? "bg-blue-50 text-blue-600" : ""}`}>
              <CommentOutlined className="text-base" />
            </div>
            <span className="text-[10px] leading-tight">Comments</span>
          </button>

          {/* 3. Messages */}
          <button
            type="button"
            onClick={() => setTab("messages")}
            className={`flex flex-col items-center justify-center gap-0.5 flex-1 py-1 transition-all cursor-pointer ${
              active === "messages" ? "text-blue-600 font-semibold" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <div className={`flex items-center justify-center h-7 w-7 rounded-lg ${active === "messages" ? "bg-blue-50 text-blue-600" : ""}`}>
              <MessageOutlined className="text-base" />
            </div>
            <span className="text-[10px] leading-tight">DMs</span>
          </button>

          {/* 4. Photos */}
          <button
            type="button"
            onClick={() => setTab("photos")}
            className={`relative flex flex-col items-center justify-center gap-0.5 flex-1 py-1 transition-all cursor-pointer ${
              active === "photos" ? "text-blue-600 font-semibold" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <div className={`flex items-center justify-center h-7 w-7 rounded-lg ${active === "photos" ? "bg-blue-50 text-blue-600" : ""}`}>
              <PictureOutlined className="text-base" />
            </div>
            <span className="text-[10px] leading-tight">Photos</span>
            {pendingPhotos > 0 && (
              <span className="absolute top-1 right-3 flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-[9px] font-bold text-white shadow-xs">
                {pendingPhotos}
              </span>
            )}
          </button>

          {/* 5. More (Opens Full Drawer Menu) */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="flex flex-col items-center justify-center gap-0.5 flex-1 py-1 text-slate-500 hover:text-slate-800 transition-all cursor-pointer"
          >
            <div className="flex items-center justify-center h-7 w-7 rounded-lg">
              <MenuOutlined className="text-base" />
            </div>
            <span className="text-[10px] leading-tight">More</span>
          </button>
        </nav>
      </main>
    </div>
  );
}

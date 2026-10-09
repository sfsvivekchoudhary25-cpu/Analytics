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

  // Initial Loading Splash: prevents flashing the disconnected header bar before API status resolves
  if (!view && !error) {
    return (
      <div className="flex min-h-screen w-full flex-col items-center justify-center bg-slate-50/50 p-4">
        <div className="flex flex-col items-center space-y-4">
          <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-white border border-slate-200/80 shadow-md">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="InstaVeyra" className="h-10 w-10 object-contain" />
            <div className="absolute -inset-1 rounded-2xl border-2 border-blue-500/20 animate-pulse pointer-events-none" />
          </div>
          <div className="text-center space-y-1">
            <h2 className="text-base font-bold text-slate-900 tracking-tight">InstaVeyra</h2>
            <p className="text-xs text-slate-400 font-medium">Checking connection status...</p>
          </div>
          <div className="flex items-center gap-1.5 pt-1">
            <div className="h-2 w-2 rounded-full bg-blue-600 animate-bounce [animation-delay:-0.3s]" />
            <div className="h-2 w-2 rounded-full bg-blue-600 animate-bounce [animation-delay:-0.15s]" />
            <div className="h-2 w-2 rounded-full bg-blue-600 animate-bounce" />
          </div>
        </div>
      </div>
    );
  }

  if (!connected) {
    return (
      <main className="flex min-h-screen flex-col bg-slate-50/50">
        <header className="flex h-[68px] items-center justify-between border-b border-slate-200/80 bg-white px-6 shadow-2xs">
          <div className="flex items-center gap-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="InstaVeyra" className="h-8 w-8 object-contain rounded-lg" />
            <span className="text-lg font-bold tracking-tight text-slate-900">InstaVeyra</span>
          </div>
          <button
            onClick={logout}
            className="text-xs font-semibold text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition-colors"
          >
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
            : "min-h-screen overflow-y-auto pb-8 sm:pb-6"
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
              className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200/90 bg-slate-50/70 text-slate-700 shadow-2xs hover:bg-slate-100 hover:text-slate-900 active:scale-95 transition-all cursor-pointer"
            >
              <svg className="w-5 h-5 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            <div className="flex items-center gap-2.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo.png"
                alt="InstaVeyra"
                className="h-10 w-10 sm:h-11 sm:w-11 object-contain shrink-0 rounded-xl"
              />
              <span className="text-lg sm:text-xl font-black tracking-tight text-slate-950">
                InstaVeyra
              </span>
            </div>
          </div>

          {/* Right: Connected Account (Tablet) + Notification Bell & Account Avatar */}
          <div className="flex items-center gap-2.5">
            <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100/80 border border-slate-200/60 text-xs text-slate-700 font-medium">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="truncate max-w-[130px]">@{status.username.replace(/^@/, "")}</span>
            </div>

            {/* Notification Bell with indicator */}
            <button
              type="button"
              onClick={() => setTab("photos")}
              className="relative flex h-11 w-11 items-center justify-center rounded-full border border-slate-200/90 bg-slate-50/70 text-slate-700 hover:bg-slate-100 hover:text-slate-900 active:scale-95 transition-all cursor-pointer shadow-2xs"
              aria-label="Notifications"
            >
              <svg className="w-5 h-5 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {pendingPhotos > 0 && (
                <span className="absolute top-2.5 right-2.5 h-2 w-2 rounded-full bg-blue-500 ring-2 ring-white" />
              )}
            </button>

            {/* User Avatar */}
            <button
              type="button"
              onClick={() => setTab("account")}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-[#0f172a] text-white font-bold text-base shadow-xs hover:ring-2 hover:ring-blue-500/20 active:scale-95 transition-all cursor-pointer"
              aria-label="Account Settings"
            >
              {status.username.replace(/^@/, "").charAt(0).toUpperCase() || "S"}
            </button>
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
      </main>
    </div>
  );
}

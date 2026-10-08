"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError, auth, ConnectionStatus } from "@/lib/api";
import { Dashboard as DashboardOverview } from "@/components/Dashboard";
import { Submissions } from "@/components/Submissions";
import { MessagesTab } from "@/components/MessagesTab";
import { Stories } from "@/components/Stories";
import { CommentsHub } from "@/components/CommentsHub";
import { AccountPanel } from "@/components/AccountPanel";
import { FacebookPageCard } from "@/components/FacebookPageCard";
import { Sidebar, type Section, type SectionId } from "@/components/Sidebar";
import { NotificationBell, AccountAvatar } from "@/components/HeaderControls";
import { ChatIcon, CommentIcon, GearIcon, GridIcon, PhotoIcon, StoriesIcon } from "@/components/icons";
import { HashtagSearch } from "@/components/HashtagSearch";
import { NumberOutlined } from "@ant-design/icons";

const SECTIONS: Section[] = [
  { id: "dashboard", label: "Dashboard", icon: <GridIcon /> },
  { id: "messages", label: "Conversations", icon: <ChatIcon /> },
  { id: "comments", label: "Comments", icon: <CommentIcon /> },
  { id: "photos", label: "Customer photos", icon: <PhotoIcon /> },
  { id: "stories", label: "Stories", icon: <StoriesIcon /> },
  { id: "hashtags", label: "Hashtag Search", icon: <NumberOutlined /> },
  { id: "account", label: "Account", icon: <GearIcon /> },
];

type View = { status: ConnectionStatus; daysLeft: number | null };

async function fetchView(): Promise<View> {
  const status = await api<ConnectionStatus>("/instagram/connection");
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
        auth.clear();
        router.replace("/login");
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
    <div className={`flex ${active === "messages" ? "h-screen overflow-hidden" : "min-h-screen"}`}>
      <Sidebar
        sections={SECTIONS}
        active={active}
        onSelect={setTab}
        username={status.username.replace(/^@/, "")}
        daysLeft={daysLeft ?? null}
        onSignOut={logout}
        pendingPhotos={pendingPhotos}
      />

      <main
        className={`min-w-0 flex-1 ${
          active === "messages"
            ? "flex h-full flex-col overflow-hidden"
            : "min-h-screen overflow-y-auto"
        }`}
      >
        {/* Mobile section switcher: the sidebar only shows on md+ screens. */}
        <nav
          className="flex shrink-0 gap-1.5 overflow-x-auto border-b border-slate-200/80 bg-white px-3 py-2 md:hidden"
          aria-label="Sections"
        >
          {SECTIONS.map((s) => (
            <button
              key={s.id}
              onClick={() => setTab(s.id)}
              aria-current={active === s.id ? "page" : undefined}
              className={`flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                active === s.id
                  ? "bg-blue-50 text-blue-600 ring-1 ring-blue-500/20"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              {s.icon}
              {s.label}
            </button>
          ))}
        </nav>

        <div
          key={`${active}-${status.username}`}
          className={
            active === "messages"
              ? "flex h-full w-full flex-1 flex-col min-h-0 overflow-hidden"
              : active === "hashtags"
              ? "animate-page-entrance w-full space-y-6 p-6"
              : "animate-page-entrance mx-auto w-full max-w-[100rem] space-y-6 p-6"
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

"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

type Status = { connected: false } | { connected: true; pageId: string; pageName: string; igUserId: string | null };

// Separate from the main Instagram connection: only the Comment-to-DM automation needs this, because Meta's
// "send a private reply to a comment" endpoint requires a Facebook Page access token, not an Instagram Login
// token — see comment-dm.service.ts for the full explanation.
export function FacebookPageCard({ notice, error: externalError }: { notice?: string | null; error?: string | null }) {
  const [status, setStatus] = useState<Status | null>(null);
  const [busy, setBusy] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [token, setToken] = useState("");

  const load = () => api<Status>("/facebook-page").then(setStatus, (e: Error) => setLocalError(e.message));
  useEffect(() => {
    load();
  }, []);

  async function connect() {
    setBusy(true);
    setLocalError(null);
    try {
      const { url } = await api<{ url: string }>("/facebook-page/oauth/url");
      window.location.href = url;
    } catch (err) {
      setLocalError((err as Error).message);
      setBusy(false);
    }
  }

  async function connectWithToken(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setLocalError(null);
    try {
      await api("/facebook-page/token", { method: "POST", body: JSON.stringify({ accessToken: token }) });
      setToken("");
      await load();
    } catch (err) {
      setLocalError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function disconnect() {
    if (!confirm("Disconnect this Facebook Page? The Comment-to-DM automation won't be able to send until you reconnect one.")) return;
    setBusy(true);
    setLocalError(null);
    try {
      await api("/facebook-page", { method: "DELETE" });
      await load();
    } catch (err) {
      setLocalError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const error = externalError ?? localError;

  return (
    <section className="max-w-xl space-y-4 rounded-2xl border border-[var(--viz-border)] bg-[var(--viz-surface)] p-6 sm:p-8">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold tracking-tight text-[var(--viz-ink)]">Facebook Page</h2>
        <p className="text-sm text-[var(--viz-muted)]">
          Only needed for the Comment-to-DM automation. Sending a DM as a private reply to a comment is a Facebook Page
          feature — your Instagram login above doesn&apos;t cover it.
        </p>
      </div>

      {notice && <p role="status" className="text-sm text-green-700 dark:text-green-300">{notice}</p>}
      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}

      {!status && !error && <p className="text-sm opacity-70">Loading…</p>}

      {status && !status.connected && (
        <div className="space-y-3">
          <button
            onClick={connect}
            disabled={busy}
            className="rounded-full bg-foreground px-5 py-2 text-sm font-medium text-background disabled:opacity-50"
          >
            {busy ? "Redirecting…" : "Connect a Facebook Page"}
          </button>

          <details className="group text-sm">
            <summary className="cursor-pointer list-none text-xs text-[var(--viz-muted)] hover:text-[var(--viz-ink)]">
              <span className="underline decoration-dotted underline-offset-4">Paste a Page access token instead</span>
            </summary>
            <form onSubmit={connectWithToken} className="mt-3 space-y-2">
              <p className="text-xs text-[var(--viz-muted)]">
                From Meta Business Suite → Business Settings → Users → System Users → your system user → Generate New Token.
              </p>
              <textarea
                value={token}
                onChange={(e) => setToken(e.target.value)}
                rows={3}
                aria-label="Facebook Page access token"
                placeholder="Page access token"
                className="w-full rounded-lg border border-[var(--viz-border)] bg-transparent px-3 py-2 font-mono text-xs outline-none focus:border-[var(--viz-ink)]"
              />
              <button
                disabled={busy || !token.trim()}
                className="rounded-full border border-[var(--viz-border)] px-4 py-1.5 text-xs hover:bg-black/5 disabled:opacity-40 dark:hover:bg-white/10"
              >
                {busy ? "Verifying…" : "Verify and connect"}
              </button>
            </form>
          </details>
        </div>
      )}

      {status && status.connected && (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-[var(--viz-border)] p-3">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-sm font-medium text-[var(--viz-ink)]">
              <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-green-500" />
              {status.pageName}
            </div>
            <div className="text-xs text-[var(--viz-muted)]">Connected</div>
          </div>
          <div className="flex shrink-0 gap-2">
            <button onClick={connect} disabled={busy} className="rounded-full border border-[var(--viz-border)] px-3 py-1.5 text-xs hover:bg-black/5 dark:hover:bg-white/10">
              Reconnect
            </button>
            <button onClick={disconnect} disabled={busy} className="rounded-full border border-red-500/40 px-3 py-1.5 text-xs text-red-600 hover:bg-red-500/10">
              Disconnect
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

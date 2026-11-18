"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

type Status = { connected: false } | { connected: true; pageId: string; pageName: string; igUserId: string | null };

// Optional. Comment-to-DM sends private replies through the account's Instagram login; a connected Page is only a
// backup route (used if Instagram's login route is refused for a reason that is not about the comment itself).
export function FacebookPageCard({ notice, error: externalError }: { notice?: string | null; error?: string | null }) {
  const [status, setStatus] = useState<Status | null>(null);
  const [busy, setBusy] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const load = () => api<Status>("/facebook-page").then(setStatus, (e: Error) => setLocalError(e.message));
  useEffect(() => {
    load();
  }, []);

  async function connect() {
    setBusy(true);
    setLocalError(null);
    try {
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const { url } = await api<{ url: string }>(`/facebook-page/oauth/url?origin=${encodeURIComponent(origin)}`);
      window.location.href = url;
    } catch (err) {
      setLocalError((err as Error).message);
      setBusy(false);
    }
  }

  async function disconnect() {
    if (!confirm("Disconnect this Facebook Page? Comment-to-DM keeps working through your Instagram login.")) return;
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
          Optional. Comment-to-DM sends through your Instagram login. A Facebook Page is only a backup
          way to send.
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

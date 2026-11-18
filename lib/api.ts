export const REMOTE_API_BASE = "https://analytics-backend-vxak.onrender.com";

export function isLocalDev(): boolean {
  if (typeof window === "undefined") return false;
  const host = window.location.hostname;
  return (
    host === "localhost" ||
    host === "127.0.0.1" ||
    /^(192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[0-1])\.)/.test(host)
  );
}

export function getApiBase(): string {
  if (typeof window !== "undefined") {
    const override = localStorage.getItem("ighub_api_base");
    if (override) return override;

    const host = window.location.hostname;
    if (host === "localhost" || host === "127.0.0.1" || /^(192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[0-1])\.)/.test(host)) {
      // If explicit localhost port is desired via custom env, use it; otherwise proxy via Next.js rewrite
      if (process.env.NEXT_PUBLIC_API_URL && !process.env.NEXT_PUBLIC_API_URL.includes("localhost:4000")) {
        return process.env.NEXT_PUBLIC_API_URL;
      }
      return "/backend-proxy";
    }
  }
  return process.env.NEXT_PUBLIC_API_URL || REMOTE_API_BASE;
}

export const API_BASE = process.env.NEXT_PUBLIC_API_URL || REMOTE_API_BASE;
const TOKEN_KEY = "ighub_token";
const ACCOUNT_KEY = "ighub_account";

const ONBOARDING_KEY = "ighub_onboarding_done";
const LAST_USER_KEY = "ighub_last_user";

// Everything this browser remembers about one user's DATA (not settings like sidebar collapse or cookie consent).
// It must never be shown to, or uploaded for, the next person who signs in on the same browser.
const USER_DATA_KEYS = ["fabroniee_saved_reels_vault_v1", "ighub_cloudinary_config", "ig-hub:comment-quick-replies", ACCOUNT_KEY, ONBOARDING_KEY];
const USER_DATA_PREFIXES = ["collab_outreach_", "post_dwell_", "post_hashtags_", "post_rule_"];

function clearUserData() {
  USER_DATA_KEYS.forEach((k) => localStorage.removeItem(k));
  for (let i = localStorage.length - 1; i >= 0; i--) {
    const k = localStorage.key(i);
    if (k && USER_DATA_PREFIXES.some((p) => k.startsWith(p))) localStorage.removeItem(k);
  }
}

// Who a JWT belongs to (only used to notice that a DIFFERENT user is now signed in; the server still verifies tokens).
function tokenUserId(token: string | null): string | null {
  try {
    if (!token) return null;
    const body = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const p = JSON.parse(atob(body));
    return String(p.sub || p.id || p.email || "") || null;
  } catch {
    return null;
  }
}

// If the signed-in user is not the one whose data is cached here, drop that cached data first.
function ensureUserScope(token: string | null) {
  const uid = tokenUserId(token);
  if (!uid) return;
  if (localStorage.getItem(LAST_USER_KEY) !== uid) {
    clearUserData();
    localStorage.setItem(LAST_USER_KEY, uid);
  }
}

export const auth = {
  get: () => {
    if (typeof window === "undefined") return null;
    const t = localStorage.getItem(TOKEN_KEY);
    ensureUserScope(t);
    return t;
  },
  set: (t: string) => {
    ensureUserScope(t);
    localStorage.setItem(TOKEN_KEY, t);
  },
  // Signing out removes the session and everything cached for that user (saved reels, templates, "I skipped setup").
  clear: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(LAST_USER_KEY);
    clearUserData();
  },
};

// Set when the user finishes OR skips the setup page, so the dashboard stops sending them back to it.
export const onboarding = {
  isDone: () => (typeof window === "undefined" ? false : localStorage.getItem(ONBOARDING_KEY) === "1"),
  markDone: () => {
    if (typeof window !== "undefined") localStorage.setItem(ONBOARDING_KEY, "1");
  },
};

export const activeAccount = {
  get: () => (typeof window === "undefined" ? null : localStorage.getItem(ACCOUNT_KEY)),
  set: (a: string) => {
    if (typeof window !== "undefined") {
      const clean = a.replace(/^@/, "").toLowerCase();
      localStorage.setItem(ACCOUNT_KEY, clean);
    }
  },
  clear: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem(ACCOUNT_KEY);
    }
  },
};

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = auth.get();
  const acct = activeAccount.get();
  const baseUrl = getApiBase();

  let signal = init.signal;
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  if (!signal) {
    const isMediaUpload = init.body instanceof FormData || path.includes("/stories") || path.includes("/submissions");
    const isAiRequest = path.startsWith("/ai");
    const timeoutDuration = isMediaUpload ? 180000 : isAiRequest ? 60000 : 45000;
    const timeoutLabel = isMediaUpload
      ? "Media publishing timed out after 3 minutes."
      : isAiRequest
      ? "AI analysis request timed out after 60s"
      : "Request timed out after 45s";
    const controller = new AbortController();
    signal = controller.signal;
    timeoutId = setTimeout(() => {
      controller.abort(new Error(timeoutLabel));
    }, timeoutDuration);
  }

  try {
    let res: Response;
    try {
      res = await fetch(`${baseUrl}${path}`, {
        ...init,
        signal,
        headers: {
          // FormData sets its own multipart boundary header.
          ...(init.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...(acct ? { "x-instagram-account": acct } : {}),
          ...init.headers,
        },
      });
    } catch (networkErr: any) {
      if (
        baseUrl !== REMOTE_API_BASE &&
        (baseUrl.includes("localhost") || baseUrl.includes("127.0.0.1"))
      ) {
        console.warn(`[API] Local backend at ${baseUrl} unreachable, falling back to ${REMOTE_API_BASE}...`);
        res = await fetch(`${REMOTE_API_BASE}${path}`, {
          ...init,
          signal,
          headers: {
            ...(init.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...(acct ? { "x-instagram-account": acct } : {}),
            ...init.headers,
          },
        });
      } else {
        throw networkErr;
      }
    }
    if (!res.ok) {
      let message = res.statusText;
      try {
        const body = await res.json();
        message = Array.isArray(body.message) ? body.message.join(", ") : body.message ?? message;
      } catch {}
      throw new ApiError(res.status, message);
    }
    if (res.status === 204 || res.headers.get("content-length") === "0") {
      return undefined as unknown as T;
    }
    const text = await res.text();
    if (!text) {
      return undefined as unknown as T;
    }
    try {
      return JSON.parse(text);
    } catch {
      return text as unknown as T;
    }
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

export type ConnectionStatus =
  | { connected: false }
  | {
      connected: true;
      username: string;
      profilePictureUrl?: string | null;
      expiresAt: string;
      permissions: string[] | null;
    };

export type ConnectedAccount = {
  username: string;
  igUserId?: string;
  profilePictureUrl?: string | null;
  expiresAt?: string;
  permissions?: string[] | null;
  updatedAt?: string;
};

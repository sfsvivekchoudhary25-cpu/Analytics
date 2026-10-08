export function getApiBase(): string {
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    if (host === "localhost" || host === "127.0.0.1") {
      return "http://localhost:4000";
    }
    if (/^(192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[0-1])\.)/.test(host)) {
      return `http://${host}:4000`;
    }
  }
  return process.env.NEXT_PUBLIC_API_URL || "https://analytics-backend-vxak.onrender.com";
}

export const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://analytics-backend-vxak.onrender.com";
const TOKEN_KEY = "ighub_token";
const ACTIVE_ACCOUNT_KEY = "ighub_active_account";

export const auth = {
  get: () => (typeof window === "undefined" ? null : localStorage.getItem(TOKEN_KEY)),
  set: (t: string) => localStorage.setItem(TOKEN_KEY, t),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

export const activeAccount = {
  get: () => (typeof window === "undefined" ? null : localStorage.getItem(ACTIVE_ACCOUNT_KEY)),
  set: (acc: string | null) => {
    if (typeof window !== "undefined") {
      if (acc) localStorage.setItem(ACTIVE_ACCOUNT_KEY, acc);
      else localStorage.removeItem(ACTIVE_ACCOUNT_KEY);
      window.dispatchEvent(new CustomEvent("ighub_active_account_change", { detail: acc }));
    }
  },
  clear: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem(ACTIVE_ACCOUNT_KEY);
      window.dispatchEvent(new CustomEvent("ighub_active_account_change", { detail: null }));
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
  const currentAccount = activeAccount.get();
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
    const res = await fetch(`${baseUrl}${path}`, {
      ...init,
      signal,
      headers: {
        // FormData sets its own multipart boundary header.
        ...(init.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(currentAccount ? { "x-instagram-account": currentAccount } : {}),
        ...init.headers,
      },
    });
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

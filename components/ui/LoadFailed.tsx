"use client";

import { ReloadOutlined } from "@ant-design/icons";

// What a screen shows when its data could not be loaded, in place of a loading skeleton that would otherwise
// stay on screen for ever. Every skeleton in the app should give way to this (or to the data) once the request ends.
export function LoadFailed({
  message,
  onRetry,
  title = "Couldn't load this",
  compact = false,
  className = "",
}: {
  message?: string | null;
  onRetry?: () => void;
  title?: string;
  compact?: boolean;
  className?: string;
}) {
  return (
    <div
      role="alert"
      className={`rounded-[22px] border border-[#e9e9ee] bg-white text-center shadow-2xs ${compact ? "p-4" : "p-8 sm:p-10"} ${className}`}
    >
      <p className="text-sm font-semibold text-slate-950">{title}</p>
      {message && <p className="mx-auto mt-1 max-w-md text-xs leading-relaxed text-slate-500">{message}</p>}
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-3 inline-flex items-center gap-2 rounded-full border border-[#e9e9ee] bg-white px-4 py-2 text-xs font-medium text-slate-900 transition-colors hover:border-black/40 cursor-pointer"
        >
          <ReloadOutlined className="text-[11px]" />
          Try again
        </button>
      )}
    </div>
  );
}

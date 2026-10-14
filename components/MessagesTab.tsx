"use client";

import { useState, useEffect, useCallback } from "react";
import { Inbox } from "./Inbox";
import { MessageAutomation } from "./MessageAutomation";

import { Tag } from "antd";
import { ArrowLeftOutlined, ThunderboltOutlined } from "@ant-design/icons";

export function MessagesTab({
  username,
  ownAvatar,
  targetUsername,
  initialMessageText,
}: {
  username?: string;
  ownAvatar?: string | null;
  targetUsername?: string | null;
  initialMessageText?: string | null;
}) {
  const [view, setView] = useState<"inbox" | "auto">("inbox");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const q = new URLSearchParams(window.location.search);
      if (q.get("view") === "auto") {
        setView("auto");
      }
    }
  }, []);

  useEffect(() => {
    const handlePopState = () => {
      const q = new URLSearchParams(window.location.search);
      setView(q.get("view") === "auto" ? "auto" : "inbox");
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const handleOpenAutomations = useCallback(() => {
    setView("auto");
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("view", "auto");
      window.history.pushState(null, "", url.pathname + url.search);
    }
  }, []);

  const handleBackToInbox = useCallback(() => {
    setView("inbox");
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.delete("view");
      const cleanPath = url.pathname + (url.search ? url.search : "");
      window.history.pushState(null, "", cleanPath);
    }
  }, []);

  if (view === "auto") {
    return (
      <div className="h-full w-full flex flex-col bg-slate-50/50 overflow-hidden">
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-slate-200/80 bg-white px-3 sm:px-6 shadow-2xs gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              type="button"
              onClick={handleBackToInbox}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 active:scale-95 transition-all cursor-pointer"
              aria-label="Back to Messages"
            >
              <ArrowLeftOutlined className="text-xs" />
            </button>
            <span className="text-sm font-bold text-slate-900 truncate">
              Automated Responses
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Tag color="blue" icon={<ThunderboltOutlined />} className="!rounded-full !m-0 !text-[11px] shrink-0">
              AI & Rules
            </Tag>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-3 sm:p-6 md:p-8 w-full bg-slate-100/70">
          <div className="w-full">
            <MessageAutomation />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full flex-1 flex flex-col min-h-0 overflow-hidden">
      <Inbox
        username={username}
        ownAvatar={ownAvatar}
        onOpenAutomations={handleOpenAutomations}
        targetUsername={targetUsername}
        initialMessageText={initialMessageText}
      />
    </div>
  );
}

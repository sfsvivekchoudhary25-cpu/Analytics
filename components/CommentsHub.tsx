"use client";

import { useState, useEffect, useCallback } from "react";
import { CommentDmAutomation } from "./CommentDmAutomation";
import { CommentDmAutomationList } from "./CommentDmAutomationList";

type Props = {
  onOpenDashboard?: () => void;
};

// The comment→DM automations: the list, and the editor for one of them (kept in the URL as ?ruleId= so Back works).
export function CommentsHub({ onOpenDashboard }: Props) {
  const [openAutomationId, setOpenAutomationId] = useState<string | null>(null);

  // Sync openAutomationId from URL on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const q = new URLSearchParams(window.location.search);
      const ruleId = q.get("ruleId");
      if (ruleId) {
        setOpenAutomationId(ruleId);
      }
    }
  }, []);

  // Listen to browser Back / Forward (popstate)
  useEffect(() => {
    const handlePopState = () => {
      const q = new URLSearchParams(window.location.search);
      setOpenAutomationId(q.get("ruleId") || null);
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const handleOpenAutomation = useCallback((id: string) => {
    setOpenAutomationId(id);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "instant" });
      const url = new URL(window.location.href);
      url.searchParams.set("ruleId", id);
      window.history.pushState(null, "", url.pathname + url.search);
    }
  }, []);

  const handleCloseAutomation = useCallback(() => {
    setOpenAutomationId(null);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.delete("ruleId");
      const cleanPath = url.pathname + (url.search ? url.search : "");
      window.history.pushState(null, "", cleanPath);
    }
  }, []);

  return (
    <div className="w-full max-w-full min-w-0 space-y-5 sm:space-y-6 animate-page-entrance">
      {openAutomationId ? (
        <CommentDmAutomation
          ruleId={openAutomationId}
          onBack={handleCloseAutomation}
          onDeleted={handleCloseAutomation}
        />
      ) : (
        <CommentDmAutomationList onOpen={handleOpenAutomation} onOpenDashboard={onOpenDashboard} />
      )}
    </div>
  );
}
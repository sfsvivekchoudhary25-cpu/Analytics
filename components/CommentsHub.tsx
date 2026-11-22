"use client";

import { useState, useEffect, useCallback } from "react";
import { MessageSquareText, Zap, MessageCircle } from "lucide-react";
import { Comments } from "./Comments";
import { CommentDmAutomation } from "./CommentDmAutomation";
import { CommentDmAutomationList } from "./CommentDmAutomationList";

type Tab = "inbox" | "automation";
const TABS: { id: Tab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "inbox", label: "Comments Inbox", icon: MessageSquareText },
  { id: "automation", label: "DM Automations", icon: Zap },
];

type Props = {
  onOpenDashboard?: () => void;
  /** Uncontrolled by default (starts on Inbox). Pass both to let a parent jump to a specific tab, e.g. from
   * the Dashboard's "Open Automations" button, even when this page is already showing. */
  tab?: Tab;
  onTabChange?: (t: Tab) => void;
};

// Comments management and the comment→DM automation are one system from the customer's point of view (both
// react to the same incoming comments), so they live together here behind a single sidebar entry, as two tabs.
export function CommentsHub({ onOpenDashboard, tab: controlledTab, onTabChange }: Props) {
  const [uncontrolledTab, setUncontrolledTab] = useState<Tab>("inbox");
  const tab = controlledTab ?? uncontrolledTab;
  const setTab = onTabChange ?? setUncontrolledTab;
  const [openAutomationId, setOpenAutomationId] = useState<string | null>(null);
  // The right end of the top row: the active page puts its own controls here.
  const [toolbarSlot, setToolbarSlot] = useState<HTMLDivElement | null>(null);

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

  const handleTabClick = (nextTab: Tab) => {
    if (nextTab === "inbox" && openAutomationId) {
      setOpenAutomationId(null);
      if (typeof window !== "undefined") {
        const url = new URL(window.location.href);
        url.searchParams.delete("ruleId");
        window.history.replaceState(null, "", url.pathname + (url.search ? url.search : ""));
      }
    }
    setTab(nextTab);
  };

  return (
    <div className="w-full max-w-full min-w-0 space-y-5 sm:space-y-6 animate-page-entrance">
      {/* Top row: the tab switch on the left; the page's own controls (period, new automation) on the right */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* ── Soft Pastel Mode Switcher Tabs ── */}
        <div
          role="tablist"
          aria-label="Comments navigation"
          className="inline-flex items-center gap-1.5 p-1.5 rounded-full bg-white border border-[#e9e9ee] shadow-2xs self-start"
        >
          {TABS.map((t) => {
            const Icon = t.icon;
            const isActive = tab === t.id;
            return (
              <button
                key={t.id}
                role="tab"
                aria-selected={isActive}
                onClick={() => handleTabClick(t.id)}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  isActive
                    ? "bg-black text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-950 hover:bg-slate-50"
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? "text-white" : "text-slate-500"}`} />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>
        <div ref={setToolbarSlot} className="flex flex-wrap items-center gap-3" />
      </div>

      {tab === "inbox" && <Comments />}
      {tab === "automation" &&
        (openAutomationId ? (
          <CommentDmAutomation
            ruleId={openAutomationId}
            onBack={handleCloseAutomation}
            onDeleted={handleCloseAutomation}
          />
        ) : (
          <CommentDmAutomationList onOpen={handleOpenAutomation} onOpenDashboard={onOpenDashboard} toolbarSlot={toolbarSlot} />
        ))}
    </div>
  );
}

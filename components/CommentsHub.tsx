"use client";

import { useState } from "react";
import { CommentOutlined, ThunderboltOutlined } from "@ant-design/icons";
import { Comments } from "./Comments";
import { CommentDmAutomation } from "./CommentDmAutomation";
import { CommentDmAutomationList } from "./CommentDmAutomationList";

type Tab = "inbox" | "automation";
const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: "inbox", label: "Comments Inbox", icon: <CommentOutlined className="text-sm" /> },
  { id: "automation", label: "DM Automations", icon: <ThunderboltOutlined className="text-sm" /> },
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

  return (
    <div className="w-full space-y-8 animate-page-entrance">
      {/* ── Modern Ant Design Styled Sub-Navigation Tabs ── */}
      <div
        role="tablist"
        aria-label="Comments"
        className="inline-flex gap-1.5 rounded-2xl border border-slate-200/80 bg-white p-1.5 shadow-2xs"
      >
        {TABS.map((t) => {
          const isActive = tab === t.id;
          return (
            <button
              key={t.id}
              role="tab"
              aria-selected={isActive}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all cursor-pointer ${
                isActive
                  ? "bg-blue-50 text-blue-600 shadow-2xs ring-1 ring-blue-500/20"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              {t.icon}
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {tab === "inbox" && <Comments />}
      {tab === "automation" &&
        (openAutomationId ? (
          <CommentDmAutomation
            ruleId={openAutomationId}
            onBack={() => setOpenAutomationId(null)}
            onDeleted={() => setOpenAutomationId(null)}
          />
        ) : (
          <CommentDmAutomationList onOpen={setOpenAutomationId} onOpenDashboard={onOpenDashboard} />
        ))}
    </div>
  );
}

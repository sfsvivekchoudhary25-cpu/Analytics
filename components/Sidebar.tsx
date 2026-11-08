"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { Badge, Button, Avatar, Tooltip, Drawer, Dropdown, type MenuProps } from "antd";
import {
  InstagramOutlined,
  CheckCircleFilled,
  CloseOutlined,
} from "@ant-design/icons";
import {
  LayoutGrid,
  MessageSquare,
  MessageCircle,
  Image as ImageIcon,
  History,
  Hash,
  Mic,
  Settings,
  PanelLeftClose,
  PanelLeftOpen,
  LogOut,
  ExternalLink,
  Film,
} from "lucide-react";

export type SectionId =
  | "dashboard"
  | "photos"
  | "messages"
  | "comments"
  | "stories"
  | "hashtags"
  | "reels"
  | "voice-notes"
  | "account";

export type Section = { id: SectionId; label: string; icon: ReactNode };

// Modern Apple-inspired SF symbols via lucide-react with refined, light 1.75px stroke
const ICON_MAP: Record<SectionId, ReactNode> = {
  dashboard: <LayoutGrid size={18} strokeWidth={1.75} />,
  messages: <MessageSquare size={18} strokeWidth={1.75} />,
  comments: <MessageCircle size={18} strokeWidth={1.75} />,
  photos: <ImageIcon size={18} strokeWidth={1.75} />,
  stories: <History size={18} strokeWidth={1.75} />,
  hashtags: <Hash size={18} strokeWidth={1.75} />,
  reels: <Film size={18} strokeWidth={1.75} />,
  "voice-notes": <Mic size={18} strokeWidth={1.75} />,
  account: <Settings size={18} strokeWidth={1.75} />,
};

type Props = {
  sections: Section[];
  active: SectionId;
  onSelect: (id: SectionId) => void;
  username: string;
  daysLeft: number | null;
  onSignOut: () => void;
  pendingPhotos?: number;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
};

interface SidebarContentProps {
  sections: Section[];
  active: SectionId;
  onSelect: (id: SectionId) => void;
  username: string;
  daysLeft: number | null;
  onSignOut: () => void;
  pendingPhotos?: number;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  onClose?: () => void;
  isDrawer?: boolean;
}

function SidebarContent({
  sections,
  active,
  onSelect,
  username,
  daysLeft,
  onSignOut,
  pendingPhotos = 0,
  isCollapsed = false,
  onToggleCollapse,
  onClose,
  isDrawer = false,
}: SidebarContentProps) {
  const cleanUsername = username.replace(/^@/, "");

  // Dropdown menu items for collapsed profile trigger
  const profileMenuItems: MenuProps["items"] = [
    {
      key: "user-info",
      label: (
        <div className="py-1 px-1">
          <p className="text-xs font-medium text-slate-800 truncate">@{cleanUsername}</p>
          <p className="text-[11px] text-emerald-600 font-normal flex items-center gap-1.5 mt-0.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            {daysLeft != null ? `${daysLeft} days active` : "Connected"}
          </p>
        </div>
      ),
      disabled: true,
    },
    { type: "divider" },
    {
      key: "instagram",
      icon: <ExternalLink size={14} className="text-slate-400" />,
      label: (
        <a
          href={`https://instagram.com/${cleanUsername}`}
          target="_blank"
          rel="noreferrer"
          className="text-xs font-normal text-slate-700 hover:text-slate-900"
        >
          View Instagram Profile
        </a>
      ),
    },
    {
      key: "account",
      icon: <Settings size={14} className="text-slate-400" />,
      label: <span className="text-xs font-normal text-slate-700">Account Settings</span>,
      onClick: () => {
        onSelect("account");
        if (isDrawer) onClose?.();
      },
    },
    { type: "divider" },
    {
      key: "signout",
      icon: <LogOut size={14} className="text-rose-500" />,
      label: <span className="text-xs font-normal text-rose-600">Sign out</span>,
      onClick: () => {
        onSignOut();
        if (isDrawer) onClose?.();
      },
    },
  ];

  return (
    <div className="flex h-full w-full flex-col justify-between overflow-hidden bg-[#fafafa]/90 backdrop-blur-2xl transition-all duration-300">
      {/* ── TOP SECTION: Brand & Connected Chip ──────────────── */}
      <div className="shrink-0 flex flex-col">
        {/* Header / Brand & Collapse Toggle */}
        <div
          className={`flex items-center pt-4 pb-3 transition-all duration-200 ${
            isCollapsed
              ? "flex-col justify-center px-2 gap-2"
              : "justify-between px-4 gap-2"
          }`}
        >
          {isCollapsed ? (
            /* Collapsed Mode: Logo & Dedicated Expand Toggle */
            <div className="flex flex-col items-center gap-2 w-full">
              <div className="relative flex h-9 w-9 items-center justify-center rounded-2xl bg-white border border-[#e9e9ee] shadow-2xs p-1 shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/logo.png"
                  alt="Fabroniee"
                  className="h-full w-full object-contain rounded-lg"
                />
              </div>

              <Tooltip title="Expand sidebar (Ctrl+B)" placement="right">
                <button
                  type="button"
                  onClick={onToggleCollapse}
                  className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-200/60 hover:text-slate-700 active:scale-95 transition-all cursor-pointer"
                  aria-label="Expand sidebar"
                >
                  <PanelLeftOpen size={17} strokeWidth={1.75} />
                </button>
              </Tooltip>
            </div>
          ) : (
            /* Expanded Mode: Full Logo, Title, Subtitle, and Collapse Button */
            <>
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <div className="relative flex h-9 w-9 items-center justify-center rounded-2xl bg-white border border-[#e9e9ee] shadow-2xs shrink-0 p-1">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/logo.png"
                    alt="Fabroniee"
                    className="h-full w-full object-contain rounded-lg"
                  />
                </div>
                <div className="min-w-0 flex-1 overflow-hidden">
                  <span className="text-[14px] font-semibold tracking-tight text-slate-850 leading-tight block truncate">
                    Fabroniee
                  </span>
                  <p className="text-[11px] font-normal text-slate-400 tracking-tight truncate">
                    Social Commerce OS
                  </p>
                </div>
              </div>

              {isDrawer ? (
                <button
                  type="button"
                  onClick={onClose}
                  className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-200/60 hover:text-slate-700 transition-colors cursor-pointer"
                  aria-label="Close menu"
                >
                  <CloseOutlined className="text-sm" />
                </button>
              ) : (
                <Tooltip title="Collapse sidebar (Ctrl+B)" placement="right">
                  <button
                    type="button"
                    onClick={onToggleCollapse}
                    className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-200/60 hover:text-slate-700 active:scale-95 transition-all cursor-pointer"
                    aria-label="Collapse sidebar"
                  >
                    <PanelLeftClose size={17} strokeWidth={1.75} />
                  </button>
                </Tooltip>
              )}
            </>
          )}
        </div>

        {/* Connected Instagram Account Status Card */}
        <div className={`transition-all duration-200 ${isCollapsed ? "px-2 pb-2" : "px-3 pb-2"}`}>
          {isCollapsed ? (
            <div className="flex justify-center">
              <Tooltip
                title={
                  <div className="text-xs">
                    <p className="font-medium text-slate-900">@{cleanUsername}</p>
                    <p className="text-emerald-500 text-[11px] font-normal">Instagram Connected</p>
                  </div>
                }
                placement="right"
              >
                <div className="relative flex h-10 w-10 items-center justify-center rounded-2xl bg-white border border-[#e9e9ee] shadow-2xs hover:border-black/30 transition-all cursor-default">
                  <div className="flex h-6 w-6 items-center justify-center rounded-xl bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] text-white">
                    <InstagramOutlined className="text-[12px]" />
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
                </div>
              </Tooltip>
            </div>
          ) : (
            <div className="flex w-full items-center gap-2.5 rounded-2xl border border-[#e9e9ee] hover:border-black/20 bg-white/80 backdrop-blur-md p-2.5 text-left shadow-2xs transition-all group">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] text-white shadow-xs group-hover:scale-105 transition-transform">
                <InstagramOutlined className="text-sm" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1">
                  <span className="truncate text-xs font-medium text-slate-800 tracking-tight">
                    @{cleanUsername}
                  </span>
                  <CheckCircleFilled className="text-[11px] text-blue-500 shrink-0" />
                </div>
                <span className="text-[10px] text-emerald-600 font-normal flex items-center gap-1.5 mt-0.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Connected
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── NAVIGATION LIST ──────────────────────────────────── */}
      <nav
        className={`flex-1 overflow-y-auto py-2 custom-scrollbar transition-all duration-200 ${
          isCollapsed ? "px-2" : "px-3"
        }`}
        aria-label="Sections"
      >
        {!isCollapsed && (
          <div className="px-3 pb-1.5 text-[10px] font-medium uppercase tracking-wider text-slate-400 select-none">
            Main Menu
          </div>
        )}

        {isCollapsed && <div className="w-8 h-[1px] bg-slate-200/80 my-1.5 mx-auto" />}

        <ul className="space-y-1">
          {sections.map((s) => {
            const isSelected = active === s.id;
            const icon = ICON_MAP[s.id] ?? s.icon;
            const isPhotos = s.id === "photos";

            if (isCollapsed) {
              return (
                <li key={s.id} className="flex justify-center">
                  <Tooltip
                    title={
                      <div className="text-xs font-normal py-0.5 px-0.5 flex items-center gap-1.5">
                        <span>{s.label}</span>
                        {isPhotos && pendingPhotos > 0 && (
                          <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px] font-medium">
                            {pendingPhotos}
                          </span>
                        )}
                      </div>
                    }
                    placement="right"
                    mouseEnterDelay={0.1}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        onSelect(s.id);
                        if (isDrawer) onClose?.();
                      }}
                      aria-label={s.label}
                      aria-current={isSelected ? "page" : undefined}
                      className={`group relative flex h-10 w-10 items-center justify-center rounded-2xl transition-all duration-200 cursor-pointer ${
                        isSelected
                          ? "bg-[#e2e2fc] text-slate-950 font-medium shadow-xs scale-105"
                          : "text-slate-500 hover:bg-white hover:text-slate-900 hover:shadow-2xs active:scale-95"
                      }`}
                    >
                      <span className="transition-transform duration-200 group-hover:scale-110">
                        {icon}
                      </span>

                      {/* Pending notifications badge on collapsed icon */}
                      {isPhotos && pendingPhotos > 0 && (
                        <span className="absolute -top-1 -right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full text-[10px] font-semibold bg-[#e13181] text-white ring-2 ring-white shadow-2xs animate-pulse">
                          {pendingPhotos}
                        </span>
                      )}
                    </button>
                  </Tooltip>
                </li>
              );
            }

            return (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => {
                    onSelect(s.id);
                    if (isDrawer) onClose?.();
                  }}
                  aria-current={isSelected ? "page" : undefined}
                  className={`group relative flex w-full items-center justify-between rounded-2xl px-3 py-2 text-xs sm:text-[13px] font-normal transition-all duration-200 cursor-pointer ${
                    isSelected
                      ? "bg-[#e2e2fc] text-slate-950 font-medium shadow-2xs"
                      : "text-slate-600 hover:bg-white hover:text-slate-900 hover:shadow-2xs active:scale-[0.98]"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className={`flex h-5 w-5 items-center justify-center transition-transform duration-200 group-hover:scale-110 ${
                        isSelected ? "text-slate-950" : "text-slate-400 group-hover:text-slate-600"
                      }`}
                    >
                      {icon}
                    </span>
                    <span className="truncate tracking-tight font-normal">{s.label}</span>
                  </div>

                  {isPhotos && pendingPhotos > 0 && (
                    <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-950 text-white shadow-2xs">
                      {pendingPhotos}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* ── FOOTER: User Profile & Actions ───────────────────── */}
      <div className={`shrink-0 border-t border-[#e9e9ee]/80 pb-4 transition-all duration-200 ${
        isCollapsed ? "p-2" : "p-3"
      }`}>
        {isCollapsed ? (
          /* Collapsed User Avatar with Action Dropdown */
          <div className="flex justify-center">
            <Dropdown
              menu={{ items: profileMenuItems }}
              placement="topRight"
              trigger={["click", "hover"]}
            >
              <button
                type="button"
                className="group relative flex h-10 w-10 items-center justify-center rounded-2xl bg-white border border-[#e9e9ee] shadow-2xs hover:border-black/30 active:scale-95 transition-all cursor-pointer"
                aria-label="User settings & profile"
              >
                <Avatar
                  size={32}
                  className="!font-medium !text-xs !bg-slate-950 !text-white shadow-xs group-hover:scale-105 transition-transform"
                >
                  {cleanUsername.charAt(0).toUpperCase() || "F"}
                </Avatar>
                <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
              </button>
            </Dropdown>
          </div>
        ) : (
          /* Expanded User Profile Card */
          <div className="rounded-2xl border border-[#e9e9ee] hover:border-black/20 bg-white p-3 shadow-2xs transition-all">
            <div className="flex items-center gap-2.5">
              <Avatar
                size={34}
                className="!font-medium !text-xs !bg-slate-950 !text-white shadow-xs shrink-0"
              >
                {cleanUsername.charAt(0).toUpperCase() || "F"}
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="truncate text-xs font-medium text-slate-800 tracking-tight">
                  @{cleanUsername}
                </div>
                <div className="mt-0.5 flex items-center gap-1.5">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                  </span>
                  <span className="text-[11px] font-normal text-emerald-600">
                    {daysLeft != null ? `${daysLeft}d left` : "Active"}
                  </span>
                </div>
              </div>
            </div>

            <Button
              block
              icon={<LogOut size={13} strokeWidth={1.75} />}
              onClick={() => {
                onSignOut();
                if (isDrawer) onClose?.();
              }}
              className="!mt-2.5 !h-8 !rounded-xl !border-[#e9e9ee] !text-xs !font-normal !text-slate-600 hover:!border-rose-300 hover:!bg-rose-50/80 hover:!text-rose-600 transition-colors shadow-2xs"
            >
              Sign out
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export function Sidebar({
  sections,
  active,
  onSelect,
  username,
  daysLeft,
  onSignOut,
  pendingPhotos = 0,
  mobileOpen = false,
  onMobileClose,
  collapsed: controlledCollapsed,
  onToggleCollapse: controlledToggleCollapse,
}: Props) {
  // Support both controlled and uncontrolled collapse state with localStorage persistence
  const [internalCollapsed, setInternalCollapsed] = useState(false);

  // Initialize from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("fabroniee_sidebar_collapsed");
      if (saved !== null) {
        setInternalCollapsed(saved === "true");
      }
    } catch {}
  }, []);

  const isCollapsed = controlledCollapsed ?? internalCollapsed;

  const handleToggleCollapse = useCallback(() => {
    if (controlledToggleCollapse) {
      controlledToggleCollapse();
    } else {
      setInternalCollapsed((prev) => {
        const next = !prev;
        try {
          localStorage.setItem("fabroniee_sidebar_collapsed", String(next));
        } catch {}
        return next;
      });
    }
  }, [controlledToggleCollapse]);

  // Global keyboard shortcut: Ctrl+B or Cmd+B to toggle sidebar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "b") {
        e.preventDefault();
        handleToggleCollapse();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleToggleCollapse]);

  return (
    <>
      {/* ── Desktop Collapsible Sidebar (lg: >= 1024px) ──────── */}
      <aside
        className={`sticky top-0 hidden h-screen shrink-0 flex-col border-r border-[#e9e9ee]/80 shadow-[0_0_1px_rgba(0,0,0,0.04),0_2px_12px_rgba(0,0,0,0.03)] transition-[width] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] lg:flex z-30 select-none overflow-hidden ${
          isCollapsed ? "w-[76px]" : "w-64"
        }`}
      >
        <SidebarContent
          sections={sections}
          active={active}
          onSelect={onSelect}
          username={username}
          daysLeft={daysLeft}
          onSignOut={onSignOut}
          pendingPhotos={pendingPhotos}
          isCollapsed={isCollapsed}
          onToggleCollapse={handleToggleCollapse}
        />
      </aside>

      {/* ── Tablet & Mobile Slide-Over Drawer (< 1024px) ─────── */}
      <Drawer
        open={mobileOpen}
        onClose={onMobileClose}
        placement="left"
        size="default"
        closable={false}
        styles={{
          body: { padding: 0 },
          wrapper: { width: "min(300px, 85vw)" },
        }}
        className="!p-0"
      >
        <SidebarContent
          sections={sections}
          active={active}
          onSelect={onSelect}
          username={username}
          daysLeft={daysLeft}
          onSignOut={onSignOut}
          pendingPhotos={pendingPhotos}
          onClose={onMobileClose}
          isDrawer
          isCollapsed={false}
        />
      </Drawer>
    </>
  );
}

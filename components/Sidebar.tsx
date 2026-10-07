"use client";

import type { ReactNode } from "react";
import { Badge, Tag, Button, Avatar, Tooltip } from "antd";
import {
  AppstoreOutlined,
  MessageOutlined,
  CommentOutlined,
  PictureOutlined,
  HistoryOutlined,
  SettingOutlined,
  LogoutOutlined,
  DownOutlined,
  InstagramOutlined,
  CheckCircleFilled,
  NumberOutlined,
} from "@ant-design/icons";

export type SectionId =
  | "dashboard"
  | "photos"
  | "messages"
  | "comments"
  | "stories"
  | "hashtags"
  | "account";

export type Section = { id: SectionId; label: string; icon: ReactNode };

// Map SectionId to Ant Design icons for modern consistency
const ICON_MAP: Record<SectionId, ReactNode> = {
  dashboard: <AppstoreOutlined className="text-base" />,
  messages: <MessageOutlined className="text-base" />,
  comments: <CommentOutlined className="text-base" />,
  photos: <PictureOutlined className="text-base" />,
  stories: <HistoryOutlined className="text-base" />,
  hashtags: <NumberOutlined className="text-base" />,
  account: <SettingOutlined className="text-base" />,
};

type Props = {
  sections: Section[];
  active: SectionId;
  onSelect: (id: SectionId) => void;
  username: string;
  daysLeft: number | null;
  onSignOut: () => void;
  pendingPhotos?: number;
};

export function Sidebar({
  sections,
  active,
  onSelect,
  username,
  daysLeft,
  onSignOut,
  pendingPhotos = 0,
}: Props) {
  const cleanUsername = username.replace(/^@/, "");

  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-slate-200/80 bg-white shadow-xs md:flex">
      {/* Brand Header */}
      <div className="flex items-center justify-between px-5 pt-6 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 shadow-sm text-white text-lg">
            <InstagramOutlined />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-base font-bold tracking-tight text-slate-900">Instagram Hub</span>
              <span className="rounded-md bg-blue-50 px-1.5 py-0.5 text-[10px] font-semibold text-blue-600 ring-1 ring-inset ring-blue-500/20">
                PRO
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Automation & CRM</p>
          </div>
        </div>
      </div>

      {/* Account Selector Card */}
      <div className="px-3 pb-2">
        <Tooltip title="Switch or configure account">
          <button
            onClick={() => onSelect("account")}
            className="group flex w-full items-center gap-2.5 rounded-xl border border-slate-200/90 bg-slate-50/70 p-2.5 text-left transition-all hover:border-blue-300 hover:bg-blue-50/30 hover:shadow-xs"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-xs">
              <InstagramOutlined className="text-sm" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1">
                <span className="truncate text-xs font-semibold text-slate-800">@{cleanUsername}</span>
                <CheckCircleFilled className="text-[11px] text-blue-500" />
              </div>
              <span className="text-[10px] text-slate-500">Connected account</span>
            </div>
            <DownOutlined className="text-[10px] text-slate-400 transition-transform group-hover:text-slate-600" />
          </button>
        </Tooltip>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 overflow-y-auto px-3 py-2" aria-label="Sections">
        <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          Main Menu
        </div>
        <ul className="space-y-1">
          {sections.map((s) => {
            const isSelected = active === s.id;
            const icon = ICON_MAP[s.id] ?? s.icon;
            const isPhotos = s.id === "photos";

            return (
              <li key={s.id}>
                <button
                  onClick={() => onSelect(s.id)}
                  aria-current={isSelected ? "page" : undefined}
                  className={`group relative flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                    isSelected
                      ? "bg-blue-50/90 text-blue-600 shadow-xs ring-1 ring-blue-500/20"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`transition-colors ${
                        isSelected ? "text-blue-600" : "text-slate-400 group-hover:text-slate-600"
                      }`}
                    >
                      {icon}
                    </span>
                    <span>{s.label}</span>
                  </div>

                  {isPhotos && pendingPhotos > 0 && (
                    <Badge count={pendingPhotos} size="small" color="#2563eb" />
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer Profile & Status Card */}
      <div className="p-3">
        <div className="rounded-2xl border border-slate-200/90 bg-gradient-to-b from-slate-50/80 to-slate-100/60 p-3.5 shadow-2xs">
          <div className="flex items-center gap-3">
            <Avatar
              size={36}
              className="!font-semibold !shadow-xs"
              style={{
                background: "linear-gradient(135deg, #0f172a 0%, #334155 100%)",
                color: "#ffffff",
              }}
            >
              {cleanUsername.charAt(0).toUpperCase() || "?"}
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="truncate text-xs font-semibold text-slate-800">@{cleanUsername}</div>
              <div className="mt-0.5 flex items-center gap-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                </span>
                <span className="text-[11px] font-medium text-emerald-600">
                  {daysLeft != null ? `${daysLeft}d left` : "Active"}
                </span>
              </div>
            </div>
          </div>

          <Button
            block
            icon={<LogoutOutlined />}
            onClick={onSignOut}
            className="!mt-3 !h-8 !rounded-lg !border-slate-200 !text-xs !text-slate-600 hover:!border-rose-300 hover:!bg-rose-50/80 hover:!text-rose-600 transition-colors"
          >
            Sign out
          </Button>
        </div>
      </div>
    </aside>
  );
}

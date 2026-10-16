"use client";

import React, { useState } from "react";
import {
  Pin,
  Trash2,
  Copy,
  Check,
  MoreVertical,
  Lightbulb,
  CheckSquare,
  FileText,
  Briefcase,
  Bell,
  Sparkles,
  ArrowRight,
  ChevronRight,
  Calendar,
  Clock,
} from "lucide-react";
import { InstagramIcon } from "@/components/icons";
import { api } from "@/lib/api";

export interface ActionItem {
  id: string;
  text: string;
  completed: boolean;
  dueDate?: string | null;
}

export interface VoiceNoteItem {
  id: string;
  title: string;
  cleanedText: string;
  rawTranscript: string;
  category: "idea" | "todo" | "reminder" | "instagram_caption" | "client_note" | "journal";
  tags: string[];
  actionItems: ActionItem[];
  audioUrl?: string | null;
  durationSeconds: number;
  languageCode: string;
  isPinned: boolean;
  createdAt: string;
}

interface VoiceNoteCardProps {
  note: VoiceNoteItem;
  featured?: boolean;
  onSelect: (note: VoiceNoteItem) => void;
  onDelete: (id: string) => void;
  onUpdate: (updated: VoiceNoteItem) => void;
}

const CATEGORY_CONFIG: Record<
  string,
  { label: string; iconBg: string; iconColor: string; icon: React.ReactNode }
> = {
  idea: {
    label: "Idea",
    iconBg: "bg-purple-100/80 text-purple-600",
    iconColor: "text-purple-600",
    icon: <Lightbulb className="w-4 h-4" />,
  },
  todo: {
    label: "To-Do",
    iconBg: "bg-emerald-100/80 text-emerald-600",
    iconColor: "text-emerald-600",
    icon: <CheckSquare className="w-4 h-4" />,
  },
  instagram_caption: {
    label: "IG Caption",
    iconBg: "bg-pink-100/80 text-rose-600",
    iconColor: "text-rose-600",
    icon: <InstagramIcon className="w-4 h-4" />,
  },
  client_note: {
    label: "Client Note",
    iconBg: "bg-blue-100/80 text-blue-600",
    iconColor: "text-blue-600",
    icon: <Briefcase className="w-4 h-4" />,
  },
  reminder: {
    label: "Reminder",
    iconBg: "bg-amber-100/80 text-amber-600",
    iconColor: "text-amber-600",
    icon: <Bell className="w-4 h-4" />,
  },
  journal: {
    label: "Memo",
    iconBg: "bg-slate-100 text-slate-600",
    iconColor: "text-slate-600",
    icon: <FileText className="w-4 h-4" />,
  },
};

export function VoiceNoteCard({
  note,
  featured = false,
  onSelect,
  onDelete,
  onUpdate,
}: VoiceNoteCardProps) {
  const cat = CATEGORY_CONFIG[note.category] || CATEGORY_CONFIG.idea;

  // Date formatting matching reference: e.g. "9:30 AM", "Yesterday", "May 20"
  const noteDate = new Date(note.createdAt);
  const now = new Date();
  const isToday =
    noteDate.getDate() === now.getDate() &&
    noteDate.getMonth() === now.getMonth() &&
    noteDate.getFullYear() === now.getFullYear();

  const yesterday = new Date();
  yesterday.setDate(now.getDate() - 1);
  const isYesterday =
    noteDate.getDate() === yesterday.getDate() &&
    noteDate.getMonth() === yesterday.getMonth() &&
    noteDate.getFullYear() === yesterday.getFullYear();

  const formattedTime = noteDate.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });

  const formattedDate = isToday
    ? formattedTime
    : isYesterday
      ? "Yesterday"
      : noteDate.toLocaleDateString(undefined, { month: "short", day: "numeric" });

  const snippet = (note.cleanedText || note.rawTranscript || "").replace(/\n+/g, " ").trim();

  // 1. Featured Top Note Card (Vibrant Purple Gradient)
  if (featured) {
    return (
      <div
        onClick={() => onSelect(note)}
        className="group relative rounded-2xl bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600 p-3.5 sm:p-4 text-white shadow-md shadow-indigo-500/20 flex items-center justify-between gap-3.5 cursor-pointer active:scale-98 transition-all hover:shadow-lg hover:shadow-indigo-500/30"
      >
        <div className="flex items-center gap-3.5 min-w-0 flex-1">
          <div className="w-10 h-10 rounded-xl bg-white/20 text-white flex items-center justify-center shrink-0 shadow-inner backdrop-blur-xs">
            <Calendar size={18} />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm sm:text-base font-bold text-white leading-snug truncate">
              {note.title}
            </h3>
            <p className="text-xs text-white/80 font-medium truncate mt-0.5">
              • {isToday ? "Today" : formattedDate} • {formattedTime}
            </p>
          </div>
        </div>
        <div className="w-8 h-8 rounded-full bg-white/20 text-white flex items-center justify-center shrink-0 group-hover:bg-white/30 transition-colors">
          <ArrowRight size={15} />
        </div>
      </div>
    );
  }

  // 2. Standard Note Row Card (Clean White with Right Chevron)
  return (
    <div
      onClick={() => onSelect(note)}
      className="group relative rounded-2xl bg-white p-3.5 sm:p-4 border border-slate-100/90 shadow-2xs hover:shadow-xs hover:border-slate-200 flex items-center justify-between gap-3.5 cursor-pointer active:scale-98 transition-all"
    >
      <div className="flex items-center gap-3.5 min-w-0 flex-1">
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-2xs ${cat.iconBg}`}
        >
          {cat.icon}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-bold text-slate-900 group-hover:text-violet-700 transition-colors leading-tight truncate">
            {note.title}
          </h3>
          <p className="text-xs text-slate-400 font-normal truncate mt-0.5">
            {snippet || "No description provided..."}
          </p>
        </div>
      </div>
      <div className="flex flex-col items-end justify-center shrink-0 min-w-[48px]">
        <span className="text-[11px] text-slate-400 font-medium whitespace-nowrap">
          {formattedDate}
        </span>
        <ChevronRight size={14} className="text-slate-300 group-hover:text-slate-500 transition-colors mt-0.5" />
      </div>
    </div>
  );
}

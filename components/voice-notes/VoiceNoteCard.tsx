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
  {
    label: string;
    bgColor: string;
    borderColor: string;
    icon: React.ReactNode;
  }
> = {
  idea: {
    label: "Idea",
    bgColor: "#bfbff9", // signature periwinkle pastel
    borderColor: "border-[#9e9efa]",
    icon: <Lightbulb className="w-4 h-4 text-slate-950" />,
  },
  todo: {
    label: "To-Do",
    bgColor: "#ffefb2", // signature butter yellow pastel
    borderColor: "border-[#ffe006]",
    icon: <CheckSquare className="w-4 h-4 text-slate-950" />,
  },
  instagram_caption: {
    label: "IG Caption",
    bgColor: "#f7cbdf", // signature rose pink pastel
    borderColor: "border-[#ed83b3]",
    icon: <InstagramIcon className="w-4 h-4 text-slate-950" />,
  },
  client_note: {
    label: "Client Note",
    bgColor: "#f8d7ca", // signature peach coral pastel
    borderColor: "border-[#eea07f]",
    icon: <Briefcase className="w-4 h-4 text-slate-950" />,
  },
  reminder: {
    label: "Reminder",
    bgColor: "#f8d7ca",
    borderColor: "border-[#eea07f]",
    icon: <Bell className="w-4 h-4 text-slate-950" />,
  },
  journal: {
    label: "Memo",
    bgColor: "#e9e9ee",
    borderColor: "border-[#d0d0d8]",
    icon: <FileText className="w-4 h-4 text-slate-950" />,
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

  // 1. Featured Top Note Card (Minimalist Signature Pastel with Black Accent Button)
  if (featured) {
    return (
      <div
        onClick={() => onSelect(note)}
        style={{ backgroundColor: cat.bgColor }}
        className={`group relative rounded-[26px] border-2 ${cat.borderColor} hover:border-black p-4 sm:p-5 text-slate-950 shadow-xs hover:shadow-md transition-all duration-300 flex items-center justify-between gap-3.5 cursor-pointer active:scale-[0.99]`}
      >
        <div className="flex items-center gap-3.5 min-w-0 flex-1">
          {/* White icon badge with crisp black border */}
          <div className="w-10 h-10 rounded-2xl bg-white text-slate-950 border border-black/80 flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
            <Calendar size={18} className="text-slate-950" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white text-slate-950 border border-black/80 text-[10px] font-bold shadow-2xs">
                {cat.icon}
                <span>{cat.label}</span>
              </span>
            </div>
            <h3 className="text-sm sm:text-base font-bold text-slate-950 leading-snug truncate mt-1">
              {note.title}
            </h3>
            <p className="text-xs text-slate-800/80 font-medium truncate mt-0.5">
              &bull; {isToday ? "Today" : formattedDate} &bull; {formattedTime}
            </p>
          </div>
        </div>
        {/* Minimalist black circular arrow button matching website SplitCard */}
        <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center shrink-0 shadow-xs group-hover:scale-110 transition-transform">
          <ArrowRight size={14} />
        </div>
      </div>
    );
  }

  // 2. Standard Note Row Card (Clean Minimalist White Card)
  return (
    <div
      onClick={() => onSelect(note)}
      className="group relative rounded-[22px] bg-white p-3.5 sm:p-4 border border-[#e9e9ee] hover:border-black/40 shadow-2xs hover:shadow-xs flex items-center justify-between gap-3.5 cursor-pointer active:scale-[0.99] transition-all"
    >
      <div className="flex items-center gap-3.5 min-w-0 flex-1">
        <div
          style={{ backgroundColor: cat.bgColor }}
          className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border border-black/15 text-slate-950 shadow-2xs group-hover:scale-105 transition-transform"
        >
          {cat.icon}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-bold text-slate-950 group-hover:text-black transition-colors leading-tight truncate">
            {note.title}
          </h3>
          <p className="text-xs text-slate-500 font-normal truncate mt-0.5">
            {snippet || "No description provided..."}
          </p>
        </div>
      </div>
      <div className="flex flex-col items-end justify-center shrink-0 min-w-[48px]">
        <span className="text-[11px] text-slate-400 font-medium whitespace-nowrap">
          {formattedDate}
        </span>
        <ChevronRight size={14} className="text-slate-400 group-hover:text-slate-800 transition-colors mt-0.5" />
      </div>
    </div>
  );
}

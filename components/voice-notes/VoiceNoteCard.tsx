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

export function VoiceNoteCard({ note, onSelect, onDelete, onUpdate }: VoiceNoteCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const cat = CATEGORY_CONFIG[note.category] || CATEGORY_CONFIG.idea;

  const handleTogglePin = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await api<VoiceNoteItem>(`/voice-notes/${note.id}`, {
        method: "PATCH",
        body: JSON.stringify({ isPinned: !note.isPinned }),
      });
      onUpdate(res);
    } catch (err) {
      console.error("Failed to toggle pin:", err);
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(note.id);
  };

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(note.cleanedText || note.rawTranscript);
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
      setMenuOpen(false);
    }, 1500);
  };

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

  const formattedDate = isToday
    ? noteDate.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })
    : isYesterday
      ? "Yesterday"
      : noteDate.toLocaleDateString(undefined, { month: "short", day: "numeric" });

  const snippet = (note.cleanedText || note.rawTranscript || "").replace(/\n+/g, " ").trim();

  return (
    <div
      onClick={() => onSelect(note)}
      className="group relative px-4 sm:px-5 py-3.5 sm:py-4 flex items-center justify-between gap-4 hover:bg-slate-50/80 transition-colors cursor-pointer"
    >
      {/* Left: Category Icon + Title + Snippet */}
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
          <p className="text-xs text-slate-400 font-normal truncate mt-0.5 max-w-xl">
            {snippet || "No description provided..."}
          </p>
        </div>
      </div>

      {/* Right: Timestamp + Pin Icon + More Actions Menu */}
      <div className="flex items-center gap-2.5 shrink-0" onClick={(e) => e.stopPropagation()}>
        <span className="text-xs text-slate-400 font-medium whitespace-nowrap">
          {formattedDate}
        </span>

        {/* Pin Icon (visible if pinned, or on hover) */}
        <button
          type="button"
          onClick={handleTogglePin}
          title={note.isPinned ? "Unpin note" : "Pin note"}
          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
            note.isPinned
              ? "text-blue-600 hover:text-blue-700"
              : "text-slate-300 hover:text-slate-600 opacity-0 group-hover:opacity-100"
          }`}
        >
          <Pin size={15} className={note.isPinned ? "fill-blue-600 -rotate-45" : "-rotate-45"} />
        </button>

        {/* Three Dots Menu */}
        <div className="relative">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen(!menuOpen);
            }}
            title="More actions"
            className="p-1 rounded-lg text-slate-300 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <MoreVertical size={16} />
          </button>

          {menuOpen && (
            <>
              <div
                className="fixed inset-0 z-20"
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpen(false);
                }}
              />
              <div className="absolute right-0 top-7 z-30 w-36 bg-white rounded-2xl shadow-xl border border-slate-100 p-1.5 space-y-0.5 animate-scale-up">
                <button
                  type="button"
                  onClick={handleTogglePin}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-slate-700 hover:bg-slate-50 rounded-xl transition-colors text-left cursor-pointer"
                >
                  <Pin size={13} className={note.isPinned ? "text-blue-600 fill-blue-600" : ""} />
                  <span>{note.isPinned ? "Unpin note" : "Pin to top"}</span>
                </button>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-slate-700 hover:bg-slate-50 rounded-xl transition-colors text-left cursor-pointer"
                >
                  {copied ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                  <span>{copied ? "Copied!" : "Copy note"}</span>
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-rose-600 hover:bg-rose-50 rounded-xl transition-colors text-left cursor-pointer"
                >
                  <Trash2 size={13} />
                  <span>Delete</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

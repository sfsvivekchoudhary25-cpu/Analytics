"use client";

import React, { useState } from "react";
import {
  Sparkles,
  CheckCircle2,
  Circle,
  Copy,
  Check,
  Trash2,
  Pin,
  Play,
  Pause,
  Clock,
  FileText,
  ChevronDown,
  ChevronUp,
  Tag as TagIcon,
  Lightbulb,
  CheckSquare,
  Briefcase,
  Bell,
  MoreVertical,
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
  onDelete: (id: string) => void;
  onUpdate: (updated: VoiceNoteItem) => void;
  defaultExpanded?: boolean;
}

const CATEGORY_CONFIG: Record<
  string,
  { label: string; badge: string; iconBg: string; iconColor: string; icon: React.ReactNode }
> = {
  idea: {
    label: "Idea",
    badge: "bg-purple-50 text-purple-700 border-purple-200/80",
    iconBg: "bg-purple-100/90 text-purple-600",
    iconColor: "text-purple-600",
    icon: <Lightbulb className="w-4 h-4" />,
  },
  todo: {
    label: "To-Do",
    badge: "bg-emerald-50 text-emerald-700 border-emerald-200/80",
    iconBg: "bg-emerald-100/90 text-emerald-600",
    iconColor: "text-emerald-600",
    icon: <CheckSquare className="w-4 h-4" />,
  },
  instagram_caption: {
    label: "IG Caption",
    badge: "bg-pink-50 text-rose-700 border-pink-200/80",
    iconBg: "bg-pink-100/90 text-rose-600",
    iconColor: "text-rose-600",
    icon: <InstagramIcon className="w-4 h-4" />,
  },
  client_note: {
    label: "Client / Lead",
    badge: "bg-blue-50 text-blue-700 border-blue-200/80",
    iconBg: "bg-blue-100/90 text-blue-600",
    iconColor: "text-blue-600",
    icon: <Briefcase className="w-4 h-4" />,
  },
  reminder: {
    label: "Reminder",
    badge: "bg-amber-50 text-amber-800 border-amber-200/80",
    iconBg: "bg-amber-100/90 text-amber-600",
    iconColor: "text-amber-600",
    icon: <Bell className="w-4 h-4" />,
  },
  journal: {
    label: "Memo",
    badge: "bg-slate-100 text-slate-700 border-slate-200/80",
    iconBg: "bg-slate-100 text-slate-600",
    iconColor: "text-slate-600",
    icon: <FileText className="w-4 h-4" />,
  },
};

export function VoiceNoteCard({ note, onDelete, onUpdate, defaultExpanded = true }: VoiceNoteCardProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [showRaw, setShowRaw] = useState(false);
  const [copiedClean, setCopiedClean] = useState(false);
  const [copiedCaption, setCopiedCaption] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
  const [togglingTaskId, setTogglingTaskId] = useState<string | null>(null);

  const cat = CATEGORY_CONFIG[note.category] || CATEGORY_CONFIG.idea;

  const handleCopyClean = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(note.cleanedText);
    setCopiedClean(true);
    setTimeout(() => setCopiedClean(false), 2000);
  };

  const handleCopyCaption = (e: React.MouseEvent) => {
    e.stopPropagation();
    const hashtags = (note.tags || []).map((t) => `#${t.replace(/\s+/g, "")}`).join(" ");
    const captionText = `${note.cleanedText}\n\n${hashtags}`.trim();
    navigator.clipboard.writeText(captionText);
    setCopiedCaption(true);
    setTimeout(() => setCopiedCaption(false), 2500);
  };

  const handleToggleTask = async (e: React.MouseEvent, itemId: string, currentCompleted: boolean) => {
    e.stopPropagation();
    setTogglingTaskId(itemId);
    try {
      const res = await api<VoiceNoteItem>(`/voice-notes/${note.id}/action-items/${itemId}`, {
        method: "PATCH",
        body: JSON.stringify({ completed: !currentCompleted }),
      });
      onUpdate(res);
    } catch (err) {
      console.error("Failed to toggle task:", err);
    } finally {
      setTogglingTaskId(null);
    }
  };

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

  const handleToggleAudio = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!note.audioUrl) return;

    if (!audioElement) {
      const fullUrl = note.audioUrl.startsWith("http") ? note.audioUrl : note.audioUrl;
      const audio = new Audio(fullUrl);
      audio.onended = () => setIsPlaying(false);
      audio.onerror = () => setIsPlaying(false);
      audio.play();
      setAudioElement(audio);
      setIsPlaying(true);
    } else {
      if (isPlaying) {
        audioElement.pause();
        setIsPlaying(false);
      } else {
        audioElement.play();
        setIsPlaying(true);
      }
    }
  };

  // Clean relative or formatted date
  const noteDate = new Date(note.createdAt);
  const now = new Date();
  const isToday =
    noteDate.getDate() === now.getDate() &&
    noteDate.getMonth() === now.getMonth() &&
    noteDate.getFullYear() === now.getFullYear();

  const formattedDate = isToday
    ? noteDate.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })
    : noteDate.toLocaleDateString(undefined, { month: "short", day: "numeric" });

  const snippet = (note.cleanedText || note.rawTranscript || "").replace(/\n+/g, " ").trim();

  return (
    <div
      onClick={() => setIsExpanded(!isExpanded)}
      className={`group rounded-[20px] border transition-all duration-200 bg-white shadow-2xs hover:shadow-md cursor-pointer ${
        note.isPinned
          ? "border-violet-300 ring-1 ring-violet-200/60 bg-gradient-to-br from-white via-violet-50/15 to-white"
          : "border-slate-200/80 hover:border-slate-300"
      }`}
    >
      {/* ── ROW HEADER: MATCHES REFERENCE IMAGE EXACTLY ──────────────── */}
      <div className="p-4 sm:p-5 flex items-center justify-between gap-3">
        {/* Left: Category Icon + Title + Snippet */}
        <div className="flex items-center gap-3.5 min-w-0 flex-1">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-2xs ${cat.iconBg}`}
          >
            {cat.icon}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900 group-hover:text-violet-700 transition-colors leading-snug truncate">
                {note.title}
              </h3>
              <span className={`hidden sm:inline-block text-[10px] font-bold px-2 py-0.5 rounded-full border ${cat.badge}`}>
                {cat.label}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-normal truncate mt-0.5">
              {snippet || "No additional note content..."}
            </p>
          </div>
        </div>

        {/* Right: Timestamp + Pin Icon + Expand Chevron / Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-slate-400 font-semibold whitespace-nowrap">
            {formattedDate}
          </span>

          <button
            type="button"
            onClick={handleTogglePin}
            title={note.isPinned ? "Unpin note" : "Pin note"}
            className={`p-1.5 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer ${
              note.isPinned ? "text-violet-600 bg-violet-50" : "text-slate-400 hover:text-slate-600"
            }`}
          >
            <Pin size={14} className={note.isPinned ? "fill-violet-600" : ""} />
          </button>

          <button
            type="button"
            onClick={handleDelete}
            title="Delete note"
            className="p-1.5 rounded-xl text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors cursor-pointer"
          >
            <Trash2 size={14} />
          </button>

          <div className="text-slate-400 pl-0.5">
            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </div>
        </div>
      </div>

      {/* ── EXPANDED DETAILS: AUDIO, TASKS, TAGS & ACTIONS ───────────── */}
      {isExpanded && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="px-4 sm:px-5 pb-5 pt-1 border-t border-slate-100/80 space-y-3 cursor-default"
        >
          {/* Audio Player Bar (if original audio exists) */}
          {note.audioUrl && (
            <div className="flex items-center justify-between gap-3 bg-slate-50/80 border border-slate-200/60 rounded-2xl px-3.5 py-2.5">
              <button
                type="button"
                onClick={handleToggleAudio}
                className="w-8 h-8 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white flex items-center justify-center shrink-0 shadow-xs transition-transform active:scale-95 cursor-pointer"
              >
                {isPlaying ? <Pause size={14} /> : <Play size={14} className="ml-0.5" />}
              </button>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
                  <span className="flex items-center gap-1.5 font-semibold text-slate-700">
                    <span className="w-1.5 h-1.5 rounded-full bg-violet-600 animate-pulse" />
                    Original Audio Recording
                  </span>
                  <span className="tabular-nums font-semibold text-slate-700">
                    {Math.floor(note.durationSeconds / 60)}:
                    {String(note.durationSeconds % 60).padStart(2, "0")}
                  </span>
                </div>
                <div className="w-full bg-slate-200/80 h-1.5 rounded-full overflow-hidden mt-1.5">
                  <div
                    className={`bg-gradient-to-r from-violet-600 to-indigo-600 h-full rounded-full transition-all duration-300 ${
                      isPlaying ? "w-full animate-pulse" : "w-1/3"
                    }`}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Clean Note Text */}
          <div className="text-xs sm:text-sm text-slate-700 leading-relaxed font-normal whitespace-pre-wrap pt-1">
            {note.cleanedText}
          </div>

          {/* Checkable Action Items */}
          {note.actionItems && note.actionItems.length > 0 && (
            <div className="pt-2 border-t border-slate-100 space-y-1.5">
              <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <span>ACTION ITEMS & TASKS</span>
                <span>
                  {note.actionItems.filter((t) => t.completed).length}/{note.actionItems.length}
                </span>
              </div>
              <div className="space-y-1">
                {note.actionItems.map((task) => (
                  <div
                    key={task.id}
                    onClick={(e) => handleToggleTask(e, task.id, task.completed)}
                    className={`flex items-start gap-2.5 p-2 rounded-xl text-xs cursor-pointer transition-colors ${
                      task.completed
                        ? "bg-slate-50 text-slate-400 line-through"
                        : "bg-violet-50/40 hover:bg-violet-50 text-slate-800 font-medium"
                    }`}
                  >
                    <div className="mt-0.5 shrink-0 text-violet-600">
                      {task.completed ? (
                        <CheckCircle2 size={14} className="text-emerald-500 fill-emerald-100" />
                      ) : (
                        <Circle size={14} className="text-slate-400 hover:text-violet-600" />
                      )}
                    </div>
                    <span className="leading-snug">{task.text}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Raw Transcript Expander */}
          <div>
            <button
              type="button"
              onClick={() => setShowRaw(!showRaw)}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
            >
              <span>{showRaw ? "Hide spoken transcript" : "View spoken transcript"}</span>
              {showRaw ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>
            {showRaw && (
              <div className="mt-1.5 p-3 rounded-2xl bg-slate-50 border border-slate-100 text-[11px] text-slate-500 italic leading-relaxed whitespace-pre-wrap">
                {note.rawTranscript}
              </div>
            )}
          </div>

          {/* Tags & Action Buttons */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 flex-wrap">
              {note.tags &&
                note.tags.map((t, idx) => (
                  <span
                    key={idx}
                    className="text-[10px] font-semibold text-slate-500 bg-slate-100 hover:bg-slate-200 px-2 py-0.5 rounded-lg transition-colors"
                  >
                    #{t}
                  </span>
                ))}
            </div>

            <div className="flex items-center gap-2 ml-auto">
              <button
                type="button"
                onClick={handleCopyCaption}
                title="Copy formatted Instagram caption"
                className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-pink-50 hover:bg-pink-100 text-rose-700 border border-pink-200/80 text-[11px] font-semibold transition-all active:scale-95 cursor-pointer shadow-2xs"
              >
                {copiedCaption ? (
                  <Check size={11} className="text-emerald-600" />
                ) : (
                  <InstagramIcon className="w-3 h-3 inline text-rose-600" />
                )}
                <span>{copiedCaption ? "Copied!" : "IG Caption"}</span>
              </button>

              <button
                type="button"
                onClick={handleCopyClean}
                title="Copy clean text"
                className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold transition-all active:scale-95 cursor-pointer"
              >
                {copiedClean ? <Check size={11} className="text-emerald-600" /> : <Copy size={11} />}
                <span>{copiedClean ? "Copied" : "Copy"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

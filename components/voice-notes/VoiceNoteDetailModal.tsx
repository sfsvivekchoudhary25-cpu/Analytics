"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  X,
  Play,
  Pause,
  Copy,
  Check,
  Trash2,
  Pin,
  CheckCircle2,
  Circle,
  ChevronDown,
  ChevronUp,
  Tag as TagIcon,
  Lightbulb,
  CheckSquare,
  Briefcase,
  Bell,
  FileText,
  Clock,
  Sparkles,
} from "lucide-react";
import { InstagramIcon } from "@/components/icons";
import { api } from "@/lib/api";
import { ActionItem, VoiceNoteItem } from "./VoiceNoteCard";

interface VoiceNoteDetailModalProps {
  note: VoiceNoteItem | null;
  isOpen: boolean;
  onClose: () => void;
  onDelete: (id: string) => void;
  onUpdate: (updated: VoiceNoteItem) => void;
}

const CATEGORY_CONFIG: Record<
  string,
  { label: string; badge: string; iconBg: string; iconColor: string; icon: React.ReactNode }
> = {
  idea: {
    label: "💡 Idea",
    badge: "bg-purple-50 text-purple-700 border-purple-200/80",
    iconBg: "bg-purple-100/90 text-purple-600",
    iconColor: "text-purple-600",
    icon: <Lightbulb className="w-4 h-4" />,
  },
  todo: {
    label: "✅ To-Do",
    badge: "bg-emerald-50 text-emerald-700 border-emerald-200/80",
    iconBg: "bg-emerald-100/90 text-emerald-600",
    iconColor: "text-emerald-600",
    icon: <CheckSquare className="w-4 h-4" />,
  },
  instagram_caption: {
    label: "📸 IG Caption",
    badge: "bg-pink-50 text-rose-700 border-pink-200/80",
    iconBg: "bg-pink-100/90 text-rose-600",
    iconColor: "text-rose-600",
    icon: <InstagramIcon className="w-4 h-4" />,
  },
  client_note: {
    label: "💼 Client / Lead",
    badge: "bg-blue-50 text-blue-700 border-blue-200/80",
    iconBg: "bg-blue-100/90 text-blue-600",
    iconColor: "text-blue-600",
    icon: <Briefcase className="w-4 h-4" />,
  },
  reminder: {
    label: "⏰ Reminder",
    badge: "bg-amber-50 text-amber-800 border-amber-200/80",
    iconBg: "bg-amber-100/90 text-amber-600",
    iconColor: "text-amber-600",
    icon: <Bell className="w-4 h-4" />,
  },
  journal: {
    label: "📓 Memo",
    badge: "bg-slate-100 text-slate-700 border-slate-200/80",
    iconBg: "bg-slate-100 text-slate-600",
    iconColor: "text-slate-600",
    icon: <FileText className="w-4 h-4" />,
  },
};

export function VoiceNoteDetailModal({
  note,
  isOpen,
  onClose,
  onDelete,
  onUpdate,
}: VoiceNoteDetailModalProps) {
  const [mounted, setMounted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [showRaw, setShowRaw] = useState(false);
  const [copiedClean, setCopiedClean] = useState(false);
  const [copiedCaption, setCopiedCaption] = useState(false);
  const [togglingTaskId, setTogglingTaskId] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Lock background scrolling and prevent scrollbar layout shift while modal is open
  useEffect(() => {
    if (!isOpen) return;

    const origBodyOverflow = document.body.style.overflow;
    const origHtmlOverflow = document.documentElement.style.overflow;
    const origBodyPaddingRight = document.body.style.paddingRight;

    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    return () => {
      document.body.style.overflow = origBodyOverflow;
      document.documentElement.style.overflow = origHtmlOverflow;
      document.body.style.paddingRight = origBodyPaddingRight;
    };
  }, [isOpen]);

  // Stop audio when modal closes or note changes
  useEffect(() => {
    if (!isOpen && audioElement) {
      audioElement.pause();
      setIsPlaying(false);
      setAudioElement(null);
    }
  }, [isOpen, audioElement]);

  if (!isOpen || !note || !mounted) return null;

  const cat = CATEGORY_CONFIG[note.category] || CATEGORY_CONFIG.idea;

  const handleToggleAudio = () => {
    if (!note.audioUrl) return;

    if (!audioElement) {
      const fullUrl = note.audioUrl.startsWith("http") ? note.audioUrl : note.audioUrl;
      const audio = new Audio(fullUrl);
      audio.ontimeupdate = () => setCurrentTime(audio.currentTime);
      audio.onended = () => {
        setIsPlaying(false);
        setCurrentTime(0);
      };
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

  const handleTogglePin = async () => {
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

  const handleDelete = () => {
    onDelete(note.id);
    onClose();
  };

  const handleToggleTask = async (itemId: string, currentCompleted: boolean) => {
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

  const handleCopyClean = () => {
    navigator.clipboard.writeText(note.cleanedText);
    setCopiedClean(true);
    setTimeout(() => setCopiedClean(false), 2000);
  };

  const handleCopyCaption = () => {
    const hashtags = (note.tags || []).map((t) => `#${t.replace(/\s+/g, "")}`).join(" ");
    const captionText = `${note.cleanedText}\n\n${hashtags}`.trim();
    navigator.clipboard.writeText(captionText);
    setCopiedCaption(true);
    setTimeout(() => setCopiedCaption(false), 2500);
  };

  const formattedDate = new Date(note.createdAt).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const durationSec = note.durationSeconds || 0;
  const progressPercent = durationSec > 0 ? (currentTime / durationSec) * 100 : 0;

  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-slate-950/60 backdrop-blur-md overflow-y-auto overscroll-contain animate-in fade-in duration-200">
      {/* Clickable Backdrop */}
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />

      {/* Modal Card */}
      <div
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        className="relative z-10 my-auto w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-100 flex flex-col max-h-[88vh] overflow-hidden animate-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="shrink-0 p-5 sm:p-6 pb-4 border-b border-slate-100 flex items-start justify-between gap-4 bg-white">
          <div className="flex items-center gap-3">
            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shadow-xs ${cat.iconBg}`}>
              {cat.icon}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${cat.badge}`}>
                  {cat.label}
                </span>
                {note.isPinned && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-violet-700 bg-violet-50 border border-violet-200 px-2 py-0.5 rounded-full">
                    <Pin size={10} className="fill-violet-600" /> Pinned
                  </span>
                )}
              </div>
              <div className="text-xs text-slate-400 font-medium mt-1 flex items-center gap-1.5">
                <Clock size={12} />
                <span>{formattedDate}</span>
              </div>
            </div>
          </div>

          {/* Action Icons */}
          <div className="flex items-center gap-1 text-slate-400">
            <button
              type="button"
              onClick={handleTogglePin}
              title={note.isPinned ? "Unpin note" : "Pin note"}
              className={`p-2 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer ${
                note.isPinned ? "text-violet-600 bg-violet-50" : "hover:text-slate-700"
              }`}
            >
              <Pin size={16} className={note.isPinned ? "fill-violet-600" : ""} />
            </button>
            <button
              type="button"
              onClick={handleDelete}
              title="Delete note"
              className="p-2 rounded-xl hover:bg-rose-50 hover:text-rose-600 transition-colors cursor-pointer"
            >
              <Trash2 size={16} />
            </button>
            <button
              type="button"
              onClick={onClose}
              title="Close modal"
              className="p-2 rounded-xl hover:bg-slate-100 hover:text-slate-700 transition-colors cursor-pointer ml-1"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Content Body (Scrollable with overscroll-contain) */}
        <div className="flex-1 overflow-y-auto overscroll-contain p-5 sm:p-6 space-y-5">
          {/* Title */}
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 leading-snug tracking-tight">
            {note.title}
          </h2>

          {/* Audio Player Bar */}
          {note.audioUrl && (
            <div className="bg-slate-50/90 border border-slate-200/70 rounded-2xl p-3.5 flex items-center gap-3.5 shadow-2xs">
              <button
                type="button"
                onClick={handleToggleAudio}
                className="w-10 h-10 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white flex items-center justify-center shrink-0 shadow-sm transition-transform active:scale-95 cursor-pointer"
              >
                {isPlaying ? <Pause size={16} /> : <Play size={16} className="ml-0.5" />}
              </button>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between text-xs text-slate-600 font-semibold mb-1.5">
                  <span className="flex items-center gap-1.5 text-slate-800">
                    <span className="w-2 h-2 rounded-full bg-violet-600 animate-pulse" />
                    Original Audio Recording
                  </span>
                  <span className="tabular-nums font-mono text-slate-500">
                    {Math.floor(currentTime / 60)}:
                    {String(Math.floor(currentTime % 60)).padStart(2, "0")} /{" "}
                    {Math.floor(durationSec / 60)}:
                    {String(durationSec % 60).padStart(2, "0")}
                  </span>
                </div>

                <div className="w-full bg-slate-200/80 h-2 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${Math.min(100, progressPercent)}%` }}
                    className="bg-gradient-to-r from-violet-600 to-indigo-600 h-full rounded-full transition-all duration-150"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Cleaned Note Text */}
          <div className="space-y-1.5">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Cleaned AI Note
            </div>
            <div className="text-sm sm:text-base text-slate-800 leading-relaxed font-normal whitespace-pre-wrap bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
              {note.cleanedText}
            </div>
          </div>

          {/* Action Items & Tasks */}
          {note.actionItems && note.actionItems.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider">
                <span>ACTION ITEMS & TASKS</span>
                <span className="text-violet-600 font-semibold">
                  {note.actionItems.filter((t) => t.completed).length} / {note.actionItems.length} completed
                </span>
              </div>
              <div className="space-y-1.5">
                {note.actionItems.map((task) => (
                  <div
                    key={task.id}
                    onClick={() => handleToggleTask(task.id, task.completed)}
                    className={`flex items-start gap-3 p-3 rounded-xl text-xs sm:text-sm cursor-pointer transition-all ${
                      task.completed
                        ? "bg-slate-50 text-slate-400 line-through"
                        : "bg-violet-50/50 hover:bg-violet-50 text-slate-800 font-medium border border-violet-100/60"
                    }`}
                  >
                    <div className="mt-0.5 shrink-0 text-violet-600">
                      {task.completed ? (
                        <CheckCircle2 size={16} className="text-emerald-500 fill-emerald-100" />
                      ) : (
                        <Circle size={16} className="text-slate-400 hover:text-violet-600" />
                      )}
                    </div>
                    <span className="leading-snug">{task.text}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Spoken Raw Transcript Toggle */}
          <div className="pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowRaw(!showRaw)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
            >
              <span>{showRaw ? "Hide spoken raw transcript" : "View spoken raw transcript"}</span>
              {showRaw ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
            {showRaw && (
              <div className="mt-2 p-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-xs text-slate-600 italic leading-relaxed whitespace-pre-wrap">
                {note.rawTranscript}
              </div>
            )}
          </div>

          {/* Tags */}
          {note.tags && note.tags.length > 0 && (
            <div className="pt-2 border-t border-slate-100">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                TAGS
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                {note.tags.map((t, idx) => (
                  <span
                    key={idx}
                    className="text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded-lg transition-colors"
                  >
                    #{t}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="shrink-0 p-4 sm:p-5 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3 flex-wrap">
          <div className="text-xs text-slate-400 font-medium">
            AI Cleaned & Structured
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyCaption}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-pink-50 hover:bg-pink-100 text-rose-700 border border-pink-200/80 text-xs font-semibold transition-all active:scale-95 cursor-pointer shadow-2xs"
            >
              {copiedCaption ? (
                <Check size={13} className="text-emerald-600" />
              ) : (
                <InstagramIcon className="w-3.5 h-3.5 inline text-rose-600" />
              )}
              <span>{copiedCaption ? "Copied!" : "Copy IG Caption"}</span>
            </button>

            <button
              type="button"
              onClick={handleCopyClean}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200/80 text-xs font-semibold transition-all active:scale-95 cursor-pointer shadow-2xs"
            >
              {copiedClean ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
              <span>{copiedClean ? "Copied" : "Copy Note"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}

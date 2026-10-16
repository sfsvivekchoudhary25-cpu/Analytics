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
  MessageSquare,
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
}

const CATEGORY_STYLES: Record<string, { label: string; badge: string; bg: string }> = {
  idea: { label: "💡 Idea", badge: "bg-purple-50 text-purple-700 border-purple-200/80", bg: "#fbf9ff" },
  todo: { label: "✅ To-Do", badge: "bg-emerald-50 text-emerald-700 border-emerald-200/80", bg: "#f7fdf9" },
  instagram_caption: { label: "📸 IG Caption", badge: "bg-pink-50 text-rose-700 border-pink-200/80", bg: "#fff9fb" },
  client_note: { label: "💼 Client / Lead", badge: "bg-blue-50 text-blue-700 border-blue-200/80", bg: "#f8faff" },
  reminder: { label: "⏰ Reminder", badge: "bg-amber-50 text-amber-800 border-amber-200/80", bg: "#fffdf7" },
  journal: { label: "📓 Memo", badge: "bg-slate-100 text-slate-700 border-slate-200/80", bg: "#f8fafc" },
};

export function VoiceNoteCard({ note, onDelete, onUpdate }: VoiceNoteCardProps) {
  const [showRaw, setShowRaw] = useState(false);
  const [copiedClean, setCopiedClean] = useState(false);
  const [copiedCaption, setCopiedCaption] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
  const [togglingTaskId, setTogglingTaskId] = useState<string | null>(null);

  const catStyle = CATEGORY_STYLES[note.category] || CATEGORY_STYLES.idea;

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

  const handleToggleAudio = () => {
    if (!note.audioUrl) return;

    if (!audioElement) {
      const fullUrl = note.audioUrl.startsWith("http")
        ? note.audioUrl
        : note.audioUrl;
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

  const formattedDate = new Date(note.createdAt).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div
      className={`rounded-3xl border transition-all duration-200 p-5 shadow-xs flex flex-col justify-between hover:shadow-md ${
        note.isPinned ? "border-indigo-300 ring-1 ring-indigo-200/60 bg-white" : "border-slate-200/90 bg-white"
      }`}
    >
      <div>
        {/* Header: Category Badge + Pin & Delete */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${catStyle.badge}`}>
              {catStyle.label}
            </span>
            {note.isPinned && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full">
                <Pin size={10} className="fill-indigo-600" /> Pinned
              </span>
            )}
          </div>

          <div className="flex items-center gap-1 text-slate-400">
            <button
              type="button"
              onClick={handleTogglePin}
              title={note.isPinned ? "Unpin note" : "Pin note"}
              className={`p-1.5 rounded-xl hover:bg-slate-100 transition-colors ${
                note.isPinned ? "text-indigo-600" : "hover:text-slate-700"
              }`}
            >
              <Pin size={14} className={note.isPinned ? "fill-indigo-600" : ""} />
            </button>
            <button
              type="button"
              onClick={() => onDelete(note.id)}
              title="Delete note"
              className="p-1.5 rounded-xl hover:bg-rose-50 hover:text-rose-600 transition-colors"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>

        {/* Title */}
        <h3 className="text-base font-bold text-slate-900 mt-2.5 leading-snug">
          {note.title}
        </h3>

        {/* Audio Player Bar (if original audio was recorded) */}
        {note.audioUrl && (
          <div className="mt-3 flex items-center justify-between gap-3 bg-slate-50 border border-slate-100 rounded-2xl px-3.5 py-2">
            <button
              type="button"
              onClick={handleToggleAudio}
              className="w-8 h-8 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center shrink-0 shadow-xs transition-transform active:scale-95"
            >
              {isPlaying ? <Pause size={14} /> : <Play size={14} className="ml-0.5" />}
            </button>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
                <span>Original Recording</span>
                <span className="tabular-nums">
                  {Math.floor(note.durationSeconds / 60)}:
                  {String(note.durationSeconds % 60).padStart(2, "0")}
                </span>
              </div>
              <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden mt-1">
                <div
                  className={`bg-indigo-600 h-full rounded-full transition-all duration-300 ${
                    isPlaying ? "w-full animate-pulse" : "w-1/3"
                  }`}
                />
              </div>
            </div>
          </div>
        )}

        {/* Cleaned Note Text */}
        <div className="mt-3 text-xs sm:text-sm text-slate-700 leading-relaxed font-normal whitespace-pre-wrap">
          {note.cleanedText}
        </div>

        {/* Checkable Action Items */}
        {note.actionItems && note.actionItems.length > 0 && (
          <div className="mt-3.5 pt-3 border-t border-slate-100 space-y-1.5">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              ACTION ITEMS & TASKS
            </div>
            <div className="space-y-1">
              {note.actionItems.map((task) => (
                <div
                  key={task.id}
                  onClick={() => handleToggleTask(task.id, task.completed)}
                  className={`flex items-start gap-2 p-2 rounded-xl text-xs cursor-pointer transition-colors ${
                    task.completed
                      ? "bg-slate-50 text-slate-400 line-through"
                      : "bg-indigo-50/50 hover:bg-indigo-50 text-slate-800 font-medium"
                  }`}
                >
                  <div className="mt-0.5 shrink-0 text-indigo-600">
                    {task.completed ? (
                      <CheckCircle2 size={14} className="text-emerald-500 fill-emerald-100" />
                    ) : (
                      <Circle size={14} className="text-slate-400" />
                    )}
                  </div>
                  <span className="leading-snug">{task.text}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Toggle Original Raw Transcript */}
        <div className="mt-3">
          <button
            type="button"
            onClick={() => setShowRaw(!showRaw)}
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-400 hover:text-slate-700 transition-colors"
          >
            <span>{showRaw ? "Hide raw transcript" : "View raw spoken transcript"}</span>
            {showRaw ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>
          {showRaw && (
            <div className="mt-1.5 p-3 rounded-2xl bg-slate-50 border border-slate-100 text-[11px] text-slate-500 italic leading-relaxed whitespace-pre-wrap">
              {note.rawTranscript}
            </div>
          )}
        </div>

        {/* Tags */}
        {note.tags && note.tags.length > 0 && (
          <div className="mt-3 flex items-center gap-1.5 flex-wrap">
            {note.tags.map((t, idx) => (
              <span
                key={idx}
                className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md"
              >
                #{t}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap">
        <span className="text-[11px] text-slate-400 font-medium">
          {formattedDate}
        </span>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleCopyCaption}
            title="Copy as Instagram Caption"
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-pink-50 hover:bg-pink-100 text-rose-700 border border-pink-200/80 text-[11px] font-semibold transition-colors"
          >
            {copiedCaption ? <Check size={11} className="text-emerald-600" /> : <InstagramIcon className="w-3 h-3 inline" />}
            <span>{copiedCaption ? "Copied!" : "IG Caption"}</span>
          </button>

          <button
            type="button"
            onClick={handleCopyClean}
            title="Copy clean note"
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold transition-colors"
          >
            {copiedClean ? <Check size={11} className="text-emerald-600" /> : <Copy size={11} />}
            <span>{copiedClean ? "Copied" : "Copy"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

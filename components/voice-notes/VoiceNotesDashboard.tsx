"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Mic,
  Search,
  Plus,
  CheckCircle2,
  Sparkles,
  ListTodo,
  Tag as TagIcon,
  Filter,
  RefreshCw,
  Lightbulb,
} from "lucide-react";
import { api } from "@/lib/api";
import { VoiceNoteCard, VoiceNoteItem } from "./VoiceNoteCard";
import { VoiceNoteRecorderModal } from "./VoiceNoteRecorderModal";

export function VoiceNotesDashboard() {
  const [notes, setNotes] = useState<VoiceNoteItem[]>([]);
  const [stats, setStats] = useState({
    totalNotes: 0,
    totalTasks: 0,
    completedTasks: 0,
    pendingTasks: 0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [isRecorderOpen, setIsRecorderOpen] = useState(false);

  const loadNotes = useCallback(async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (search.trim()) queryParams.set("search", search.trim());
      if (selectedCategory !== "all") queryParams.set("category", selectedCategory);

      const res = await api<{
        notes: VoiceNoteItem[];
        stats: {
          totalNotes: number;
          totalTasks: number;
          completedTasks: number;
          pendingTasks: number;
        };
      }>(`/voice-notes?${queryParams.toString()}`);

      setNotes(res.notes || []);
      setStats(
        res.stats || {
          totalNotes: 0,
          totalTasks: 0,
          completedTasks: 0,
          pendingTasks: 0,
        }
      );
    } catch (err) {
      console.error("Failed to load voice notes:", err);
    } finally {
      setLoading(false);
    }
  }, [search, selectedCategory]);

  useEffect(() => {
    loadNotes();
    const handleGlobalCreate = () => loadNotes();
    window.addEventListener("voice-note-created", handleGlobalCreate);
    return () => window.removeEventListener("voice-note-created", handleGlobalCreate);
  }, [loadNotes]);

  const handleDelete = async (id: string) => {
    try {
      await api(`/voice-notes/${id}`, { method: "DELETE" });
      setNotes((prev) => prev.filter((n) => n.id !== id));
      setStats((prev) => ({ ...prev, totalNotes: Math.max(0, prev.totalNotes - 1) }));
    } catch (err) {
      console.error("Failed to delete note:", err);
    }
  };

  const handleUpdate = (updated: VoiceNoteItem) => {
    setNotes((prev) => {
      const nextNotes = prev.map((n) => (n.id === updated.id ? updated : n));
      let totalTasks = 0;
      let completedTasks = 0;
      nextNotes.forEach((note) => {
        (note.actionItems || []).forEach((t) => {
          totalTasks++;
          if (t.completed) completedTasks++;
        });
      });
      setStats((s) => ({
        ...s,
        totalTasks,
        completedTasks,
        pendingTasks: totalTasks - completedTasks,
      }));
      return nextNotes;
    });
  };

  const handleNoteCreated = (newNote: VoiceNoteItem) => {
    setNotes((prev) => [newNote, ...prev]);
    loadNotes();
  };

  const categories = [
    { key: "all", label: "All Notes" },
    { key: "idea", label: "💡 Ideas" },
    { key: "todo", label: "✅ To-Dos" },
    { key: "instagram_caption", label: "📸 IG Captions" },
    { key: "client_note", label: "💼 Client Notes" },
    { key: "reminder", label: "⏰ Reminders" },
  ];

  return (
    <div className="space-y-6">
      {/* ── HEADER BANNER ────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 rounded-3xl text-white shadow-lg border border-slate-800">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 flex items-center justify-center shrink-0 shadow-inner">
            <Mic size={24} className="text-indigo-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-widest text-indigo-300">
                VOICE INTELLIGENCE
              </span>
              <span className="text-[10px] font-bold bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 px-2 py-0.5 rounded-full">
                AI Cleaned & Organized
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-0.5">
              Voice Notes Studio
            </h1>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              Speak your content ideas, rambles, or tasks. AI formats, categorizes, and extracts action items automatically.
            </p>
          </div>
        </div>

      </div>

      {/* ── KPI METRIC STRIP ─────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl border border-slate-200/90 bg-white shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500">Total Notes</span>
            <div className="text-2xl font-black text-slate-900 mt-0.5 tabular-nums">
              {stats.totalNotes}
            </div>
          </div>
          <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Mic size={18} />
          </div>
        </div>

        <div className="p-4 rounded-2xl border border-slate-200/90 bg-white shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500">Completed Tasks</span>
            <div className="text-2xl font-black text-emerald-600 mt-0.5 tabular-nums">
              {stats.completedTasks}
            </div>
          </div>
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 size={18} />
          </div>
        </div>

        <div className="p-4 rounded-2xl border border-slate-200/90 bg-white shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500">Pending Actions</span>
            <div className="text-2xl font-black text-amber-600 mt-0.5 tabular-nums">
              {stats.pendingTasks}
            </div>
          </div>
          <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <ListTodo size={18} />
          </div>
        </div>

        <div className="p-4 rounded-2xl border border-slate-200/90 bg-white shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500">Ideas Stored</span>
            <div className="text-2xl font-black text-purple-600 mt-0.5 tabular-nums">
              {notes.filter((n) => n.category === "idea").length}
            </div>
          </div>
          <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <Lightbulb size={18} />
          </div>
        </div>
      </div>

      {/* ── SEARCH & CATEGORY FILTER STRIP ───────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {categories.map((c) => (
            <button
              key={c.key}
              type="button"
              onClick={() => setSelectedCategory(c.key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                selectedCategory === c.key
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-600"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64">
          <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search notes or tags..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>
      </div>

      {/* ── NOTES GRID ───────────────────────────────────────────────── */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="rounded-3xl border border-slate-200/80 bg-white p-5 animate-pulse space-y-3"
            >
              <div className="h-4 w-20 bg-slate-200 rounded-full" />
              <div className="h-5 w-3/4 bg-slate-200 rounded-lg" />
              <div className="space-y-2 pt-2">
                <div className="h-3 w-full bg-slate-100 rounded" />
                <div className="h-3 w-5/6 bg-slate-100 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : notes.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-12 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center mx-auto">
            <Mic size={28} />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              {search || selectedCategory !== "all"
                ? "No matching voice notes found"
                : "No Voice Notes Yet"}
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 leading-relaxed">
              {search || selectedCategory !== "all"
                ? "Try clearing your search or category filters to view other notes."
                : "Click the mic button to speak your first note. AI will automatically structure your thoughts into clean notes and action items."}
            </p>
          </div>
          {!isRecorderOpen && (
            <div>
              <button
                type="button"
                onClick={() => setIsRecorderOpen(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
              >
                <Plus size={14} />
                <span>Record First Note</span>
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {notes.map((note) => (
            <VoiceNoteCard
              key={note.id}
              note={note}
              onDelete={handleDelete}
              onUpdate={handleUpdate}
            />
          ))}
        </div>
      )}

      {/* Recording Modal */}
      <VoiceNoteRecorderModal
        isOpen={isRecorderOpen}
        onClose={() => setIsRecorderOpen(false)}
        onNoteCreated={handleNoteCreated}
      />
    </div>
  );
}

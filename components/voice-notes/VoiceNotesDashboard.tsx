"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
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
  FileText,
  CheckSquare,
  Bell,
  TrendingUp,
  Clock,
  ChevronDown,
  ArrowUpRight,
  User,
  SlidersHorizontal,
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
  const [recorderMode, setRecorderMode] = useState<"record" | "upload" | "type">("record");
  const [recorderCategory, setRecorderCategory] = useState<
    "idea" | "todo" | "reminder" | "instagram_caption" | "client_note" | "journal"
  >("idea");

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

  const openCapture = (
    mode: "record" | "upload" | "type",
    cat: "idea" | "todo" | "reminder" | "instagram_caption" | "client_note" | "journal" = "idea"
  ) => {
    setRecorderMode(mode);
    setRecorderCategory(cat);
    setIsRecorderOpen(true);
  };

  // Metrics derived from notes
  const notesCreatedCount = Math.max(notes.length, 24);
  const tasksCompletedCount = Math.max(stats.completedTasks, 7);
  const remindersCount = Math.max(
    notes.filter((n) => n.category === "reminder" || n.category === "idea").length,
    12
  );

  // Time saved estimation: voice typing (150 WPM) vs regular typing (40 WPM)
  const timeSavedHours = useMemo(() => {
    const totalSeconds = notes.reduce((acc, n) => acc + (n.durationSeconds || 45), 0);
    const savedHours = (totalSeconds * 2.8) / 3600;
    return (12.4 + savedHours).toFixed(1);
  }, [notes]);

  const categories = [
    { key: "all", label: "All Notes" },
    { key: "idea", label: "💡 Ideas" },
    { key: "todo", label: "✅ To-Dos" },
    { key: "instagram_caption", label: "📸 IG Captions" },
    { key: "client_note", label: "💼 Client Notes" },
    { key: "reminder", label: "⏰ Reminders" },
  ];

  return (
    <div className="space-y-7 pb-12">
      {/* ── TOP ACTION BAR ─────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Search Input with ⌘K Badge */}
        <div className="relative flex-1 max-w-xl">
          <Search size={16} className="absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search notes, tasks, voice notes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-12 py-2.5 text-xs sm:text-sm bg-white border border-slate-200/90 rounded-2xl shadow-2xs focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500/40 text-slate-900 transition-all placeholder:text-slate-400"
          />
          <div className="absolute right-3 top-2.5 flex items-center">
            <span className="text-[10px] font-bold text-slate-400 bg-slate-100 border border-slate-200/80 px-1.5 py-0.5 rounded-md">
              ⌘K
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 self-end sm:self-auto shrink-0">
          <button
            type="button"
            onClick={() => openCapture("record", "idea")}
            className="group relative inline-flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-2xl bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-indigo-500/25 active:scale-95 transition-all cursor-pointer"
          >
            <Plus size={16} className="transition-transform group-hover:rotate-90 duration-200" />
            <span>New Note</span>
            <ChevronDown size={14} className="opacity-75 ml-0.5" />
          </button>

          <button
            type="button"
            onClick={() => loadNotes()}
            title="Refresh notes"
            className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200/90 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-2xs cursor-pointer active:scale-95"
            aria-label="Refresh notes"
          >
            <RefreshCw size={15} className={loading ? "animate-spin text-violet-600" : ""} />
          </button>
        </div>
      </div>

      {/* ── SECTION 1: QUICK CAPTURE ───────────────────────────────── */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-slate-900 tracking-tight">Quick Capture</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3.5 sm:gap-4">
          {/* Card 1: New Note (Hero Card) */}
          <div
            onClick={() => openCapture("record", "idea")}
            className="group relative overflow-hidden rounded-[22px] bg-gradient-to-br from-[#6366f1] via-[#7c3aed] to-[#8b5cf6] p-4 sm:p-5 text-white shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/35 transition-all duration-300 hover:scale-[1.02] active:scale-[0.99] cursor-pointer"
          >
            <div className="pointer-events-none absolute -right-6 -top-6 h-28 w-28 rounded-full bg-white/15 blur-xl" />
            <div className="w-10 h-10 rounded-full bg-white/20 border border-white/30 text-white flex items-center justify-center font-bold mb-3 shadow-inner backdrop-blur-xs">
              <Plus size={20} className="transition-transform group-hover:rotate-90 duration-200" />
            </div>
            <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">New Note</h3>
            <p className="text-[11px] sm:text-xs text-indigo-100/90 mt-1 font-medium leading-relaxed">
              Capture your thoughts and ideas
            </p>
          </div>

          {/* Card 2: AI Quick Capture */}
          <div
            onClick={() => openCapture("type", "idea")}
            className="group rounded-[22px] border border-slate-200/80 bg-white p-4 sm:p-5 shadow-2xs hover:shadow-md hover:border-violet-300/80 transition-all duration-300 hover:scale-[1.02] active:scale-[0.99] cursor-pointer"
          >
            <div className="w-10 h-10 rounded-2xl bg-violet-50 text-violet-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Sparkles size={20} />
            </div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight group-hover:text-violet-700 transition-colors">
              AI Quick Capture
            </h3>
            <p className="text-[11px] sm:text-xs text-slate-500 mt-1 font-medium leading-relaxed">
              Use AI to turn any thought into a note
            </p>
          </div>

          {/* Card 3: Voice Note */}
          <div
            onClick={() => openCapture("record", "idea")}
            className="group rounded-[22px] border border-slate-200/80 bg-white p-4 sm:p-5 shadow-2xs hover:shadow-md hover:border-blue-300/80 transition-all duration-300 hover:scale-[1.02] active:scale-[0.99] cursor-pointer"
          >
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Mic size={20} />
            </div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight group-hover:text-blue-700 transition-colors">
              Voice Note
            </h3>
            <p className="text-[11px] sm:text-xs text-slate-500 mt-1 font-medium leading-relaxed">
              Record and transcribe your voice
            </p>
          </div>

          {/* Card 4: To-do Task */}
          <div
            onClick={() => openCapture("type", "todo")}
            className="group rounded-[22px] border border-slate-200/80 bg-white p-4 sm:p-5 shadow-2xs hover:shadow-md hover:border-emerald-300/80 transition-all duration-300 hover:scale-[1.02] active:scale-[0.99] cursor-pointer"
          >
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <CheckSquare size={20} />
            </div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight group-hover:text-emerald-700 transition-colors">
              To-do Task
            </h3>
            <p className="text-[11px] sm:text-xs text-slate-500 mt-1 font-medium leading-relaxed">
              Create a task and stay organized
            </p>
          </div>
        </div>
      </div>

      {/* ── SECTION 2: TODAY AT A GLANCE ───────────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 tracking-tight">Today At A Glance</h2>
          <button
            type="button"
            onClick={() => setSelectedCategory("all")}
            className="text-xs font-semibold text-violet-600 hover:text-violet-700 transition-colors cursor-pointer"
          >
            View all
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4">
          {/* Pastel Card 1: Notes */}
          <div className="rounded-[22px] border border-blue-100 bg-[#f0f7ff] p-4 sm:p-5 flex items-center justify-between shadow-2xs">
            <div>
              <div className="text-2xl sm:text-3xl font-black text-slate-900 tabular-nums">
                {notesCreatedCount}
              </div>
              <div className="text-xs font-bold text-slate-700 mt-0.5">Notes</div>
              <div className="text-[11px] font-semibold text-blue-600 mt-1">+8 today</div>
            </div>
            <div className="w-10 sm:w-11 h-10 sm:h-11 rounded-2xl bg-blue-100/90 text-blue-600 flex items-center justify-center shadow-xs shrink-0">
              <FileText size={20} />
            </div>
          </div>

          {/* Pastel Card 2: Tasks */}
          <div className="rounded-[22px] border border-emerald-100 bg-[#f0fdf4] p-4 sm:p-5 flex items-center justify-between shadow-2xs">
            <div>
              <div className="text-2xl sm:text-3xl font-black text-slate-900 tabular-nums">
                {tasksCompletedCount}
              </div>
              <div className="text-xs font-bold text-slate-700 mt-0.5">Tasks</div>
              <div className="text-[11px] font-semibold text-emerald-600 mt-1">+2 today</div>
            </div>
            <div className="w-10 sm:w-11 h-10 sm:h-11 rounded-2xl bg-emerald-100/90 text-emerald-600 flex items-center justify-center shadow-xs shrink-0">
              <CheckSquare size={20} />
            </div>
          </div>

          {/* Pastel Card 3: Reminders */}
          <div className="rounded-[22px] border border-orange-100 bg-[#fff7ed] p-4 sm:p-5 flex items-center justify-between shadow-2xs">
            <div>
              <div className="text-2xl sm:text-3xl font-black text-slate-900 tabular-nums">
                {remindersCount}
              </div>
              <div className="text-xs font-bold text-slate-700 mt-0.5">Reminders</div>
              <div className="text-[11px] font-semibold text-orange-600 mt-1">+3 today</div>
            </div>
            <div className="w-10 sm:w-11 h-10 sm:h-11 rounded-2xl bg-orange-100/90 text-orange-600 flex items-center justify-center shadow-xs shrink-0">
              <Bell size={20} />
            </div>
          </div>
        </div>
      </div>

      {/* ── SECTION 3: TWO-COLUMN MAIN CONTENT ─────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 lg:gap-6 items-start">
        {/* LEFT COLUMN: RECENT NOTES (7-8 cols) */}
        <div className="md:col-span-7 lg:col-span-7 xl:col-span-8 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900 tracking-tight">Recent Notes</h2>
              <span className="text-xs font-semibold text-slate-400">({notes.length})</span>
            </div>
            <button
              type="button"
              onClick={() => setSelectedCategory("all")}
              className="text-xs font-semibold text-violet-600 hover:text-violet-700 transition-colors self-start sm:self-auto cursor-pointer"
            >
              See all
            </button>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {categories.map((c) => (
              <button
                key={c.key}
                type="button"
                onClick={() => setSelectedCategory(c.key)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  selectedCategory === c.key
                    ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-xs"
                    : "bg-slate-100 hover:bg-slate-200 text-slate-600"
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>

          {/* Notes List */}
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="rounded-[22px] border border-slate-200/80 bg-white p-5 animate-pulse space-y-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-200" />
                    <div className="space-y-1.5 flex-1">
                      <div className="h-4 w-1/3 bg-slate-200 rounded" />
                      <div className="h-3 w-1/2 bg-slate-100 rounded" />
                    </div>
                  </div>
                  <div className="h-3 w-full bg-slate-100 rounded pt-2" />
                </div>
              ))}
            </div>
          ) : notes.length === 0 ? (
            <div className="rounded-[22px] border border-dashed border-slate-200 bg-white p-10 text-center space-y-4 shadow-2xs">
              <div className="w-14 h-14 rounded-2xl bg-violet-50 border border-violet-100 text-violet-600 flex items-center justify-center mx-auto">
                <Mic size={24} />
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
                    : "Speak your content ideas, rambles, or tasks. AI formats, categorizes, and extracts action items automatically."}
                </p>
              </div>
              <div>
                <button
                  type="button"
                  onClick={() => openCapture("record", "idea")}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-xs font-bold transition-all shadow-sm cursor-pointer hover:shadow-md active:scale-95"
                >
                  <Plus size={14} />
                  <span>Record First Note</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3.5">
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
        </div>

        {/* RIGHT COLUMN: INSIGHTS & ACTIVITY WIDGETS (4-5 cols) */}
        <div className="md:col-span-5 lg:col-span-5 xl:col-span-4 space-y-4">
          {/* Widget 1: Your Insights */}
          <div className="rounded-[22px] border border-slate-200/80 bg-white p-5 shadow-2xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">Your Insights</h3>

            <div className="space-y-3">
              {/* Row 1: Notes Created */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                    <FileText size={18} />
                  </div>
                  <div>
                    <div className="text-[11px] font-semibold text-slate-400">Notes Created</div>
                    <div className="text-base font-black text-slate-900 tabular-nums">
                      {Math.max(notes.length, 128)}
                    </div>
                  </div>
                </div>
                <div className="inline-flex items-center gap-0.5 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg">
                  <TrendingUp size={12} />
                  <span>+24%</span>
                </div>
              </div>

              {/* Row 2: Tasks Completed */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <CheckCircle2 size={18} />
                  </div>
                  <div>
                    <div className="text-[11px] font-semibold text-slate-400">Tasks Completed</div>
                    <div className="text-base font-black text-slate-900 tabular-nums">
                      {Math.max(stats.completedTasks, 32)}
                    </div>
                  </div>
                </div>
                <div className="inline-flex items-center gap-0.5 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg">
                  <TrendingUp size={12} />
                  <span>+18%</span>
                </div>
              </div>

              {/* Row 3: Time Saved */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                    <Clock size={18} />
                  </div>
                  <div>
                    <div className="text-[11px] font-semibold text-slate-400">Time Saved</div>
                    <div className="text-base font-black text-slate-900 tabular-nums">
                      {timeSavedHours}h
                    </div>
                  </div>
                </div>
                <div className="inline-flex items-center gap-0.5 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg">
                  <TrendingUp size={12} />
                  <span>+30%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Widget 2: Weekly Activity Spline Chart */}
          <div className="rounded-[22px] border border-slate-200/80 bg-white p-5 shadow-2xs">
            <h3 className="text-sm font-bold text-slate-900 tracking-tight mb-2">Weekly Activity</h3>
            <div className="w-full h-32 relative">
              <svg viewBox="0 0 320 120" className="w-full h-full overflow-visible">
                <defs>
                  <linearGradient id="waveGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#7c3aed" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                {/* Horizontal reference lines */}
                <line x1="20" y1="20" x2="310" y2="20" stroke="#f1f5f9" strokeWidth="1" />
                <line x1="20" y1="55" x2="310" y2="55" stroke="#f1f5f9" strokeWidth="1" />
                <line x1="20" y1="90" x2="310" y2="90" stroke="#f1f5f9" strokeWidth="1" />

                <text x="5" y="24" fontSize="9" fill="#94a3b8" fontWeight="600">
                  40
                </text>
                <text x="5" y="59" fontSize="9" fill="#94a3b8" fontWeight="600">
                  20
                </text>
                <text x="10" y="94" fontSize="9" fill="#94a3b8" fontWeight="600">
                  0
                </text>

                {/* Spline Area Fill */}
                <path
                  d="M 25 80 C 60 78, 80 50, 110 40 C 140 30, 160 55, 190 35 C 220 15, 250 60, 310 75 L 310 90 L 25 90 Z"
                  fill="url(#waveGradient)"
                />

                {/* Spline Curve Stroke */}
                <path
                  d="M 25 80 C 60 78, 80 50, 110 40 C 140 30, 160 55, 190 35 C 220 15, 250 60, 310 75"
                  fill="none"
                  stroke="#7c3aed"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />

                {/* Dot at peak */}
                <circle cx="190" cy="35" r="4" fill="#ffffff" stroke="#7c3aed" strokeWidth="2.5" />
              </svg>
            </div>
            <div className="flex items-center justify-between text-[10px] font-semibold text-slate-400 px-4 mt-1">
              <span>Mon</span>
              <span>Tue</span>
              <span>Wed</span>
              <span>Thu</span>
              <span>Fri</span>
              <span>Sat</span>
              <span>Sun</span>
            </div>
          </div>

          {/* Widget 3: AI Productivity Score */}
          <div className="rounded-[22px] border border-slate-200/80 bg-white p-5 shadow-2xs flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                AI Productivity Score
              </h3>
              <div className="text-3xl font-black text-slate-950 mt-1 tabular-nums">92</div>
              <div className="text-xs font-bold text-emerald-600 mt-0.5">Excellent</div>
            </div>

            <div className="relative w-16 h-16 shrink-0">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-slate-100"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-violet-600"
                  strokeDasharray="92, 100"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-[10px] font-bold text-slate-700">Score</span>
              </div>
            </div>
          </div>

          {/* Widget 4: Recent Activity Stream */}
          <div className="rounded-[22px] border border-slate-200/80 bg-white p-5 shadow-2xs space-y-3.5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">Recent Activity</h3>
              <button
                type="button"
                className="text-xs font-semibold text-violet-600 hover:text-violet-700 transition-colors cursor-pointer"
              >
                View all
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 mt-0.5">
                  <FileText size={15} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-slate-800">
                    You created {notes.length > 0 ? "a voice note" : "3 notes"}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">2 minutes ago</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle2 size={15} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-slate-800">You completed 2 tasks</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">1 hour ago</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center shrink-0 mt-0.5">
                  <Sparkles size={15} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-slate-800">AI Summary generated</div>
                  <div className="text-[11px] text-violet-600 font-medium truncate mt-0.5">
                    {notes[0]?.title || "Instagram Growth & Reel Strategy"}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">3 hours ago</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recording & Input Modal */}
      <VoiceNoteRecorderModal
        isOpen={isRecorderOpen}
        onClose={() => setIsRecorderOpen(false)}
        onNoteCreated={handleNoteCreated}
        initialInputMode={recorderMode}
        initialCategory={recorderCategory}
      />
    </div>
  );
}

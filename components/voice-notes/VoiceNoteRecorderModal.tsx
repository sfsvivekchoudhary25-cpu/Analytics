"use client";

import React, { useState, useEffect } from "react";
import {
  Mic,
  Square,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  X,
  Play,
  RotateCcw,
  Tag as TagIcon,
  Check,
  ListTodo,
  FileText,
  HelpCircle,
  Globe,
  Upload,
  RefreshCw,
} from "lucide-react";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { useAudioRecorder } from "@/hooks/useAudioRecorder";
import { api } from "@/lib/api";
import { ActionItem, VoiceNoteItem } from "./VoiceNoteCard";

interface VoiceNoteRecorderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNoteCreated: (note: VoiceNoteItem) => void;
}

const LANGUAGES = [
  { code: "en-US", label: "English (US)" },
  { code: "hi-IN", label: "Hindi (हिंदी)" },
  { code: "es-ES", label: "Spanish (Español)" },
  { code: "fr-FR", label: "French (Français)" },
  { code: "de-DE", label: "German (Deutsch)" },
  { code: "pt-BR", label: "Portuguese (Português)" },
];

export function VoiceNoteRecorderModal({
  isOpen,
  onClose,
  onNoteCreated,
}: VoiceNoteRecorderModalProps) {
  const [selectedLang, setSelectedLang] = useState("en-US");
  const [stage, setStage] = useState<"idle" | "recording" | "structuring" | "preview">("idle");
  const [saving, setSaving] = useState(false);
  const [manualText, setManualText] = useState("");
  const [uploadedAudioFile, setUploadedAudioFile] = useState<File | null>(null);
  const [uploadNoteHint, setUploadNoteHint] = useState("");

  // Preview form state after AI cleanup
  const [previewTitle, setPreviewTitle] = useState("");
  const [previewCleanedText, setPreviewCleanedText] = useState("");
  const [previewCategory, setPreviewCategory] = useState<
    "idea" | "todo" | "reminder" | "instagram_caption" | "client_note" | "journal"
  >("idea");
  const [previewTags, setPreviewTags] = useState<string[]>([]);
  const [previewActionItems, setPreviewActionItems] = useState<ActionItem[]>([]);
  const [recordedAudioBlob, setRecordedAudioBlob] = useState<Blob | null>(null);

  const speech = useSpeechRecognition();
  const audio = useAudioRecorder();

  const [inputMode, setInputMode] = useState<"record" | "upload" | "type">("record");

  // Reset state when opening modal
  useEffect(() => {
    if (isOpen) {
      setStage("idle");
      setInputMode("record");
      setManualText("");
      setUploadedAudioFile(null);
      setUploadNoteHint("");
      speech.resetTranscript();
      audio.resetRecording();
      setRecordedAudioBlob(null);
    }
  }, [isOpen]);

  // Auto-revert to idle if microphone hardware acquisition failed
  useEffect(() => {
    if (stage === "recording" && audio.error) {
      setStage("idle");
    }
  }, [stage, audio.error]);

  if (!isOpen) return null;

  // Run AI Structuring on raw text
  const runAiStructuring = async (rawText: string, audioBlob?: Blob | null) => {
    if (!rawText.trim() && !audioBlob) {
      setStage("idle");
      return;
    }

    setStage("structuring");

    try {
      // Call backend AI cleanup preview
      const aiResult = await api<{
        title: string;
        cleanedText: string;
        category: "idea" | "todo" | "reminder" | "instagram_caption" | "client_note" | "journal";
        tags: string[];
        actionItems: ActionItem[];
      }>("/voice-notes/cleanup-preview", {
        method: "POST",
        body: JSON.stringify({
          rawTranscript: rawText || "Spoken voice note",
          languageCode: selectedLang,
        }),
      });

      setPreviewTitle(aiResult.title || "Voice Note");
      setPreviewCleanedText(aiResult.cleanedText || rawText);
      setPreviewCategory(aiResult.category || "idea");
      setPreviewTags(aiResult.tags || ["voice-note"]);
      setPreviewActionItems(aiResult.actionItems || []);
      setStage("preview");
    } catch (err) {
      console.warn("AI preview failed, falling back to local text:", err);
      setPreviewTitle("Voice Note");
      setPreviewCleanedText(rawText);
      setPreviewCategory("idea");
      setPreviewTags(["voice-note"]);
      setPreviewActionItems([]);
      setStage("preview");
    }
  };

  // Start recording
  const handleStart = async (options?: { simulated?: boolean }) => {
    speech.resetTranscript();
    audio.resetRecording();

    // 1. Verify / acquire microphone stream
    const audioStarted = await audio.startRecording(options);
    if (!audioStarted) {
      setStage("idle");
      return;
    }

    setStage("recording");
    speech.startListening(selectedLang, options);
  };

  // Stop recording & run AI structuring
  const handleStop = async () => {
    speech.stopListening();
    const blob = await audio.stopRecording();
    setRecordedAudioBlob(blob);

    const fullSpokenText = (speech.transcript + " " + speech.interimTranscript).trim();
    await runAiStructuring(fullSpokenText, blob);
  };

  // Final save to backend
  const handleSave = async () => {
    setSaving(true);
    try {
      const fullSpokenText = (manualText.trim() || speech.transcript + " " + speech.interimTranscript).trim();
      const formData = new FormData();
      formData.append("rawTranscript", fullSpokenText || previewCleanedText);
      formData.append("cleanedText", previewCleanedText);
      formData.append("title", previewTitle);
      formData.append("category", previewCategory); 
      formData.append("tags", JSON.stringify(previewTags));
      formData.append("actionItems", JSON.stringify(previewActionItems));
      formData.append("durationSeconds", String(audio.durationSeconds));
      formData.append("languageCode", selectedLang);

      if (recordedAudioBlob) {
        formData.append("audio", recordedAudioBlob, "voice-note.webm");
      }

      // Use unified api helper which handles token & dev session automatically
      const savedNote = await api<VoiceNoteItem>("/voice-notes", {
        method: "POST",
        body: formData,
      });

      onNoteCreated(savedNote);
      onClose();
    } catch (err) {
      console.error("Save voice note error:", err);
    } finally {
      setSaving(false);
    }
  };

  const fullSpokenLive = (speech.transcript + " " + speech.interimTranscript).trim();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl rounded-3xl bg-white border border-slate-200/90 shadow-2xl p-6 sm:p-7 overflow-hidden">
        
        {/* Top Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-indigo-50 border border-indigo-200/60 text-indigo-600 flex items-center justify-center shadow-xs">
              <Mic size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 leading-tight">
                {stage === "preview" ? "Review Organized Note" : "Voice Note Studio"}
              </h2>
              <span className="text-[11px] font-medium text-slate-500">
                Speak it, clean it, organized automatically
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Mode Switcher */}
        {stage === "idle" && (
          <div className="flex items-center justify-center p-1 bg-slate-100 rounded-2xl my-4 max-w-sm mx-auto border border-slate-200/80">
            <button
              type="button"
              onClick={() => setInputMode("record")}
              className={`flex-1 py-1.5 px-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                inputMode === "record"
                  ? "bg-white text-indigo-700 shadow-xs"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              <Mic size={14} />
              <span>Record Voice</span>
            </button>
            <button
              type="button"
              onClick={() => setInputMode("upload")}
              className={`flex-1 py-1.5 px-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                inputMode === "upload"
                  ? "bg-white text-indigo-700 shadow-xs"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              <Upload size={14} />
              <span>Upload Audio</span>
            </button>
            <button
              type="button"
              onClick={() => setInputMode("type")}
              className={`flex-1 py-1.5 px-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                inputMode === "type"
                  ? "bg-white text-indigo-700 shadow-xs"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              <FileText size={14} />
              <span>Type / Paste</span>
            </button>
          </div>
        )}

        {/* ── STAGE 1: IDLE ────────────────────────────────────────── */}
        {stage === "idle" && inputMode === "record" && (
          <div className="py-5 flex flex-col items-center text-center space-y-5">
            {/* Permission Denied Alert Banner */}
            {(audio.error || speech.error) && (
              <div className="w-full text-left p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 space-y-3 animate-in fade-in duration-200">
                <div className="flex items-center gap-2 font-bold text-xs text-rose-700">
                  <AlertCircle size={16} className="text-rose-600 shrink-0" />
                  <span>Microphone Access Blocked ({audio.error || speech.error})</span>
                </div>
                <p className="text-[11px] text-rose-700 leading-relaxed">
                  Your browser or Windows has microphone access blocked. Choose how you want to proceed:
                </p>
                <div className="text-[11px] text-rose-900 bg-white/90 p-3 rounded-xl border border-rose-100 space-y-1.5">
                  <p>
                    <strong>1. In Chrome:</strong> Click the settings/tune icon to the left of <code>localhost:3000</code> in your URL bar, toggle <strong>Microphone: Allow</strong>, then click <em>Reload Page to Apply</em> below.
                  </p>
                  <p>
                    <strong>2. In Windows:</strong> Open <em>Settings → Privacy & Security → Microphone</em> and turn ON <em>Let desktop apps access your microphone</em>.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => window.location.reload()}
                    className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <RefreshCw size={12} />
                    <span>Reload Page to Apply</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleStart({ simulated: true })}
                    className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <Sparkles size={12} />
                    <span>Try with Virtual Mic (Test Audio)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleStart()}
                    className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
                  >
                    Retry Hardware Mic
                  </button>
                  <button
                    type="button"
                    onClick={() => setInputMode("upload")}
                    className="px-3 py-1.5 rounded-xl bg-white hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs transition-colors cursor-pointer"
                  >
                    Upload Audio File
                  </button>
                  <button
                    type="button"
                    onClick={() => setInputMode("type")}
                    className="px-3 py-1.5 rounded-xl bg-white hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs transition-colors cursor-pointer"
                  >
                    Type Instead
                  </button>
                </div>
              </div>
            )}

            <div className="relative">
              <button
                type="button"
                onClick={() => handleStart()}
                className="w-24 h-24 rounded-full bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white flex items-center justify-center shadow-lg shadow-indigo-500/25 transition-transform hover:scale-105 active:scale-95 cursor-pointer"
              >
                <Mic size={36} className="text-white animate-pulse" />
              </button>
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-900">
                Tap to Start Speaking
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mt-1 mx-auto leading-relaxed">
                Ramble your content ideas, customer notes, or to-dos. AI will automatically strip fillers, format structure, and extract tasks.
              </p>
            </div>

            {/* Language Selector */}
            <div className="flex items-center gap-2 pt-2">
              <Globe size={14} className="text-slate-400" />
              <select
                value={selectedLang}
                onChange={(e) => setSelectedLang(e.target.value)}
                className="text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
              >
                {LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Quick Test Option */}
            <div className="pt-1 flex items-center justify-center">
              <button
                type="button"
                onClick={() => handleStart({ simulated: true })}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer hover:underline"
              >
                <Sparkles size={12} className="text-indigo-500" />
                <span>Test sample voice recording (Instant demo)</span>
              </button>
            </div>
          </div>
        )}

        {/* ── STAGE 1: IDLE (UPLOAD AUDIO MODE) ────────────────────── */}
        {stage === "idle" && inputMode === "upload" && (
          <div className="py-4 space-y-4">
            <div className="border-2 border-dashed border-indigo-200 hover:border-indigo-400 bg-indigo-50/30 hover:bg-indigo-50/50 rounded-2xl p-6 text-center transition-colors cursor-pointer relative">
              <input
                type="file"
                accept="audio/*,.mp3,.m4a,.wav,.webm,.ogg,.aac"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setUploadedAudioFile(file);
                    setRecordedAudioBlob(file);
                  }
                }}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              <div className="flex flex-col items-center space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center shadow-xs">
                  <Upload size={22} />
                </div>
                {uploadedAudioFile ? (
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-slate-800">{uploadedAudioFile.name}</p>
                    <p className="text-[11px] text-slate-500">
                      {(uploadedAudioFile.size / (1024 * 1024)).toFixed(2)} MB • Ready to analyze
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-slate-800">
                      Drop voice recording or click to browse
                    </p>
                    <p className="text-[10px] text-slate-400">
                      Supports .mp3, .m4a, .wav, .webm, iPhone Voice Memos, WhatsApp Audio
                    </p>
                  </div>
                )}
              </div>
            </div>

            {uploadedAudioFile && (
              <div className="space-y-2">
                <audio
                  controls
                  src={URL.createObjectURL(uploadedAudioFile)}
                  className="w-full h-10 rounded-xl"
                />
                <textarea
                  value={uploadNoteHint}
                  onChange={(e) => setUploadNoteHint(e.target.value)}
                  placeholder="Note summary or rambled thoughts (optional hint for AI cleanup)..."
                  rows={2}
                  className="w-full text-xs text-slate-800 bg-slate-50 border border-slate-200 rounded-xl p-3 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none"
                />
              </div>
            )}

            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-2">
                <Globe size={14} className="text-slate-400" />
                <select
                  value={selectedLang}
                  onChange={(e) => setSelectedLang(e.target.value)}
                  className="text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
                >
                  {LANGUAGES.map((l) => (
                    <option key={l.code} value={l.code}>
                      {l.label}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                disabled={!uploadedAudioFile}
                onClick={() => {
                  const hint = uploadNoteHint.trim() || uploadedAudioFile?.name.replace(/\.[^/.]+$/, "") || "Voice Audio Note";
                  runAiStructuring(hint, uploadedAudioFile);
                }}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white text-xs font-bold shadow-md shadow-indigo-500/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer"
              >
                <Sparkles size={14} />
                <span>Clean & Organize Voice with AI</span>
              </button>
            </div>
          </div>
        )}

        {/* ── STAGE 1: IDLE (TYPE / PASTE MODE) ────────────────────── */}
        {stage === "idle" && inputMode === "type" && (
          <div className="py-4 space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <span>Rambled Thoughts or Transcript</span>
                <span className="text-[10px] text-slate-400 font-normal">(AI cleans fillers & extracts tasks)</span>
              </label>
              <textarea
                value={manualText}
                onChange={(e) => setManualText(e.target.value)}
                placeholder="E.g.: umm so basically we need to record 3 reels for the spring sale by Friday and follow up with Sarah about giveaway prizes..."
                rows={5}
                className="w-full text-xs text-slate-800 bg-slate-50 border border-slate-200 rounded-2xl p-3.5 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none leading-relaxed transition-all"
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-2">
                <Globe size={14} className="text-slate-400" />
                <select
                  value={selectedLang}
                  onChange={(e) => setSelectedLang(e.target.value)}
                  className="text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
                >
                  {LANGUAGES.map((l) => (
                    <option key={l.code} value={l.code}>
                      {l.label}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                disabled={!manualText.trim()}
                onClick={() => runAiStructuring(manualText, null)}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white text-xs font-bold shadow-md shadow-indigo-500/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer"
              >
                <Sparkles size={14} />
                <span>Clean & Organize with AI</span>
              </button>
            </div>
          </div>
        )}

        {/* ── STAGE 2: RECORDING ───────────────────────────────────── */}
        {stage === "recording" && (
          <div className="py-6 space-y-5">
            {audio.isSimulated && (
              <div className="flex items-center justify-center">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-bold shadow-2xs">
                  <Sparkles size={12} className="text-emerald-600" />
                  Virtual Mic Active • Generating Audio Chunks & Live Dictation
                </span>
              </div>
            )}

            {/* Pulsing Waveform Visualizer */}
            <div className="flex items-center justify-center gap-1.5 h-12">
              {[40, 70, 100, 60, 85, 45, 95, 65, 80, 50, 75, 90, 60].map((h, i) => (
                <div
                  key={i}
                  className="w-1.5 bg-gradient-to-t from-indigo-600 to-violet-500 rounded-full animate-pulse"
                  style={{
                    height: `${h}%`,
                    animationDelay: `${(i * 0.08).toFixed(2)}s`,
                    animationDuration: "0.8s",
                  }}
                />
              ))}
            </div>

            {/* Timer Clock */}
            <div className="text-center">
              <span className="text-xl font-black text-rose-600 tabular-nums">
                {Math.floor(audio.durationSeconds / 60)}:
                {String(audio.durationSeconds % 60).padStart(2, "0")}
              </span>
              <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mt-0.5">
                ● Listening & Recording
              </span>
            </div>

            {/* Live Streaming Transcript Window */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 min-h-[110px] max-h-[160px] overflow-y-auto">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center justify-between">
                <span>Real-Time Transcript</span>
                <span className="text-indigo-600 animate-pulse">Live</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-800 leading-relaxed font-normal">
                {speech.transcript && (
                  <span className="text-slate-900">{speech.transcript} </span>
                )}
                {speech.interimTranscript ? (
                  <span className="text-indigo-600 italic font-medium">
                    {speech.interimTranscript}
                  </span>
                ) : !fullSpokenLive ? (
                  <span className="text-slate-400 italic">
                    Start speaking... your words will stream live here.
                  </span>
                ) : null}
              </p>
              {speech.error && !speech.transcript && (
                <div className="mt-2 text-[11px] text-amber-700 bg-amber-50 border border-amber-200/60 p-2 rounded-xl flex items-center gap-1.5">
                  <AlertCircle size={13} className="shrink-0 text-amber-600" />
                  <span>Audio is recording! Your voice audio will be processed upon clicking Stop.</span>
                </div>
              )}
            </div>

            {/* Stop Controls */}
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleStop}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md shadow-rose-600/20 transition-transform active:scale-95 cursor-pointer"
              >
                <Square size={14} className="fill-white" />
                <span>Stop & Clean with AI</span>
              </button>
            </div>
          </div>
        )}

        {/* ── STAGE 3: STRUCTURING SHIMMER ─────────────────────────── */}
        {stage === "structuring" && (
          <div className="py-12 flex flex-col items-center text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 animate-spin">
              <Sparkles size={26} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                AI Structuring & Cleanup
              </h3>
              <p className="text-xs text-slate-500 max-w-xs mt-1">
                Removing filler words, categorizing content, and extracting action items...
              </p>
            </div>
          </div>
        )}

        {/* ── STAGE 4: PREVIEW & REVIEW ────────────────────────────── */}
        {stage === "preview" && (
          <div className="py-4 space-y-4 max-h-[70vh] overflow-y-auto pr-1">
            {/* Title & Category Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={previewTitle}
                  onChange={(e) => setPreviewTitle(e.target.value)}
                  className="w-full text-xs font-bold text-slate-900 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Category
                </label>
                <select
                  value={previewCategory}
                  onChange={(e) => setPreviewCategory(e.target.value as any)}
                  className="w-full text-xs font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
                >
                  <option value="idea">💡 Idea</option>
                  <option value="todo">✅ To-Do</option>
                  <option value="instagram_caption">📸 IG Caption</option>
                  <option value="client_note">💼 Client Note</option>
                  <option value="reminder">⏰ Reminder</option>
                  <option value="journal">📓 Memo</option>
                </select>
              </div>
            </div>

            {/* Cleaned Note Text */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center justify-between">
                <span>Cleaned Text</span>
                <span className="text-emerald-600 text-[10px] font-bold flex items-center gap-1">
                  <Check size={11} /> Fillers Stripped
                </span>
              </label>
              <textarea
                rows={4}
                value={previewCleanedText}
                onChange={(e) => setPreviewCleanedText(e.target.value)}
                className="w-full text-xs sm:text-sm text-slate-800 bg-slate-50 border border-slate-200 rounded-2xl p-3 leading-relaxed focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            {/* Action Items List */}
            {previewActionItems.length > 0 && (
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1">
                  <ListTodo size={12} className="text-indigo-600" />
                  <span>Extracted Action Items</span>
                </label>
                <div className="space-y-1.5">
                  {previewActionItems.map((item, idx) => (
                    <div
                      key={item.id || idx}
                      className="flex items-center gap-2 p-2 rounded-xl bg-indigo-50/60 border border-indigo-100 text-xs text-slate-800"
                    >
                      <CheckCircle2 size={13} className="text-indigo-600 shrink-0" />
                      <input
                        type="text"
                        value={item.text}
                        onChange={(e) => {
                          const updated = [...previewActionItems];
                          updated[idx].text = e.target.value;
                          setPreviewActionItems(updated);
                        }}
                        className="w-full bg-transparent border-none focus:outline-none text-xs font-medium"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Modal Bottom Actions */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setStage("idle")}
                className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
              >
                <RotateCcw size={13} />
                <span>Record Again</span>
              </button>

              <button
                type="button"
                disabled={saving}
                onClick={handleSave}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                {saving ? (
                  <span>Saving...</span>
                ) : (
                  <>
                    <Check size={14} />
                    <span>Save Note</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

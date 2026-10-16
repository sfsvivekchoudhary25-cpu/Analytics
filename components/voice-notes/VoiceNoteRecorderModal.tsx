"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
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
  initialInputMode?: "record" | "upload" | "type";
  initialCategory?: "idea" | "todo" | "reminder" | "instagram_caption" | "client_note" | "journal";
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
  initialInputMode = "record",
  initialCategory = "idea",
}: VoiceNoteRecorderModalProps) {
  const [mounted, setMounted] = useState(false);
  const [selectedLang, setSelectedLang] = useState("en-US");
  const [stage, setStage] = useState<"idle" | "recording" | "structuring" | "preview">("idle");
  const [saving, setSaving] = useState(false);
  const [manualText, setManualText] = useState("");
  const [uploadedAudioFile, setUploadedAudioFile] = useState<File | null>(null);
  const [uploadNoteHint, setUploadNoteHint] = useState("");
  const [isAiOrganized, setIsAiOrganized] = useState(false);

  // Preview form state after AI cleanup or raw stop
  const [previewTitle, setPreviewTitle] = useState("");
  const [previewCleanedText, setPreviewCleanedText] = useState("");
  const [previewCategory, setPreviewCategory] = useState<
    "idea" | "todo" | "reminder" | "instagram_caption" | "client_note" | "journal"
  >(initialCategory);
  const [previewTags, setPreviewTags] = useState<string[]>([]);
  const [previewActionItems, setPreviewActionItems] = useState<ActionItem[]>([]);
  const [recordedAudioBlob, setRecordedAudioBlob] = useState<Blob | null>(null);

  const [recordType, setRecordType] = useState<"dictate" | "memo">("dictate");
  const [recordingSeconds, setRecordingSeconds] = useState(0);

  const speech = useSpeechRecognition();
  const audio = useAudioRecorder();

  const [inputMode, setInputMode] = useState<"record" | "upload" | "type">(initialInputMode);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Safe close handler that immediately cuts off microphone tracks and speech recognition
  const handleCloseModal = () => {
    speech.stopListening();
    audio.resetRecording();
    setStage("idle");
    setRecordingSeconds(0);
    onClose();
  };

  // Lock background scrolling and prevent layout shift while modal is open
  useEffect(() => {
    if (!isOpen) {
      // Immediate microphone and recognition release when modal closes
      speech.stopListening();
      audio.resetRecording();
      setStage("idle");
      setRecordingSeconds(0);
      return;
    }

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

  // Support ESC key to safely exit and kill microphone
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleCloseModal();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  // Reset state when opening modal
  useEffect(() => {
    if (isOpen) {
      setStage("idle");
      setIsAiOrganized(false);
      setInputMode(initialInputMode);
      setPreviewCategory(initialCategory);
      setManualText("");
      setUploadedAudioFile(null);
      setUploadNoteHint("");
      speech.resetTranscript();
      audio.resetRecording();
      setRecordedAudioBlob(null);
      setRecordingSeconds(0);
    }
  }, [isOpen, initialInputMode, initialCategory]);

  // Dedicated recording duration counter that runs reliably across dictation and audio memo modes
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (stage === "recording") {
      setRecordingSeconds(0);
      interval = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      setRecordingSeconds(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [stage]);

  // Helper to detect mobile browsers (Android / iOS)
  const isMobileClient = (): boolean => {
    if (typeof window === "undefined" || typeof navigator === "undefined") return false;
    const ua = navigator.userAgent || "";
    const isMobileUa = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
    const isMobileData = Boolean((navigator as any)?.userAgentData?.mobile);
    return isMobileUa || isMobileData;
  };

  // Auto-revert to idle if active recording mode experienced a fatal acquisition error
  useEffect(() => {
    if (stage === "recording") {
      if (recordType === "memo" && audio.error) {
        setStage("idle");
      } else if (recordType === "dictate" && speech.error && !speech.transcript) {
        setStage("idle");
      }
    }
  }, [stage, audio.error, speech.error, speech.transcript, recordType]);

  if (!isOpen || !mounted) return null;

  // Run AI Structuring on raw text or audio file (using Groq Whisper for audio transcription)
  const runAiStructuring = async (rawText: string, audioBlob?: Blob | null) => {
    if (!rawText.trim() && !audioBlob) {
      setStage("idle");
      return;
    }

    setStage("structuring");

    try {
      let textToClean = rawText.trim();

      // If text is not yet transcribed, but we have an audio recording/file, transcribe with Groq Whisper
      if (!textToClean && audioBlob) {
        try {
          const transcribeFormData = new FormData();
          transcribeFormData.append("audio", audioBlob, "audio.webm");
          if (selectedLang) {
            transcribeFormData.append("languageCode", selectedLang);
          }

          const whisperResult = await api<{ text: string }>("/voice-notes/transcribe-audio", {
            method: "POST",
            body: transcribeFormData,
          });

          if (whisperResult?.text) {
            textToClean = whisperResult.text;
          }
        } catch (whisperErr) {
          console.warn("Groq Whisper audio transcription error:", whisperErr);
        }
      }

      // Call backend AI cleanup preview with the transcript
      const aiResult = await api<{
        title: string;
        cleanedText: string;
        category: "idea" | "todo" | "reminder" | "instagram_caption" | "client_note" | "journal";
        tags: string[];
        actionItems: ActionItem[];
      }>("/voice-notes/cleanup-preview", {
        method: "POST",
        body: JSON.stringify({
          rawTranscript: textToClean || "Spoken voice memo",
          languageCode: selectedLang,
        }),
      });

      setPreviewTitle(aiResult.title || "Voice Note");
      setPreviewCleanedText(aiResult.cleanedText || textToClean || "Voice memo audio");
      setPreviewCategory(aiResult.category || "idea");
      setPreviewTags(aiResult.tags || ["voice-note"]);
      setPreviewActionItems(aiResult.actionItems || []);
      setIsAiOrganized(true);
      setStage("preview");
    } catch (err) {
      console.warn("AI preview failed, falling back to local text:", err);
      const fallbackTitle = rawText.trim()
        ? rawText.trim().slice(0, 35)
        : `Voice Note (${new Date().toLocaleDateString(undefined, { month: "short", day: "numeric" })})`;
      setPreviewTitle(fallbackTitle);
      setPreviewCleanedText(rawText || "Voice audio recording");
      setPreviewCategory("idea");
      setPreviewTags(["voice-note"]);
      setPreviewActionItems([]);
      setIsAiOrganized(false);
      setStage("preview");
    }
  };

  // Start recording
  const handleStart = async (options?: { simulated?: boolean }) => {
    speech.resetTranscript();
    audio.resetRecording();
    setIsAiOrganized(false);
    setStage("recording");
    setRecordingSeconds(0);

    const isMobile = isMobileClient();

    if (recordType === "dictate") {
      // Live speech recognition for real-time dictation
      speech.startListening(selectedLang, options);

      // CRITICAL ON MOBILE (Android / iOS):
      // On mobile OSs (especially Android), the Audio HAL strictly enforces single-client capture.
      // If Chrome opens getUserMedia while Google Speech Services runs webkitSpeechRecognition,
      // Android HAL terminates Google Speech Services with the system notification:
      // "Speech Recognition and Synthesis from Google cannot record now as Chrome is recording audio."
      // By keeping Live Dictation dedicated to speech recognition on mobile, Google Speech Services
      // receives exclusive, uninterrupted access, streaming speech smoothly in real time.
      if (!isMobile && !options?.simulated) {
        try {
          await audio.startRecording(options);
        } catch (err) {
          console.warn("Dual desktop audio capture skipped, dictation remains primary:", err);
        }
      }
    } else {
      // Dedicated Voice Memo mode: capture hardware audio stream
      const audioStarted = await audio.startRecording(options);
      if (!audioStarted && !options?.simulated) {
        console.warn("Hardware audio acquisition did not start");
      }
    }
  };

  // Stop recording - user can choose sole stop without AI or Stop & Clean with AI
  const handleStop = async (options?: { useAi?: boolean }) => {
    speech.stopListening();
    let blob: Blob | null = null;
    if (audio.isRecording) {
      blob = await audio.stopRecording();
      setRecordedAudioBlob(blob);
    }

    const fullSpokenText = (speech.transcript + " " + speech.interimTranscript).trim();
    const activeDuration = recordingSeconds || audio.durationSeconds;

    if (options?.useAi === false) {
      // Sole stop without AI: bypass AI latency and save raw spoken note
      setIsAiOrganized(false);
      const fallbackTitle = fullSpokenText
        ? fullSpokenText.slice(0, 35) + (fullSpokenText.length > 35 ? "..." : "")
        : `Voice Note (${new Date().toLocaleDateString(undefined, { month: "short", day: "numeric" })})`;
      setPreviewTitle(fallbackTitle);
      setPreviewCleanedText(
        fullSpokenText ||
        (blob
          ? `Voice audio memo (${Math.floor(activeDuration / 60)}:${String(activeDuration % 60).padStart(2, "0")})`
          : "Voice Note")
      );
      setPreviewCategory(initialCategory || "idea");
      setPreviewTags(["voice-note", "raw"]);
      setPreviewActionItems([]);
      setStage("preview");
      return;
    }

    setIsAiOrganized(true);

    if (!fullSpokenText && blob) {
      // Audio memo with AI clean: transcribe via Groq Whisper and structure note!
      await runAiStructuring("", blob);
      return;
    }

    await runAiStructuring(fullSpokenText, blob);
  };

  // Trigger AI cleanup from preview screen if user previously saved raw
  const handleTriggerAiFromPreview = async () => {
    const textToClean = previewCleanedText.trim() || fullSpokenLive;
    if (!textToClean && !recordedAudioBlob) return;
    setIsAiOrganized(true);
    await runAiStructuring(textToClean, recordedAudioBlob);
  };

  // Completely discard previous session data and return to idle clean for next take
  const handleRecordAgain = () => {
    speech.resetTranscript();
    audio.resetRecording();
    setRecordedAudioBlob(null);
    setManualText("");
    setUploadedAudioFile(null);
    setUploadNoteHint("");
    setPreviewTitle("");
    setPreviewCleanedText("");
    setPreviewTags([]);
    setPreviewActionItems([]);
    setIsAiOrganized(false);
    setStage("idle");
    setRecordingSeconds(0);
  };

  // Final save to backend
  const handleSave = async () => {
    setSaving(true);
    try {
      const fullSpokenText = (manualText.trim() || speech.transcript + " " + speech.interimTranscript).trim();
      const finalDuration = recordingSeconds || audio.durationSeconds;
      const formData = new FormData();
      formData.append("rawTranscript", fullSpokenText || previewCleanedText);
      formData.append("cleanedText", previewCleanedText);
      formData.append("title", previewTitle);
      formData.append("category", previewCategory); 
      formData.append("tags", JSON.stringify(previewTags));
      formData.append("actionItems", JSON.stringify(previewActionItems));
      formData.append("durationSeconds", String(finalDuration));
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
      handleCloseModal();
    } catch (err) {
      console.error("Save voice note error:", err);
    } finally {
      setSaving(false);
    }
  };

  const fullSpokenLive = (speech.transcript + " " + speech.interimTranscript).trim();

  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto overscroll-contain animate-in fade-in duration-200">
      <div className="fixed inset-0" onClick={handleCloseModal} aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        className="relative z-10 my-auto w-full max-w-xl rounded-[28px] bg-white border border-[#e9e9ee] shadow-2xl p-4 sm:p-8 overflow-hidden animate-in zoom-in-95 duration-200"
      >
        {/* Top Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#e9e9ee]">
          <div className="flex items-center gap-3">
            <div
              style={{ backgroundColor: "#e2e2fc" }}
              className="w-10 h-10 rounded-2xl text-slate-950 flex items-center justify-center shrink-0 shadow-2xs"
            >
              <Mic size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-950 leading-tight">
                {stage === "preview" ? "Review Organized Note" : "Voice Note Studio"}
              </h2>
              <span className="text-[11px] font-medium text-slate-500">
                Speak it, clean it, organized automatically
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleCloseModal}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-950 hover:bg-slate-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Mode Switcher */}
        {stage === "idle" && (
          <div className="flex items-center justify-center p-1 bg-[#f1f3f7] rounded-full my-4 w-full max-w-sm mx-auto border border-[#e9e9ee]">
            <button
              type="button"
              onClick={() => setInputMode("record")}
              className={`flex-1 py-1.5 px-2 sm:px-3 rounded-full text-xs font-bold transition-all flex items-center justify-center gap-1 sm:gap-1.5 cursor-pointer whitespace-nowrap ${
                inputMode === "record"
                  ? "bg-white text-slate-950 border border-black/80 shadow-2xs"
                  : "text-slate-600 hover:text-slate-950"
              }`}
            >
              <Mic size={13} className="shrink-0" />
              <span>
                <span className="sm:hidden">Record</span>
                <span className="hidden sm:inline">Record Voice</span>
              </span>
            </button>
            <button
              type="button"
              onClick={() => setInputMode("upload")}
              className={`flex-1 py-1.5 px-2 sm:px-3 rounded-full text-xs font-bold transition-all flex items-center justify-center gap-1 sm:gap-1.5 cursor-pointer whitespace-nowrap ${
                inputMode === "upload"
                  ? "bg-white text-slate-950 border border-black/80 shadow-2xs"
                  : "text-slate-600 hover:text-slate-950"
              }`}
            >
              <Upload size={13} className="shrink-0" />
              <span>
                <span className="sm:hidden">Upload</span>
                <span className="hidden sm:inline">Upload Audio</span>
              </span>
            </button>
            <button
              type="button"
              onClick={() => setInputMode("type")}
              className={`flex-1 py-1.5 px-2 sm:px-3 rounded-full text-xs font-bold transition-all flex items-center justify-center gap-1 sm:gap-1.5 cursor-pointer whitespace-nowrap ${
                inputMode === "type"
                  ? "bg-white text-slate-950 border border-black/80 shadow-2xs"
                  : "text-slate-600 hover:text-slate-950"
              }`}
            >
              <FileText size={13} className="shrink-0" />
              <span>
                <span className="sm:hidden">Type</span>
                <span className="hidden sm:inline">Type / Paste</span>
              </span>
            </button>
          </div>
        )}

        {/* ── STAGE 1: IDLE ────────────────────────────────────────── */}
        {stage === "idle" && inputMode === "record" && (
          <div className="py-4 flex flex-col items-center text-center space-y-4">
            {/* Record Sub-Mode Selector */}
            <div className="flex items-center justify-center p-1 bg-[#f1f3f7] rounded-full max-w-xs mx-auto border border-[#e9e9ee] shadow-2xs">
              <button
                type="button"
                onClick={() => setRecordType("dictate")}
                className={`flex-1 py-1 px-3 rounded-full text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  recordType === "dictate"
                    ? "bg-white text-slate-950 border border-black/80 shadow-2xs"
                    : "text-slate-600 hover:text-slate-950"
                }`}
              >
                <Sparkles size={12} className={recordType === "dictate" ? "text-slate-950" : "text-slate-500"} />
                <span>Live AI Dictation</span>
              </button>
              <button
                type="button"
                onClick={() => setRecordType("memo")}
                className={`flex-1 py-1 px-3 rounded-full text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  recordType === "memo"
                    ? "bg-white text-slate-950 border border-black/80 shadow-2xs"
                    : "text-slate-600 hover:text-slate-950"
                }`}
              >
                <Mic size={12} className={recordType === "memo" ? "text-slate-950" : "text-slate-500"} />
                <span>Voice Memo</span>
              </button>
            </div>

            {/* Permission Denied Alert Banner */}
            {((recordType === "dictate" && speech.error) || (recordType === "memo" && audio.error)) && (
              <div className="w-full text-left p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 space-y-3 animate-in fade-in duration-200">
                <div className="flex items-center gap-2 font-bold text-xs text-rose-700">
                  <AlertCircle size={16} className="text-rose-600 shrink-0" />
                  <span>Microphone Access Notice</span>
                </div>
                <p className="text-[11px] text-rose-700 leading-relaxed">
                  {recordType === "dictate" ? speech.error : audio.error}
                </p>
                <div className="text-[11px] text-rose-900 bg-white/90 p-3 rounded-xl border border-rose-100 space-y-1.5">
                  <p>
                    <strong>Troubleshooting Tip:</strong> Make sure no other app (like Phone, Recorder, or another browser tab) is holding the microphone. You can switch modes or type your note.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => handleStart()}
                    className="px-3.5 py-1.5 rounded-full bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
                  >
                    Retry
                  </button>
                  {recordType === "dictate" ? (
                    <button
                      type="button"
                      onClick={() => setRecordType("memo")}
                      className="px-3 py-1.5 rounded-full bg-white hover:bg-slate-50 text-slate-950 border border-[#e9e9ee] font-bold text-xs transition-colors cursor-pointer"
                    >
                      Switch to Voice Memo
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setRecordType("dictate")}
                      className="px-3 py-1.5 rounded-full bg-white hover:bg-slate-50 text-slate-950 border border-[#e9e9ee] font-bold text-xs transition-colors cursor-pointer"
                    >
                      Switch to Live Dictation
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setInputMode("type")}
                    className="px-3 py-1.5 rounded-full bg-white hover:bg-slate-50 text-slate-950 border border-[#e9e9ee] font-bold text-xs transition-colors cursor-pointer"
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
                className="w-24 h-24 rounded-full bg-black hover:bg-neutral-800 text-white flex items-center justify-center shadow-xl hover:scale-105 active:scale-95 transition-all cursor-pointer"
              >
                <Mic size={34} className="text-white" />
              </button>
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-950">
                {recordType === "dictate" ? "Tap to Start Speaking" : "Tap to Record Voice Memo"}
              </h3>
              <p className="text-xs text-slate-600 max-w-sm mt-1 mx-auto leading-relaxed">
                {recordType === "dictate"
                  ? "Speak freely. Your words stream live in real-time, then AI strips filler words, structures notes, and extracts to-dos."
                  : "Captures a high-fidelity playable voice audio file with interactive waveform player."}
              </p>
            </div>

            {/* Language Selector */}
            <div className="flex items-center gap-2 pt-1">
              <Globe size={14} className="text-slate-500" />
              <select
                value={selectedLang}
                onChange={(e) => setSelectedLang(e.target.value)}
                className="text-xs font-bold text-slate-950 bg-white border border-[#e9e9ee] hover:border-black/40 rounded-full px-3.5 py-1.5 focus:outline-none focus:border-black cursor-pointer shadow-2xs transition-all"
              >
                {LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* ── STAGE 1: IDLE (UPLOAD AUDIO MODE) ────────────────────── */}
        {stage === "idle" && inputMode === "upload" && (
          <div className="py-4 space-y-4">
            <div className="border-2 border-dashed border-[#e9e9ee] hover:border-black/40 bg-[#fbfbfc] hover:bg-white rounded-[26px] p-6 text-center transition-all cursor-pointer relative shadow-2xs">
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
              <div className="flex flex-col items-center space-y-2.5">
                <div
                  style={{ backgroundColor: "#e2e2fc" }}
                  className="w-12 h-12 rounded-2xl text-slate-950 flex items-center justify-center shadow-xs"
                >
                  <Upload size={22} />
                </div>
                {uploadedAudioFile ? (
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-slate-950">{uploadedAudioFile.name}</p>
                    <p className="text-[11px] text-slate-500">
                      {(uploadedAudioFile.size / (1024 * 1024)).toFixed(2)} MB • Ready to analyze
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-slate-950">
                      Drop voice recording or click to browse
                    </p>
                    <p className="text-[10px] text-slate-500">
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
                  className="w-full text-xs text-slate-900 bg-[#fbfbfc] border border-[#e9e9ee] rounded-2xl p-3 focus:bg-white focus:outline-none focus:border-black resize-none transition-all shadow-2xs"
                />
              </div>
            )}

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-3 border-t border-[#e9e9ee]/60">
              <div className="flex items-center gap-2">
                <Globe size={14} className="text-slate-500 shrink-0" />
                <select
                  value={selectedLang}
                  onChange={(e) => setSelectedLang(e.target.value)}
                  className="text-xs font-bold text-slate-950 bg-white border border-[#e9e9ee] hover:border-black/40 rounded-full px-3.5 py-1.5 focus:outline-none focus:border-black cursor-pointer shadow-2xs transition-all"
                >
                  {LANGUAGES.map((l) => (
                    <option key={l.code} value={l.code}>
                      {l.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  disabled={!uploadedAudioFile}
                  onClick={() => {
                    const hint =
                      uploadNoteHint.trim() ||
                      uploadedAudioFile?.name.replace(/\.[^/.]+$/, "") ||
                      "Audio Note";
                    setIsAiOrganized(false);
                    setPreviewTitle(hint);
                    setPreviewCleanedText(hint);
                    setPreviewCategory(initialCategory || "idea");
                    setPreviewTags(["audio-upload", "raw"]);
                    setPreviewActionItems([]);
                    setStage("preview");
                  }}
                  className="flex-1 sm:flex-initial px-4 py-2.5 rounded-full bg-white hover:bg-slate-50 text-slate-950 border border-black/80 text-xs font-bold shadow-2xs transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer whitespace-nowrap text-center"
                >
                  <span>Save Raw</span>
                </button>
                <button
                  type="button"
                  disabled={!uploadedAudioFile}
                  onClick={() => {
                    const hint =
                      uploadNoteHint.trim() ||
                      uploadedAudioFile?.name.replace(/\.[^/.]+$/, "") ||
                      "Voice Audio Note";
                    setIsAiOrganized(true);
                    runAiStructuring(hint, uploadedAudioFile);
                  }}
                  className="flex-1 sm:flex-initial px-5 py-2.5 rounded-full bg-black hover:bg-neutral-800 text-white text-xs font-bold shadow-xs hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap text-center"
                >
                  <Sparkles size={13} className="shrink-0" />
                  <span>Clean with AI</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── STAGE 1: IDLE (TYPE / PASTE MODE) ────────────────────── */}
        {stage === "idle" && inputMode === "type" && (
          <div className="py-4 space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-950 flex items-center gap-1.5">
                <span>Rambled Thoughts or Transcript</span>
                <span className="text-[10px] text-slate-500 font-normal">(AI cleans fillers & extracts tasks)</span>
              </label>
              <textarea
                value={manualText}
                onChange={(e) => setManualText(e.target.value)}
                placeholder="E.g.: umm so basically we need to record 3 reels for the spring sale by Friday and follow up with Sarah about giveaway prizes..."
                rows={5}
                className="w-full text-xs sm:text-sm text-slate-900 bg-[#fbfbfc] focus:bg-white border border-[#e9e9ee] focus:border-black rounded-[22px] p-4 focus:outline-none resize-none leading-relaxed transition-all shadow-2xs"
              />
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-3 border-t border-[#e9e9ee]/60">
              <div className="flex items-center gap-2">
                <Globe size={14} className="text-slate-500 shrink-0" />
                <select
                  value={selectedLang}
                  onChange={(e) => setSelectedLang(e.target.value)}
                  className="text-xs font-bold text-slate-950 bg-white border border-[#e9e9ee] hover:border-black/40 rounded-full px-3.5 py-1.5 focus:outline-none focus:border-black cursor-pointer shadow-2xs transition-all"
                >
                  {LANGUAGES.map((l) => (
                    <option key={l.code} value={l.code}>
                      {l.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  disabled={!manualText.trim()}
                  onClick={() => {
                    const text = manualText.trim();
                    setIsAiOrganized(false);
                    setPreviewTitle(text.slice(0, 35) + (text.length > 35 ? "..." : "") || "Typed Note");
                    setPreviewCleanedText(text);
                    setPreviewCategory(initialCategory || "idea");
                    setPreviewTags(["note", "raw"]);
                    setPreviewActionItems([]);
                    setStage("preview");
                  }}
                  className="flex-1 sm:flex-initial px-4 py-2.5 rounded-full bg-white hover:bg-slate-50 text-slate-950 border border-black/80 text-xs font-bold shadow-2xs transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer whitespace-nowrap text-center"
                >
                  <span>Save Raw</span>
                </button>
                <button
                  type="button"
                  disabled={!manualText.trim()}
                  onClick={() => {
                    setIsAiOrganized(true);
                    runAiStructuring(manualText, null);
                  }}
                  className="flex-1 sm:flex-initial px-5 py-2.5 rounded-full bg-black hover:bg-neutral-800 text-white text-xs font-bold shadow-xs hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap text-center"
                >
                  <Sparkles size={13} className="shrink-0" />
                  <span>Clean with AI</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── STAGE 2: RECORDING ───────────────────────────────────── */}
        {stage === "recording" && (
          <div className="py-6 space-y-5">

            {/* Pulsing Waveform Visualizer */}
            <div className="flex items-center justify-center gap-1.5 h-12">
              {[40, 70, 100, 60, 85, 45, 95, 65, 80, 50, 75, 90, 60].map((h, i) => (
                <div
                  key={i}
                  className="w-1.5 bg-black rounded-full animate-pulse"
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
              {(() => {
                const activeSeconds = recordingSeconds || audio.durationSeconds;
                return (
                  <>
                    <span className="text-2xl font-black text-slate-950 tabular-nums">
                      {Math.floor(activeSeconds / 60)}:
                      {String(activeSeconds % 60).padStart(2, "0")}
                    </span>
                    <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mt-0.5">
                      {recordType === "dictate" ? "● Listening & Transcribing" : "● Recording Voice Audio"}
                    </span>
                  </>
                );
              })()}
            </div>

            {/* Live Streaming Transcript Window (Dictation) OR Audio Memo In-Progress Box */}
            {recordType === "dictate" ? (
              <div className="rounded-[22px] border border-[#e9e9ee] bg-[#fbfbfc] p-4 min-h-[110px] max-h-[160px] overflow-y-auto shadow-2xs">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1 flex items-center justify-between">
                  <span>Real-Time Transcript</span>
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-950 bg-white border border-black/80 px-2 py-0.5 rounded-full shadow-2xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                    Live
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-900 leading-relaxed font-normal">
                  {speech.transcript && (
                    <span className="text-slate-950 font-medium">{speech.transcript} </span>
                  )}
                  {speech.interimTranscript ? (
                    <span className="text-slate-600 italic">
                      {speech.interimTranscript}
                    </span>
                  ) : !fullSpokenLive ? (
                    <span className="text-slate-400 italic">
                      Start speaking... your words will stream live here.
                    </span>
                  ) : null}
                </p>
                {speech.error && !speech.transcript && (
                  <div className="mt-2 text-[11px] text-amber-800 bg-amber-50 border border-amber-200/80 p-2.5 rounded-xl flex items-center gap-1.5">
                    <AlertCircle size={13} className="shrink-0 text-amber-700" />
                    <span>{speech.error}</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-[22px] border border-[#e9e9ee] bg-[#fbfbfc] p-5 min-h-[110px] flex flex-col items-center justify-center text-center shadow-2xs">
                <div
                  style={{ backgroundColor: "#feece4" }}
                  className="w-10 h-10 rounded-2xl text-slate-950 flex items-center justify-center mb-2 shadow-2xs"
                >
                  <Mic size={18} />
                </div>
                <p className="text-xs font-bold text-slate-950">Capturing High-Fidelity Audio Memo</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Microphone is recording crystal-clear voice audio. Tap Stop when finished.</p>
              </div>
            )}

            {/* Stop Controls */}
            <div className="flex flex-col-reverse sm:flex-row items-center justify-center gap-2.5 sm:gap-3 pt-2">
              <button
                type="button"
                onClick={() => handleStop({ useAi: false })}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-white hover:bg-slate-50 text-slate-950 border border-black/80 font-bold text-xs shadow-2xs transition-transform active:scale-95 cursor-pointer"
              >
                <Square size={12} className="fill-slate-950" />
                <span>Stop (Keep Raw)</span>
              </button>

              <button
                type="button"
                onClick={() => handleStop({ useAi: true })}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-full bg-black hover:bg-neutral-800 text-white font-bold text-xs shadow-xs transition-transform active:scale-95 cursor-pointer"
              >
                {recordType === "dictate" ? (
                  <>
                    <Sparkles size={13} className="text-white" />
                    <span>Stop & Clean with AI</span>
                  </>
                ) : (
                  <>
                    <Check size={13} className="text-white" />
                    <span>Stop & Review Memo</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* ── STAGE 3: STRUCTURING SHIMMER ─────────────────────────── */}
        {stage === "structuring" && (
          <div className="py-12 flex flex-col items-center text-center space-y-4">
            <div
              style={{ backgroundColor: "#e2e2fc" }}
              className="w-14 h-14 rounded-2xl text-slate-950 flex items-center justify-center shadow-xs animate-spin"
            >
              <Sparkles size={26} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-950">
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
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={previewTitle}
                  onChange={(e) => setPreviewTitle(e.target.value)}
                  className="w-full text-xs font-bold text-slate-950 bg-[#fbfbfc] border border-[#e9e9ee] rounded-xl px-3.5 py-2.5 focus:bg-white focus:outline-none focus:border-black shadow-2xs transition-all"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Category
                </label>
                <select
                  value={previewCategory}
                  onChange={(e) => setPreviewCategory(e.target.value as any)}
                  className="w-full text-xs font-bold text-slate-950 bg-[#fbfbfc] border border-[#e9e9ee] rounded-xl px-3 py-2.5 focus:bg-white focus:outline-none focus:border-black cursor-pointer shadow-2xs transition-all"
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

            {/* Audio Playback if recorded or uploaded */}
            {(recordedAudioBlob || audio.audioUrl || uploadedAudioFile) && (
              <div className="rounded-2xl bg-[#fbfbfc] border border-[#e9e9ee] p-3 shadow-2xs space-y-1.5">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <Mic size={11} className="text-slate-950" />
                  <span>Audio Playback</span>
                </div>
                <audio
                  controls
                  src={
                    audio.audioUrl ||
                    (recordedAudioBlob ? URL.createObjectURL(recordedAudioBlob) : "") ||
                    (uploadedAudioFile ? URL.createObjectURL(uploadedAudioFile) : "")
                  }
                  className="w-full h-9 rounded-xl"
                />
              </div>
            )}

            {/* Note Content */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  {isAiOrganized ? "Cleaned Note Text" : "Note Content (Raw Spoken Text)"}
                </label>
                <div>
                  {isAiOrganized ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-950 bg-white border border-black/80 px-2 py-0.5 rounded-full shadow-2xs">
                      <Check size={11} className="text-emerald-600" /> Fillers Stripped with AI
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleTriggerAiFromPreview}
                      className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-950 bg-white hover:bg-slate-50 border border-black/80 px-2.5 py-0.5 rounded-full shadow-2xs transition-all cursor-pointer"
                    >
                      <Sparkles size={11} className="text-slate-950" />
                      <span>Clean with AI</span>
                    </button>
                  )}
                </div>
              </div>
              <textarea
                rows={4}
                value={previewCleanedText}
                onChange={(e) => setPreviewCleanedText(e.target.value)}
                className="w-full text-xs sm:text-sm text-slate-900 bg-[#fbfbfc] border border-[#e9e9ee] rounded-[22px] p-3.5 leading-relaxed focus:bg-white focus:outline-none focus:border-black shadow-2xs transition-all"
              />
            </div>

            {/* Action Items List */}
            {previewActionItems.length > 0 && (
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5 flex items-center gap-1">
                  <ListTodo size={12} className="text-slate-950" />
                  <span>Extracted Action Items</span>
                </label>
                <div className="space-y-1.5">
                  {previewActionItems.map((item, idx) => (
                    <div
                      key={item.id || idx}
                      className="flex items-center gap-2.5 p-2.5 rounded-xl bg-[#fbfbfc] border border-[#e9e9ee] text-xs text-slate-950 shadow-2xs"
                    >
                      <div
                        style={{ backgroundColor: "#fff9db" }}
                        className="w-5 h-5 rounded-md flex items-center justify-center shrink-0 shadow-2xs"
                      >
                        <Check size={12} className="text-slate-950" />
                      </div>
                      <input
                        type="text"
                        value={item.text}
                        onChange={(e) => {
                          const updated = [...previewActionItems];
                          updated[idx].text = e.target.value;
                          setPreviewActionItems(updated);
                        }}
                        className="w-full bg-transparent border-none focus:outline-none text-xs font-semibold text-slate-950"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Modal Bottom Actions */}
            <div className="pt-3 border-t border-[#e9e9ee] flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleRecordAgain}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-950 transition-colors cursor-pointer"
              >
                <RotateCcw size={13} />
                <span>
                  {inputMode === "upload"
                    ? "Upload Another"
                    : inputMode === "type"
                    ? "Write Another"
                    : "Record Again"}
                </span>
              </button>

              <button
                type="button"
                disabled={saving}
                onClick={handleSave}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-black hover:bg-neutral-800 text-white font-bold text-xs shadow-xs hover:scale-[1.01] active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
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

  return createPortal(modalContent, document.body);
}

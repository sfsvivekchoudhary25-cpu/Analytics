"use client";

import { useState, useEffect, useRef, useCallback } from "react";

export interface StartListeningOptions {
  simulated?: boolean;
  sampleText?: string;
}

interface SpeechRecognitionHook {
  isSupported: boolean;
  isListening: boolean;
  isSimulated: boolean;
  transcript: string;
  interimTranscript: string;
  error: string | null;
  startListening: (lang?: string, options?: StartListeningOptions) => void;
  stopListening: () => void;
  resetTranscript: () => void;
}

const DEFAULT_SIMULATED_PHRASES = [
  "Reviewing Instagram growth metrics and campaign schedule for next week.",
  "Need to finalize three high-converting carousel posts and test new hooks.",
  "Assign team member to check incoming DMs and export leads by Friday."
];

function isIOSorSafari(): boolean {
  if (typeof window === "undefined" || typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  const isApple = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const isSafari = /WebKit/.test(ua) && !/Chrome|CriOS/.test(ua);
  return isApple || isSafari;
}

export function useSpeechRecognition(): SpeechRecognitionHook {
  const [isListening, setIsListening] = useState(false);
  const [isSimulated, setIsSimulated] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(false);

  const recognitionRef = useRef<any>(null);
  const shouldListenRef = useRef(false);
  const simulationTimerRef = useRef<NodeJS.Timeout | null>(null);
  const currentLangRef = useRef("en-US");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition;
      setIsSupported(Boolean(SpeechRecognition));
    }
  }, []);

  const initRecognition = useCallback((lang: string) => {
    if (typeof window === "undefined") return null;

    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) return null;

    // Clean up previous instance
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {}
      recognitionRef.current = null;
    }

    const recognition = new SpeechRecognition();
    const isApple = isIOSorSafari();

    // iOS Safari breaks and freezes with continuous=true; Android/Chrome excels with continuous=true
    recognition.continuous = !isApple;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    recognition.lang = lang;

    recognition.onresult = (event: any) => {
      let currentFinal = "";
      let currentInterim = "";

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const item = event.results[i];
        if (!item || !item[0]) continue;
        const text = item[0].transcript || "";
        if (item.isFinal) {
          currentFinal += text + " ";
        } else {
          currentInterim += text;
        }
      }

      if (currentFinal) {
        setTranscript((prev) => (prev ? `${prev} ${currentFinal}`.trim() : currentFinal.trim()));
        setInterimTranscript("");
      } else if (currentInterim) {
        setInterimTranscript(currentInterim);
      }
    };

    recognition.onerror = (event: any) => {
      console.warn("[SpeechRecognition] Event error:", event.error);
      if (event.error === "aborted") {
        // Benign: programmatic abort when user stops, resets, or closes modal
        return;
      }
      if (event.error === "not-allowed") {
        setError("Microphone permission was denied.");
        shouldListenRef.current = false;
        setIsListening(false);
      } else if (event.error === "no-speech") {
        // Benign silence on mobile; continue listening if active
      } else if (event.error === "network") {
        console.warn("[SpeechRecognition] Network glitch, will retry if active.");
      } else {
        setError(`Speech recognition: ${event.error}`);
      }
    };

    recognition.onend = () => {
      if (shouldListenRef.current) {
        // On iOS Safari, continuous is false, so it gracefully cycles after each pause.
        // Restart immediately to keep dictating without user intervention.
        setTimeout(() => {
          if (shouldListenRef.current && recognitionRef.current) {
            try {
              recognitionRef.current.start();
            } catch (err: any) {
              if (err.name !== "InvalidStateError") {
                // Re-instantiate if instance became invalid
                const fresh = initRecognition(currentLangRef.current);
                if (fresh && shouldListenRef.current) {
                  try { fresh.start(); } catch {}
                }
              }
            }
          }
        }, 150);
      } else {
        setIsListening(false);
        setInterimTranscript("");
      }
    };

    recognitionRef.current = recognition;
    return recognition;
  }, []);

  const startListening = useCallback(
    (lang = "en-US", options?: StartListeningOptions) => {
      setError(null);
      currentLangRef.current = lang;

      if (simulationTimerRef.current) {
        clearInterval(simulationTimerRef.current);
        simulationTimerRef.current = null;
      }

      if (options?.simulated) {
        shouldListenRef.current = false;
        setIsSimulated(true);
        setIsListening(true);
        const phrases = options.sampleText ? [options.sampleText] : DEFAULT_SIMULATED_PHRASES;
        let index = 0;

        simulationTimerRef.current = setInterval(() => {
          if (index < phrases.length) {
            const phrase = phrases[index];
            setTranscript((prev) => (prev ? `${prev} ${phrase}` : phrase));
            index++;
          }
        }, 1200);
        return;
      }

      setIsSimulated(false);
      shouldListenRef.current = true;

      // Always initialize a fresh recognition instance directly within the synchronous gesture context
      const recognition = initRecognition(lang);
      if (!recognition) {
        setError("Web Speech Recognition is not supported in this browser.");
        shouldListenRef.current = false;
        return;
      }

      try {
        recognition.start();
        setIsListening(true);
      } catch (err: any) {
        console.warn("[SpeechRecognition] start error:", err);
        if (err.name !== "InvalidStateError") {
          setError(err.message || "Failed to start speech recognition.");
        }
      }
    },
    [initRecognition]
  );

  const stopListening = useCallback(() => {
    shouldListenRef.current = false;

    if (simulationTimerRef.current) {
      clearInterval(simulationTimerRef.current);
      simulationTimerRef.current = null;
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {}
      recognitionRef.current = null;
    }
    setIsListening(false);
    setIsSimulated(false);
    setInterimTranscript("");
  }, []);

  const resetTranscript = useCallback(() => {
    shouldListenRef.current = false;

    if (simulationTimerRef.current) {
      clearInterval(simulationTimerRef.current);
      simulationTimerRef.current = null;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {}
      recognitionRef.current = null;
    }
    setTranscript("");
    setInterimTranscript("");
    setIsListening(false);
    setIsSimulated(false);
    setError(null);
  }, []);

  useEffect(() => {
    return () => {
      shouldListenRef.current = false;
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
      }
      if (simulationTimerRef.current) {
        clearInterval(simulationTimerRef.current);
      }
    };
  }, []);

  return {
    isSupported,
    isListening,
    isSimulated,
    transcript,
    interimTranscript,
    error,
    startListening,
    stopListening,
    resetTranscript,
  };
}

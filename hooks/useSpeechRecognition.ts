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

export function useSpeechRecognition(): SpeechRecognitionHook {
  const [isListening, setIsListening] = useState(false);
  const [isSimulated, setIsSimulated] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(false);

  const recognitionRef = useRef<any>(null);
  const simulationTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition;

      if (SpeechRecognition) {
        setIsSupported(true);
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.maxAlternatives = 1;

        recognition.onresult = (event: any) => {
          let currentFinal = "";
          let currentInterim = "";

          for (let i = event.resultIndex; i < event.results.length; ++i) {
            const item = event.results[i];
            const text = item[0].transcript;
            if (item.isFinal) {
              currentFinal += text + " ";
            } else {
              currentInterim += text;
            }
          }

          if (currentFinal) {
            setTranscript((prev) => (prev ? `${prev} ${currentFinal}`.trim() : currentFinal.trim()));
            setInterimTranscript("");
          } else {
            setInterimTranscript(currentInterim);
          }
        };

        recognition.onerror = (event: any) => {
          console.warn("[SpeechRecognition] Error:", event.error);
          if (event.error === "not-allowed") {
            setError("Microphone permission was denied.");
          } else if (event.error === "no-speech") {
            // Ignore benign silence timeout
          } else {
            setError(`Speech recognition: ${event.error}`);
          }
          setIsListening(false);
        };

        recognition.onend = () => {
          setIsListening(false);
          setInterimTranscript("");
        };

        recognitionRef.current = recognition;
      }
    }

    return () => {
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

  const startListening = useCallback(
    (lang = "en-US", options?: StartListeningOptions) => {
      setError(null);

      if (simulationTimerRef.current) {
        clearInterval(simulationTimerRef.current);
        simulationTimerRef.current = null;
      }

      if (options?.simulated) {
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
      if (!recognitionRef.current) {
        setError("Web Speech Recognition is not supported in this browser.");
        return;
      }

      try {
        recognitionRef.current.lang = lang;
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err: any) {
        if (err.name !== "InvalidStateError") {
          setError(err.message || "Failed to start speech recognition.");
        }
      }
    },
    []
  );

  const stopListening = useCallback(() => {
    if (simulationTimerRef.current) {
      clearInterval(simulationTimerRef.current);
      simulationTimerRef.current = null;
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
    }
    setIsListening(false);
    setIsSimulated(false);
    setInterimTranscript("");
  }, []);

  const resetTranscript = useCallback(() => {
    if (simulationTimerRef.current) {
      clearInterval(simulationTimerRef.current);
      simulationTimerRef.current = null;
    }
    setTranscript("");
    setInterimTranscript("");
    setIsSimulated(false);
    setError(null);
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

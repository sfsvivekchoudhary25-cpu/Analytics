"use client";

import { useState, useRef, useCallback, useEffect } from "react";

export interface StartRecordingOptions {
  simulated?: boolean;
}

interface AudioRecorderHook {
  isRecording: boolean;
  isSimulated: boolean;
  isPermissionDenied: boolean;
  durationSeconds: number;
  audioBlob: Blob | null;
  audioUrl: string | null;
  error: string | null;
  startRecording: (options?: StartRecordingOptions) => Promise<boolean>;
  stopRecording: () => Promise<Blob | null>;
  resetRecording: () => void;
}

export function useAudioRecorder(): AudioRecorderHook {
  const [isRecording, setIsRecording] = useState(false);
  const [isSimulated, setIsSimulated] = useState(false);
  const [isPermissionDenied, setIsPermissionDenied] = useState(false);
  const [durationSeconds, setDurationSeconds] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  const startRecording = useCallback(async (options?: StartRecordingOptions): Promise<boolean> => {
    setError(null);
    setAudioBlob(null);
    setAudioUrl(null);
    setDurationSeconds(0);
    audioChunksRef.current = [];

    let stream: MediaStream | null = null;
    const wantSimulated = options?.simulated === true;

    if (wantSimulated) {
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioCtx) {
          setError("Web Audio API is not supported in this browser.");
          return false;
        }
        const ctx = new AudioCtx();
        audioContextRef.current = ctx;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const dest = ctx.createMediaStreamDestination();

        osc.type = "sine";
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        gain.gain.setValueAtTime(0.02, ctx.currentTime);
        osc.connect(gain);
        gain.connect(dest);
        osc.start();

        stream = dest.stream;
        setIsSimulated(true);
        setIsPermissionDenied(false);
      } catch (e: any) {
        console.warn("[MediaRecorder] Simulated audio generation failed:", e);
        setError("Could not initialize test audio generator.");
        return false;
      }
    } else {
      setIsSimulated(false);
      if (typeof window === "undefined" || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setError("Audio recording is not supported in this browser.");
        setIsRecording(false);
        return false;
      }

      try {
        // Primary attempt: clean audio: true
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        setIsPermissionDenied(false);
      } catch (err: any) {
        if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
          console.warn("[MediaRecorder] Access denied by browser or OS:", err);
          setError("Microphone access is blocked by your browser or Windows.");
          setIsPermissionDenied(true);
          setIsRecording(false);
          return false;
        }

        // Secondary fallback for hardware driver constraints
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
            },
          });
          setIsPermissionDenied(false);
        } catch (err2: any) {
          console.warn("[MediaRecorder] Hardware mic acquisition failed:", err2);
          setError("Microphone access failed: " + (err2.message || "Unknown error"));
          setIsRecording(false);
          return false;
        }
      }
    }

    if (!stream) {
      setError("No audio stream available.");
      return false;
    }

    streamRef.current = stream;

    const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
      ? "audio/webm;codecs=opus"
      : MediaRecorder.isTypeSupported("audio/mp4")
      ? "audio/mp4"
      : "audio/webm";

    try {
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start(250);
      setIsRecording(true);

      timerRef.current = setInterval(() => {
        setDurationSeconds((d) => d + 1);
      }, 1000);

      return true;
    } catch (recorderErr: any) {
      console.error("[MediaRecorder] Initialization error:", recorderErr);
      setError("Failed to initialize MediaRecorder: " + recorderErr.message);
      setIsRecording(false);
      return false;
    }
  }, []);

  const stopRecording = useCallback((): Promise<Blob | null> => {
    return new Promise((resolve) => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      const cleanupTracksAndContext = () => {
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => {
            try {
              track.stop();
            } catch {}
          });
          streamRef.current = null;
        }
        if (audioContextRef.current) {
          try {
            audioContextRef.current.close();
          } catch {}
          audioContextRef.current = null;
        }
      };

      const recorder = mediaRecorderRef.current;
      if (!recorder || recorder.state === "inactive") {
        setIsRecording(false);
        cleanupTracksAndContext();
        resolve(null);
        return;
      }

      recorder.onstop = () => {
        const mimeType = recorder.mimeType || "audio/webm";
        const blob = new Blob(audioChunksRef.current, { type: mimeType });
        setAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        setIsRecording(false);

        cleanupTracksAndContext();
        resolve(blob);
      };

      try {
        recorder.stop();
      } catch {
        setIsRecording(false);
        cleanupTracksAndContext();
        resolve(null);
      }
    });
  }, []);

  const resetRecording = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      try {
        mediaRecorderRef.current.stop();
      } catch {}
      mediaRecorderRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {}
      });
      streamRef.current = null;
    }

    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    if (audioContextRef.current) {
      try {
        audioContextRef.current.close();
      } catch {}
      audioContextRef.current = null;
    }
    setAudioBlob(null);
    setAudioUrl(null);
    setDurationSeconds(0);
    setIsRecording(false);
    setIsSimulated(false);
    setError(null);
    audioChunksRef.current = [];
  }, [audioUrl]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => {
          try {
            t.stop();
          } catch {}
        });
        streamRef.current = null;
      }
      if (audioContextRef.current) {
        try {
          audioContextRef.current.close();
        } catch {}
        audioContextRef.current = null;
      }
    };
  }, []);

  return {
    isRecording,
    isSimulated,
    isPermissionDenied,
    durationSeconds,
    audioBlob,
    audioUrl,
    error,
    startRecording,
    stopRecording,
    resetRecording,
  };
}

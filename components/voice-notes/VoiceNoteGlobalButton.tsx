"use client";

import React, { useState, useEffect } from "react";
import VoicePill from "./VoicePill";
import { VoiceNoteRecorderModal } from "./VoiceNoteRecorderModal";
import { VoiceNoteItem } from "./VoiceNoteCard";

export function VoiceNoteGlobalButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [hasModalOpen, setHasModalOpen] = useState(false);

  useEffect(() => {
    const updateModalState = () => {
      setHasModalOpen(Boolean(document.querySelector('[role="dialog"], .fixed.inset-0.z-50')));
    };
    updateModalState();
    const observer = new MutationObserver(updateModalState);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  return (
    <>
      {/* Floating Action Button with interactive VoicePill */}
      {!isOpen && !hasModalOpen && (
        <div className="fixed bottom-6 right-6 z-40 flex items-center gap-2 p-1.5 pl-3.5 rounded-full bg-[#18181b] hover:bg-[#27272a] text-white border border-white/20 shadow-2xl transition-all">
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="hidden sm:inline font-bold text-xs tracking-tight text-zinc-200 hover:text-white cursor-pointer"
          >
            Quick Voice Note
          </button>
          <VoicePill
            accentColor="#f5f5f5"
            iconColor="#a1a1aa"
            background="#27272a"
            size={28}
            shape="pill"
            reach={8}
            showTime
            waveform
            slideToCancel
            cancelDistance={64}
            attack={40}
            release={240}
            sensitivity={1}
            floor={0.1}
            openDuration={200}
            pressScale={0.95}
            mode="auto"
            holdAfter={300}
            reactive="simulated"
            onStart={({ source }) => console.log("VoicePill global start:", source)}
            onStop={({ reason, duration }) => {
              console.log(`VoicePill global stop: ${reason}, duration: ${duration}ms`);
              if (reason !== "cancel" && reason !== "unmount") {
                setIsOpen(true);
              }
            }}
          />
        </div>
      )}

      <VoiceNoteRecorderModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onNoteCreated={(note: VoiceNoteItem) => {
          console.log("Quick Voice Note created:", note.title);
        }}
      />
    </>
  );
}

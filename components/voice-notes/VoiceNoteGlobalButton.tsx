"use client";

import React, { useState, useEffect } from "react";
import { Mic } from "lucide-react";
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
      {/* Floating Action Button at lower bottom */}
      {!isOpen && !hasModalOpen && (
        <div className="fixed bottom-6 right-6 z-40">
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="group relative flex items-center gap-2 px-4 py-3 rounded-full bg-black hover:bg-neutral-800 text-white font-bold text-xs shadow-2xl transition-all hover:scale-105 active:scale-95 cursor-pointer border border-white/20"
          >
            <div className="relative">
              <Mic size={18} className="animate-pulse" />
              <span className="absolute -top-1 -right-1 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400" />
              </span>
            </div>
            <span className="hidden sm:inline font-bold">Quick Voice Note</span>
          </button>
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
